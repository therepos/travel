import { useState, useEffect } from "react";
import { api, C, Icon } from "../shared.jsx";

export default function RoutePlanner({allPlaces, initialStops, editingRoute, onClose, onSaved, isMobile}) {
  const [selected,setSelected] = useState(initialStops||[]);
  const [name,setName] = useState(editingRoute?.name||"New route");
  const [searchQ,setSearchQ] = useState("");
  const [googleResults,setGoogleResults] = useState([]);
  const [searching,setSearching] = useState(false);
  const [saving,setSaving] = useState(false);

  useEffect(() => {
    if (searchQ.length < 2) { setGoogleResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try { const d = await api(`/search?q=${encodeURIComponent(searchQ)}`); setGoogleResults(d.results||[]); }
      catch(e) { setGoogleResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQ]);

  const savedMatches = searchQ.length > 1 ? allPlaces.filter(p =>
    p.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.city||"").toLowerCase().includes(searchQ.toLowerCase())
  ).slice(0,5) : allPlaces;

  const activeStops = selected.map(sid => allPlaces.find(p=>p.id===sid)).filter(Boolean);

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);

  const addGooglePlace = async (r) => {
    try {
      const saved = await api("/places", {method:"POST", body:JSON.stringify({
        ...r, tags:[], saved: new Date().toISOString().split("T")[0]
      })});
      setSelected(prev=>[...prev,saved.id]);
      // Update parent's place list
    } catch(e) { console.error(e); }
  };

  const save = async () => {
    if (activeStops.length===0) return;
    setSaving(true);
    try {
      if (editingRoute) {
        await api(`/routes/${editingRoute.id}`,{method:"PUT",body:JSON.stringify({name,stops:selected})});
      } else {
        await api("/routes",{method:"POST",body:JSON.stringify({name,stops:selected})});
      }
      if (onSaved) await onSaved();
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const content = <>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0}}>
      <div style={{width:26,height:26,borderRadius:7,background:"#e6f4ea",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name="route" size={13} color={C.green} sw={2}/>
      </div>
      <input value={name} onChange={e=>setName(e.target.value)}
        style={{flex:1,border:"none",background:"none",fontSize:14,fontWeight:500,color:C.text,outline:"none",fontFamily:"inherit"}}
        placeholder="Route name..."/>
      <span style={{fontSize:10,color:C.textLight}}>{activeStops.length} stops</span>
      {!isMobile && <button onClick={onClose} style={{background:"none",border:"none",padding:2}}><Icon name="x" size={16} color={C.textLight} sw={2}/></button>}
    </div>

    {/* Search */}
    <div style={{display:"flex",alignItems:"center",gap:6,margin:"8px 14px",padding:"7px 10px",background:C.borderLight,borderRadius:8}}>
      <Icon name="search" size={14} color={C.textLight}/>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
        placeholder="Search saved or Google Places..."
        style={{flex:1,border:"none",background:"none",fontSize:12,color:C.text,outline:"none",fontFamily:"inherit"}}/>
      {searchQ && <button onClick={()=>{setSearchQ("");setGoogleResults([]);}} style={{background:"none",border:"none",padding:0}}>
        <Icon name="x" size={12} color={C.textLight} sw={2}/>
      </button>}
    </div>

    {/* Google results when searching */}
    {searchQ.length >= 2 && (googleResults.length > 0 || searching) && <div style={{margin:"0 14px 6px",border:`1px solid ${C.border}`,borderRadius:8,overflow:"hidden",flexShrink:0}}>
      {savedMatches.filter(p=>!selected.includes(p.id)).slice(0,3).map(p =>
        <div key={p.id} onClick={()=>toggle(p.id)}
          style={{display:"flex",gap:6,padding:"6px 8px",alignItems:"center",fontSize:11,cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`,background:C.surface}}>
          <div style={{width:24,height:24,borderRadius:5,background:C.border,overflow:"hidden",flexShrink:0}}>
            {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          </div>
          <div style={{flex:1}}><div style={{fontWeight:500}}>{p.name}</div><div style={{fontSize:9,color:C.textMid}}>{p.city||p.country}</div></div>
          <span style={{fontSize:8,color:C.green,fontWeight:500,background:"#e6f4ea",padding:"1px 6px",borderRadius:6}}>saved</span>
        </div>
      )}
      {googleResults.filter(r=>!allPlaces.some(p=>p.google_place_id===r.google_place_id)).slice(0,3).map((r,i) =>
        <div key={i} onClick={()=>addGooglePlace(r)}
          style={{display:"flex",gap:6,padding:"6px 8px",alignItems:"center",fontSize:11,cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`}}>
          <div style={{width:24,height:24,borderRadius:5,background:C.borderLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="pin" size={12} color={C.textMid} sw={1.5} fill="none"/>
          </div>
          <div style={{flex:1}}><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:9,color:C.textMid}}>{r.city||r.address?.substring(0,30)}</div></div>
          <span style={{fontSize:8,color:C.blue,fontWeight:500,background:C.blueBg,padding:"1px 6px",borderRadius:6}}>+ add</span>
        </div>
      )}
      {searching && <div style={{padding:8,textAlign:"center",fontSize:10,color:C.textLight}}>Searching...</div>}
    </div>}

    {/* Map preview */}
    {activeStops.length > 0 && <div style={{height:90,background:"#e8eaed",margin:"0 14px",borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#9aa0a6",fontSize:9}}>
      <Icon name="route" size={18} color="#9aa0a6" sw={1.5} fill="none" style={{marginRight:4}}/> Route map
    </div>}

    {/* Stop list */}
    <div style={{flex:1,overflowY:"auto",padding:"6px 14px"}}>
      {activeStops.map((p,i) => <div key={p.id} style={{display:"flex",gap:8,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:16,flexShrink:0,paddingTop:8}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:i===activeStops.length-1?C.red:C.blue,flexShrink:0}}/>
          {i<activeStops.length-1 && <div style={{width:2,background:C.border,flex:1,margin:"2px 0"}}/>}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:i<activeStops.length-1?`1px solid ${C.borderLight}`:"none"}}>
          <div style={{width:26,height:26,borderRadius:5,background:C.border,overflow:"hidden",flexShrink:0}}>
            {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:9,color:C.textMid}}>{p.city||p.country}</div>
          </div>
          <div style={{width:18,height:18,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,flexShrink:0}}>{i+1}</div>
          <button onClick={()=>toggle(p.id)} style={{background:"none",border:"none",padding:2,cursor:"pointer"}}>
            <Icon name="x" size={12} color={C.textLight} sw={2}/>
          </button>
        </div>
      </div>)}

      {/* Unselected places */}
      {!searchQ && allPlaces.filter(p=>!selected.includes(p.id)).slice(0,10).map(p =>
        <div key={p.id} onClick={()=>toggle(p.id)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"6px 8px",borderRadius:6,cursor:"pointer",marginBottom:2,opacity:0.6}}
          onMouseEnter={e=>e.currentTarget.style.opacity=1}
          onMouseLeave={e=>e.currentTarget.style.opacity=0.6}>
          <div style={{width:18,height:18,borderRadius:"50%",background:C.borderLight,flexShrink:0}}/>
          <div style={{width:26,height:26,borderRadius:5,background:C.border,overflow:"hidden",flexShrink:0}}>
            {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:500,color:C.textMid,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:9,color:C.textLight}}>{p.city||p.country}</div>
          </div>
        </div>
      )}
    </div>

    {/* Save */}
    <div style={{display:"flex",gap:8,padding:"10px 14px",borderTop:`1px solid ${C.borderLight}`,flexShrink:0}}>
      <button onClick={onClose}
        style={{flex:1,padding:9,borderRadius:12,fontSize:12,fontWeight:500,border:"none",background:C.blueBg,color:C.blue,cursor:"pointer",fontFamily:"inherit"}}>
        Cancel
      </button>
      <button onClick={save} disabled={activeStops.length===0||saving}
        style={{flex:1,padding:9,borderRadius:12,fontSize:12,fontWeight:500,border:"none",
          background:activeStops.length>0?C.blue:C.border,color:activeStops.length>0?"#fff":C.textLight,
          cursor:activeStops.length>0?"pointer":"default",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
        <Icon name="check" size={12} color={activeStops.length>0?"#fff":C.textLight} sw={2.5}/>
        {saving?"Saving...":editingRoute?"Update":"Save route"}
      </button>
    </div>
  </>;

  if (isMobile) return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center"}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:"92vw",maxHeight:"85vh",background:"#fff",borderRadius:16,display:"flex",flexDirection:"column",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
      {content}
    </div>
  </div>;

  return <div style={{flex:1,minWidth:0,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {content}
  </div>;
}
