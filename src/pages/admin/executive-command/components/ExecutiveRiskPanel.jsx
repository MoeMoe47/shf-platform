import React from "react";

export default function ExecutiveRiskPanel({ risks }) {
  return (
    <section className="ecc-panel ecc-span-4">
      <div className="ecc-panel-heading"><p>Risk</p><h2>Top risks</h2></div>
      <div className="ecc-list compact">
        {risks.slice(0, 6).map((risk) => (
          <article key={risk.risk_id}><strong>{risk.title}</strong><span>{risk.risk_level} - {risk.summary}</span></article>
        ))}
      </div>
    </section>
  );
}
