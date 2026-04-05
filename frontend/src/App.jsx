import { useState, useEffect, useRef, useCallback } from "react";

const TAG_OPTIONS = ["temple", "nature", "city", "culture", "food", "hiking", "historical", "beach", "nightlife", "village", "architecture"];
const TAG_COLORS = {
  temple: "#B8602E", nature: "#1B7A5A", city: "#8A4A6B", culture: "#C45530",
  food: "#2E8A7A", hiking: "#8B6B3E", historical: "#7255A0", beach: "#2870A8",
  nightlife: "#4A6A9A", village: "#B05575", architecture: "#5A4A7A"
};

// ── API ──────────────────────────────────────────────────

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers }, ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

// ── Icons ────────────────────────────────────────────────

const Ic = {
  filter: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  gmaps: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.75a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z" fill="#34A853"/><path d="M12 2v6.24l5.59 5.6C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#FBBC04"/><path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84l5.59-5.6V2z" fill="#4285F4"/><path d="M6.41 13.84C7.53 15.56 9 17.03 10 18.63c.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.27-1.5c.36-.81.7-1.51 1.17-2.26.55-.88 1.18-1.71 1.83-2.51L12 11.24l-5.59 2.6z" fill="#EA4335"/></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  route: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  trips: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

// ── Trip Planner ─────────────────────────────────────────

function TripPlanner({ places, locationName, onClose, onSaved }) {
  const [selected, setSelected] = useState(places.map(p => p.id));
  const [tripName, setTripName] = useState(`${locationName} Trip`);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const active = places.filter(p => selected.includes(p.id));

  const buildUrl = () => {
    if (active.length === 0) return null;
    if (active.length === 1) return `https://www.google.com/maps/search/?api=1&query=${active[0].lat},${active[0].lng}`;
    const origin = `${active[0].lat},${active[0].lng}`;
    const dest = `${active[active.length - 1].lat},${active[active.length - 1].lng}`;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`;
    if (active.length > 2) {
      url += `&waypoints=${active.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|")}`;
    }
    return url;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api("/trips", {
        method: "POST",
        body: JSON.stringify({ name: tripName, location: locationName, stops: selected }),
      });
      setSaved(true);
      if (onSaved) onSaved();
      setTimeout(() => onClose(), 1500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.2)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end",
      justifyContent: "center", animation: "fadeIn .2s" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#FEFDFB", borderRadius: "22px 22px 0 0",
        padding: "20px 20px 28px", maxHeight: "85vh", overflowY: "auto",
        animation: "slideUp .3s cubic-bezier(.4,0,.2,1)", boxShadow: "0 -8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD8D0", margin: "0 auto 16px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1B7A5A0F",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#1B7A5A" }}>{Ic.route}</div>
          <div style={{ flex: 1 }}>
            <input value={tripName} onChange={e => setTripName(e.target.value)}
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: "#2C2A26",
                border: "none", background: "transparent", outline: "none", width: "100%", padding: 0 }} />
            <div style={{ fontSize: 12, color: "#9E978C" }}>{active.length} of {places.length} stops</div>
          </div>
        </div>

        {/* Stops */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {places.map(place => {
            const isSel = selected.includes(place.id);
            const num = isSel ? active.indexOf(place) + 1 : null;
            return (
              <div key={place.id} onClick={() => setSelected(prev =>
                prev.includes(place.id) ? prev.filter(x => x !== place.id) : [...prev, place.id]
              )} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 12, cursor: "pointer", border: `1.5px solid ${isSel ? "#1B7A5A" : "#ECE9E3"}`,
                background: isSel ? "#1B7A5A06" : "#FFF" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
                  background: isSel ? "#1B7A5A" : "#F3F0EB", color: isSel ? "#FFF" : "#C4BDB2" }}>
                  {isSel ? num : ""}
                </div>
                <div style={{ width: 42, height: 42, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#F0EDE8" }}>
                  {place.photo && <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isSel ? "#2C2A26" : "#9E978C",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                    {(place.tags || []).map(tag => (
                      <span key={tag} style={{ padding: "1px 7px", borderRadius: 10, fontSize: 10,
                        background: isSel ? `${TAG_COLORS[tag]}12` : "#F3F0EB",
                        color: isSel ? TAG_COLORS[tag] : "#C4BDB2" }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        {saved ? (
          <div style={{ padding: 14, borderRadius: 12, background: "#1B7A5A0F", border: "1px solid #1B7A5A25",
            color: "#1B7A5A", fontSize: 14, fontWeight: 600, textAlign: "center",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {Ic.check} Trip saved!
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={active.length === 0 || saving}
              style={{ flex: 1, padding: 14, borderRadius: 12, border: "none",
                background: active.length > 0 ? "#B8602E" : "#E0DBD3",
                color: active.length > 0 ? "#FFF" : "#A09888",
                fontSize: 14, fontWeight: 600, cursor: active.length > 0 ? "pointer" : "default",
                fontFamily: "'DM Sans', sans-serif" }}>
              {saving ? "Saving..." : "Save Trip"}
            </button>
            <button onClick={() => { const url = buildUrl(); if (url) window.open(url, "_blank"); }}
              disabled={active.length === 0}
              style={{ flex: 1, padding: 14, borderRadius: 12, border: "none",
                background: active.length > 0 ? "#1B7A5A" : "#E0DBD3",
                color: active.length > 0 ? "#FFF" : "#A09888",
                fontSize: 14, fontWeight: 600, cursor: active.length > 0 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "'DM Sans', sans-serif" }}>
              {Ic.gmaps} Open Route
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Detail View ──────────────────────────────────────────

function DetailView({ place, onClose, onDelete }) {
  const mapsUrl = place.google_maps_url ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id || ""}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: "#FAFAF7",
      animation: "fadeIn .2s", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "12px 16px", background: "rgba(250,250,247,.92)",
        backdropFilter: "blur(10px)", borderBottom: "1px solid #EDE9E3" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer",
          padding: 4, color: "#2C2A26", display: "flex", alignItems: "center", gap: 4, fontSize: 14, fontWeight: 500 }}>
          {Ic.back} Back
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onDelete(place.id)} style={{ width: 34, height: 34, borderRadius: "50%",
            border: "1px solid #E8D4D4", background: "#FDF6F6", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#B04040" }}>{Ic.trash}</button>
        </div>
      </div>

      {place.photo && (
        <div style={{ width: "100%", aspectRatio: "4/3", background: "#F0EDE8", overflow: "hidden" }}>
          <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.parentElement.style.display = "none"; }} />
        </div>
      )}

      <div style={{ padding: "18px 20px 100px" }}>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontWeight: 400,
          color: "#2C2A26", margin: "0 0 4px", lineHeight: 1.3 }}>{place.name}</h2>
        <div style={{ fontSize: 14, color: "#9E978C", marginBottom: 4 }}>{place.address}</div>
        <div style={{ fontSize: 13, color: "#B5AFA5", marginBottom: 14 }}>
          {place.region} · {place.country}{place.city ? ` · ${place.city}` : ""} · Saved {place.saved}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
          {(place.tags || []).map(tag => (
            <span key={tag} style={{ padding: "4px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
              background: `${TAG_COLORS[tag]}10`, color: TAG_COLORS[tag], border: `1px solid ${TAG_COLORS[tag]}25` }}>{tag}</span>
          ))}
        </div>
        {(place.auto_tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 16 }}>
            {place.auto_tags.map(t => (
              <span key={t} style={{ padding: "3px 10px", borderRadius: 16, fontSize: 11,
                background: "#F3F0EB", color: "#9E978C" }}>{t}</span>
            ))}
          </div>
        )}

        {place.notes && (
          <div style={{ fontSize: 14, color: "#6B665C", lineHeight: 1.6, padding: "12px 14px",
            background: "#F7F5F1", borderRadius: 10, marginBottom: 20, borderLeft: "3px solid #E0DBD3" }}>
            {place.notes}
          </div>
        )}

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: "flex", width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
            background: "#1B7A5A", color: "#FFF", fontSize: 15, fontWeight: 600,
            alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", cursor: "pointer" }}>
          {Ic.gmaps} Open in Google Maps
        </a>
      </div>
    </div>
  );
}

// ── Capture Bar ──────────────────────────────────────────

function CaptureBar({ onSave }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selIdx, setSelIdx] = useState(0);
  const [tags, setTags] = useState([]);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setError(""); setResults([]);
    try {
      const data = await api(`/search?q=${encodeURIComponent(query.trim())}`);
      if (data.results?.length) { setResults(data.results); setSelIdx(0); }
      else setError("No places found");
    } catch (e) { setError(e.message); }
    setSearching(false);
  };

  const selected = results[selIdx] || null;

  const handleSave = async () => {
    if (!selected) return;
    try {
      const saved = await api("/places", {
        method: "POST",
        body: JSON.stringify({ ...selected, tags, saved: new Date().toISOString().split("T")[0] }),
      });
      onSave(saved);
      setResults([]); setQuery(""); setTags([]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      inputRef.current?.focus();
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ flexShrink: 0, background: "#FEFDFB", borderBottom: "1px solid #EDE9E3", padding: "14px 16px" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); if (results.length) { setResults([]); } }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Quick save a place..."
          style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1.5px solid #E8E3DB",
            background: "#FFF", color: "#2C2A26", fontSize: 15, outline: "none",
            fontFamily: "'DM Sans', sans-serif" }}
          onFocus={e => e.target.style.borderColor = "#D4A574"}
          onBlur={e => e.target.style.borderColor = "#E8E3DB"} />
        <button onClick={handleSearch} disabled={searching || !query.trim()}
          style={{ padding: "12px 18px", borderRadius: 12, border: "none",
            background: query.trim() ? "#B8602E" : "#E8E3DB",
            color: query.trim() ? "#FFF" : "#A09888",
            fontWeight: 600, fontSize: 14, cursor: query.trim() ? "pointer" : "default",
            fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
          {searching ? "..." : "Find"}
        </button>
      </div>

      {error && <div style={{ fontSize: 12.5, color: "#B04040", marginTop: 8 }}>{error}</div>}

      {/* Multiple results selector */}
      {results.length > 1 && (
        <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "auto" }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => setSelIdx(i)}
              style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11.5, whiteSpace: "nowrap",
                border: `1.5px solid ${i === selIdx ? "#B8602E" : "#E8E3DB"}`,
                background: i === selIdx ? "#B8602E0F" : "#FFF",
                color: i === selIdx ? "#B8602E" : "#9E978C", cursor: "pointer" }}>
              {r.name.length > 25 ? r.name.slice(0, 25) + "…" : r.name}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ marginTop: 10, borderRadius: 12, overflow: "hidden", border: "2px solid #D4A574",
          background: "#FFF", animation: "slideIn .25s" }}>
          <div style={{ display: "flex" }}>
            {selected.photo && (
              <div style={{ width: 80, height: 80, flexShrink: 0, overflow: "hidden" }}>
                <img src={selected.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}
            <div style={{ flex: 1, padding: "10px 12px" }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 16, color: "#2C2A26",
                lineHeight: 1.3, marginBottom: 2 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: "#9E978C", marginBottom: 1 }}>{selected.address}</div>
              <div style={{ fontSize: 11, color: "#B5AFA5" }}>
                {selected.country}{selected.city ? ` · ${selected.city}` : ""}{selected.region ? ` · ${selected.region}` : ""}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
                {["food", "nature", "temple", "city", "culture", "hiking", "historical", "beach"].map(t => (
                  <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                    style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, border: "none",
                      background: tags.includes(t) ? `${TAG_COLORS[t]}18` : "#F3F0EB",
                      color: tags.includes(t) ? TAG_COLORS[t] : "#A09888",
                      cursor: "pointer", fontWeight: tags.includes(t) ? 600 : 400 }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #F0EDE8" }}>
            <button onClick={handleSave}
              style={{ flex: 1, padding: 10, border: "none", background: "#1B7A5A", color: "#FFF",
                fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: "0 0 0 10px",
                fontFamily: "'DM Sans', sans-serif" }}>✓ Save</button>
            <button onClick={() => { setResults([]); setQuery(""); }}
              style={{ flex: 1, padding: 10, border: "none", background: "#FFF", color: "#9E978C",
                fontSize: 13, cursor: "pointer", borderRadius: "0 0 10px 0",
                fontFamily: "'DM Sans', sans-serif" }}>✕ Skip</button>
          </div>
        </div>
      )}

      {justSaved && (
        <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#1B7A5A0F",
          color: "#1B7A5A", fontSize: 12.5, fontWeight: 500, animation: "slideIn .2s",
          display: "flex", alignItems: "center", gap: 6 }}>
          {Ic.check} Saved & auto-organized!
        </div>
      )}
    </div>
  );
}

// ── Smart Filters ────────────────────────────────────────

function SmartFilters({ places, filters, setFilters }) {
  const [expanded, setExpanded] = useState(false);

  const hierarchy = {};
  places.forEach(p => {
    if (!hierarchy[p.region]) hierarchy[p.region] = { count: 0, countries: {} };
    hierarchy[p.region].count++;
    if (!hierarchy[p.region].countries[p.country]) hierarchy[p.region].countries[p.country] = { count: 0, cities: {} };
    hierarchy[p.region].countries[p.country].count++;
    if (p.city) {
      if (!hierarchy[p.region].countries[p.country].cities[p.city]) hierarchy[p.region].countries[p.country].cities[p.city] = 0;
      hierarchy[p.region].countries[p.country].cities[p.city]++;
    }
  });

  const usedTags = [...new Set(places.flatMap(p => p.tags || []))];
  const activeCount = (filters.region ? 1 : 0) + (filters.country ? 1 : 0) + (filters.city ? 1 : 0) + (filters.tag ? 1 : 0);

  const countries = filters.region && hierarchy[filters.region]
    ? Object.entries(hierarchy[filters.region].countries).sort((a, b) => b[1].count - a[1].count) : [];
  const cities = filters.region && filters.country && hierarchy[filters.region]?.countries[filters.country]
    ? Object.entries(hierarchy[filters.region].countries[filters.country].cities).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div style={{ flexShrink: 0, background: "#FEFDFB" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px",
        borderBottom: expanded ? "none" : "1px solid #EDE9E3" }}>
        <button onClick={() => setExpanded(!expanded)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
            border: `1.5px solid ${activeCount ? "#1B7A5A" : "#E8E3DB"}`,
            background: activeCount ? "#1B7A5A08" : "#FFF",
            color: activeCount ? "#1B7A5A" : "#9E978C", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          {Ic.filter} {activeCount ? `${activeCount} filter${activeCount > 1 ? "s" : ""}` : "Filter"}
        </button>
        <div style={{ display: "flex", gap: 5, flex: 1, overflow: "hidden" }}>
          {filters.region && <span style={{ padding: "4px 10px", borderRadius: 14, fontSize: 12,
            background: "#1B7A5A0F", color: "#1B7A5A", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            {filters.region} <span onClick={() => setFilters(f => ({ ...f, region: null, country: null, city: null }))}
              style={{ cursor: "pointer", opacity: 0.6 }}>×</span></span>}
          {filters.country && <span style={{ padding: "4px 10px", borderRadius: 14, fontSize: 12,
            background: "#B8602E0F", color: "#B8602E", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            {filters.country} <span onClick={() => setFilters(f => ({ ...f, country: null, city: null }))}
              style={{ cursor: "pointer", opacity: 0.6 }}>×</span></span>}
          {filters.city && <span style={{ padding: "4px 10px", borderRadius: 14, fontSize: 12,
            background: "#7255A00F", color: "#7255A0", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            {filters.city} <span onClick={() => setFilters(f => ({ ...f, city: null }))}
              style={{ cursor: "pointer", opacity: 0.6 }}>×</span></span>}
          {filters.tag && <span style={{ padding: "4px 10px", borderRadius: 14, fontSize: 12,
            background: `${TAG_COLORS[filters.tag]}10`, color: TAG_COLORS[filters.tag],
            whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
            {filters.tag} <span onClick={() => setFilters(f => ({ ...f, tag: null }))}
              style={{ cursor: "pointer", opacity: 0.6 }}>×</span></span>}
        </div>
        {activeCount > 0 && <button onClick={() => setFilters({ region: null, country: null, city: null, tag: null })}
          style={{ fontSize: 12, color: "#B04040", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Clear</button>}
      </div>

      {expanded && (
        <div style={{ padding: "8px 16px 12px", borderBottom: "1px solid #EDE9E3", animation: "slideIn .2s" }}>
          <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>Region</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
            {Object.entries(hierarchy).sort((a, b) => b[1].count - a[1].count).map(([r, d]) => (
              <button key={r} onClick={() => setFilters(f => ({ ...f, region: f.region === r ? null : r, country: null, city: null }))}
                style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${filters.region === r ? "#1B7A5A" : "#ECE9E3"}`,
                  background: filters.region === r ? "#1B7A5A0F" : "#FFF",
                  color: filters.region === r ? "#1B7A5A" : "#9E978C" }}>{r} ({d.count})</button>
            ))}
          </div>
          {countries.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>Country</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {countries.map(([c, d]) => (
                <button key={c} onClick={() => setFilters(f => ({ ...f, country: f.country === c ? null : c, city: null }))}
                  style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${filters.country === c ? "#B8602E" : "#ECE9E3"}`,
                    background: filters.country === c ? "#B8602E0F" : "#FFF",
                    color: filters.country === c ? "#B8602E" : "#9E978C" }}>{c} ({d.count})</button>
              ))}
            </div>
          </>}
          {cities.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>City</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
              {cities.map(([c, n]) => (
                <button key={c} onClick={() => setFilters(f => ({ ...f, city: f.city === c ? null : c }))}
                  style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${filters.city === c ? "#7255A0" : "#ECE9E3"}`,
                    background: filters.city === c ? "#7255A00F" : "#FFF",
                    color: filters.city === c ? "#7255A0" : "#9E978C" }}>{c} ({n})</button>
              ))}
            </div>
          </>}
          {usedTags.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600, marginBottom: 6 }}>Type</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {usedTags.map(tag => (
                <button key={tag} onClick={() => setFilters(f => ({ ...f, tag: f.tag === tag ? null : tag }))}
                  style={{ padding: "5px 12px", borderRadius: 16, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${filters.tag === tag ? TAG_COLORS[tag] : "#ECE9E3"}`,
                    background: filters.tag === tag ? `${TAG_COLORS[tag]}10` : "#FFF",
                    color: filters.tag === tag ? TAG_COLORS[tag] : "#9E978C" }}>{tag}</button>
              ))}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ region: null, country: null, city: null, tag: null });
  const [detailPlace, setDetailPlace] = useState(null);
  const [tripOpen, setTripOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    api("/places").then(d => { setPlaces(d.places || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filteredPlaces = places.filter(p => {
    if (filters.region && p.region !== filters.region) return false;
    if (filters.country && p.country !== filters.country) return false;
    if (filters.city && p.city !== filters.city) return false;
    if (filters.tag && !(p.tags || []).includes(filters.tag)) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.country.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(p.city || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleSave = (place) => setPlaces(prev => [place, ...prev]);
  const handleDelete = async (id) => {
    try { await api(`/places/${id}`, { method: "DELETE" }); setPlaces(prev => prev.filter(p => p.id !== id)); setDetailPlace(null); }
    catch (e) { console.error(e); }
  };

  const locationLabel = filters.city || filters.country || null;
  const showTripPrompt = locationLabel && filteredPlaces.length > 1 && !tripOpen && !detailPlace;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#FAFAF7",
      fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 0", flexShrink: 0, background: "#FEFDFB" }}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24, fontWeight: 400, color: "#2C2A26", margin: 0 }}>
          Wanderlust
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#B5AFA5" }}>{filteredPlaces.length} place{filteredPlaces.length !== 1 ? "s" : ""}</span>
          {locationLabel && filteredPlaces.length > 1 && (
            <button onClick={() => setTripOpen(true)}
              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#1B7A5A",
                color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif",
                animation: "slideIn .3s" }}>
              {Ic.route} Plan Trip
            </button>
          )}
          <button onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
            style={{ width: 34, height: 34, borderRadius: "50%", border: "1px solid #E8E3DB",
              background: searchOpen ? "#2C2A260A" : "#FFF", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: searchOpen ? "#2C2A26" : "#9E978C" }}>
            {searchOpen ? Ic.x : Ic.search}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ padding: "8px 16px 0", background: "#FEFDFB", animation: "slideIn .2s" }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search places, cities, countries..." autoFocus
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E3DB",
              background: "#FFF", color: "#2C2A26", fontSize: 14, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#D4A574"}
            onBlur={e => e.target.style.borderColor = "#E8E3DB"} />
        </div>
      )}

      <CaptureBar onSave={handleSave} />
      <SmartFilters places={places} filters={filters} setFilters={setFilters} />

      {/* Photo grid */}
      <div style={{ flex: 1, overflowY: "auto", padding: 2 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#B5AFA5", fontSize: 14 }}>Loading...</div>
        ) : filteredPlaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#C4BDB2", fontSize: 14 }}>
            {places.length === 0 ? "Save your first place above!" : "No places match these filters"}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2,
            paddingBottom: showTripPrompt ? 80 : 0 }}>
            {filteredPlaces.map(place => (
              <div key={place.id} onClick={() => setDetailPlace(place)}
                style={{ aspectRatio: "1", position: "relative", cursor: "pointer", overflow: "hidden", background: "#F0EDE8" }}>
                {place.photo && <img src={place.photo} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  onError={e => { e.target.style.display = "none"; }} />}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "linear-gradient(transparent, rgba(0,0,0,.6))", padding: "18px 7px 6px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#FFF",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    textShadow: "0 1px 3px rgba(0,0,0,.3)" }}>{place.name}</div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,.7)", marginTop: 1 }}>
                    {place.city || place.country}
                  </div>
                </div>
                {(place.tags || []).length > 0 && (
                  <div style={{ position: "absolute", top: 5, right: 5, display: "flex", gap: 2 }}>
                    {place.tags.slice(0, 2).map(tag => (
                      <div key={tag} style={{ width: 7, height: 7, borderRadius: "50%",
                        background: TAG_COLORS[tag] || "#888", border: "1.5px solid rgba(255,255,255,.8)" }} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail view */}
      {detailPlace && <DetailView place={detailPlace} onClose={() => setDetailPlace(null)} onDelete={handleDelete} />}

      {/* Bottom trip prompt */}
      {showTripPrompt && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(254,253,251,.95)", backdropFilter: "blur(10px)",
          borderTop: "1px solid #EDE9E3", padding: "12px 18px 16px", animation: "slideIn .3s",
          display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#2C2A26" }}>
              {filteredPlaces.length} saves in {locationLabel}
            </div>
            <div style={{ fontSize: 12, color: "#9E978C", marginTop: 1 }}>Plan a route with Google Maps</div>
          </div>
          <button onClick={() => setTripOpen(true)}
            style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "#1B7A5A",
              color: "#FFF", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif" }}>
            {Ic.route} Plan
          </button>
        </div>
      )}

      {/* Trip planner */}
      {tripOpen && locationLabel && (
        <TripPlanner places={filteredPlaces} locationName={locationLabel}
          onClose={() => setTripOpen(false)} onSaved={() => setTripOpen(false)} />
      )}
    </div>
  );
}
