import { useState, useEffect, useRef } from "react";
import { I, ib, TAG_COLORS, Chip, Label, doShare } from "../shared.jsx";

export default function DetailView({place,onClose,onDelete,onEdit,routeStopIds,onPrev,onNext,onRefresh}) {
  const [refreshing,setRefreshing]=useState(false);
  const [isMobile,setIsMobile]=useState(window.innerWidth<768);
  const touchRef=useRef(null);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);
  const doRefreshAction=async()=>{if(!onRefresh)return;setRefreshing(true);await onRefresh(place.id);setRefreshing(false);};
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id||""}`;
  const exploreUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(place.name+" "+place.city)}`;
  const reviewsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id||""}`;
  const inRoute = routeStopIds.includes(place.id);

  const onTouchStart=e=>{touchRef.current={x:e.touches[0].clientX,y:e.touches[0].clientY};};
  const onTouchEnd=e=>{
    if(!touchRef.current)return;
    const dx=e.changedTouches[0].clientX-touchRef.current.x;
    const dy=e.changedTouches[0].clientY-touchRef.current.y;
    if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){
      if(dx>0&&onPrev)onPrev();
      else if(dx<0&&onNext)onNext();
    }
    touchRef.current=null;
  };

  const spinRefresh = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"spin 1s linear infinite"}}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;

  // ── Photo block (clickable → explore images) ──
  const photoBlock = (style) => <div style={{background:"#F0EDE8",position:"relative",overflow:"hidden",cursor:"pointer",...style}} onClick={()=>window.open(exploreUrl,"_blank")}>
    {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>}
    {inRoute&&<div style={{position:"absolute",top:10,left:10,display:"flex",alignItems:"center",gap:3,background:"rgba(27,122,90,.9)",padding:"3px 8px",borderRadius:5}}>
      <span style={{color:"#FFF"}}>{I.route}</span><span style={{fontSize:12,color:"#FFF",fontWeight:600}}>In route</span></div>}
    <div style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",borderRadius:6,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,color:"#FFF",fontSize:12}}>
      {I.search} More photos
    </div>
  </div>;

  // ── Content blocks ──
  const contentBlocks = <>
    {/* Title + location + rating */}
    <div>
      <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:isMobile?26:24,color:"#2C2A26",lineHeight:1.2}}>{place.name}</div>
      <div style={{fontSize:13,color:"#9E978C",marginTop:3}}>
        {place.city||place.country}{place.place_type?` · ${place.place_type}`:""}
      </div>
      {(place.rating>0||place.price_level)&&<div style={{display:"flex",alignItems:"center",gap:8,marginTop:6}}>
        {place.rating>0&&<div onClick={()=>window.open(reviewsUrl,"_blank")} style={{display:"flex",alignItems:"center",gap:3,cursor:"pointer",padding:"3px 8px",borderRadius:6,background:"#FDF8F0",border:"1px solid #F0E6D4"}}>
          {I.star}<span style={{fontSize:14,color:"#854F0B",fontWeight:500}}>{place.rating}</span>
          {place.rating_count>0&&<span style={{fontSize:13,color:"#B5AFA5"}}>({place.rating_count>999?`${(place.rating_count/1000).toFixed(1)}k`:place.rating_count})</span>}
        </div>}
        {place.price_level&&<span style={{fontSize:14,color:"#6B665C",fontWeight:500}}>{place.price_level}</span>}
      </div>}
    </div>

    {((place.tags||[]).length>0||(place.auto_tags||[]).length>0)&&<div>
      <Label>Tags</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
        {(place.tags||[]).map(t=><span key={t} style={{padding:"4px 11px",borderRadius:10,fontSize:13,background:`${TAG_COLORS[t]}10`,color:TAG_COLORS[t],border:`1px solid ${TAG_COLORS[t]}20`}}>{t}</span>)}
        {(place.auto_tags||[]).map(t=><Chip key={t}>{t}</Chip>)}
      </div>
    </div>}

    {place.editorial_summary&&<div>
      <Label>About</Label>
      <div style={{fontSize:14,color:"#6B665C",lineHeight:1.5,fontStyle:"italic",paddingLeft:10,borderLeft:"2px solid #E0DBD3"}}>{place.editorial_summary}</div>
    </div>}

    {place.address&&<div>
      <Label>Address</Label>
      <div style={{fontSize:14,color:"#2C2A26",lineHeight:1.4}}>{place.address}</div>
    </div>}

    {(place.phone||place.website)&&<div>
      <Label>Contact</Label>
      {place.phone&&<div style={{display:"flex",alignItems:"center",gap:6,color:"#2C2A26",fontSize:14}}><span style={{color:"#9E978C"}}>{I.phone}</span>{place.phone}</div>}
      {place.website&&<div style={{display:"flex",alignItems:"center",gap:5,color:"#2870A8",marginTop:3}}><span style={{color:"#2870A8"}}>{I.web}</span><a href={place.website} target="_blank" rel="noopener" style={{color:"#2870A8",textDecoration:"none",fontSize:14,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></div>}
    </div>}

    {place.hours&&<div>
      <Label>Hours</Label>
      <div style={{fontSize:14,color:"#2C2A26",lineHeight:1.4}}>{place.hours.split("|").map((h,i)=><div key={i}>{h.trim()}</div>)}</div>
    </div>}

    {(place.dining||[]).length>0&&<div>
      <Label>Dining</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.dining.map(d=><Chip key={d} color="#1B7A5A" bg="#1B7A5A0C">{d}</Chip>)}</div>
    </div>}

    {(place.serves||[]).length>0&&<div>
      <Label>Serves</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.serves.map(s=><Chip key={s}>{s}</Chip>)}</div>
    </div>}

    {(place.amenities||[]).length>0&&<div>
      <Label>Amenities</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.amenities.map(a=><Chip key={a} color="#7255A0" bg="#7255A008">{a}</Chip>)}</div>
    </div>}

    {(place.payment||[]).length>0&&<div>
      <Label>Payment</Label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.payment.map(p=><Chip key={p}>{p}</Chip>)}</div>
    </div>}

    {place.notes&&<div style={{fontSize:14,color:"#6B665C",lineHeight:1.4,padding:"10px 12px",background:"#F7F5F1",borderRadius:6}}>
      <span style={{fontWeight:600,color:"#2C2A26"}}>Note:</span> {place.notes}</div>}

    {/* Clickable static map → opens Google Maps */}
    <div onClick={()=>window.open(mapsUrl,"_blank")} style={{borderRadius:8,overflow:"hidden",border:"1px solid #EDE9E3",flexShrink:0,cursor:"pointer",position:"relative"}}>
      <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=500&h=200`} alt="Map" style={{width:"100%",height:150,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>
      <div style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.45)",backdropFilter:"blur(4px)",borderRadius:6,padding:"4px 8px",display:"flex",alignItems:"center",gap:4,color:"#FFF",fontSize:12}}>
        {I.gmaps} Open in Maps
      </div>
    </div>

    {/* Footer info */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:4}}>
      <div><div style={{fontSize:13,color:"#9E978C"}}>{place.region} · {place.country}{place.city?` · ${place.city}`:""}</div>
        <div style={{fontSize:12,color:"#B5AFA5"}}>Saved {place.saved}</div></div>
    </div>
  </>;

  // ── Header (actions only, no title) ──
  const headerRow = <div style={{display:"flex",alignItems:"center",justifyContent:isMobile?"space-between":"flex-end",padding:"8px 12px",borderBottom:"1px solid #EDE9E3",flexShrink:0,background:"#FEFDFB"}}>
    {isMobile&&<button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4,color:"#2C2A26",display:"flex"}}>{I.back}</button>}
    <div style={{display:"flex",gap:4}}>
      {ib(doRefreshAction,refreshing?spinRefresh:I.refresh,"#2870A8","#F0F6FB","#D4E3F0")}
      {ib(()=>doShare(place),I.share,"#1B7A5A","#F0FBF6","#D4F0E3")}
      {ib(onEdit,I.edit)}
      {ib(()=>onDelete(place.id),I.trash,"#B04040","#FDF6F6","#E8D4D4")}
    </div>
  </div>;

  // ── MOBILE ──
  if(isMobile) return <div style={{position:"fixed",inset:0,zIndex:900,background:"#FEFDFB",animation:"fadeIn .15s",display:"flex",flexDirection:"column",overflowX:"hidden"}}
    onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
    {headerRow}
    <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
      {photoBlock({width:"100%",aspectRatio:"4/3",flexShrink:0})}
      <div style={{padding:"16px 16px",display:"flex",flexDirection:"column",gap:14}}>
        {contentBlocks}
      </div>
    </div>
  </div>;

  // ── DESKTOP ──
  return <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",animation:"fadeIn .15s",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <button onClick={onClose} style={{position:"fixed",top:14,right:14,zIndex:910,width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    {onPrev&&<button onClick={e=>{e.stopPropagation();onPrev();}} style={{position:"fixed",left:14,top:"50%",transform:"translateY(-50%)",zIndex:910,width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",backdropFilter:"blur(4px)"}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>}
    {onNext&&<button onClick={e=>{e.stopPropagation();onNext();}} style={{position:"fixed",right:14,top:"50%",transform:"translateY(-50%)",zIndex:910,width:40,height:40,borderRadius:"50%",border:"none",background:"rgba(255,255,255,.15)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF",backdropFilter:"blur(4px)"}}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 6 15 12 9 18"/></svg>
    </button>}
    <div style={{width:"min(92vw, 960px)",height:"min(88vh, 640px)",background:"#FEFDFB",borderRadius:6,overflow:"hidden",display:"flex",animation:"fadeIn .2s",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
      {photoBlock({flex:1,minWidth:0})}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,borderLeft:"1px solid #EDE9E3"}}>
        {headerRow}
        <div style={{flex:1,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:14}}>
          {contentBlocks}
        </div>
      </div>
    </div>
  </div>;
}
