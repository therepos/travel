import { useState, useEffect } from "react";
import { api, C, I } from "../shared.jsx";

export default function RoutePlanner({allPlaces,initialStops,editingRoute,onClose,onSaved}) {
  const [selected,setSelected]=useState(initialStops||[]);
  const [searchQ,setSearchQ]=useState("");
  const [name,setName]=useState(editingRoute?.name||"New route");
  const [saving,setSaving]=useState(false);
  const [fRegion,setFRegion]=useState(null);
  const [fCountry,setFCountry]=useState(null);

  // Back-button handling
  useEffect(()=>{
    window.history.pushState({routePlanner:true},"");
    const handler=()=>onClose();
    window.addEventListener("popstate",handler);
    return()=>window.removeEventListener("popstate",handler);
  },[]);

  const regionCounts={};const countryCounts={};
  allPlaces.forEach(p=>{
    if(p.region){regionCounts[p.region]=(regionCounts[p.region]||0)+1;}
    if(p.country){if(!fRegion||p.region===fRegion)countryCounts[p.country]=(countryCounts[p.country]||0)+1;}
  });

  const filtered=allPlaces.filter(p=>{
    if(fRegion&&p.region!==fRegion)return false;
    if(fCountry&&p.country!==fCountry)return false;
    if(!searchQ)return true;
    const q=searchQ.toLowerCase();
    return p.name.toLowerCase().includes(q)||p.country.toLowerCase().includes(q)||(p.city||"").toLowerCase().includes(q);
  });
  const active=allPlaces.filter(p=>selected.includes(p.id));

  const Fb=({label,active:a,onClick,color=C.success})=><button onClick={onClick} style={{padding:"4px 9px",borderRadius:10,fontSize:12,cursor:"pointer",border:`1px solid ${a?color:C.border}`,background:a?`${color}14`:C.surface,color:a?color:C.textLight,whiteSpace:"nowrap",flexShrink:0}}>{label}</button>;

  const saveRoute=async()=>{
    if(active.length===0)return;
    setSaving(true);
    try{
      if(editingRoute){await api(`/routes/${editingRoute.id}`,{method:"PUT",body:JSON.stringify({name,stops:selected})});}
      else{await api("/routes",{method:"POST",body:JSON.stringify({name,stops:selected})});}
      if(onSaved)await onSaved();
    }catch(e){console.error(e);setSaving(false);}
  };

  return <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <button onClick={onClose} style={{position:"fixed",top:14,right:14,zIndex:1010,width:36,height:36,borderRadius:"50%",border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#FFF"}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div style={{width:"min(92vw, 520px)",maxHeight:"min(88vh, 640px)",background:C.surface,borderRadius:12,display:"flex",flexDirection:"column",animation:"fadeIn .2s",boxShadow:"0 20px 60px rgba(0,0,0,.3)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 16px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0}}>
        <div style={{width:34,height:34,borderRadius:10,background:C.successBg,display:"flex",alignItems:"center",justifyContent:"center",color:C.success,flexShrink:0}}>{I.route}</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{flex:1,fontFamily:"'Instrument Serif',Georgia,serif",fontSize:20,color:C.text,border:"none",background:"transparent",outline:"none",padding:0}} placeholder="Route name..."/>
        <span style={{fontSize:13,color:C.textLight,flexShrink:0}}>{active.length} stops</span>
      </div>
      <div style={{padding:"10px 16px 6px",flexShrink:0}}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search your saves to add..." style={{width:"100%",padding:"10px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,color:C.text,fontSize:14,outline:"none",marginBottom:6,boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif"}}/>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {Object.entries(regionCounts).sort((a,b)=>b[1]-a[1]).map(([r,n])=><Fb key={r} label={`${r} (${n})`} active={fRegion===r} onClick={()=>{setFRegion(fRegion===r?null:r);setFCountry(null);}}/>)}
        </div>
        {fRegion&&Object.keys(countryCounts).length>1&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>
          {Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).map(([c,n])=><Fb key={c} label={`${c} (${n})`} active={fCountry===c} color={C.accent} onClick={()=>setFCountry(fCountry===c?null:c)}/>)}
        </div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 16px 10px"}}>
        {filtered.map(place=>{
          const isSel=selected.includes(place.id);const num=isSel?selected.indexOf(place.id)+1:null;
          return <div key={place.id} onClick={()=>setSelected(p=>p.includes(place.id)?p.filter(x=>x!==place.id):[...p,place.id])} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:10,cursor:"pointer",border:`1.5px solid ${isSel?C.success:C.border}`,background:isSel?C.successBg:C.surface,marginBottom:4}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:isSel?C.success:C.borderLight,color:isSel?"#FFF":C.textLight}}>{isSel?num:""}</div>
            <div style={{width:36,height:36,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.card}}>{place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:500,color:isSel?C.text:C.textLight,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{place.name}</div>
              <div style={{fontSize:12,color:C.textLight}}>{place.city||place.country}</div></div>
          </div>;
        })}
      </div>
      <div style={{padding:"10px 16px 16px",borderTop:`1px solid ${C.borderLight}`,flexShrink:0}}>
        <button onClick={saveRoute} disabled={active.length===0||saving} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:active.length>0?C.card:C.border,color:active.length>0?C.textOnDark:C.textLight,fontSize:15,fontWeight:600,cursor:active.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          {I.check} {saving?"Saving...":editingRoute?"Update route":"Save route"}</button>
        {active.length>10&&<div style={{fontSize:12,color:C.danger,textAlign:"center",marginTop:6}}>Google Maps supports max ~10 waypoints</div>}
      </div>
    </div></div>;
}
