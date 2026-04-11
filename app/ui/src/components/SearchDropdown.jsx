import { useState, useEffect } from "react";
import { api, C, Icon } from "../shared.jsx";

export default function SearchDropdown({query, places, onSave, onSelect, isMobile, onClose}) {
  const [googleResults,setGoogleResults] = useState([]);
  const [searching,setSearching] = useState(false);
  const [savingId,setSavingId] = useState(null);

  const savedMatches = query.length > 1 ? places.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.city||"").toLowerCase().includes(query.toLowerCase()) ||
    (p.cuisine||"").toLowerCase().includes(query.toLowerCase()) ||
    (p.tags||[]).some(t=>t.toLowerCase().includes(query.toLowerCase()))
  ).slice(0,3) : [];

  useEffect(() => {
    if (query.length < 2) { setGoogleResults([]); return; }
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

  const handleSave = async (r, idx) => {
    if (savingId !== null) return;
    setSavingId(idx);
    try {
      const saved = await api("/places", {method:"POST", body:JSON.stringify({
        ...r, tags: [], saved: new Date().toISOString().split("T")[0]
      })});
      onSave(saved);
    } catch(e) { console.error(e); }
    setSavingId(null);
  };

  if (query.length < 1 && !isMobile) return null;

  const style = isMobile ? {flex:1,overflowY:"auto",background:"#fff"} :
    {position:"absolute",top:"100%",left:0,right:0,background:"#fff",
     borderRadius:"0 0 8px 8px",border:`1.5px solid ${C.blue}`,borderTop:`1px solid ${C.borderLight}`,
     zIndex:25,maxHeight:420,overflowY:"auto",boxShadow:"0 4px 16px rgba(0,0,0,.1)"};

  return <div style={style}>
    {query.length < 2 && <div style={{padding:20,textAlign:"center",color:C.textLight,fontSize:14}}>Type to search saved places or add new...</div>}

    {savedMatches.length > 0 && <>
      <div style={{fontSize:11,color:C.textLight,padding:"10px 16px 4px",fontWeight:500}}>Your saved places</div>
      {savedMatches.map(p => <div key={p.id} onClick={()=>onSelect(p)}
        style={{display:"flex",gap:12,padding:"10px 16px",alignItems:"center",cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`}}
        onMouseEnter={e=>e.currentTarget.style.background=C.surface}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{width:36,height:36,borderRadius:8,background:C.borderLight,overflow:"hidden",flexShrink:0}}>
          {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:500}}>{p.name}</div>
          <div style={{fontSize:12,color:C.textMid}}>{p.place_type||p.cuisine||""}{p.city?` · ${p.city}`:""}{p.rating?` · ${p.rating}`:""}</div>
        </div>
        <Icon name="check" size={14} color={C.green} sw={2.5}/>
      </div>)}
    </>}

    {googleResults.length > 0 && <>
      <div style={{fontSize:11,color:C.textLight,padding:"10px 16px 4px",fontWeight:500}}>Google Places</div>
      {googleResults.map((r,i) => {
        const alreadySaved = places.some(p=>p.google_place_id===r.google_place_id);
        const isSaving = savingId === i;
        return <div key={i}
          style={{display:"flex",gap:12,padding:"10px 16px",alignItems:"center",borderBottom:`1px solid ${C.borderLight}`}}
          onMouseEnter={e=>{if(!alreadySaved)e.currentTarget.style.background=C.surface;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
          <div style={{width:36,height:36,borderRadius:8,background:C.borderLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Icon name="pin" size={16} color={C.textMid} sw={1.5} fill="none"/>
          </div>
          <div style={{flex:1,minWidth:0,cursor:alreadySaved?"pointer":"default"}} onClick={()=>{if(alreadySaved){const p=places.find(p=>p.google_place_id===r.google_place_id);if(p)onSelect(p);}}}>
            <div style={{fontSize:14,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
            <div style={{fontSize:12,color:C.textMid,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.address?.substring(0,50)}{r.rating?` · ${r.rating}`:""}{r.price_level?` · ${r.price_level}`:""}</div>
          </div>
          {alreadySaved
            ? <span style={{fontSize:12,color:C.green,fontWeight:500,flexShrink:0,display:"flex",alignItems:"center",gap:4}}>
                <Icon name="check" size={14} color={C.green} sw={2.5}/> Saved
              </span>
            : <button onClick={e=>{e.stopPropagation();handleSave(r,i);}} disabled={isSaving}
                style={{padding:"6px 16px",borderRadius:20,background:isSaving?C.borderLight:C.blue,color:isSaving?C.textMid:"#fff",border:"none",
                  fontSize:13,fontWeight:500,cursor:isSaving?"wait":"pointer",fontFamily:"inherit",flexShrink:0,
                  display:"flex",alignItems:"center",gap:4,transition:"all .15s"}}
                onMouseEnter={e=>{if(!isSaving){e.currentTarget.style.background="#1557b0";}}}
                onMouseLeave={e=>{if(!isSaving){e.currentTarget.style.background=C.blue;}}}>
                {isSaving ? "Saving..." : <><Icon name="plus" size={14} color="#fff" sw={2.5}/> Save</>}
              </button>}
        </div>;
      })}
    </>}

    {searching && <div style={{padding:16,textAlign:"center",color:C.textLight,fontSize:13}}>Searching Google Places...</div>}
    {query.length>=2 && !searching && googleResults.length===0 && savedMatches.length===0 &&
      <div style={{padding:20,textAlign:"center",color:C.textLight,fontSize:13}}>No results found</div>}
  </div>;
}
