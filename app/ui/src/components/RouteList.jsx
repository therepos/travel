import { C, Icon } from "../shared.jsx";

export default function RouteList({routes, onRouteClick, onDelete, onNew, isMobile, selectedId}) {
  return <>
    {routes.map(r => {
      const stops = r.stop_details || [];
      const isSel = !isMobile && selectedId === r.id;
      return <div key={r.id} onClick={()=>onRouteClick(r)}
        style={{padding:isMobile?"12px 14px":"10px 8px",background:isSel?C.blueBg:C.surface,borderRadius:isMobile?10:8,
          margin:isMobile?"0 0 8px":"0 8px 6px",cursor:"pointer",border:`1px solid ${isSel?C.blue:"transparent"}`,transition:"all .15s"}}>
        <div style={{fontSize:isMobile?14:11,fontWeight:500,marginBottom:3}}>{r.name}</div>
        <div style={{fontSize:isMobile?11:9,color:C.textMid,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>
          <Icon name="pin" size={isMobile?12:10} color={C.textMid} sw={1.5} fill="none"/>
          {stops.length} stops{r.updated ? ` · ${r.updated}` : ""}
        </div>
        <div style={{fontSize:isMobile?11:9,color:C.textMid,lineHeight:1.5}}>
          {stops.map((s,i) => <span key={s.id||i}>{i>0&&<span style={{color:C.border,margin:"0 3px"}}>→</span>}{s.name}</span>)}
        </div>
        {isMobile && r.route_url && <div style={{fontSize:11,color:C.blue,fontWeight:500,marginTop:8,display:"flex",alignItems:"center",gap:4}}>
          <Icon name="external" size={12} color={C.blue}/> Open in Google Maps
        </div>}
      </div>;
    })}
    <button onClick={onNew}
      style={{padding:isMobile?18:14,borderRadius:isMobile?10:8,border:`1.5px dashed ${C.border}`,background:"none",
        width:"100%",margin:isMobile?0:"0 8px",boxSizing:"border-box",
        display:"flex",alignItems:"center",justifyContent:"center",gap:6,
        color:C.blue,fontWeight:500,fontSize:isMobile?13:11,cursor:"pointer",fontFamily:"inherit"}}>
      <Icon name="plus" size={isMobile?16:12} color={C.blue} sw={2}/> Create new route
    </button>
  </>;
}
