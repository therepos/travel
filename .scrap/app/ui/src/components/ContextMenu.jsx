import { C, I } from "../shared.jsx";

export default function ContextMenu({ place, onClose, onEdit, onDelete, onShare, onAddToRoute }) {
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,.3)", backdropFilter:"blur(4px)", display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, background:C.surface, borderRadius:"20px 20px 0 0", padding:"8px 6px 24px", animation:"slideUp .25s cubic-bezier(.4,0,.2,1)" }}>
        <div style={{ width:36, height:4, borderRadius:2, background:C.border, margin:"0 auto 10px" }}/>
        <div style={{ padding:"6px 12px 12px 16px", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:10, overflow:"hidden", background:C.card, flexShrink:0 }}>
            {place.photo&&<img src={place.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
          </div>
          <div>
            <div style={{fontSize:16,fontWeight:600,color:C.text}}>{place.name}</div>
            <div style={{fontSize:13,color:C.textMid}}>{place.city||place.country}</div>
          </div>
        </div>
        {[
          {icon:I.edit, label:"Edit", action:()=>{onClose();onEdit?.(place);}},
          {icon:I.route, label:"Add to Route", action:()=>{onClose();onAddToRoute?.(place);}},
          {icon:I.share, label:"Share", action:()=>{onClose();onShare?.(place);}},
          {icon:I.gmaps, label:"Open in Maps", action:()=>{onClose();const url=place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;window.open(url,"_blank");}},
        ].map((item,i)=>(
          <button key={i} onClick={item.action} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 18px", border:"none", background:"transparent", cursor:"pointer", fontSize:15, color:C.text, borderRadius:12, fontFamily:"'DM Sans',sans-serif" }}>
            {item.icon} {item.label}
          </button>
        ))}
        <div style={{height:1,background:C.border,margin:"4px 16px"}}/>
        <button onClick={()=>{onClose();onDelete?.(place.id);}} style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"14px 18px", border:"none", background:"transparent", cursor:"pointer", fontSize:15, color:C.danger, borderRadius:12, fontFamily:"'DM Sans',sans-serif" }}>
          {I.trash} Delete
        </button>
      </div>
    </div>
  );
}
