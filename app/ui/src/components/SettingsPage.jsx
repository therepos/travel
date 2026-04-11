import { useState, useEffect } from "react";
import { api, C, Icon } from "../shared.jsx";

export default function SettingsPage({isMobile}) {
  const [stats,setStats] = useState(null);
  const [importing,setImporting] = useState(false);
  const [importResult,setImportResult] = useState(null);

  useEffect(() => {
    api("/stats").then(setStats).catch(()=>{});
  }, []);

  const handleExport = async (format) => {
    window.open(`/api/export/${format}`, "_blank");
  };

  const handleImport = async (format) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = format === "json" ? ".json" : format === "csv" ? ".csv" : format === "kml" ? ".kml" : ".geojson,.json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setImporting(true); setImportResult(null);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/import/${format}`, {method:"POST", body:formData});
        const data = await res.json();
        setImportResult({ok:true, count:data.imported||0});
        setTimeout(() => window.location.reload(), 1500);
      } catch(e) {
        setImportResult({ok:false, error:e.message});
      }
      setImporting(false);
    };
    input.click();
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL places and routes? This cannot be undone.")) return;
    if (!confirm("Are you really sure? Everything will be permanently deleted.")) return;
    try {
      await api("/data/all", {method:"DELETE"});
      window.location.reload();
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
  };

  return <div style={{flex:1,overflowY:"auto",padding:m?"16px 20px":"20px 28px",maxWidth:640,
    ...(m?{}:{borderLeft:`1px solid ${C.border}`,minWidth:0})}}>
    <div style={{fontSize:m?22:18,fontWeight:500,marginBottom:m?20:16}}>Settings</div>

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

      <div style={S.row}>
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

      <div style={S.row}>
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
      <div style={S.row}>
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

    {/* Danger */}
    <div style={S.section}>
      <div style={{...S.sectionTitle,color:C.red,borderColor:"#fce8e6"}}>Danger zone</div>
      <div style={{...S.row,borderBottom:"none"}}>
        <div style={{...S.icon,background:"#fce8e6"}}><Icon name="trash" size={m?16:14} color={C.red}/></div>
        <div style={{flex:1}}>
          <div style={S.label}>Delete all data</div>
          <div style={S.desc}>Permanently delete all places, routes, and tags</div>
        </div>
        <button onClick={handleDeleteAll}
          style={{...S.btn,color:C.red,borderColor:C.red}}>Delete all</button>
      </div>
    </div>

    <div style={{fontSize:m?13:12,color:C.textLight,textAlign:"center",padding:"16px 0"}}>
      Travel v4.0 · Self-hosted · MIT License
    </div>
  </div>;
}
