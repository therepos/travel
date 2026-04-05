import { useState } from "react";
import { api, TAG_OPTIONS, TAG_COLORS } from "../shared.jsx";

export default function EditModal({place,onClose,onSaved}) {
  const [name,setName]=useState(place.name);
  const [tags,setTags]=useState(place.tags||[]);
  const [notes,setNotes]=useState(place.notes||"");
  const [saving,setSaving]=useState(false);
  const save=async()=>{setSaving(true);try{const u=await api(`/places/${place.id}`,{method:"PUT",body:JSON.stringify({name,tags,notes})});onSaved(u);onClose();}catch(e){console.error(e);}setSaving(false);};
  return <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,.2)",backdropFilter:"blur(4px)",display:"flex",alignItems:"flex-end",justifyContent:"center",animation:"fadeIn .2s"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:"100%",maxWidth:480,background:"#FEFDFB",borderRadius:"20px 20px 0 0",padding:"18px 18px 26px",maxHeight:"75vh",overflowY:"auto",animation:"slideUp .3s cubic-bezier(.4,0,.2,1)",boxShadow:"0 -8px 40px rgba(0,0,0,.1)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:"#DDD8D0",margin:"0 auto 14px"}}/>
      <div style={{fontFamily:"'Instrument Serif',Georgia,serif",fontSize:22,color:"#2C2A26",marginBottom:16}}>Edit place</div>
      <div style={{marginBottom:10}}><div style={{fontSize:12,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:6}}>Name</div>
        <input value={name} onChange={e=>setName(e.target.value)} style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:15,outline:"none",boxSizing:"border-box"}}/></div>
      <div style={{marginBottom:10}}><div style={{fontSize:12,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:6}}>Tags</div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{TAG_OPTIONS.map(t=><button key={t} onClick={()=>setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])} style={{padding:"6px 14px",borderRadius:16,fontSize:13,border:"none",background:tags.includes(t)?`${TAG_COLORS[t]}18`:"#F3F0EB",color:tags.includes(t)?TAG_COLORS[t]:"#A09888",cursor:"pointer",fontWeight:tags.includes(t)?600:400}}>{t}</button>)}</div></div>
      <div style={{marginBottom:14}}><div style={{fontSize:12,color:"#B5AFA5",textTransform:"uppercase",letterSpacing:".8px",fontWeight:600,marginBottom:6}}>Notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Add a note..." style={{width:"100%",padding:"11px 14px",borderRadius:8,border:"1.5px solid #E8E3DB",background:"#FFF",color:"#2C2A26",fontSize:15,outline:"none",resize:"none",boxSizing:"border-box"}}/></div>
      <button onClick={save} disabled={saving} style={{width:"100%",padding:14,borderRadius:10,border:"none",background:"#1B7A5A",color:"#FFF",fontSize:15,fontWeight:600,cursor:"pointer"}}>{saving?"Saving...":"Save changes"}</button>
    </div></div>;
}
