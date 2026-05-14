import React from "react";
import { getWindowSummary } from "@/shared/integrations/metricsClient.js";

export default function Attribution(){
  const [win,setWin] = React.useState(getWindowSummary(7));
  React.useEffect(()=>{ const t=setInterval(()=>setWin(getWindowSummary(7)),1000); return ()=>clearInterval(t); },[]);
  const by = win.by||{};
  const totalApplies = Object.values(by).reduce((s,v)=>s+v.applies,0);

  return (
    <div className="page fade-in">
      <h2>Attribution (Last Touch, 7 days)</h2>
      <div className="card">
        <table className="table">
          <thead><tr><th>Provider</th><th style={{textAlign:"right"}}>% of Applies</th></tr></thead>
          <tbody>
            {Object.entries(by).map(([k,v])=>{
              const pct = totalApplies ? (v.applies*100/totalApplies).toFixed(1) : "0.0";
              return (
                <tr key={k}>
                  <td style={{textTransform:"capitalize"}}>{k}</td>
                  <td style={{textAlign:"right",fontWeight:800}}>{pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
