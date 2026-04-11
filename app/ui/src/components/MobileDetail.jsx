import { useState, useEffect } from "react";
import { C, Icon, Stars, Tag, ActionPill, InfoRow, api } from "../shared.jsx";

export default function MobileDetail({place, onClose, onDelete, onEdit, onRefresh, onShare, editModal}) {
  const [menuOpen,setMenuOpen] = useState(false);
  const [refreshing,setRefreshing] = useState(false);
  const [toast,setToast] = useState(null);
  const [transport,setTransport] = useState(null);
  const [loadingTransport,setLoadingTransport] = useState(false);
  const mapsUrl = place.google_maps_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;

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
    setRefreshing(true); setMenuOpen(false);
    try { await onRefresh?.(place.id); setToast({type:"ok",msg:"Updated"}); }
    catch(e) { setToast({type:"err",msg:e.message||"Refresh failed"}); }
    setRefreshing(false);
    setTimeout(()=>setToast(null),3000);
  };

  return <div style={{flex:1,display:"flex",flexDirection:"column",background:C.bg,overflow:"hidden"}}>
    {/* Toast - fixed overlay */}
    {toast && <div style={{position:"fixed",top:96,left:"50%",transform:"translateX(-50%)",zIndex:100,
      padding:"8px 16px",borderRadius:20,fontSize:14,fontWeight:500,
      background:toast.type==="ok"?"#e6f4ea":"#fce8e6",color:toast.type==="ok"?"#137333":"#c5221f",
      boxShadow:"0 2px 8px rgba(0,0,0,.12)",animation:"fadeIn .2s"}}>
      {toast.msg}
    </div>}

    {/* Fixed top bar with back + menu buttons */}
    <div style={{position:"absolute",top:0,left:0,right:0,zIndex:10,display:"flex",justifyContent:"space-between",padding:"48px 14px 0"}}>
      <button onClick={onClose} style={{width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="back" size={20} sw={2.5}/>
      </button>
      <button onClick={()=>setMenuOpen(true)} style={{width:40,height:40,background:"#fff",border:"none",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.1)"}}>
        <Icon name="dots" size={18} color={C.text}/>
      </button>
    </div>

    {/* Scrollable content — map scrolls with it */}
    <div style={{flex:1,overflowY:"auto"}}>
      {/* Map — now inside the scroll container */}
      <div style={{height:220,background:"#e8eaed",position:"relative",flexShrink:0}}>
        <img src={`/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=600&h=400`} alt=""
          style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none"}}/>
      </div>

      {/* Content */}
      <div style={{padding:"16px 20px 24px"}}>
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
          <ActionPill icon="refresh" label="Refresh" onClick={doRefresh} disabled={refreshing}/>
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

        {/* Known for — replaces Reviews */}
        {popular.length>0 && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Known for</div>
          {place.editorial_summary && <div style={{fontSize:14,color:C.textMid,lineHeight:1.5,marginBottom:8,fontStyle:"italic"}}>
            "{place.editorial_summary}"
          </div>}
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {popular.filter(p=>p!==place.editorial_summary).map((p,i)=><Tag key={i} variant="bl">{p}</Tag>)}
          </div>
        </div>}

        {/* Nearby Transport */}
        {(transport && (transport.stations||[]).length > 0) && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`}}>
          <div style={{fontSize:12,color:C.textLight,fontWeight:500,textTransform:"uppercase",letterSpacing:".4px",marginBottom:8}}>Nearby Transport</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(transport.stations||[]).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:C.textMid,padding:"4px 0"}}>
              <Icon name="transit" size={16} color={C.textMid} sw={1.5}/>
              <span style={{fontWeight:500,color:C.text}}>{s.name}</span>
              <span style={{fontSize:13,color:C.textLight}}>· {s.distance}</span>
              {s.type && <Tag>{s.type}</Tag>}
            </div>)}
          </div>
        </div>}
        {loadingTransport && <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.borderLight}`,fontSize:13,color:C.textLight}}>Loading transport info...</div>}

        {/* Notes */}
        {place.notes && <div style={{fontSize:14,color:C.textMid,background:C.surface,padding:"12px 16px",borderRadius:8,lineHeight:1.5,marginTop:10}}>
          <span style={{fontWeight:500,color:C.text}}>Note:</span> {place.notes}
        </div>}

        <div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 0",fontSize:13,color:C.textLight,marginTop:8}}>
          <Icon name="calendar" size={15} color={C.textLight}/> Saved on {place.saved}
        </div>
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
