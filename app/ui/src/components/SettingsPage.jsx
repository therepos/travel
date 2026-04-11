import { useState, useEffect } from "react";
import { api, C, Icon } from "../shared.jsx";

export default function SettingsPage({isMobile, user, onLogout, onUserUpdate}) {
  const [stats,setStats] = useState(null);
  const [importing,setImporting] = useState(false);
  const [importResult,setImportResult] = useState(null);

  const [editingField,setEditingField] = useState(null);
  const [fieldValue,setFieldValue] = useState("");
  const [fieldError,setFieldError] = useState("");
  const [fieldSaving,setFieldSaving] = useState(false);

  const [pwOpen,setPwOpen] = useState(false);
  const [pwCurrent,setPwCurrent] = useState("");
  const [pwNew,setPwNew] = useState("");
  const [pwConfirm,setPwConfirm] = useState("");
  const [pwError,setPwError] = useState("");
  const [pwSaving,setPwSaving] = useState(false);
  const [pwSuccess,setPwSuccess] = useState(false);

  const [unOpen,setUnOpen] = useState(false);
  const [unValue,setUnValue] = useState("");
  const [unPw,setUnPw] = useState("");
  const [unError,setUnError] = useState("");
  const [unSaving,setUnSaving] = useState(false);

  useEffect(() => { api("/stats").then(setStats).catch(()=>{}); }, []);

  const handleExport = (format) => { window.open(`/api/export/${format}`, "_blank"); };

  const handleImport = (format) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = format === "json" ? ".json" : format === "csv" ? ".csv" : format === "kml" ? ".kml" : ".geojson,.json";
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      setImporting(true); setImportResult(null);
      const formData = new FormData(); formData.append("file", file);
      try {
        const res = await fetch(`/api/import/${format}`, {method:"POST", body:formData});
        const data = await res.json();
        setImportResult({ok:true, count:data.imported||0});
        setTimeout(() => window.location.reload(), 1500);
      } catch(e) { setImportResult({ok:false, error:e.message}); }
      setImporting(false);
    };
    input.click();
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL places and routes? This cannot be undone.")) return;
    if (!confirm("Are you really sure? Everything will be permanently deleted.")) return;
    try { await api("/data/all", {method:"DELETE"}); window.location.reload(); } catch(e) { console.error(e); }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete your account? All your places, routes, and data will be permanently removed.")) return;
    if (!confirm("This is irreversible. Are you absolutely sure?")) return;
    try {
      await fetch("/api/auth/account", {method:"DELETE"});
      window.location.reload();
    } catch(e) { console.error(e); }
  };

  const startEdit = (field, value) => { setEditingField(field); setFieldValue(value||""); setFieldError(""); };
  const cancelEdit = () => { setEditingField(null); setFieldValue(""); setFieldError(""); };
  const saveField = async () => {
    setFieldSaving(true); setFieldError("");
    try {
      const res = await fetch("/api/auth/me", {method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({[editingField]:fieldValue})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Failed");
      onUserUpdate?.(data.user);
      setEditingField(null);
    } catch(e) { setFieldError(e.message); }
    setFieldSaving(false);
  };

  const savePassword = async () => {
    if (pwNew !== pwConfirm) { setPwError("Passwords don't match"); return; }
    if (pwNew.length < 4) { setPwError("Must be at least 4 characters"); return; }
    setPwSaving(true); setPwError("");
    try {
      const res = await fetch("/api/auth/password", {method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({current_password:pwCurrent, new_password:pwNew})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Failed");
      setPwSuccess(true); setTimeout(()=>{setPwOpen(false);setPwSuccess(false);setPwCurrent("");setPwNew("");setPwConfirm("");},1500);
    } catch(e) { setPwError(e.message); }
    setPwSaving(false);
  };

  const saveUsername = async () => {
    if (unValue.length < 2) { setUnError("Must be at least 2 characters"); return; }
    setUnSaving(true); setUnError("");
    try {
      const res = await fetch("/api/auth/username", {method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({new_username:unValue, password:unPw})});
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Failed");
      onUserUpdate?.(data.user);
      setUnOpen(false); setUnValue(""); setUnPw("");
    } catch(e) { setUnError(e.message); }
    setUnSaving(false);
  };

  const toggleDigest = async () => {
    try {
      const res = await fetch("/api/auth/me", {method:"PATCH", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({notify_digest:!user.notify_digest})});
      const data = await res.json();
      if (res.ok) onUserUpdate?.(data.user);
    } catch(e) { console.error(e); }
  };

  const m = isMobile;
  const S = {
    section:{marginBottom:m?20:20},
    sectionTitle:{fontSize:m?13:12,fontWeight:500,color:C.blue,textTransform:"uppercase",letterSpacing:".5px",marginBottom:m?10:8,paddingBottom:4,borderBottom:`1px solid ${C.blueBg}`},
    row:{display:"flex",alignItems:"flex-start",gap:m?12:10,padding:m?"12px 0":"10px 0",borderBottom:`1px solid ${C.borderLight}`},
    icon:{width:m?34:30,height:m?34:30,borderRadius:m?10:8,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
    label:{fontSize:m?15:13,fontWeight:500,marginBottom:2},
    desc:{fontSize:m?13:11,color:C.textMid,lineHeight:1.5},
    btn:{padding:m?"7px 16px":"5px 14px",borderRadius:10,fontSize:m?13:11,fontWeight:500,border:`1px solid ${C.border}`,background:"#fff",color:C.textMid,cursor:"pointer",fontFamily:"inherit",flexShrink:0},
    formatRow:{display:"flex",gap:6,marginTop:6},
    fmt:{fontSize:m?13:12,padding:m?"5px 14px":"3px 10px",borderRadius:8,border:`1px solid ${C.border}`,color:C.textMid,background:"#fff",cursor:"pointer",fontWeight:500,fontFamily:"inherit"},
    input:{padding:m?"10px 12px":"8px 10px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:m?15:13,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",background:"#fff",color:C.text},
    saveBtn:{padding:m?"8px 18px":"6px 14px",borderRadius:10,fontSize:m?14:12,fontWeight:500,border:"none",background:C.blue,color:"#fff",cursor:"pointer",fontFamily:"inherit"},
    cancelBtn:{padding:m?"8px 18px":"6px 14px",borderRadius:10,fontSize:m?14:12,fontWeight:500,border:`1px solid ${C.border}`,background:"#fff",color:C.textMid,cursor:"pointer",fontFamily:"inherit"},
    error:{padding:"6px 10px",borderRadius:8,background:"#fce8e6",color:"#c5221f",fontSize:m?13:11,marginTop:6},
    success:{padding:"6px 10px",borderRadius:8,background:"#e6f4ea",color:"#137333",fontSize:m?13:11,marginTop:6},
  };

  return <div style={{flex:1,overflowY:"auto",padding:m?"16px 20px":"20px 28px",maxWidth:640,
    ...(m?{}:{borderLeft:`1px solid ${C.border}`,minWidth:0})}}>
    <div style={{fontSize:m?22:18,fontWeight:500,marginBottom:m?20:16}}>Settings</div>

    {/* ── ACCOUNT ── */}
    {user && <div style={S.section}>
      <div style={S.sectionTitle}>Account</div>

      <div style={{display:"flex",alignItems:"center",gap:m?14:12,padding:m?"14px 0":"10px 0",borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{width:m?48:42,height:m?48:42,borderRadius:"50%",background:user.color||C.blue,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:m?20:18,fontWeight:500,flexShrink:0}}>
          {(user.display_name||user.username||"?")[0].toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:m?16:14,fontWeight:500}}>{user.display_name||user.username}</div>
          <div style={{fontSize:m?14:12,color:C.textMid}}>@{user.username}</div>
        </div>
        <button onClick={onLogout} style={S.btn}>Sign out</button>
      </div>

      {/* Display name */}
      <div style={S.row}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="edit" size={m?16:14} color={C.blue}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Display name</div>
          <div style={S.desc}>How your name appears in the app</div>
          {editingField==="display_name" && <div style={{marginTop:8}}>
            <input value={fieldValue} onChange={e=>setFieldValue(e.target.value)} autoFocus style={S.input}
              onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}
              onKeyDown={e=>{if(e.key==="Enter")saveField();if(e.key==="Escape")cancelEdit();}}/>
            {fieldError && <div style={S.error}>{fieldError}</div>}
            <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
              <button onClick={cancelEdit} style={S.cancelBtn}>Cancel</button>
              <button onClick={saveField} disabled={fieldSaving} style={S.saveBtn}>{fieldSaving?"Saving...":"Save"}</button>
            </div>
          </div>}
        </div>
        {editingField!=="display_name" && <button onClick={()=>startEdit("display_name",user.display_name)}
          style={{...S.btn,color:C.blue,borderColor:C.blueBg}}>{user.display_name||"Set"}</button>}
      </div>

      {/* Username */}
      <div style={{...S.row,borderBottom:unOpen?"none":`1px solid ${C.borderLight}`}}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="lock" size={m?16:14} color={C.blue}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Username</div>
          <div style={S.desc}>Used for login. Changing it updates your credentials.</div>
        </div>
        {!unOpen && <button onClick={()=>{setUnOpen(true);setUnValue(user.username);setUnPw("");setUnError("");}}
          style={{...S.btn,color:C.blue,borderColor:C.blueBg}}>@{user.username}</button>}
      </div>
      {unOpen && <div style={{padding:"0 0 12px",borderBottom:`1px solid ${C.borderLight}`}}>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={unValue} onChange={e=>setUnValue(e.target.value)} placeholder="New username" autoFocus
            style={{...S.input,flex:1}} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
          <input value={unPw} onChange={e=>setUnPw(e.target.value)} placeholder="Your password" type="password"
            style={{...S.input,flex:1}} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        </div>
        {unError && <div style={S.error}>{unError}</div>}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={()=>setUnOpen(false)} style={S.cancelBtn}>Cancel</button>
          <button onClick={saveUsername} disabled={unSaving} style={S.saveBtn}>{unSaving?"Saving...":"Update"}</button>
        </div>
      </div>}
    </div>}

    {/* ── SECURITY ── */}
    {user && <div style={S.section}>
      <div style={S.sectionTitle}>Security</div>
      <div style={{...S.row,borderBottom:pwOpen?"none":`1px solid ${C.borderLight}`}}>
        <div style={{...S.icon,background:"#fef7e0"}}><Icon name="lock" size={m?16:14} color="#b06000"/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Password</div>
          <div style={S.desc}>Change your login password</div>
        </div>
        {!pwOpen && <button onClick={()=>{setPwOpen(true);setPwCurrent("");setPwNew("");setPwConfirm("");setPwError("");setPwSuccess(false);}} style={S.btn}>Change</button>}
      </div>
      {pwOpen && <div style={{padding:"0 0 12px",borderBottom:`1px solid ${C.borderLight}`}}>
        <input value={pwCurrent} onChange={e=>setPwCurrent(e.target.value)} placeholder="Current password" type="password" autoFocus
          style={{...S.input,marginBottom:8}} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input value={pwNew} onChange={e=>setPwNew(e.target.value)} placeholder="New password" type="password"
            style={{...S.input,flex:1}} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}/>
          <input value={pwConfirm} onChange={e=>setPwConfirm(e.target.value)} placeholder="Confirm new" type="password"
            style={{...S.input,flex:1}} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}
            onKeyDown={e=>{if(e.key==="Enter")savePassword();}}/>
        </div>
        {pwError && <div style={S.error}>{pwError}</div>}
        {pwSuccess && <div style={S.success}>Password updated</div>}
        <div style={{display:"flex",gap:6,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={()=>setPwOpen(false)} style={S.cancelBtn}>Cancel</button>
          <button onClick={savePassword} disabled={pwSaving} style={S.saveBtn}>{pwSaving?"Updating...":"Update"}</button>
        </div>
      </div>}
    </div>}

    {/* ── NOTIFICATIONS ── */}
    {user && <div style={S.section}>
      <div style={S.sectionTitle}>Notifications</div>

      <div style={S.row}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="globe" size={m?16:14} color={C.blue}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Email address</div>
          <div style={S.desc}>For account recovery and notifications</div>
          {editingField==="email" && <div style={{marginTop:8}}>
            <input value={fieldValue} onChange={e=>setFieldValue(e.target.value)} autoFocus placeholder="your@email.com" type="email"
              style={S.input} onFocus={e=>{e.target.style.borderColor=C.blue;}} onBlur={e=>{e.target.style.borderColor=C.border;}}
              onKeyDown={e=>{if(e.key==="Enter")saveField();if(e.key==="Escape")cancelEdit();}}/>
            {fieldError && <div style={S.error}>{fieldError}</div>}
            <div style={{display:"flex",gap:6,marginTop:8,justifyContent:"flex-end"}}>
              <button onClick={cancelEdit} style={S.cancelBtn}>Cancel</button>
              <button onClick={saveField} disabled={fieldSaving} style={S.saveBtn}>{fieldSaving?"Saving...":"Save"}</button>
            </div>
          </div>}
        </div>
        {editingField!=="email" && <button onClick={()=>startEdit("email",user.email)}
          style={{...S.btn,color:user.email?C.textMid:C.blue,borderColor:user.email?C.border:C.blueBg}}>
          {user.email||"Add email"}
        </button>}
      </div>

      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="clock" size={m?16:14} color={C.blue}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Weekly digest</div>
          <div style={S.desc}>Summary of places you've saved</div>
        </div>
        <button onClick={toggleDigest}
          style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",padding:2,flexShrink:0,transition:"background .2s",
            background:user.notify_digest?C.green:C.border}}>
          <div style={{width:20,height:20,borderRadius:"50%",background:"#fff",transition:"transform .2s",
            transform:user.notify_digest?"translateX(20px)":"translateX(0)"}}/>
        </button>
      </div>
    </div>}

    {/* Stats */}
    {stats && <div style={S.section}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:m?10:8}}>
        {[["Places",stats.places],["Routes",stats.routes],["Cuisines",stats.cuisines],["Cities",stats.cities]].map(([l,v])=>
          <div key={l} style={{background:C.surface,borderRadius:m?10:8,padding:m?14:10,textAlign:"center"}}>
            <div style={{fontSize:m?24:20,fontWeight:500}}>{v}</div>
            <div style={{fontSize:m?13:12,color:C.textLight,marginTop:2}}>{l}</div>
          </div>
        )}
      </div>
    </div>}

    {/* Export */}
    <div style={S.section}>
      <div style={S.sectionTitle}>Export</div>
      <div style={S.row}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="download" size={m?16:14} color={C.blue}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Export all places</div>
          <div style={S.desc}>Download your entire collection</div>
          <div style={S.formatRow}>
            <button style={S.fmt} onClick={()=>handleExport("kml")}>KML</button>
            <button style={S.fmt} onClick={()=>handleExport("csv")}>CSV</button>
            <button style={S.fmt} onClick={()=>handleExport("json")}>JSON</button>
          </div>
        </div>
      </div>
      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:C.blueBg}}><Icon name="route" size={m?16:14} color={C.blue} fill="none"/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Export routes</div>
          <div style={S.desc}>KML with ordered waypoints for Google Maps</div>
        </div>
        <button style={S.btn} onClick={()=>handleExport("kml")}>Export</button>
      </div>
    </div>

    {/* Import */}
    <div style={S.section}>
      <div style={S.sectionTitle}>Import</div>
      <div style={S.row}>
        <div style={{...S.icon,background:"#e6f4ea"}}><Icon name="upload" size={m?16:14} color={C.green}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Import places</div>
          <div style={S.desc}>Duplicates detected by coordinates</div>
          <div style={S.formatRow}>
            <button style={S.fmt} onClick={()=>handleImport("kml")}>KML</button>
            <button style={S.fmt} onClick={()=>handleImport("csv")}>CSV</button>
            <button style={S.fmt} onClick={()=>handleImport("json")}>JSON</button>
          </div>
        </div>
      </div>
      <div style={S.row}>
        <div style={{...S.icon,background:"#e6f4ea"}}><Icon name="pin" size={m?16:14} color={C.green} fill="none"/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Google Takeout</div>
          <div style={S.desc}>Import saved places from takeout.google.com (GeoJSON)</div>
        </div>
        <button style={S.btn} onClick={()=>handleImport("geojson")}>Choose file</button>
      </div>
      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:"#e6f4ea"}}><Icon name="upload" size={m?16:14} color={C.green}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Restore backup</div>
          <div style={S.desc}>Full JSON backup — merges with existing data</div>
        </div>
        <button style={S.btn} onClick={()=>handleImport("json")}>Choose file</button>
      </div>
      {importing && <div style={{padding:12,background:C.blueBg,borderRadius:8,fontSize:m?14:12,color:C.blue,marginTop:8}}>Importing...</div>}
      {importResult && <div style={{padding:12,borderRadius:8,fontSize:m?14:12,marginTop:8,
        background:importResult.ok?"#e6f4ea":"#fce8e6",color:importResult.ok?"#137333":"#c5221f"}}>
        {importResult.ok ? `Imported ${importResult.count} places. Reloading...` : `Error: ${importResult.error}`}
      </div>}
    </div>

    {/* API */}
    <div style={S.section}>
      <div style={S.sectionTitle}>Google Places API</div>
      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:"#fef7e0"}}><Icon name="lock" size={m?16:14} color="#b06000"/></div>
        <div style={{flex:1}}>
          <div style={S.label}>API key</div>
          <div style={S.desc}>Configured via GOOGLE_PLACES_API_KEY environment variable</div>
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:m?13:12,marginTop:5}}>
            <div style={{width:7,height:7,borderRadius:"50%",background:C.green}}/>
            <span style={{color:C.green,fontWeight:500}}>Connected</span>
          </div>
        </div>
      </div>
    </div>

    {/* ── DANGER ZONE ── */}
    <div style={S.section}>
      <div style={{...S.sectionTitle,color:C.red,borderColor:"#fce8e6"}}>Danger zone</div>
      <div style={S.row}>
        <div style={{...S.icon,background:"#fce8e6"}}><Icon name="trash" size={m?16:14} color={C.red}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Delete all data</div>
          <div style={S.desc}>Remove all places, routes, and tags. Keeps your account.</div>
        </div>
        <button onClick={handleDeleteAll} style={{...S.btn,color:C.red,borderColor:C.red}}>Delete all</button>
      </div>
      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:"#fce8e6"}}><Icon name="x" size={m?16:14} color={C.red} sw={2.5}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Delete account</div>
          <div style={S.desc}>Permanently delete your account and all data</div>
        </div>
        <button onClick={handleDeleteAccount}
          style={{...S.btn,color:"#fff",background:C.red,borderColor:C.red}}>Delete</button>
      </div>
    </div>

    <div style={{fontSize:m?13:12,color:C.textLight,textAlign:"center",padding:"16px 0"}}>
      Travel v5.0 · Self-hosted · MIT License
    </div>
  </div>;
}
