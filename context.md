# Travel App — context.md

## Purpose
Multi-user travel wishlist. Save places → auto-categorise → browse & filter → loosely route → open in Google Maps. Not a trip planner.

## Stack
- **Backend:** FastAPI + SQLite (`app/main.py`, ~980 lines)
- **Frontend:** React + Vite (single-file components, inline styles)
- **External:** Google Places API (New) — search, details, refresh, static maps, nearby transit
- **Auth:** Cookie-based sessions, PBKDF2-SHA256 password hashing, 90-day expiry
- **Deploy:** Docker, multi-user, per-user data isolation

## File Structure
```
app/
  main.py                    # All backend logic, API routes, DB schema, auth
  ui/
    src/
      shared.jsx             # Colours (C), icons (Icon), Tags, ActionPill, InfoRow, INTENTS
      App.jsx                # Auth gate, layout orchestrator, all state, desktop + mobile layouts
      components/
        Sidebar.jsx          # Browse by intent, region, user tags (desktop only)
        PlaceList.jsx         # Scrollable list grouped by city, swipe gestures (mobile)
        DetailPanel.jsx       # Place detail (desktop right panel)
        MobileDetail.jsx      # Place detail (mobile full-screen)
        SearchDropdown.jsx    # Search saved + Google Places, inline save button
        EditModal.jsx         # Edit name, tags, notes
        RouteList.jsx         # Saved routes list
        RouteDetail.jsx       # Route timeline with travel durations between stops
        RoutePlanner.jsx      # Create/edit routes (add stops, reorder)
        SettingsPage.jsx      # Account, import/export, API status, danger zone
        MobileNav.jsx         # Bottom tab bar (mobile)
```

## Database Schema

### users
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| username | TEXT UNIQUE | Lowercase, used for login |
| display_name | TEXT | Shown in UI |
| password | TEXT | PBKDF2-SHA256 hash with salt |
| color | TEXT | Avatar background colour hex |
| created | TEXT | ISO date |

### sessions
| Field | Type | Notes |
|-------|------|-------|
| token | TEXT PK | 64-char hex token |
| user_id | INTEGER FK | References users.id |
| created | TEXT | ISO date |

### places
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| id | INTEGER PK | auto | |
| user_id | INTEGER | auth | Scopes data per user |
| name, address | TEXT | Google | |
| country, city, district, region | TEXT | Google | Extracted from address components |
| lat, lng | REAL | Google | |
| photo | TEXT | Google | Photo URL |
| google_place_id | TEXT | Google | Required for refresh |
| google_maps_url | TEXT | Google | Direct Maps link |
| phone, website | TEXT | Google | |
| rating | REAL | Google | 1.0–5.0 |
| rating_count | INTEGER | Google | |
| price_level | TEXT | Google | Free / $ / $$ / $$$ / $$$$ |
| hours | TEXT | Google | Pipe-delimited hours string |
| editorial_summary | TEXT | Google | |
| place_type | TEXT | Google | Raw Google type |
| intent | TEXT | Derived | Auto-classified: eat, drink, see, do, shop, goout, stay, services |
| cuisine | TEXT | Derived | For "eat" only: Japanese, Italian, etc. |
| sub_type | TEXT | Derived | Museum, Bar, Park, Mall, Hotel, etc. |
| tags | JSON[] | User | User-applied: "date night", "must visit", etc. |
| auto_tags | JSON[] | Derived | From Google types |
| notes | TEXT | User | Free-text |
| dining | JSON[] | Google | dine-in, delivery, outdoor seating |
| serves | JSON[] | Google | breakfast, lunch, beer, wine, coffee, etc. |
| amenities | JSON[] | Google | wheelchair, restroom, good for kids, etc. |
| payment | JSON[] | Google | credit card, NFC, etc. |
| reviews | JSON[] | Google | Top 3: {author, rating, text, time} |
| saved | TEXT | System | ISO date |

### routes
| Field | Type | Notes |
|-------|------|-------|
| id | INTEGER PK | |
| user_id | INTEGER | Scopes data per user |
| name | TEXT | User-editable |
| stops | JSON[] | Ordered place IDs |
| route_url | TEXT | Generated Google Maps directions URL |
| created, updated | TEXT | ISO dates |

## API Endpoints

All data endpoints are scoped by user_id from session cookie.

### Auth
| Method | Path | What |
|--------|------|------|
| POST | /api/auth/register | Create account (username, password, display_name) |
| POST | /api/auth/login | Login, sets session cookie |
| POST | /api/auth/logout | Clear session |
| GET | /api/auth/me | Current user or null |
| PATCH | /api/auth/me | Update display_name, color |

### Places
| Method | Path | What |
|--------|------|------|
| GET | /api/places | List user's places |
| POST | /api/places | Save new place |
| PUT | /api/places/{id} | Update fields |
| DELETE | /api/places/{id} | Delete |
| POST | /api/places/{id}/refresh | Re-fetch from Google |
| GET | /api/places/{id}/highlights | AI-extracted review highlights |
| GET | /api/search?q= | Search Google Places |
| GET | /api/staticmap | Proxy Google Static Maps |
| GET | /api/nearby-transit | Nearby MRT/LRT/bus/train stations |

### Routes
| Method | Path | What |
|--------|------|------|
| GET | /api/routes | List user's routes (includes travel durations) |
| POST | /api/routes | Create route |
| PUT | /api/routes/{id} | Update route |
| DELETE | /api/routes/{id} | Delete route |

### Data
| Method | Path | What |
|--------|------|------|
| GET | /api/export/json | Export all user data |
| GET | /api/export/csv | Export places as CSV |
| GET | /api/export/kml | Export as KML |
| POST | /api/import/json | Import JSON backup |
| POST | /api/import/csv | Import CSV |
| POST | /api/import/kml | Import KML |
| POST | /api/import/geojson | Import Google Takeout |
| DELETE | /api/data/all | Delete all user's data |
| GET | /api/stats | User's place/route/cuisine/city counts |

## Desktop Layout (3-column)
```
┌──────────────────────────────────────────────────────────┐
│ Logo    Search (flex)              [Places|Routes] ⚙ (R) │
├─────────┬──────────┬─────────────────────────────────────┤
│ Sidebar │ List     │ Detail Panel                         │
│ (248px) │ (340px)  │ (flex)                               │
│         │          │                                      │
│ Browse  │ City grp │ Map preview, name, rating             │
│  Eat 4  │ Place 1  │ Action pills (Directions, Share, etc) │
│  See 1  │ Place 2  │ Tags, info grid (2-col)               │
│         │          │ Why this place (highlights)            │
│ Region  │          │ Getting there (2-col, clickable)       │
│ Tags    │          │ Notes, saved date                      │
└─────────┴──────────┴─────────────────────────────────────┘
```

Search bar stretches to fill. Tabs + settings + avatar grouped flush-right.

## Mobile Layout
- Pill search bar + avatar (taps to settings)
- Horizontal intent chips for filtering
- Place list with swipe gestures: left → delete, right → edit
- Long-press (500ms) enters multi-select mode
- FAB (+) on both Places and Routes views
- Full-screen detail view with bottom sheet menu
- Bottom tab nav: Places, Routes, Settings
- Back button handles: search → detail → route detail → route planner

## Key Interactions

### Search & Save
Single-row inline save: Google result row shows "+ Save" pill button. One tap saves with auto-classification. No tag picker step — tags added later via Edit.

### Getting There
Nearby transit (MRT, LRT, Bus, Train) shown in 2-column grid on desktop, single-column on mobile. Each station is clickable — opens Google Maps walking directions from station to destination. Search types: subway_station, light_rail_station, transit_station, bus_station, bus_stop. Bus stops use tighter 800m radius; rail uses 1500m.

### Route Durations
Routes show haversine-estimated travel time between consecutive stops (drive minutes, walk minutes, distance). Displayed inline in the timeline between stop dots.

### Detail Panel Info
Address and phone are clickable (Maps link, tel: link). Website already linked. Info section uses 2-column grid: left = hours/address/phone/website, right = amenities/payment/dining/serves.

## Intent Categories

Auto-classified from Google `types[]`. Sidebar hides categories with 0 places.

| Intent | Key | Triggered by |
|--------|-----|-------------|
| Eat | eat | restaurant, food, cafe, bakery, meal_takeaway, meal_delivery |
| Drink | drink | bar, night_club, liquor_store |
| See | see | museum, art_gallery, church, mosque, hindu_temple, synagogue, tourist_attraction |
| Do | do | park, natural_feature, campground, amusement_park, zoo, aquarium, beach, stadium, gym, bowling_alley, movie_theater, casino |
| Shop | shop | shopping_mall, store, clothing_store, book_store, jewelry_store, shoe_store, electronics_store, furniture_store |
| Go out | goout | social venues, night_club overlap |
| Stay | stay | lodging, rv_park |
| Services | services | spa, beauty_salon, hair_care, laundry, car_repair, dentist, doctor, hospital, pharmacy, bank, atm, etc. |

## Design Principles

1. Google Material feel — sizing, spacing, colours, interaction patterns
2. Auto-classify, don't ask — intent/cuisine/sub_type derived from Google types
3. Tags are the user's layer — only manual classification
4. Routes are loose — ordered stops + travel estimates + "open in Maps"
5. Mobile-first interaction, desktop-first density
6. Every info piece is actionable — addresses link to Maps, phones to dialer, transit to walking directions
7. Consistent design language — FAB for adding on both views, swipe for list actions
8. Minimum font anywhere: 11px

## Pending / Planned

- Change password (inline expand form in Settings)
- Change username
- Delete account
- Email field + notifications (requires SMTP config)
