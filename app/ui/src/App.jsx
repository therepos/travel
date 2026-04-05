import { useState, useEffect } from "react";
import { api, I, ib } from "./shared.jsx";
import DetailView from "./components/DetailView.jsx";
import EditModal from "./components/EditModal.jsx";
import CaptureBar from "./components/CaptureBar.jsx";
import SmartFilters from "./components/SmartFilters.jsx";
import RoutePlanner from "./components/RoutePlanner.jsx";
import RoutesTab from "./components/RoutesTab.jsx";

export default function App() {
  const [places,setPlaces]=useState([]);const [routes,setRoutes]=useState([]);const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("places");
  const [filters,setFilters]=useState({region:null,country:null,city:null,tag:null,autoTag:null});
  const [detail,setDetail]=useState(null);const [editPlace,setEditPlace]=useState(null);
  const [routePlanner,setRoutePlanner]=useState(null);
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
  const handleRefresh=async id=>{try{const u=await api(`/places/${id}/refresh`,{method:"POST"});setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));setDetail(u);}catch(e){console.error(e);}};
  const handleDeleteRoute=async id=>{try{await api(`/routes/${id}`,{method:"DELETE"});setRoutes(prev=>prev.filter(r=>r.id!==id));}catch(e){console.error(e);}};
  const handleRenameRoute=async(id,newName)=>{try{await api(`/routes/${id}`,{method:"PUT",body:JSON.stringify({name:newName})});setRoutes(prev=>prev.map(r=>r.id===id?{...r,name:newName}:r));}catch(e){console.error(e);}};

  const locLabel=filters.city||filters.country||null;
  const routeStopIds=routes.flatMap(r=>r.stops||[]);
  const showTripBar=tab==="places"&&locLabel&&fp.length>1&&!detail&&!routePlanner;

  return <div style={{width:"100vw",height:"100vh",overflow:"hidden",background:"#FAFAF7",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",flexShrink:0,background:"#FEFDFB",borderBottom:".5px solid #EDE9E3"}}>
      <h1 onClick={goHome} style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:26,fontWeight:400,color:"#2C2A26",margin:0,cursor:"pointer"}}>Travel</h1>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:13,color:"#B5AFA5"}}>{tab==="places"?`${fp.length}`:""}</span>
        <div style={{display:"flex",background:"#F3F0EB",borderRadius:7,padding:2}}>
          {["places","routes"].map(t=><button key={t} onClick={()=>setTab(t)} style={{padding:"6px 12px",borderRadius:6,border:"none",background:tab===t?"#FFF":"transparent",color:tab===t?"#2C2A26":"#A09888",fontSize:13,fontWeight:600,cursor:"pointer",boxShadow:tab===t?"0 1px 2px rgba(0,0,0,.05)":"none",textTransform:"capitalize"}}>{t}</button>)}
        </div>
        <button onClick={()=>{setSearchOpen(!searchOpen);if(searchOpen)setSearchQ("");}} style={{width:34,height:34,borderRadius:"50%",border:"1px solid #E8E3DB",background:searchOpen?"#2C2A260A":"#FFF",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:searchOpen?"#2C2A26":"#9E978C"}}>{searchOpen?I.x:I.search}</button>
      </div>
    </div>

    {searchOpen&&<div style={{padding:"6px 16px",background:"#FEFDFB",animation:"slideIn .15s"}}><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..." autoFocus style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:14,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/></div>}

    {tab==="places"&&<CaptureBar onSave={handleSave}/>}
    {tab==="places"&&<SmartFilters places={places} filters={filters} setFilters={setFilters}/>}

    {tab==="places"?
      <div style={{flex:1,overflowY:"auto",paddingBottom:showTripBar?65:0}}>
        {loading?<div style={{textAlign:"center",padding:"50px",color:"#B5AFA5",fontSize:14}}>Loading...</div>
        :fp.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"#C4BDB2",fontSize:14}}>{places.length===0?"Save your first place above!":"No matches"}</div>
        :fp.map(p=><div key={p.id} onClick={()=>setDetail(p)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderBottom:"1px solid #F3F0EB",cursor:"pointer"}}>
          <div style={{width:48,height:48,borderRadius:8,overflow:"hidden",flexShrink:0,background:"#F0EDE8",position:"relative"}}>
            {p.photo&&<img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
            {routeStopIds.includes(p.id)&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#1B7A5A",border:"1.5px solid #FFF"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:500,color:"#2C2A26",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:13,color:"#9E978C",marginTop:2}}>{p.city||p.country}{(p.tags||[]).length>0&&<span style={{color:"#C4BDB2"}}> · {p.tags.join(", ")}</span>}</div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
            {p.rating>0&&<div style={{display:"flex",alignItems:"center",gap:2}}>{I.star}<span style={{fontSize:13,color:"#854F0B"}}>{p.rating}</span></div>}
            <span style={{fontSize:12,color:"#C4BDB2"}}>{p.saved}</span>
            {ib(e=>{e.stopPropagation();setEditPlace(p);},I.edit)}
          </div>
        </div>)}
      </div>
    :<RoutesTab routes={routes} onEdit={r=>setRoutePlanner({initialStops:r.stops,editingRoute:r})} onDelete={handleDeleteRoute} onNew={()=>setRoutePlanner({initialStops:[]})} onRename={handleRenameRoute}/>}

    {detail&&(()=>{const idx=fp.findIndex(p=>p.id===detail.id);return <DetailView place={detail} onClose={()=>setDetail(null)} onDelete={handleDelete} onEdit={()=>setEditPlace(detail)} routeStopIds={routeStopIds}
      onPrev={idx>0?()=>setDetail(fp[idx-1]):null}
      onNext={idx<fp.length-1&&idx>=0?()=>setDetail(fp[idx+1]):null}
      onRefresh={handleRefresh}
    />;})()}
    {editPlace&&<EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}

    {showTripBar&&<div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(254,253,251,.95)",backdropFilter:"blur(10px)",borderTop:".5px solid #EDE9E3",padding:"10px 16px 14px",animation:"slideIn .3s",display:"flex",alignItems:"center",gap:8}}>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:"#2C2A26"}}>{fp.length} in {locLabel}</div>
        <div style={{fontSize:12,color:"#9E978C"}}>Plan route with Google Maps</div></div>
      <button onClick={()=>setRoutePlanner({initialStops:fp.map(p=>p.id)})} style={{padding:"9px 16px",borderRadius:8,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{I.route}Plan</button>
    </div>}

    {routePlanner&&<RoutePlanner allPlaces={places} initialStops={routePlanner.initialStops} editingRoute={routePlanner.editingRoute} onClose={()=>setRoutePlanner(null)} onSaved={async()=>{try{const d=await api("/routes");setRoutes(d.routes||[]);}catch(e){}setRoutePlanner(null);setTab("routes");}}/>}
  </div>;
}
