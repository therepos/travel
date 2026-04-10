import { useState, useEffect, useRef } from "react";
import { C, I, NAV_H, TAG_COLORS, Chip, Label, doShare } from "../shared.jsx";

const FOOD_TAGS = ["restaurant","food","cafe","bar","bakery","takeaway","meal_takeaway"];
const isFood = (p) => [...(p.auto_tags||[]),...(p.tags||[])].some(t=>FOOD_TAGS.includes(t));
const ReviewBtn = ({title,label,color,bg,onClick})=><a title={title} onClick={onClick} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:bg,flexShrink:0}}><span style={{fontWeight:800,fontSize:label.length>1?12:15,color}}>{label}</span></a>;

function DetailMenu({place, onClose, onEdit, onDelete, onRefresh, onShare}) {
  return <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.3)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:C.surface,borderRadius:"20px 20px 0 0",padding:"8px 6px 24px",animation:"slideUp .25s cubic-bezier(.4,0,.2,1)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"0 auto 10px"}}/>
      {[
        {icon:I.refresh, label:"Refresh data", action:()=>{onClose();onRefresh?.();}},
        {icon:I.share, label:"Share", action:()=>{onClose();onShare?.();}},
        {icon:I.edit, label:"Edit", action:()=>{onClose();onEdit?.();}},
        {icon:I.gmaps, label:"Open in Maps", action:()=>{onClose();const url=place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;window.open(url,"_blank");}},
      ].map((item,i)=>
        <button key={i} onClick={item.action} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:15,color:C.text,borderRadius:12,fontFamily:"'DM Sans',sans-serif"}}>{item.icon} {item.label}</button>
      )}
      <div style={{height:1,background:C.border,margin:"4px 16px"}}/>
      <button onClick={()=>{onClose();onDelete?.(place.id);}} style={{width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px 18px",border:"none",background:"transparent",cursor:"pointer",fontSize:15,color:C.danger,borderRadius:12,fontFamily:"'DM Sans',sans-serif"}}>{I.trash} Delete</button>
    </div>
  </div>;
}

export default function DetailView({place,onClose,onDelete,onEdit,routeStopIds,routes,onPrev,onNext,onRefresh,onOpenRoute}) {
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  const [showMenu,setShowMenu]=useState(false);
  const [showRouteList,setShowRouteList]=useState(false);
  const touchRef=useRef(null);

  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  useEffect(()=>{
    window.history.pushState({detail:true},"");
    const handler=()=>onClose();
    window.addEventListener("popstate",handler);
    return()=>window.removeEventListener("popstate",handler);
  },[]);

  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id||""}`;
  const exploreUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(place.name+" "+place.city)}`;
  const inRoute = routeStopIds.includes(place.id);
  const placeRoutes = (routes||[]).filter(r=>(r.stops||[]).includes(place.id));
  const q = encodeURIComponent(place.name+(place.city?` ${place.city}`:""));

  const handleRouteBadgeClick=(e)=>{e.stopPropagation();if(placeRoutes.length===1&&onOpenRoute){onOpenRoute(placeRoutes[0]);}else if(placeRoutes.length>1){setShowRouteList(!showRouteList);}};
  const onTouchStart=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const onTouchEnd=e=>{if(!touchRef.current)return;const dx=e.changedTouches[0].clientX-touchRef.current.x;const dy=e.changedTouches[0].clientY-touchRef.current.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){if(dx>0&&onPrev)onPrev();else if(dx<0&&onNext)onNext();}touchRef.current=null;};

  const handleRefresh=async()=>{if(onRefresh)await onRefresh(place.id);};

  const contentBlocks = <>
    <div>
      <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:isMobile?26:24,color:C.text,lineHeight:1.2}}>{place.name}</div>
      <div style={{fontSize:13,color:C.textMid,marginTop:3}}>{place.city||place.country}{place.place_type?` · ${place.place_type}`:""}</div>
      {(place.rating>0||place.price_level)&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
        {place.rating>0&&<div onClick={()=>window.open(mapsUrl,"_blank")} style={{display:"flex",alignItems:"center",gap:3,cursor:"pointer",padding:"3px 8px",borderRadius:8,background:C.accentLight,border:`1px solid ${C.accentBorder}`}}>
          {I.star}<span style={{fontSize:14,color:C.accent,fontWeight:500}}>{place.rating}</span>
          {place.rating_count>0&&<span style={{fontSize:13,color:C.textLight}}>({place.rating_count>999?`${(place.rating_count/1000).toFixed(1)}k`:place.rating_count})</span>}
        </div>}
        {place.price_level&&<span style={{fontSize:14,color:C.textMid,fontWeight:500}}>{place.price_level}</span>}
      </div>}
    </div>
    {((place.tags||[]).length>0||(place.auto_tags||[]).length>0)&&<div><Label>Tags</Label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
      {(place.tags||[]).map(t=><span key={t} style={{padding:"4px 11px",borderRadius:10,fontSize:13,background:`${TAG_COLORS[t]}14`,color:TAG_COLORS[t],border:`1px solid ${TAG_COLORS[t]}25`}}>{t}</span>)}
      {(place.auto_tags||[]).map(t=><Chip key={t}>{t}</Chip>)}
    </div></div>}
    {place.editorial_summary&&<div><Label>About</Label><div style={{fontSize:14,color:C.textMid,lineHeight:1.5,fontStyle:"italic",paddingLeft:10,borderLeft:`2px solid ${C.border}`}}>{place.editorial_summary}</div></div>}
    {(place.phone||place.website)&&<div><Label>Contact</Label>
      {place.phone&&<div style={{display:"flex",alignItems:"center",gap:6,color:C.text,fontSize:14}}><span style={{color:C.textLight}}>{I.phone}</span>{place.phone}</div>}
      {place.website&&<div style={{display:"flex",alignItems:"center",gap:5,color:"#3A70A0",marginTop:3}}><span style={{color:"#3A70A0"}}>{I.web}</span><a href={place.website} target="_blank" rel="noopener" style={{color:"#3A70A0",textDecoration:"none",fontSize:14,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></div>}
    </div>}
    {place.hours&&<div><Label>Hours</Label><div style={{fontSize:14,color:C.text,lineHeight:1.4}}>{place.hours.split("|").map((h,i)=><div key={i}>{h.trim()}</div>)}</div></div>}
    {(place.dining||[]).length>0&&<div><Label>Dining</Label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.dining.map(d=><Chip key={d} color={C.success} bg={C.successBg}>{d}</Chip>)}</div></div>}
    {(place.serves||[]).length>0&&<div><Label>Serves</Label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.serves.map(s=><Chip key={s}>{s}</Chip>)}</div></div>}
    {(place.amenities||[]).length>0&&<div><Label>Amenities</Label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.amenities.map(a=><Chip key={a} color="#6B5A90" bg="#6B5A9008">{a}</Chip>)}</div></div>}
    {(place.payment||[]).length>0&&<div><Label>Payment</Label><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.payment.map(p=><Chip key={p}>{p}</Chip>)}</div></div>}
    {place.notes&&<div style={{fontSize:14,color:C.textMid,lineHeight:1.4,padding:"10px 12px",background:C.bg,borderRadius:8}}><span style={{fontWeight:600,color:C.text}}>Note:</span> {place.notes}</div>}
    <div><Label>Also check</Label><div style={{display:"flex",gap:6}}>
      <a title="Google" onClick={()=>window.open(mapsUrl,"_blank")} style={{width:34,height:34,borderRadius:8,border:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:C.surface,flexShrink:0}}>{I.gmaps}</a>
      {isFood(place)&&<><ReviewBtn title="Burpple" label="B" color="#E25D3A" bg="#FEF5F2" onClick={()=>window.open(`https://www.burpple.com/search/sg?q=${q}`,"_blank")}/><ReviewBtn title="OpenRice" label="OR" color="#E17100" bg="#FFF7EF" onClick={()=>window.open(`https://sg.openrice.com/en/singapore/restaurants?what=${q}`,"_blank")}/></>}
      <ReviewBtn title="TripAdvisor" label="TA" color="#00AA6C" bg="#F0FBF6" onClick={()=>window.open(`https://www.tripadvisor.com/Search?q=${q}`,"_blank")}/>
    </div></div>
    <div onClick={()=>window.open(mapsUrl,"_blank")} style={{borderRadius:10,overflow:"hidden",border:`1px solid ${C.borderLight}`,flexShrink:0,cursor:"pointer"}}>
      <div style={{position:"relative"}}>
        <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=500&h=200`} alt="Map" style={{width:"100%",height:150,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>
        <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",borderRadius:8,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,color:"#FFF",fontSize:12}}>{I.gmaps} Open in Maps</div>
      </div>
      {place.address&&<div style={{padding:"10px 12px",borderTop:`1px solid ${C.borderLight}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:13,color:C.text,lineHeight:1.3}}>{place.address}</div>
        <span style={{color:C.textLight,flexShrink:0,marginLeft:8}}>{I.chevron}</span>
      </div>}
    </div>
    <div style={{fontSize:12,color:C.textLight}}>Saved {place.saved}</div>
  </>;

  // ── MOBILE — floating card ──
  if(isMobile) return <>
    <div style={{
      position:"fixed", top:6, left:4, right:4, bottom:NAV_H,
      zIndex:900, background:C.surface,
      borderRadius:16, overflow:"hidden",
      display:"flex", flexDirection:"column",
      boxShadow:"0 8px 40px rgba(0,0,0,.12)",
      animation:"fadeIn .15s",
    }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Photo with floating buttons */}
      <div style={{width:"100%",aspectRatio:"4/3",flexShrink:0,background:C.borderLight,position:"relative",overflow:"hidden"}}>
        {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>}
        {/* Back button */}
        <button onClick={onClose} style={{position:"absolute",top:12,left:12,width:36,height:36,borderRadius:12,background:"rgba(0,0,0,.35)",backdropFilter:"blur(8px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}>{I.back}</button>
        {/* 3-dot menu */}
        <button onClick={()=>setShowMenu(true)} style={{position:"absolute",top:12,right:12,width:36,height:36,borderRadius:12,background:"rgba(0,0,0,.35)",backdropFilter:"blur(8px)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}>{I.dots}</button>
        {/* In route badge */}
        {inRoute&&<div onClick={handleRouteBadgeClick} style={{position:"absolute",top:12,left:60,display:"flex",alignItems:"center",gap:3,background:"rgba(74,139,111,.85)",backdropFilter:"blur(4px)",padding:"5px 10px",borderRadius:10,cursor:"pointer"}}>
          <span style={{color:"#FFF"}}>{I.route}</span><span style={{fontSize:12,color:"#FFF",fontWeight:600}}>In route{placeRoutes.length>1?` (${placeRoutes.length})`:""}</span>
        </div>}
        {showRouteList&&placeRoutes.length>1&&<div style={{position:"absolute",top:48,left:60,background:"rgba(0,0,0,.75)",backdropFilter:"blur(8px)",borderRadius:8,padding:6,display:"flex",flexDirection:"column",gap:2,minWidth:160}}>
          {placeRoutes.map(r=><div key={r.id} onClick={e=>{e.stopPropagation();if(onOpenRoute)onOpenRoute(r);}} style={{padding:"6px 10px",borderRadius:5,cursor:"pointer",fontSize:13,color:"#FFF",fontWeight:500}}>{r.name}</div>)}
        </div>}
        {/* More photos */}
        <div onClick={()=>window.open(exploreUrl,"_blank")} style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",borderRadius:8,padding:"5px 10px",display:"flex",alignItems:"center",gap:5,color:"#FFF",fontSize:12,cursor:"pointer"}}>{I.search} More photos</div>
      </div>
      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 20px",display:"flex",flexDirection:"column",gap:14}}>
        {contentBlocks}
      </div>
    </div>
    {showMenu&&<DetailMenu place={place} onClose={()=>setShowMenu(false)} onEdit={onEdit} onDelete={onDelete} onRefresh={handleRefresh} onShare={()=>doShare(place)}/>}
  </>;

  // ── DESKTOP — modal overlay ──
  return <>
    <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",animation:"fadeIn .15s",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <button onClick={onClose} style={{position:"fixed",top:14,right:14,zIndex:910,width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      {onPrev&&<button onClick={e=>{e.stopPropagation();onPrev();}} style={{position:"fixed",left:14,top:"50%",transform:"translateY(-50%)",zIndex:910,width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",backdropFilter:"blur(4px)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>}
      {onNext&&<button onClick={e=>{e.stopPropagation();onNext();}} style={{position:"fixed",right:14,top:"50%",transform:"translateY(-50%)",zIndex:910,width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",backdropFilter:"blur(4px)"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg></button>}
      <div style={{width:"min(92vw, 960px)",height:"min(88vh, 640px)",background:C.surface,borderRadius:8,overflow:"hidden",display:"flex",animation:"fadeIn .2s",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        {/* Photo side */}
        <div style={{flex:1,minWidth:0,background:C.borderLight,position:"relative",overflow:"hidden"}}>
          {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>}
          {inRoute&&<div onClick={handleRouteBadgeClick} style={{position:"absolute",top:10,left:10,display:"flex",alignItems:"center",gap:3,background:"rgba(74,139,111,.85)",padding:"5px 10px",borderRadius:10,cursor:"pointer"}}><span style={{color:"#FFF"}}>{I.route}</span><span style={{fontSize:12,color:"#FFF",fontWeight:600}}>In route</span></div>}
          <div onClick={()=>window.open(exploreUrl,"_blank")} style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",borderRadius:8,padding:"5px 10px",display:"flex",alignItems:"center",gap:5,color:"#FFF",fontSize:12,cursor:"pointer"}}>{I.search} More photos</div>
        </div>
        {/* Content side */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,borderLeft:`1px solid ${C.borderLight}`}}>
          {/* Desktop actions bar */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"8px 12px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0}}>
            <button onClick={()=>setShowMenu(true)} style={{width:34,height:34,borderRadius:10,border:`1px solid ${C.border}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight}}>{I.dots}</button>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>{contentBlocks}</div>
        </div>
      </div>
    </div>
    {showMenu&&<DetailMenu place={place} onClose={()=>setShowMenu(false)} onEdit={onEdit} onDelete={onDelete} onRefresh={handleRefresh} onShare={()=>doShare(place)}/>}
  </>;
}
