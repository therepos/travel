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
    {/* Search */}
    <div style={{flexShrink:0,padding:"6px 14px 6px",display:"flex",gap:6}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:8,padding:"11px 14px",borderRadius:12,background:C.surface,border:`1.5px solid ${C.borderLight}`}}>
        <span style={{color:C.textLight,flexShrink:0}}>{I.search}</span>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search routes..." style={{flex:1,border:"none",background:"transparent",color:C.text,fontSize:14,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"4px 14px"}} onClick={()=>setMenuId(null)}>
      {filtered.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:C.textLight,fontSize:14}}>{routes.length===0?"No saved routes yet. Tap + to create one!":"No matching routes"}</div>
      :filtered.map(r=>{
        const stops=r.stop_details||[];
        const legs=r.legs||[];
        return <div key={r.id} style={{background:C.surface,borderRadius:18,border:`1.5px solid ${C.borderLight}`,padding:"16px 14px",marginBottom:10,position:"relative"}}>
          {/* Header: title + dots */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:stops.length>0?14:0}}>
            <div style={{cursor:"pointer"}} onClick={e=>{if(menuId===r.id)return;onEdit(r);}}>
              <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:20,color:C.text,lineHeight:1.2}}>{r.name}</div>
              <div style={{fontSize:13,color:C.textLight,marginTop:3,display:"flex",alignItems:"center",gap:6}}>
                <span>{stops.length} stops</span>
                <span style={{color:C.border}}>·</span>
                <span>{r.updated}</span>
              </div>
            </div>
            <div onClick={e=>{e.stopPropagation();setMenuId(menuId===r.id?null:r.id);}} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,borderRadius:8,color:C.textLight}}>{I.dots}</div>
          </div>

          {/* Timeline */}
          {stops.length>0&&<div style={{position:"relative",paddingLeft:22}}>
            {/* Vertical line */}
            <div style={{position:"absolute",left:7,top:8,bottom:8,width:2,background:`linear-gradient(to bottom, ${C.accent}, ${C.border})`,borderRadius:1}}/>
            {stops.map((s,i)=><div key={s.id}>
              {/* Stop */}
              <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
                {/* Timeline dot */}
                <div style={{position:"absolute",left:-20,top:"50%",transform:"translateY(-50%)",width:12,height:12,borderRadius:"50%",background:i===0?C.accent:C.surface,border:`2.5px solid ${C.accent}`,zIndex:2}}/>
                {/* Stop card */}
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1,padding:"8px 10px",borderRadius:10,background:i===0?C.accentLight:C.bg,border:`1px solid ${i===0?C.accentBorder:"transparent"}`}}>
                  <div style={{width:40,height:40,borderRadius:8,overflow:"hidden",flexShrink:0,background:C.card}}>
                    {s.photo&&<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                    <div style={{fontSize:12,color:C.textLight}}>{s.city||s.country}</div>
                  </div>
                  <div style={{width:24,height:24,borderRadius:7,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",color:C.textOnDark,fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                </div>
              </div>
              {/* Leg info */}
              {i<stops.length-1&&legs[i]&&<div style={{display:"flex",alignItems:"center",padding:"8px 0 8px 8px"}}>
                <div style={{fontSize:12,color:C.textLight,display:"flex",alignItems:"center",gap:5,fontWeight:500,background:C.surface,padding:"2px 8px",borderRadius:6,border:`1px dashed ${C.border}`}}>
                  <span style={{color:C.text,fontWeight:600}}>{legs[i].duration}</span>
                  <span style={{color:C.border}}>·</span>
                  <span>{legs[i].distance}</span>
                </div>
              </div>}
            </div>)}
          </div>}

          {/* Open in Maps + share */}
          {stops.length>0&&<div style={{marginTop:12,display:"flex",gap:8}}>
            <button onClick={e=>{e.stopPropagation();if(r.route_url)window.open(r.route_url,"_blank");}} style={{flex:1,padding:"10px 0",borderRadius:10,border:"none",background:C.card,color:C.textOnDark,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{I.gmaps} Open in Google Maps</button>
            <button onClick={e=>{e.stopPropagation();shareRoute(r);}} style={{width:42,height:42,borderRadius:10,border:`1.5px solid ${C.border}`,background:C.surface,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.textMid}}>{I.share}</button>
          </div>}

          {/* Dropdown menu */}
          {menuId===r.id&&<div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:42,right:14,background:C.surface,border:`1px solid ${C.borderLight}`,borderRadius:12,padding:4,minWidth:170,zIndex:10,boxShadow:"0 4px 16px rgba(0,0,0,.08)",animation:"fadeIn .15s"}}>
            <div onClick={()=>{setMenuId(null);onEdit(r);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.edit} Edit</div>
            <div onClick={()=>{setMenuId(null);shareRoute(r);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.share} Share</div>
            <div onClick={()=>{setMenuId(null);if(r.route_url)window.open(r.route_url,"_blank");}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.text,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.gmaps} Open in Maps</div>
            <div style={{height:1,background:C.borderLight,margin:"4px 0"}}/>
            <div onClick={()=>{setMenuId(null);onDelete(r.id);}} style={{padding:"9px 12px",borderRadius:8,fontSize:14,color:C.danger,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>{I.trash} Delete</div>
          </div>}
        </div>;
      })}
    </div>
  </div>;
}
