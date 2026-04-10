import { C, I, NAV_H } from "../shared.jsx";

export default function BottomNav({ tab, onTab, captureOpen }) {
  const items = [
    { key:"places", label:"Places", icon:I.navPlaces },
    { key:"routes", label:"Routes", icon:I.navRoutes },
    { key:"add", label:"Add", icon:I.navPlus },
    { key:"search", label:"Search", icon:I.navSearch },
  ];
  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0, zIndex:100,
      display:"flex", alignItems:"flex-end", justifyContent:"space-around",
      padding:"4px 8px 12px", background:C.navBg,
      borderTop:`1px solid ${C.borderLight}`, height:NAV_H,
    }}>
      {items.map(item => {
        const a = item.key==="add" ? captureOpen : tab===item.key;
        return (
          <button key={item.key} onClick={()=>onTab(item.key)} style={{
            display:"flex", flexDirection:"column", alignItems:"center", gap:3,
            background:"none", border:"none", cursor:"pointer",
            padding:"6px 16px", minWidth:60,
            color: a ? C.accent : C.textLight, transition:"color .15s",
          }}>
            {item.icon(a)}
            <span style={{ fontSize:11, fontWeight: a?700:500 }}>{item.label}</span>
            {a && <div style={{ width:4, height:4, borderRadius:"50%", background:C.accent, marginTop:-1 }}/>}
          </button>
        );
      })}
    </div>
  );
}
