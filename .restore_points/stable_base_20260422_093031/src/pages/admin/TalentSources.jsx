import React from "react";
import { getWindowSummary } from "@/shared/integrations/metricsClient.js";

export default function TalentSources(){
  const [win,setWin] = React.useState(getWindowSummary(7));
  React.useEffect(()=>{ const t=setInterval(()=>setWin(getWindowSummary(7)),1000); return ()=>clearInterval(t); },[]);
  const items = Object.entries(win.by||{});

  return (
    <div className="page fade-in">
      <h2>Talent Sources (7 days)</h2>
      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Source</th><th style={{textAlign:"right"}}>Clicks</th><th style={{textAlign:"right"}}>Applies</th><th style={{textAlign:"right"}}>Conv%</th></tr>
          </thead>
          <tbody>
            {items.map(([k,v])=>(
              <tr key={k}>
                <td style={{textTransform:"capitalize"}}>{k}</td>
                <td style={{textAlign:"right"}}>{v.clicks}</td>
                <td style={{textAlign:"right"}}>{v.applies}</td>
                <td style={{textAlign:"right",fontWeight:700}}>{v.conv}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
