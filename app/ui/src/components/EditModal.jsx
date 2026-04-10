import { useState } from "react";
import { api, C, TAG_PRESETS, Icon } from "../shared.jsx";

export default function EditModal({place, onClose, onSaved}) {
  const [name,setName] = useState(place.name);
  const [tags,setTags] = useState(place.tags||[]);
  const [notes,setNotes] = useState(place.notes||"");
  const [saving,setSaving] = useState(false);
  const [newTag,setNewTag] = useState("");

  const toggleTag = t => setTags(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t]);
  const addNew = () => { if(newTag.trim()&&!tags.includes(newTag.trim())){setTags(p=>[...p,newTag.trim()]);} setNewTag(""); };

  const save = async () => {
    setSaving(true);
    try { const u = await api(`/places/${place.id}`,{method:"PUT",body:JSON.stringify({name,tags,notes})}); onSaved(u); }
    catch(e) { console.error(e); }
    setSaving(false);
  };

  return <div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,.3)",display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s"}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div style={{width:"min(92vw,400px)",background:"#fff",borderRadius:16,padding:20,maxHeight:"80vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:16,fontWeight:500,marginBottom:14}}>Edit place</div>

      <label style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px"}}>Name</label>
      <input value={name} onChange={e=>setName(e.target.value)}
        style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:14,outline:"none",marginTop:4,marginBottom:12,boxSizing:"border-box",fontFamily:"inherit",color:C.text}}/>

      <label style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px"}}>Tags</label>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:6,marginBottom:4}}>
        {[...new Set([...TAG_PRESETS,...tags])].map(t =>
          <button key={t} onClick={()=>toggleTag(t)}
            style={{padding:"5px 12px",borderRadius:14,fontSize:12,border:`1px solid ${tags.includes(t)?C.purpleBg:C.border}`,
              background:tags.includes(t)?C.purpleBg:"#fff",color:tags.includes(t)?C.purple:C.textMid,cursor:"pointer",fontFamily:"inherit"}}>
            {t}
          </button>
        )}
        <div style={{display:"flex",gap:2}}>
          <input value={newTag} onChange={e=>setNewTag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addNew()}
            placeholder="+ new tag" style={{width:90,padding:"5px 10px",borderRadius:14,border:`1px solid ${C.border}`,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        </div>
      </div>

      <label style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",display:"block",marginTop:12}}>Notes</label>
      <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} placeholder="Add a note..."
        style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:14,outline:"none",resize:"none",marginTop:4,boxSizing:"border-box",fontFamily:"inherit",color:C.text}}/>

      <button onClick={save} disabled={saving}
        style={{width:"100%",padding:12,borderRadius:10,border:"none",background:C.blue,color:"#fff",fontSize:14,fontWeight:500,cursor:"pointer",marginTop:14,fontFamily:"inherit"}}>
        {saving?"Saving...":"Save changes"}
      </button>
    </div>
  </div>;
}
