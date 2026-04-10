import { useState, useRef } from "react";
import { api, C, TAG_COLORS, I } from "../shared.jsx";

export default function CaptureBar({onSave}) {
  const [q,setQ]=useState("");const [searching,setSearching]=useState(false);const [results,setResults]=useState([]);const [si,setSi]=useState(0);
  const [tags,setTags]=useState([]);const [saved,setSaved]=useState(false);const [err,setErr]=useState("");const ref=useRef(null);
  const search=async()=>{if(!q.trim())return;setSearching(true);setErr("");setResults([]);try{const d=await api(`/search?q=${encodeURIComponent(q.trim())}`);if(d.results?.length){setResults(d.results);setSi(0);}else setErr("No places found");}catch(e){setErr(e.message);}setSearching(false);};
  const sel=results[si]||null;
  const doSave=async()=>{if(!sel)return;try{const s=await api("/places",{method:"POST",body:JSON.stringify({...sel,tags,saved:new Date().toISOString().split("T")[0]})});onSave(s);setResults([]);setQ("");setTags([]);setSaved(true);setTimeout(()=>setSaved(false),2000);ref.current?.focus();}catch(e){setErr(e.message);}};
  return <div style={{flexShrink:0,padding:"6px 16px 4px",animation:"slideIn .15s"}}>
    <div style={{display:"flex",gap:8}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"12px 14px",borderRadius:14,background:C.surface,border:`1.5px solid ${C.borderLight}`}}>
        <span style={{color:C.textLight,flexShrink:0}}>{I.search}</span>
        <input ref={ref} value={q} onChange={e=>{setQ(e.target.value);if(results.length)setResults([]);}} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Quick save a place..." style={{flex:1,border:"none",background:"transparent",color:C.text,fontSize:15,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
      </div>
      <button onClick={search} disabled={searching||!q.trim()} style={{padding:"12px 20px",borderRadius:14,border:"none",background:q.trim()?C.card:C.border,color:q.trim()?C.textOnDark:C.textLight,fontWeight:700,fontSize:14,cursor:q.trim()?"pointer":"default",transition:"all .15s"}}>{searching?"...":"Find"}</button>
    </div>
    {err&&<div style={{fontSize:13,color:C.danger,marginTop:5}}>{err}</div>}
    {results.length>1&&<div style={{display:"flex",gap:4,marginTop:6,overflowX:"auto"}}>{results.map((r,i)=><button key={i} onClick={()=>setSi(i)} style={{padding:"4px 10px",borderRadius:8,fontSize:12,whiteSpace:"nowrap",border:`1.5px solid ${i===si?C.accent:C.border}`,background:i===si?C.accentLight:C.surface,color:i===si?C.accent:C.textLight,cursor:"pointer"}}>{r.name.length>20?r.name.slice(0,20)+"…":r.name}</button>)}</div>}
    {sel&&<div style={{marginTop:6,borderRadius:14,overflow:"hidden",border:`2px solid ${C.accent}`,background:C.surface,animation:"slideIn .2s"}}>
      <div style={{display:"flex"}}>{sel.photo&&<div style={{width:70,height:70,flexShrink:0,overflow:"hidden"}}><img src={sel.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentElement.style.display="none"}}/></div>}
        <div style={{flex:1,padding:"8px 10px",minWidth:0}}>
          <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:16,color:C.text,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sel.name}</div>
          <div style={{fontSize:13,color:C.textMid,marginTop:1}}>{sel.country}{sel.city?` · ${sel.city}`:""}</div>
          <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>{["food","nature","temple","city","culture","hiking","historical","beach"].map(t=><button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{padding:"2px 8px",borderRadius:8,fontSize:11,border:"none",background:tags.includes(t)?`${TAG_COLORS[t]}18`:C.borderLight,color:tags.includes(t)?TAG_COLORS[t]:C.textLight,cursor:"pointer"}}>{t}</button>)}</div>
        </div>
      </div>
      <div style={{display:"flex",borderTop:`1px solid ${C.borderLight}`}}>
        <button onClick={doSave} style={{flex:1,padding:10,border:"none",background:C.success,color:"#FFF",fontSize:14,fontWeight:600,cursor:"pointer",borderRadius:"0 0 0 12px"}}>✓ Save</button>
        <button onClick={()=>{setResults([]);setQ("");}} style={{flex:1,padding:10,border:"none",background:C.surface,color:C.textLight,fontSize:14,cursor:"pointer",borderRadius:"0 0 12px 0"}}>✕ Skip</button>
      </div>
    </div>}
    {saved&&<div style={{marginTop:5,padding:"7px 10px",borderRadius:8,background:C.successBg,color:C.success,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:4,animation:"slideIn .2s"}}>{I.check} Saved & organized</div>}
  </div>;
}
