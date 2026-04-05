import { useState, useEffect, useRef } from "react";

const TAG_OPTIONS = ["temple", "nature", "city", "culture", "food", "hiking", "historical", "beach", "nightlife", "village", "architecture"];
const TAG_COLORS = {
  temple: "#B8602E", nature: "#1B7A5A", city: "#8A4A6B", culture: "#C45530",
  food: "#2E8A7A", hiking: "#8B6B3E", historical: "#7255A0", beach: "#2870A8",
  nightlife: "#4A6A9A", village: "#B05575", architecture: "#5A4A7A"
};

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json", ...opts.headers }, ...opts });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `API error ${res.status}`); }
  return res.json();
}

const Ic = {
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  gmaps: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.75a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z" fill="#34A853"/><path d="M12 2v6.24l5.59 5.6C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#FBBC04"/><path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84l5.59-5.6V2z" fill="#4285F4"/><path d="M6.41 13.84C7.53 15.56 9 17.03 10 18.63c.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.27-1.5c.36-.81.7-1.51 1.17-2.26.55-.88 1.18-1.71 1.83-2.51L12 11.24l-5.59 2.6z" fill="#EA4335"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  route: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
};

const iconBtn = (onClick, icon, color = "#9E978C", bg = "#FFF", border = "#E8E3DB") => (
  <button onClick={onClick} style={{ width: 32, height: 32, borderRadius: "50%",
    border: `1px solid ${border}`, background: bg, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>{icon}</button>
);

// ── Edit Modal ───────────────────────────────────────────

function EditModal({ place, onClose, onSaved }) {
  const [name, setName] = useState(place.name);
  const [tags, setTags] = useState(place.tags || []);
  const [notes, setNotes] = useState(place.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await api(`/places/${place.id}`, {
        method: "PUT", body: JSON.stringify({ name, tags, notes }),
      });
      onSaved(updated);
      onClose();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.2)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn .2s" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#FEFDFB", borderRadius: "22px 22px 0 0",
        padding: "20px 20px 28px", maxHeight: "80vh", overflowY: "auto",
        animation: "slideUp .3s cubic-bezier(.4,0,.2,1)", boxShadow: "0 -8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD8D0", margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: "#2C2A26",
          margin: "0 0 16px", fontWeight: 400 }}>Edit Place</h2>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Name</div>
          <input value={name} onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E3DB",
              background: "#FFF", color: "#2C2A26", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Tags</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TAG_OPTIONS.map(t => (
              <button key={t} onClick={() => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                style={{ padding: "5px 13px", borderRadius: 20, fontSize: 12, border: "none",
                  background: tags.includes(t) ? `${TAG_COLORS[t]}18` : "#F3F0EB",
                  color: tags.includes(t) ? TAG_COLORS[t] : "#A09888",
                  cursor: "pointer", fontWeight: tags.includes(t) ? 600 : 400 }}>{t}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Add a note..."
            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #E8E3DB",
              background: "#FFF", color: "#2C2A26", fontSize: 14, outline: "none",
              resize: "none", boxSizing: "border-box" }} />
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: "#1B7A5A", color: "#FFF", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ── Detail View ──────────────────────────────────────────

function DetailView({ place, onClose, onDelete, onEdit }) {
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
        <div style={{ display: "flex", gap: 6 }}>
          {iconBtn(onEdit, Ic.edit)}
          {iconBtn(() => window.open(mapsUrl, "_blank"), Ic.gmaps)}
          {iconBtn(() => onDelete(place.id), Ic.trash, "#B04040", "#FDF6F6", "#E8D4D4")}
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
          {place.region} · {place.country}{place.city ? ` · ${place.city}` : ""} · {place.saved}
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
            background: "#F7F5F1", borderRadius: 10, borderLeft: "3px solid #E0DBD3" }}>
            {place.notes}
          </div>
        )}
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
      const d = await api(`/search?q=${encodeURIComponent(query.trim())}`);
      if (d.results?.length) { setResults(d.results); setSelIdx(0); }
      else setError("No places found");
    } catch (e) { setError(e.message); }
    setSearching(false);
  };

  const selected = results[selIdx] || null;

  const handleSave = async () => {
    if (!selected) return;
    try {
      const saved = await api("/places", {
        method: "POST", body: JSON.stringify({ ...selected, tags, saved: new Date().toISOString().split("T")[0] }),
      });
      onSave(saved);
      setResults([]); setQuery(""); setTags([]);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      inputRef.current?.focus();
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ flexShrink: 0, background: "#FEFDFB", borderBottom: "1px solid #EDE9E3", padding: "12px 16px" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <input ref={inputRef} value={query}
          onChange={e => { setQuery(e.target.value); if (results.length) setResults([]); }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
          placeholder="Quick save a place..."
          style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: "1.5px solid #E8E3DB",
            background: "#FFF", color: "#2C2A26", fontSize: 14, outline: "none",
            fontFamily: "'DM Sans', sans-serif" }}
          onFocus={e => e.target.style.borderColor = "#D4A574"}
          onBlur={e => e.target.style.borderColor = "#E8E3DB"} />
        <button onClick={handleSearch} disabled={searching || !query.trim()}
          style={{ padding: "11px 16px", borderRadius: 10, border: "none",
            background: query.trim() ? "#B8602E" : "#E8E3DB",
            color: query.trim() ? "#FFF" : "#A09888",
            fontWeight: 600, fontSize: 13, cursor: query.trim() ? "pointer" : "default",
            fontFamily: "'DM Sans', sans-serif", flexShrink: 0 }}>
          {searching ? "..." : "Find"}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: "#B04040", marginTop: 6 }}>{error}</div>}
      {results.length > 1 && (
        <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "auto" }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => setSelIdx(i)}
              style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, whiteSpace: "nowrap",
                border: `1.5px solid ${i === selIdx ? "#B8602E" : "#E8E3DB"}`,
                background: i === selIdx ? "#B8602E0F" : "#FFF",
                color: i === selIdx ? "#B8602E" : "#9E978C", cursor: "pointer" }}>
              {r.name.length > 22 ? r.name.slice(0, 22) + "…" : r.name}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div style={{ marginTop: 8, borderRadius: 10, overflow: "hidden", border: "2px solid #D4A574",
          background: "#FFF", animation: "slideIn .25s" }}>
          <div style={{ display: "flex" }}>
            {selected.photo && (
              <div style={{ width: 72, height: 72, flexShrink: 0, overflow: "hidden" }}>
                <img src={selected.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.parentElement.style.display = "none"; }} />
              </div>
            )}
            <div style={{ flex: 1, padding: "8px 10px", minWidth: 0 }}>
              <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 15, color: "#2C2A26",
                lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selected.name}</div>
              <div style={{ fontSize: 11.5, color: "#9E978C", marginTop: 1 }}>
                {selected.country}{selected.city ? ` · ${selected.city}` : ""}
              </div>
              <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                {["food", "nature", "temple", "city", "culture", "hiking", "historical", "beach"].map(t => (
                  <button key={t} onClick={() => setTags(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])}
                    style={{ padding: "1px 7px", borderRadius: 10, fontSize: 10, border: "none",
                      background: tags.includes(t) ? `${TAG_COLORS[t]}18` : "#F3F0EB",
                      color: tags.includes(t) ? TAG_COLORS[t] : "#A09888",
                      cursor: "pointer", fontWeight: tags.includes(t) ? 600 : 400 }}>{t}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #F0EDE8" }}>
            <button onClick={handleSave}
              style={{ flex: 1, padding: 9, border: "none", background: "#1B7A5A", color: "#FFF",
                fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: "0 0 0 8px",
                fontFamily: "'DM Sans', sans-serif" }}>✓ Save</button>
            <button onClick={() => { setResults([]); setQuery(""); }}
              style={{ flex: 1, padding: 9, border: "none", background: "#FFF", color: "#9E978C",
                fontSize: 13, cursor: "pointer", borderRadius: "0 0 8px 0",
                fontFamily: "'DM Sans', sans-serif" }}>✕ Skip</button>
          </div>
        </div>
      )}
      {justSaved && (
        <div style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, background: "#1B7A5A0F",
          color: "#1B7A5A", fontSize: 12, fontWeight: 500, animation: "slideIn .2s",
          display: "flex", alignItems: "center", gap: 5 }}>
          {Ic.check} Saved & auto-organized
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
  const usedAutoTags = [...new Set(places.flatMap(p => p.auto_tags || []))];
  const activeCount = (filters.region ? 1 : 0) + (filters.country ? 1 : 0) + (filters.city ? 1 : 0) + (filters.tag ? 1 : 0) + (filters.autoTag ? 1 : 0);
  const countries = filters.region && hierarchy[filters.region] ? Object.entries(hierarchy[filters.region].countries).sort((a, b) => b[1].count - a[1].count) : [];
  const cities = filters.region && filters.country && hierarchy[filters.region]?.countries[filters.country] ? Object.entries(hierarchy[filters.region].countries[filters.country].cities).sort((a, b) => b[1] - a[1]) : [];

  return (
    <div style={{ flexShrink: 0, background: "#FEFDFB" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 16px",
        borderBottom: expanded ? "none" : "1px solid #EDE9E3" }}>
        <button onClick={() => setExpanded(!expanded)}
          style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8,
            border: `1.5px solid ${activeCount ? "#1B7A5A" : "#E8E3DB"}`,
            background: activeCount ? "#1B7A5A08" : "#FFF",
            color: activeCount ? "#1B7A5A" : "#9E978C", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
          {Ic.filter} {activeCount ? `${activeCount}` : "Filter"}
        </button>
        <div style={{ display: "flex", gap: 4, flex: 1, overflow: "hidden" }}>
          {[
            filters.region && { label: filters.region, color: "#1B7A5A", clear: () => setFilters(f => ({ ...f, region: null, country: null, city: null })) },
            filters.country && { label: filters.country, color: "#B8602E", clear: () => setFilters(f => ({ ...f, country: null, city: null })) },
            filters.city && { label: filters.city, color: "#7255A0", clear: () => setFilters(f => ({ ...f, city: null })) },
            filters.tag && { label: filters.tag, color: TAG_COLORS[filters.tag], clear: () => setFilters(f => ({ ...f, tag: null, autoTag: null })) },
            filters.autoTag && { label: filters.autoTag, color: "#8B6B3E", clear: () => setFilters(f => ({ ...f, autoTag: null })) },
          ].filter(Boolean).map(f => (
            <span key={f.label} style={{ padding: "3px 8px", borderRadius: 12, fontSize: 11,
              background: `${f.color}0F`, color: f.color, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 3 }}>
              {f.label} <span onClick={f.clear} style={{ cursor: "pointer", opacity: 0.6 }}>×</span>
            </span>
          ))}
        </div>
        {activeCount > 0 && <button onClick={() => setFilters({ region: null, country: null, city: null, tag: null, autoTag: null })}
          style={{ fontSize: 11, color: "#B04040", background: "none", border: "none", cursor: "pointer" }}>Clear</button>}
      </div>
      {expanded && (
        <div style={{ padding: "6px 16px 10px", borderBottom: "1px solid #EDE9E3", animation: "slideIn .2s" }}>
          <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 5 }}>Region</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
            {Object.entries(hierarchy).sort((a, b) => b[1].count - a[1].count).map(([r, d]) => (
              <button key={r} onClick={() => setFilters(f => ({ ...f, region: f.region === r ? null : r, country: null, city: null }))}
                style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${filters.region === r ? "#1B7A5A" : "#ECE9E3"}`,
                  background: filters.region === r ? "#1B7A5A0F" : "#FFF",
                  color: filters.region === r ? "#1B7A5A" : "#9E978C" }}>{r} ({d.count})</button>
            ))}
          </div>
          {countries.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 5 }}>Country</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {countries.map(([c, d]) => (
                <button key={c} onClick={() => setFilters(f => ({ ...f, country: f.country === c ? null : c, city: null }))}
                  style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${filters.country === c ? "#B8602E" : "#ECE9E3"}`,
                    background: filters.country === c ? "#B8602E0F" : "#FFF",
                    color: filters.country === c ? "#B8602E" : "#9E978C" }}>{c} ({d.count})</button>
              ))}
            </div>
          </>}
          {cities.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 5 }}>City</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {cities.map(([c, n]) => (
                <button key={c} onClick={() => setFilters(f => ({ ...f, city: f.city === c ? null : c }))}
                  style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${filters.city === c ? "#7255A0" : "#ECE9E3"}`,
                    background: filters.city === c ? "#7255A00F" : "#FFF",
                    color: filters.city === c ? "#7255A0" : "#9E978C" }}>{c} ({n})</button>
              ))}
            </div>
          </>}
          <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 5 }}>Type</div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: usedAutoTags.length > 0 && filters.tag ? 8 : 0 }}>
            {usedTags.map(tag => (
              <button key={tag} onClick={() => setFilters(f => ({ ...f, tag: f.tag === tag ? null : tag, autoTag: null }))}
                style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                  border: `1px solid ${filters.tag === tag ? TAG_COLORS[tag] : "#ECE9E3"}`,
                  background: filters.tag === tag ? `${TAG_COLORS[tag]}10` : "#FFF",
                  color: filters.tag === tag ? TAG_COLORS[tag] : "#9E978C" }}>{tag}</button>
            ))}
          </div>
          {filters.tag && usedAutoTags.length > 0 && <>
            <div style={{ fontSize: 10, color: "#B5AFA5", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 5, marginTop: 8 }}>Subcategory</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {usedAutoTags.map(at => (
                <button key={at} onClick={() => setFilters(f => ({ ...f, autoTag: f.autoTag === at ? null : at }))}
                  style={{ padding: "4px 10px", borderRadius: 14, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${filters.autoTag === at ? "#8B6B3E" : "#ECE9E3"}`,
                    background: filters.autoTag === at ? "#8B6B3E0F" : "#FFF",
                    color: filters.autoTag === at ? "#8B6B3E" : "#9E978C" }}>{at}</button>
              ))}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

// ── Trip Planner (one-shot) ──────────────────────────────

function TripPlanner({ places, locationName, onClose }) {
  const [selected, setSelected] = useState(places.map(p => p.id));
  const active = places.filter(p => selected.includes(p.id));

  const buildUrl = () => {
    if (active.length === 0) return null;
    if (active.length === 1) return `https://www.google.com/maps/search/?api=1&query=${active[0].lat},${active[0].lng}`;
    const o = `${active[0].lat},${active[0].lng}`;
    const d = `${active[active.length - 1].lat},${active[active.length - 1].lng}`;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
    if (active.length > 2) url += `&waypoints=${active.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|")}`;
    return url;
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.2)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn .2s" }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, background: "#FEFDFB", borderRadius: "22px 22px 0 0",
        padding: "20px 20px 28px", maxHeight: "80vh", overflowY: "auto",
        animation: "slideUp .3s cubic-bezier(.4,0,.2,1)", boxShadow: "0 -8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#DDD8D0", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#1B7A5A0F",
            display: "flex", alignItems: "center", justifyContent: "center", color: "#1B7A5A" }}>{Ic.route}</div>
          <div>
            <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, color: "#2C2A26", fontWeight: 400 }}>
              Route: {locationName}</div>
            <div style={{ fontSize: 12, color: "#9E978C" }}>{active.length} of {places.length} stops</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
          {places.map(place => {
            const isSel = selected.includes(place.id);
            const num = isSel ? active.indexOf(place) + 1 : null;
            return (
              <div key={place.id} onClick={() => setSelected(p => p.includes(place.id) ? p.filter(x => x !== place.id) : [...p, place.id])}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10,
                  cursor: "pointer", border: `1.5px solid ${isSel ? "#1B7A5A" : "#ECE9E3"}`,
                  background: isSel ? "#1B7A5A06" : "#FFF" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                  background: isSel ? "#1B7A5A" : "#F3F0EB", color: isSel ? "#FFF" : "#C4BDB2" }}>
                  {isSel ? num : ""}</div>
                <div style={{ width: 38, height: 38, borderRadius: 7, overflow: "hidden", flexShrink: 0, background: "#F0EDE8" }}>
                  {place.photo && <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isSel ? "#2C2A26" : "#9E978C",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={() => { const url = buildUrl(); if (url) window.open(url, "_blank"); }}
          disabled={active.length === 0}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "none",
            background: active.length > 0 ? "#1B7A5A" : "#E0DBD3",
            color: active.length > 0 ? "#FFF" : "#A09888",
            fontSize: 14, fontWeight: 600, cursor: active.length > 0 ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontFamily: "'DM Sans', sans-serif" }}>
          {Ic.gmaps} Open Route in Google Maps
        </button>
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ region: null, country: null, city: null, tag: null, autoTag: null });
  const [detailPlace, setDetailPlace] = useState(null);
  const [editPlace, setEditPlace] = useState(null);
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
    if (filters.autoTag && !(p.auto_tags || []).includes(filters.autoTag)) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.country.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(p.city || "").toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const goHome = () => {
    setFilters({ region: null, country: null, city: null, tag: null, autoTag: null });
    setDetailPlace(null); setEditPlace(null); setTripOpen(false);
    setSearchQuery(""); setSearchOpen(false);
  };

  const handleSave = (place) => setPlaces(prev => [place, ...prev]);
  const handleDelete = async (id) => {
    try { await api(`/places/${id}`, { method: "DELETE" }); setPlaces(prev => prev.filter(p => p.id !== id)); setDetailPlace(null); }
    catch (e) { console.error(e); }
  };
  const handleEdited = (updated) => {
    setPlaces(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (detailPlace?.id === updated.id) setDetailPlace(updated);
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
        padding: "12px 16px", flexShrink: 0, background: "#FEFDFB", borderBottom: "1px solid #EDE9E3" }}>
        <h1 onClick={goHome} style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 24,
          fontWeight: 400, color: "#2C2A26", margin: 0, cursor: "pointer" }}>Travel</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12, color: "#B5AFA5" }}>{filteredPlaces.length}</span>
          {locationLabel && filteredPlaces.length > 1 && (
            <button onClick={() => setTripOpen(true)}
              style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "#1B7A5A",
                color: "#FFF", fontSize: 11, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
              {Ic.route} Route
            </button>
          )}
          <button onClick={() => { setSearchOpen(!searchOpen); if (searchOpen) setSearchQuery(""); }}
            style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #E8E3DB",
              background: searchOpen ? "#2C2A260A" : "#FFF", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: searchOpen ? "#2C2A26" : "#9E978C" }}>
            {searchOpen ? Ic.x : Ic.search}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div style={{ padding: "6px 16px", background: "#FEFDFB", animation: "slideIn .2s" }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search..." autoFocus
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #E8E3DB",
              background: "#FFF", color: "#2C2A26", fontSize: 13, outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#D4A574"}
            onBlur={e => e.target.style.borderColor = "#E8E3DB"} />
        </div>
      )}

      <CaptureBar onSave={handleSave} />
      <SmartFilters places={places} filters={filters} setFilters={setFilters} />

      {/* List view */}
      <div style={{ flex: 1, overflowY: "auto", paddingBottom: showTripPrompt ? 70 : 0 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#B5AFA5", fontSize: 14 }}>Loading...</div>
        ) : filteredPlaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#C4BDB2", fontSize: 14 }}>
            {places.length === 0 ? "Save your first place above!" : "No places match"}
          </div>
        ) : filteredPlaces.map(place => (
          <div key={place.id} onClick={() => setDetailPlace(place)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              borderBottom: "1px solid #F3F0EB", cursor: "pointer" }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "#F0EDE8" }}>
              {place.photo && <img src={place.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { e.target.style.display = "none"; }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#2C2A26",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
              <div style={{ fontSize: 12, color: "#9E978C", marginTop: 1 }}>
                {place.city || place.country}
                {(place.tags || []).length > 0 && <span style={{ color: "#C4BDB2" }}> · {place.tags.join(", ")}</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#C4BDB2" }}>{place.saved}</span>
              {iconBtn((e) => { e.stopPropagation(); setEditPlace(place); }, Ic.edit)}
              {iconBtn((e) => { e.stopPropagation();
                const url = place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id || ""}`;
                window.open(url, "_blank");
              }, Ic.gmaps)}
            </div>
          </div>
        ))}
      </div>

      {detailPlace && <DetailView place={detailPlace} onClose={() => setDetailPlace(null)}
        onDelete={handleDelete} onEdit={() => { setEditPlace(detailPlace); }} />}

      {editPlace && <EditModal place={editPlace} onClose={() => setEditPlace(null)} onSaved={handleEdited} />}

      {showTripPrompt && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0,
          background: "rgba(254,253,251,.95)", backdropFilter: "blur(10px)",
          borderTop: "1px solid #EDE9E3", padding: "10px 16px 14px", animation: "slideIn .3s",
          display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#2C2A26" }}>{filteredPlaces.length} in {locationLabel}</div>
            <div style={{ fontSize: 11, color: "#9E978C" }}>Plan route with Google Maps</div>
          </div>
          <button onClick={() => setTripOpen(true)}
            style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: "#1B7A5A",
              color: "#FFF", fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5, fontFamily: "'DM Sans', sans-serif" }}>
            {Ic.route} Plan
          </button>
        </div>
      )}

      {tripOpen && locationLabel && (
        <TripPlanner places={filteredPlaces} locationName={locationLabel} onClose={() => setTripOpen(false)} />
      )}
    </div>
  );
}
