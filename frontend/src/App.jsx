import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TAG_OPTIONS = ["temple", "nature", "city", "culture", "food", "hiking", "historical", "beach", "nightlife", "village", "architecture"];
const TAG_COLORS = {
  temple: "#B8602E", nature: "#1B7A5A", city: "#8A4A6B", culture: "#C45530",
  food: "#2E8A7A", hiking: "#8B6B3E", historical: "#7255A0", beach: "#2870A8",
  nightlife: "#4A6A9A", village: "#B05575", architecture: "#5A4A7A"
};
const REGIONS = ["All", "Asia", "Europe", "North America", "South America", "Africa", "Middle East", "Oceania"];

// ── API helpers ──────────────────────────────────────────

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Map Component ────────────────────────────────────────

function MapView({ places, selectedPlace, onSelectPlace, mapRef }) {
  const containerRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current || leafletRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([25, 20], 2);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      // Alternative: "https://{s}.basemaps.cartocdn.com/voyager/{z}/{x}/{y}{r}.png"
    }).addTo(map);

    leafletRef.current = map;
    mapRef.current = map;

    // Force tile load after layout settles
    setTimeout(() => map.invalidateSize(), 100);
    setTimeout(() => map.invalidateSize(), 500);

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, []);

  const updateMarkers = useCallback(() => {
    const map = leafletRef.current;
    if (!map) return;

    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    places.forEach(place => {
      const sel = selectedPlace?.id === place.id;
      const icon = L.divIcon({
        className: "wl-marker",
        html: `<div style="
          width:${sel ? 20 : 14}px; height:${sel ? 20 : 14}px;
          background:${sel ? "#B8602E" : "#1B7A5A"};
          border:2.5px solid #fff; border-radius:50%;
          box-shadow:0 2px 8px ${sel ? "rgba(184,96,46,.5)" : "rgba(0,0,0,.2)"};
          transition:all .3s;
        "></div>`,
        iconSize: [sel ? 20 : 14, sel ? 20 : 14],
        iconAnchor: [sel ? 10 : 7, sel ? 10 : 7],
      });
      const m = L.marker([place.lat, place.lng], { icon })
        .addTo(map)
        .on("click", () => onSelectPlace(place));
      markersRef.current.push(m);
    });
  }, [places, selectedPlace, onSelectPlace]);

  useEffect(() => { updateMarkers(); }, [updateMarkers]);

  useEffect(() => {
    if (selectedPlace && leafletRef.current) {
      leafletRef.current.flyTo([selectedPlace.lat, selectedPlace.lng], 8, { duration: 1.2 });
    }
  }, [selectedPlace]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", borderRadius: 14, background: "#FAFAF7" }} />;
}

// ── Place Card ───────────────────────────────────────────

function PlaceCard({ place, isExpanded, onClick, onOpenGoogleMaps, onDelete }) {
  return (
    <div onClick={onClick} style={{
      background: isExpanded ? "#FFFCF8" : "#FFF",
      border: `1px solid ${isExpanded ? "#D4A574" : "#ECE9E3"}`,
      borderRadius: 14, cursor: "pointer", transition: "all .25s",
      overflow: "hidden", marginBottom: 10,
      boxShadow: isExpanded ? "0 4px 16px rgba(184,96,46,.08)" : "0 1px 3px rgba(0,0,0,.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", padding: "13px 15px", gap: 13 }}>
        <div style={{ width: 50, height: 50, borderRadius: 11, overflow: "hidden", flexShrink: 0, background: "#F5F2ED" }}>
          {place.photo && <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.style.display = "none"; }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: "#2C2A26",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
          <div style={{ fontSize: 12.5, color: "#9E978C", marginTop: 2 }}>{place.country}</div>
        </div>
        <div style={{ fontSize: 11, color: "#C4BDB2", flexShrink: 0 }}>{place.saved}</div>
      </div>

      {isExpanded && (
        <div style={{ padding: "0 15px 15px", animation: "fadeIn .3s" }}>
          {place.photo && (
            <div style={{ width: "100%", height: 170, borderRadius: 11, overflow: "hidden", marginBottom: 12 }}>
              <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ fontSize: 13, color: "#9E978C", marginBottom: 10 }}>{place.address}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
            {(place.tags || []).map(tag => (
              <span key={tag} style={{
                padding: "3px 11px", borderRadius: 20, fontSize: 11.5,
                background: `${TAG_COLORS[tag] || "#888"}12`, color: TAG_COLORS[tag] || "#888",
                border: `1px solid ${TAG_COLORS[tag] || "#888"}30`,
              }}>{tag}</span>
            ))}
          </div>
          {place.notes && (
            <div style={{ fontSize: 13, color: "#9E978C", fontStyle: "italic", marginBottom: 12,
              paddingLeft: 10, borderLeft: "2px solid #E8E3DB" }}>{place.notes}</div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={e => { e.stopPropagation(); onOpenGoogleMaps(place); }}
              style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#1B7A5A",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Open in Google Maps
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(place.id); }}
              style={{ padding: "11px 15px", borderRadius: 10, border: "1px solid #E8D4D4",
                background: "#FDF6F6", color: "#B04040", fontSize: 13, cursor: "pointer" }}>
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Capture Modal ────────────────────────────────────────

function CaptureModal({ isOpen, onClose, onSave }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) setTimeout(() => inputRef.current.focus(), 100);
    if (!isOpen) {
      setQuery(""); setResults([]); setSelectedIdx(0);
      setSelectedTags([]); setNotes(""); setError("");
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    setResults([]);
    try {
      const data = await api(`/search?q=${encodeURIComponent(query.trim())}`);
      if (data.results?.length) {
        setResults(data.results);
        setSelectedIdx(0);
      } else {
        setError("No places found. Try a different search.");
      }
    } catch (e) {
      setError(e.message || "Search failed");
    }
    setSearching(false);
  };

  const selected = results[selectedIdx] || null;

  const handleSave = async () => {
    if (!selected) return;
    try {
      const saved = await api("/places", {
        method: "POST",
        body: JSON.stringify({
          ...selected,
          tags: selectedTags,
          notes,
          saved: new Date().toISOString().split("T")[0],
        }),
      });
      onSave(saved);
      onClose();
    } catch (e) {
      setError(e.message || "Save failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.2)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn .2s",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, background: "#FEFDFB",
        borderRadius: "22px 22px 0 0", padding: "22px 20px 32px",
        maxHeight: "85vh", overflowY: "auto",
        animation: "slideUp .3s cubic-bezier(.4,0,.2,1)",
        boxShadow: "0 -8px 40px rgba(0,0,0,.1)",
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD8D0", margin: "0 auto 18px" }} />
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, color: "#2C2A26",
          margin: "0 0 18px", fontWeight: 400 }}>Save a Place</h2>

        {/* Search */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="e.g. Fushimi Inari Kyoto"
            style={{ flex: 1, padding: "13px 16px", borderRadius: 11, border: "1.5px solid #E8E3DB",
              background: "#FFF", color: "#2C2A26", fontSize: 15, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#D4A574"}
            onBlur={e => e.target.style.borderColor = "#E8E3DB"} />
          <button onClick={handleSearch} disabled={searching}
            style={{ padding: "13px 22px", borderRadius: 11, border: "none", background: "#B8602E",
              color: "#fff", fontWeight: 600, fontSize: 14, cursor: searching ? "wait" : "pointer",
              opacity: searching ? 0.7 : 1 }}>
            {searching ? "..." : "Find"}
          </button>
        </div>

        {error && <div style={{ color: "#B04040", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        {/* Multiple results selector */}
        {results.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
            {results.map((r, i) => (
              <button key={i} onClick={() => setSelectedIdx(i)}
                style={{
                  padding: "6px 12px", borderRadius: 8, fontSize: 12, whiteSpace: "nowrap",
                  border: `1.5px solid ${i === selectedIdx ? "#B8602E" : "#E8E3DB"}`,
                  background: i === selectedIdx ? "#B8602E0F" : "#FFF",
                  color: i === selectedIdx ? "#B8602E" : "#9E978C",
                  cursor: "pointer",
                }}>
                {r.name}
              </button>
            ))}
          </div>
        )}

        {/* Selected result */}
        {selected && (
          <div style={{ animation: "fadeIn .3s" }}>
            {selected.photo && (
              <div style={{ width: "100%", height: 175, borderRadius: 12, overflow: "hidden",
                marginBottom: 14, border: "1px solid #ECE9E3" }}>
                <img src={selected.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 18,
              color: "#2C2A26", marginBottom: 3 }}>{selected.name}</div>
            <div style={{ fontSize: 13, color: "#9E978C", marginBottom: 4 }}>{selected.address}</div>
            <div style={{ fontSize: 12, color: "#B5AFA5", marginBottom: 16 }}>
              {selected.country}{selected.region ? ` · ${selected.region}` : ""}
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#B5AFA5", marginBottom: 8, textTransform: "uppercase",
                letterSpacing: 1.2, fontWeight: 600 }}>Tags</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {TAG_OPTIONS.map(tag => (
                  <button key={tag}
                    onClick={() => setSelectedTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])}
                    style={{
                      padding: "5px 13px", borderRadius: 20, fontSize: 12,
                      border: `1.5px solid ${selectedTags.includes(tag) ? TAG_COLORS[tag] : "#E0DBD3"}`,
                      background: selectedTags.includes(tag) ? `${TAG_COLORS[tag]}12` : "#FAFAF7",
                      color: selectedTags.includes(tag) ? TAG_COLORS[tag] : "#A09888",
                      cursor: "pointer", transition: "all .2s",
                    }}>{tag}</button>
                ))}
              </div>
            </div>

            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add a note (optional)" rows={2}
              style={{ width: "100%", padding: 12, borderRadius: 11, border: "1.5px solid #E8E3DB",
                background: "#FFF", color: "#2C2A26", fontSize: 14, outline: "none",
                resize: "none", marginBottom: 16, boxSizing: "border-box" }} />

            <button onClick={handleSave}
              style={{ width: "100%", padding: 15, borderRadius: 12, border: "none",
                background: "#1B7A5A", color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer", letterSpacing: 0.3 }}>
              Save to Wishlist
            </button>
          </div>
        )}

        {!selected && !searching && !error && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#C4BDB2", fontSize: 14 }}>
            Type a place name and hit Find
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("map");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [filterRegion, setFilterRegion] = useState("All");
  const [filterTag, setFilterTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef(null);

  // Load places on mount
  useEffect(() => {
    api("/places").then(data => {
      setPlaces(data.places || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filteredPlaces = places.filter(p => {
    if (filterRegion !== "All" && p.region !== filterRegion) return false;
    if (filterTag && !(p.tags || []).includes(filterTag)) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.country.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openGoogleMaps = (place) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, "_blank");
  };

  const handleSave = (place) => {
    setPlaces(prev => [place, ...prev]);
  };

  const handleDelete = async (id) => {
    try {
      await api(`/places/${id}`, { method: "DELETE" });
      setPlaces(prev => prev.filter(p => p.id !== id));
      if (selectedPlace?.id === id) setSelectedPlace(null);
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace(prev => prev?.id === place.id ? null : place);
  };

  const usedTags = [...new Set(places.flatMap(p => p.tags || []))];
  const countByRegion = {};
  places.forEach(p => { if (p.region) countByRegion[p.region] = (countByRegion[p.region] || 0) + 1; });

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#FAFAF7",
      display: "flex", flexDirection: "column" }}>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .leaflet-container { background: #FAFAF7 !important; }
      `}</style>

      {/* Header */}
      <div style={{ padding: "18px 20px 12px", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #EDE9E3",
        background: "#FEFDFB" }}>
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 28,
            fontWeight: 400, color: "#2C2A26", margin: 0 }}>Wanderlust</h1>
          <div style={{ fontSize: 12, color: "#B5AFA5", marginTop: 1 }}>
            {places.length} place{places.length !== 1 ? "s" : ""} saved
          </div>
        </div>
        <div style={{ display: "flex", background: "#F3F0EB", borderRadius: 10, padding: 3 }}>
          {["map", "list"].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "7px 16px", borderRadius: 8, border: "none",
                background: view === v ? "#FFF" : "transparent",
                color: view === v ? "#2C2A26" : "#A09888",
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                textTransform: "uppercase", letterSpacing: 0.5,
                boxShadow: view === v ? "0 1px 3px rgba(0,0,0,.06)" : "none" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Region filters */}
      <div style={{ padding: "10px 20px 6px", display: "flex", gap: 6, overflowX: "auto",
        flexShrink: 0, scrollbarWidth: "none" }}>
        {REGIONS.map(r => (
          <button key={r} onClick={() => setFilterRegion(r)}
            style={{
              padding: "5px 14px", borderRadius: 20,
              border: `1.5px solid ${filterRegion === r ? "#1B7A5A" : "#E8E3DB"}`,
              background: filterRegion === r ? "#1B7A5A0F" : "#FFF",
              color: filterRegion === r ? "#1B7A5A" : "#9E978C",
              fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            }}>
            {r}{r !== "All" && countByRegion[r] ? ` (${countByRegion[r]})` : ""}
          </button>
        ))}
      </div>

      {/* Tag filters */}
      {usedTags.length > 0 && (
        <div style={{ padding: "4px 20px 10px", display: "flex", gap: 5, overflowX: "auto",
          flexShrink: 0, scrollbarWidth: "none" }}>
          {usedTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(f => f === tag ? null : tag)}
              style={{
                padding: "4px 11px", borderRadius: 16, fontSize: 11,
                border: `1px solid ${filterTag === tag ? TAG_COLORS[tag] : "#ECE9E3"}`,
                background: filterTag === tag ? `${TAG_COLORS[tag]}10` : "#FFF",
                color: filterTag === tag ? TAG_COLORS[tag] : "#B5AFA5",
                cursor: "pointer", whiteSpace: "nowrap",
              }}>{tag}</button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: "#B5AFA5", fontSize: 14 }}>Loading...</div>
        ) : view === "map" ? (
          <div style={{ height: "100%", padding: "0 12px 12px" }}>
            <div style={{ height: "100%", position: "relative" }}>
              <MapView places={filteredPlaces} selectedPlace={selectedPlace}
                onSelectPlace={handleSelectPlace} mapRef={mapRef} />

              {selectedPlace && (
                <div style={{
                  position: "absolute", bottom: 16, left: 12, right: 12,
                  background: "rgba(254,253,251,.95)", backdropFilter: "blur(12px)",
                  borderRadius: 14, padding: 13, border: "1px solid #E8E3DB",
                  boxShadow: "0 4px 20px rgba(0,0,0,.08)", animation: "fadeIn .2s",
                  display: "flex", gap: 12, alignItems: "center",
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                    {selectedPlace.photo && <img src={selectedPlace.photo} alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16,
                      color: "#2C2A26", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {selectedPlace.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#9E978C", marginTop: 2 }}>{selectedPlace.country}</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                      {(selectedPlace.tags || []).map(tag => (
                        <span key={tag} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 10,
                          background: `${TAG_COLORS[tag]}12`, color: TAG_COLORS[tag] }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button onClick={() => openGoogleMaps(selectedPlace)}
                    style={{ padding: "10px 15px", borderRadius: 10, border: "none", background: "#1B7A5A",
                      color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                    Open
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ height: "100%", overflowY: "auto", padding: "0 16px 100px" }}>
            <div style={{ marginBottom: 10, position: "sticky", top: 0, zIndex: 10, paddingTop: 4 }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search places..."
                style={{ width: "100%", padding: "12px 16px", borderRadius: 11, border: "1.5px solid #E8E3DB",
                  background: "rgba(254,253,251,.97)", color: "#2C2A26", fontSize: 14,
                  outline: "none", boxSizing: "border-box" }} />
            </div>
            {filteredPlaces.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#C4BDB2", fontSize: 14 }}>
                {places.length === 0 ? "No places saved yet. Tap + to add your first!" : "No places found"}
              </div>
            ) : filteredPlaces.map(place => (
              <PlaceCard key={place.id} place={place}
                isExpanded={selectedPlace?.id === place.id}
                onClick={() => handleSelectPlace(place)}
                onOpenGoogleMaps={openGoogleMaps}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setCaptureOpen(true)}
        style={{ position: "fixed", bottom: 24, right: 24, width: 58, height: 58,
          borderRadius: "50%", border: "none", background: "#B8602E", color: "#FFF",
          fontSize: 28, fontWeight: 300, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(184,96,46,.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform .2s", zIndex: 100 }}
        onMouseDown={e => e.currentTarget.style.transform = "scale(.92)"}
        onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
        +
      </button>

      <CaptureModal isOpen={captureOpen} onClose={() => setCaptureOpen(false)} onSave={handleSave} />
    </div>
  );
}