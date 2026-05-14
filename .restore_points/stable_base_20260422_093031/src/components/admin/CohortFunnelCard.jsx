// src/components/admin/CohortFunnelCard.jsx
import React from "react";

export default function CohortFunnelCard({ data = [] }) {
  if (!data?.length) return <div className="sh-muted">No data</div>;

  const max = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div style={{display:"grid", gap:8}}>
      {data.map((row, i) => {
        const pct = (row.value / max) || 0;
        return (
          <div key={row.key} style={{display:"grid", gridTemplateColumns:"140px 1fr auto", gap:8, alignItems:"center"}}>
            <div style={{fontSize:13, color:"#6b7280"}}>{row.label}</div>
            <div style={{background:"#f1eee8", border:"1px solid #e6e4de", borderRadius:999, overflow:"hidden"}}>
              <div style={{
                width: `${Math.max(4, pct*100)}%`,
                height: 14,
                background: "linear-gradient(90deg,#ff4f00,#ff8a33)"
              }}/>
            </div>
            <div style={{fontWeight:800, color:"#0f172a", minWidth:64, textAlign:"right"}}>{row.value}</div>
          </div>
        );
      })}
    </div>
  );
}
