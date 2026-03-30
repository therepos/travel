# Wanderlust

A personal travel wishlist app. Save places you want to visit, browse them on a map, and open them in Google Maps when you're ready to go.

## Features

- **Fast capture** — type a place name, auto-resolve via Google Places API, one tap to save
- **Map view** — all your saved places on an interactive map (Leaflet + Carto Voyager)
- **List view** — browse, search, and filter your places
- **Region & tag filters** — filter by continent and custom tags
- **Google Maps handoff** — tap "Open in Google Maps" to navigate
- **PWA** — add to homescreen for app-like experience
- **Self-hosted** — runs on Docker, your data stays with you

## Setup

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Places API (New)**
4. Create an API key under Credentials
5. (Recommended) Restrict the key to Places API only

### 2. Deploy

Create a `.env` file:

```
GOOGLE_PLACES_API_KEY=your_key_here
```

Run with Docker Compose:

```bash
docker compose up -d
```

The app will be available at `http://your-server:8099`

### 3. Cloudflare Tunnel

Point your tunnel to `http://localhost:8099` (or whatever internal IP your Docker host uses).

### 4. Add to Homescreen

Open the app URL on your phone's browser and use "Add to Home Screen" for a native app-like experience.

## Development

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend (Vite + React)
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend at `localhost:8000`.

## Architecture

```
wanderlust/
├── backend/
│   ├── main.py          # FastAPI app — API routes, Google Places integration
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React app
│   │   └── main.jsx     # Entry point
│   ├── public/
│   │   └── manifest.json # PWA manifest
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       └── build.yml     # CI: build & push to ghcr.io
├── Dockerfile            # Multi-stage: build frontend + bundle with backend
├── docker-compose.yml    # Production deployment
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/search?q=...` | Search Google Places API |
| GET | `/api/places` | List all saved places |
| POST | `/api/places` | Save a new place |
| PUT | `/api/places/:id` | Update a place |
| DELETE | `/api/places/:id` | Delete a place |

## Data

All data is stored in a SQLite database at `/data/wanderlust.db` inside the container, persisted via Docker volume.

## License

MIT
