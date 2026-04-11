import { useState } from "react";
import { C, Icon, Stars, Tag, ActionPill, InfoRow } from "../shared.jsx";

export default function MobileDetail({place, onClose, onDelete, onEdit, onRefresh, onShare, editModal}) {
  const [menuOpen,setMenuOpen] = useState(false);
  const [refreshing,setRefreshing] = useState(false);
  const [toast,setToast] = useState(null);
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;

  const doRefresh = async () => {
    setRefreshing(true); setMenuOpen(false);
    try { await onRefresh?.(place.id); setToast({type:"ok",msg:"Updated"}); }
    catch(e) { setToast({type:"err",msg:e.message||"Refresh failed"}); }
    setRefreshing(false);
    setTimeout(()=>setToast(null),3000);
  };

  return <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
    {/* Map header */}
    <div style={{height:220,background:"#e8eaed",position:"relative",flexShrink:0}}>
      <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=600&h=400`} alt=""
        style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>
      <button onClick={onClose} style={{position:"absolute",top:48,left:14,width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="back" size={20} sw={2.5}/>
      </button>
      <button onClick={()=>setMenuOpen(true)} style={{position:"absolute",top:48,right:14,width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="dots" size={18} color={C.text}/>
      </button>
    </div>

    {/* Toast */}
    {toast && <div style={{position:"absolute",top:96,left:"50%",transform:"translateX(-50%)",zIndex:100,
      padding:"8px 16px",borderRadius:20,fontSize:14,fontWeight:500,
      background:toast.type==="ok"?"#e6f4ea":"#fce8e6",color:toast.type==="ok"?"#137333":"#c5221f",
      boxShadow:"0 2px 8px rgba(0,0,0,.12)",animation:"fadeIn .2s"}}>
      {toast.msg}
    </div>}

    {/* Content */}
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px 24px"}}>
      <div style={{fontSize:22,fontWeight:500,marginBottom:3}}>{place.name}</div>
      <div style={{fontSize:15,color:C.textMid,marginBottom:8}}>
        {place.place_type||place.sub_type||""}{place.district?` · ${place.district}`:""}{place.city?`, ${place.city}`:""}
      </div>

      {(place.rating>0||place.price_level) && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
        {place.rating>0 && <><span style={{fontSize:16,fontWeight:500}}>{place.rating}</span>
          <Stars rating={place.rating}/>
          {place.rating_count>0 && <span style={{fontSize:14,color:C.textMid}}>({place.rating_count.toLocaleString()})</span>}
        </>}
        {place.price_level && <span style={{fontSize:15,color:C.textMid,fontWeight:500}}>{place.price_level}</span>}
      </div>}

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <ActionPill icon="pin" label="Directions" onClick={()=>window.open(mapsUrl,"_blank")}/>
        <ActionPill icon="share" label="Share" onClick={()=>onShare?.(place)}/>
        <ActionPill icon="edit" label="Edit" onClick={()=>onEdit?.(place)}/>
        <ActionPill icon="refresh" label={refreshing?"...":"Refresh"} onClick={doRefresh}/>
      </div>

      {/* Tags */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
        {(place.auto_tags||[]).map(t=><Tag key={t} variant="gn">{t}</Tag>)}
        {(place.tags||[]).map(t=><Tag key={t} variant="pp">{t}</Tag>)}
      </div>

      {/* Info rows */}
      {place.hours && <InfoRow icon="clock">
        <div style={{fontSize:15}}>{place.hours.split("|")[0]?.trim()}</div>
      </InfoRow>}
      {place.address && <InfoRow icon="pin">{place.address}</InfoRow>}
      {place.phone && <InfoRow icon="phone">{place.phone}</InfoRow>}
      {place.website && <InfoRow icon="globe">
        <a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:15,wordBreak:"break-all"}}>
          {place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}
        </a>
      </InfoRow>}

      {/* Serves / Dining */}
      {(place.serves||[]).length>0 && <Sec label="Serves">{(place.serves||[]).map(s=><Tag key={s}>{s}</Tag>)}</Sec>}
      {(place.dining||[]).length>0 && <Sec label="Dining">{(place.dining||[]).map(d=><Tag key={d}>{d}</Tag>)}</Sec>}
      {(place.amenities||[]).length>0 && <Sec label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}
      {(place.payment||[]).length>0 && <Sec label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}

      {/* Reviews */}
      {(place.reviews||[]).length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Reviews</div>
        {(place.reviews||[]).map((r,i) => <div key={i} style={{padding:12,background:C.surface,borderRadius:8,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{fontSize:14,fontWeight:500}}>{r.author}</span>
            <div style={{display:"flex",alignItems:"center",gap:3}}>
              <Icon name="star" size={13} color={C.yellow}/><span style={{fontSize:13,color:C.textMid}}>{r.rating}</span>
            </div>
          </div>
          <div style={{fontSize:14,color:C.textMid,lineHeight:1.5}}>{r.text}</div>
          {r.time && <div style={{fontSize:12,color:C.textLight,marginTop:4}}>{r.time}</div>}
        </div>)}
      </div>}

      {/* Editorial */}
      {place.editorial_summary && <div style={{fontSize:14,color:C.textMid,background:C.surface,padding:"12px 16px",borderRadius:8,lineHeight:1.5,fontStyle:"italic",marginTop:12}}>
        "{place.editorial_summary}"
      </div>}

      {/* Notes */}
      {place.notes && <div style={{fontSize:14,color:C.textMid,background:C.surface,padding:"12px 16px",borderRadius:8,lineHeight:1.5,marginTop:10}}>
        <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
      </div>}

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",fontSize:13,color:C.textLight,marginTop:8}}>
        <Icon name="calendar" size={15} color={C.textLight}/> Saved on {place.saved}
      </div>
    </div>

    {/* Bottom sheet menu */}
    {menuOpen && <>
      <div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:50,animation:"fadeIn .15s"}}/>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#fff",borderRadius:"16px 16px 0 0",zIndex:51,animation:"slideUp .2s",paddingBottom:20}}>
        <div style={{width:36,height:4,borderRadius:2,background:C.border,margin:"10px auto 6px"}}/>
        <MenuItem icon="share" label="Share" onClick={()=>{setMenuOpen(false);onShare?.(place);}}/>
        <MenuItem icon="edit" label="Edit tags & notes" onClick={()=>{setMenuOpen(false);onEdit?.(place);}}/>
        <MenuItem icon="refresh" label="Refresh from Google" onClick={doRefresh}/>
        <MenuItem icon="trash" label="Delete" color={C.red} onClick={()=>{setMenuOpen(false);if(confirm(`Delete "${place.name}"?`))onDelete?.(place.id);}}/>
      </div>
    </>}

    {editModal}
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
  </div>;
}

function MenuItem({icon, label, onClick, color}) {
  return <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:14,width:"100%",padding:"14px 24px",background:"none",border:"none",fontSize:16,
    color:color||C.text,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
    <Icon name={icon} size={20} color={color||C.textMid}/>{label}
  </button>;
}

function Sec({label, children}) {
  return <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderLight}`}}>
    <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>{label}</div>
    <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
