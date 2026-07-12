import React from "react";

export default function ExecutiveCommandHeader({ state, onRefresh }) {
  return (
    <section className="ecc-header">
      <div>
        <p>Silicon Heartland Business Operating System</p>
        <h1>SHS BOS Executive Command Center</h1>
        <span>{state.safety.safety_statement}</span>
      </div>
      <div className="ecc-header-scoreboard">
        <article><span>Overall status</span><strong>{state.overall_status}</strong></article>
        <article><span>Readiness</span><strong>{state.readiness.readiness_score}</strong></article>
        <article><span>Health</span><strong>{state.health.health_score}</strong></article>
        <article><span>Safety posture</span><strong>{state.safety.safe ? "safe" : "blocked"}</strong></article>
        <button type="button" onClick={onRefresh}>Refresh Local Summary</button>
      </div>
      <div className="ecc-header-meta">
        <span>Data posture: derived/local mixed</span>
        <span>Last local refresh: {state.generated_at}</span>
        <span>Admin-only route: admin.html#/ops/executive-command</span>
      </div>
    </section>
  );
}
