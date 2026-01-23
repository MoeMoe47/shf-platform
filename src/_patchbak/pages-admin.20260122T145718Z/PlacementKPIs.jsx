import React from "react";
import { getAll, reset, getWindowSummary } from "@/shared/integrations/metricsClient.js";

export default function PlacementKPIs(){
  const [m,setM] = React.useState(getAll());
  const [win,setWin] = React.useState(getWindowSummary(7));
  const refresh = () => { setM(getAll()); setWin(getWindowSummary(7)); };

  React.useEffect(() => {
    const t = setInterval(refresh, 1000);
    return () => clearInterval(t);
  }, []);

  const cards = [
    { label:"LinkedIn Connections", value:m.li_connect||0 },
    { label:"LinkedIn Shares",     value:m.li_share||0 },
    { label:"Applies (All)",       value:m.apply||0 },
    { label:"Clicks (All, 7d)",    value:win.totals.clicks },
    { label:"Conversion (7d)",     value:(win.totals.conv||0) + "%" },
  ];

  function exportJSON(){
    const payload = { metrics:m, window7d:win };
    const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "placement-kpis-7d.json"; a.click();
  }

  function fireApply(p){ window.dispatchEvent(new CustomEvent("shf:apply",{detail:{provider:p}})); }
  function fireClick(p){ window.dispatchEvent(new CustomEvent("shf:click" ,{detail:{provider:p}})); }

  const maxDaily = Math.max(1, ...win.buckets.map(b => Math.max(b.applies,b.clicks)));

  return (
    <div className="page fade-in">
      <h2>Placement KPIs</h2>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
        {cards.map(c=>(
          <div key={c.label} className="card">
            <div className="lead">{c.label}</div>
            <div style={{fontSize:32,fontWeight:800}}>{c.value}</div>
          </div>
        ))}
      </div>

      <section className="card" style={{marginTop:20}}>
        <h3>Conversions by Provider (7 days)</h3>
        <table className="table">
          <thead>
            <tr><th>Provider</th><th style={{textAlign:"right"}}>Clicks</th><th style={{textAlign:"right"}}>Applies</th><th style={{textAlign:"right"}}>Conv%</th></tr>
          </thead>
          <tbody>
            {[
              {label:"Indeed",k:"indeed"},
              {label:"LinkedIn",k:"linkedin"},
              {label:"ZipRecruiter",k:"zip"},
            ].map(r=>{
              const v = win.by[r.k] || {clicks:0,applies:0,conv:0};
              return (
                <tr key={r.k}>
                  <td>{r.label}</td>
                  <td style={{textAlign:"right"}}>{v.clicks}</td>
                  <td style={{textAlign:"right"}}>{v.applies}</td>
                  <td style={{textAlign:"right",fontWeight:700}}>{v.conv}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card" style={{marginTop:20}}>
        <h3>Activity (7 days)</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10,alignItems:"end"}}>
          {win.buckets.map((b,i)=>{
            const day = b.day; const label = new Date(day).toLocaleDateString(undefined,{weekday:"short"});
            const hA = 8 + Math.round(60*(b.applies/maxDaily));
            const hC = 8 + Math.round(60*(b.clicks/maxDaily));
            return (
              <div key={i} style={{textAlign:"center"}}>
                <div title={`${label}: ${b.applies} applies`} style={{height:hA,background:"var(--accent)",borderRadius:6,margin:"0 auto 4px",width:14}}/>
                <div title={`${label}: ${b.clicks} clicks`}  style={{height:hC,background:"#334155",borderRadius:6,margin:"0 auto 6px",width:14,opacity:.8}}/>
                <div style={{fontSize:11,opacity:.7}}>{label}</div>
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:16,marginTop:8,fontSize:12,opacity:.8}}>
          <span><span style={{display:"inline-block",width:10,height:10,background:"var(--accent)",borderRadius:3,marginRight:6}}/>Applies</span>
          <span><span style={{display:"inline-block",width:10,height:10,background:"#334155",borderRadius:3,marginRight:6}}/>Clicks</span>
        </div>
      </section>

      <div className="toolbar" style={{marginTop:16}}>
        <button className="btn" onClick={refresh}>Refresh</button>
        <button className="btn ghost" onClick={()=>{ reset(); refresh(); }}>Clear (dev)</button>
        <button className="btn" onClick={exportJSON}>Export JSON</button>
        <button className="btn" onClick={()=>fireClick("indeed")}>Test Click: Indeed</button>
        <button className="btn" onClick={()=>fireClick("linkedin")}>Test Click: LinkedIn</button>
        <button className="btn" onClick={()=>fireClick("zip")}>Test Click: Zip</button>
        <button className="btn" onClick={()=>fireApply("indeed")}>Test Apply: Indeed</button>
        <button className="btn" onClick={()=>fireApply("linkedin")}>Test Apply: LinkedIn</button>
        <button className="btn" onClick={()=>fireApply("zip")}>Test Apply: Zip</button>
      </div>
    </div>
  );
}
