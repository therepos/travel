import { C, Icon } from "../shared.jsx";

export default function RouteDetail({route, onClose, onPlaceClick, onEdit, places}) {
  const stops = (route.stop_details||[]).map(sd => {
    const full = (places||[]).find(p=>p.id===sd.id);
    return full || sd;
  });

  return <div style={{flex:1,minWidth:0,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0}}>
      <button onClick={onClose} style={{background:"none",border:"none",padding:2}}>
        <Icon name="back" size={20} sw={2.5}/>
      </button>
      <div style={{flex:1}}>
        <div style={{fontSize:17,fontWeight:500}}>{route.name}</div>
        <div style={{fontSize:13,color:C.textMid}}>{stops.length} stops{route.created?` · Created ${route.created}`:""}</div>
      </div>
      <button onClick={()=>onEdit?.(route)} style={{background:"none",border:"none",padding:2,color:C.textLight}}>
        <Icon name="dots" size={20}/>
      </button>
    </div>

    {/* Map */}
    <div style={{height:200,background:"#e8eaed",flexShrink:0,position:"relative"}}>
      {stops.length>0 && stops[0].lat && <img src={`/api/staticmap?lat=${stops[0].lat}&lng=${stops[0].lng}&zoom=12&w=600&h=300`}
        alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",color:"#9aa0a6",fontSize:12}}>
        <Icon name="route" size={28} color="#9aa0a6" sw={1.5} fill="none"/><div>Route map</div>
      </div>
    </div>

    {/* Timeline */}
    <div style={{flex:1,overflowY:"auto",padding:"8px 20px"}}>
      {stops.map((s,i) => <div key={s.id||i} style={{display:"flex",gap:12,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:20,flexShrink:0,paddingTop:12}}>
          <div style={{width:12,height:12,borderRadius:"50%",background:i===stops.length-1?C.red:C.blue,flexShrink:0}}/>
          {i<stops.length-1 && <div style={{width:2,background:C.border,flex:1,margin:"4px 0"}}/>}
        </div>
        <div style={{flex:1,padding:"10px 0",borderBottom:i<stops.length-1?`1px solid ${C.borderLight}`:"none",cursor:"pointer"}}
          onClick={()=>onPlaceClick?.(s)}>
          <div style={{fontSize:14,fontWeight:500}}>{s.name}</div>
          <div style={{fontSize:12,color:C.textMid}}>{s.place_type||s.city||""}</div>
          {s.hours && <div style={{fontSize:12,color:C.textMid,marginTop:3}}>{s.hours.split("|")[0]?.trim()}</div>}
        </div>
      </div>)}
    </div>

    {/* Actions */}
    <div style={{display:"flex",gap:10,padding:"12px 20px",borderTop:`1px solid ${C.borderLight}`,flexShrink:0}}>
      <button onClick={()=>onEdit?.(route)}
        style={{flex:1,padding:10,borderRadius:16,fontSize:13,fontWeight:500,border:"none",background:C.blueBg,color:C.blue,cursor:"pointer",fontFamily:"inherit"}}>
        Edit stops
      </button>
      <button onClick={()=>{if(route.route_url)window.open(route.route_url,"_blank");}}
        style={{flex:1,padding:10,borderRadius:16,fontSize:13,fontWeight:500,border:"none",background:C.blue,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
        <Icon name="external" size={14} color="#fff"/> Open in Maps
      </button>
    </div>
  </div>;
}
