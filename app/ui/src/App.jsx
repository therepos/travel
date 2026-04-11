import { useState, useEffect, useRef, useCallback } from "react";
import { api, C, INTENTS, Icon, doShare } from "./shared.jsx";
import Sidebar from "./components/Sidebar.jsx";
import PlaceList from "./components/PlaceList.jsx";
import DetailPanel from "./components/DetailPanel.jsx";
import SearchDropdown from "./components/SearchDropdown.jsx";
import EditModal from "./components/EditModal.jsx";
import RoutePlanner from "./components/RoutePlanner.jsx";
import RouteList from "./components/RouteList.jsx";
import RouteDetail from "./components/RouteDetail.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import MobileDetail from "./components/MobileDetail.jsx";
import MobileNav from "./components/MobileNav.jsx";

const FONT = "'Google Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

export default function App() {
  const [places,setPlaces] = useState([]);
  const [routes,setRoutes] = useState([]);
  const [loading,setLoading] = useState(true);
  const [view,setView] = useState("places"); // places | routes | settings
  const [selectedId,setSelectedId] = useState(null);
  const [routeDetailId,setRouteDetailId] = useState(null);
  const [editPlace,setEditPlace] = useState(null);
  const [routePlanner,setRoutePlanner] = useState(null);
  const [searchOpen,setSearchOpen] = useState(false);
  const [searchQuery,setSearchQuery] = useState("");
  const [mobileDetail,setMobileDetail] = useState(null);
  const [mobileRouteDetail,setMobileRouteDetail] = useState(null);
  const [bulkMode,setBulkMode] = useState(false);
  const [bulkSelected,setBulkSelected] = useState(new Set());

  // Sidebar filter state
  const [expandedIntent,setExpandedIntent] = useState(null);
  const [filterIntent,setFilterIntent] = useState(null);
  const [filterCuisine,setFilterCuisine] = useState(null);
  const [filterSubType,setFilterSubType] = useState(null);
  const [filterRegion,setFilterRegion] = useState(null);
  const [filterTag,setFilterTag] = useState(null);

  const [isMobile,setIsMobile] = useState(false);
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize",check);
    return () => window.removeEventListener("resize",check);
  }, []);

  // Back button: push history state when opening detail views
  useEffect(() => {
    if (!isMobile) return;
    const hasOverlay = mobileDetail || mobileRouteDetail || routePlanner;
    if (hasOverlay) { history.pushState({overlay:true},""); }
  }, [isMobile, !!mobileDetail, !!mobileRouteDetail, !!routePlanner]);

  useEffect(() => {
    if (!isMobile) return;
    const onPop = () => {
      if (routePlanner) { setRoutePlanner(null); }
      else if (mobileRouteDetail) { setMobileRouteDetail(null); }
      else if (mobileDetail) { setMobileDetail(null); }
    };
    window.addEventListener("popstate",onPop);
    return () => window.removeEventListener("popstate",onPop);
  }, [isMobile, mobileDetail, mobileRouteDetail, routePlanner]);

  const load = useCallback(() => {
    api("/places").then(d=>{setPlaces(d.places||[]);setLoading(false);}).catch(()=>setLoading(false));
    api("/routes").then(d=>setRoutes(d.routes||[])).catch(()=>{});
  }, []);
  useEffect(load,[load]);

  // Filter places
  const filtered = places.filter(p => {
    if (filterIntent && p.intent !== filterIntent) return false;
    if (filterCuisine && p.cuisine !== filterCuisine) return false;
    if (filterSubType && p.sub_type !== filterSubType) return false;
    if (filterRegion && p.region !== filterRegion) return false;
    if (filterTag && !(p.tags||[]).includes(filterTag)) return false;
    return true;
  });

  // Group by city
  const grouped = {};
  filtered.forEach(p => {
    const k = p.city && p.country ? `${p.city}, ${p.country}` : p.country || "Unknown";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(p);
  });

  // Breadcrumb
  const breadcrumbParts = [];
  if (filterIntent) {
    const il = INTENTS.find(i=>i.key===filterIntent);
    breadcrumbParts.push(il ? il.label : filterIntent);
  }
  if (filterCuisine) breadcrumbParts.push(filterCuisine);
  if (filterSubType) breadcrumbParts.push(filterSubType);
  if (filterRegion) breadcrumbParts.push(filterRegion);
  if (filterTag) breadcrumbParts.push(filterTag);

  const clearFilters = () => {
    setFilterIntent(null);setFilterCuisine(null);setFilterSubType(null);
    setFilterRegion(null);setFilterTag(null);setExpandedIntent(null);
  };

  const selected = places.find(p => p.id === selectedId);
  const routeDetail = routes.find(r => r.id === routeDetailId);

  const handlePlaceClick = p => {
    if (isMobile) { setMobileDetail(p); }
    else { setSelectedId(p.id); setRouteDetailId(null); setRoutePlanner(null); }
  };

  const handleRouteClick = r => {
    if (isMobile) { setMobileRouteDetail(r); }
    else { setRouteDetailId(r.id); setSelectedId(null); setRoutePlanner(null); }
  };

  const handleSave = p => { setPlaces(prev=>[p,...prev]); setSearchOpen(false); setSearchQuery(""); };

  const handleDelete = async id => {
    try { await api(`/places/${id}`,{method:"DELETE"}); setPlaces(prev=>prev.filter(p=>p.id!==id));
      if (selectedId===id) setSelectedId(null); if (mobileDetail?.id===id) setMobileDetail(null);
    } catch(e) { console.error(e); }
  };

  const handleEdited = u => {
    setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));
    if (mobileDetail?.id===u.id) setMobileDetail(u);
    setEditPlace(null);
  };

  const handleRefresh = async id => {
    try { const u = await api(`/places/${id}/refresh`,{method:"POST"});
      setPlaces(prev=>prev.map(p=>p.id===u.id?u:p));
      if (selectedId===id) setSelectedId(id);
      if (mobileDetail?.id===id) setMobileDetail(u);
    } catch(e) { console.error(e); throw e; }
  };

  const handleDeleteRoute = async id => {
    try { await api(`/routes/${id}`,{method:"DELETE"}); setRoutes(prev=>prev.filter(r=>r.id!==id));
      if (routeDetailId===id) setRouteDetailId(null);
    } catch(e) { console.error(e); }
  };

  const handleBulkDelete = async () => {
    const ids = [...bulkSelected];
    const type = view === "routes" ? "routes" : "places";
    const count = ids.length;
    if (!confirm(`Delete ${count} ${type}?`)) return;
    try {
      for (const id of ids) {
        await api(`/${type}/${id}`, {method:"DELETE"});
      }
      if (type === "places") {
        setPlaces(prev => prev.filter(p => !bulkSelected.has(p.id)));
        if (bulkSelected.has(selectedId)) setSelectedId(null);
      } else {
        setRoutes(prev => prev.filter(r => !bulkSelected.has(r.id)));
        if (bulkSelected.has(routeDetailId)) setRouteDetailId(null);
      }
    } catch(e) { console.error(e); }
    setBulkSelected(new Set());
    setBulkMode(false);
  };

  const toggleBulkItem = id => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleRouteSaved = async () => {
    try { const d = await api("/routes"); setRoutes(d.routes||[]); } catch(e) {}
    setRoutePlanner(null); setView("routes");
  };

  const switchView = v => {
    setView(v); setSelectedId(null); setRouteDetailId(null);
    setRoutePlanner(null); setSearchOpen(false);
    setBulkMode(false); setBulkSelected(new Set());
  };

  const openRoutePlanner = (initialStops=[], editingRoute=null) => {
    setRoutePlanner({initialStops, editingRoute});
    setSelectedId(null); setRouteDetailId(null); setMobileRouteDetail(null);
  };

  // Mobile full-screen views
  if (isMobile && mobileDetail) return <div style={{width:"100%",height:"100dvh",fontFamily:FONT,color:C.text,display:"flex",flexDirection:"column",background:C.bg}}>
    <MobileDetail place={mobileDetail}
      onClose={()=>setMobileDetail(null)} onDelete={handleDelete}
      onEdit={p=>{setEditPlace(p);}} onRefresh={handleRefresh} onShare={doShare}
      editModal={editPlace && <EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}
    />
    <MobileNav view={view} onNav={v=>{setMobileDetail(null);switchView(v);}}/>
  </div>;

  if (isMobile && mobileRouteDetail) return <div style={{width:"100%",height:"100dvh",fontFamily:FONT,color:C.text,display:"flex",flexDirection:"column",background:C.bg}}>
    <RouteDetail route={mobileRouteDetail} onClose={()=>setMobileRouteDetail(null)}
      onPlaceClick={p=>{setMobileRouteDetail(null);setMobileDetail(p);}}
      onEdit={r=>openRoutePlanner(r.stops,r)} onDelete={handleDeleteRoute} places={places} isMobile={true}/>
    <MobileNav view={view} onNav={v=>{setMobileRouteDetail(null);switchView(v);}}/>
  </div>;

  // ── MOBILE LAYOUT ──
  if (isMobile) return <div ref={containerRef} style={{width:"100%",height:"100dvh",fontFamily:FONT,color:C.text,display:"flex",flexDirection:"column",background:C.bg,position:"relative"}}>
    {/* Search bar */}
    <div style={{margin:"10px 16px 0",padding:"0 6px 0 14px",height:48,background:C.surface,borderRadius:24,display:"flex",alignItems:"center",gap:10,flexShrink:0,border:searchOpen?`1.5px solid ${C.blue}`:"1.5px solid transparent"}}
      onClick={()=>!searchOpen&&setSearchOpen(true)}>
      <Icon name="search" size={20} color={searchOpen?C.blue:C.textLight}/>
      {searchOpen ? <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} autoFocus
        placeholder="Search saved or add new..." style={{flex:1,border:"none",background:"none",fontSize:16,color:C.text,outline:"none",fontFamily:FONT}}/>
      : <span style={{flex:1,fontSize:16,color:C.textLight}}>Search your places</span>}
      {searchOpen && <button onClick={e=>{e.stopPropagation();setSearchOpen(false);setSearchQuery("");}} style={{background:"none",border:"none",padding:4,cursor:"pointer"}}><Icon name="x" size={18} color={C.textLight}/></button>}
      {!searchOpen && <div style={{width:32,height:32,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500}}>R</div>}
    </div>

    {searchOpen ? <SearchDropdown query={searchQuery} places={places} onSave={handleSave} onSelect={p=>{setSearchOpen(false);setSearchQuery("");handlePlaceClick(p);}} isMobile={true} onClose={()=>{setSearchOpen(false);setSearchQuery("");}}/> : <>
      {/* Intent chips */}
      {view==="places" && <div style={{display:"flex",gap:8,padding:"10px 16px 4px",overflowX:"auto",flexShrink:0,WebkitOverflowScrolling:"touch"}}>
        <Chip label="All" active={!filterIntent} onClick={clearFilters}/>
        {INTENTS.map(i=><Chip key={i.key} label={i.label} active={filterIntent===i.key}
          onClick={()=>{if(filterIntent===i.key){clearFilters();}else{setFilterIntent(i.key);setFilterCuisine(null);setFilterSubType(null);setFilterTag(null);}}}/>)}
      </div>}

      {/* Sub-chips when intent selected */}
      {view==="places" && filterIntent && (() => {
        const subs = filterIntent==="eat"
          ? [...new Set(places.filter(p=>p.intent===filterIntent&&p.cuisine).map(p=>p.cuisine))].sort()
          : [...new Set(places.filter(p=>p.intent===filterIntent&&p.sub_type).map(p=>p.sub_type))].sort();
        if (!subs.length) return null;
        const current = filterIntent==="eat" ? filterCuisine : filterSubType;
        return <div style={{display:"flex",gap:8,padding:"4px 16px 2px",overflowX:"auto",flexShrink:0}}>
          {subs.map(s=><Chip key={s} label={s} active={current===s}
            onClick={()=>{if(filterIntent==="eat"){setFilterCuisine(filterCuisine===s?null:s);}else{setFilterSubType(filterSubType===s?null:s);}}}/>)}
        </div>;
      })()}

      {/* Breadcrumb */}
      {view==="places" && breadcrumbParts.length>0 && <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 12px 0",fontSize:12,flexShrink:0}}>
        {breadcrumbParts.map((p,i)=><span key={i}>{i>0&&<span style={{color:C.border,margin:"0 2px"}}>›</span>}<b style={{color:C.blue,fontWeight:500}}>{p}</b></span>)}
        <span style={{color:C.textLight,marginLeft:"auto"}}>{filtered.length}</span>
        <button onClick={clearFilters} style={{width:18,height:18,borderRadius:"50%",background:C.blueBg,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:4}}>
          <Icon name="x" size={10} color={C.blue} sw={2.5}/>
        </button>
      </div>}

      {/* Bulk mode bar for mobile */}
      {(view==="places"||view==="routes") && !bulkMode && <div style={{display:"flex",justifyContent:"flex-end",padding:"4px 16px 0"}}>
        <button onClick={()=>{setBulkMode(true);setBulkSelected(new Set());}}
          style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderRadius:16,background:"none",border:`1px solid ${C.border}`,fontSize:12,fontWeight:500,color:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>
          <Icon name="selectAll" size={14} color={C.textMid} sw={1.5}/> Select
        </button>
      </div>}
      {bulkMode && <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 16px",background:C.blueBg,flexShrink:0}}>
        <span style={{fontSize:13,color:C.blue,fontWeight:500,flex:1}}>{bulkSelected.size} selected</span>
        <button onClick={handleBulkDelete} disabled={bulkSelected.size===0}
          style={{display:"flex",alignItems:"center",gap:4,padding:"6px 12px",borderRadius:16,background:bulkSelected.size>0?"#fce8e6":"transparent",border:`1px solid ${bulkSelected.size>0?C.red:C.border}`,fontSize:12,fontWeight:500,color:bulkSelected.size>0?C.red:C.textLight,cursor:bulkSelected.size>0?"pointer":"default",fontFamily:"inherit"}}>
          <Icon name="trash" size={14} color={bulkSelected.size>0?C.red:C.textLight} sw={1.5}/> Delete
        </button>
        <button onClick={()=>{setBulkMode(false);setBulkSelected(new Set());}}
          style={{padding:"6px 12px",borderRadius:16,background:"none",border:`1px solid ${C.border}`,fontSize:12,fontWeight:500,color:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>
          Cancel
        </button>
      </div>}

      {/* Content */}
      {view==="places" ? <PlaceList grouped={grouped} filtered={filtered} loading={loading}
        selectedId={null} onPlaceClick={bulkMode ? (p=>toggleBulkItem(p.id)) : handlePlaceClick} isMobile={true}
        bulkMode={bulkMode} bulkSelected={bulkSelected}/>
      : view==="routes" ? <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
        <RouteList routes={routes} onRouteClick={bulkMode ? (r=>toggleBulkItem(r.id)) : handleRouteClick} onDelete={handleDeleteRoute}
          onNew={()=>openRoutePlanner([])} isMobile={true} selectedId={null}
          bulkMode={bulkMode} bulkSelected={bulkSelected}/>
      </div>
      : <SettingsPage isMobile={true}/>}

      {/* FAB */}
      {view==="places" && !bulkMode && <button onClick={()=>setSearchOpen(true)} style={{position:"absolute",bottom:72,right:14,width:56,height:56,borderRadius:16,background:C.blue,color:"#fff",border:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4,boxShadow:"0 2px 8px rgba(26,115,232,0.35)",cursor:"pointer"}}>
        <Icon name="plus" size={22} color="#fff" sw={2.5}/>
      </button>}

      <MobileNav view={view} onNav={switchView}/>
    </>}

    {editPlace && <EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}
    {routePlanner && <RoutePlanner allPlaces={places} initialStops={routePlanner.initialStops}
      editingRoute={routePlanner.editingRoute} onClose={()=>setRoutePlanner(null)} onSaved={handleRouteSaved} isMobile={true}/>}
  </div>;

  // ── DESKTOP LAYOUT ──
  return <div ref={containerRef} style={{width:"100vw",height:"100vh",fontFamily:FONT,color:C.text,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}*{box-sizing:border-box;margin:0;padding:0}button{font-family:${FONT};cursor:pointer}input,textarea{font-family:${FONT}}::-webkit-scrollbar{width:6px}::-webkit-scrollbar-thumb{background:#dadce0;border-radius:3px}::-webkit-scrollbar-track{background:transparent}`}</style>

    {/* Top bar */}
    <div style={{height:64,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",padding:"0 20px",gap:16,flexShrink:0,position:"relative",zIndex:20}}>
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:20,fontWeight:500,color:C.textMid,width:248,flexShrink:0,cursor:"pointer"}} onClick={()=>{switchView("places");clearFilters();}}>
        <Icon name="pin" size={24} color={C.blue} fill="none"/> Travel
      </div>
      <div ref={searchRef} style={{flex:1,maxWidth:560,position:"relative"}}>
        <div style={{height:46,background:searchOpen?"#fff":C.borderLight,borderRadius:searchOpen?"8px 8px 0 0":"8px",display:"flex",alignItems:"center",gap:10,padding:"0 14px",
          border:searchOpen?`1.5px solid ${C.blue}`:"1.5px solid transparent",transition:"all .15s"}}
          onClick={()=>!searchOpen&&setSearchOpen(true)}>
          <Icon name="search" size={20} color={searchOpen?C.blue:C.textLight}/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
            onFocus={()=>setSearchOpen(true)}
            placeholder="Search saved places or add new..."
            style={{flex:1,border:"none",background:"none",fontSize:15,color:C.text,outline:"none"}}/>
          {searchOpen && <button onClick={e=>{e.stopPropagation();setSearchOpen(false);setSearchQuery("");}}
            style={{background:"none",border:"none",padding:2}}><Icon name="x" size={16} color={C.textLight}/></button>}
        </div>
        {searchOpen && <SearchDropdown query={searchQuery} places={places} onSave={handleSave}
          onSelect={p=>{setSearchOpen(false);setSearchQuery("");handlePlaceClick(p);}}
          isMobile={false} anchorRef={searchRef}
          onClose={()=>{setSearchOpen(false);setSearchQuery("");}}/>}
      </div>
      <button onClick={()=>switchView("settings")} style={{background:"none",border:"none",padding:4,color:view==="settings"?C.blue:C.textMid}}>
        <Icon name="gear" size={22}/>
      </button>
      <div style={{width:34,height:34,borderRadius:"50%",background:C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500}}>R</div>
    </div>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {/* Sidebar */}
      <Sidebar places={places} view={view} switchView={switchView}
        expandedIntent={expandedIntent} setExpandedIntent={setExpandedIntent}
        filterIntent={filterIntent} setFilterIntent={setFilterIntent}
        filterCuisine={filterCuisine} setFilterCuisine={setFilterCuisine}
        filterSubType={filterSubType} setFilterSubType={setFilterSubType}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterTag={filterTag} setFilterTag={setFilterTag}
        clearFilters={clearFilters} routes={routes}/>

      {/* Main list */}
      <div style={{width:340,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0,gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:13,flex:1,color:C.textLight}}>
            {breadcrumbParts.length > 0 ? <>
              {breadcrumbParts.map((p,i)=><span key={i}>{i>0&&<span style={{color:C.border,margin:"0 3px"}}>›</span>}<b style={{color:C.blue,fontWeight:500}}>{p}</b></span>)}
              <span style={{marginLeft:4}}>· {filtered.length}</span>
              <button onClick={clearFilters} style={{width:20,height:20,borderRadius:"50%",background:C.blueBg,border:"none",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:3}}>
                <Icon name="x" size={10} color={C.blue} sw={2.5}/>
              </button>
            </> : <span>All places · {filtered.length}</span>}
          </div>
          {(view === "places" || view === "routes") && !bulkMode && <button onClick={()=>{setBulkMode(true);setBulkSelected(new Set());}}
            style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:16,background:"none",border:`1px solid ${C.border}`,fontSize:12,fontWeight:500,color:C.textMid,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.surface;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <Icon name="selectAll" size={14} color={C.textMid} sw={1.5}/> Select
          </button>}
          {bulkMode && <>
            <span style={{fontSize:12,color:C.blue,fontWeight:500}}>{bulkSelected.size} selected</span>
            <button onClick={handleBulkDelete} disabled={bulkSelected.size===0}
              style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:16,background:bulkSelected.size>0?"#fce8e6":"transparent",border:`1px solid ${bulkSelected.size>0?C.red:C.border}`,fontSize:12,fontWeight:500,color:bulkSelected.size>0?C.red:C.textLight,cursor:bulkSelected.size>0?"pointer":"default",fontFamily:"inherit"}}>
              <Icon name="trash" size={14} color={bulkSelected.size>0?C.red:C.textLight} sw={1.5}/> Delete
            </button>
            <button onClick={()=>{setBulkMode(false);setBulkSelected(new Set());}}
              style={{padding:"6px 10px",borderRadius:16,background:"none",border:`1px solid ${C.border}`,fontSize:12,fontWeight:500,color:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>
              Cancel
            </button>
          </>}
          {!bulkMode && <button onClick={()=>setSearchOpen(true)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:16,background:C.blue,color:"#fff",border:"none",fontSize:13,fontWeight:500}}>
            <Icon name="plus" size={14} color="#fff" sw={2.5}/> Add
          </button>}
        </div>

        {view === "places" ? <PlaceList grouped={grouped} filtered={filtered} loading={loading}
          selectedId={selectedId} onPlaceClick={bulkMode ? (p=>toggleBulkItem(p.id)) : handlePlaceClick} isMobile={false}
          bulkMode={bulkMode} bulkSelected={bulkSelected}/>
        : view === "routes" ? <div style={{flex:1,overflowY:"auto",padding:"8px 0"}}>
          <RouteList routes={routes} onRouteClick={bulkMode ? (r=>toggleBulkItem(r.id)) : handleRouteClick} onDelete={handleDeleteRoute}
            onNew={()=>openRoutePlanner([])} isMobile={false} selectedId={routeDetailId}
            bulkMode={bulkMode} bulkSelected={bulkSelected}/>
        </div>
        : null}
      </div>

      {/* Right panel */}
      {view === "settings" ? <SettingsPage isMobile={false}/>
      : routePlanner ? <RoutePlanner allPlaces={places} initialStops={routePlanner.initialStops}
          editingRoute={routePlanner.editingRoute} onClose={()=>setRoutePlanner(null)} onSaved={handleRouteSaved} isMobile={false}/>
      : view === "places" && selected ? <DetailPanel place={selected}
          onClose={()=>setSelectedId(null)} onDelete={handleDelete}
          onEdit={p=>setEditPlace(p)} onRefresh={handleRefresh} onShare={doShare}/>
      : view === "routes" && routeDetail ? <RouteDetail route={routeDetail}
          onClose={()=>setRouteDetailId(null)} onPlaceClick={p=>{setSelectedId(p.id);setRouteDetailId(null);setView("places");}}
          onEdit={r=>openRoutePlanner(r.stops,r)} onDelete={handleDeleteRoute} places={places}/>
      : <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.border,fontSize:14,borderLeft:`1px solid ${C.border}`}}>
          {view==="places" ? "Select a place to view details" : "Select a route to view details"}
        </div>}
    </div>

    {editPlace && <EditModal place={editPlace} onClose={()=>setEditPlace(null)} onSaved={handleEdited}/>}
    {/* Scrim for search on desktop */}
    {searchOpen && <div onClick={()=>{setSearchOpen(false);setSearchQuery("");}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.08)",zIndex:10}}/>}
  </div>;
}

function Chip({label, active, onClick}) {
  return <button onClick={onClick} style={{padding:"8px 16px",borderRadius:8,fontSize:14,whiteSpace:"nowrap",
    border:`1px solid ${active?C.blueBg:C.border}`,background:active?C.blueBg:"#fff",
    color:active?C.blue:C.textMid,fontWeight:500,cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>
    {label}
  </button>;
}
