import { C, Icon, Stars, Tag, ActionPill, InfoRow } from "../shared.jsx";

export default function DetailPanel({place, onClose, onDelete, onEdit, onRefresh, onShare}) {
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  const allTags = [...(place.tags||[])];
  const autoTags = [...(place.auto_tags||[])];

  return <div style={{flex:1,overflow:"auto",minWidth:0,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
    {/* Map */}
    <div style={{height:160,background:"#e8eaed",position:"relative",flexShrink:0}}>
      <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=600&h=300`} alt=""
        style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>
      <button onClick={onClose} style={{position:"absolute",top:8,right:8,width:28,height:28,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <Icon name="x" size={14} sw={2.5}/>
      </button>
    </div>

    <div style={{padding:"14px 20px",flex:1}}>
      <div style={{fontSize:18,fontWeight:500,marginBottom:2}}>{place.name}</div>
      <div style={{fontSize:13,color:C.textMid,marginBottom:6}}>
        {place.place_type||place.sub_type||""}{place.district?` · ${place.district}`:""}{place.city?`, ${place.city}`:""}
      </div>

      {(place.rating>0||place.price_level) && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        {place.rating>0 && <><span style={{fontSize:14,fontWeight:500}}>{place.rating}</span>
          <Stars rating={place.rating}/>
          {place.rating_count>0 && <span style={{fontSize:12,color:C.textMid}}>({place.rating_count.toLocaleString()})</span>}
        </>}
        {place.price_level && <span style={{fontSize:13,color:C.textMid,fontWeight:500,marginLeft:4}}>{place.price_level}</span>}
      </div>}

      {/* Actions */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        <ActionPill icon="pin" label="Directions" onClick={()=>window.open(mapsUrl,"_blank")}/>
        <ActionPill icon="share" label="Share" onClick={()=>onShare?.(place)}/>
        <ActionPill icon="edit" label="Edit" onClick={()=>onEdit?.(place)}/>
        <ActionPill icon="refresh" label="Refresh" onClick={()=>onRefresh?.(place.id)}/>
      </div>

      {/* Tags */}
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
        {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
        {autoTags.map(t=><Tag key={t} variant="gn">{t}</Tag>)}
        {allTags.map(t=><Tag key={t} variant="pp">{t}</Tag>)}
      </div>

      {/* Info rows */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div>
          {place.hours && <InfoRow icon="clock">
            <div>{place.hours.split("|")[0]?.trim()}</div>
          </InfoRow>}
          {place.address && <InfoRow icon="pin">{place.address}</InfoRow>}
          {place.phone && <InfoRow icon="phone">{place.phone}</InfoRow>}
          {place.website && <InfoRow icon="globe"><a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:13,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></InfoRow>}
        </div>
        <div>
          {(place.amenities||[]).length>0 && <Section label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.payment||[]).length>0 && <Section label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.dining||[]).length>0 && <Section label="Dining">{(place.dining||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.serves||[]).length>0 && <Section label="Serves">{(place.serves||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
        </div>
      </div>

      {/* Reviews */}
      {(place.reviews||[]).length>0 && <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:9,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Reviews</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {(place.reviews||[]).map((r,i) => <div key={i} style={{padding:8,background:C.surface,borderRadius:6}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
              <span style={{fontSize:11,fontWeight:500}}>{r.author}</span>
              <div style={{display:"flex",alignItems:"center",gap:2}}>
                <Icon name="star" size={9} color={C.yellow}/><span style={{fontSize:10,color:C.textMid}}>{r.rating}</span>
              </div>
            </div>
            <div style={{fontSize:11,color:C.textMid,lineHeight:1.4}}>{r.text}</div>
            {r.time && <div style={{fontSize:9,color:C.textLight,marginTop:2}}>{r.time}</div>}
          </div>)}
        </div>
      </div>}

      {/* Editorial */}
      {place.editorial_summary && <div style={{fontSize:12,color:C.textMid,background:C.surface,padding:"8px 12px",borderRadius:8,lineHeight:1.5,fontStyle:"italic",marginTop:10}}>
        "{place.editorial_summary}"
      </div>}

      {/* Notes */}
      {place.notes && <div style={{fontSize:12,color:C.textMid,background:C.surface,padding:"8px 12px",borderRadius:8,lineHeight:1.4,marginTop:8}}>
        <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
      </div>}

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",fontSize:11,color:C.textLight,marginTop:4}}>
        <Icon name="calendar" size={12} color={C.textLight}/> Saved on {place.saved}
      </div>

      {/* Delete */}
      <button onClick={()=>{if(confirm(`Delete "${place.name}"?`))onDelete?.(place.id);}}
        style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderRadius:8,border:"none",background:"none",color:C.red,fontSize:12,cursor:"pointer",marginTop:4}}>
        <Icon name="trash" size={14} color={C.red}/> Delete place
      </button>
    </div>
  </div>;
}

function Section({label, children}) {
  return <div style={{marginTop:6,paddingTop:6,borderTop:`1px solid ${C.borderLight}`}}>
    <div style={{fontSize:9,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:3}}>{label}</div>
    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
