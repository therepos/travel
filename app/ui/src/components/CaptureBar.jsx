import { useState, useRef } from "react";
import { api, TAG_COLORS, I } from "../shared.jsx";

export default function CaptureBar({onSave}) {
  const [q,setQ]=useState("");const [searching,setSearching]=useState(false);const [results,setResults]=useState([]);const [si,setSi]=useState(0);
  const [tags,setTags]=useState([]);const [saved,setSaved]=useState(false);const [err,setErr]=useState("");const ref=useRef(null);
  const search=async()=>{if(!q.trim())return;setSearching(true);setErr("");setResults([]);try{const d=await api(`/search?q=${encodeURIComponent(q.trim())}`);if(d.results?.length){setResults(d.results);setSi(0);}else setErr("No places found");}catch(e){setErr(e.message);}setSearching(false);};
  const sel=results[si]||null;
  const doSave=async()=>{if(!sel)return;try{const s=await api("/places",{method:"POST",body:JSON.stringify({...sel,tags,saved:new Date().toISOString().split("T")[0]})});onSave(s);setResults([]);setQ("");setTags([]);setSaved(true);setTimeout(()=>setSaved(false),2000);ref.current?.focus();}catch(e){setErr(e.message);}};
  return <div style={{flexShrink:0,background:"#FEFDFB",borderBottom:".5px solid #EDE9E3",padding:"10px 14px"}}>
    <div style={{display:"flex",gap:6}}><input ref={ref} value={q} onChange={e=>{setQ(e.target.value);if(results.length)setResults([]);}} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Quick save a place..." style={{flex:1,padding:"12px 14px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:15,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/>
      <button onClick={search} disabled={searching||!q.trim()} style={{padding:"12px 16px",borderRadius:8,border:"none",background:q.trim()?"#B8602E":"#E8E3DB",color:q.trim()?"#FFF":"#A09888",fontWeight:600,fontSize:14,cursor:q.trim()?"pointer":"default",flexShrink:0}}>{searching?"...":"Find"}</button></div>
    {err&&<div style={{fontSize:13,color:"#B04040",marginTop:5}}>{err}</div>}
    {results.length>1&&<div style={{display:"flex",gap:4,marginTop:6,overflowX:"auto"}}>{results.map((r,i)=><button key={i} onClick={()=>setSi(i)} style={{padding:"4px 10px",borderRadius:6,fontSize:12,whiteSpace:"nowrap",border:`1.5px solid ${i===si?"#B8602E":"#E8E3DB"}`,background:i===si?"#B8602E0F":"#FFF",color:i===si?"#B8602E":"#9E978C",cursor:"pointer"}}>{r.name.length>20?r.name.slice(0,20)+"…":r.name}</button>)}</div>}
    {sel&&<div style={{marginTop:6,borderRadius:8,overflow:"hidden",border:"2px solid #D4A574",background:"#FFF",animation:"slideIn .2s"}}>
      <div style={{display:"flex"}}>{sel.photo&&<div style={{width:70,height:70,flexShrink:0,overflow:"hidden"}}><img src={sel.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentElement.style.display="none"}}/></div>}
        <div style={{flex:1,padding:"8px 10px",minWidth:0}}><div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:16,color:"#2C2A26",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sel.name}</div>
          <div style={{fontSize:13,color:"#9E978C",marginTop:1}}>{sel.country}{sel.city?` · ${sel.city}`:""}</div>
          <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>{["food","nature","temple","city","culture","hiking","historical","beach"].map(t=><button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{padding:"2px 8px",borderRadius:8,fontSize:11,border:"none",background:tags.includes(t)?`${TAG_COLORS[t]}18`:"#F3F0EB",color:tags.includes(t)?TAG_COLORS[t]:"#A09888",cursor:"pointer"}}>{t}</button>)}</div></div></div>
      <div style={{display:"flex",borderTop:"1px solid #F0EDE8"}}><button onClick={doSave} style={{flex:1,padding:10,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:14,fontWeight:600,cursor:"pointer",borderRadius:"0 0 0 6px"}}>✓ Save</button>
        <button onClick={()=>{setResults([]);setQ("");}} style={{flex:1,padding:10,border:"none",background:"#FFF",color:"#9E978C",fontSize:14,cursor:"pointer",borderRadius:"0 0 6px 0"}}>✕ Skip</button></div></div>}
    {saved&&<div style={{marginTop:5,padding:"7px 10px",borderRadius:6,background:"#1B7A5A0F",color:"#1B7A5A",fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:4,animation:"slideIn .2s"}}>{I.check} Saved & organized</div>}
  </div>;
}
