// ── Palette ──────────────────────────────────────────────
export const C = {
  bg:"#F0EEEB", surface:"#FFFFFF", card:"#1C1C28", cardLight:"#2A2A38",
  text:"#1C1C28", textMid:"#6B6878", textLight:"#9C98A6",
  textOnDark:"#F0EEEB", textOnDarkMid:"#A8A4B0",
  accent:"#C4884D", accentLight:"#C4884D18", accentBorder:"#C4884D40",
  danger:"#C0564F", dangerBg:"#C0564F14",
  success:"#4A8B6F", successBg:"#4A8B6F14",
  border:"#E4E1DC", borderLight:"#EDEBE7", navBg:"#FAFAF7",
};
export const TAG_OPTIONS = ["temple","nature","city","culture","food","hiking","historical","beach","nightlife","village","architecture"];
export const TAG_COLORS = {temple:"#9E6B3A",nature:"#4A8B6F",city:"#7B6B9A",culture:"#C07040",food:"#3A8B80",hiking:"#8B7B4A",historical:"#6B5A90",beach:"#3A70A0",nightlife:"#5A6A90",village:"#7B6B9A",architecture:"#5A4A7A"};
export const NAV_H = 72;

export async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { headers: {"Content-Type":"application/json",...opts.headers}, ...opts });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`API error ${res.status}`); }
  return res.json();
}

export const I = {
  filter:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>,
  search:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  gmaps:<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#C4884D"/><circle cx="12" cy="9" r="2.75" fill="white"/></svg>,
  trash:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  route:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  star:<svg width="12" height="12" viewBox="0 0 24 24" fill="#C4884D" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  phone:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  web:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  plus:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  refresh:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  share:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
  dots:<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>,
  exportIcon:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  navPlaces:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill={a?"#C4884D":"none"} stroke={a?"#C4884D":"currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  navRoutes:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#C4884D":"currentColor"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3" fill={a?"#C4884D":"none"}/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3" fill={a?"#C4884D":"none"}/></svg>,
  navPlus:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#C4884D":"currentColor"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  navSearch:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?"#C4884D":"currentColor"} strokeWidth={a?"2.5":"1.8"} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
};

export const Chip = ({children,color=C.textMid,bg=C.borderLight})=><span style={{padding:"3px 9px",borderRadius:6,fontSize:12,background:bg,color,whiteSpace:"nowrap"}}>{children}</span>;
export const Label = ({children})=><div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:5}}>{children}</div>;

export const doShare = async (place) => {
  const text = `${place.name}${place.city?` · ${place.city}`:""}`;
  const url = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  if (navigator.share) { try { await navigator.share({title:place.name,text,url}); } catch(e) {} }
  else { try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch(e) {} }
};
