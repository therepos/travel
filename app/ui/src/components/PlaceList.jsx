import { C, Icon, Tag, Stars } from "../shared.jsx";

export default function PlaceList({grouped, filtered, loading, selectedId, onPlaceClick, isMobile}) {
  if (loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14}}>Loading...</div>;
  if (filtered.length === 0) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14,padding:24,textAlign:"center"}}>No places yet. Tap + to save your first!</div>;

  return <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?120:8}}>
    {Object.entries(grouped).map(([city, places]) => <div key={city}>
      <div style={{padding:isMobile?"10px 12px 3px":"8px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:isMobile?11:11,fontWeight:500,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px"}}>{city}</span>
        <span style={{fontSize:isMobile?10:11,color:C.textLight,background:C.borderLight,padding:"1px 6px",borderRadius:8}}>{places.length}</span>
      </div>
      {places.map(p => {
        const isSel = !isMobile && selectedId === p.id;
        return <div key={p.id} onClick={()=>onPlaceClick(p)}
          style={{display:"flex",alignItems:"center",gap:isMobile?10:12,padding:isMobile?"10px 12px":"10px 16px",
            cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`,
            background:isSel?C.blueBg:"transparent",transition:"background .1s"}}
          onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=C.surface;}}
          onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
          {/* Thumbnail */}
          <div style={{width:isMobile?48:48,height:isMobile?48:48,borderRadius:isMobile?8:8,flexShrink:0,background:C.border,overflow:"hidden"}}>
            {p.photo && <img src={p.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>}
          </div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:isMobile?14:14,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
            <div style={{fontSize:isMobile?12:12,color:C.textMid,marginTop:2}}>{p.place_type||p.sub_type||p.cuisine||""}{p.district?` · ${p.district}`:""}</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:3,flexWrap:"wrap"}}>
              {p.rating>0 && <div style={{display:"flex",alignItems:"center",gap:2,fontSize:isMobile?11:12,color:C.textMid}}>
                <Icon name="star" size={isMobile?11:12} color={C.yellow}/>{p.rating}
              </div>}
              {p.cuisine && <Tag variant="am">{p.cuisine}</Tag>}
              {p.price_level && <Tag>{p.price_level}</Tag>}
              {(p.tags||[]).slice(0,1).map(t=><Tag key={t} variant="pp">{t}</Tag>)}
            </div>
          </div>
          {isMobile && <Icon name="chevron" size={14} color={C.border}/>}
        </div>;
      })}
    </div>)}
  </div>;
}
