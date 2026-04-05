import os
import json
import httpx
import sqlite3
from pathlib import Path
from datetime import date
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

DB_PATH = os.environ.get("DB_PATH", "/data/wanderlust.db")
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
            saved TEXT NOT NULL
        )
    """)
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
    saved: str = ""


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Travel", lifespan=lifespan)


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


@app.get("/api/search")
async def search_places(q: str = Query(..., min_length=1)):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.addressComponents,places.types,places.googleMapsLinks",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post("https://places.googleapis.com/v1/places:searchText",
                json={"textQuery": q, "maxResultCount": 5}, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Google API error: {e.response.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Request failed: {str(e)}")

    results = []
    for place in resp.json().get("places", []):
        loc = place.get("location", {})
        dn = place.get("displayName", {})
        addr = extract_address_parts(place.get("addressComponents", []))
        photos = place.get("photos", [])
        photo_url = ""
        if photos:
            pn = photos[0].get("name", "")
            if pn: photo_url = f"https://places.googleapis.com/v1/{pn}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"

        ml = place.get("googleMapsLinks", {})
        maps_url = ml.get("placeUri", "")
        if not maps_url:
            maps_url = f"https://www.google.com/maps/search/?api=1&query={dn.get('text','')}&query_place_id={place.get('id','')}"

        results.append({
            "google_place_id": place.get("id", ""), "name": dn.get("text", ""),
            "address": place.get("formattedAddress", ""),
            "country": addr["country"], "city": addr["city"],
            "district": addr["district"], "region": addr["region"],
            "lat": loc.get("latitude", 0), "lng": loc.get("longitude", 0),
            "photo": photo_url, "auto_tags": extract_auto_tags(place.get("types", [])),
            "google_maps_url": maps_url,
        })
    return {"results": results}


def row_to_place(row):
    d = dict(row)
    d["tags"] = json.loads(d["tags"]) if d["tags"] else []
    d["auto_tags"] = json.loads(d.get("auto_tags") or "[]")
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
           photo,tags,auto_tags,notes,google_place_id,google_maps_url,saved)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (place.name, place.address, place.country, place.city, place.district,
         place.region, place.lat, place.lng, place.photo,
         json.dumps(place.tags), json.dumps(place.auto_tags),
         place.notes, place.google_place_id, place.google_maps_url, saved))
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


if Path(STATIC_DIR).exists():
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        fp = Path(STATIC_DIR) / full_path
        if fp.is_file(): return FileResponse(fp)
        return FileResponse(f"{STATIC_DIR}/index.html")
