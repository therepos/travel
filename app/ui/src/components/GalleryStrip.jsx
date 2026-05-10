import { useState, useEffect, useCallback } from "react";
import { C, Icon } from "../shared.jsx";

function PhotoTile({src, alt, onClick, width, height}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return <button onClick={onClick} aria-label={alt}
    style={{flex:`0 0 ${width}px`,height,border:"none",padding:0,margin:0,
      background:"#dadce0",borderRadius:8,overflow:"hidden",cursor:"pointer",
      scrollSnapAlign:"start",position:"relative"}}>
    {failed && <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Icon name="pin" size={22} color={C.textLight}/>
    </div>}
    {!failed && <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer"
      onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}
      style={{width:"100%",height:"100%",objectFit:"cover",display:"block",
        opacity:loaded?1:0,transition:"opacity .2s"}}/>}
  </button>;
}

function MapTile({mapsUrl, src, alt, width, height}) {
  return <a href={mapsUrl} target="_blank" rel="noopener" aria-label="Open in Google Maps"
    style={{flex:`0 0 ${width}px`,height,borderRadius:8,overflow:"hidden",position:"relative",
      scrollSnapAlign:"start",background:"#dadce0",display:"block",textDecoration:"none"}}>
    <img src={src} alt={alt} referrerPolicy="no-referrer"
      style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
      onError={e=>{e.target.style.display="none";}}/>
    <div style={{position:"absolute",bottom:8,left:8,background:"rgba(0,0,0,.55)",color:"#fff",
      padding:"4px 8px",borderRadius:6,fontSize:11,fontWeight:500,
      display:"flex",alignItems:"center",gap:4,pointerEvents:"none"}}>
      <Icon name="pin" size={12} color="#fff" sw={2}/> Map
    </div>
  </a>;
}

function Lightbox({items, index, onClose, onIndex}) {
  const next = useCallback(() => onIndex((index+1) % items.length), [index, items.length, onIndex]);
  const prev = useCallback(() => onIndex((index-1+items.length) % items.length), [index, items.length, onIndex]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [next, prev, onClose]);

  const [touchX, setTouchX] = useState(null);
  const onTouchStart = e => setTouchX(e.touches[0].clientX);
  const onTouchEnd = e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
    setTouchX(null);
  };

  const cur = items[index];
  return <div onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
    style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",animation:"fadeIn .15s"}}>
    <button onClick={e=>{e.stopPropagation();onClose();}} aria-label="Close"
      style={{position:"absolute",top:16,right:16,width:40,height:40,borderRadius:"50%",
        background:"rgba(255,255,255,.15)",border:"none",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Icon name="x" size={20} color="#fff" sw={2.5}/>
    </button>
    {items.length > 1 && <>
      <button onClick={e=>{e.stopPropagation();prev();}} aria-label="Previous"
        style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",width:44,height:44,borderRadius:"50%",
          background:"rgba(255,255,255,.15)",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="back" size={22} color="#fff" sw={2.5}/>
      </button>
      <button onClick={e=>{e.stopPropagation();next();}} aria-label="Next"
        style={{position:"absolute",right:16,top:"50%",transform:"translateY(-50%)",width:44,height:44,borderRadius:"50%",
          background:"rgba(255,255,255,.15)",border:"none",cursor:"pointer",
          display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon name="chevron" size={22} color="#fff" sw={2.5}/>
      </button>
    </>}
    <img src={cur.fullSrc} alt={cur.alt||""} referrerPolicy="no-referrer"
      onClick={e=>e.stopPropagation()}
      style={{maxWidth:"92vw",maxHeight:"88vh",objectFit:"contain",borderRadius:8,boxShadow:"0 8px 40px rgba(0,0,0,.5)"}}/>
    <div style={{position:"absolute",bottom:18,left:0,right:0,textAlign:"center",color:"rgba(255,255,255,.8)",fontSize:13,pointerEvents:"none"}}>
      {index+1} / {items.length}
    </div>
  </div>;
}

export default function GalleryStrip({place, isMobile=false, onClose}) {
  const height = isMobile ? 220 : 200;
  const photoCount = (place.photos||[]).length || (place.photo ? 1 : 0);
  const photoTileWidth = Math.round(height * 1.4); // landscape
  const mapTileWidth = Math.round(height * 1.5);

  const mapsUrl = place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const mapSrc = `/api/staticmap?lat=${place.lat}&lng=${place.lng}&zoom=15&w=${mapTileWidth*2}&h=${height*2}`;

  // Photo slides only (map is anchor, never enters lightbox)
  const photos = Array.from({length:photoCount}, (_,i) => ({
    src:`/api/places/${place.id}/photo?w=600&i=${i}`,
    fullSrc:`/api/places/${place.id}/photo?w=1600&i=${i}`,
    alt:`${place.name} photo ${i+1}`,
  }));

  const [lightboxIdx, setLightboxIdx] = useState(null);

  return <div style={{position:"relative",flexShrink:0,height,background:"#f1f3f4"}}>
    <div className="gallery-strip"
      style={{position:"absolute",inset:0,display:"flex",gap:6,padding:"0 12px",
        overflowX:"auto",overflowY:"hidden",scrollSnapType:"x mandatory",
        WebkitOverflowScrolling:"touch",scrollbarWidth:"none",
        maskImage: photoCount>2 ? "linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%)" : "none",
        WebkitMaskImage: photoCount>2 ? "linear-gradient(to right, #000 0, #000 calc(100% - 32px), transparent 100%)" : "none"}}>
      <MapTile mapsUrl={mapsUrl} src={mapSrc} alt={`Map of ${place.name}`} width={mapTileWidth} height={height}/>
      {photos.map((p, i) => <PhotoTile key={i} src={p.src} alt={p.alt} width={photoTileWidth} height={height}
        onClick={()=>setLightboxIdx(i)}/>)}
    </div>

    {onClose && <button onClick={onClose} aria-label="Close"
      style={{position:"absolute",top:10,right:10,width:32,height:32,background:"#fff",border:"none",borderRadius:"50%",
        display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",
        boxShadow:"0 1px 3px rgba(0,0,0,.15)",zIndex:2}}>
      <Icon name="x" size={16} sw={2.5}/>
    </button>}

    {lightboxIdx != null && <Lightbox items={photos} index={lightboxIdx}
      onIndex={setLightboxIdx} onClose={()=>setLightboxIdx(null)}/>}

    <style>{`.gallery-strip::-webkit-scrollbar{display:none}`}</style>
  </div>;
}
