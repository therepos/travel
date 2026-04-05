# Travel

A personal travel wishlist app. Save places you want to visit, browse them on a map, and open them in Google Maps when you're ready to go.

## Features

- **Fast capture** — type a place name, auto-resolve via Google Places API, one tap to save
- **Rich details** — rating, reviews, hours, dining, amenities, payment options, all from Google
- **Share** — native share sheet on mobile, clipboard on desktop
- **Region & tag filters** — filter by continent, country, city, and custom tags
- **Routes** — plan multi-stop routes, open in Google Maps
- **PWA** — add to homescreen for app-like experience
- **Self-hosted** — runs on Docker, your data stays with you

## Setup

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or use existing)
3. Enable **Places API (New)** and **Maps Static API**
4. Create an API key under Credentials

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

## Development

### Backend (FastAPI)
```bash
pip install -r requirements.txt
cd app && uvicorn main:app --reload
```

### UI (Vite + React)
```bash
cd app/ui
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to the backend at `localhost:8000`.

## Architecture

```
travel/
├── app/
│   ├── main.py              # FastAPI — API routes, Google Places integration
│   └── ui/
│       ├── src/
│       │   ├── App.jsx       # Main app shell
│       │   ├── shared.jsx    # Constants, icons, API helper
│       │   └── components/
│       │       ├── DetailView.jsx
│       │       ├── CaptureBar.jsx
│       │       ├── SmartFilters.jsx
│       │       ├── EditModal.jsx
│       │       ├── RoutePlanner.jsx
│       │       └── RoutesTab.jsx
│       ├── index.html
│       ├── package.json
│       └── vite.config.js
├── static/                   # PWA assets (manifest, icons)
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## Data

All data is stored in a SQLite database at `/data/travel.db` inside the container, persisted via Docker volume.

## License

MIT
