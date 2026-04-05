import { useState } from "react";
import { C, I, TAG_COLORS } from "../shared.jsx";

export default function SmartFilters({places,filters,setFilters}) {
  const [exp,setExp]=useState(false);
  const h={};places.forEach(p=>{if(!h[p.region])h[p.region]={count:0,countries:{}};h[p.region].count++;if(!h[p.region].countries[p.country])h[p.region].countries[p.country]={count:0,cities:{}};h[p.region].countries[p.country].count++;if(p.city){if(!h[p.region].countries[p.country].cities[p.city])h[p.region].countries[p.country].cities[p.city]=0;h[p.region].countries[p.country].cities[p.city]++;}});
  const uTags=[...new Set(places.flatMap(p=>p.tags||[]))];
  const uAuto=[...new Set(places.flatMap(p=>p.auto_tags||[]))];
  const ac=(filters.region?1:0)+(filters.country?1:0)+(filters.city?1:0)+(filters.tag?1:0)+(filters.autoTag?1:0);
  const countries=filters.region&&h[filters.region]?Object.entries(h[filters.region].countries).sort((a,b)=>b[1].count-a[1].count):[];
  const cities=filters.region&&filters.country&&h[filters.region]?.countries[filters.country]?Object.entries(h[filters.region].countries[filters.country].cities).sort((a,b)=>b[1]-a[1]):[];
  const Fb=({label,active,onClick,color=C.success})=><button onClick={onClick} style={{padding:"5px 11px",borderRadius:10,fontSize:13,cursor:"pointer",border:`1px solid ${active?color:C.border}`,background:active?`${color}14`:C.surface,color:active?color:C.textMid,whiteSpace:"nowrap",flexShrink:0}}>{label}</button>;
  const chips=[filters.region&&{l:filters.region,c:C.success,x:()=>setFilters(f=>({...f,region:null,country:null,city:null}))},filters.country&&{l:filters.country,c:C.accent,x:()=>setFilters(f=>({...f,country:null,city:null}))},filters.city&&{l:filters.city,c:"#7B6B9A",x:()=>setFilters(f=>({...f,city:null}))},filters.tag&&{l:filters.tag,c:TAG_COLORS[filters.tag],x:()=>setFilters(f=>({...f,tag:null,autoTag:null}))},filters.autoTag&&{l:filters.autoTag,c:"#8B7B4A",x:()=>setFilters(f=>({...f,autoTag:null}))}].filter(Boolean);
  const SL=({children})=><div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>{children}</div>;
  return <div style={{flexShrink:0}}>
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 14px 6px",overflowX:"auto"}}>
      <button onClick={()=>setExp(!exp)} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:10,border:`1.5px solid ${ac?C.accent:C.border}`,background:ac?C.accentLight:C.surface,color:ac?C.accent:C.textMid,cursor:"pointer",fontSize:13,fontWeight:600,flexShrink:0}}>{I.filter}{ac||"Filter"}</button>
      <div style={{display:"flex",gap:3,flex:1,overflow:"hidden"}}>{chips.map(c=><span key={c.l} style={{padding:"3px 9px",borderRadius:10,fontSize:12,background:`${c.c}14`,color:c.c,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:2}}>{c.l}<span onClick={c.x} style={{cursor:"pointer",opacity:.6}}>×</span></span>)}</div>
      {ac>0&&<button onClick={()=>setFilters({region:null,country:null,city:null,tag:null,autoTag:null})} style={{fontSize:12,color:C.danger,background:"none",border:"none",cursor:"pointer",flexShrink:0}}>Clear</button>}
    </div>
    {exp&&<div style={{padding:"5px 14px 8px",animation:"slideIn .15s"}}>
      <SL>Region</SL>
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{Object.entries(h).sort((a,b)=>b[1].count-a[1].count).map(([r,d])=><Fb key={r} label={`${r} (${d.count})`} active={filters.region===r} onClick={()=>setFilters(f=>({...f,region:f.region===r?null:r,country:null,city:null}))}/>)}</div>
      {countries.length>0&&<><SL>Country</SL><div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{countries.map(([c,d])=><Fb key={c} label={`${c} (${d.count})`} active={filters.country===c} color={C.accent} onClick={()=>setFilters(f=>({...f,country:f.country===c?null:c,city:null}))}/>)}</div></>}
      {cities.length>0&&<><SL>City</SL><div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{cities.map(([c,n])=><Fb key={c} label={`${c} (${n})`} active={filters.city===c} color="#7B6B9A" onClick={()=>setFilters(f=>({...f,city:f.city===c?null:c}))}/>)}</div></>}
      <SL>Type</SL>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uTags.map(t=><Fb key={t} label={t} active={filters.tag===t} color={TAG_COLORS[t]} onClick={()=>setFilters(f=>({...f,tag:f.tag===t?null:t,autoTag:null}))}/>)}</div>
      {filters.tag&&uAuto.length>0&&<><SL>Subcategory</SL><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uAuto.map(a=><Fb key={a} label={a} active={filters.autoTag===a} color="#8B7B4A" onClick={()=>setFilters(f=>({...f,autoTag:f.autoTag===a?null:a}))}/>)}</div></>}
    </div>}
  </div>;
}
