import { C, Icon, Tag, Stars } from "../shared.jsx";

export default function PlaceList({grouped, filtered, loading, selectedId, onPlaceClick, isMobile, bulkMode, bulkSelected}) {
  if (loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14}}>Loading...</div>;
  if (filtered.length === 0) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14,padding:24,textAlign:"center"}}>No places yet. Tap + to save your first!</div>;

  return <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?130:8}}>
    {Object.entries(grouped).map(([city, places]) => <div key={city}>
      <div style={{padding:isMobile?"16px 16px 4px":"8px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:500,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px"}}>{city}</span>
        <span style={{fontSize:11,color:C.textLight,background:C.borderLight,padding:"1px 6px",borderRadius:8}}>{places.length}</span>
      </div>
      {places.map(p => {
        const isSel = !isMobile && !bulkMode && selectedId === p.id;
        const isBulkSel = bulkMode && bulkSelected?.has(p.id);
        return <div key={p.id} onClick={()=>onPlaceClick(p)}
          style={{display:"flex",alignItems:"center",gap:isMobile?12:12,padding:isMobile?"14px 16px":"10px 16px",
            cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`,
            background:isBulkSel?C.blueBg:isSel?C.blueBg:"transparent",transition:"background .1s"}}
          onMouseEnter={e=>{if(!isSel&&!isBulkSel)e.currentTarget.style.background=C.surface;}}
          onMouseLeave={e=>{if(!isSel&&!isBulkSel)e.currentTarget.style.background="transparent";}}>
          {bulkMode && <div style={{width:22,height:22,borderRadius:4,border:`2px solid ${isBulkSel?C.blue:C.border}`,
            background:isBulkSel?C.blue:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
            {isBulkSel && <Icon name="check" size={14} color="#fff" sw={2.5}/>}
          </div>}
          <div style={{width:isMobile?72:48,height:isMobile?72:48,borderRadius:isMobile?12:8,flexShrink:0,background:C.border,overflow:"hidden"}}>
            {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:isMobile?17:14,fontWeight:isMobile?400:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:isMobile?14:12,color:C.textMid,marginTop:isMobile?3:2}}>{p.place_type||p.sub_type||p.cuisine||""}{p.district?` · ${p.district}`:""}</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:isMobile?4:3,flexWrap:"wrap"}}>
              {p.rating>0 && <div style={{display:"flex",alignItems:"center",gap:3,fontSize:isMobile?13:12,color:C.textMid}}>
                <Icon name="star" size={isMobile?13:12} color={C.yellow}/>{p.rating}
              </div>}
              {p.cuisine && <Tag variant="am">{p.cuisine}</Tag>}
              {p.price_level && <Tag>{p.price_level}</Tag>}
              {(p.tags||[]).slice(0,1).map(t=><Tag key={t} variant="pp">{t}</Tag>)}
            </div>
          </div>
          {isMobile && !bulkMode && <Icon name="chevron" size={16} color={C.border}/>}
        </div>;
      })}
    </div>)}
  </div>;
}
