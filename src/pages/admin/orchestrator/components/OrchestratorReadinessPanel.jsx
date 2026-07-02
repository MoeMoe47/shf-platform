import React from "react";

export default function OrchestratorReadinessPanel({ plan }) {
  const score = Number(plan?.readiness_score || 0);
  const blockers = plan?.blockers || [];
  const warnings = plan?.warnings || [];
  return (
    <section className="orch-card">
      <div className="orch-section-head">
        <div>
          <span>Readiness</span>
          <h2>Gate Score</h2>
        </div>
        <strong>{score}%</strong>
      </div>
      <div className="orch-readiness-meter" aria-label="Orchestrator readiness">
        <div style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <div className="orch-status-columns">
        <div>
          <h3>Blockers</h3>
          {blockers.length ? blockers.map((item) => <p key={item}>{item}</p>) : <p>None</p>}
        </div>
        <div>
          <h3>Warnings</h3>
          {warnings.length ? warnings.map((item) => <p key={item}>{item}</p>) : <p>None</p>}
        </div>
      </div>
    </section>
  );
}
