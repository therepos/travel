import os
import httpx
import sqlite3
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional

DB_PATH = os.environ.get("DB_PATH", "/data/travel.db")
GOOGLE_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
STATIC_DIR = os.environ.get("STATIC_DIR", "/app/frontend/dist")


# ── Database ──────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
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
            region TEXT DEFAULT '',
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            photo TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            notes TEXT DEFAULT '',
            google_place_id TEXT DEFAULT '',
            saved TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


# ── Models ────────────────────────────────────────────────

class PlaceCreate(BaseModel):
    name: str
    address: str = ""
    country: str = ""
    region: str = ""
    lat: float
    lng: float
    photo: str = ""
    tags: list[str] = []
    notes: str = ""
    google_place_id: str = ""
    saved: str = ""


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    tags: Optional[list[str]] = None
    notes: Optional[str] = None
    region: Optional[str] = None


# ── App ───────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="travel", lifespan=lifespan)


# ── Google Places API ─────────────────────────────────────

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


def country_to_region(country_code: str) -> str:
    return REGION_MAP.get(country_code, "Other")


def extract_country_info(address_components: list) -> tuple[str, str, str]:
    """Extract country name, country code, and region from address components."""
    country_name = ""
    country_code = ""
    for comp in address_components:
        types = comp.get("types", [])
        if "country" in types:
            country_name = comp.get("longText", comp.get("long_name", ""))
            country_code = comp.get("shortText", comp.get("short_name", ""))
            break
    region = country_to_region(country_code)
    return country_name, country_code, region


@app.get("/api/search")
async def search_places(q: str = Query(..., min_length=1)):
    """Search for places using Google Places API Text Search (New)."""
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API key not configured")

    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.photos,places.addressComponents",
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
        address_components = place.get("addressComponents", [])
        country_name, country_code, region = extract_country_info(address_components)

        # Build photo URL (first photo)
        photo_url = ""
        photos = place.get("photos", [])
        if photos:
            photo_name = photos[0].get("name", "")
            if photo_name:
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxWidthPx=800&key={GOOGLE_API_KEY}"

        results.append({
            "google_place_id": place.get("id", ""),
            "name": display_name.get("text", ""),
            "address": place.get("formattedAddress", ""),
            "country": country_name,
            "country_code": country_code,
            "region": region,
            "lat": location.get("latitude", 0),
            "lng": location.get("longitude", 0),
            "photo": photo_url,
        })

    return {"results": results}


# ── CRUD ──────────────────────────────────────────────────

@app.get("/api/places")
def list_places(
    region: Optional[str] = None,
    tag: Optional[str] = None,
    q: Optional[str] = None,
):
    conn = get_db()
    rows = conn.execute("SELECT * FROM places ORDER BY id DESC").fetchall()
    conn.close()

    places = []
    for row in rows:
        place = dict(row)
        place["tags"] = json.loads(place["tags"]) if place["tags"] else []

        if region and place["region"] != region:
            continue
        if tag and tag not in place["tags"]:
            continue
        if q and q.lower() not in place["name"].lower() and q.lower() not in place["country"].lower():
            continue

        places.append(place)

    return {"places": places}


@app.post("/api/places")
def create_place(place: PlaceCreate):
    import json as _json
    from datetime import date

    conn = get_db()
    saved = place.saved or date.today().isoformat()
    cursor = conn.execute(
        """INSERT INTO places (name, address, country, region, lat, lng, photo, tags, notes, google_place_id, saved)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (place.name, place.address, place.country, place.region,
         place.lat, place.lng, place.photo,
         _json.dumps(place.tags), place.notes, place.google_place_id, saved),
    )
    conn.commit()
    place_id = cursor.lastrowid

    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    conn.close()

    result = dict(row)
    result["tags"] = _json.loads(result["tags"])
    return result


@app.put("/api/places/{place_id}")
def update_place(place_id: int, updates: PlaceUpdate):
    import json as _json

    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Place not found")

    fields = []
    values = []
    if updates.name is not None:
        fields.append("name = ?")
        values.append(updates.name)
    if updates.tags is not None:
        fields.append("tags = ?")
        values.append(_json.dumps(updates.tags))
    if updates.notes is not None:
        fields.append("notes = ?")
        values.append(updates.notes)
    if updates.region is not None:
        fields.append("region = ?")
        values.append(updates.region)

    if fields:
        values.append(place_id)
        conn.execute(f"UPDATE places SET {', '.join(fields)} WHERE id = ?", values)
        conn.commit()

    row = conn.execute("SELECT * FROM places WHERE id = ?", (place_id,)).fetchone()
    conn.close()

    result = dict(row)
    result["tags"] = _json.loads(result["tags"])
    return result


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


# ── Serve frontend ────────────────────────────────────────

import json

if Path(STATIC_DIR).exists():
    app.mount("/assets", StaticFiles(directory=f"{STATIC_DIR}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = Path(STATIC_DIR) / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(f"{STATIC_DIR}/index.html")
