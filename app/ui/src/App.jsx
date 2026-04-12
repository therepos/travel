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

// ── Auth Screen ─────────────────────────────────────────
function AuthScreen({onAuth}) {
  const [mode,setMode] = useState("login");
  const [username,setUsername] = useState("");
  const [password,setPassword] = useState("");
  const [displayName,setDisplayName] = useState("");
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(false);

  const submit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const body = mode==="login" ? {username,password} : {username,password,display_name:displayName||username};
      const res = await fetch(`/api/auth/${mode==="login"?"login":"register"}`,{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Failed");
      onAuth(data.user);
    } catch(err) { setError(err.message); }
    setLoading(false);
  };

  return <div style={{width:"100vw",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,background:C.bg}}>
    <div style={{width:"100%",maxWidth:380,padding:"0 24px"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,fontSize:28,fontWeight:500,color:C.text}}>
          <Icon name="pin" size={32} color={C.blue} fill="none"/> Travel
        </div>
        <div style={{fontSize:15,color:C.textMid,marginTop:6}}>Your personal travel wishlist</div>
      </div>

      <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username"
          autoComplete="username" autoCapitalize="none" required
          style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:FONT,outline:"none",background:C.bg,color:C.text,transition:"border .15s"}}
          onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        {mode==="register" && <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name (optional)"
          style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:FONT,outline:"none",background:C.bg,color:C.text,transition:"border .15s"}}
          onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>}
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"
          type="password" autoComplete={mode==="login"?"current-password":"new-password"} required
          style={{padding:"14px 16px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:16,fontFamily:FONT,outline:"none",background:C.bg,color:C.text,transition:"border .15s"}}
          onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>

        {error && <div style={{padding:"10px 14px",borderRadius:10,background:"#fce8e6",color:"#c5221f",fontSize:14}}>{error}</div>}

        <button type="submit" disabled={loading}
          style={{padding:14,borderRadius:12,border:"none",background:C.blue,color:"#fff",fontSize:16,fontWeight:500,fontFamily:FONT,cursor:loading?"wait":"pointer",opacity:loading?.7:1,transition:"opacity .15s"}}>
          {loading ? "..." : mode==="login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div style={{textAlign:"center",marginTop:20,fontSize:14,color:C.textMid}}>
        {mode==="login" ? <>
          Don't have an account?{" "}
          <button onClick={()=>{setMode("register");setError("");}} style={{background:"none",border:"none",color:C.blue,fontWeight:500,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Sign up</button>
        </> : <>
          Already have an account?{" "}
          <button onClick={()=>{setMode("login");setError("");}} style={{background:"none",border:"none",color:C.blue,fontWeight:500,fontSize:14,cursor:"pointer",fontFamily:FONT}}>Sign in</button>
        </>}
      </div>
    </div>
  </div>;
}

export default function App() {
  const [user,setUser] = useState(undefined); // undefined=loading, null=not logged in, object=logged in
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
  const [profileOpen,setProfileOpen] = useState(false);

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

  // Check auth on mount
  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{setUser(d.user||null);}).catch(()=>setUser(null));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize",check);
    return () => window.removeEventListener("resize",check);
  }, []);

  // Back button: push history state when opening detail views or search
  useEffect(() => {
    if (!isMobile) return;
    const hasOverlay = mobileDetail || mobileRouteDetail || routePlanner || searchOpen;
    if (hasOverlay) { history.pushState({overlay:true},""); }
  }, [isMobile, !!mobileDetail, !!mobileRouteDetail, !!routePlanner, searchOpen]);

  useEffect(() => {
    if (!isMobile) return;
    const onPop = () => {
      if (routePlanner) { setRoutePlanner(null); }
      else if (mobileRouteDetail) { setMobileRouteDetail(null); }
      else if (mobileDetail) { setMobileDetail(null); }
      else if (searchOpen) { setSearchOpen(false); setSearchQuery(""); }
    };
    window.addEventListener("popstate",onPop);
    return () => window.removeEventListener("popstate",onPop);
  }, [isMobile, mobileDetail, mobileRouteDetail, routePlanner, searchOpen]);

  const load = useCallback(() => {
    api("/places").then(d=>{setPlaces(d.places||[]);setLoading(false);}).catch(()=>setLoading(false));
    api("/routes").then(d=>setRoutes(d.routes||[])).catch(()=>{});
  }, []);
  useEffect(()=>{ if(user) load(); },[user, load]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout",{method:"POST"});
    setUser(null); setPlaces([]); setRoutes([]);
  };

  // Auth gate
  if (user === undefined) return <div style={{width:"100vw",height:"100dvh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,color:C.textLight}}>Loading...</div>;
  if (user === null) return <AuthScreen onAuth={u=>{setUser(u);setLoading(true);}}/>;

  const userInitial = (user.display_name||user.username||"?")[0].toUpperCase();
  const userColor = user.color || C.blue;

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
    <div style={{margin:"10px 16px 0",display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
      <div style={{flex:1,padding:"0 6px 0 14px",height:48,background:C.surface,borderRadius:24,display:"flex",alignItems:"center",gap:10,border:searchOpen?`1.5px solid ${C.blue}`:"1.5px solid transparent"}}
        onClick={()=>!searchOpen&&setSearchOpen(true)}>
        <Icon name="search" size={20} color={searchOpen?C.blue:C.textLight}/>
        {searchOpen ? <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} autoFocus
          placeholder="Search saved or add new..." style={{flex:1,border:"none",background:"none",fontSize:16,color:C.text,outline:"none",fontFamily:FONT}}/>
        : <span style={{flex:1,fontSize:16,color:C.textLight}}>Search your places</span>}
        {searchOpen && <button onClick={e=>{e.stopPropagation();setSearchOpen(false);setSearchQuery("");}} style={{background:"none",border:"none",padding:4,cursor:"pointer"}}><Icon name="x" size={18} color={C.textLight}/></button>}
      </div>
      {!searchOpen && <div onClick={()=>switchView("settings")} style={{width:36,height:36,borderRadius:"50%",background:userColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,flexShrink:0,cursor:"pointer"}}>{userInitial}</div>}
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

      {/* Bulk mode bar for mobile — triggered by long press */}
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
        bulkMode={bulkMode} bulkSelected={bulkSelected}
        onEdit={p=>setEditPlace(p)} onDelete={handleDelete}
        onBulkStart={id=>{setBulkMode(true);setBulkSelected(new Set([id]));}}/>
      : view==="routes" ? <div style={{flex:1,overflowY:"auto",padding:"8px 12px"}}>
        <RouteList routes={routes} onRouteClick={bulkMode ? (r=>toggleBulkItem(r.id)) : handleRouteClick} onDelete={handleDeleteRoute}
          onNew={()=>openRoutePlanner([])} isMobile={true} selectedId={null}
          bulkMode={bulkMode} bulkSelected={bulkSelected}/>
      </div>
      : <SettingsPage isMobile={true} user={user} onLogout={handleLogout} onUserUpdate={u=>setUser(u)}/>}

      {/* FAB — consistent across places and routes */}
      {view==="places" && !bulkMode && <button onClick={()=>setSearchOpen(true)} style={{position:"absolute",bottom:72,right:14,width:56,height:56,borderRadius:16,background:C.blue,color:"#fff",border:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4,boxShadow:"0 2px 8px rgba(26,115,232,0.35)",cursor:"pointer"}}>
        <Icon name="plus" size={22} color="#fff" sw={2.5}/>
      </button>}
      {view==="routes" && !bulkMode && <button onClick={()=>openRoutePlanner([])} style={{position:"absolute",bottom:72,right:14,width:56,height:56,borderRadius:16,background:C.blue,color:"#fff",border:"none",display:"flex",alignItems:"center",justifyContent:"center",zIndex:4,boxShadow:"0 2px 8px rgba(26,115,232,0.35)",cursor:"pointer"}}>
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
      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:20,fontWeight:500,color:C.textMid,flexShrink:0,cursor:"pointer"}} onClick={()=>{switchView("places");clearFilters();}}>
        <Icon name="pin" size={24} color={C.blue} fill="none"/> Travel
      </div>

      <div ref={searchRef} style={{flex:1,position:"relative"}}>
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

      {/* Right group — tabs + avatar with profile popover */}
      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:"auto"}}>
        <div style={{display:"flex",gap:2,background:C.borderLight,borderRadius:8,padding:2}}>
          <button onClick={()=>{switchView("places");clearFilters();}}
            style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:500,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
              background:view==="places"||view==="settings"?"#fff":"transparent",color:view==="places"?C.blue:C.textMid,
              boxShadow:view==="places"?"0 1px 3px rgba(0,0,0,.08)":"none",
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="layers" size={15} sw={1.5} color={view==="places"?C.blue:C.textMid}/> Places
            <span style={{fontSize:11,color:C.textLight,background:view==="places"?C.blueBg:C.surface,padding:"1px 6px",borderRadius:6}}>{places.length}</span>
          </button>
          <button onClick={()=>switchView("routes")}
            style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:500,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
              background:view==="routes"?"#fff":"transparent",color:view==="routes"?C.blue:C.textMid,
              boxShadow:view==="routes"?"0 1px 3px rgba(0,0,0,.08)":"none",
              display:"flex",alignItems:"center",gap:5}}>
            <Icon name="route" size={15} sw={1.5} color={view==="routes"?C.blue:C.textMid}/> Routes
            <span style={{fontSize:11,color:C.textLight,background:view==="routes"?C.blueBg:C.surface,padding:"1px 6px",borderRadius:6}}>{routes.length}</span>
          </button>
        </div>
        <div style={{position:"relative"}}>
          <button onClick={()=>setProfileOpen(!profileOpen)}
            style={{width:34,height:34,borderRadius:"50%",background:userColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,border:profileOpen?`2px solid ${C.blue}`:"2px solid transparent",cursor:"pointer",transition:"border .15s"}}>
            {userInitial}
          </button>
          {profileOpen && <>
            <div onClick={()=>setProfileOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
            <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,zIndex:50,width:260,background:"#fff",borderRadius:12,boxShadow:"0 4px 24px rgba(0,0,0,.15)",border:`1px solid ${C.borderLight}`,overflow:"hidden",animation:"fadeIn .12s"}}>
              {user.email && <div style={{padding:"12px 16px 0",fontSize:12,color:C.textMid,textAlign:"center"}}>{user.email}</div>}
              <div style={{padding:"16px 16px 12px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:userColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:500}}>{userInitial}</div>
                <div style={{fontSize:16,fontWeight:500}}>Hi, {user.display_name||user.username}!</div>
                <button onClick={()=>{setProfileOpen(false);switchView("settings");}}
                  style={{padding:"6px 20px",borderRadius:20,border:`1px solid ${C.border}`,background:"none",fontSize:13,color:C.blue,fontWeight:500,cursor:"pointer",fontFamily:"inherit",marginTop:2}}>
                  Manage account
                </button>
              </div>
              <div style={{borderTop:`1px solid ${C.borderLight}`,display:"flex"}}>
                <button onClick={()=>{setProfileOpen(false);switchView("settings");}}
                  style={{flex:1,padding:"12px 0",background:"none",border:"none",borderRight:`1px solid ${C.borderLight}`,fontSize:13,color:C.textMid,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Icon name="gear" size={15} color={C.textMid}/> Settings
                </button>
                <button onClick={()=>{setProfileOpen(false);handleLogout();}}
                  style={{flex:1,padding:"12px 0",background:"none",border:"none",fontSize:13,color:C.textMid,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Icon name="external" size={15} color={C.textMid}/> Sign out
                </button>
              </div>
            </div>
          </>}
        </div>
      </div>
    </div>

    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      {/* Sidebar — category filters, only shown for places */}
      {view==="places" && <Sidebar places={places} view={view} switchView={switchView}
        expandedIntent={expandedIntent} setExpandedIntent={setExpandedIntent}
        filterIntent={filterIntent} setFilterIntent={setFilterIntent}
        filterCuisine={filterCuisine} setFilterCuisine={setFilterCuisine}
        filterSubType={filterSubType} setFilterSubType={setFilterSubType}
        filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        filterTag={filterTag} setFilterTag={setFilterTag}
        clearFilters={clearFilters} routes={routes}/>}

      {/* Main list */}
      <div style={{width:340,display:"flex",flexDirection:"column",borderRight:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0,gap:6}}>
          <div style={{display:"flex",alignItems:"center",gap:4,fontSize:13,flex:1,color:C.textLight}}>
            {view==="routes" ? <span>All routes · {routes.length}</span>
            : breadcrumbParts.length > 0 ? <>
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
          {!bulkMode && <button onClick={()=>{ view==="routes" ? openRoutePlanner([]) : setSearchOpen(true); }}
            style={{display:"flex",alignItems:"center",gap:5,padding:"6px 14px",borderRadius:16,background:C.blue,color:"#fff",border:"none",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
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
      {view === "settings" ? <SettingsPage isMobile={false} user={user} onLogout={handleLogout} onUserUpdate={u=>setUser(u)}/>
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
