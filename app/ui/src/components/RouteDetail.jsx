import { useState } from "react";
import { C, Icon } from "../shared.jsx";

export default function RouteDetail({route, onClose, onPlaceClick, onEdit, onDelete, places, isMobile}) {
  const [menuOpen,setMenuOpen] = useState(false);
  const stops = (route.stop_details||[]).map(sd => {
    const full = (places||[]).find(p=>p.id===sd.id);
    return full || sd;
  });

  const handleDelete = () => {
    setMenuOpen(false);
    if (confirm(`Delete route "${route.name}"?`)) onDelete?.(route.id);
  };

  const handleRename = () => {
    setMenuOpen(false);
    const newName = prompt("Rename route:", route.name);
    if (newName && newName !== route.name) {
      onEdit?.({...route, _rename: newName});
    }
  };

  return <div style={{flex:1,minWidth:0,borderLeft:isMobile?"none":`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",gap:14,padding:isMobile?"16px 20px":"14px 20px",borderBottom:`1px solid ${C.borderLight}`,flexShrink:0,position:"relative"}}>
      <button onClick={onClose} style={{background:"none",border:"none",padding:2,cursor:"pointer",borderRadius:4,transition:"background .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.surface;}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
        <Icon name="back" size={22} sw={2.5}/>
      </button>
      <div style={{flex:1}}>
        <div style={{fontSize:isMobile?20:17,fontWeight:500}}>{route.name}</div>
        <div style={{fontSize:isMobile?14:13,color:C.textMid}}>{stops.length} stops{route.created?` · Created ${route.created}`:""}</div>
      </div>
      <button onClick={()=>setMenuOpen(!menuOpen)}
        style={{background:menuOpen?C.surface:"none",border:"none",padding:6,cursor:"pointer",borderRadius:"50%",width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",transition:"background .15s"}}
        onMouseEnter={e=>{if(!menuOpen)e.currentTarget.style.background=C.surface;}}
        onMouseLeave={e=>{if(!menuOpen)e.currentTarget.style.background="transparent";}}>
        <Icon name="dots" size={22} color={C.textMid}/>
      </button>

      {/* Desktop dropdown menu */}
      {menuOpen && !isMobile && <>
        <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,zIndex:49}}/>
        <div style={{position:"absolute",top:"100%",right:20,zIndex:50,background:"#fff",borderRadius:8,boxShadow:"0 2px 12px rgba(0,0,0,.15)",border:`1px solid ${C.borderLight}`,minWidth:180,overflow:"hidden",animation:"fadeIn .1s"}}>
          <DropItem icon="edit" label="Edit stops" onClick={()=>{setMenuOpen(false);onEdit?.(route);}}/>
          <DropItem icon="external" label="Open in Maps" onClick={()=>{setMenuOpen(false);if(route.route_url)window.open(route.route_url,"_blank");}}/>
          <div style={{height:1,background:C.borderLight,margin:"2px 0"}}/>
          <DropItem icon="trash" label="Delete route" color={C.red} onClick={handleDelete}/>
        </div>
      </>}
    </div>

    {/* Mobile bottom sheet menu */}
    {menuOpen && isMobile && <>
      <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:50,animation:"fadeIn .15s"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderRadius:"16px 16px 0 0",zIndex:51,animation:"slideUp .2s",paddingBottom:20}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"10px auto 6px"}}/>
        <SheetItem icon="edit" label="Edit stops" onClick={()=>{setMenuOpen(false);onEdit?.(route);}}/>
        <SheetItem icon="external" label="Open in Google Maps" onClick={()=>{setMenuOpen(false);if(route.route_url)window.open(route.route_url,"_blank");}}/>
        <SheetItem icon="trash" label="Delete route" color={C.red} onClick={handleDelete}/>
      </div>
    </>}

    {/* Map */}
    <div style={{height:isMobile?220:200,background:"#e8eaed",flexShrink:0,position:"relative"}}>
      {stops.length>0 && stops[0].lat && <img src={`/api/staticmap?lat=${stops[0].lat}&lng=${stops[0].lng}&zoom=12&w=600&h=300`}
        alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",color:"#9aa0a6",fontSize:12}}>
        <Icon name="route" size={28} color="#9aa0a6" sw={1.5} fill="none"/><div>Route map</div>
      </div>
    </div>

    {/* Timeline */}
    <div style={{flex:1,overflowY:"auto",padding:isMobile?"10px 20px":"8px 20px"}}>
      {stops.map((s,i) => <div key={s.id||i} style={{display:"flex",gap:14,alignItems:"stretch"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:22,flexShrink:0,paddingTop:14}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:i===stops.length-1?C.red:C.blue,flexShrink:0}}/>
          {i<stops.length-1 && <div style={{width:2,background:C.border,flex:1,margin:"4px 0"}}/>}
        </div>
        <div style={{flex:1,padding:isMobile?"12px 0":"10px 0",borderBottom:i<stops.length-1?`1px solid ${C.borderLight}`:"none",cursor:"pointer"}}
          onClick={()=>onPlaceClick?.(s)}>
          <div style={{fontSize:isMobile?17:14,fontWeight:isMobile?400:500}}>{s.name}</div>
          <div style={{fontSize:isMobile?14:12,color:C.textMid}}>{s.place_type||s.city||""}</div>
          {s.hours && <div style={{fontSize:isMobile?14:12,color:C.textMid,marginTop:3}}>{s.hours.split("|")[0]?.trim()}</div>}
        </div>
      </div>)}
    </div>

    {/* Actions */}
    <div style={{display:"flex",gap:10,padding:isMobile?"14px 20px":"12px 20px",borderTop:`1px solid ${C.borderLight}`,flexShrink:0}}>
      <button onClick={()=>onEdit?.(route)}
        style={{flex:1,padding:isMobile?12:10,borderRadius:16,fontSize:isMobile?15:13,fontWeight:500,border:"none",background:C.blueBg,color:C.blue,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.blueLight;}}
        onMouseLeave={e=>{e.currentTarget.style.background=C.blueBg;}}>
        Edit stops
      </button>
      <button onClick={()=>{if(route.route_url)window.open(route.route_url,"_blank");}}
        style={{flex:1,padding:isMobile?12:10,borderRadius:16,fontSize:isMobile?15:13,fontWeight:500,border:"none",background:C.blue,color:"#fff",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"background .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#1557b0";}}
        onMouseLeave={e=>{e.currentTarget.style.background=C.blue;}}>
        <Icon name="external" size={isMobile?16:14} color="#fff"/> Open in Maps
      </button>
    </div>

    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
  </div>;
}

function DropItem({icon, label, onClick, color}) {
  return <button onClick={onClick}
    style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 16px",background:"none",border:"none",fontSize:13,
      color:color||C.text,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"background .1s"}}
    onMouseEnter={e=>{e.currentTarget.style.background=C.surface;}}
    onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
    <Icon name={icon} size={16} color={color||C.textMid} sw={1.5}/>{label}
  </button>;
}

function SheetItem({icon, label, onClick, color}) {
  return <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"14px 24px",background:"none",border:"none",fontSize:16,
    color:color||C.text,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
    <Icon name={icon} size={20} color={color||C.textMid}/>{label}
  </button>;
}
