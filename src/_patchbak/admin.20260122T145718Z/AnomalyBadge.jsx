// src/components/admin/AnomalyBadge.jsx
import React from "react";

export default function AnomalyBadge({ z = 0 }) {
  const sev = z >= 3 ? "high" : z >= 2 ? "med" : z >= 1 ? "low" : "none";
  const label = sev === "none" ? "OK" : `${z.toFixed(1)}σ`;
  const style = styles[sev] || styles.none;
  return <span style={{...styles.base, ...style}} title={`z-score: ${z.toFixed(2)}`}>{label}</span>;
}

const styles = {
  base: { fontSize:11, fontWeight:800, padding:"2px 8px", borderRadius:999, border:"1px solid #e6e4de" },
  none: { background:"#ecfdf5", color:"#065f46", borderColor:"#10b981" },
  low:  { background:"#fff7ed", color:"#9a3412", borderColor:"#fed7aa" },
  med:  { background:"#ffe4e6", color:"#9f1239", borderColor:"#fecdd3" },
  high: { background:"#fee2e2", color:"#991b1b", borderColor:"#fecaca" }
};
