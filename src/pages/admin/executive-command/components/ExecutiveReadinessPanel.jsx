import React from "react";

export default function ExecutiveReadinessPanel({ readiness }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Readiness</p><h2>Transparent scoring</h2></div>
      <div className="ecc-score">{readiness.readiness_score}</div>
      <div className="ecc-list">
        {readiness.deductions.map((item) => (
          <article key={item.reason}><strong>{item.reason}</strong><span>-{item.points} points</span></article>
        ))}
        {!readiness.deductions.length && <p className="ecc-empty">No readiness deductions.</p>}
      </div>
    </section>
  );
}
