import { C, Icon, Stars, Tag, ActionPill, InfoRow } from "../shared.jsx";

export default function MobileDetail({place, onClose, onDelete, onEdit, onRefresh, onShare, editModal}) {
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;

  return <div style={{width:"100%",height:"100dvh",fontFamily:"'Google Sans',-apple-system,system-ui,sans-serif",color:C.text,display:"flex",flexDirection:"column",background:C.bg}}>
    {/* Map header */}
    <div style={{height:200,background:"#e8eaed",position:"relative",flexShrink:0}}>
      <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=600&h=400`} alt=""
        style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>
      <button onClick={onClose} style={{position:"absolute",top:48,left:12,width:36,height:36,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="back" size={18} sw={2.5}/>
      </button>
      <button onClick={()=>{}} style={{position:"absolute",top:48,right:12,width:36,height:36,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="dots" size={16} color={C.text}/>
      </button>
    </div>

    {/* Content */}
    <div style={{flex:1,overflowY:"auto",padding:"14px 16px 20px"}}>
      <div style={{fontSize:20,fontWeight:500,marginBottom:2}}>{place.name}</div>
      <div style={{fontSize:13,color:C.textMid,marginBottom:6}}>
        {place.place_type||place.sub_type||""}{place.district?` · ${place.district}`:""}{place.city?`, ${place.city}`:""}
      </div>

      {(place.rating>0||place.price_level) && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        {place.rating>0 && <><span style={{fontSize:14,fontWeight:500}}>{place.rating}</span>
          <Stars rating={place.rating}/>
          {place.rating_count>0 && <span style={{fontSize:12,color:C.textMid}}>({place.rating_count.toLocaleString()})</span>}
        </>}
        {place.price_level && <span style={{fontSize:13,color:C.textMid,fontWeight:500}}>{place.price_level}</span>}
      </div>}

      {/* Actions */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <ActionPill icon="pin" label="Directions" onClick={()=>window.open(mapsUrl,"_blank")}/>
        <ActionPill icon="share" label="Share" onClick={()=>onShare?.(place)}/>
        <ActionPill icon="edit" label="Edit" onClick={()=>onEdit?.(place)}/>
        <ActionPill icon="refresh" label="Refresh" onClick={()=>onRefresh?.(place.id)}/>
      </div>

      {/* Tags */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
        {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
        {(place.auto_tags||[]).map(t=><Tag key={t} variant="gn">{t}</Tag>)}
        {(place.tags||[]).map(t=><Tag key={t} variant="pp">{t}</Tag>)}
      </div>

      {/* Info rows */}
      {place.hours && <InfoRow icon="clock">
        <div>{place.hours.split("|")[0]?.trim()}</div>
      </InfoRow>}
      {place.address && <InfoRow icon="pin">{place.address}</InfoRow>}
      {place.phone && <InfoRow icon="phone">{place.phone}</InfoRow>}
      {place.website && <InfoRow icon="globe">
        <a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:13,wordBreak:"break-all"}}>
          {place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}
        </a>
      </InfoRow>}

      {/* Serves / Dining */}
      {(place.serves||[]).length>0 && <Sec label="Serves">{(place.serves||[]).map(s=><Tag key={s}>{s}</Tag>)}</Sec>}
      {(place.dining||[]).length>0 && <Sec label="Dining">{(place.dining||[]).map(d=><Tag key={d}>{d}</Tag>)}</Sec>}
      {(place.amenities||[]).length>0 && <Sec label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}
      {(place.payment||[]).length>0 && <Sec label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Sec>}

      {/* Reviews */}
      {(place.reviews||[]).length>0 && <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>Reviews</div>
        {(place.reviews||[]).map((r,i) => <div key={i} style={{padding:10,background:C.surface,borderRadius:8,marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:13,fontWeight:500}}>{r.author}</span>
            <div style={{display:"flex",alignItems:"center",gap:2}}>
              <Icon name="star" size={11} color={C.yellow}/><span style={{fontSize:11,color:C.textMid}}>{r.rating}</span>
            </div>
          </div>
          <div style={{fontSize:13,color:C.textMid,lineHeight:1.4}}>{r.text}</div>
          {r.time && <div style={{fontSize:11,color:C.textLight,marginTop:3}}>{r.time}</div>}
        </div>)}
      </div>}

      {/* Editorial */}
      {place.editorial_summary && <div style={{fontSize:13,color:C.textMid,background:C.surface,padding:"10px 14px",borderRadius:8,lineHeight:1.5,fontStyle:"italic",marginTop:10}}>
        "{place.editorial_summary}"
      </div>}

      {/* Notes */}
      {place.notes && <div style={{fontSize:13,color:C.textMid,background:C.surface,padding:"10px 14px",borderRadius:8,lineHeight:1.4,marginTop:8}}>
        <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
      </div>}

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",fontSize:12,color:C.textLight,marginTop:6}}>
        <Icon name="calendar" size={14} color={C.textLight}/> Saved on {place.saved}
      </div>

      <button onClick={()=>{if(confirm(`Delete "${place.name}"?`))onDelete?.(place.id);}}
        style={{display:"flex",alignItems:"center",gap:6,padding:"10px 14px",borderRadius:8,border:"none",background:"none",color:C.red,fontSize:13,cursor:"pointer",marginTop:4,fontFamily:"inherit"}}>
        <Icon name="trash" size={15} color={C.red}/> Delete place
      </button>
    </div>

    {editModal}
  </div>;
}

function Sec({label, children}) {
  return <div style={{marginTop:8,paddingTop:8,borderTop:`1px solid ${C.borderLight}`}}>
    <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{label}</div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
