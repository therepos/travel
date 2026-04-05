import { useState } from "react";
import { I, ib, doShare } from "../shared.jsx";

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
    <div style={{flexShrink:0,padding:"10px 14px",background:"#FEFDFB",borderBottom:".5px solid #EDE9E3",display:"flex",gap:6}}>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search routes..." style={{flex:1,padding:"11px 14px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:14,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/>
      <button onClick={onNew} style={{padding:"11px 16px",borderRadius:8,border:"none",background:"#B8602E",color:"#FFF",fontWeight:600,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>{I.plus} New</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"8px 14px"}} onClick={()=>setMenuId(null)}>
      {filtered.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"#C4BDB2",fontSize:14}}>{routes.length===0?"No saved routes yet. Create one above!":"No matching routes"}</div>
      :filtered.map(r=><div key={r.id} style={{border:"1px solid #ECE9E3",borderRadius:10,padding:"12px 14px",marginBottom:8,background:"#FFF",cursor:"pointer",position:"relative"}} onClick={e=>{if(menuId===r.id){setMenuId(null);return;}onEdit(r);}}>
        {/* Row 1: title + dots */}
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:16,fontWeight:500,color:"#2C2A26",minWidth:0,lineHeight:1.3}}>{r.name}</div>
          <div onClick={e=>{e.stopPropagation();setMenuId(menuId===r.id?null:r.id);}} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,borderRadius:8,color:"#9E978C",marginLeft:8}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </div>
        </div>
        {/* Row 2: stops + date + thumbnails */}
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div>
            <div style={{fontSize:13,color:"#9E978C"}}>{(r.stop_details||[]).length} stops</div>
            <div style={{fontSize:12,color:"#B5AFA5",marginTop:1}}>{r.updated}</div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {(r.stop_details||[]).slice(0,8).map((s,i)=><div key={s.id} style={{width:34,height:34,borderRadius:5,background:"#F0EDE8",overflow:"hidden",flexShrink:0}}>
              {s.photo&&<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
            </div>)}
            {(r.stop_details||[]).length>8&&<div style={{width:34,height:34,borderRadius:5,background:"#F3F0EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#9E978C",flexShrink:0}}>+{(r.stop_details||[]).length-8}</div>}
          </div>
        </div>
        {/* Dropdown menu */}
        {menuId===r.id&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:42,right:14,background:"#FEFDFB",border:"1px solid #EDE9E3",borderRadius:10,padding:4,minWidth:170,zIndex:10,boxShadow:"0 4px 16px rgba(0,0,0,.08)",animation:"fadeIn .15s"}}>
          <div onClick={()=>{setMenuId(null);onEdit(r);}} style={{padding:"9px 12px",borderRadius:7,fontSize:14,color:"#2C2A26",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background="#F3F0EB"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {I.edit} Edit
          </div>
          <div onClick={()=>{setMenuId(null);shareRoute(r);}} style={{padding:"9px 12px",borderRadius:7,fontSize:14,color:"#2C2A26",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background="#F3F0EB"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {I.share} Share
          </div>
          <div onClick={()=>{setMenuId(null);if(r.route_url)window.open(r.route_url,"_blank");}} style={{padding:"9px 12px",borderRadius:7,fontSize:14,color:"#2C2A26",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background="#F3F0EB"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {I.gmaps} Open in Maps
          </div>
          <div style={{height:1,background:"#EDE9E3",margin:"4px 0"}}/>
          <div onClick={()=>{setMenuId(null);onDelete(r.id);}} style={{padding:"9px 12px",borderRadius:7,fontSize:14,color:"#B04040",cursor:"pointer",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background="#FDF6F6"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
            {I.trash} Delete
          </div>
        </div>}
      </div>)}
    </div>
  </div>;
}
