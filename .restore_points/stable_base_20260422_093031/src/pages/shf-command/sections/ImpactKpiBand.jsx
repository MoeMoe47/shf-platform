import React from "react";

export default function ImpactKpiBand({ kpis = [], onKpiClick }) {
  return (
    <section className="shf-kpi-row" data-tour="kpis">
      {kpis.map((kpi) => (
        <button
          key={kpi.key}
          className={`shf-kpi-card shf-kpi-card--${kpi.key}`}
          onClick={() => onKpiClick?.(kpi)}
          type="button"
        >
          <div className="shf-kpi-card__label">{kpi.label}</div>
          <div className="shf-kpi-card__value-row">
            <strong>{kpi.value}</strong>
            {kpi.delta ? <span>{kpi.delta}</span> : null}
          </div>
          <div className="shf-kpi-card__sub">{kpi.sublabel}</div>
          <div className="shf-kpi-card__ghost" />
        </button>
      ))}
    </section>
  );
}
