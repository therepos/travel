import { useState } from "react";
import { C, I, doShare } from "../shared.jsx";

export default function RoutesTab({routes,onEdit,onDelete,onNew}) {
  const [searchQ,setSearchQ]=useState("");
  const [menuId,setMenuId]=useState(null);
  const filtered=routes.filter(r=>{
    if(!searchQ)return true;
    const q=searchQ.toLowerCase();
    return r.name.toLowerCase().includes(q)||(r.stop_details||[]).some(s=>s.name.toLowerCase().includes(q));
  });

  const shareRoute=(r)=>{
    const stops=(r.stop_details||[]).map(s=>s.name).join(" → ");
    const text=`${r.name}\n${stops}`;
    const url=r.route_url||"";
    if(navigator.share){try{navigator.share({title:r.name,text,url});}catch(e){}}
    else{try{navigator.clipboard.writeText(`${text}\n${url}`);}catch(e){}}
  };

  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    {/* Search only — no New button, nav + handles it */}
    <div style={{flexShrink:0,padding:"6px 14px 6px",display:"flex",gap:6}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"11px 14px",borderRadius:12,background:C.surface,border:`1.5px solid ${C.borderLight}`}}>
        <span style={{color:C.textLight,flexShrink:0}}>{I.search}</span>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search routes..." style={{flex:1,border:"none",background:"transparent",color:C.text,fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"4px 14px"}} onClick={()=>setMenuId(null)}>
      {filtered.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:C.textLight,fontSize:14}}>{routes.length===0?"No saved routes yet. Tap + to create one!":"No matching routes"}</div>
      :filtered.map(r=><div key={r.id} style={{border:`1.5px solid ${C.borderLight}`,borderRadius:14,padding:"12px 14px",marginBottom:8,background:C.surface,cursor:"pointer",position:"relative"}} onClick={e=>{if(menuId===r.id){setMenuId(null);return;}onEdit(r);}}>
        {/* Row 1: title + dots */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:18,fontWeight:400,color:C.text,minWidth:0,lineHeight:1.3}}>{r.name}</div>
          <div onClick={e=>{e.stopPropagation();setMenuId(menuId===r.id?null:r.id);}} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,borderRadius:8,color:C.textLight,marginLeft:8}}>{I.dots}</div>
        </div>
        {/* Row 2: stops + thumbnails */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div>
            <div style={{fontSize:13,color:C.textMid}}>{(r.stop_details||[]).length} stops</div>
            <div style={{fontSize:12,color:C.textLight,marginTop:1}}>{r.updated}</div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {(r.stop_details||[]).slice(0,8).map((s)=><div key={s.id} style={{width:34,height:34,borderRadius:8,background:C.card,overflow:"hidden",flexShrink:0}}>
              {s.photo&&<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>)}
            {(r.stop_details||[]).length>8&&<div style={{width:34,height:34,borderRadius:8,background:C.borderLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:C.textLight,flexShrink:0}}>+{(r.stop_details||[]).length-8}</div>}
          </div>
        </div>
        {/* Dropdown menu */}
        {menuId===r.id&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:42,right:14,background:C.surface,border:`1px solid ${C.borderLight}`,borderRadius:12,padding:4,minWidth:170,zIndex:10,boxShadow:"0 4px 16px rgba(0,0,0,.08)",animation:"fadeIn .15s"}}>
          <div onClick={()=>{setMenuId(null);onEdit(r);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.edit} Edit</div>
          <div onClick={()=>{setMenuId(null);shareRoute(r);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.share} Share</div>
          <div onClick={()=>{setMenuId(null);if(r.route_url)window.open(r.route_url,"_blank");}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.gmaps} Open in Maps</div>
          <div style={{height:1,background:C.borderLight,margin:"4px 0"}}/>
          <div onClick={()=>{setMenuId(null);onDelete(r.id);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.danger,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.trash} Delete</div>
        </div>}
      </div>)}
    </div>
  </div>;
}
