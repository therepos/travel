# Travel App — context.md

## Purpose
Travel place organiser for busy people. Save → categorise → loosely route. Not a planner.

## Stack
- **Backend:** FastAPI + SQLite (`app/main.py`, ~660 lines)
- **Frontend:** React + Vite (single-file components, inline styles)
- **External:** Google Places API (New) — search, details, refresh, static maps
- **Deploy:** Docker, single-user, no auth

## File Structure
```
app/
  main.py                    # All backend logic, API routes, DB schema
  ui/
    src/
      shared.jsx             # Colours (C), icons (Icon), Tags, ActionPill, InfoRow, INTENTS
      App.jsx                # Layout orchestrator, all state, desktop + mobile layouts
      components/
        Sidebar.jsx          # Browse by intent, nav, region, user tags
        PlaceList.jsx         # Scrollable list grouped by city
        DetailPanel.jsx       # Place detail (desktop right panel)
        MobileDetail.jsx      # Place detail (mobile full-screen)
        SearchDropdown.jsx    # Search saved + Google Places, tag & save flow
        EditModal.jsx         # Edit name, tags, notes
        RouteList.jsx         # Saved routes list
        RouteDetail.jsx       # Route timeline view
        RoutePlanner.jsx      # Create/edit routes (add stops, reorder)
        SettingsPage.jsx      # Import/export, settings
        MobileNav.jsx         # Bottom tab bar (mobile)
```

## Database Schema

### places
| Field | Type | Source | Notes |
|-------|------|--------|-------|
| id | INTEGER PK | auto | |
| name, address | TEXT | Google | |
| country, city, district, region | TEXT | Google | Extracted from address components. Region used for sidebar grouping |
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
| name | TEXT | User-editable |
| stops | JSON[] | Ordered place IDs |
| route_url | TEXT | Generated Google Maps directions URL |
| created, updated | TEXT | ISO dates |

## Intent Categories

Auto-classified from Google `types[]`. Sidebar hides categories with 0 places.

| Intent | Key | Triggered by |
|--------|-----|-------------|
| Eat | eat | restaurant, food, cafe, bakery, meal_takeaway, meal_delivery |
| Drink | drink | bar, night_club, liquor_store |
| See | see | museum, art_gallery, church, mosque, hindu_temple, synagogue, tourist_attraction |
| Do | do | park, natural_feature, campground, amusement_park, zoo, aquarium, beach, stadium, gym, bowling_alley, movie_theater, casino |
| Shop | shop | shopping_mall, store, clothing_store, book_store, jewelry_store, shoe_store, electronics_store, furniture_store |
| Go out | goout | (social venues — night_club overlap) |
| Stay | stay | lodging, rv_park |
| Services | services | spa, beauty_salon, hair_care, laundry, car_repair, dentist, doctor, hospital, pharmacy, bank, atm, etc. |

Cuisine sub-classification (eat only): Japanese, Chinese, Korean, Thai, Vietnamese, Indian, Mexican, Italian, French, Seafood, BBQ, Steakhouse, Vegan, Vegetarian, + ~20 more.

Sub-type classification (non-eat): Cafe, Bar, Club, Museum, Gallery, Park, Beach, Mall, Hotel, Spa, etc.

## API Endpoints

| Method | Path | What |
|--------|------|------|
| GET | /api/places | List all |
| POST | /api/places | Save new place |
| PATCH | /api/places/{id} | Update fields |
| DELETE | /api/places/{id} | Delete |
| POST | /api/places/{id}/refresh | Re-fetch from Google |
| GET | /api/search?q= | Search Google Places |
| GET | /api/routes | List routes |
| POST | /api/routes | Create route |
| PUT | /api/routes/{id} | Update route |
| DELETE | /api/routes/{id} | Delete route |
| GET | /api/staticmap | Proxy Google Static Maps |
| POST | /api/import | Import JSON/CSV |
| GET | /api/export | Export all data |

## Desktop Layout (3-column)
```
┌──────────────────────────────────────────────────────┐
│ Top Bar (64px) — Logo + Search (46px) + Settings     │
├─────────┬──────────┬─────────────────────────────────┤
│ Sidebar │ List     │ Detail Panel                     │
│ (248px) │ (340px)  │ (flex)                           │
│         │          │                                  │
│ Browse  │ City grp │ Map preview (200px)              │
│  Eat 4  │ Place 1  │ Name, rating, hours              │
│  See 1  │ Place 2  │ Action pills                     │
│         │          │ Tags, info, amenities             │
│ Nav     │          │ Popular / Reviews                 │
│ Region  │          │ Notes                             │
│ Tags    │          │                                  │
└─────────┴──────────┴─────────────────────────────────┘
```

Mobile: bottom tab nav, intent chips, full-screen detail, FAB to add.

## Sizing Targets (Google Material alignment)

| Element | Value |
|---------|-------|
| Top bar | 64px height |
| Search bar | 46px, 15px font |
| Sidebar | 248px wide, 14px nav items, 20px icons |
| List panel | 340px wide, 14px names, 48px thumbnails |
| Detail title | 20px |
| Action pills | 13px, 8px 16px padding |
| Tags | 12px, 4px 10px padding |
| Section headers | 11px uppercase |
| **Minimum font anywhere** | **11px** |

## Design Principles

1. Efficient not exhaustive — show what helps decide "should I go here?"
2. Google Material feel — sizing, spacing, colours
3. Auto-classify, don't ask — intent/cuisine derived from Google types
4. Tags are the user's layer — only manual classification
5. Routes are loose — ordered stops + "open in Maps", not turn-by-turn
6. Mobile-first interaction, desktop-first density
