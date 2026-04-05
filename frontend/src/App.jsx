import { useState, useEffect, useRef } from "react";

const TAG_OPTIONS = ["temple","nature","city","culture","food","hiking","historical","beach","nightlife","village","architecture"];
const TAG_COLORS = {temple:"#B8602E",nature:"#1B7A5A",city:"#8A4A6B",culture:"#C45530",food:"#2E8A7A",hiking:"#8B6B3E",historical:"#7255A0",beach:"#2870A8",nightlife:"#4A6A9A",village:"#B05575",architecture:"#5A4A7A"};

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { headers: {"Content-Type":"application/json",...opts.headers}, ...opts });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail||`API error ${res.status}`); }
  return res.json();
}

// ── Icons ────────────────────────────────────────────────
const I = {
  filter:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  search:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  x:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  back:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  gmaps:<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.75a2.75 2.75 0 110-5.5 2.75 2.75 0 010 5.5z" fill="#34A853"/><path d="M12 2v6.24l5.59 5.6C18.5 12.37 19 10.74 19 9c0-3.87-3.13-7-7-7z" fill="#FBBC04"/><path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.5 3.37 1.41 4.84l5.59-5.6V2z" fill="#4285F4"/><path d="M6.41 13.84C7.53 15.56 9 17.03 10 18.63c.47.75.81 1.45 1.17 2.26.26.55.47 1.5 1.26 1.5s1-.95 1.27-1.5c.36-.81.7-1.51 1.17-2.26.55-.88 1.18-1.71 1.83-2.51L12 11.24l-5.59 2.6z" fill="#EA4335"/></svg>,
  trash:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  check:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  route:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 000-7h-11a3.5 3.5 0 010-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  explore:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  star:<svg width="12" height="12" viewBox="0 0 24 24" fill="#BA7517" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  phone:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  web:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  clock:<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  plus:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
};
const ib = (onClick,icon,color="#9E978C",bg="#FFF",border="#E8E3DB") =>
  <button onClick={onClick} style={{width:28,height:28,borderRadius:"50%",border:`1px solid ${border}`,background:bg,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color,flexShrink:0,padding:0}}>{icon}</button>;

// ── Edit Modal ───────────────────────────────────────────
function EditModal({place,onClose,onSaved}) {
  const [name,setName]=useState(place.name);
  const [tags,setTags]=useState(place.tags||[]);
  const [notes,setNotes]=useState(place.notes||"");
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{const u=await api(`/places/${place.id}`,{method:"PUT",body:JSON.stringify({name,tags,notes})});onSaved(u);onClose();}catch(e){console.error(e);}setSaving(false);};
  return <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,.2)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:"100%",maxWidth:480,background:"#FEFDFB",borderRadius:"20px 20px 0 0",padding:"18px 18px 26px",maxHeight:"75vh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.4,0,.2,1)",boxShadow:"0 -8px 40px rgba(0,0,0,.1)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"#DDD8D0",margin:"0 auto 14px"}}/>
      <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:18,color:"#2C2A26",marginBottom:14}}>Edit place</div>
      <div style={{marginBottom:10}}><div style={{fontSize:10,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:4}}>Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:13,outline:"none",boxSizing:"border-box"}}/></div>
      <div style={{marginBottom:10}}><div style={{fontSize:10,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:4}}>Tags</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{TAG_OPTIONS.map(t=><button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{padding:"4px 11px",borderRadius:16,fontSize:11,border:"none",background:tags.includes(t)?`${TAG_COLORS[t]}18`:"#F3F0EB",color:tags.includes(t)?TAG_COLORS[t]:"#A09888",cursor:"pointer",fontWeight:tags.includes(t)?600:400}}>{t}</button>)}</div></div>
      <div style={{marginBottom:14}}><div style={{fontSize:10,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:4}}>Notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Add a note..." style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box"}}/></div>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:13,fontWeight:600,cursor:"pointer"}}>{saving?"Saving...":"Save changes"}</button>
    </div></div>;
}

// ── Detail View (Instagram-style floating modal) ─────────
function DetailView({place,onClose,onDelete,onEdit,routeStopIds}) {
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.google_place_id||""}`;
  const exploreUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(place.name+" "+place.city)}`;
  const inRoute = routeStopIds.includes(place.id);
  const Chip = ({children,color="#6B665C",bg="#F3F0EB"})=><span style={{padding:"2px 7px",borderRadius:5,fontSize:10.5,background:bg,color,whiteSpace:"nowrap"}}>{children}</span>;
  const Label = ({children})=><div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:3}}>{children}</div>;

  return <div style={{position:"fixed",inset:0,zIndex:900,background:"rgba(0,0,0,.65)",animation:"fadeIn .15s",display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    {/* X close button */}
    <button onClick={onClose} style={{position:"fixed",top:14,right:14,zIndex:910,width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    {/* Modal card */}
    <div style={{width:"min(92vw, 960px)",height:"min(88vh, 640px)",background:"#FEFDFB",borderRadius:6,overflow:"hidden",display:"flex",animation:"fadeIn .2s",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
      {/* LEFT: photo fills entire left half */}
      <div style={{flex:1,background:"#F0EDE8",position:"relative",overflow:"hidden",minWidth:0}}>
        {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>}
        {inRoute&&<div style={{position:"absolute",top:10,left:10,display:"flex",alignItems:"center",gap:3,background:"rgba(27,122,90,.9)",padding:"3px 8px",borderRadius:5}}>
          <span style={{color:"#FFF"}}>{I.route}</span><span style={{fontSize:10,color:"#FFF",fontWeight:600}}>In route</span></div>}
      </div>

      {/* RIGHT: details panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,borderLeft:"1px solid #EDE9E3"}}>
        {/* Header row */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid #EDE9E3",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0,flex:1}}>
            <div style={{width:32,height:32,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#F0EDE8"}}>
              {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>
            <div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#2C2A26",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{place.name}</div>
              <div style={{fontSize:11,color:"#9E978C"}}>{place.city||place.country}</div></div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0}}>
            {ib(onEdit,I.edit)}
            {ib(()=>window.open(mapsUrl,"_blank"),I.gmaps)}
            {ib(()=>onDelete(place.id),I.trash,"#B04040","#FDF6F6","#E8D4D4")}
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{flex:1,overflowY:"auto",padding:"14px 16px",display:"flex",flexDirection:"column",gap:12}}>
          {/* Name + rating block */}
          <div>
            <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:20,color:"#2C2A26",lineHeight:1.2}}>{place.name}</div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:4}}>
              {place.rating>0&&<div style={{display:"flex",alignItems:"center",gap:3}}>
                {I.star}<span style={{fontSize:12,color:"#854F0B",fontWeight:500}}>{place.rating}</span>
                {place.rating_count>0&&<span style={{fontSize:11,color:"#B5AFA5"}}>({place.rating_count>999?`${(place.rating_count/1000).toFixed(1)}k`:place.rating_count})</span>}
              </div>}
              {place.price_level&&<span style={{fontSize:12,color:"#6B665C",fontWeight:500}}>{place.price_level}</span>}
            </div>
          </div>

          {/* Tags */}
          {((place.tags||[]).length>0||(place.auto_tags||[]).length>0)&&<div>
            <Label>Tags</Label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {(place.tags||[]).map(t=><span key={t} style={{padding:"3px 9px",borderRadius:10,fontSize:11,background:`${TAG_COLORS[t]}10`,color:TAG_COLORS[t],border:`1px solid ${TAG_COLORS[t]}20`}}>{t}</span>)}
              {(place.auto_tags||[]).map(t=><Chip key={t}>{t}</Chip>)}
            </div>
          </div>}

          {/* Editorial summary */}
          {place.editorial_summary&&<div>
            <Label>About</Label>
            <div style={{fontSize:12,color:"#6B665C",lineHeight:1.5,fontStyle:"italic",paddingLeft:10,borderLeft:"2px solid #E0DBD3"}}>{place.editorial_summary}</div>
          </div>}

          {/* Address */}
          {place.address&&<div>
            <Label>Address</Label>
            <div style={{fontSize:12,color:"#2C2A26",lineHeight:1.4}}>{place.address}</div>
          </div>}

          {/* Contact */}
          {(place.phone||place.website)&&<div>
            <Label>Contact</Label>
            {place.phone&&<div style={{display:"flex",alignItems:"center",gap:5,color:"#2C2A26",fontSize:12}}><span style={{color:"#9E978C"}}>{I.phone}</span>{place.phone}</div>}
            {place.website&&<div style={{display:"flex",alignItems:"center",gap:5,color:"#2870A8",marginTop:3}}><span style={{color:"#2870A8"}}>{I.web}</span><a href={place.website} target="_blank" rel="noopener" style={{color:"#2870A8",textDecoration:"none",fontSize:12,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></div>}
          </div>}

          {/* Hours */}
          {place.hours&&<div>
            <Label>Hours</Label>
            <div style={{fontSize:12,color:"#2C2A26",lineHeight:1.4}}>{place.hours.split("|").map((h,i)=><div key={i}>{h.trim()}</div>)}</div>
          </div>}

          {/* Dining */}
          {(place.dining||[]).length>0&&<div>
            <Label>Dining</Label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.dining.map(d=><Chip key={d} color="#1B7A5A" bg="#1B7A5A0C">{d}</Chip>)}</div>
          </div>}

          {/* Serves */}
          {(place.serves||[]).length>0&&<div>
            <Label>Serves</Label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.serves.map(s=><Chip key={s}>{s}</Chip>)}</div>
          </div>}

          {/* Amenities */}
          {(place.amenities||[]).length>0&&<div>
            <Label>Amenities</Label>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{place.amenities.map(a=><Chip key={a} color="#7255A0" bg="#7255A008">{a}</Chip>)}</div>
          </div>}

          {/* Notes */}
          {place.notes&&<div style={{fontSize:12,color:"#6B665C",lineHeight:1.4,padding:"8px 10px",background:"#F7F5F1",borderRadius:6}}>
            <span style={{fontWeight:600,color:"#2C2A26"}}>Note:</span> {place.notes}</div>}

          {/* Map */}
          <div style={{borderRadius:8,overflow:"hidden",border:"1px solid #EDE9E3",flexShrink:0}}>
            <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=500&h=200`} alt="Map" style={{width:"100%",height:140,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none"}}/>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderTop:"1px solid #EDE9E3",flexShrink:0,background:"#FEFDFB"}}>
          <div><div style={{fontSize:11,color:"#9E978C"}}>{place.region} · {place.country}{place.city?` · ${place.city}`:""}</div>
            <div style={{fontSize:10,color:"#B5AFA5"}}>Saved {place.saved}</div></div>
          <div style={{display:"flex",gap:5}}>
            <button onClick={()=>window.open(exploreUrl,"_blank")} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:"1px solid #E8E3DB",background:"#FFF",cursor:"pointer",fontSize:11,color:"#6B665C",fontWeight:500}}>
              {I.explore} Explore</button>
            <button onClick={()=>window.open(mapsUrl,"_blank")} style={{display:"flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:6,border:"none",background:"#1B7A5A",cursor:"pointer",fontSize:11,color:"#FFF",fontWeight:600}}>
              {I.gmaps} Open Maps</button>
          </div>
        </div>
      </div>
    </div>
  </div>;
}

// ── Capture Bar ──────────────────────────────────────────
function CaptureBar({onSave}) {
  const [q,setQ]=useState("");const [searching,setSearching]=useState(false);const [results,setResults]=useState([]);const [si,setSi]=useState(0);
  const [tags,setTags]=useState([]);const [saved,setSaved]=useState(false);const [err,setErr]=useState("");const ref=useRef(null);
  const search=async()=>{if(!q.trim())return;setSearching(true);setErr("");setResults([]);try{const d=await api(`/search?q=${encodeURIComponent(q.trim())}`);if(d.results?.length){setResults(d.results);setSi(0);}else setErr("No places found");}catch(e){setErr(e.message);}setSearching(false);};
  const sel=results[si]||null;
  const doSave=async()=>{if(!sel)return;try{const s=await api("/places",{method:"POST",body:JSON.stringify({...sel,tags,saved:new Date().toISOString().split("T")[0]})});onSave(s);setResults([]);setQ("");setTags([]);setSaved(true);setTimeout(()=>setSaved(false),2000);ref.current?.focus();}catch(e){setErr(e.message);}};
  return <div style={{flexShrink:0,background:"#FEFDFB",borderBottom:".5px solid #EDE9E3",padding:"10px 14px"}}>
    <div style={{display:"flex",gap:6}}><input ref={ref} value={q} onChange={e=>{setQ(e.target.value);if(results.length)setResults([]);}} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Quick save a place..." style={{flex:1,padding:"10px 12px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:13,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/>
      <button onClick={search} disabled={searching||!q.trim()} style={{padding:"10px 14px",borderRadius:8,border:"none",background:q.trim()?"#B8602E":"#E8E3DB",color:q.trim()?"#FFF":"#A09888",fontWeight:600,fontSize:12,cursor:q.trim()?"pointer":"default",flexShrink:0}}>{searching?"...":"Find"}</button></div>
    {err&&<div style={{fontSize:11,color:"#B04040",marginTop:5}}>{err}</div>}
    {results.length>1&&<div style={{display:"flex",gap:4,marginTop:6,overflowX:"auto"}}>{results.map((r,i)=><button key={i} onClick={()=>setSi(i)} style={{padding:"3px 8px",borderRadius:6,fontSize:10,whiteSpace:"nowrap",border:`1.5px solid ${i===si?"#B8602E":"#E8E3DB"}`,background:i===si?"#B8602E0F":"#FFF",color:i===si?"#B8602E":"#9E978C",cursor:"pointer"}}>{r.name.length>20?r.name.slice(0,20)+"…":r.name}</button>)}</div>}
    {sel&&<div style={{marginTop:6,borderRadius:8,overflow:"hidden",border:"2px solid #D4A574",background:"#FFF",animation:"slideIn .2s"}}>
      <div style={{display:"flex"}}>{sel.photo&&<div style={{width:65,height:65,flexShrink:0,overflow:"hidden"}}><img src={sel.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.parentElement.style.display="none"}}/></div>}
        <div style={{flex:1,padding:"7px 9px",minWidth:0}}><div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:14,color:"#2C2A26",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sel.name}</div>
          <div style={{fontSize:11,color:"#9E978C",marginTop:1}}>{sel.country}{sel.city?` · ${sel.city}`:""}</div>
          <div style={{display:"flex",gap:3,marginTop:4,flexWrap:"wrap"}}>{["food","nature","temple","city","culture","hiking","historical","beach"].map(t=><button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{padding:"1px 6px",borderRadius:8,fontSize:9,border:"none",background:tags.includes(t)?`${TAG_COLORS[t]}18`:"#F3F0EB",color:tags.includes(t)?TAG_COLORS[t]:"#A09888",cursor:"pointer"}}>{t}</button>)}</div></div></div>
      <div style={{display:"flex",borderTop:"1px solid #F0EDE8"}}><button onClick={doSave} style={{flex:1,padding:8,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:12,fontWeight:600,cursor:"pointer",borderRadius:"0 0 0 6px"}}>✓ Save</button>
        <button onClick={()=>{setResults([]);setQ("");}} style={{flex:1,padding:8,border:"none",background:"#FFF",color:"#9E978C",fontSize:12,cursor:"pointer",borderRadius:"0 0 6px 0"}}>✕ Skip</button></div></div>}
    {saved&&<div style={{marginTop:5,padding:"6px 9px",borderRadius:6,background:"#1B7A5A0F",color:"#1B7A5A",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",gap:4,animation:"slideIn .2s"}}>{I.check} Saved & organized</div>}
  </div>;
}

// ── Smart Filters ────────────────────────────────────────
function SmartFilters({places,filters,setFilters}) {
  const [exp,setExp]=useState(false);
  const h={};places.forEach(p=>{if(!h[p.region])h[p.region]={count:0,countries:{}};h[p.region].count++;if(!h[p.region].countries[p.country])h[p.region].countries[p.country]={count:0,cities:{}};h[p.region].countries[p.country].count++;if(p.city){if(!h[p.region].countries[p.country].cities[p.city])h[p.region].countries[p.country].cities[p.city]=0;h[p.region].countries[p.country].cities[p.city]++;}});
  const uTags=[...new Set(places.flatMap(p=>p.tags||[]))];
  const uAuto=[...new Set(places.flatMap(p=>p.auto_tags||[]))];
  const ac=(filters.region?1:0)+(filters.country?1:0)+(filters.city?1:0)+(filters.tag?1:0)+(filters.autoTag?1:0);
  const countries=filters.region&&h[filters.region]?Object.entries(h[filters.region].countries).sort((a,b)=>b[1].count-a[1].count):[];
  const cities=filters.region&&filters.country&&h[filters.region]?.countries[filters.country]?Object.entries(h[filters.region].countries[filters.country].cities).sort((a,b)=>b[1]-a[1]):[];
  const Fb=({label,active,onClick,color="#1B7A5A"})=><button onClick={onClick} style={{padding:"3px 9px",borderRadius:12,fontSize:11,cursor:"pointer",border:`1px solid ${active?color:"#ECE9E3"}`,background:active?`${color}0F`:"#FFF",color:active?color:"#9E978C"}}>{label}</button>;
  const chips=[filters.region&&{l:filters.region,c:"#1B7A5A",x:()=>setFilters(f=>({...f,region:null,country:null,city:null}))},filters.country&&{l:filters.country,c:"#B8602E",x:()=>setFilters(f=>({...f,country:null,city:null}))},filters.city&&{l:filters.city,c:"#7255A0",x:()=>setFilters(f=>({...f,city:null}))},filters.tag&&{l:filters.tag,c:TAG_COLORS[filters.tag],x:()=>setFilters(f=>({...f,tag:null,autoTag:null}))},filters.autoTag&&{l:filters.autoTag,c:"#8B6B3E",x:()=>setFilters(f=>({...f,autoTag:null}))}].filter(Boolean);
  return <div style={{flexShrink:0,background:"#FEFDFB"}}>
    <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 14px",borderBottom:exp?"none":".5px solid #EDE9E3"}}>
      <button onClick={()=>setExp(!exp)} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:6,border:`1.5px solid ${ac?"#1B7A5A":"#E8E3DB"}`,background:ac?"#1B7A5A08":"#FFF",color:ac?"#1B7A5A":"#9E978C",cursor:"pointer",fontSize:11,fontWeight:500}}>{I.filter}{ac||"Filter"}</button>
      <div style={{display:"flex",gap:3,flex:1,overflow:"hidden"}}>{chips.map(c=><span key={c.l} style={{padding:"2px 7px",borderRadius:10,fontSize:10,background:`${c.c}0F`,color:c.c,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:2}}>{c.l}<span onClick={c.x} style={{cursor:"pointer",opacity:.6}}>×</span></span>)}</div>
      {ac>0&&<button onClick={()=>setFilters({region:null,country:null,city:null,tag:null,autoTag:null})} style={{fontSize:10,color:"#B04040",background:"none",border:"none",cursor:"pointer"}}>Clear</button>}
    </div>
    {exp&&<div style={{padding:"5px 14px 8px",borderBottom:".5px solid #EDE9E3",animation:"slideIn .15s"}}>
      <div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>Region</div>
      <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{Object.entries(h).sort((a,b)=>b[1].count-a[1].count).map(([r,d])=><Fb key={r} label={`${r} (${d.count})`} active={filters.region===r} onClick={()=>setFilters(f=>({...f,region:f.region===r?null:r,country:null,city:null}))}/>)}</div>
      {countries.length>0&&<><div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>Country</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{countries.map(([c,d])=><Fb key={c} label={`${c} (${d.count})`} active={filters.country===c} color="#B8602E" onClick={()=>setFilters(f=>({...f,country:f.country===c?null:c,city:null}))}/>)}</div></>}
      {cities.length>0&&<><div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>City</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>{cities.map(([c,n])=><Fb key={c} label={`${c} (${n})`} active={filters.city===c} color="#7255A0" onClick={()=>setFilters(f=>({...f,city:f.city===c?null:c}))}/>)}</div></>}
      <div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4}}>Type</div>
      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uTags.map(t=><Fb key={t} label={t} active={filters.tag===t} color={TAG_COLORS[t]} onClick={()=>setFilters(f=>({...f,tag:f.tag===t?null:t,autoTag:null}))}/>)}</div>
      {filters.tag&&uAuto.length>0&&<><div style={{fontSize:9,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".7px",fontWeight:600,marginBottom:4,marginTop:6}}>Subcategory</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{uAuto.map(a=><Fb key={a} label={a} active={filters.autoTag===a} color="#8B6B3E" onClick={()=>setFilters(f=>({...f,autoTag:f.autoTag===a?null:a}))}/>)}</div></>}
    </div>}
  </div>;
}

// ── Route Planner ────────────────────────────────────────
function RoutePlanner({allPlaces,initialStops,editingRoute,onClose,onSaved}) {
  const [selected,setSelected]=useState(initialStops||[]);
  const [searchQ,setSearchQ]=useState("");
  const [name,setName]=useState(editingRoute?.name||"New route");
  const [saving,setSaving]=useState(false);

  const filtered=allPlaces.filter(p=>{
    if(!searchQ)return true;
    const q=searchQ.toLowerCase();
    return p.name.toLowerCase().includes(q)||p.country.toLowerCase().includes(q)||(p.city||"").toLowerCase().includes(q);
  });
  const active=allPlaces.filter(p=>selected.includes(p.id));

  const buildUrl=()=>{
    if(active.length===0)return null;
    if(active.length===1)return`https://www.google.com/maps/search/?api=1&query=${active[0].lat},${active[0].lng}`;
    const o=`${active[0].lat},${active[0].lng}`,d=`${active[active.length-1].lat},${active[active.length-1].lng}`;
    let url=`https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
    if(active.length>2)url+=`&waypoints=${active.slice(1,-1).map(p=>`${p.lat},${p.lng}`).join("|")}`;
    return url;
  };

  const openAndSave=async()=>{
    const url=buildUrl();if(!url)return;
    setSaving(true);
    try{
      if(editingRoute){await api(`/routes/${editingRoute.id}`,{method:"PUT",body:JSON.stringify({name,stops:selected})});}
      else{await api("/routes",{method:"POST",body:JSON.stringify({name,stops:selected})});}
      window.open(url,"_blank");
      if(onSaved)onSaved();
      onClose();
    }catch(e){console.error(e);}
    setSaving(false);
  };

  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.2)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:"100%",maxWidth:500,background:"#FEFDFB",borderRadius:"20px 20px 0 0",padding:"16px 16px 24px",maxHeight:"85vh",display:"flex",flexDirection:"column",animation:"slideUp .3s cubic-bezier(.4,0,.2,1)",boxShadow:"0 -8px 40px rgba(0,0,0,.1)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"#DDD8D0",margin:"0 auto 12px"}}/>
      {/* Route name */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
        <div style={{width:34,height:34,borderRadius:10,background:"#1B7A5A0F",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B7A5A",flexShrink:0}}>{I.route}</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{flex:1,fontFamily:"'Instrument Serif',Georgia,serif",fontSize:18,color:"#2C2A26",border:"none",background:"transparent",outline:"none",padding:0}}/>
        <span style={{fontSize:11,color:"#9E978C",flexShrink:0}}>{active.length} stops</span>
      </div>
      {/* Search within saves */}
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search your saves to add..." style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:12,outline:"none",marginBottom:8,boxSizing:"border-box"}}/>
      {/* Place list */}
      <div style={{flex:1,overflowY:"auto",marginBottom:10}}>
        {filtered.map(place=>{
          const isSel=selected.includes(place.id);const num=isSel?selected.indexOf(place.id)+1:null;
          return <div key={place.id} onClick={()=>setSelected(p=>p.includes(place.id)?p.filter(x=>x!==place.id):[...p,place.id])} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 8px",borderRadius:8,cursor:"pointer",border:`1.5px solid ${isSel?"#1B7A5A":"#ECE9E3"}`,background:isSel?"#1B7A5A06":"#FFF",marginBottom:4}}>
            <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:isSel?"#1B7A5A":"#F3F0EB",color:isSel?"#FFF":"#C4BDB2"}}>{isSel?num:""}</div>
            <div style={{width:34,height:34,borderRadius:6,overflow:"hidden",flexShrink:0,background:"#F0EDE8"}}>{place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:500,color:isSel?"#2C2A26":"#9E978C",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{place.name}</div>
              <div style={{fontSize:10,color:"#B5AFA5"}}>{place.city||place.country}</div></div>
          </div>;
        })}
      </div>
      {/* Actions */}
      <button onClick={openAndSave} disabled={active.length===0||saving} style={{width:"100%",padding:12,borderRadius:10,border:"none",background:active.length>0?"#1B7A5A":"#E0DBD3",color:active.length>0?"#FFF":"#A09888",fontSize:13,fontWeight:600,cursor:active.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
        {I.gmaps} {editingRoute?"Update & open route":"Open route in Google Maps"}</button>
      <div style={{fontSize:10,color:"#B5AFA5",textAlign:"center",marginTop:6}}>Route will be saved when opened{active.length>10&&<span style={{color:"#B04040"}}> · Max ~10 waypoints</span>}</div>
    </div></div>;
}

// ── Routes Tab ───────────────────────────────────────────
function RoutesTab({routes,onEdit,onDelete,onRefresh}) {
  return <div style={{flex:1,overflowY:"auto",padding:"8px 14px"}}>
    {routes.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"#C4BDB2",fontSize:13}}>No saved routes yet. Plan a route from your places!</div>
    :routes.map(r=><div key={r.id} style={{border:"1px solid #ECE9E3",borderRadius:8,padding:"10px 12px",marginBottom:6,background:"#FFF",cursor:"pointer"}} onClick={()=>onEdit(r)}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
        <div><div style={{fontSize:14,fontWeight:500,color:"#2C2A26"}}>{r.name}</div>
          <div style={{fontSize:11,color:"#9E978C",marginTop:1}}>{(r.stop_details||[]).length} stops · {r.updated}</div></div>
        <div style={{display:"flex",gap:4}}>
          {ib(e=>{e.stopPropagation();if(r.route_url)window.open(r.route_url,"_blank");},I.gmaps)}
          {ib(e=>{e.stopPropagation();onDelete(r.id);},I.trash,"#B04040","#FDF6F6","#E8D4D4")}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center"}}>
        <div style={{display:"flex"}}>{(r.stop_details||[]).slice(0,6).map((s,i)=><div key={s.id} style={{width:28,height:28,borderRadius:5,background:"#F0EDE8",border:"1.5px solid #FFF",marginLeft:i>0?-6:0,overflow:"hidden"}}>{s.photo&&<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>)}</div>
        {(r.stop_details||[]).length>6&&<span style={{fontSize:10,color:"#B5AFA5",marginLeft:4}}>+{r.stop_details.length-6}</span>}
        <span style={{marginLeft:"auto",color:"#C4BDB2"}}>{I.chevron}</span>
      </div>
    </div>)}
  </div>;
}

// ── Main App ─────────────────────────────────────────────
export default function App() {
  const [places,setPlaces]=useState([]);const [routes,setRoutes]=useState([]);const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("places"); // places | routes
  const [filters,setFilters]=useState({region:null,country:null,city:null,tag:null,autoTag:null});
  const [detail,setDetail]=useState(null);const [editPlace,setEditPlace]=useState(null);
  const [routePlanner,setRoutePlanner]=useState(null); // {initialStops,editingRoute} or null
  const [searchQ,setSearchQ]=useState("");const [searchOpen,setSearchOpen]=useState(false);

  const load=()=>{
    api("/places").then(d=>{setPlaces(d.places||[]);setLoading(false);}).catch(()=>setLoading(false));
    api("/routes").then(d=>setRoutes(d.routes||[])).catch(()=>{});
  };
  useEffect(load,[]);

  const fp=places.filter(p=>{
    if(filters.region&&p.region!==filters.region)return false;
    if(filters.country&&p.country!==filters.country)return false;
    if(filters.city&&p.city!==filters.city)return false;
    if(filters.tag&&!(p.tags||[]).includes(filters.tag))return false;
    if(filters.autoTag&&!(p.auto_tags||[]).includes(filters.autoTag))return false;
    if(searchQ&&!p.name.toLowerCase().includes(searchQ.toLowerCase())&&!p.country.toLowerCase().includes(searchQ.toLowerCase())&&!(p.city||"").toLowerCase().includes(searchQ.toLowerCase()))return false;
    return true;
  });

  const goHome=()=>{setFilters({region:null,country:null,city:null,tag:null,autoTag:null});setDetail(null);setEditPlace(null);setRoutePlanner(null);setSearchQ("");setSearchOpen(false);setTab("places");};
  const handleSave=p=>setPlaces(prev=>[p,...prev]);
  const handleDelete=async id=>{try{await api(`/places/${id}`,{method:"DELETE"});setPlaces(prev=>prev.filter(p=>p.id!==id));setDetail(null);}catch(e){console.error(e);}};
  const handleEdited=u=>{setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));if(detail?.id===u.id)setDetail(u);};
  const handleDeleteRoute=async id=>{try{await api(`/routes/${id}`,{method:"DELETE"});setRoutes(prev=>prev.filter(r=>r.id!==id));}catch(e){console.error(e);}};

  const locLabel=filters.city||filters.country||null;
  const routeStopIds=routes.flatMap(r=>r.stops||[]);
  const showTripBar=tab==="places"&&locLabel&&fp.length>1&&!detail&&!routePlanner;

  return <div style={{width:"100vw",height:"100vh",overflow:"hidden",background:"#FAFAF7",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>

    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 14px",flexShrink:0,background:"#FEFDFB",borderBottom:".5px solid #EDE9E3"}}>
      <h1 onClick={goHome} style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:22,fontWeight:400,color:"#2C2A26",margin:0,cursor:"pointer"}}>Travel</h1>
      <div style={{display:"flex",alignItems:"center",gap:5}}>
        <span style={{fontSize:11,color:"#B5AFA5"}}>{tab==="places"?`${fp.length}`:""}</span>
        {/* Tab toggle */}
        <div style={{display:"flex",background:"#F3F0EB",borderRadius:7,padding:2}}>
          {["places","routes"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"4px 10px",borderRadius:5,border:"none",background:tab===t?"#FFF":"transparent",color:tab===t?"#2C2A26":"#A09888",fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:tab===t?"0 1px 2px rgba(0,0,0,.05)":"none",textTransform:"capitalize"}}>{t}</button>)}
        </div>
        {tab==="routes"&&<button onClick={()=>setRoutePlanner({initialStops:[]})} style={{padding:"4px 9px",borderRadius:6,border:"none",background:"#B8602E",color:"#FFF",fontSize:10,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>{I.plus}New</button>}
        <button onClick={()=>{setSearchOpen(!searchOpen);if(searchOpen)setSearchQ("");}} style={{width:28,height:28,borderRadius:"50%",border:"1px solid #E8E3DB",background:searchOpen?"#2C2A260A":"#FFF",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:searchOpen?"#2C2A26":"#9E978C"}}>{searchOpen?I.x:I.search}</button>
      </div>
    </div>

    {searchOpen&&<div style={{padding:"5px 14px",background:"#FEFDFB",animation:"slideIn .15s"}}><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..." autoFocus style={{width:"100%",padding:"8px 10px",borderRadius:7,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:12,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/></div>}

    {tab==="places"&&<CaptureBar onSave={handleSave}/>}
    {tab==="places"&&<SmartFilters places={places} filters={filters} setFilters={setFilters}/>}

    {/* Content */}
    {tab==="places"?
      <div style={{flex:1,overflowY:"auto",paddingBottom:showTripBar?65:0}}>
        {loading?<div style={{textAlign:"center",padding:"50px",color:"#B5AFA5",fontSize:13}}>Loading...</div>
        :fp.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"#C4BDB2",fontSize:13}}>{places.length===0?"Save your first place above!":"No matches"}</div>
        :fp.map(p=><div key={p.id} onClick={()=>setDetail(p)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderBottom:"1px solid #F3F0EB",cursor:"pointer"}}>
          <div style={{width:40,height:40,borderRadius:7,overflow:"hidden",flexShrink:0,background:"#F0EDE8",position:"relative"}}>
            {p.photo&&<img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
            {routeStopIds.includes(p.id)&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#1B7A5A",border:"1.5px solid #FFF"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:500,color:"#2C2A26",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:11,color:"#9E978C",marginTop:1}}>{p.city||p.country}{(p.tags||[]).length>0&&<span style={{color:"#C4BDB2"}}> · {p.tags.join(", ")}</span>}</div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
            {p.rating>0&&<div style={{display:"flex",alignItems:"center",gap:2}}>{I.star}<span style={{fontSize:11,color:"#854F0B"}}>{p.rating}</span></div>}
            <span style={{fontSize:10,color:"#C4BDB2"}}>{p.saved}</span>
            {ib(e=>{e.stopPropagation();setEditPlace(p);},I.edit)}
            {ib(e=>{e.stopPropagation();const url=p.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`;window.open(url,"_blank");},I.gmaps)}
          </div>
        </div>)}
      </div>
    :<RoutesTab routes={routes} onEdit={r=>setRoutePlanner({initialStops:r.stops,editingRoute:r})} onDelete={handleDeleteRoute} onRefresh={load}/>}

    {/* Detail */}
    {detail&&<DetailView place={detail} onClose={()=>setDetail(null)} onDelete={handleDelete} onEdit={()=>setEditPlace(detail)} routeStopIds={routeStopIds}/>}
    {editPlace&&<EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}

    {/* Trip prompt bar */}
    {showTripBar&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(254,253,251,.95)",backdropFilter:"blur(10px)",borderTop:".5px solid #EDE9E3",padding:"8px 14px 12px",animation:"slideIn .3s",display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:"#2C2A26"}}>{fp.length} in {locLabel}</div>
        <div style={{fontSize:10,color:"#9E978C"}}>Plan route with Google Maps</div></div>
      <button onClick={()=>setRoutePlanner({initialStops:fp.map(p=>p.id)})} style={{padding:"7px 14px",borderRadius:7,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:11,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{I.route}Plan</button>
    </div>}

    {/* Route planner */}
    {routePlanner&&<RoutePlanner allPlaces={places} initialStops={routePlanner.initialStops} editingRoute={routePlanner.editingRoute} onClose={()=>setRoutePlanner(null)} onSaved={()=>{api("/routes").then(d=>setRoutes(d.routes||[])).catch(()=>{});}}/>}
  </div>;
}
