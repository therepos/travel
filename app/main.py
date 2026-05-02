import os, json, csv, io, re, httpx, sqlite3, hashlib, secrets
from pathlib import Path
from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Request, Response, Cookie, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.responses import Response as FastAPIResponse
from pydantic import BaseModel
from typing import Optional

DB_PATH = os.environ.get("DB_PATH", "/data/travel.db")
GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/ui/dist")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def _hash_pw(password, salt=None):
    if not salt: salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return f"{salt}:{h}"

def _check_pw(password, stored):
    salt = stored.split(":")[0]
    return _hash_pw(password, salt) == stored

def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL, display_name TEXT DEFAULT '',
        password TEXT NOT NULL, color TEXT DEFAULT '#1A73E8',
        created TEXT NOT NULL)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY, user_id INTEGER NOT NULL,
        created TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id))""")
    conn.execute("""CREATE TABLE IF NOT EXISTS places (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 0,
        name TEXT NOT NULL, address TEXT DEFAULT '', country TEXT DEFAULT '',
        city TEXT DEFAULT '', district TEXT DEFAULT '', region TEXT DEFAULT '',
        lat REAL NOT NULL, lng REAL NOT NULL, photo TEXT DEFAULT '',
        tags TEXT DEFAULT '[]', auto_tags TEXT DEFAULT '[]', notes TEXT DEFAULT '',
        google_place_id TEXT DEFAULT '', google_maps_url TEXT DEFAULT '',
        phone TEXT DEFAULT '', website TEXT DEFAULT '',
        rating REAL DEFAULT 0, rating_count INTEGER DEFAULT 0,
        price_level TEXT DEFAULT '', hours TEXT DEFAULT '',
        editorial_summary TEXT DEFAULT '',
        dining TEXT DEFAULT '[]', serves TEXT DEFAULT '[]',
        amenities TEXT DEFAULT '[]', place_type TEXT DEFAULT '',
        payment TEXT DEFAULT '[]', reviews TEXT DEFAULT '[]',
        intent TEXT DEFAULT '', cuisine TEXT DEFAULT '', sub_type TEXT DEFAULT '',
        saved TEXT NOT NULL)""")
    conn.execute("""CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER DEFAULT 0,
        name TEXT NOT NULL, stops TEXT DEFAULT '[]', route_url TEXT DEFAULT '',
        created TEXT NOT NULL, updated TEXT NOT NULL)""")
    conn.commit()
    # Migrate: add user_id if missing
    for table in ["places","routes"]:
        cols = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
        if "user_id" not in cols:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER DEFAULT 0")
    # Migrate: add email/notify to users if missing
    ucols = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "email" not in ucols:
        conn.execute("ALTER TABLE users ADD COLUMN email TEXT DEFAULT ''")
    if "notify_digest" not in ucols:
        conn.execute("ALTER TABLE users ADD COLUMN notify_digest INTEGER DEFAULT 0")
    cursor = conn.execute("PRAGMA table_info(places)")
    existing = {row[1] for row in cursor.fetchall()}
    for col, typedef in [("city","TEXT DEFAULT ''"),("district","TEXT DEFAULT ''"),
        ("region","TEXT DEFAULT ''"),("google_place_id","TEXT DEFAULT ''"),
        ("google_maps_url","TEXT DEFAULT ''"),("phone","TEXT DEFAULT ''"),
        ("website","TEXT DEFAULT ''"),("rating","REAL DEFAULT 0"),
        ("rating_count","INTEGER DEFAULT 0"),("price_level","TEXT DEFAULT ''"),
        ("hours","TEXT DEFAULT ''"),("editorial_summary","TEXT DEFAULT ''"),
        ("dining","TEXT DEFAULT '[]'"),("serves","TEXT DEFAULT '[]'"),
        ("amenities","TEXT DEFAULT '[]'"),("auto_tags","TEXT DEFAULT '[]'"),
        ("place_type","TEXT DEFAULT ''"),("payment","TEXT DEFAULT '[]'"),
        ("reviews","TEXT DEFAULT '[]'"),("intent","TEXT DEFAULT ''"),
        ("cuisine","TEXT DEFAULT ''"),("sub_type","TEXT DEFAULT ''")]:
        if col not in existing:
            conn.execute(f"ALTER TABLE places ADD COLUMN {col} {typedef}")
    conn.commit(); conn.close()

# ── Intent classification ─────────────────────────────────
# Generic Google Places types that should never drive primary categorisation
GENERIC_TYPES = {
    "establishment","point_of_interest","premise","subpremise",
    "store","food","place_of_worship","local_government_office","general_contractor",
    "finance","health","tourist_attraction",  # tourist_attraction is overused — prefer specific type
}

INTENT_MAP = {
    # Eat
    "restaurant":"eat","cafe":"eat","bakery":"eat",
    "meal_takeaway":"eat","meal_delivery":"eat",
    "tea_house":"eat","coffee_shop":"eat","ice_cream_shop":"eat",
    "dessert_shop":"eat","dessert_restaurant":"eat","candy_store":"eat",
    "fast_food_restaurant":"eat","buffet_restaurant":"eat",
    "breakfast_restaurant":"eat","brunch_restaurant":"eat",
    "deli":"eat","diner":"eat","food_court":"eat","sandwich_shop":"eat",
    "donut_shop":"eat","juice_shop":"eat","fine_dining_restaurant":"eat",
    "acai_shop":"eat","bagel_shop":"eat","chocolate_shop":"eat",
    "afghani_restaurant":"eat","food":"eat",
    # Drink
    "bar":"drink","night_club":"drink","liquor_store":"drink",
    "pub":"drink","wine_bar":"drink","brewery":"drink",
    "winery":"drink","distillery":"drink","bar_and_grill":"drink",
    # See
    "museum":"see","art_gallery":"see","church":"see","mosque":"see",
    "hindu_temple":"see","synagogue":"see","historical_landmark":"see",
    "monument":"see","cultural_landmark":"see","sculpture":"see",
    "art_studio":"see","planetarium":"see","observation_deck":"see",
    # Do
    "park":"do","natural_feature":"do","campground":"do",
    "amusement_park":"do","zoo":"do","aquarium":"do","beach":"do",
    "stadium":"do","gym":"do","bowling_alley":"do","movie_theater":"do","casino":"do",
    "hiking_area":"do","national_park":"do","state_park":"do","garden":"do",
    "marina":"do","ski_resort":"do","water_park":"do","wildlife_park":"do",
    "fitness_center":"do","sports_club":"do","sports_complex":"do","sports_activity_location":"do",
    "performing_arts_theater":"see","concert_hall":"do","opera_house":"see",
    "playground":"do","picnic_ground":"do","barbecue_area":"do",
    # Shop
    "shopping_mall":"shop","clothing_store":"shop",
    "book_store":"shop","jewelry_store":"shop","shoe_store":"shop",
    "electronics_store":"shop","furniture_store":"shop","department_store":"shop",
    "convenience_store":"shop","supermarket":"shop","grocery_store":"shop",
    "market":"shop","gift_shop":"shop","sporting_goods_store":"shop",
    "bicycle_store":"shop","hardware_store":"shop","home_goods_store":"shop",
    "florist":"shop","pet_store":"shop","toy_store":"shop",
    "discount_store":"shop","wholesaler":"shop","stationery_store":"shop",
    "store":"shop",  # generic fallback — only matches if no specific shop type
    # Stay
    "lodging":"stay","rv_park":"stay","hotel":"stay","motel":"stay",
    "resort_hotel":"stay","hostel":"stay","bed_and_breakfast":"stay",
    "guest_house":"stay","extended_stay_hotel":"stay","japanese_inn":"stay",
    "cottage":"stay","cabin":"stay","camping_cabin":"stay","farmstay":"stay",
    "private_guest_room":"stay","budget_japanese_inn":"stay",
    # Services
    "spa":"services","beauty_salon":"services","hair_care":"services","hair_salon":"services",
    "laundry":"services","car_repair":"services","car_wash":"services",
    "dentist":"services","doctor":"services","hospital":"services",
    "pharmacy":"services","veterinary_care":"services","drugstore":"services",
    "real_estate_agency":"services","travel_agency":"services",
    "post_office":"services","bank":"services","atm":"services",
    "barber_shop":"services","massage":"services","nail_salon":"services",
    "tailor":"services","accounting":"services","lawyer":"services",
}
CUISINE_MAP = {
    "japanese_restaurant":"Japanese","sushi_restaurant":"Japanese","ramen_restaurant":"Japanese",
    "chinese_restaurant":"Chinese","korean_restaurant":"Korean",
    "thai_restaurant":"Thai","vietnamese_restaurant":"Vietnamese",
    "indian_restaurant":"Indian","mexican_restaurant":"Mexican",
    "italian_restaurant":"Italian","french_restaurant":"French",
    "greek_restaurant":"Greek","spanish_restaurant":"Spanish",
    "turkish_restaurant":"Turkish","lebanese_restaurant":"Lebanese",
    "brazilian_restaurant":"Brazilian","peruvian_restaurant":"Peruvian",
    "american_restaurant":"American","german_restaurant":"German",
    "indonesian_restaurant":"Indonesian","malaysian_restaurant":"Malaysian",
    "filipino_restaurant":"Filipino","mediterranean_restaurant":"Mediterranean",
    "middle_eastern_restaurant":"Middle Eastern",
    "african_restaurant":"African","caribbean_restaurant":"Caribbean",
    "british_restaurant":"British","taiwanese_restaurant":"Taiwanese",
    "persian_restaurant":"Persian","ethiopian_restaurant":"Ethiopian",
    "moroccan_restaurant":"Moroccan","nepalese_restaurant":"Nepalese",
    "sri_lankan_restaurant":"Sri Lankan","argentinian_restaurant":"Argentine",
    "colombian_restaurant":"Colombian","cuban_restaurant":"Cuban",
    "seafood_restaurant":"Seafood","pizza_restaurant":"Italian",
    "hamburger_restaurant":"American","steak_house":"Steakhouse",
    "vegan_restaurant":"Vegan","vegetarian_restaurant":"Vegetarian",
    "bbq_restaurant":"BBQ",
}
SUB_TYPE_MAP = {
    "cafe":"Cafe","bakery":"Bakery","bar":"Bar","night_club":"Club",
    "tea_house":"Tea house","coffee_shop":"Coffee shop","ice_cream_shop":"Ice cream",
    "dessert_shop":"Dessert","dessert_restaurant":"Dessert","candy_store":"Candy",
    "fast_food_restaurant":"Fast food","buffet_restaurant":"Buffet",
    "breakfast_restaurant":"Breakfast","brunch_restaurant":"Brunch",
    "deli":"Deli","diner":"Diner","food_court":"Food court","sandwich_shop":"Sandwich",
    "donut_shop":"Donuts","juice_shop":"Juice bar","fine_dining_restaurant":"Fine dining",
    "pub":"Pub","wine_bar":"Wine bar","brewery":"Brewery","winery":"Winery","distillery":"Distillery",
    "museum":"Museum","art_gallery":"Gallery","church":"Church","mosque":"Mosque",
    "hindu_temple":"Temple","synagogue":"Synagogue","tourist_attraction":"Attraction",
    "historical_landmark":"Landmark","monument":"Monument","cultural_landmark":"Landmark",
    "observation_deck":"Viewpoint","performing_arts_theater":"Theater","concert_hall":"Concert hall",
    "park":"Park","natural_feature":"Nature","campground":"Camping","national_park":"National park",
    "state_park":"State park","garden":"Garden","hiking_area":"Hiking",
    "beach":"Beach","zoo":"Zoo","aquarium":"Aquarium",
    "amusement_park":"Theme park","movie_theater":"Cinema","water_park":"Water park",
    "bowling_alley":"Bowling","stadium":"Stadium","gym":"Gym","fitness_center":"Gym",
    "sports_complex":"Sports","sports_activity_location":"Sports","marina":"Marina",
    "ski_resort":"Ski resort","casino":"Casino",
    "shopping_mall":"Mall","clothing_store":"Fashion","book_store":"Books",
    "department_store":"Department store","supermarket":"Supermarket","grocery_store":"Grocery",
    "convenience_store":"Convenience","market":"Market","gift_shop":"Gift shop",
    "jewelry_store":"Jewellery","shoe_store":"Shoes","electronics_store":"Electronics",
    "furniture_store":"Furniture","sporting_goods_store":"Sports gear","bicycle_store":"Bikes",
    "hardware_store":"Hardware","home_goods_store":"Home goods","pet_store":"Pet shop",
    "toy_store":"Toys","stationery_store":"Stationery","florist":"Florist",
    "lodging":"Hotel","hotel":"Hotel","motel":"Motel","resort_hotel":"Resort","hostel":"Hostel",
    "bed_and_breakfast":"B&B","guest_house":"Guest house","extended_stay_hotel":"Extended stay",
    "japanese_inn":"Ryokan","cottage":"Cottage","cabin":"Cabin","farmstay":"Farmstay",
    "spa":"Spa","beauty_salon":"Beauty salon",
    "hair_care":"Hair salon","hair_salon":"Hair salon","barber_shop":"Barber",
    "nail_salon":"Nail salon","massage":"Massage","laundry":"Laundry",
    "car_repair":"Auto repair","car_wash":"Car wash","dentist":"Dentist","doctor":"Doctor",
    "pharmacy":"Pharmacy","drugstore":"Drugstore","veterinary_care":"Vet","hospital":"Hospital",
    "bank":"Bank","atm":"ATM","post_office":"Post office",
}

# Cuisine map keys that should NOT also count as sub_type
_CUISINE_KEYS = set(CUISINE_MAP.keys())

def _iter_types(primary_type, types):
    """Yield types in priority order: primary type first, then non-generic, then generic."""
    seen = set()
    if primary_type:
        seen.add(primary_type); yield primary_type
    # Non-generic first
    for t in (types or []):
        if t in seen or t in GENERIC_TYPES: continue
        seen.add(t); yield t
    # Generic last (fallback)
    for t in (types or []):
        if t in seen: continue
        seen.add(t); yield t

def classify_place(place_types, primary_type=""):
    intent = cuisine = sub_type = ""
    for t in _iter_types(primary_type, place_types):
        if not intent and t in INTENT_MAP: intent = INTENT_MAP[t]
        if not cuisine and t in CUISINE_MAP: cuisine = CUISINE_MAP[t]
        # Don't treat cuisine types as sub_type — cuisine has its own slot
        if not sub_type and t in SUB_TYPE_MAP and t not in _CUISINE_KEYS:
            sub_type = SUB_TYPE_MAP[t]
    return intent, cuisine, sub_type

# ── Models ────────────────────────────────────────────────
class PlaceCreate(BaseModel):
    name:str; address:str=""; country:str=""; city:str=""; district:str=""
    region:str=""; lat:float; lng:float; photo:str=""
    tags:list[str]=[]; auto_tags:list[str]=[]; notes:str=""
    google_place_id:str=""; google_maps_url:str=""
    phone:str=""; website:str=""; rating:float=0; rating_count:int=0
    price_level:str=""; hours:str=""; editorial_summary:str=""
    dining:list[str]=[]; serves:list[str]=[]; amenities:list[str]=[]
    place_type:str=""; payment:list[str]=[]; reviews:list[dict]=[]
    intent:str=""; cuisine:str=""; sub_type:str=""; saved:str=""

class PlaceUpdate(BaseModel):
    name:Optional[str]=None; tags:Optional[list[str]]=None; notes:Optional[str]=None
    intent:Optional[str]=None; cuisine:Optional[str]=None; sub_type:Optional[str]=None

class RouteCreate(BaseModel):
    name:str; stops:list[int]=[]

class RouteUpdate(BaseModel):
    name:Optional[str]=None; stops:Optional[list[int]]=None

class UserRegister(BaseModel):
    username:str; password:str; display_name:str=""

class UserLogin(BaseModel):
    username:str; password:str

class UserUpdate(BaseModel):
    display_name:Optional[str]=None; color:Optional[str]=None
    email:Optional[str]=None; notify_digest:Optional[bool]=None

class PasswordChange(BaseModel):
    current_password:str; new_password:str

class UsernameChange(BaseModel):
    new_username:str; password:str

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(); yield

app = FastAPI(title="Travel", lifespan=lifespan)

# ── Auth dependency ──────────────────────────────────────
AVATAR_COLORS = ["#1A73E8","#EA4335","#34A853","#FBBC04","#5E35B1","#E8710A","#D93025","#1E8E3E"]

def get_user(request: Request):
    """Get current user from session cookie. Returns None if not logged in."""
    token = request.cookies.get("session")
    if not token: return None
    conn = get_db()
    row = conn.execute("SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token=?", (token,)).fetchone()
    conn.close()
    return dict(row) if row else None

def require_user(request: Request):
    """Same as get_user but raises 401 if not logged in."""
    user = get_user(request)
    if not user: raise HTTPException(401, "Not logged in")
    return user

# ── Auth endpoints ───────────────────────────────────────
@app.post("/api/auth/register")
def register(body: UserRegister, response: Response):
    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE username=?", (body.username.lower().strip(),)).fetchone():
        conn.close(); raise HTTPException(409, "Username taken")
    pw = _hash_pw(body.password)
    color = AVATAR_COLORS[conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] % len(AVATAR_COLORS)]
    dn = body.display_name or body.username
    conn.execute("INSERT INTO users (username,display_name,password,color,created) VALUES (?,?,?,?,?)",
        (body.username.lower().strip(), dn, pw, color, date.today().isoformat()))
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE username=?", (body.username.lower().strip(),)).fetchone()
    token = secrets.token_hex(32)
    conn.execute("INSERT INTO sessions (token,user_id,created) VALUES (?,?,?)", (token, user["id"], date.today().isoformat()))
    conn.commit(); conn.close()
    response.set_cookie("session", token, httponly=True, samesite="lax", max_age=86400*90)
    return {"user": {"id":user["id"],"username":user["username"],"display_name":user["display_name"],"color":user["color"],"email":"","notify_digest":False}}

@app.post("/api/auth/login")
def login(body: UserLogin, response: Response):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE username=?", (body.username.lower().strip(),)).fetchone()
    if not user or not _check_pw(body.password, user["password"]):
        conn.close(); raise HTTPException(401, "Invalid credentials")
    token = secrets.token_hex(32)
    conn.execute("INSERT INTO sessions (token,user_id,created) VALUES (?,?,?)", (token, user["id"], date.today().isoformat()))
    conn.commit(); conn.close()
    response.set_cookie("session", token, httponly=True, samesite="lax", max_age=86400*90)
    return {"user": {"id":user["id"],"username":user["username"],"display_name":user["display_name"],"color":user["color"],
            "email":user["email"] or "","notify_digest":bool(user["notify_digest"])}}

@app.post("/api/auth/logout")
def logout(request: Request, response: Response):
    token = request.cookies.get("session")
    if token:
        conn = get_db(); conn.execute("DELETE FROM sessions WHERE token=?", (token,)); conn.commit(); conn.close()
    response.delete_cookie("session")
    return {"ok": True}

@app.get("/api/auth/me")
def me(request: Request):
    user = get_user(request)
    if not user: return {"user": None}
    return {"user": {"id":user["id"],"username":user["username"],"display_name":user["display_name"],
            "color":user["color"],"email":user.get("email",""),"notify_digest":bool(user.get("notify_digest",0))}}

@app.patch("/api/auth/me")
def update_me(updates: UserUpdate, request: Request):
    user = require_user(request)
    conn = get_db(); fields = []; values = []
    if updates.display_name is not None: fields.append("display_name=?"); values.append(updates.display_name)
    if updates.color is not None: fields.append("color=?"); values.append(updates.color)
    if updates.email is not None: fields.append("email=?"); values.append(updates.email)
    if updates.notify_digest is not None: fields.append("notify_digest=?"); values.append(1 if updates.notify_digest else 0)
    if fields:
        values.append(user["id"])
        conn.execute(f"UPDATE users SET {','.join(fields)} WHERE id=?", values); conn.commit()
    row = conn.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone(); conn.close()
    return {"user": {"id":row["id"],"username":row["username"],"display_name":row["display_name"],
            "color":row["color"],"email":row["email"] or "","notify_digest":bool(row["notify_digest"])}}

@app.post("/api/auth/password")
def change_password(body: PasswordChange, request: Request):
    user = require_user(request)
    if not _check_pw(body.current_password, user["password"]):
        raise HTTPException(400, "Current password is incorrect")
    if len(body.new_password) < 4:
        raise HTTPException(400, "Password must be at least 4 characters")
    conn = get_db()
    conn.execute("UPDATE users SET password=? WHERE id=?", (_hash_pw(body.new_password), user["id"]))
    conn.commit(); conn.close()
    return {"ok": True}

@app.post("/api/auth/username")
def change_username(body: UsernameChange, request: Request):
    user = require_user(request)
    if not _check_pw(body.password, user["password"]):
        raise HTTPException(400, "Password is incorrect")
    new_un = body.new_username.lower().strip()
    if not new_un or len(new_un) < 2:
        raise HTTPException(400, "Username must be at least 2 characters")
    conn = get_db()
    if conn.execute("SELECT id FROM users WHERE username=? AND id!=?", (new_un, user["id"])).fetchone():
        conn.close(); raise HTTPException(409, "Username taken")
    conn.execute("UPDATE users SET username=? WHERE id=?", (new_un, user["id"]))
    conn.commit(); conn.close()
    return {"user": {"id":user["id"],"username":new_un,"display_name":user["display_name"],"color":user["color"],
            "email":user.get("email",""),"notify_digest":bool(user.get("notify_digest",0))}}

@app.delete("/api/auth/account")
def delete_account(request: Request, response: Response):
    user = require_user(request)
    conn = get_db()
    conn.execute("DELETE FROM places WHERE user_id=?", (user["id"],))
    conn.execute("DELETE FROM routes WHERE user_id=?", (user["id"],))
    conn.execute("DELETE FROM sessions WHERE user_id=?", (user["id"],))
    conn.execute("DELETE FROM users WHERE id=?", (user["id"],))
    conn.commit(); conn.close()
    response.delete_cookie("session")
    return {"ok": True}

# ── Region mapping ────────────────────────────────────────
REGION_MAP = {
    "AF":"Africa","DZ":"Africa","AO":"Africa","BJ":"Africa","BW":"Africa",
    "EG":"Africa","ET":"Africa","GH":"Africa","KE":"Africa","MA":"Africa",
    "MZ":"Africa","NG":"Africa","RW":"Africa","SN":"Africa","ZA":"Africa",
    "TN":"Africa","TZ":"Africa","UG":"Africa","ZM":"Africa","ZW":"Africa",
    "CN":"Asia","JP":"Asia","KR":"Asia","IN":"Asia","ID":"Asia",
    "TH":"Asia","VN":"Asia","MY":"Asia","PH":"Asia","SG":"Asia",
    "MM":"Asia","KH":"Asia","LA":"Asia","NP":"Asia","LK":"Asia",
    "BD":"Asia","PK":"Asia","MN":"Asia","TW":"Asia","HK":"Asia",
    "MO":"Asia","BN":"Asia","TL":"Asia","MV":"Asia","BT":"Asia",
    "US":"North America","CA":"North America","MX":"North America",
    "GT":"North America","BZ":"North America","HN":"North America",
    "SV":"North America","NI":"North America","CR":"North America",
    "PA":"North America","CU":"North America","JM":"North America",
    "HT":"North America","DO":"North America","PR":"North America",
    "BR":"South America","AR":"South America","CL":"South America",
    "CO":"South America","PE":"South America","VE":"South America",
    "EC":"South America","BO":"South America","PY":"South America",
    "UY":"South America","GY":"South America","SR":"South America",
    "GB":"Europe","FR":"Europe","DE":"Europe","IT":"Europe","ES":"Europe",
    "PT":"Europe","NL":"Europe","BE":"Europe","AT":"Europe","CH":"Europe",
    "SE":"Europe","NO":"Europe","DK":"Europe","FI":"Europe","IE":"Europe",
    "PL":"Europe","CZ":"Europe","RO":"Europe","HU":"Europe","GR":"Europe",
    "HR":"Europe","BG":"Europe","RS":"Europe","SK":"Europe","SI":"Europe",
    "LT":"Europe","LV":"Europe","EE":"Europe","IS":"Europe","LU":"Europe",
    "MT":"Europe","CY":"Europe","BA":"Europe","ME":"Europe","MK":"Europe",
    "AL":"Europe","MD":"Europe","UA":"Europe","BY":"Europe","RU":"Europe",
    "GE":"Europe","AM":"Europe","AZ":"Europe",
    "AU":"Oceania","NZ":"Oceania","FJ":"Oceania","PG":"Oceania",
    "WS":"Oceania","TO":"Oceania","VU":"Oceania",
    "TR":"Middle East","IL":"Middle East","JO":"Middle East","LB":"Middle East",
    "SA":"Middle East","AE":"Middle East","QA":"Middle East","KW":"Middle East",
    "BH":"Middle East","OM":"Middle East","YE":"Middle East","IQ":"Middle East",
    "IR":"Middle East","SY":"Middle East","PS":"Middle East",
}

def country_to_region(code): return REGION_MAP.get(code, "Other")

def extract_address_parts(components):
    country_name=country_code=city=district=""
    for comp in components:
        types=comp.get("types",[]); text=comp.get("longText",comp.get("long_name",""))
        if "country" in types: country_name=text; country_code=comp.get("shortText",comp.get("short_name",""))
        elif "locality" in types: city=text
        elif "administrative_area_level_1" in types and not city: city=text
        elif "sublocality_level_1" in types or "sublocality" in types: district=text
        elif "neighborhood" in types and not district: district=text
    return {"country":country_name,"country_code":country_code,"city":city,"district":district,"region":country_to_region(country_code)}

def extract_auto_tags(pt):
    m={"restaurant":"restaurant","food":"food","cafe":"cafe","bar":"bar","bakery":"bakery",
       "meal_takeaway":"takeaway","park":"park","natural_feature":"nature","campground":"camping",
       "tourist_attraction":"attraction","museum":"museum","art_gallery":"gallery",
       "church":"church","mosque":"mosque","hindu_temple":"temple","synagogue":"synagogue",
       "shopping_mall":"mall","store":"shop","lodging":"hotel","spa":"spa",
       "amusement_park":"theme park","zoo":"zoo","aquarium":"aquarium","beach":"beach","harbor":"harbor"}
    return [m[t] for t in (pt or []) if t in m][:5]

def extract_dining(p):
    d=[]
    if p.get("dineIn"): d.append("dine-in")
    if p.get("delivery"): d.append("delivery")
    if p.get("curbsidePickup"): d.append("pickup")
    if p.get("reservable"): d.append("reservable")
    if p.get("outdoorSeating"): d.append("outdoor seating")
    return d

def extract_serves(p):
    s=[]
    for k,v in [("servesBreakfast","breakfast"),("servesBrunch","brunch"),("servesLunch","lunch"),
        ("servesDinner","dinner"),("servesBeer","beer"),("servesWine","wine"),
        ("servesCocktails","cocktails"),("servesCoffee","coffee"),("servesDessert","dessert"),
        ("servesVegetarianFood","vegetarian")]:
        if p.get(k): s.append(v)
    return s

def extract_amenities(p):
    a=[]; ao=p.get("accessibilityOptions",{})
    if ao.get("wheelchairAccessibleEntrance"): a.append("wheelchair accessible")
    if ao.get("wheelchairAccessibleRestroom"): a.append("accessible restroom")
    if p.get("restroom"): a.append("restroom")
    if p.get("goodForChildren"): a.append("good for kids")
    if p.get("goodForGroups"): a.append("good for groups")
    if p.get("goodForWatchingSports"): a.append("sports viewing")
    if p.get("liveMusic"): a.append("live music")
    if p.get("allowsDogs"): a.append("dogs allowed")
    po=p.get("parkingOptions",{})
    if po.get("freeParking") or po.get("paidParking"): a.append("parking")
    return a

def extract_hours(p):
    descs=p.get("regularOpeningHours",{}).get("weekdayDescriptions",[])
    return " | ".join(descs) if descs else ""

def extract_open_now(p):
    for k in ["currentOpeningHours","regularOpeningHours"]:
        if "openNow" in p.get(k,{}): return p[k]["openNow"]
    return None

def extract_payment(p):
    po=p.get("paymentOptions",{}); r=[]
    if po.get("acceptsCreditCards"): r.append("credit card")
    if po.get("acceptsDebitCards"): r.append("debit card")
    if po.get("acceptsCashOnly"): r.append("cash only")
    if po.get("acceptsNfc"): r.append("NFC/contactless")
    return r

def extract_reviews(p):
    out=[]
    for r in p.get("reviews",[])[:3]:
        text=r.get("text",{}); author=r.get("authorAttribution",{})
        out.append({"text":text.get("text","") if isinstance(text,dict) else "","rating":r.get("rating",0),
            "author":author.get("displayName",""),"time":r.get("relativePublishTimeDescription","")})
    return out

def extract_price_level(p):
    return {"PRICE_LEVEL_FREE":"Free","PRICE_LEVEL_INEXPENSIVE":"$","PRICE_LEVEL_MODERATE":"$$",
            "PRICE_LEVEL_EXPENSIVE":"$$$","PRICE_LEVEL_VERY_EXPENSIVE":"$$$$"}.get(p.get("priceLevel",""),"")

# ── Google Places API ─────────────────────────────────────
_F = lambda prefix: ",".join([f"{prefix}{f}" for f in [
    "id","displayName","formattedAddress","location","photos","addressComponents",
    "types","primaryType","primaryTypeDisplayName","googleMapsLinks",
    "internationalPhoneNumber","websiteUri","rating","userRatingCount","priceLevel",
    "regularOpeningHours","currentOpeningHours","editorialSummary",
    "dineIn","delivery","curbsidePickup","reservable","outdoorSeating",
    "servesBreakfast","servesBrunch","servesLunch","servesDinner",
    "servesBeer","servesWine","servesCocktails","servesCoffee","servesDessert",
    "servesVegetarianFood","accessibilityOptions","restroom",
    "goodForChildren","goodForGroups","goodForWatchingSports","liveMusic","allowsDogs",
    "parkingOptions","paymentOptions","reviews"]])
SEARCH_FIELDS = _F("places.")
DETAIL_FIELDS = _F("")

def parse_place(p):
    loc=p.get("location",{}); dn=p.get("displayName",{}); pt=p.get("types",[])
    addr=extract_address_parts(p.get("addressComponents",[]))
    photos=p.get("photos",[])
    photo_url=""
    if photos:
        pn=photos[0].get("name","")
        if pn: photo_url=f"https://places.googleapis.com/v1/{pn}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"
    ml=p.get("googleMapsLinks",{})
    maps_url=ml.get("placeUri","")
    if not maps_url: maps_url=f"https://www.google.com/maps/search/?api=1&query={dn.get('text','')}&query_place_id={p.get('id','')}"
    es=p.get("editorialSummary",{}); ptdn=p.get("primaryTypeDisplayName",{})
    primary_type=p.get("primaryType","") or ""
    intent,cuisine,sub_type=classify_place(pt, primary_type)
    return {
        "google_place_id":p.get("id",""),"name":dn.get("text",""),
        "address":p.get("formattedAddress",""),
        "country":addr["country"],"city":addr["city"],"district":addr["district"],"region":addr["region"],
        "lat":loc.get("latitude",0),"lng":loc.get("longitude",0),"photo":photo_url,
        "auto_tags":extract_auto_tags(pt),
        "place_type":ptdn.get("text","") if isinstance(ptdn,dict) else "",
        "google_maps_url":maps_url,"phone":p.get("internationalPhoneNumber",""),
        "website":p.get("websiteUri",""),"rating":p.get("rating",0),
        "rating_count":p.get("userRatingCount",0),"price_level":extract_price_level(p),
        "hours":extract_hours(p),"open_now":extract_open_now(p),
        "editorial_summary":es.get("text","") if isinstance(es,dict) else "",
        "dining":extract_dining(p),"serves":extract_serves(p),
        "amenities":extract_amenities(p),"payment":extract_payment(p),
        "reviews":extract_reviews(p),"intent":intent,"cuisine":cuisine,"sub_type":sub_type,
    }

@app.get("/api/search")
async def search_places(q:str=Query(...,min_length=1)):
    if not GOOGLE_API_KEY: raise HTTPException(500,"Google Places API key not configured")
    headers={"Content-Type":"application/json","X-Goog-Api-Key":GOOGLE_API_KEY,"X-Goog-FieldMask":SEARCH_FIELDS}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp=await client.post("https://places.googleapis.com/v1/places:searchText",
                json={"textQuery":q,"maxResultCount":5},headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e: raise HTTPException(502,f"Google API error: {e.response.status_code}")
        except httpx.RequestError as e: raise HTTPException(502,f"Request failed: {str(e)}")
    return {"results":[parse_place(p) for p in resp.json().get("places",[])]}

@app.get("/api/staticmap")
async def static_map(lat:float,lng:float,zoom:int=15,w:int=600,h:int=300):
    if not GOOGLE_API_KEY: raise HTTPException(500,"API key not configured")
    url=f"https://maps.googleapis.com/maps/api/staticmap?center={lat},{lng}&zoom={zoom}&size={w}x{h}&markers=color:red|{lat},{lng}&key={GOOGLE_API_KEY}&style=feature:all|saturation:-30"
    return RedirectResponse(url)

@app.get("/api/places/{place_id}/photo")
async def place_photo(place_id:int, w:int=200):
    """Stable same-origin photo for a saved place. Reuses stored photo URL or fetches fresh
    from Google Places (covers places imported without photos). Hides the API key from the
    client and lets the browser cache by stable URL."""
    if not GOOGLE_API_KEY: raise HTTPException(404)
    conn=get_db()
    row=conn.execute("SELECT photo,google_place_id FROM places WHERE id=?",(place_id,)).fetchone()
    conn.close()
    if not row: raise HTTPException(404)
    photo=row["photo"] or ""; gid=row["google_place_id"] or ""
    if photo:
        # Re-size on the fly — same Google photo reference, smaller payload for thumbs
        photo=re.sub(r"maxWidthPx=\d+", f"maxWidthPx={w}", photo)
        return RedirectResponse(photo)
    if not gid: raise HTTPException(404)
    headers={"Content-Type":"application/json","X-Goog-Api-Key":GOOGLE_API_KEY,"X-Goog-FieldMask":"photos"}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp=await client.get(f"https://places.googleapis.com/v1/places/{gid}",headers=headers)
            if resp.status_code!=200: raise HTTPException(404)
            photos=resp.json().get("photos",[])
        except httpx.RequestError: raise HTTPException(502)
    if not photos: raise HTTPException(404)
    pn=photos[0].get("name","")
    if not pn: raise HTTPException(404)
    return RedirectResponse(f"https://places.googleapis.com/v1/{pn}/media?maxWidthPx={w}&key={GOOGLE_API_KEY}")

# ── Places CRUD ───────────────────────────────────────────
JSON_FIELDS=["tags","auto_tags","dining","serves","amenities","payment","reviews"]

def row_to_place(row):
    d=dict(row)
    for f in JSON_FIELDS: d[f]=json.loads(d.get(f) or "[]")
    return d

@app.get("/api/places")
def list_places(request: Request):
    user = get_user(request)
    uid = user["id"] if user else 0
    conn=get_db(); rows=conn.execute("SELECT * FROM places WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall(); conn.close()
    return {"places":[row_to_place(r) for r in rows]}

@app.post("/api/places")
def create_place(place:PlaceCreate, request: Request):
    user = get_user(request)
    uid = user["id"] if user else 0
    conn=get_db(); saved=place.saved or date.today().isoformat()
    cursor=conn.execute(
        """INSERT INTO places (user_id,name,address,country,city,district,region,lat,lng,photo,tags,auto_tags,notes,
           google_place_id,google_maps_url,phone,website,rating,rating_count,price_level,hours,
           editorial_summary,dining,serves,amenities,place_type,payment,reviews,intent,cuisine,sub_type,saved)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (uid,place.name,place.address,place.country,place.city,place.district,place.region,
         place.lat,place.lng,place.photo,json.dumps(place.tags),json.dumps(place.auto_tags),
         place.notes,place.google_place_id,place.google_maps_url,place.phone,place.website,
         place.rating,place.rating_count,place.price_level,place.hours,place.editorial_summary,
         json.dumps(place.dining),json.dumps(place.serves),json.dumps(place.amenities),
         place.place_type,json.dumps(place.payment),json.dumps(place.reviews),
         place.intent,place.cuisine,place.sub_type,saved))
    conn.commit()
    row=conn.execute("SELECT * FROM places WHERE id=?",(cursor.lastrowid,)).fetchone(); conn.close()
    return row_to_place(row)

@app.put("/api/places/{place_id}")
def update_place(place_id:int,updates:PlaceUpdate, request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    row=conn.execute("SELECT * FROM places WHERE id=? AND user_id=?",(place_id,uid)).fetchone()
    if not row: conn.close(); raise HTTPException(404,"Place not found")
    fields,values=[],[]
    if updates.name is not None: fields.append("name=?"); values.append(updates.name)
    if updates.tags is not None: fields.append("tags=?"); values.append(json.dumps(updates.tags))
    if updates.notes is not None: fields.append("notes=?"); values.append(updates.notes)
    if updates.intent is not None: fields.append("intent=?"); values.append(updates.intent)
    if updates.cuisine is not None: fields.append("cuisine=?"); values.append(updates.cuisine)
    if updates.sub_type is not None: fields.append("sub_type=?"); values.append(updates.sub_type)
    if fields: values.append(place_id); conn.execute(f"UPDATE places SET {','.join(fields)} WHERE id=?",values); conn.commit()
    row=conn.execute("SELECT * FROM places WHERE id=?",(place_id,)).fetchone(); conn.close()
    return row_to_place(row)

@app.delete("/api/places/{place_id}")
def delete_place(place_id:int, request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    if not conn.execute("SELECT id FROM places WHERE id=? AND user_id=?",(place_id,uid)).fetchone(): conn.close(); raise HTTPException(404)
    conn.execute("DELETE FROM places WHERE id=?",(place_id,)); conn.commit(); conn.close()
    return {"ok":True}

@app.post("/api/places/{place_id}/refresh")
async def refresh_place(place_id:int, request: Request):
    if not GOOGLE_API_KEY: raise HTTPException(500,"Google Places API key not configured")
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    row=conn.execute("SELECT * FROM places WHERE id=? AND user_id=?",(place_id,uid)).fetchone()
    if not row: conn.close(); raise HTTPException(404)
    place=dict(row); gid=place.get("google_place_id","")
    if not gid: conn.close(); raise HTTPException(400,"No Google Place ID")
    headers={"Content-Type":"application/json","X-Goog-Api-Key":GOOGLE_API_KEY,"X-Goog-FieldMask":DETAIL_FIELDS}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp=await client.get(f"https://places.googleapis.com/v1/places/{gid}",headers=headers)
            resp.raise_for_status()
        except (httpx.HTTPStatusError,httpx.RequestError) as e:
            conn.close(); raise HTTPException(502,str(e))
    fresh=parse_place(resp.json())
    conn.execute(
        """UPDATE places SET name=?,address=?,country=?,city=?,district=?,region=?,lat=?,lng=?,photo=?,
           auto_tags=?,google_maps_url=?,phone=?,website=?,rating=?,rating_count=?,price_level=?,hours=?,
           editorial_summary=?,dining=?,serves=?,amenities=?,place_type=?,payment=?,reviews=?,
           intent=?,cuisine=?,sub_type=? WHERE id=?""",
        (fresh["name"],fresh["address"],fresh["country"],fresh["city"],fresh["district"],fresh["region"],
         fresh["lat"],fresh["lng"],fresh["photo"],json.dumps(fresh["auto_tags"]),fresh["google_maps_url"],
         fresh["phone"],fresh["website"],fresh["rating"],fresh["rating_count"],fresh["price_level"],
         fresh["hours"],fresh["editorial_summary"],json.dumps(fresh["dining"]),json.dumps(fresh["serves"]),
         json.dumps(fresh["amenities"]),fresh["place_type"],json.dumps(fresh["payment"]),
         json.dumps(fresh["reviews"]),fresh["intent"],fresh["cuisine"],fresh["sub_type"],place_id))
    conn.commit()
    row=conn.execute("SELECT * FROM places WHERE id=?",(place_id,)).fetchone(); conn.close()
    return row_to_place(row)

# ── Routes CRUD ───────────────────────────────────────────
def row_to_route(row):
    d=dict(row); d["stops"]=json.loads(d["stops"]) if d["stops"] else []; return d

def build_route_url(places):
    if not places: return ""
    if len(places)==1: return f"https://www.google.com/maps/search/?api=1&query={places[0]['lat']},{places[0]['lng']}"
    o=f"{places[0]['lat']},{places[0]['lng']}"; d=f"{places[-1]['lat']},{places[-1]['lng']}"
    url=f"https://www.google.com/maps/dir/?api=1&origin={o}&destination={d}&travelmode=driving"
    if len(places)>2: url+="&waypoints="+"|".join(f"{p['lat']},{p['lng']}" for p in places[1:-1])
    return url

def _travel_estimate(lat1,lng1,lat2,lng2):
    """Estimate travel duration from haversine distance. Returns dict with driving/walking mins."""
    d=_haversine(lat1,lng1,lat2,lng2)
    drive_min=max(1,round(d/500))   # ~30km/h avg urban driving
    walk_min=max(1,round(d/80))     # ~5km/h walking
    return {"distance":_fmt_dist(d),"distance_m":d,"drive_min":drive_min,"walk_min":walk_min}

@app.get("/api/routes")
def list_routes(request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db(); rows=conn.execute("SELECT * FROM routes WHERE user_id=? ORDER BY updated DESC",(uid,)).fetchall()
    routes=[]
    for row in rows:
        r=row_to_route(row)
        if r["stops"]:
            ph=",".join("?"*len(r["stops"]))
            pr=conn.execute(f"SELECT id,name,photo,lat,lng,country,city,hours,place_type FROM places WHERE id IN ({ph})",r["stops"]).fetchall()
            pm={dict(p)["id"]:dict(p) for p in pr}
            details=[]
            for i,sid in enumerate(r["stops"]):
                if sid not in pm: continue
                stop=dict(pm[sid])
                if i>0:
                    prev_sid=r["stops"][i-1]
                    if prev_sid in pm:
                        stop["travel_from_prev"]=_travel_estimate(pm[prev_sid]["lat"],pm[prev_sid]["lng"],stop["lat"],stop["lng"])
                details.append(stop)
            r["stop_details"]=details
        else: r["stop_details"]=[]
        routes.append(r)
    conn.close(); return {"routes":routes}

@app.post("/api/routes")
def create_route(route:RouteCreate, request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db(); now=date.today().isoformat(); url=""
    if route.stops:
        ph=",".join("?"*len(route.stops))
        rows=conn.execute(f"SELECT id,lat,lng FROM places WHERE id IN ({ph})",route.stops).fetchall()
        pm={dict(r)["id"]:dict(r) for r in rows}
        url=build_route_url([pm[sid] for sid in route.stops if sid in pm])
    cursor=conn.execute("INSERT INTO routes (user_id,name,stops,route_url,created,updated) VALUES (?,?,?,?,?,?)",
        (uid,route.name,json.dumps(route.stops),url,now,now))
    conn.commit(); row=conn.execute("SELECT * FROM routes WHERE id=?",(cursor.lastrowid,)).fetchone(); conn.close()
    return row_to_route(row)

@app.put("/api/routes/{route_id}")
def update_route(route_id:int,updates:RouteUpdate, request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    if not conn.execute("SELECT id FROM routes WHERE id=? AND user_id=?",(route_id,uid)).fetchone(): conn.close(); raise HTTPException(404)
    now=date.today().isoformat(); fields,values=["updated=?"],[now]
    if updates.name is not None: fields.append("name=?"); values.append(updates.name)
    if updates.stops is not None:
        fields.append("stops=?"); values.append(json.dumps(updates.stops))
        ph=",".join("?"*len(updates.stops))
        rows=conn.execute(f"SELECT id,lat,lng FROM places WHERE id IN ({ph})",updates.stops).fetchall()
        pm={dict(r)["id"]:dict(r) for r in rows}
        fields.append("route_url=?"); values.append(build_route_url([pm[sid] for sid in updates.stops if sid in pm]))
    values.append(route_id)
    conn.execute(f"UPDATE routes SET {','.join(fields)} WHERE id=?",values); conn.commit()
    row=conn.execute("SELECT * FROM routes WHERE id=?",(route_id,)).fetchone(); conn.close()
    return row_to_route(row)

@app.delete("/api/routes/{route_id}")
def delete_route(route_id:int, request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    if not conn.execute("SELECT id FROM routes WHERE id=? AND user_id=?",(route_id,uid)).fetchone(): conn.close(); raise HTTPException(404)
    conn.execute("DELETE FROM routes WHERE id=?",(route_id,)); conn.commit(); conn.close()
    return {"ok":True}

# ── Nearby Transit ────────────────────────────────────────
import math

def _haversine(lat1,lng1,lat2,lng2):
    R=6371000
    p=math.pi/180
    a=math.sin((lat2-lat1)*p/2)**2+math.cos(lat1*p)*math.cos(lat2*p)*math.sin((lng2-lng1)*p/2)**2
    return R*2*math.asin(math.sqrt(a))

def _fmt_dist(m):
    if m<1000: return f"{int(m)}m"
    return f"{m/1000:.1f}km"

def _classify_transit(types, stype):
    """Classify into MRT, LRT, Bus, or Train"""
    sl = stype.lower() if stype else ""
    # LRT first (before MRT check) — Singapore light rail
    if "light_rail_station" in types or "lrt" in sl or "light rail" in sl:
        return "LRT"
    if any(t in types for t in ["subway_station"]) or "subway" in sl or "mrt" in sl or "metro" in sl:
        return "MRT"
    if any(t in types for t in ["bus_station","bus_stop"]) or "bus" in sl:
        return "Bus"
    if "train_station" in types or "train" in sl:
        return "Train"
    if "transit_station" in types:
        # transit_station is a generic fallback — check name for clues
        if "mrt" in (stype or "").lower() or "mrt" in sl:
            return "MRT"
        if "lrt" in (stype or "").lower() or "lrt" in sl:
            return "LRT"
        return "MRT"
    return "Transit"

@app.get("/api/nearby-transit")
async def nearby_transit(lat:float,lng:float):
    if not GOOGLE_API_KEY: return {"groups":[]}
    headers={"Content-Type":"application/json","X-Goog-Api-Key":GOOGLE_API_KEY,
             "X-Goog-FieldMask":"places.displayName,places.location,places.types,places.primaryType,places.primaryTypeDisplayName"}
    # Search per-type with rankPreference=DISTANCE so we get the nearest, not most popular
    # bus_stop uses a tight radius — bus stops are ubiquitous, we want the *nearest*
    type_searches=[
        ("subway_station",1500),
        ("light_rail_station",1500),
        ("train_station",1500),
        ("bus_stop",500),
        ("bus_station",1500),
        ("transit_station",1500),
    ]
    raw=[]
    async with httpx.AsyncClient(timeout=10) as client:
        for ttype, radius in type_searches:
            try:
                resp=await client.post("https://places.googleapis.com/v1/places:searchNearby",
                    json={"includedTypes":[ttype],"maxResultCount":5,
                          "rankPreference":"DISTANCE",
                          "locationRestriction":{"circle":{"center":{"latitude":lat,"longitude":lng},"radius":radius}}},
                    headers=headers)
                if resp.status_code==200:
                    for p in resp.json().get("places",[]):
                        loc=p.get("location",{}); dn=p.get("displayName",{})
                        name=dn.get("text","")
                        plat=loc.get("latitude",0); plng=loc.get("longitude",0)
                        dist=_haversine(lat,lng,plat,plng)
                        ptdn=p.get("primaryTypeDisplayName",{})
                        stype=ptdn.get("text","") if isinstance(ptdn,dict) else ""
                        types=p.get("types",[])
                        primary=p.get("primaryType","") or ""
                        category=_classify_transit(types+[primary], stype)
                        if any(s["name"]==name for s in raw): continue
                        raw.append({"name":name,"distance":_fmt_dist(dist),"distance_m":dist,"category":category})
            except: pass
    raw.sort(key=lambda s:s["distance_m"])
    # Group by category, max 2 per group, prioritise closest
    groups={}
    for s in raw:
        cat=s["category"]
        if cat not in groups: groups[cat]=[]
        if len(groups[cat])<2:
            groups[cat].append({"name":s["name"],"distance":s["distance"]})
    # Order: MRT first, then LRT, Bus, Train, others
    order=["MRT","LRT","Bus","Train","Transit"]
    result=[]
    for cat in order:
        if cat in groups:
            result.append({"category":cat,"stations":groups[cat]})
    for cat in groups:
        if cat not in order:
            result.append({"category":cat,"stations":groups[cat]})
    return {"groups":result}

# ── Nearby accommodation ─────────────────────────────────
@app.get("/api/nearby-accommodation")
async def nearby_accommodation(lat:float,lng:float):
    """Return up to 3 highly-rated nearby places to stay."""
    if not GOOGLE_API_KEY: return {"places":[]}
    headers={"Content-Type":"application/json","X-Goog-Api-Key":GOOGLE_API_KEY,
             "X-Goog-FieldMask":"places.id,places.displayName,places.formattedAddress,places.location,"
                                "places.rating,places.userRatingCount,places.priceLevel,places.photos,"
                                "places.googleMapsLinks,places.primaryTypeDisplayName,places.types"}
    found={}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            # Search a broad lodging set — Google Places returns hotels, hostels, B&Bs etc under "lodging"
            resp=await client.post("https://places.googleapis.com/v1/places:searchNearby",
                json={"includedTypes":["lodging"],"maxResultCount":20,
                      "locationRestriction":{"circle":{"center":{"latitude":lat,"longitude":lng},"radius":3000}}},
                headers=headers)
            if resp.status_code==200:
                for p in resp.json().get("places",[]):
                    pid=p.get("id","")
                    if not pid or pid in found: continue
                    loc=p.get("location",{}); dn=p.get("displayName",{})
                    rating=p.get("rating",0) or 0
                    rcount=p.get("userRatingCount",0) or 0
                    # Filter weak signals — need real reviews to call it "highly recommended"
                    if rating<4.2 or rcount<50: continue
                    plat=loc.get("latitude",0); plng=loc.get("longitude",0)
                    dist=_haversine(lat,lng,plat,plng)
                    photos=p.get("photos",[]); photo_url=""
                    if photos:
                        pn=photos[0].get("name","")
                        if pn: photo_url=f"https://places.googleapis.com/v1/{pn}/media?maxWidthPx=400&key={GOOGLE_API_KEY}"
                    ptdn=p.get("primaryTypeDisplayName",{})
                    stype=ptdn.get("text","") if isinstance(ptdn,dict) else ""
                    ml=p.get("googleMapsLinks",{}); maps_url=ml.get("placeUri","") or \
                        f"https://www.google.com/maps/search/?api=1&query={dn.get('text','')}&query_place_id={pid}"
                    found[pid]={
                        "id":pid,"name":dn.get("text",""),"address":p.get("formattedAddress",""),
                        "lat":plat,"lng":plng,"distance":_fmt_dist(dist),"distance_m":dist,
                        "rating":rating,"rating_count":rcount,
                        "price_level":extract_price_level(p),"photo":photo_url,
                        "type":stype or "Hotel","maps_url":maps_url,
                    }
        except: pass
    # Rank: weighted by rating and review volume, tie-break by distance
    items=sorted(found.values(), key=lambda x: (-(x["rating"]*min(x["rating_count"],500)/500), x["distance_m"]))
    return {"places":items[:3]}

# ── Review Highlights ────────────────────────────────────
import re as _re

def _extract_highlights(reviews, editorial="", serves=None, dining=None, amenities=None):
    """Extract what makes this place special from review text."""
    highlights=[]
    if editorial:
        highlights.append({"type":"summary","text":editorial})

    all_text=" ".join(r.get("text","") for r in (reviews or []))
    if not all_text.strip():
        return highlights

    # Extract specific items mentioned (food, drinks, dishes)
    food_patterns=[
        r'(?:try|order|recommend|must.?have|famous for|known for|best|signature|specialty)[:\s]+([A-Z][a-zA-Z\s&\']+?)(?:[,.\!;]|$)',
        r'(?:the|their)\s+([A-Z][a-zA-Z\s&\']{3,30})\s+(?:is|was|are|were)\s+(?:amazing|excellent|fantastic|great|incredible|delicious|superb|outstanding|perfect)',
    ]
    found_items=set()
    for pat in food_patterns:
        for m in _re.finditer(pat, all_text):
            item=m.group(1).strip().rstrip(".,!; ")
            if 3<=len(item)<=40 and item.lower() not in ("the place","this place","the food","the service","the staff","the restaurant","the cafe","the coffee"):
                found_items.add(item)
    for item in list(found_items)[:4]:
        highlights.append({"type":"signature","text":item})

    # Extract vibe/atmosphere descriptors
    vibe_words={"cozy","cosy","intimate","lively","vibrant","chill","relaxed","trendy","hipster",
                "rustic","modern","minimalist","aesthetic","instagrammable","rooftop","alfresco",
                "romantic","family-friendly","hidden gem","hole in the wall","spacious","quiet",
                "bustling","crowded","popular","packed","busy"}
    found_vibes=set()
    lower=all_text.lower()
    for v in vibe_words:
        if v in lower: found_vibes.add(v)
    for v in list(found_vibes)[:3]:
        highlights.append({"type":"vibe","text":v})

    # Extract pain points / tips
    if any(w in lower for w in ["queue","wait","line up","long wait","crowded","packed","reservation"]):
        if any(w in lower for w in ["queue","wait","line up","long wait"]):
            highlights.append({"type":"tip","text":"expect queues"})
        if "reservation" in lower:
            highlights.append({"type":"tip","text":"reservations recommended"})

    # Best time hints
    if any(w in lower for w in ["weekday","weekdays"]):
        highlights.append({"type":"tip","text":"better on weekdays"})
    if any(w in lower for w in ["sunset","evening view","night view"]):
        highlights.append({"type":"tip","text":"great for sunset/evening"})

    # Value hints
    if any(w in lower for w in ["worth the price","value for money","affordable","cheap","budget"]):
        highlights.append({"type":"vibe","text":"good value"})
    if any(w in lower for w in ["overpriced","expensive","pricey"]):
        highlights.append({"type":"tip","text":"on the pricier side"})

    # Add serves/dining/amenity context
    if serves:
        for s in serves[:3]:
            highlights.append({"type":"serves","text":s})
    if dining:
        for d in dining:
            if d!="dine-in": highlights.append({"type":"dining","text":d})
    if amenities:
        a_map={"good for kids":"family-friendly","live music":"live music","sports viewing":"sports viewing",
               "dogs allowed":"pet-friendly","parking":"parking available","outdoor seating":"outdoor seating"}
        for a in amenities:
            if a in a_map: highlights.append({"type":"vibe","text":a_map[a]})

    # Deduplicate
    seen=set(); unique=[]
    for h in highlights:
        k=h["text"].lower()
        if k not in seen: seen.add(k); unique.append(h)
    return unique[:12]

@app.get("/api/places/{place_id}/highlights")
def get_place_highlights(place_id:int):
    conn=get_db()
    row=conn.execute("SELECT * FROM places WHERE id=?",(place_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404)
    p=row_to_place(row); conn.close()
    return {"highlights":_extract_highlights(
        p.get("reviews",[]), p.get("editorial_summary",""),
        p.get("serves",[]), p.get("dining",[]), p.get("amenities",[])
    )}

# ── Export ────────────────────────────────────────────────
@app.get("/api/export/json")
def export_json(request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    places=[row_to_place(r) for r in conn.execute("SELECT * FROM places WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()]
    routes=[row_to_route(r) for r in conn.execute("SELECT * FROM routes WHERE user_id=? ORDER BY updated DESC",(uid,)).fetchall()]
    conn.close()
    return FastAPIResponse(content=json.dumps({"places":places,"routes":routes},indent=2),
        media_type="application/json",headers={"Content-Disposition":"attachment; filename=travel-backup.json"})

@app.get("/api/export/csv")
def export_csv(request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db(); places=[row_to_place(r) for r in conn.execute("SELECT * FROM places WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()]; conn.close()
    out=io.StringIO()
    flds=["id","name","address","country","city","district","region","lat","lng","rating","rating_count",
          "price_level","place_type","intent","cuisine","sub_type","phone","website","hours",
          "editorial_summary","google_maps_url","google_place_id","tags","auto_tags","notes","saved"]
    w=csv.DictWriter(out,fieldnames=flds,extrasaction="ignore"); w.writeheader()
    for p in places: p["tags"]=";".join(p.get("tags") or []); p["auto_tags"]=";".join(p.get("auto_tags") or []); w.writerow(p)
    return FastAPIResponse(content=out.getvalue(),media_type="text/csv",
        headers={"Content-Disposition":"attachment; filename=travel-places.csv"})

@app.get("/api/export/kml")
def export_kml(request: Request, route_id:Optional[int]=None):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    if route_id:
        row=conn.execute("SELECT * FROM routes WHERE id=? AND user_id=?",(route_id,uid)).fetchone()
        if not row: conn.close(); raise HTTPException(404)
        route=row_to_route(row); ph=",".join("?"*len(route["stops"]))
        rows=conn.execute(f"SELECT * FROM places WHERE id IN ({ph})",route["stops"]).fetchall()
        pm={row_to_place(r)["id"]:row_to_place(r) for r in rows}
        places=[pm[sid] for sid in route["stops"] if sid in pm]; doc_name=route["name"]
    else:
        places=[row_to_place(r) for r in conn.execute("SELECT * FROM places WHERE user_id=? ORDER BY id DESC",(uid,)).fetchall()]
        doc_name="Travel Places"
    conn.close()
    parts=['<?xml version="1.0" encoding="UTF-8"?>','<kml xmlns="http://www.opengis.net/kml/2.2">',
           '<Document>',f'<name>{doc_name}</name>']
    for p in places:
        desc_parts=[]
        if p.get("place_type"): desc_parts.append(p["place_type"])
        if p.get("cuisine"): desc_parts.append(p["cuisine"])
        if p.get("rating"): desc_parts.append(f"Rating: {p['rating']}")
        if p.get("price_level"): desc_parts.append(p["price_level"])
        if p.get("tags"): desc_parts.append("Tags: "+", ".join(p["tags"]))
        desc=" | ".join(desc_parts)
        parts.append(f'<Placemark><name>{p["name"]}</name><description>{desc}</description>'
                     f'<Point><coordinates>{p["lng"]},{p["lat"]},0</coordinates></Point></Placemark>')
    parts.append("</Document></kml>")
    fname=doc_name.lower().replace(" ","-")+".kml"
    return Response(content="\n".join(parts),media_type="application/vnd.google-earth.kml+xml",
        headers={"Content-Disposition":f"attachment; filename={fname}"})

# ── Import ────────────────────────────────────────────────
def _dup_check(conn,lat,lng,name,gid=""):
    if gid and conn.execute("SELECT id FROM places WHERE google_place_id=?",(gid,)).fetchone(): return True
    if conn.execute("SELECT id FROM places WHERE abs(lat-?)<0.0001 AND abs(lng-?)<0.0001 AND name=?",(lat,lng,name)).fetchone(): return True
    return False

@app.post("/api/import/json")
async def import_json(file:UploadFile=File(...)):
    try: data=json.loads(await file.read())
    except: raise HTTPException(400,"Invalid JSON")
    conn=get_db(); imported=0
    for p in data.get("places",[]):
        if _dup_check(conn,p.get("lat",0),p.get("lng",0),p.get("name",""),p.get("google_place_id","")): continue
        saved=p.get("saved") or date.today().isoformat()
        conn.execute(
            """INSERT INTO places (name,address,country,city,district,region,lat,lng,photo,tags,auto_tags,notes,
               google_place_id,google_maps_url,phone,website,rating,rating_count,price_level,hours,
               editorial_summary,dining,serves,amenities,place_type,payment,reviews,intent,cuisine,sub_type,saved)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (p.get("name",""),p.get("address",""),p.get("country",""),p.get("city",""),p.get("district",""),
             p.get("region",""),p.get("lat",0),p.get("lng",0),p.get("photo",""),
             json.dumps(p.get("tags",[])),json.dumps(p.get("auto_tags",[])),p.get("notes",""),
             p.get("google_place_id",""),p.get("google_maps_url",""),p.get("phone",""),p.get("website",""),
             p.get("rating",0),p.get("rating_count",0),p.get("price_level",""),p.get("hours",""),
             p.get("editorial_summary",""),json.dumps(p.get("dining",[])),json.dumps(p.get("serves",[])),
             json.dumps(p.get("amenities",[])),p.get("place_type",""),json.dumps(p.get("payment",[])),
             json.dumps(p.get("reviews",[])),p.get("intent",""),p.get("cuisine",""),p.get("sub_type",""),saved))
        imported+=1
    for r in data.get("routes",[]):
        conn.execute("INSERT INTO routes (name,stops,route_url,created,updated) VALUES (?,?,?,?,?)",
            (r.get("name",""),json.dumps(r.get("stops",[])),r.get("route_url",""),
             r.get("created",date.today().isoformat()),r.get("updated",date.today().isoformat())))
    conn.commit(); conn.close(); return {"imported":imported}

@app.post("/api/import/kml")
async def import_kml(file:UploadFile=File(...)):
    text=(await file.read()).decode("utf-8",errors="replace")
    placemarks=re.findall(r"<Placemark>(.*?)</Placemark>",text,re.DOTALL)
    conn=get_db(); imported=0
    for pm in placemarks:
        nm=re.search(r"<name>(.*?)</name>",pm); co=re.search(r"<coordinates>(.*?)</coordinates>",pm)
        if not nm or not co: continue
        name=nm.group(1).strip(); coords=co.group(1).strip().split(",")
        if len(coords)<2: continue
        try: lng,lat=float(coords[0]),float(coords[1])
        except: continue
        if _dup_check(conn,lat,lng,name): continue
        desc_m=re.search(r"<description>(.*?)</description>",pm)
        conn.execute("INSERT INTO places (name,lat,lng,editorial_summary,saved,tags,auto_tags,dining,serves,amenities,payment,reviews) VALUES (?,?,?,?,?,'[]','[]','[]','[]','[]','[]','[]')",
            (name,lat,lng,desc_m.group(1).strip() if desc_m else "",date.today().isoformat()))
        imported+=1
    conn.commit(); conn.close(); return {"imported":imported}

@app.post("/api/import/csv")
async def import_csv_file(file:UploadFile=File(...)):
    text=(await file.read()).decode("utf-8",errors="replace")
    reader=csv.DictReader(io.StringIO(text)); conn=get_db(); imported=0
    for row in reader:
        try: lat=float(row.get("lat") or row.get("latitude") or 0); lng=float(row.get("lng") or row.get("longitude") or 0)
        except: continue
        name=row.get("name","").strip()
        if not name or (lat==0 and lng==0): continue
        if _dup_check(conn,lat,lng,name): continue
        tags=[t.strip() for t in (row.get("tags","")).split(";") if t.strip()]
        conn.execute(
            """INSERT INTO places (name,address,country,city,district,region,lat,lng,tags,notes,
               google_place_id,google_maps_url,phone,website,rating,rating_count,price_level,hours,
               editorial_summary,place_type,intent,cuisine,sub_type,saved,
               auto_tags,dining,serves,amenities,payment,reviews) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'[]','[]','[]','[]','[]','[]')""",
            (name,row.get("address",""),row.get("country",""),row.get("city",""),row.get("district",""),
             row.get("region",""),lat,lng,json.dumps(tags),row.get("notes",""),row.get("google_place_id",""),
             row.get("google_maps_url",""),row.get("phone",""),row.get("website",""),
             float(row.get("rating",0) or 0),int(row.get("rating_count",0) or 0),
             row.get("price_level",""),row.get("hours",""),row.get("editorial_summary",""),
             row.get("place_type",""),row.get("intent",""),row.get("cuisine",""),row.get("sub_type",""),
             row.get("saved","") or date.today().isoformat()))
        imported+=1
    conn.commit(); conn.close(); return {"imported":imported}

@app.post("/api/import/geojson")
async def import_geojson(file:UploadFile=File(...)):
    try: data=json.loads(await file.read())
    except: raise HTTPException(400,"Invalid GeoJSON")
    conn=get_db(); imported=0
    for f in data.get("features",[]):
        props=f.get("properties",{}); geom=f.get("geometry",{}); coords=geom.get("coordinates",[])
        if len(coords)<2: continue
        lng,lat=coords[0],coords[1]
        name=props.get("Title") or props.get("name") or props.get("Name","")
        if not name: continue
        if _dup_check(conn,lat,lng,name): continue
        loc=props.get("Location",{})
        address=loc.get("Address","") if isinstance(loc,dict) else ""
        url=props.get("Google Maps URL","")
        conn.execute("INSERT INTO places (name,lat,lng,address,google_maps_url,saved,tags,auto_tags,dining,serves,amenities,payment,reviews) VALUES (?,?,?,?,?,?,'[]','[]','[]','[]','[]','[]','[]')",
            (name,lat,lng,address,url,date.today().isoformat()))
        imported+=1
    conn.commit(); conn.close(); return {"imported":imported}

@app.delete("/api/data/all")
def delete_all_data(request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db(); conn.execute("DELETE FROM places WHERE user_id=?",(uid,)); conn.execute("DELETE FROM routes WHERE user_id=?",(uid,)); conn.commit(); conn.close()
    return {"ok":True}

@app.get("/api/stats")
def get_stats(request: Request):
    user = get_user(request); uid = user["id"] if user else 0
    conn=get_db()
    r={"places":conn.execute("SELECT COUNT(*) FROM places WHERE user_id=?",(uid,)).fetchone()[0],
       "routes":conn.execute("SELECT COUNT(*) FROM routes WHERE user_id=?",(uid,)).fetchone()[0],
       "cuisines":conn.execute("SELECT COUNT(DISTINCT cuisine) FROM places WHERE cuisine!='' AND user_id=?",(uid,)).fetchone()[0],
       "cities":conn.execute("SELECT COUNT(DISTINCT city) FROM places WHERE city!='' AND user_id=?",(uid,)).fetchone()[0],
       "countries":conn.execute("SELECT COUNT(DISTINCT country) FROM places WHERE country!='' AND user_id=?",(uid,)).fetchone()[0]}
    conn.close(); return r

# ── Serve frontend ────────────────────────────────────────
if Path(STATIC_DIR).exists():
    app.mount("/assets",StaticFiles(directory=f"{STATIC_DIR}/assets"),name="assets")
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path:str):
        fp=Path(STATIC_DIR)/full_path
        if fp.is_file(): return FileResponse(fp)
        return FileResponse(f"{STATIC_DIR}/index.html")
