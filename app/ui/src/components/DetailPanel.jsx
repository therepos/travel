import { useState, useEffect } from "react";
import { C, Icon, Stars, Tag, ActionPill, InfoRow, api } from "../shared.jsx";

export default function DetailPanel({place, onClose, onDelete, onEdit, onRefresh, onShare}) {
  const [refreshing,setRefreshing] = useState(false);
  const [toast,setToast] = useState(null);
  const [transport,setTransport] = useState(null);
  const [loadingTransport,setLoadingTransport] = useState(false);
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  const allTags = [...(place.tags||[])];
  const autoTags = [...(place.auto_tags||[])];

  // Build "Known for" from available data
  const popular = [];
  if (place.editorial_summary) popular.push(place.editorial_summary);
  (place.serves||[]).forEach(s => popular.push(s));
  (place.dining||[]).filter(d => d !== "dine-in").forEach(d => popular.push(d));
  if ((place.amenities||[]).includes("good for kids")) popular.push("family-friendly");
  if ((place.amenities||[]).includes("live music")) popular.push("live music");
  if ((place.amenities||[]).includes("sports viewing")) popular.push("sports viewing");
  if ((place.amenities||[]).includes("dogs allowed")) popular.push("pet-friendly");
  if ((place.amenities||[]).includes("parking")) popular.push("parking available");

  // Fetch nearby transit
  useEffect(() => {
    setTransport(null);
    if (place.lat && place.lng) {
      setLoadingTransport(true);
      api(`/nearby-transit?lat=${place.lat}&lng=${place.lng}`)
        .then(d => setTransport(d))
        .catch(() => setTransport(null))
        .finally(() => setLoadingTransport(false));
    }
  }, [place.id]);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh?.(place.id); setToast({type:"ok",msg:"Updated"}); }
    catch(e) { setToast({type:"err",msg:e.message||"Refresh failed"}); }
    setRefreshing(false);
    setTimeout(()=>setToast(null),3000);
  };

  return <div style={{flex:1,overflow:"auto",minWidth:0,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column"}}>
    {/* Map */}
    <div style={{height:200,background:"#e8eaed",position:"relative",flexShrink:0}}>
      <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=600&h=300`} alt=""
        style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>
      <button onClick={onClose} style={{position:"absolute",top:10,right:10,width:32,height:32,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,.15)",transition:"background .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background=C.surface;}}
        onMouseLeave={e=>{e.currentTarget.style.background="#fff";}}>
        <Icon name="x" size={16} sw={2.5}/>
      </button>
    </div>

    <div style={{padding:"16px 24px",flex:1}}>
      <div style={{fontSize:20,fontWeight:500,marginBottom:3}}>{place.name}</div>
      <div style={{fontSize:14,color:C.textMid,marginBottom:8}}>
        {place.place_type||place.sub_type||""}{place.district?` · ${place.district}`:""}{place.city?`, ${place.city}`:""}
      </div>

      {(place.rating>0||place.price_level) && <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12}}>
        {place.rating>0 && <><span style={{fontSize:15,fontWeight:500}}>{place.rating}</span>
          <Stars rating={place.rating}/>
          {place.rating_count>0 && <span style={{fontSize:13,color:C.textMid}}>({place.rating_count.toLocaleString()})</span>}
        </>}
        {place.price_level && <span style={{fontSize:14,color:C.textMid,fontWeight:500,marginLeft:4}}>{place.price_level}</span>}
      </div>}

      {/* Actions */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <ActionPill icon="pin" label="Directions" onClick={()=>window.open(mapsUrl,"_blank")}/>
        <ActionPill icon="share" label="Share" onClick={()=>onShare?.(place)}/>
        <ActionPill icon="edit" label="Edit" onClick={()=>onEdit?.(place)}/>
        <ActionPill icon="refresh" label="Refresh" onClick={doRefresh} disabled={refreshing}/>
      </div>

      {/* Toast */}
      {toast && <div style={{padding:"6px 14px",borderRadius:16,fontSize:13,fontWeight:500,marginBottom:10,display:"inline-block",
        background:toast.type==="ok"?"#e6f4ea":"#fce8e6",color:toast.type==="ok"?"#137333":"#c5221f"}}>
        {toast.msg}
      </div>}

      {/* Tags */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
        {autoTags.map(t=><Tag key={t} variant="gn">{t}</Tag>)}
        {allTags.map(t=><Tag key={t} variant="pp">{t}</Tag>)}
      </div>

      {/* Info rows - fixed 2-column grid with aligned tops */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",alignItems:"start"}}>
        <div>
          {place.hours && <InfoRow icon="clock">
            <div>{place.hours.split("|")[0]?.trim()}</div>
          </InfoRow>}
          {place.address && <InfoRow icon="pin">{place.address}</InfoRow>}
          {place.phone && <InfoRow icon="phone">{place.phone}</InfoRow>}
          {place.website && <InfoRow icon="globe"><a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:14,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></InfoRow>}
        </div>
        <div style={{paddingTop:0}}>
          {(place.amenities||[]).length>0 && <Section label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.payment||[]).length>0 && <Section label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.dining||[]).length>0 && <Section label="Dining">{(place.dining||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.serves||[]).length>0 && <Section label="Serves">{(place.serves||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
        </div>
      </div>

      {/* Known for — replaces Reviews */}
      {popular.length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>Known for</div>
        {place.editorial_summary && <div style={{fontSize:13,color:C.textMid,lineHeight:1.5,marginBottom:8,fontStyle:"italic"}}>
          "{place.editorial_summary}"
        </div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {popular.filter(p=>p!==place.editorial_summary).map((p,i)=><Tag key={i} variant="bl">{p}</Tag>)}
        </div>
      </div>}

      {/* Nearby Transport */}
      {(transport && (transport.stations||[]).length > 0) && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>Nearby Transport</div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {(transport.stations||[]).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.textMid,padding:"4px 0"}}>
            <Icon name="transit" size={15} color={C.textMid} sw={1.5}/>
            <span style={{fontWeight:500,color:C.text}}>{s.name}</span>
            <span style={{fontSize:12,color:C.textLight}}>· {s.distance}</span>
            {s.type && <Tag>{s.type}</Tag>}
          </div>)}
        </div>
      </div>}
      {loadingTransport && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`,fontSize:12,color:C.textLight}}>Loading transport info...</div>}

      {/* Notes */}
      {place.notes && <div style={{fontSize:13,color:C.textMid,background:C.surface,padding:"10px 14px",borderRadius:8,lineHeight:1.5,marginTop:10}}>
        <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
      </div>}

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",fontSize:12,color:C.textLight,marginTop:6}}>
        <Icon name="calendar" size={14} color={C.textLight}/> Saved on {place.saved}
      </div>

      {/* Delete */}
      <button onClick={()=>{if(confirm(`Delete "${place.name}"?`))onDelete?.(place.id);}}
        style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,border:"none",background:"none",color:C.red,fontSize:13,cursor:"pointer",marginTop:4,transition:"background .15s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#fce8e6";}}
        onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
        <Icon name="trash" size={16} color={C.red}/> Delete place
      </button>
    </div>
  </div>;
}

function Section({label, children}) {
  return <div style={{paddingTop:10,paddingBottom:2,borderTop:`1px solid ${C.borderLight}`}}>
    <div style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>{label}</div>
    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{children}</div>
  </div>;
}
