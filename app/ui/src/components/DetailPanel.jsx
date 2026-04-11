import { useState, useEffect } from "react";
import { C, Icon, Stars, Tag, ActionPill, InfoRow, api } from "../shared.jsx";

const HIGHLIGHT_COLORS = {
  summary: {bg:"#f0f4ff",color:"#1a56db",border:"#d0daf8"},
  signature: {bg:"#fef7e0",color:"#92610e",border:"#f5e1a4"},
  vibe: {bg:"#e6f4ea",color:"#137333",border:"#b7dfbf"},
  tip: {bg:"#fce8e6",color:"#c5221f",border:"#f5c6c2"},
  serves: {bg:C.borderLight,color:C.textMid,border:C.border},
  dining: {bg:C.borderLight,color:C.textMid,border:C.border},
};

const TRANSIT_ICONS = {MRT:"🚇", Bus:"🚌", Train:"🚆", Transit:"🚏"};

export default function DetailPanel({place, onClose, onDelete, onEdit, onRefresh, onShare}) {
  const [refreshing,setRefreshing] = useState(false);
  const [toast,setToast] = useState(null);
  const [transport,setTransport] = useState(null);
  const [highlights,setHighlights] = useState(null);
  const [loadingExtra,setLoadingExtra] = useState(false);
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
  const allTags = [...(place.tags||[])];
  const autoTags = [...(place.auto_tags||[])];

  useEffect(() => {
    setTransport(null); setHighlights(null);
    if (!place.id) return;
    setLoadingExtra(true);
    Promise.all([
      place.lat && place.lng ? api(`/nearby-transit?lat=${place.lat}&lng=${place.lng}`).catch(()=>null) : null,
      api(`/places/${place.id}/highlights`).catch(()=>null),
    ]).then(([t,h]) => {
      setTransport(t); setHighlights(h?.highlights||[]);
    }).finally(()=>setLoadingExtra(false));
  }, [place.id]);

  const doRefresh = async () => {
    setRefreshing(true);
    try { await onRefresh?.(place.id); setToast({type:"ok",msg:"Updated"}); }
    catch(e) { setToast({type:"err",msg:e.message||"Refresh failed"}); }
    setRefreshing(false);
    setTimeout(()=>setToast(null),3000);
  };

  const summaryHighlight = (highlights||[]).find(h=>h.type==="summary");
  const otherHighlights = (highlights||[]).filter(h=>h.type!=="summary");

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

      {toast && <div style={{padding:"6px 14px",borderRadius:16,fontSize:13,fontWeight:500,marginBottom:10,display:"inline-block",
        background:toast.type==="ok"?"#e6f4ea":"#fce8e6",color:toast.type==="ok"?"#137333":"#c5221f"}}>{toast.msg}</div>}

      {/* Tags */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {place.cuisine && <Tag variant="am">{place.cuisine}</Tag>}
        {autoTags.map(t=><Tag key={t} variant="gn">{t}</Tag>)}
        {allTags.map(t=><Tag key={t} variant="pp">{t}</Tag>)}
      </div>

      {/* Why this place — highlights from reviews */}
      {highlights && highlights.length>0 && <div style={{marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:6}}>Why this place</div>
        {summaryHighlight && <div style={{fontSize:13,color:"#1a56db",lineHeight:1.5,marginBottom:8,fontStyle:"italic",
          padding:"8px 12px",background:"#f0f4ff",borderRadius:8,borderLeft:"3px solid #1a56db"}}>
          {summaryHighlight.text}
        </div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {otherHighlights.map((h,i)=>{
            const c=HIGHLIGHT_COLORS[h.type]||HIGHLIGHT_COLORS.serves;
            return <span key={i} style={{fontSize:12,padding:"4px 10px",borderRadius:6,
              background:c.bg,color:c.color,border:`1px solid ${c.border}`,whiteSpace:"nowrap"}}>
              {h.type==="signature"?"⭐ ":h.type==="tip"?"💡 ":""}{h.text}
            </span>;
          })}
        </div>
      </div>}

      {/* Info rows */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px",alignItems:"start"}}>
        <div>
          {place.hours && <InfoRow icon="clock"><div>{place.hours.split("|")[0]?.trim()}</div></InfoRow>}
          {place.address && <InfoRow icon="pin">{place.address}</InfoRow>}
          {place.phone && <InfoRow icon="phone">{place.phone}</InfoRow>}
          {place.website && <InfoRow icon="globe"><a href={place.website} target="_blank" rel="noopener" style={{color:C.blue,textDecoration:"none",fontSize:14,wordBreak:"break-all"}}>{place.website.replace(/^https?:\/\/(www\.)?/,"").split("/")[0]}</a></InfoRow>}
        </div>
        <div>
          {(place.amenities||[]).length>0 && <Section label="Amenities">{(place.amenities||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.payment||[]).length>0 && <Section label="Payment">{(place.payment||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.dining||[]).length>0 && <Section label="Dining">{(place.dining||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
          {(place.serves||[]).length>0 && <Section label="Serves">{(place.serves||[]).map(a=><Tag key={a}>{a}</Tag>)}</Section>}
        </div>
      </div>

      {/* Getting there — grouped transport */}
      {transport && (transport.groups||[]).length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
        <div style={{fontSize:11,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Getting there</div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min((transport.groups||[]).length,3)},1fr)`,gap:10}}>
          {(transport.groups||[]).map(g=><div key={g.category} style={{background:C.surface,borderRadius:8,padding:"10px 12px"}}>
            <div style={{fontSize:12,fontWeight:500,color:C.text,marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontSize:15}}>{TRANSIT_ICONS[g.category]||"🚏"}</span> {g.category}
            </div>
            {g.stations.map((s,i)=><div key={i} style={{fontSize:12,color:C.textMid,padding:"3px 0",display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:500,color:C.text}}>{s.name}</span>
              <span style={{color:C.textLight,fontSize:11,flexShrink:0,marginLeft:6}}>{s.distance}</span>
            </div>)}
          </div>)}
        </div>
      </div>}
      {loadingExtra && !highlights && <div style={{fontSize:12,color:C.textLight,marginTop:12}}>Loading details...</div>}

      {/* Notes */}
      {place.notes && <div style={{fontSize:13,color:C.textMid,background:C.surface,padding:"10px 14px",borderRadius:8,lineHeight:1.5,marginTop:10}}>
        <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
      </div>}

      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",fontSize:12,color:C.textLight,marginTop:6}}>
        <Icon name="calendar" size={14} color={C.textLight}/> Saved on {place.saved}
      </div>

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
