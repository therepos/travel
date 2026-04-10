import { useState, useRef } from "react";
import { C, I, TAG_COLORS } from "../shared.jsx";

export default function SwipeRow({ place, onTap, onEdit, onDelete, isSelected, selectMode, onToggleSelect, onDotsClick, routeStopIds }) {
  const startX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const inRoute = (routeStopIds||[]).includes(place.id);

  const onTS = e => { if(selectMode)return; startX.current=e.touches[0].clientX; setSwiping(true); };
  const onTM = e => { if(!swiping||selectMode)return; setOffset(Math.max(-80,Math.min(80,e.touches[0].clientX-startX.current))); };
  const onTE = () => { if(!swiping)return; setSwiping(false); if(offset<-40)setOffset(-80); else if(offset>40)setOffset(80); else setOffset(0); };
  const reset = () => setOffset(0);

  return (
    <div style={{ position:"relative", overflow:"hidden" }}>
      {/* Delete panel (behind, right side) */}
      <div style={{ position:"absolute", right:0, top:0, bottom:0, width:80, background:C.danger, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div onClick={()=>{reset();onDelete?.(place.id);}} style={{ color:"#FFF", display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }}>
          {I.trash}<span style={{fontSize:10,fontWeight:600}}>Delete</span>
        </div>
      </div>
      {/* Edit panel (behind, left side) */}
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:80, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div onClick={()=>{reset();onEdit?.(place);}} style={{ color:"#FFF", display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer" }}>
          {I.edit}<span style={{fontSize:10,fontWeight:600}}>Edit</span>
        </div>
      </div>
      {/* Sliding row content */}
      <div onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
        onClick={()=> selectMode ? onToggleSelect?.(place.id) : (offset===0 && onTap?.(place))}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"10px 16px",
          background: isSelected ? C.accentLight : C.surface,
          borderBottom:`1px solid ${isSelected ? C.accentBorder : C.borderLight}`,
          cursor:"pointer", position:"relative", zIndex:2,
          transform:`translateX(${offset}px)`,
          transition: swiping ? "none" : "transform .25s cubic-bezier(.4,0,.2,1)",
        }}>
        {/* Selection checkbox */}
        {selectMode && <div style={{ width:24, height:24, borderRadius:8, flexShrink:0, border:`2px solid ${isSelected?C.accent:C.border}`, background:isSelected?C.accent:"transparent", display:"flex", alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
          {isSelected && <span style={{color:"#FFF"}}>{I.check}</span>}
        </div>}
        {/* Thumbnail */}
        <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0, background:C.card, position:"relative" }}>
          {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
          {inRoute&&<div style={{ position:"absolute", bottom:2, right:2, width:10, height:10, borderRadius:"50%", background:C.success, border:"2px solid #FFF" }}/>}
        </div>
        {/* Info */}
        <div style={{flex:1,minWidth:0}}>
          <div style={{ fontSize:15, fontWeight:600, color:C.text, letterSpacing:"-0.01em", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{place.name}</div>
          <div style={{ fontSize:13, color:C.textMid, marginTop:2 }}>
            {place.city||place.country}
            {place.place_type&&<span style={{color:C.textLight}}> · {place.place_type}</span>}
          </div>
          {(place.tags||[]).length>0 && <div style={{ display:"flex", gap:4, marginTop:5, flexWrap:"wrap" }}>
            {place.tags.map(t=><span key={t} style={{ padding:"2px 8px", borderRadius:6, fontSize:11, fontWeight:600, background:`${TAG_COLORS[t]||C.textLight}14`, color:TAG_COLORS[t]||C.textLight }}>{t}</span>)}
          </div>}
        </div>
        {/* Rating + dots */}
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          {place.rating>0 && <div style={{ display:"flex", alignItems:"center", gap:3, padding:"3px 8px", borderRadius:8, background:C.accentLight }}>
            {I.star}<span style={{fontSize:13,fontWeight:600,color:C.accent}}>{place.rating}</span>
          </div>}
          {!selectMode && <button onClick={e=>{e.stopPropagation();onDotsClick?.(place.id);}} style={{ width:32, height:32, borderRadius:8, border:"none", background:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.textLight }}>{I.dots}</button>}
        </div>
      </div>
    </div>
  );
}
