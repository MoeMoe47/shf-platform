import React from "react";
import { kpis } from "../data/dashboardData";

export default function KpiStrip() {
  return (
    <section className="shsDash-kpis">
      {kpis.map(([icon, label, value, delta, sub, tone]) => (
        <article className={`shsDash-kpi shsDash-glow--${tone}`} key={label}>
          <div className="shsDash-kpiTop">
            <span>{icon}</span>
            <h2>{label}</h2>
          </div>

          <div className="shsDash-kpiBody">
            <strong>{value}</strong>
            <b>{delta}</b>
          </div>

          <p>{sub}</p>

          <svg viewBox="0 0 90 30" aria-hidden="true">
            <polyline points="2,24 14,22 24,24 36,18 48,20 60,13 72,16 88,5" />
          </svg>
        </article>
      ))}
    </section>
  );
}
