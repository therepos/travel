import { useState } from "react";
import { api, I } from "../shared.jsx";

export default function RoutePlanner({allPlaces,initialStops,editingRoute,onClose,onSaved}) {
  const [selected,setSelected]=useState(initialStops||[]);
  const [searchQ,setSearchQ]=useState("");
  const [name,setName]=useState(editingRoute?.name||"New route");
  const [saving,setSaving]=useState(false);
  const [fRegion,setFRegion]=useState(null);
  const [fCountry,setFCountry]=useState(null);

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

  const Fb=({label,active:a,onClick,color="#1B7A5A"})=><button onClick={onClick} style={{padding:"4px 9px",borderRadius:10,fontSize:12,cursor:"pointer",border:`1px solid ${a?color:"#ECE9E3"}`,background:a?`${color}0F`:"#FFF",color:a?color:"#9E978C",whiteSpace:"nowrap",flexShrink:0}}>{label}</button>;

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
    <div style={{width:"min(92vw, 520px)",maxHeight:"min(88vh, 640px)",background:"#FEFDFB",borderRadius:8,display:"flex",flexDirection:"column",animation:"fadeIn .2s",boxShadow:"0 20px 60px rgba(0,0,0,.3)",overflow:"hidden"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 16px",borderBottom:"1px solid #EDE9E3",flexShrink:0}}>
        <div style={{width:34,height:34,borderRadius:10,background:"#1B7A5A0F",display:"flex",alignItems:"center",justifyContent:"center",color:"#1B7A5A",flexShrink:0}}>{I.route}</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{flex:1,fontFamily:"'Instrument Serif',Georgia,serif",fontSize:20,color:"#2C2A26",border:"none",background:"transparent",outline:"none",padding:0}} placeholder="Route name..."/>
        <span style={{fontSize:13,color:"#9E978C",flexShrink:0}}>{active.length} stops</span>
      </div>
      <div style={{padding:"10px 16px 6px",flexShrink:0}}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search your saves to add..." style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:14,outline:"none",marginBottom:6,boxSizing:"border-box"}}/>
        <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
          {Object.entries(regionCounts).sort((a,b)=>b[1]-a[1]).map(([r,n])=><Fb key={r} label={`${r} (${n})`} active={fRegion===r} onClick={()=>{setFRegion(fRegion===r?null:r);setFCountry(null);}}/>)}
        </div>
        {fRegion&&Object.keys(countryCounts).length>1&&<div style={{display:"flex",gap:3,flexWrap:"wrap",marginTop:4}}>
          {Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).map(([c,n])=><Fb key={c} label={`${c} (${n})`} active={fCountry===c} color="#B8602E" onClick={()=>setFCountry(fCountry===c?null:c)}/>)}
        </div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 16px 10px"}}>
        {filtered.map(place=>{
          const isSel=selected.includes(place.id);const num=isSel?selected.indexOf(place.id)+1:null;
          return <div key={place.id} onClick={()=>setSelected(p=>p.includes(place.id)?p.filter(x=>x!==place.id):[...p,place.id])} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:8,cursor:"pointer",border:`1.5px solid ${isSel?"#1B7A5A":"#ECE9E3"}`,background:isSel?"#1B7A5A06":"#FFF",marginBottom:4}}>
            <div style={{width:26,height:26,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:isSel?"#1B7A5A":"#F3F0EB",color:isSel?"#FFF":"#C4BDB2"}}>{isSel?num:""}</div>
            <div style={{width:36,height:36,borderRadius:6,overflow:"hidden",flexShrink:0,background:"#F0EDE8"}}>{place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:14,fontWeight:500,color:isSel?"#2C2A26":"#9E978C",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{place.name}</div>
              <div style={{fontSize:12,color:"#B5AFA5"}}>{place.city||place.country}</div></div>
          </div>;
        })}
      </div>
      <div style={{padding:"10px 16px 16px",borderTop:"1px solid #EDE9E3",flexShrink:0}}>
        <button onClick={saveRoute} disabled={active.length===0||saving} style={{width:"100%",padding:14,borderRadius:10,border:"none",background:active.length>0?"#1B7A5A":"#E0DBD3",color:active.length>0?"#FFF":"#A09888",fontSize:15,fontWeight:600,cursor:active.length>0?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          {I.check} {saving?"Saving...":editingRoute?"Update route":"Save route"}</button>
        {active.length>10&&<div style={{fontSize:12,color:"#B04040",textAlign:"center",marginTop:6}}>Google Maps supports max ~10 waypoints</div>}
      </div>
    </div></div>;
}
