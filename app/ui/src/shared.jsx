// ── Google-style palette ─────────────────────────────────
export const C = {
  blue:"#1A73E8", blueBg:"#E8F0FE", blueLight:"#D2E3FC",
  bg:"#FFFFFF", surface:"#F8F9FA", border:"#DADCE0", borderLight:"#f1f3f4",
  text:"#202124", textMid:"#5F6368", textLight:"#80868B",
  yellow:"#FBBC04", green:"#34A853", red:"#EA4335",
  purple:"#5E35B1", purpleBg:"#EDE7F6",
};

export const INTENTS = [
  { key:"eat", label:"Eat", icon:"eat" },
  { key:"drink", label:"Drink", icon:"drink" },
  { key:"see", label:"See", icon:"see" },
  { key:"do", label:"Do", icon:"do" },
  { key:"shop", label:"Shop", icon:"shop" },
  { key:"goout", label:"Go out", icon:"goout" },
  { key:"stay", label:"Stay", icon:"stay" },
  { key:"services", label:"Services", icon:"services" },
];

export const TAG_PRESETS = ["date night","must visit","team dinner","with parents","solo trip","with kids","budget","special occasion"];

export async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { headers:{"Content-Type":"application/json",...opts.headers}, ...opts });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`API error ${res.status}`); }
  return res.json();
}

export function doShare(place) {
  const text = `${place.name}${place.city?` · ${place.city}`:""}`;
  const url = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  if (navigator.share) { try { navigator.share({title:place.name,text,url}); } catch(e) {} }
  else { try { navigator.clipboard.writeText(`${text}\n${url}`); } catch(e) {} }
}

// ── SVG Icon component ───────────────────────────────────
const paths = {
  search:<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  x:<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  back:<polyline points="15 18 9 12 15 6"/>,
  chevron:<polyline points="9 18 15 12 9 6"/>,
  chevDown:<polyline points="6 9 12 15 18 9"/>,
  pin:<><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></>,
  plus:<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  share:<><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></>,
  edit:<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  refresh:<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  clock:<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  phone:<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>,
  globe:<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></>,
  calendar:<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  external:<><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  route:<><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></>,
  layers:<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  check:<polyline points="20 6 9 17 4 12"/>,
  trash:<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
  gear:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  download:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  drag:<><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="16" y2="18"/></>,
  lock:<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  // Intent icons
  eat:<><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4m-9-9h4m14 0h4"/></>,
  drink:<><path d="M8 2h8l-1 9H9L8 2z"/><path d="M12 11v7"/><path d="M8 18h8"/></>,
  see:<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  do:<><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></>,
  shop:<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></>,
  goout:<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  stay:<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></>,
  services:<><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
};

const dotsPaths = <><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></>;
const starPath = <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>;

export function Icon({name, size=20, color="currentColor", sw=2, fill="none", style={}}) {
  if (name === "dots") return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>{dotsPaths}</svg>;
  if (name === "star") return <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none" style={style}>{starPath}</svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>{paths[name]}</svg>;
}

export function Stars({rating, size=14}) {
  const full = Math.floor(rating);
  return <div style={{display:"flex",gap:1}}>{[1,2,3,4,5].map(i=><Icon key={i} name="star" size={size} color={i<=full?C.yellow:C.border}/>)}</div>;
}

export function Tag({children, variant=""}) {
  const colors = {
    gn:{bg:"#e6f4ea",color:"#137333"}, bl:{bg:C.blueBg,color:"#1967d2"},
    am:{bg:"#fef7e0",color:"#b06000"}, pp:{bg:C.purpleBg,color:C.purple},
  };
  const c = colors[variant] || {bg:C.borderLight,color:C.textMid};
  return <span style={{fontSize:12,padding:"4px 10px",borderRadius:6,background:c.bg,color:c.color,whiteSpace:"nowrap"}}>{children}</span>;
}

export function ActionPill({icon, label, onClick}) {
  return <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:20,border:`1px solid ${C.border}`,fontSize:13,color:C.blue,fontWeight:500,background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>
    <Icon name={icon} size={18} color={C.blue}/>{label}
  </button>;
}

export function InfoRow({icon, children}) {
  return <div style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderTop:`1px solid ${C.borderLight}`,fontSize:14}}>
    <Icon name={icon} size={18} color={C.textLight} style={{marginTop:2,flexShrink:0}}/><div style={{flex:1}}>{children}</div>
  </div>;
}

// Cuisine tag color helper
export function cuisineColor(c) {
  if (!c) return "";
  return "am"; // amber for cuisines
}

// Intent tag color helper
export function intentColor(i) {
  if (!i) return "";
  return "gn"; // green for intents
}
