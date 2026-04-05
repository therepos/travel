import { useState } from "react";
import { I, ib } from "../shared.jsx";

export default function RoutesTab({routes,onEdit,onDelete,onNew,onRename}) {
  const [searchQ,setSearchQ]=useState("");
  const [editingId,setEditingId]=useState(null);
  const [editName,setEditName]=useState("");
  const filtered=routes.filter(r=>{
    if(!searchQ)return true;
    const q=searchQ.toLowerCase();
    return r.name.toLowerCase().includes(q)||(r.stop_details||[]).some(s=>s.name.toLowerCase().includes(q));
  });
  const startEdit=(e,r)=>{e.stopPropagation();setEditingId(r.id);setEditName(r.name);};
  const saveEdit=async(id)=>{
    if(editName.trim()&&onRename){await onRename(id,editName.trim());}
    setEditingId(null);
  };
  return <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{flexShrink:0,padding:"10px 14px",background:"#FEFDFB",borderBottom:".5px solid #EDE9E3",display:"flex",gap:6}}>
      <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search routes..." style={{flex:1,padding:"11px 14px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:14,outline:"none"}} onFocus={e=>e.target.style.borderColor="#D4A574"} onBlur={e=>e.target.style.borderColor="#E8E3DB"}/>
      <button onClick={onNew} style={{padding:"11px 16px",borderRadius:8,border:"none",background:"#B8602E",color:"#FFF",fontWeight:600,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",gap:4,flexShrink:0}}>{I.plus} New</button>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"8px 14px"}}>
      {filtered.length===0?<div style={{textAlign:"center",padding:"50px 20px",color:"#C4BDB2",fontSize:14}}>{routes.length===0?"No saved routes yet. Create one above!":"No matching routes"}</div>
      :filtered.map(r=><div key={r.id} style={{border:"1px solid #ECE9E3",borderRadius:8,padding:"10px 12px",marginBottom:6,background:"#FFF",cursor:"pointer"}} onClick={()=>{if(editingId!==r.id)onEdit(r);}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6}}>
          <div style={{flex:1,minWidth:0}}>
            {editingId===r.id
              ?<input value={editName} onChange={e=>setEditName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(r.id);if(e.key==="Escape")setEditingId(null);}} onBlur={()=>saveEdit(r.id)} autoFocus onClick={e=>e.stopPropagation()} style={{fontSize:16,fontWeight:500,color:"#2C2A26",border:"1.5px solid #D4A574",borderRadius:5,padding:"3px 8px",outline:"none",width:"100%",boxSizing:"border-box",background:"#FFF"}}/>
              :<div style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{fontSize:16,fontWeight:500,color:"#2C2A26",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.name}</div>
                <button onClick={e=>startEdit(e,r)} style={{background:"none",border:"none",cursor:"pointer",padding:2,color:"#B5AFA5",flexShrink:0,display:"flex"}}>{I.edit}</button>
              </div>}
            <div style={{fontSize:13,color:"#9E978C",marginTop:2}}>{(r.stop_details||[]).length} stops · {r.updated}</div>
          </div>
          <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
            {ib(e=>{e.stopPropagation();if(r.route_url)window.open(r.route_url,"_blank");},I.gmaps)}
            {ib(e=>{e.stopPropagation();onDelete(r.id);},I.trash,"#B04040","#FDF6F6","#E8D4D4")}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center"}}>
          <div style={{display:"flex"}}>{(r.stop_details||[]).slice(0,6).map((s,i)=><div key={s.id} style={{width:32,height:32,borderRadius:5,background:"#F0EDE8",border:"1.5px solid #FFF",marginLeft:i>0?-6:0,overflow:"hidden"}}>{s.photo&&<img src={s.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>)}</div>
          {(r.stop_details||[]).length>6&&<span style={{fontSize:12,color:"#B5AFA5",marginLeft:4}}>+{r.stop_details.length-6}</span>}
          <span style={{marginLeft:"auto",color:"#C4BDB2"}}>{I.chevron}</span>
        </div>
      </div>)}
    </div>
  </div>;
}
