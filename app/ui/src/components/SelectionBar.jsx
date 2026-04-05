import { C, I } from "../shared.jsx";

export default function SelectionBar({ count, onAddToRoute, onExport, onDelete, onCancel }) {
  return (
    <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:900, background:C.card, padding:"12px 16px 18px", borderRadius:"18px 18px 0 0", animation:"slideUp .25s cubic-bezier(.4,0,.2,1)", display:"flex", alignItems:"center", gap:8 }}>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:600,color:C.textOnDark}}>{count} selected</div>
      </div>
      {[
        {icon:I.route, label:"Route", action:onAddToRoute, bg:C.success},
        {icon:I.exportIcon, label:"Export", action:onExport, bg:C.accent},
        {icon:I.trash, label:"Delete", action:onDelete, bg:C.danger},
      ].map((item,i)=>(
        <button key={i} onClick={item.action} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 14px", borderRadius:12, border:"none", background:`${item.bg}20`, color:item.bg, cursor:"pointer" }}>
          {item.icon}<span style={{fontSize:10,fontWeight:700}}>{item.label}</span>
        </button>
      ))}
      <button onClick={onCancel} style={{ padding:"8px 14px", borderRadius:12, border:`1px solid ${C.cardLight}`, background:"transparent", color:C.textOnDarkMid, cursor:"pointer", fontSize:10, fontWeight:700, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
        {I.x}<span>Cancel</span>
      </button>
    </div>
  );
}
