import { C, INTENTS, Icon } from "../shared.jsx";

export default function Sidebar({places, view, switchView, expandedIntent, setExpandedIntent,
  filterIntent, setFilterIntent, filterCuisine, setFilterCuisine,
  filterSubType, setFilterSubType, filterRegion, setFilterRegion,
  filterTag, setFilterTag, clearFilters, routes}) {

  const intentCounts = {};
  INTENTS.forEach(i => { intentCounts[i.key] = places.filter(p=>p.intent===i.key).length; });

  const regions = {};
  places.forEach(p => { if(p.region) regions[p.region] = (regions[p.region]||0)+1; });

  const userTags = {};
  places.forEach(p => (p.tags||[]).forEach(t => { userTags[t] = (userTags[t]||0)+1; }));

  const getSubItems = (intentKey) => {
    const subset = places.filter(p=>p.intent===intentKey);
    if (intentKey === "eat") {
      const cuisines = {};
      subset.forEach(p => { if(p.cuisine) cuisines[p.cuisine] = (cuisines[p.cuisine]||0)+1; });
      return Object.entries(cuisines).sort((a,b)=>a[0].localeCompare(b[0]));
    }
    const types = {};
    subset.forEach(p => { if(p.sub_type) types[p.sub_type] = (types[p.sub_type]||0)+1; });
    return Object.entries(types).sort((a,b)=>a[0].localeCompare(b[0]));
  };

  const handleIntentClick = key => {
    if (expandedIntent === key) {
      setExpandedIntent(null); clearFilters();
    } else {
      setExpandedIntent(key);
      setFilterIntent(key); setFilterCuisine(null); setFilterSubType(null);
      setFilterTag(null); setFilterRegion(null);
    }
    switchView("places");
  };

  const handleSubClick = (intentKey, value) => {
    if (intentKey === "eat") {
      setFilterCuisine(filterCuisine===value ? null : value);
    } else {
      setFilterSubType(filterSubType===value ? null : value);
    }
  };

  const S = {item:{display:"flex",alignItems:"center",gap:10,padding:"8px 16px 8px 20px",fontSize:14,color:C.textMid,borderRadius:"0 20px 20px 0",marginRight:8,cursor:"pointer",fontWeight:500,border:"none",background:"none",width:"calc(100% - 8px)",textAlign:"left",fontFamily:"inherit"},
    active:{background:C.blueBg,color:C.blue}};

  return <div style={{width:248,borderRight:`1px solid ${C.borderLight}`,padding:"8px 0",flexShrink:0,overflowY:"auto",display:"flex",flexDirection:"column"}}>
    <div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px",padding:"8px 20px 4px",fontWeight:500}}>Browse</div>

    {INTENTS.map(i => {
      const isExp = expandedIntent === i.key;
      const isActive = filterIntent === i.key;
      const count = intentCounts[i.key] || 0;
      if (count === 0) return null;
      const subs = isExp ? getSubItems(i.key) : [];
      return <div key={i.key}>
        <button onClick={()=>handleIntentClick(i.key)}
          style={{...S.item,...(isActive?S.active:{})}}>
          <Icon name={i.icon} size={20} color={isActive?C.blue:C.textMid} sw={1.5}/>
          {i.label}<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{count}</span>
          <Icon name={isExp?"chevDown":"chevron"} size={18} color={isActive?C.blue:C.textLight} sw={2}/>
        </button>
        {isExp && subs.length > 0 && <>
          <button onClick={()=>{setFilterCuisine(null);setFilterSubType(null);}}
            style={{...S.item,paddingLeft:36,...(!filterCuisine&&!filterSubType?S.active:{})}}>
            All<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{count}</span>
          </button>
          <div style={{height:1,background:C.borderLight,margin:"2px 20px 2px 36px"}}/>
          {subs.map(([label,cnt]) => {
            const subActive = i.key==="eat" ? filterCuisine===label : filterSubType===label;
            return <button key={label} onClick={()=>handleSubClick(i.key,label)}
              style={{...S.item,paddingLeft:36,...(subActive?S.active:{})}}>
              {label}<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{cnt}</span>
            </button>;
          })}
        </>}
      </div>;
    })}

    <div style={{height:1,background:C.borderLight,margin:"6px 20px"}}/>

    <div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px",padding:"8px 20px 4px",fontWeight:500}}>Nav</div>
    <button onClick={()=>{switchView("places");clearFilters();}}
      style={{...S.item,...(view==="places"&&!filterIntent?S.active:{})}}>
      <Icon name="layers" size={20} sw={1.5} color={view==="places"&&!filterIntent?C.blue:C.textMid}
        fill={view==="places"&&!filterIntent?C.blue:"none"}/>
      All places<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{places.length}</span>
    </button>
    <button onClick={()=>switchView("routes")}
      style={{...S.item,...(view==="routes"?S.active:{})}}>
      <Icon name="route" size={20} sw={1.5} color={view==="routes"?C.blue:C.textMid}
        fill={view==="routes"?C.blue:"none"}/>
      Routes<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{routes.length}</span>
    </button>

    {Object.keys(regions).length > 0 && <>
      <div style={{height:1,background:C.borderLight,margin:"6px 20px"}}/>
      <div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px",padding:"8px 20px 4px",fontWeight:500}}>Region</div>
      {Object.entries(regions).sort((a,b)=>b[1]-a[1]).map(([r,n])=>
        <button key={r} onClick={()=>{setFilterRegion(filterRegion===r?null:r);switchView("places");}}
          style={{...S.item,...(filterRegion===r?S.active:{})}}>
          {r}<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{n}</span>
        </button>
      )}
    </>}

    {Object.keys(userTags).length > 0 && <>
      <div style={{height:1,background:C.borderLight,margin:"6px 20px"}}/>
      <div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px",padding:"8px 20px 4px",fontWeight:500}}>Your tags</div>
      {Object.entries(userTags).sort((a,b)=>b[1]-a[1]).map(([t,n])=>
        <button key={t} onClick={()=>{setFilterTag(filterTag===t?null:t);switchView("places");}}
          style={{...S.item,...(filterTag===t?S.active:{})}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:C.purple,flexShrink:0}}/>
          {t}<span style={{marginLeft:"auto",fontSize:12,color:C.textLight}}>{n}</span>
        </button>
      )}
    </>}
  </div>;
}
