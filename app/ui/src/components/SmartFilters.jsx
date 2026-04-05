import { C, I, TAG_COLORS } from "../shared.jsx";

function getFilterLevel(filters) {
  if (filters.country) return 2;
  if (filters.region) return 1;
  return 0;
}

function getChips(places, filters) {
  const level = getFilterLevel(filters);

  if (level === 0) {
    const counts = {};
    places.forEach(p => { if(p.region) counts[p.region] = (counts[p.region]||0)+1; });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([r,n]) => ({
      key: r, label: `${r} (${n})`, color: C.success,
      action: (setF) => setF(f => ({...f, region: r, country: null, city: null, tag: null, autoTag: null})),
    }));
  }

  if (level === 1) {
    const counts = {};
    places.filter(p => p.region === filters.region).forEach(p => {
      if(p.country) counts[p.country] = (counts[p.country]||0)+1;
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([c,n]) => ({
      key: c, label: `${c} (${n})`, color: C.accent,
      action: (setF) => setF(f => ({...f, country: c, city: null, tag: null, autoTag: null})),
    }));
  }

  // level 2: tags within region+country
  const subset = places.filter(p =>
    p.region === filters.region && p.country === filters.country
  );
  const tagCounts = {};
  subset.forEach(p => (p.tags||[]).forEach(t => { tagCounts[t] = (tagCounts[t]||0)+1; }));
  return Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).map(([t,n]) => ({
    key: t, label: n > 1 ? `${t} (${n})` : t,
    color: TAG_COLORS[t] || C.textMid,
    active: filters.tag === t,
    action: (setF) => setF(f => ({...f, tag: f.tag === t ? null : t, autoTag: null})),
  }));
}

function goBack(filters, setFilters) {
  const level = getFilterLevel(filters);
  if (level === 2) setFilters(f => ({...f, country: null, city: null, tag: null, autoTag: null}));
  else if (level === 1) setFilters(f => ({region: null, country: null, city: null, tag: null, autoTag: null}));
}

function getBreadcrumb(filters) {
  const parts = [];
  if (filters.region) parts.push(filters.region);
  if (filters.country) parts.push(filters.country);
  if (filters.tag) parts.push(filters.tag);
  return parts;
}

export default function SmartFilters({places, filters, setFilters, filteredCount}) {
  const level = getFilterLevel(filters);
  const chips = getChips(places, filters);
  const breadcrumb = getBreadcrumb(filters);

  return <div style={{flexShrink:0}}>
    {/* Filter row */}
    <div style={{
      display:"flex", alignItems:"center", gap:6,
      padding:"12px 16px 4px",
      overflowX:"auto", WebkitOverflowScrolling:"touch",
    }}>
      {/* Back / Filter button */}
      {level > 0 ? (
        <button onClick={()=>goBack(filters,setFilters)} style={{
          display:"flex", alignItems:"center", gap:4,
          padding:"7px 12px", borderRadius:10, fontSize:13, fontWeight:600,
          border:`1.5px solid ${C.border}`, background:C.surface,
          color:C.text, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap",
        }}>{I.back} Back</button>
      ) : (
        <div style={{
          display:"flex", alignItems:"center", gap:5,
          padding:"7px 12px", borderRadius:10, fontSize:13, fontWeight:600,
          border:`1.5px solid ${C.border}`, background:C.surface,
          color:C.textMid, flexShrink:0, whiteSpace:"nowrap",
        }}>{I.filter} Filter</div>
      )}

      {/* Chips for current level */}
      {chips.map(chip=>(
        <button key={chip.key} onClick={()=>chip.action(setFilters)} style={{
          padding:"6px 12px", borderRadius:10, fontSize:12, fontWeight:chip.active?600:500,
          border:`1.5px solid ${chip.active?chip.color:C.borderLight}`,
          background:chip.active?`${chip.color}14`:C.surface,
          color:chip.active?chip.color:C.textMid,
          cursor:"pointer", flexShrink:0, whiteSpace:"nowrap",
          transition:"all .15s",
        }}>{chip.label}</button>
      ))}
    </div>

    {/* Breadcrumb + count */}
    <div style={{padding:"4px 16px 8px", display:"flex", alignItems:"center", gap:6}}>
      <span style={{fontSize:12, color:C.textLight, fontWeight:500}}>
        {filteredCount} place{filteredCount!==1?"s":""}
      </span>
      {breadcrumb.length>0&&<>
        <span style={{fontSize:12, color:C.border}}>·</span>
        <span style={{fontSize:12, color:C.textMid, fontWeight:500}}>{breadcrumb.join(" › ")}</span>
      </>}
    </div>
  </div>;
}
