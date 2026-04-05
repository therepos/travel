import { useState, useEffect, useRef } from "react";
import { api, C, I, NAV_H, doShare } from "./shared.jsx";
import DetailView from "./components/DetailView.jsx";
import EditModal from "./components/EditModal.jsx";
import CaptureBar from "./components/CaptureBar.jsx";
import SmartFilters from "./components/SmartFilters.jsx";
import RoutePlanner from "./components/RoutePlanner.jsx";
import RoutesTab from "./components/RoutesTab.jsx";
import BottomNav from "./components/BottomNav.jsx";
import SwipeRow from "./components/SwipeRow.jsx";
import ContextMenu from "./components/ContextMenu.jsx";
import SelectionBar from "./components/SelectionBar.jsx";
import SearchView from "./components/SearchView.jsx";

export default function App() {
  const [places,setPlaces]=useState([]);const [routes,setRoutes]=useState([]);const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("places");
  const [filters,setFilters]=useState({region:null,country:null,city:null,tag:null,autoTag:null});
  const [detail,setDetail]=useState(null);const [editPlace,setEditPlace]=useState(null);
  const [routePlanner,setRoutePlanner]=useState(null);
  const [showCapture,setShowCapture]=useState(false);
  const [showSearch,setShowSearch]=useState(false);
  const [selectMode,setSelectMode]=useState(false);
  const [selected,setSelected]=useState(new Set());
  const longPressTimer=useRef(null);
  const [menuPlace,setMenuPlace]=useState(null);

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
    return true;
  });

  const goHome=()=>{setFilters({region:null,country:null,city:null,tag:null,autoTag:null});setDetail(null);setEditPlace(null);setRoutePlanner(null);setShowCapture(false);setShowSearch(false);exitSelectMode();setTab("places");};
  const handleSave=p=>{setPlaces(prev=>[p,...prev]);};
  const handleDelete=async id=>{try{await api(`/places/${id}`,{method:"DELETE"});setPlaces(prev=>prev.filter(p=>p.id!==id));setDetail(null);}catch(e){console.error(e);}};
  const handleEdited=u=>{setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));if(detail?.id===u.id)setDetail(u);};
  const handleRefresh=async id=>{try{const u=await api(`/places/${id}/refresh`,{method:"POST"});setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));setDetail(u);}catch(e){console.error(e);}};
  const handleDeleteRoute=async id=>{try{await api(`/routes/${id}`,{method:"DELETE"});setRoutes(prev=>prev.filter(r=>r.id!==id));}catch(e){console.error(e);}};

  const toggleSelect=id=>{setSelected(prev=>{const n=new Set(prev);if(n.has(id))n.delete(id);else n.add(id);return n;});};
  const startLongPress=id=>{longPressTimer.current=setTimeout(()=>{setSelectMode(true);setSelected(new Set([id]));},500);};
  const cancelLongPress=()=>{if(longPressTimer.current)clearTimeout(longPressTimer.current);};
  const exitSelectMode=()=>{setSelectMode(false);setSelected(new Set());};

  const bulkDelete=async()=>{const ids=[...selected];for(const id of ids){try{await api(`/places/${id}`,{method:"DELETE"});}catch(e){}}setPlaces(prev=>prev.filter(p=>!ids.includes(p.id)));exitSelectMode();};
  const bulkAddToRoute=()=>{setRoutePlanner({initialStops:[...selected]});exitSelectMode();};
  const bulkExport=()=>{
    const items=places.filter(p=>selected.has(p.id));
    const text=items.map(p=>`${p.name}${p.city?` — ${p.city}`:""}${p.google_maps_url?`\n${p.google_maps_url}`:""}`).join("\n\n");
    if(navigator.share){try{navigator.share({title:"My Travel List",text});}catch(e){}}
    else{try{navigator.clipboard.writeText(text);}catch(e){}}
    exitSelectMode();
  };

  const handleNav=t=>{
    if(t==="search"){setShowSearch(true);return;}
    if(t==="add"){
      if(tab==="places"){setShowCapture(!showCapture);}
      else if(tab==="routes"){setRoutePlanner({initialStops:[]});}
      return;
    }
    setTab(t);setShowCapture(false);exitSelectMode();
  };

  const routeStopIds=routes.flatMap(r=>r.stops||[]);
  const locLabel=filters.city||filters.country||null;
  const showTripBar=tab==="places"&&locLabel&&fp.length>1&&!detail&&!routePlanner&&!selectMode;

  return <div style={{width:"100vw",height:"100dvh",overflow:"hidden",background:C.bg,fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideIn{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>

    {/* No header — capture bar toggled by + */}
    {showCapture&&tab==="places"&&<CaptureBar onSave={handleSave}/>}

    {/* Drill-down filters */}
    {tab==="places"&&<SmartFilters places={places} filters={filters} setFilters={setFilters} filteredCount={fp.length}/>}

    {/* Done button for select mode */}
    {tab==="places"&&selectMode&&<div style={{padding:"0 16px 6px",flexShrink:0,display:"flex",justifyContent:"flex-end"}}>
      <button onClick={exitSelectMode} style={{padding:"7px 14px",borderRadius:10,border:`1.5px solid ${C.accent}`,background:C.accentLight,cursor:"pointer",fontSize:13,fontWeight:600,color:C.accent}}>Done</button>
    </div>}

    {/* Places list */}
    {tab==="places"?
      <div style={{flex:1,overflowY:"auto",paddingBottom:(selectMode&&selected.size>0)?100:(showTripBar?NAV_H+60:NAV_H+8)}}>
        {loading?<div style={{textAlign:"center",padding:"50px",color:C.textLight,fontSize:14}}>Loading...</div>
        :fp.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:C.textLight,fontSize:14}}>{places.length===0?"Tap + to save your first place!":"No matches"}</div>
        :fp.map(p=><div key={p.id}
          onTouchStart={()=>!selectMode&&startLongPress(p.id)}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}>
          <SwipeRow place={p}
            onTap={p=>setDetail(p)}
            onEdit={p=>setEditPlace(p)}
            onDelete={handleDelete}
            isSelected={selected.has(p.id)}
            selectMode={selectMode}
            onToggleSelect={toggleSelect}
            onDotsClick={id=>setMenuPlace(places.find(x=>x.id===id))}
            routeStopIds={routeStopIds}/>
        </div>)}
      </div>
    :<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",paddingBottom:NAV_H}}>
      <RoutesTab routes={routes} onEdit={r=>setRoutePlanner({initialStops:r.stops,editingRoute:r})} onDelete={handleDeleteRoute} onNew={()=>setRoutePlanner({initialStops:[]})}/>
    </div>}

    {/* Detail view */}
    {detail&&(()=>{const idx=fp.findIndex(p=>p.id===detail.id);return <DetailView place={detail} onClose={()=>setDetail(null)} onDelete={handleDelete} onEdit={()=>setEditPlace(detail)} routeStopIds={routeStopIds} routes={routes}
      onPrev={idx>0?()=>setDetail(fp[idx-1]):null}
      onNext={idx<fp.length-1&&idx>=0?()=>setDetail(fp[idx+1]):null}
      onRefresh={handleRefresh}
      onOpenRoute={r=>setRoutePlanner({initialStops:r.stops,editingRoute:r})}
    />;})()}

    {editPlace&&<EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}
    {routePlanner&&<RoutePlanner allPlaces={places} initialStops={routePlanner.initialStops} editingRoute={routePlanner.editingRoute} onClose={()=>setRoutePlanner(null)} onSaved={async()=>{try{const d=await api("/routes");setRoutes(d.routes||[]);}catch(e){}setRoutePlanner(null);setTab("routes");}}/>}

    {showTripBar&&<div style={{position:"fixed",bottom:NAV_H,left:0,right:0,background:`rgba(240,238,235,.95)`,backdropFilter:"blur(10px)",borderTop:`1px solid ${C.borderLight}`,padding:"10px 16px 12px",animation:"slideIn .3s",display:"flex",alignItems:"center",gap:8,zIndex:90}}>
      <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600,color:C.text}}>{fp.length} in {locLabel}</div>
        <div style={{fontSize:12,color:C.textLight}}>Plan route with Google Maps</div></div>
      <button onClick={()=>setRoutePlanner({initialStops:fp.map(p=>p.id)})} style={{padding:"9px 16px",borderRadius:10,border:"none",background:C.card,color:C.textOnDark,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>{I.route} Plan</button>
    </div>}

    {/* Bottom: selection bar OR nav — always present */}
    {selectMode&&selected.size>0
      ?<SelectionBar count={selected.size} onAddToRoute={bulkAddToRoute} onExport={bulkExport} onDelete={bulkDelete} onCancel={exitSelectMode}/>
      :<BottomNav tab={tab} onTab={handleNav} captureOpen={showCapture}/>
    }

    {/* Context menu (3-dot on list row) */}
    {menuPlace&&<ContextMenu place={menuPlace} onClose={()=>setMenuPlace(null)}
      onEdit={p=>setEditPlace(p)}
      onDelete={handleDelete}
      onShare={p=>doShare(p)}
      onAddToRoute={p=>{setRoutePlanner({initialStops:[p.id]});}}
    />}

    {/* Search overlay — always accessible, sits above content below nav */}
    {showSearch&&<SearchView places={places} onClose={()=>setShowSearch(false)} onSelect={p=>{setDetail(p);setShowSearch(false);}}/>}
  </div>;
}
