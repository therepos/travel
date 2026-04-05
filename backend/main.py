import os
import json
import httpx
import sqlite3
from pathlib import Path
from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional

DB_PATH = os.environ.get("DB_PATH", "/data/travel.db")
GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/frontend/dist")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT DEFAULT '',
            country TEXT DEFAULT '',
            city TEXT DEFAULT '',
            district TEXT DEFAULT '',
            region TEXT DEFAULT '',
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            photo TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            auto_tags TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            google_place_id TEXT DEFAULT '',
            google_maps_url TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            website TEXT DEFAULT '',
            rating REAL DEFAULT 0,
            rating_count INTEGER DEFAULT 0,
            price_level TEXT DEFAULT '',
            hours TEXT DEFAULT '',
            editorial_summary TEXT DEFAULT '',
            dining TEXT DEFAULT '[]',
            serves TEXT DEFAULT '[]',
            amenities TEXT DEFAULT '[]',
            place_type TEXT DEFAULT '',
            payment TEXT DEFAULT '[]',
            reviews TEXT DEFAULT '[]',
            saved TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            stops TEXT DEFAULT '[]',
            route_url TEXT DEFAULT '',
            created TEXT NOT NULL,
            updated TEXT NOT NULL
        )
    """)
    conn.commit()

    # ── Migrations: add columns that may not exist in older DBs ──
    cursor = conn.execute("PRAGMA table_info(places)")
    existing = {row[1] for row in cursor.fetchall()}
    migrations = [
        ("city", "TEXT DEFAULT ''"),
        ("district", "TEXT DEFAULT ''"),
        ("region", "TEXT DEFAULT ''"),
        ("google_place_id", "TEXT DEFAULT ''"),
        ("google_maps_url", "TEXT DEFAULT ''"),
        ("phone", "TEXT DEFAULT ''"),
        ("website", "TEXT DEFAULT ''"),
        ("rating", "REAL DEFAULT 0"),
        ("rating_count", "INTEGER DEFAULT 0"),
        ("price_level", "TEXT DEFAULT ''"),
        ("hours", "TEXT DEFAULT ''"),
        ("editorial_summary", "TEXT DEFAULT ''"),
        ("dining", "TEXT DEFAULT '[]'"),
        ("serves", "TEXT DEFAULT '[]'"),
        ("amenities", "TEXT DEFAULT '[]'"),
        ("auto_tags", "TEXT DEFAULT '[]'"),
        ("place_type", "TEXT DEFAULT ''"),
        ("payment", "TEXT DEFAULT '[]'"),
        ("reviews", "TEXT DEFAULT '[]'"),
    ]
    for col, typedef in migrations:
        if col not in existing:
            conn.execute(f"ALTER TABLE places ADD COLUMN {col} {typedef}")
    conn.commit()
    conn.close()


class PlaceCreate(BaseModel):
    name: str
    address: str = ""
    country: str = ""
    city: str = ""
    district: str = ""
    region: str = ""
    lat: float
    lng: float
    photo: str = ""
    tags: list[str] = []
    auto_tags: list[str] = []
    notes: str = ""
    google_place_id: str = ""
    google_maps_url: str = ""
    phone: str = ""
    website: str = ""
    rating: float = 0
    rating_count: int = 0
    price_level: str = ""
    hours: str = ""
    editorial_summary: str = ""
    dining: list[str] = []
    serves: list[str] = []
    amenities: list[str] = []
    place_type: str = ""
    payment: list[str] = []
    reviews: list[dict] = []
    saved: str = ""


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


class RouteCreate(BaseModel):
    name: str
    stops: list[int] = []


class RouteUpdate(BaseModel):
    name: Optional[str] = None
    stops: Optional[list[int]] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Travel", lifespan=lifespan)


# ── Region mapping ────────────────────────────────────────

REGION_MAP = {
    "AF": "Africa", "DZ": "Africa", "AO": "Africa", "BJ": "Africa", "BW": "Africa",
    "EG": "Africa", "ET": "Africa", "GH": "Africa", "KE": "Africa", "MA": "Africa",
    "MZ": "Africa", "NG": "Africa", "RW": "Africa", "SN": "Africa", "ZA": "Africa",
    "TN": "Africa", "TZ": "Africa", "UG": "Africa", "ZM": "Africa", "ZW": "Africa",
    "CN": "Asia", "JP": "Asia", "KR": "Asia", "IN": "Asia", "ID": "Asia",
    "TH": "Asia", "VN": "Asia", "MY": "Asia", "PH": "Asia", "SG": "Asia",
    "MM": "Asia", "KH": "Asia", "LA": "Asia", "NP": "Asia", "LK": "Asia",
    "BD": "Asia", "PK": "Asia", "MN": "Asia", "TW": "Asia", "HK": "Asia",
    "MO": "Asia", "BN": "Asia", "TL": "Asia", "MV": "Asia", "BT": "Asia",
    "US": "North America", "CA": "North America", "MX": "North America",
    "GT": "North America", "BZ": "North America", "HN": "North America",
    "SV": "North America", "NI": "North America", "CR": "North America",
    "PA": "North America", "CU": "North America", "JM": "North America",
    "HT": "North America", "DO": "North America", "PR": "North America",
    "BR": "South America", "AR": "South America", "CL": "South America",
    "CO": "South America", "PE": "South America", "VE": "South America",
    "EC": "South America", "BO": "South America", "PY": "South America",
    "UY": "South America", "GY": "South America", "SR": "South America",
    "GB": "Europe", "FR": "Europe", "DE": "Europe", "IT": "Europe", "ES": "Europe",
    "PT": "Europe", "NL": "Europe", "BE": "Europe", "AT": "Europe", "CH": "Europe",
    "SE": "Europe", "NO": "Europe", "DK": "Europe", "FI": "Europe", "IE": "Europe",
    "PL": "Europe", "CZ": "Europe", "RO": "Europe", "HU": "Europe", "GR": "Europe",
    "HR": "Europe", "BG": "Europe", "RS": "Europe", "SK": "Europe", "SI": "Europe",
    "LT": "Europe", "LV": "Europe", "EE": "Europe", "IS": "Europe", "LU": "Europe",
    "MT": "Europe", "CY": "Europe", "BA": "Europe", "ME": "Europe", "MK": "Europe",
    "AL": "Europe", "MD": "Europe", "UA": "Europe", "BY": "Europe", "RU": "Europe",
    "GE": "Europe", "AM": "Europe", "AZ": "Europe",
    "AU": "Oceania", "NZ": "Oceania", "FJ": "Oceania", "PG": "Oceania",
    "WS": "Oceania", "TO": "Oceania", "VU": "Oceania",
    "TR": "Middle East", "IL": "Middle East", "JO": "Middle East", "LB": "Middle East",
    "SA": "Middle East", "AE": "Middle East", "QA": "Middle East", "KW": "Middle East",
    "BH": "Middle East", "OM": "Middle East", "YE": "Middle East", "IQ": "Middle East",
    "IR": "Middle East", "SY": "Middle East", "PS": "Middle East",
}


def country_to_region(code):
    return REGION_MAP.get(code, "Other")


def extract_address_parts(components):
    country_name = country_code = city = district = ""
    for comp in components:
        types = comp.get("types", [])
        text = comp.get("longText", comp.get("long_name", ""))
        if "country" in types:
            country_name = text
            country_code = comp.get("shortText", comp.get("short_name", ""))
        elif "locality" in types:
            city = text
        elif "administrative_area_level_1" in types and not city:
            city = text
        elif "sublocality_level_1" in types or "sublocality" in types:
            district = text
        elif "neighborhood" in types and not district:
            district = text
    return {"country": country_name, "country_code": country_code,
            "city": city, "district": district, "region": country_to_region(country_code)}


def extract_auto_tags(place_types):
    tmap = {
        "restaurant": "restaurant", "food": "food", "cafe": "cafe",
        "bar": "bar", "bakery": "bakery", "meal_takeaway": "takeaway",
        "park": "park", "natural_feature": "nature", "campground": "camping",
        "tourist_attraction": "attraction", "museum": "museum",
        "art_gallery": "gallery", "church": "church", "mosque": "mosque",
        "hindu_temple": "temple", "synagogue": "synagogue",
        "shopping_mall": "mall", "store": "shop", "lodging": "hotel", "spa": "spa",
        "amusement_park": "theme park", "zoo": "zoo", "aquarium": "aquarium",
        "beach": "beach", "harbor": "harbor",
    }
    return [tmap[t] for t in (place_types or []) if t in tmap][:5]


def extract_dining(place):
    d = []
    if place.get("dineIn"): d.append("dine-in")
    if place.get("delivery"): d.append("delivery")
    if place.get("curbsidePickup"): d.append("pickup")
    if place.get("reservable"): d.append("reservable")
    if place.get("outdoorSeating"): d.append("outdoor seating")
    return d


def extract_serves(place):
    s = []
    if place.get("servesBreakfast"): s.append("breakfast")
    if place.get("servesBrunch"): s.append("brunch")
    if place.get("servesLunch"): s.append("lunch")
    if place.get("servesDinner"): s.append("dinner")
    if place.get("servesBeer"): s.append("beer")
    if place.get("servesWine"): s.append("wine")
    if place.get("servesCocktails"): s.append("cocktails")
    if place.get("servesCoffee"): s.append("coffee")
    if place.get("servesDessert"): s.append("dessert")
    if place.get("servesVegetarianFood"): s.append("vegetarian")
    return s


def extract_amenities(place):
    a = []
    ao = place.get("accessibilityOptions", {})
    if ao.get("wheelchairAccessibleEntrance"): a.append("wheelchair accessible")
    if ao.get("wheelchairAccessibleRestroom"): a.append("accessible restroom")
    if ao.get("wheelchairAccessibleSeating"): a.append("accessible seating")
    if place.get("restroom"): a.append("restroom")
    if place.get("goodForChildren"): a.append("good for kids")
    if place.get("goodForGroups"): a.append("good for groups")
    if place.get("goodForWatchingSports"): a.append("sports viewing")
    if place.get("liveMusic"): a.append("live music")
    if place.get("allowsDogs"): a.append("dogs allowed")
    po = place.get("parkingOptions", {})
    if po.get("freeParking") or po.get("paidParking"): a.append("parking")
    return a


def extract_hours(place):
    roh = place.get("regularOpeningHours", {})
    descs = roh.get("weekdayDescriptions", [])
    if descs:
        return " | ".join(descs)
    return ""


def extract_open_now(place):
    coh = place.get("currentOpeningHours", {})
    if "openNow" in coh:
        return coh["openNow"]
    roh = place.get("regularOpeningHours", {})
    if "openNow" in roh:
        return roh["openNow"]
    return None


def extract_payment(place):
    po = place.get("paymentOptions", {})
    p = []
    if po.get("acceptsCreditCards"): p.append("credit card")
    if po.get("acceptsDebitCards"): p.append("debit card")
    if po.get("acceptsCashOnly"): p.append("cash only")
    if po.get("acceptsNfc"): p.append("NFC/contactless")
    return p


def extract_reviews(place):
    reviews = place.get("reviews", [])
    out = []
    for r in reviews[:3]:
        text = r.get("text", {})
        author = r.get("authorAttribution", {})
        out.append({
            "text": text.get("text", "") if isinstance(text, dict) else "",
            "rating": r.get("rating", 0),
            "author": author.get("displayName", ""),
            "time": r.get("relativePublishTimeDescription", ""),
        })
    return out


def extract_price_level(place):
    pl = place.get("priceLevel", "")
    m = {"PRICE_LEVEL_FREE": "Free", "PRICE_LEVEL_INEXPENSIVE": "$",
         "PRICE_LEVEL_MODERATE": "$$", "PRICE_LEVEL_EXPENSIVE": "$$$",
         "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$"}
    return m.get(pl, "")


# ── Google Places API ─────────────────────────────────────

SEARCH_FIELDS = ",".join([
    "places.id", "places.displayName", "places.formattedAddress",
    "places.location", "places.photos", "places.addressComponents",
    "places.types", "places.primaryTypeDisplayName", "places.googleMapsLinks",
    "places.internationalPhoneNumber", "places.websiteUri",
    "places.rating", "places.userRatingCount", "places.priceLevel",
    "places.regularOpeningHours", "places.currentOpeningHours",
    "places.editorialSummary",
    "places.dineIn", "places.delivery", "places.curbsidePickup",
    "places.reservable", "places.outdoorSeating",
    "places.servesBreakfast", "places.servesBrunch", "places.servesLunch",
    "places.servesDinner", "places.servesBeer", "places.servesWine",
    "places.servesCocktails", "places.servesCoffee", "places.servesDessert",
    "places.servesVegetarianFood",
    "places.accessibilityOptions", "places.restroom",
    "places.goodForChildren", "places.goodForGroups",
    "places.goodForWatchingSports", "places.liveMusic", "places.allowsDogs",
    "places.parkingOptions", "places.paymentOptions",
    "places.reviews",
])

# For Place Details (single place by ID), field names don't have "places." prefix
DETAIL_FIELDS = ",".join([
    "id", "displayName", "formattedAddress",
    "location", "photos", "addressComponents",
    "types", "primaryTypeDisplayName", "googleMapsLinks",
    "internationalPhoneNumber", "websiteUri",
    "rating", "userRatingCount", "priceLevel",
    "regularOpeningHours", "currentOpeningHours",
    "editorialSummary",
    "dineIn", "delivery", "curbsidePickup",
    "reservable", "outdoorSeating",
    "servesBreakfast", "servesBrunch", "servesLunch",
    "servesDinner", "servesBeer", "servesWine",
    "servesCocktails", "servesCoffee", "servesDessert",
    "servesVegetarianFood",
    "accessibilityOptions", "restroom",
    "goodForChildren", "goodForGroups",
    "goodForWatchingSports", "liveMusic", "allowsDogs",
    "parkingOptions", "paymentOptions",
    "reviews",
])


def parse_place(p):
    """Parse a Google Places API response object into our format."""
    loc = p.get("location", {})
    dn = p.get("displayName", {})
    addr = extract_address_parts(p.get("addressComponents", []))

    photo_url = ""
    photos = p.get("photos", [])
    if photos:
        pn = photos[0].get("name", "")
        if pn:
            photo_url = f"https://places.googleapis.com/v1/{pn}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"

    ml = p.get("googleMapsLinks", {})
    maps_url = ml.get("placeUri", "")
    if not maps_url:
        maps_url = f"https://www.google.com/maps/search/?api=1&query={dn.get('text','')}&query_place_id={p.get('id','')}"

    es = p.get("editorialSummary", {})
    ptdn = p.get("primaryTypeDisplayName", {})

    return {
        "google_place_id": p.get("id", ""),
        "name": dn.get("text", ""),
        "address": p.get("formattedAddress", ""),
        "country": addr["country"], "city": addr["city"],
        "district": addr["district"], "region": addr["region"],
        "lat": loc.get("latitude", 0), "lng": loc.get("longitude", 0),
        "photo": photo_url,
        "auto_tags": extract_auto_tags(p.get("types", [])),
        "place_type": ptdn.get("text", "") if isinstance(ptdn, dict) else "",
        "google_maps_url": maps_url,
        "phone": p.get("internationalPhoneNumber", ""),
        "website": p.get("websiteUri", ""),
        "rating": p.get("rating", 0),
        "rating_count": p.get("userRatingCount", 0),
        "price_level": extract_price_level(p),
        "hours": extract_hours(p),
        "open_now": extract_open_now(p),
        "editorial_summary": es.get("text", "") if isinstance(es, dict) else "",
        "dining": extract_dining(p),
        "serves": extract_serves(p),
        "amenities": extract_amenities(p),
        "payment": extract_payment(p),
        "reviews": extract_reviews(p),
    }


@app.get("/api/search")
async def search_places(q: str = Query(..., min_length=1)):
    if not GOOGLE_API_KEY:
        raise HTTPException(500, "Google Places API key not configured")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": SEARCH_FIELDS,
    }

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post("https://places.googleapis.com/v1/places:searchText",
                json={"textQuery": q, "maxResultCount": 5}, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(502, f"Google API error: {e.response.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(502, f"Request failed: {str(e)}")

    results = []
    for p in resp.json().get("places", []):
        results.append(parse_place(p))
    return {"results": results}


# ── Static map proxy ──────────────────────────────────────

@app.get("/api/staticmap")
async def static_map(lat: float, lng: float, zoom: int = 15, w: int = 600, h: int = 300):
    if not GOOGLE_API_KEY:
        raise HTTPException(500, "API key not configured")
    url = (f"https://maps.googleapis.com/maps/api/staticmap?"
           f"center={lat},{lng}&zoom={zoom}&size={w}x{h}"
           f"&markers=color:red|{lat},{lng}&key={GOOGLE_API_KEY}"
           f"&style=feature:all|saturation:-30")
    return RedirectResponse(url)


# ── Places CRUD ───────────────────────────────────────────

JSON_FIELDS = ["tags", "auto_tags", "dining", "serves", "amenities", "payment", "reviews"]

def row_to_place(row):
    d = dict(row)
    for f in JSON_FIELDS:
        d[f] = json.loads(d.get(f) or "[]")
    return d


@app.get("/api/places")
def list_places():
    conn = get_db()
    rows = conn.execute("SELECT * FROM places ORDER BY id DESC").fetchall()
    conn.close()
    return {"places": [row_to_place(r) for r in rows]}


@app.post("/api/places")
def create_place(place: PlaceCreate):
    conn = get_db()
    saved = place.saved or date.today().isoformat()
    cursor = conn.execute(
        """INSERT INTO places (name,address,country,city,district,region,lat,lng,
           photo,tags,auto_tags,notes,google_place_id,google_maps_url,
           phone,website,rating,rating_count,price_level,hours,
           editorial_summary,dining,serves,amenities,
           place_type,payment,reviews,saved)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (place.name, place.address, place.country, place.city, place.district,
         place.region, place.lat, place.lng, place.photo,
         json.dumps(place.tags), json.dumps(place.auto_tags),
         place.notes, place.google_place_id, place.google_maps_url,
         place.phone, place.website, place.rating, place.rating_count,
         place.price_level, place.hours, place.editorial_summary,
         json.dumps(place.dining), json.dumps(place.serves),
         json.dumps(place.amenities), place.place_type,
         json.dumps(place.payment), json.dumps(place.reviews), saved))
    conn.commit()
    row = conn.execute("SELECT * FROM places WHERE id=?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_place(row)


@app.put("/api/places/{place_id}")
def update_place(place_id: int, updates: PlaceUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "Place not found")
    fields, values = [], []
    if updates.name is not None: fields.append("name=?"); values.append(updates.name)
    if updates.tags is not None: fields.append("tags=?"); values.append(json.dumps(updates.tags))
    if updates.notes is not None: fields.append("notes=?"); values.append(updates.notes)
    if fields:
        values.append(place_id)
        conn.execute(f"UPDATE places SET {','.join(fields)} WHERE id=?", values)
        conn.commit()
    row = conn.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    conn.close()
    return row_to_place(row)


@app.delete("/api/places/{place_id}")
def delete_place(place_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "Place not found")
    conn.execute("DELETE FROM places WHERE id=?", (place_id,))
    conn.commit(); conn.close()
    return {"ok": True}


@app.post("/api/places/{place_id}/refresh")
async def refresh_place(place_id: int):
    if not GOOGLE_API_KEY:
        raise HTTPException(500, "Google Places API key not configured")
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "Place not found")
    place = dict(row)
    gid = place.get("google_place_id", "")
    if not gid: conn.close(); raise HTTPException(400, "No Google Place ID stored")

    # Fetch fresh data from Google Places API (New)
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": DETAIL_FIELDS,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"https://places.googleapis.com/v1/places/{gid}", headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            conn.close()
            raise HTTPException(502, f"Google API error: {e.response.status_code}")
        except httpx.RequestError as e:
            conn.close()
            raise HTTPException(502, f"Request failed: {str(e)}")

    fresh = parse_place(resp.json())

    # Preserve user data: tags, notes, saved date
    tags = json.loads(place.get("tags") or "[]")
    notes = place.get("notes", "")
    saved = place.get("saved", "")

    conn.execute(
        """UPDATE places SET name=?,address=?,country=?,city=?,district=?,region=?,
           lat=?,lng=?,photo=?,auto_tags=?,google_maps_url=?,
           phone=?,website=?,rating=?,rating_count=?,price_level=?,hours=?,
           editorial_summary=?,dining=?,serves=?,amenities=?,
           place_type=?,payment=?,reviews=?
           WHERE id=?""",
        (fresh["name"], fresh["address"], fresh["country"], fresh["city"],
         fresh["district"], fresh["region"], fresh["lat"], fresh["lng"],
         fresh["photo"], json.dumps(fresh["auto_tags"]), fresh["google_maps_url"],
         fresh["phone"], fresh["website"], fresh["rating"], fresh["rating_count"],
         fresh["price_level"], fresh["hours"], fresh["editorial_summary"],
         json.dumps(fresh["dining"]), json.dumps(fresh["serves"]),
         json.dumps(fresh["amenities"]), fresh["place_type"],
         json.dumps(fresh["payment"]), json.dumps(fresh["reviews"]),
         place_id))
    conn.commit()
    row = conn.execute("SELECT * FROM places WHERE id=?", (place_id,)).fetchone()
    conn.close()
    return row_to_place(row)


# ── Routes CRUD ───────────────────────────────────────────

def row_to_route(row):
    d = dict(row)
    d["stops"] = json.loads(d["stops"]) if d["stops"] else []
    return d


def build_route_url(places):
    if len(places) == 0: return ""
    if len(places) == 1:
        return f"https://www.google.com/maps/search/?api=1&query={places[0]['lat']},{places[0]['lng']}"
    o = f"{places[0]['lat']},{places[0]['lng']}"
    d = f"{places[-1]['lat']},{places[-1]['lng']}"
    url = f"https://www.google.com/maps/dir/?api=1&origin={o}&destination={d}&travelmode=driving"
    if len(places) > 2:
        url += "&waypoints=" + "|".join(f"{p['lat']},{p['lng']}" for p in places[1:-1])
    return url


@app.get("/api/routes")
def list_routes():
    conn = get_db()
    rows = conn.execute("SELECT * FROM routes ORDER BY updated DESC").fetchall()
    routes = []
    for row in rows:
        r = row_to_route(row)
        # Fetch stop details
        if r["stops"]:
            ph = ",".join("?" * len(r["stops"]))
            place_rows = conn.execute(f"SELECT id,name,photo,lat,lng,country,city FROM places WHERE id IN ({ph})", r["stops"]).fetchall()
            pm = {dict(p)["id"]: dict(p) for p in place_rows}
            r["stop_details"] = [pm[sid] for sid in r["stops"] if sid in pm]
        else:
            r["stop_details"] = []
        routes.append(r)
    conn.close()
    return {"routes": routes}


@app.post("/api/routes")
def create_route(route: RouteCreate):
    conn = get_db()
    now = date.today().isoformat()
    # Build URL from stop coordinates
    if route.stops:
        ph = ",".join("?" * len(route.stops))
        rows = conn.execute(f"SELECT id,lat,lng FROM places WHERE id IN ({ph})", route.stops).fetchall()
        pm = {dict(r)["id"]: dict(r) for r in rows}
        ordered = [pm[sid] for sid in route.stops if sid in pm]
        url = build_route_url(ordered)
    else:
        url = ""
    cursor = conn.execute(
        "INSERT INTO routes (name,stops,route_url,created,updated) VALUES (?,?,?,?,?)",
        (route.name, json.dumps(route.stops), url, now, now))
    conn.commit()
    row = conn.execute("SELECT * FROM routes WHERE id=?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_route(row)


@app.put("/api/routes/{route_id}")
def update_route(route_id: int, updates: RouteUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM routes WHERE id=?", (route_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "Route not found")
    now = date.today().isoformat()
    fields, values = ["updated=?"], [now]
    if updates.name is not None: fields.append("name=?"); values.append(updates.name)
    if updates.stops is not None:
        fields.append("stops=?"); values.append(json.dumps(updates.stops))
        # Rebuild URL
        ph = ",".join("?" * len(updates.stops))
        rows = conn.execute(f"SELECT id,lat,lng FROM places WHERE id IN ({ph})", updates.stops).fetchall()
        pm = {dict(r)["id"]: dict(r) for r in rows}
        ordered = [pm[sid] for sid in updates.stops if sid in pm]
        fields.append("route_url=?"); values.append(build_route_url(ordered))
    values.append(route_id)
    conn.execute(f"UPDATE routes SET {','.join(fields)} WHERE id=?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM routes WHERE id=?", (route_id,)).fetchone()
    conn.close()
    return row_to_route(row)


@app.delete("/api/routes/{route_id}")
def delete_route(route_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM routes WHERE id=?", (route_id,)).fetchone()
    if not row: conn.close(); raise HTTPException(404, "Route not found")
    conn.execute("DELETE FROM routes WHERE id=?", (route_id,))
    conn.commit(); conn.close()
    return {"ok": True}


# ── Serve frontend ────────────────────────────────────────

if Path(STATIC_DIR).exists():
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        fp = Path(STATIC_DIR) / full_path
        if fp.is_file(): return FileResponse(fp)
        return FileResponse(f"{STATIC_DIR}/index.html")
