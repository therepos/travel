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


# ── Database ──────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
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
    conn.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            stops TEXT DEFAULT '[]',
            created TEXT NOT NULL,
            updated TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# ── Models ────────────────────────────────────────────────

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
    region: Optional[str] = None
    city: Optional[str] = None


class TripCreate(BaseModel):
    name: str
    location: str = ""
    notes: str = ""
    stops: list[int] = []  # ordered list of place IDs


class TripUpdate(BaseModel):
    name: Optional[str] = None
    notes: Optional[str] = None
    stops: Optional[list[int]] = None


# ── App ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Wanderlust", lifespan=lifespan)


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
    "TT": "North America", "BS": "North America", "BB": "North America",
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


def country_to_region(code: str) -> str:
    return REGION_MAP.get(code, "Other")


def extract_address_parts(components: list) -> dict:
    """Extract country, city, district from address components."""
    country_name = ""
    country_code = ""
    city = ""
    district = ""
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
    return {
        "country": country_name,
        "country_code": country_code,
        "city": city,
        "district": district,
        "region": country_to_region(country_code),
    }


def extract_auto_tags(place_types: list) -> list[str]:
    """Convert Google place types to readable auto-tags."""
    type_map = {
        "restaurant": "restaurant", "food": "food", "cafe": "cafe",
        "bar": "bar", "bakery": "bakery", "meal_takeaway": "takeaway",
        "park": "park", "natural_feature": "nature", "campground": "camping",
        "tourist_attraction": "attraction", "museum": "museum",
        "art_gallery": "gallery", "church": "church", "mosque": "mosque",
        "hindu_temple": "temple", "synagogue": "synagogue",
        "shopping_mall": "mall", "store": "shop",
        "lodging": "hotel", "spa": "spa",
        "amusement_park": "theme park", "zoo": "zoo", "aquarium": "aquarium",
        "stadium": "stadium", "gym": "gym",
        "airport": "airport", "train_station": "station",
        "beach": "beach", "harbor": "harbor",
    }
    tags = []
    for t in (place_types or []):
        if t in type_map and type_map[t] not in tags:
            tags.append(type_map[t])
    return tags[:5]


# ── Google Places API ─────────────────────────────────────

@app.get("/api/search")
async def search_places(q: str = Query(..., min_length=1)):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": ",".join([
            "places.id", "places.displayName", "places.formattedAddress",
            "places.location", "places.photos", "places.addressComponents",
            "places.types", "places.googleMapsLinks",
        ]),
    }
    body = {"textQuery": q, "maxResultCount": 5}

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.post(url, json=body, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=502, detail=f"Google API error: {e.response.status_code}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Request failed: {str(e)}")

    data = resp.json()
    results = []

    for place in data.get("places", []):
        location = place.get("location", {})
        display_name = place.get("displayName", {})
        components = place.get("addressComponents", [])
        addr_parts = extract_address_parts(components)
        auto_tags = extract_auto_tags(place.get("types", []))

        # Photo URL
        photo_url = ""
        photos = place.get("photos", [])
        if photos:
            photo_name = photos[0].get("name", "")
            if photo_name:
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"

        # Google Maps URL
        maps_links = place.get("googleMapsLinks", {})
        maps_url = maps_links.get("placeUri", "")
        if not maps_url:
            pid = place.get("id", "")
            name = display_name.get("text", "")
            maps_url = f"https://www.google.com/maps/search/?api=1&query={name}&query_place_id={pid}"

        results.append({
            "google_place_id": place.get("id", ""),
            "name": display_name.get("text", ""),
            "address": place.get("formattedAddress", ""),
            "country": addr_parts["country"],
            "city": addr_parts["city"],
            "district": addr_parts["district"],
            "region": addr_parts["region"],
            "lat": location.get("latitude", 0),
            "lng": location.get("longitude", 0),
            "photo": photo_url,
            "auto_tags": auto_tags,
            "google_maps_url": maps_url,
        })

    return {"results": results}


# ── Places CRUD ───────────────────────────────────────────

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
        """INSERT INTO places (name, address, country, city, district, region, lat, lng,
           photo, tags, auto_tags, notes, google_place_id, google_maps_url, saved)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (place.name, place.address, place.country, place.city, place.district,
         place.region, place.lat, place.lng, place.photo,
         json.dumps(place.tags), json.dumps(place.auto_tags),
         place.notes, place.google_place_id, place.google_maps_url, saved),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_place(row)


@app.put("/api/places/{place_id}")
def update_place(place_id: int, updates: PlaceUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Place not found")

    fields, values = [], []
    if updates.name is not None: fields.append("name = ?"); values.append(updates.name)
    if updates.tags is not None: fields.append("tags = ?"); values.append(json.dumps(updates.tags))
    if updates.notes is not None: fields.append("notes = ?"); values.append(updates.notes)
    if updates.region is not None: fields.append("region = ?"); values.append(updates.region)
    if updates.city is not None: fields.append("city = ?"); values.append(updates.city)

    if fields:
        values.append(place_id)
        conn.execute(f"UPDATE places SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    conn.close()
    return row_to_place(row)


@app.delete("/api/places/{place_id}")
def delete_place(place_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Place not found")
    conn.execute("DELETE FROM places WHERE id = ?", (place_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ── Trips CRUD ────────────────────────────────────────────

def row_to_trip(row):
    d = dict(row)
    d["stops"] = json.loads(d["stops"]) if d["stops"] else []
    return d


@app.get("/api/trips")
def list_trips():
    conn = get_db()
    rows = conn.execute("SELECT * FROM trips ORDER BY updated DESC").fetchall()
    conn.close()
    return {"trips": [row_to_trip(r) for r in rows]}


@app.get("/api/trips/{trip_id}")
def get_trip(trip_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    trip = row_to_trip(row)

    # Fetch place details for each stop
    if trip["stops"]:
        placeholders = ",".join("?" * len(trip["stops"]))
        place_rows = conn.execute(
            f"SELECT * FROM places WHERE id IN ({placeholders})", trip["stops"]
        ).fetchall()
        place_map = {row_to_place(r)["id"]: row_to_place(r) for r in place_rows}
        trip["stop_details"] = [place_map.get(sid) for sid in trip["stops"] if place_map.get(sid)]
    else:
        trip["stop_details"] = []

    conn.close()
    return trip


@app.post("/api/trips")
def create_trip(trip: TripCreate):
    conn = get_db()
    now = date.today().isoformat()
    cursor = conn.execute(
        "INSERT INTO trips (name, location, notes, stops, created, updated) VALUES (?, ?, ?, ?, ?, ?)",
        (trip.name, trip.location, trip.notes, json.dumps(trip.stops), now, now),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_trip(row)


@app.put("/api/trips/{trip_id}")
def update_trip(trip_id: int, updates: TripUpdate):
    conn = get_db()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    fields, values = ["updated = ?"], [date.today().isoformat()]
    if updates.name is not None: fields.append("name = ?"); values.append(updates.name)
    if updates.notes is not None: fields.append("notes = ?"); values.append(updates.notes)
    if updates.stops is not None: fields.append("stops = ?"); values.append(json.dumps(updates.stops))

    values.append(trip_id)
    conn.execute(f"UPDATE trips SET {', '.join(fields)} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    conn.close()
    return row_to_trip(row)


@app.delete("/api/trips/{trip_id}")
def delete_trip(trip_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")
    conn.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


@app.get("/api/trips/{trip_id}/route-url")
def get_trip_route_url(trip_id: int):
    """Generate a Google Maps multi-stop directions URL for a trip."""
    conn = get_db()
    row = conn.execute("SELECT * FROM trips WHERE id = ?", (trip_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Trip not found")

    trip = row_to_trip(row)
    if not trip["stops"]:
        conn.close()
        return {"url": None}

    placeholders = ",".join("?" * len(trip["stops"]))
    place_rows = conn.execute(
        f"SELECT * FROM places WHERE id IN ({placeholders})", trip["stops"]
    ).fetchall()
    place_map = {dict(r)["id"]: dict(r) for r in place_rows}
    conn.close()

    ordered = [place_map[sid] for sid in trip["stops"] if sid in place_map]
    if len(ordered) == 0:
        return {"url": None}
    if len(ordered) == 1:
        p = ordered[0]
        return {"url": f"https://www.google.com/maps/search/?api=1&query={p['lat']},{p['lng']}"}

    origin = f"{ordered[0]['lat']},{ordered[0]['lng']}"
    dest = f"{ordered[-1]['lat']},{ordered[-1]['lng']}"
    url = f"https://www.google.com/maps/dir/?api=1&origin={origin}&destination={dest}&travelmode=driving"
    if len(ordered) > 2:
        waypoints = "|".join(f"{p['lat']},{p['lng']}" for p in ordered[1:-1])
        url += f"&waypoints={waypoints}"
    return {"url": url}


# ── Serve frontend ────────────────────────────────────────

if Path(STATIC_DIR).exists():
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = Path(STATIC_DIR) / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(f"{STATIC_DIR}/index.html")
