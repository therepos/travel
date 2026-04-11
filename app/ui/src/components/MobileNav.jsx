import { C, Icon } from "../shared.jsx";

export default function MobileNav({view, onNav}) {
  const items = [
    {id:"places", icon:"layers", label:"Places"},
    {id:"routes", icon:"route", label:"Routes"},
    {id:"settings", icon:"gear", label:"Settings"},
  ];

  return <div style={{height:62,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-around",flexShrink:0,background:"#fff",paddingBottom:8}}>
    {items.map(n => {
      const active = view === n.id;
      return <button key={n.id} onClick={()=>onNav(n.id)}
        style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:12,
          color:active?C.blue:C.textLight,fontWeight:500,background:"none",border:"none",
          padding:"4px 16px",cursor:"pointer",fontFamily:"inherit"}}>
        <div style={{width:48,height:24,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
          background:active?C.blueBg:"transparent"}}>
          <Icon name={n.icon} size={18} color={active?C.blue:C.textLight} sw={1.8}
            fill={active?C.blue:"none"}/>
        </div>
        {n.label}
      </button>;
    })}
  </div>;
}
