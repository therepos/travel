import { useState } from "react";
import { C, I, NAV_H } from "../shared.jsx";

export default function SearchView({ places, onClose, onSelect }) {
  const [q,setQ]=useState("");
  const matching = places.filter(p=>
    q && (p.name.toLowerCase().includes(q.toLowerCase())||(p.city||"").toLowerCase().includes(q.toLowerCase())||(p.country||"").toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:NAV_H, zIndex:800, background:C.bg, display:"flex", flexDirection:"column", animation:"fadeIn .15s" }}>
      <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onClose} style={{ width:38, height:38, borderRadius:10, border:"none", background:C.surface, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:C.text }}>{I.back}</button>
        <div style={{ flex:1, display:"flex", alignItems:"center", gap:8, padding:"11px 14px", borderRadius:12, background:C.surface, border:`1.5px solid ${C.border}` }}>
          <span style={{color:C.textLight}}>{I.search}</span>
          <input value={q} onChange={e=>setQ(e.target.value)} autoFocus placeholder="Search saved places..." style={{ flex:1, border:"none", background:"transparent", color:C.text, fontSize:15, outline:"none", fontFamily:"'DM Sans',sans-serif" }}/>
          {q&&<button onClick={()=>setQ("")} style={{background:"none",border:"none",cursor:"pointer",color:C.textLight,padding:0}}>{I.x}</button>}
        </div>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"0 16px" }}>
        {!q&&<div style={{textAlign:"center",padding:"60px 20px",color:C.textLight,fontSize:14}}>Type to search your saved places</div>}
        {q&&matching.length===0&&<div style={{textAlign:"center",padding:"60px 20px",color:C.textLight,fontSize:14}}>No places matching "{q}"</div>}
        {matching.map(p=>(
          <div key={p.id} onClick={()=>{onSelect?.(p);onClose();}} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:`1px solid ${C.borderLight}`, cursor:"pointer" }}>
            <div style={{ width:48, height:48, borderRadius:10, overflow:"hidden", flexShrink:0, background:C.card }}>
              {p.photo&&<img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:600,color:C.text}}>{p.name}</div>
              <div style={{fontSize:13,color:C.textMid}}>{p.city||p.country}</div>
            </div>
            {p.rating>0&&<div style={{display:"flex",alignItems:"center",gap:3}}>{I.star}<span style={{fontSize:13,fontWeight:600,color:C.accent}}>{p.rating}</span></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
