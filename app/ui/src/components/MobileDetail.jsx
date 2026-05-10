import { useState, useEffect, useRef } from "react";
import { C, Icon, Stars, Tag, ActionPill, InfoRow, api } from "../shared.jsx";
import GalleryStrip from "./GalleryStrip.jsx";

const HIGHLIGHT_COLORS = {
  summary: {bg:"#f0f4ff",color:"#1a56db",border:"#d0daf8"},
  signature: {bg:"#fef7e0",color:"#92610e",border:"#f5e1a4"},
  vibe: {bg:"#e6f4ea",color:"#137333",border:"#b7dfbf"},
  tip: {bg:"#fce8e6",color:"#c5221f",border:"#f5c6c2"},
  serves: {bg:C.borderLight,color:C.textMid,border:C.border},
  dining: {bg:C.borderLight,color:C.textMid,border:C.border},
};
const TRANSIT_STYLES = {
  MRT:{color:"#1A73E8",bg:"#E8F0FE",icon:<path d="M4 17V6a4 4 0 014-4h8a4 4 0 014 4v11M6 17h12M8 21l-2-4M16 21l2-4M6 10h12" strokeLinecap="round" strokeLinejoin="round"/>},
  LRT:{color:"#5E35B1",bg:"#EDE7F6",icon:<path d="M4 17V6a4 4 0 014-4h8a4 4 0 014 4v11M6 17h12M8 21l-2-4M16 21l2-4M6 10h12" strokeLinecap="round" strokeLinejoin="round"/>},
  Bus:{color:"#137333",bg:"#e6f4ea",icon:<><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M4 10h16M8 17v2M16 17v2M7 13.5h.01M17 13.5h.01" strokeLinecap="round" strokeLinejoin="round"/></>},
  Train:{color:"#92610e",bg:"#fef7e0",icon:<path d="M4 17V6a4 4 0 014-4h8a4 4 0 014 4v11M6 17h12M8 21l-2-4M16 21l2-4M6 10h12" strokeLinecap="round" strokeLinejoin="round"/>},
  Transit:{color:"#5F6368",bg:"#f1f3f4",icon:<path d="M4 17V6a4 4 0 014-4h8a4 4 0 014 4v11M6 17h12M8 21l-2-4M16 21l2-4M6 10h12" strokeLinecap="round" strokeLinejoin="round"/>},
};

function TransitIcon({category, size=16}) {
  const s = TRANSIT_STYLES[category]||TRANSIT_STYLES.Transit;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth={2} style={{flexShrink:0}}>{s.icon}</svg>;
}

function transitDirectionsUrl(stationName, category, place) {
  const suffix = {MRT:"MRT Station",LRT:"LRT Station",Bus:"Bus Stop",Train:"Train Station"}[category]||"Station";
  const origin = `${stationName} ${suffix}`;
  const dest = place.address || place.name;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=walking`;
}

export default function MobileDetail({place, onClose, onDelete, onEdit, onRefresh, onShare, editModal}) {
  const [menuOpen,setMenuOpen] = useState(false);
  const [refreshing,setRefreshing] = useState(false);
  const [toast,setToast] = useState(null);
  const [transport,setTransport] = useState(null);
  const [highlights,setHighlights] = useState(null);
  const [stays,setStays] = useState(null);
  const menuBtnRef = useRef(null);
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;

  useEffect(() => {
    setTransport(null); setHighlights(null); setStays(null);
    if (!place.id) return;
    const hasLoc = place.lat && place.lng;
    const wantStays = hasLoc && place.intent !== "stay";
    Promise.all([
      hasLoc ? api(`/nearby-transit?lat=${place.lat}&lng=${place.lng}`).catch(()=>null) : null,
      api(`/places/${place.id}/highlights`).catch(()=>null),
      wantStays ? api(`/nearby-accommodation?lat=${place.lat}&lng=${place.lng}`).catch(()=>null) : null,
    ]).then(([t,h,s])=>{ setTransport(t); setHighlights(h?.highlights||[]); setStays(s?.places||[]); });
  }, [place.id]);

  const doRefresh = async () => {
    setRefreshing(true); setMenuOpen(false);
    try { await onRefresh?.(place.id); setToast({type:"ok",msg:"Updated"}); }
    catch(e) { setToast({type:"err",msg:e.message||"Refresh failed"}); }
    setRefreshing(false);
    setTimeout(()=>setToast(null),3000);
  };

  const summaryHighlight = (highlights||[]).find(h=>h.type==="summary");
  const otherHighlights = (highlights||[]).filter(h=>h.type!=="summary");

  return <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
    {toast && <div style={{position:"fixed",top:96,left:"50%",transform:"translateX(-50%)",zIndex:100,
      padding:"8px 16px",borderRadius:20,fontSize:14,fontWeight:500,
      background:toast.type==="ok"?"#e6f4ea":"#fce8e6",color:toast.type==="ok"?"#137333":"#c5221f",
      boxShadow:"0 2px 8px rgba(0,0,0,.12)",animation:"fadeIn .2s"}}>{toast.msg}</div>}

    <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,display:"flex",justifyContent:"space-between",padding:"48px 14px 0"}}>
      <button onClick={onClose} style={{width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="back" size={20} sw={2.5}/>
      </button>
      <button ref={menuBtnRef} onClick={()=>setMenuOpen(true)} style={{width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="dots" size={18} color={C.text}/>
      </button>
    </div>

    <div style={{flex:1,overflowY:"auto"}}>
      <GalleryStrip place={place} isMobile={true}/>

      <div style={{padding:"16px 20px 24px"}}>
        <div style={{fontSize:22,fontWeight:500,marginBottom:3}}>{place.name}</div>
        <div style={{fontSize:15,color:C.textMid,marginBottom:8}}>
          {place.place_type||place.sub_type||""}{place.district?` · ${place.district}`:""}{place.city?`, ${place.city}`:""}
        </div>

        {(place.rating>0||place.price_level) && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
          {place.rating>0 && <><span style={{fontSize:16,fontWeight:500}}>{place.rating}</span>
            <Stars rating={place.rating}/>
            {place.rating_count>0 && <span style={{fontSize:14,color:C.textMid}}>({place.rating_count.toLocaleString()})</span>}
          </>}
          {place.price_level && <span style={{fontSize:15,color:C.textMid,fontWeight:500}}>{place.price_level}</span>}
        </div>}

        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <ActionPill icon="pin" label="Directions" onClick={()=>window.open(mapsUrl,"_blank")}/>
          <ActionPill icon="share" label="Share" onClick={()=>onShare?.(place)}/>
          <ActionPill icon="edit" label="Edit" onClick={()=>onEdit?.(place)}/>
          <ActionPill icon="refresh" label="Refresh" onClick={doRefresh} disabled={refreshing}/>
        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
          {(place.auto_tags||[]).map(t=><Tag key={t} variant="gn">{t}</Tag>)}
          {(place.tags||[]).map(t=><Tag key={t} variant="pp">{t}</Tag>)}
        </div>

        {/* Why this place */}
        {highlights && highlights.length>0 && <div style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Why this place</div>
          {summaryHighlight && <div style={{fontSize:14,color:"#1a56db",lineHeight:1.5,marginBottom:8,fontStyle:"italic",
            padding:"10px 14px",background:"#f0f4ff",borderRadius:8,borderLeft:"3px solid #1a56db"}}>
            {summaryHighlight.text}
          </div>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {otherHighlights.map((h,i)=>{
              const c=HIGHLIGHT_COLORS[h.type]||HIGHLIGHT_COLORS.serves;
              return <span key={i} style={{fontSize:13,padding:"5px 12px",borderRadius:6,
                background:c.bg,color:c.color,border:`1px solid ${c.border}`,whiteSpace:"nowrap"}}>
                {h.type==="signature"?"⭐ ":h.type==="tip"?"💡 ":""}{h.text}
              </span>;
            })}
          </div>
        </div>}

        {place.hours && <InfoRow icon="clock"><div style={{fontSize:15}}>{place.hours.split("|")[0]?.trim()}</div></InfoRow>}
        {place.address && <InfoRow icon="pin"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`} target="_blank" rel="noopener" style={{color:C.text,textDecoration:"none",fontSize:15}}>{place.address}</a></InfoRow>}
        {place.phone && <InfoRow icon="phone"><a href={`tel:${place.phone}`} style={{color:C.text,textDecoration:"none",fontSize:15}}>{place.phone}</a></InfoRow>}
        {place.website && <InfoRow icon="globe"><a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:15,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></InfoRow>}

        {(place.serves||[]).length>0 && <Sec label="Serves">{(place.serves||[]).map(s=><Tag key={s}>{s}</Tag>)}</Sec>}
        {(place.dining||[]).length>0 && <Sec label="Dining">{(place.dining||[]).map(d=><Tag key={d}>{d}</Tag>)}</Sec>}
        {(place.amenities||[]).length>0 && <Sec label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}
        {(place.payment||[]).length>0 && <Sec label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}

        {/* Getting there — clickable rows with walking directions */}
        {transport && (transport.groups||[]).length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Getting there</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(transport.groups||[]).flatMap(g=>g.stations.map((s,i)=>{
              const st=TRANSIT_STYLES[g.category]||TRANSIT_STYLES.Transit;
              const suffix = g.category==="MRT"?" Station":g.category==="Bus"?" Stop":"";
              return <a key={`${g.category}-${i}`} href={transitDirectionsUrl(s.name, g.category, place)} target="_blank" rel="noopener"
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:C.surface,textDecoration:"none"}}>
                <div style={{width:32,height:32,borderRadius:8,background:st.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <TransitIcon category={g.category} size={18}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:500,color:C.text}}>{s.name}{suffix}</div>
                  <div style={{fontSize:12,color:C.textLight}}>{g.category} · {s.distance}</div>
                </div>
                <Icon name="external" size={14} color={C.textLight}/>
              </a>;
            }))}
          </div>
        </div>}

        {/* Stay nearby — top 3 highly-rated accommodations */}
        {stays && stays.length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Stay nearby</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {stays.map(s => <a key={s.id} href={s.maps_url} target="_blank" rel="noopener"
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:C.surface,textDecoration:"none"}}>
              <div style={{width:50,height:50,borderRadius:8,background:C.border,overflow:"hidden",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
                <Icon name="stay" size={20} color={C.textLight} sw={1.5} fill="none" style={{position:"absolute"}}/>
                {s.photo && <img src={s.photo} alt="" loading="lazy" referrerPolicy="no-referrer"
                  style={{width:"100%",height:"100%",objectFit:"cover",position:"relative"}} onError={e=>{e.target.style.display="none";}}/>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.textMid,marginTop:2}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:2}}>
                    <Icon name="star" size={12} color={C.yellow}/>{s.rating}
                  </span>
                  <span style={{color:C.textLight}}>({s.rating_count.toLocaleString()})</span>
                  {s.price_level && <span style={{color:C.textLight}}>· {s.price_level}</span>}
                  <span style={{color:C.textLight,marginLeft:"auto"}}>{s.distance}</span>
                </div>
              </div>
              <Icon name="external" size={14} color={C.textLight}/>
            </a>)}
          </div>
        </div>}

        {place.notes && <div style={{fontSize:14,color:C.textMid,background:C.surface,padding:"12px 16px",borderRadius:8,lineHeight:1.5,marginTop:10}}>
          <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
        </div>}
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",fontSize:13,color:C.textLight,marginTop:8}}>
          <Icon name="calendar" size={15} color={C.textLight}/> Saved on {place.saved}
        </div>
      </div>
    </div>

    {menuOpen && <>
      <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.08)",zIndex:50}}/>
      <div style={{position:"fixed",zIndex:51,
        top:menuBtnRef.current?menuBtnRef.current.getBoundingClientRect().bottom+6:100,
        right:14,
        background:"#fff",borderRadius:10,boxShadow:"0 2px 16px rgba(0,0,0,.15)",border:`1px solid ${C.borderLight}`,minWidth:200,overflow:"hidden",animation:"fadeIn .12s"}}>
        <PopItem icon="share" label="Share" onClick={()=>{setMenuOpen(false);onShare?.(place);}}/>
        <PopItem icon="edit" label="Edit tags & notes" onClick={()=>{setMenuOpen(false);onEdit?.(place);}}/>
        <PopItem icon="refresh" label="Refresh from Google" onClick={doRefresh}/>
        <div style={{height:1,background:C.borderLight,margin:"2px 0"}}/>
        <PopItem icon="trash" label="Delete" color={C.red} onClick={()=>{setMenuOpen(false);if(confirm(`Delete "${place.name}"?`))onDelete?.(place.id);}}/>
      </div>
    </>}
    {editModal}
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
  </div>;
}

function PopItem({icon, label, onClick, color}) {
  return <button onClick={onClick}
    style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:"none",border:"none",fontSize:14,
      color:color||C.text,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"background .1s"}}
    onMouseEnter={e=>{e.currentTarget.style.background=C.surface;}}
    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
    <Icon name={icon} size={18} color={color||C.textMid} sw={1.5}/>{label}
  </button>;
}

function Sec({label, children}) {
  return <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderLight}`}}>
    <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>{label}</div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
