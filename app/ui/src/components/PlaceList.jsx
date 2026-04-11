import { useState, useRef, useCallback } from "react";
import { C, Icon, Tag, Stars } from "../shared.jsx";

function SwipeableRow({children, onSwipeLeft, onSwipeRight, isMobile, disabled}) {
  const ref = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const swiping = useRef(false);
  const locked = useRef(false);
  const [offset, setOffset] = useState(0);
  const [revealed, setRevealed] = useState(null); // "left" | "right" | null
  const THRESHOLD = 70;

  const reset = useCallback(() => {
    setOffset(0); setRevealed(null); swiping.current = false; locked.current = false;
  }, []);

  if (!isMobile || disabled) return <div>{children}</div>;

  const onTouchStart = e => {
    if (revealed) { reset(); return; }
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
    locked.current = false;
  };
  const onTouchMove = e => {
    if (!swiping.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { swiping.current = false; return; }
      if (Math.abs(dx) > 8) locked.current = true; else return;
    }
    e.preventDefault();
    currentX.current = dx;
    const clamped = Math.max(-120, Math.min(120, dx));
    setOffset(clamped);
  };
  const onTouchEnd = () => {
    if (!swiping.current && !locked.current) return;
    swiping.current = false;
    if (currentX.current < -THRESHOLD) { setRevealed("left"); setOffset(-80); }
    else if (currentX.current > THRESHOLD) { setRevealed("right"); setOffset(80); }
    else { reset(); }
    currentX.current = 0;
  };

  return <div style={{position:"relative",overflow:"hidden"}}
    onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
    {/* Left action (revealed when swiping right) — Edit */}
    <div style={{position:"absolute",left:0,top:0,bottom:0,width:80,display:"flex",alignItems:"center",justifyContent:"center",
      background:C.blue,color:"#fff",fontSize:12,fontWeight:500,flexDirection:"column",gap:2}}
      onClick={e=>{e.stopPropagation();reset();onSwipeRight?.();}}>
      <Icon name="edit" size={18} color="#fff" sw={2}/> Edit
    </div>
    {/* Right action (revealed when swiping left) — Delete */}
    <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,display:"flex",alignItems:"center",justifyContent:"center",
      background:C.red,color:"#fff",fontSize:12,fontWeight:500,flexDirection:"column",gap:2}}
      onClick={e=>{e.stopPropagation();reset();onSwipeLeft?.();}}>
      <Icon name="trash" size={18} color="#fff" sw={2}/> Delete
    </div>
    <div style={{transform:`translateX(${offset}px)`,transition:swiping.current?"none":"transform .25s cubic-bezier(.4,0,.2,1)",
      background:C.bg,position:"relative",zIndex:1}}>
      {children}
    </div>
  </div>;
}

export default function PlaceList({grouped, filtered, loading, selectedId, onPlaceClick, isMobile, bulkMode, bulkSelected, onEdit, onDelete, onBulkStart}) {
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  if (loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14}}>Loading...</div>;
  if (filtered.length === 0) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.textLight,fontSize:14,padding:24,textAlign:"center"}}>No places yet. Tap + to save your first!</div>;

  const handleTouchStart = (p) => {
    if (bulkMode) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      onBulkStart?.(p.id);
    }, 500);
  };
  const handleTouchEnd = () => { clearTimeout(longPressTimer.current); };
  const handleTouchMove = () => { clearTimeout(longPressTimer.current); };

  return <div style={{flex:1,overflowY:"auto",paddingBottom:isMobile?130:8}}>
    {Object.entries(grouped).map(([city, places]) => <div key={city}>
      <div style={{padding:isMobile?"16px 16px 4px":"8px 16px 4px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:500,color:C.textLight,textTransform:"uppercase",letterSpacing:".4px"}}>{city}</span>
        <span style={{fontSize:11,color:C.textLight,background:C.borderLight,padding:"1px 6px",borderRadius:8}}>{places.length}</span>
      </div>
      {places.map(p => {
        const isSel = !isMobile && !bulkMode && selectedId === p.id;
        const isBulkSel = bulkMode && bulkSelected?.has(p.id);

        const row = <div key={p.id}
          onClick={()=>{
            if (longPressTriggered.current) { longPressTriggered.current = false; return; }
            onPlaceClick(p);
          }}
          onTouchStart={isMobile && !bulkMode ? ()=>handleTouchStart(p) : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onTouchMove={isMobile ? handleTouchMove : undefined}
          style={{display:"flex",alignItems:"center",gap:isMobile?12:12,padding:isMobile?"14px 16px":"10px 16px",
            cursor:"pointer",borderBottom:`1px solid ${C.borderLight}`,
            background:isBulkSel?C.blueBg:isSel?C.blueBg:"transparent",transition:"background .1s",
            WebkitUserSelect:"none",userSelect:"none"}}
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

        if (isMobile && !bulkMode) {
          return <SwipeableRow key={p.id} isMobile={true}
            onSwipeLeft={()=>{if(confirm(`Delete "${p.name}"?`))onDelete?.(p.id);}}
            onSwipeRight={()=>onEdit?.(p)}>
            {row}
          </SwipeableRow>;
        }
        return row;
      })}
    </div>)}
  </div>;
}
