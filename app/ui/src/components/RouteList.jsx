import { C, Icon } from "../shared.jsx";

export default function RouteList({routes, onRouteClick, onDelete, onNew, isMobile, selectedId, bulkMode, bulkSelected}) {
  return <>
    {routes.map(r => {
      const stops = r.stop_details || [];
      const isSel = !isMobile && !bulkMode && selectedId === r.id;
      const isBulkSel = bulkMode && bulkSelected?.has(r.id);
      return <div key={r.id} onClick={()=>onRouteClick(r)}
        style={{padding:isMobile?"16px 18px":"12px 12px",background:isBulkSel?C.blueBg:isSel?C.blueBg:C.surface,borderRadius:isMobile?12:8,
          margin:isMobile?"0 0 10px":"0 10px 8px",cursor:"pointer",border:`1px solid ${isBulkSel?C.blue:isSel?C.blue:"transparent"}`,transition:"all .15s",
          display:"flex",gap:10,alignItems:"flex-start"}}>
        {bulkMode && <div style={{width:22,height:22,borderRadius:4,border:`2px solid ${isBulkSel?C.blue:C.border}`,
          background:isBulkSel?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,transition:"all .15s"}}>
          {isBulkSel && <Icon name="check" size={14} color="#fff" sw={2.5}/>}
        </div>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:isMobile?17:14,fontWeight:isMobile?400:500,marginBottom:5}}>{r.name}</div>
          <div style={{fontSize:isMobile?14:12,color:C.textMid,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="pin" size={isMobile?15:14} color={C.textMid} sw={1.5} fill="none"/>
            {stops.length} stops{r.updated ? ` · ${r.updated}` : ""}
          </div>
          <div style={{fontSize:isMobile?14:12,color:C.textMid,lineHeight:1.6}}>
            {stops.map((s,i) => <span key={s.id||i}>{i>0&&<span style={{color:C.border,margin:"0 4px"}}>→</span>}{s.name}</span>)}
          </div>
          {isMobile && r.route_url && <div style={{fontSize:14,color:C.blue,fontWeight:500,marginTop:10,display:"flex",alignItems:"center",gap:6}}>
            <Icon name="external" size={15} color={C.blue}/> Open in Google Maps
          </div>}
        </div>
      </div>;
    })}
    {!bulkMode && <button onClick={onNew}
      style={{padding:isMobile?20:16,borderRadius:isMobile?12:8,border:`1.5px dashed ${C.border}`,background:"none",
        width:"100%",margin:isMobile?0:"0 10px",boxSizing:"border-box",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,
        color:C.blue,fontWeight:500,fontSize:isMobile?15:13,cursor:"pointer",fontFamily:"inherit"}}>
      <Icon name="plus" size={isMobile?18:16} color={C.blue} sw={2}/> Create new route
    </button>}
  </>;
}
