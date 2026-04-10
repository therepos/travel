import { useState, useEffect } from "react";
import { api, C, Icon, TAG_PRESETS } from "../shared.jsx";

export default function SearchDropdown({query, places, onSave, onSelect, isMobile, onClose}) {
  const [googleResults,setGoogleResults] = useState([]);
  const [searching,setSearching] = useState(false);
  const [selectedResult,setSelectedResult] = useState(null);
  const [customTags,setCustomTags] = useState([]);
  const [newTag,setNewTag] = useState("");
  const [showNewTag,setShowNewTag] = useState(false);
  const [saving,setSaving] = useState(false);

  // Search saved places
  const savedMatches = query.length > 1 ? places.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.city||"").toLowerCase().includes(query.toLowerCase()) ||
    (p.cuisine||"").toLowerCase().includes(query.toLowerCase()) ||
    (p.tags||[]).some(t=>t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0,3) : [];

  // Search Google when query changes
  useEffect(() => {
    if (query.length < 2) { setGoogleResults([]); setSelectedResult(null); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const d = await api(`/search?q=${encodeURIComponent(query)}`);
        setGoogleResults(d.results || []);
      } catch(e) { setGoogleResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const existingTags = [...new Set(places.flatMap(p=>p.tags||[]))];

  const handleSelectGoogle = r => {
    setSelectedResult(selectedResult===r ? null : r);
    setCustomTags([]);
  };

  const handleSave = async () => {
    if (!selectedResult || saving) return;
    setSaving(true);
    try {
      const saved = await api("/places", {method:"POST", body:JSON.stringify({
        ...selectedResult, tags:customTags,
        saved: new Date().toISOString().split("T")[0]
      })});
      onSave(saved);
      setSelectedResult(null); setCustomTags([]); setGoogleResults([]);
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const toggleTag = t => setCustomTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev,t]);
  const addNewTag = () => {
    if (newTag.trim() && !customTags.includes(newTag.trim())) {
      setCustomTags(prev=>[...prev,newTag.trim()]);
    }
    setNewTag(""); setShowNewTag(false);
  };

  if (query.length < 1 && !isMobile) return null;

  const style = isMobile ? {flex:1,overflowY:"auto",background:"#fff"} :
    {position:"absolute",top:"100%",left:0,right:0,background:"#fff",
     borderRadius:"0 0 8px 8px",border:`1.5px solid ${C.blue}`,borderTop:`1px solid ${C.borderLight}`,
     zIndex:25,maxHeight:420,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,.1)"};

  return <div style={style}>
    {query.length < 2 && <div style={{padding:20,textAlign:"center",color:C.textLight,fontSize:13}}>Type to search saved places or add new...</div>}

    {savedMatches.length > 0 && <>
      <div style={{fontSize:10,color:C.textLight,padding:"8px 12px 2px",fontWeight:500}}>Your saved places</div>
      {savedMatches.map(p => <div key={p.id} onClick={()=>onSelect(p)}
        style={{display:"flex",gap:10,padding:"8px 12px",alignItems:"center",cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`}}
        onMouseEnter={e=>e.currentTarget.style.background=C.surface}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{width:32,height:32,borderRadius:8,background:C.borderLight,overflow:"hidden",flexShrink:0}}>
          {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:500}}>{p.name}</div>
          <div style={{fontSize:10,color:C.textMid}}>{p.place_type||p.cuisine||""}{p.city?` · ${p.city}`:""}{p.rating?` · ★ ${p.rating}`:""}</div>
        </div>
        <Icon name="check" size={12} color={C.green} sw={2.5}/>
      </div>)}
    </>}

    {googleResults.length > 0 && <>
      <div style={{fontSize:10,color:C.textLight,padding:"8px 12px 2px",fontWeight:500}}>Google Places</div>
      {googleResults.map((r,i) => {
        const isSel = selectedResult === r;
        const alreadySaved = places.some(p=>p.google_place_id===r.google_place_id);
        return <div key={i}>
          <div onClick={()=>!alreadySaved && handleSelectGoogle(r)}
            style={{display:"flex",gap:10,padding:"8px 12px",alignItems:"center",cursor:alreadySaved?"default":"pointer",
              background:isSel?C.blueBg:"transparent",borderBottom:`1px solid ${C.borderLight}`}}
            onMouseEnter={e=>{if(!isSel&&!alreadySaved)e.currentTarget.style.background=C.surface;}}
            onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=isSel?C.blueBg:"transparent";}}>
            <div style={{width:32,height:32,borderRadius:8,background:isSel?C.blueLight:C.borderLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon name="pin" size={14} color={isSel?C.blue:C.textMid} sw={1.5} fill="none"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:500}}>{r.name}</div>
              <div style={{fontSize:10,color:C.textMid}}>{r.address?.substring(0,50)}{r.rating?` · ★ ${r.rating}`:""}{r.price_level?` · ${r.price_level}`:""}</div>
            </div>
            {alreadySaved ? <span style={{fontSize:9,color:C.green,fontWeight:500}}>saved</span>
            : isSel ? <Icon name="check" size={14} color={C.blue} sw={2.5}/>
            : null}
          </div>

          {/* Save panel when selected */}
          {isSel && <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.borderLight}`,background:C.surface}}>
            {/* Auto info */}
            {(r.intent||r.cuisine) && <div style={{fontSize:9,color:C.textLight,marginBottom:4}}>
              Auto: <span style={{color:C.blue,fontWeight:500}}>{r.intent}</span>
              {r.cuisine && <> · <span style={{fontWeight:500}}>{r.cuisine}</span></>}
            </div>}

            {/* Auto tags */}
            {(r.auto_tags||[]).length>0 && <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:6}}>
              {(r.auto_tags||[]).map(t=><span key={t} style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:"#e6f4ea",color:"#137333"}}>{t}</span>)}
              {r.cuisine && <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:"#fef7e0",color:"#b06000"}}>{r.cuisine}</span>}
            </div>}

            {/* Custom tags */}
            <div style={{fontSize:9,color:C.purple,fontWeight:500,marginBottom:4}}>Your tags:</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:8}}>
              {[...new Set([...TAG_PRESETS,...existingTags])].slice(0,8).map(t =>
                <button key={t} onClick={()=>toggleTag(t)}
                  style={{fontSize:9,padding:"2px 7px",borderRadius:10,border:`1px solid ${customTags.includes(t)?C.purpleBg:C.border}`,
                    background:customTags.includes(t)?C.purpleBg:"#fff",color:customTags.includes(t)?C.purple:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>
                  {t}
                </button>
              )}
              {showNewTag ? <div style={{display:"flex",gap:2}}>
                <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNewTag()}
                  autoFocus placeholder="tag name" style={{width:80,fontSize:9,padding:"2px 6px",borderRadius:8,border:`1px solid ${C.border}`,outline:"none",fontFamily:"inherit"}}/>
                <button onClick={addNewTag} style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:C.blue,color:"#fff",border:"none",fontFamily:"inherit"}}>+</button>
              </div>
              : <button onClick={()=>setShowNewTag(true)}
                  style={{fontSize:9,padding:"2px 6px",borderRadius:10,border:`1px dashed ${C.border}`,color:C.textLight,background:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:2}}>
                  <Icon name="plus" size={8} color={C.textLight} sw={2}/>new
                </button>}
            </div>

            <button onClick={handleSave} disabled={saving}
              style={{width:"100%",padding:8,borderRadius:10,background:C.blue,color:"#fff",border:"none",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
              {saving ? "Saving..." : "Save to collection"}
            </button>
          </div>}
        </div>;
      })}
    </>}

    {searching && <div style={{padding:16,textAlign:"center",color:C.textLight,fontSize:12}}>Searching Google Places...</div>}
    {query.length>=2 && !searching && googleResults.length===0 && savedMatches.length===0 &&
      <div style={{padding:20,textAlign:"center",color:C.textLight,fontSize:12}}>No results found</div>}
  </div>;
}
