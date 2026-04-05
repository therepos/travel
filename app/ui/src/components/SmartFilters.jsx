import { useState } from "react";
import { I, TAG_COLORS } from "../shared.jsx";

export default function SmartFilters({places,filters,setFilters}) {
  const [exp,setExp]=useState(false);
  const h={};places.forEach(p=>{if(!h[p.region])h[p.region]={count:0,countries:{}};h[p.region].count++;if(!h[p.region].countries[p.country])h[p.region].countries[p.country]={count:0,cities:{}};h[p.region].countries[p.country].count++;if(p.city){if(!h[p.region].countries[p.country].cities[p.city])h[p.region].countries[p.country].cities[p.city]=0;h[p.region].countries[p.country].cities[p.city]++;}});
  const uTags=[...new Set(places.flatMap(p=>p.tags||[]))];
  const uAuto=[...new Set(places.flatMap(p=>p.auto_tags||[]))];
  const ac=(filters.region?1:0)+(filters.country?1:0)+(filters.city?1:0)+(filters.tag?1:0)+(filters.autoTag?1:0);
  const countries=filters.region&&h[filters.region]?Object.entries(h[filters.region].countries).sort((a,b)=>b[1].count-a[1].count):[];
  const cities=filters.region&&filters.country&&h[filters.region]?.countries[filters.country]?Object.entries(h[filters.region].countries[filters.country].cities).sort((a,b)=>b[1]-a[1]):[];
  const Fb=({label,active,onClick,color="#1B7A5A"})=><button onClick={onClick} style={{padding:"5px 11px",borderRadius:12,fontSize:13,cursor:"pointer",border:`1px solid ${active?color:"#ECE9E3"}`,background:active?`${color}0F`:"#FFF",color:active?color:"#9E978C"}}>{label}</button>;
  const chips=[filters.region&&{l:filters.region,c:"#1B7A5A",x:()=>setFilters(f=>({...f,region:null,country:null,city:null}))},filters.country&&{l:filters.country,c:"#B8602E",x:()=>setFilters(f=>({...f,country:null,city:null}))},filters.city&&{l:filters.city,c:"#7255A0",x:()=>setFilters(f=>({...f,city:null}))},filters.tag&&{l:filters.tag,c:TAG_COLORS[filters.tag],x:()=>setFilters(f=>({...f,tag:null,autoTag:null}))},filters.autoTag&&{l:filters.autoTag,c:"#8B6B3E",x:()=>setFilters(f=>({...f,autoTag:null}))}].filter(Boolean);
  const SL=({children})=><div style={{fontSize:11,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>{children}</div>;
  return <div style={{flexShrink:0,background:"#FEFDFB"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 14px",borderBottom:exp?"none":".5px solid #EDE9E3"}}>
      <button onClick={()=>setExp(!exp)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,border:`1.5px solid ${ac?"#1B7A5A":"#E8E3DB"}`,background:ac?"#1B7A5A08":"#FFF",color:ac?"#1B7A5A":"#9E978C",cursor:"pointer",fontSize:13,fontWeight:500}}>{I.filter}{ac||"Filter"}</button>
      <div style={{display:"flex",gap:3,flex:1,overflow:"hidden"}}>{chips.map(c=><span key={c.l} style={{padding:"3px 9px",borderRadius:10,fontSize:12,background:`${c.c}0F`,color:c.c,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:2}}>{c.l}<span onClick={c.x} style={{cursor:"pointer",opacity:.6}}>×</span></span>)}</div>
      {ac>0&&<button onClick={()=>setFilters({region:null,country:null,city:null,tag:null,autoTag:null})} style={{fontSize:12,color:"#B04040",background:"none",border:"none",cursor:"pointer"}}>Clear</button>}
    </div>
    {exp&&<div style={{padding:"5px 14px 8px",borderBottom:".5px solid #EDE9E3",animation:"slideIn .15s"}}>
      <SL>Region</SL>
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{Object.entries(h).sort((a,b)=>b[1].count-a[1].count).map(([r,d])=><Fb key={r} label={`${r} (${d.count})`} active={filters.region===r} onClick={()=>setFilters(f=>({...f,region:f.region===r?null:r,country:null,city:null}))}/>)}</div>
      {countries.length>0&&<><SL>Country</SL>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{countries.map(([c,d])=><Fb key={c} label={`${c} (${d.count})`} active={filters.country===c} color="#B8602E" onClick={()=>setFilters(f=>({...f,country:f.country===c?null:c,city:null}))}/>)}</div></>}
      {cities.length>0&&<><SL>City</SL>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{cities.map(([c,n])=><Fb key={c} label={`${c} (${n})`} active={filters.city===c} color="#7255A0" onClick={()=>setFilters(f=>({...f,city:f.city===c?null:c}))}/>)}</div></>}
      <SL>Type</SL>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uTags.map(t=><Fb key={t} label={t} active={filters.tag===t} color={TAG_COLORS[t]} onClick={()=>setFilters(f=>({...f,tag:f.tag===t?null:t,autoTag:null}))}/>)}</div>
      {filters.tag&&uAuto.length>0&&<><SL>Subcategory</SL>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uAuto.map(a=><Fb key={a} label={a} active={filters.autoTag===a} color="#8B6B3E" onClick={()=>setFilters(f=>({...f,autoTag:f.autoTag===a?null:a}))}/>)}</div></>}
    </div>}
  </div>;
}
