import React from "react";

export default function ExecutiveSystemHealthPanel({ health }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>System Health</p><h2>Health deductions</h2></div>
      <div className="ecc-score">{health.health_score}</div>
      <div className="ecc-list">
        {health.deductions.map((item) => (
          <article key={item.reason}><strong>{item.reason}</strong><span>-{item.points} points</span></article>
        ))}
        {!health.deductions.length && <p className="ecc-empty">No health deductions.</p>}
      </div>
    </section>
  );
}
