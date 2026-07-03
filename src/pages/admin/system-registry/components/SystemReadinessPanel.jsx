import React from "react";

export default function SystemReadinessPanel({ readiness }) {
  return (
    <section className="system-registry-panel readiness">
      <div className="panel-heading"><p>Readiness</p><h2>System Readiness Score</h2></div>
      <div className="readiness-score">{readiness.score}</div>
      <strong>{readiness.ready ? "Ready for System Registry" : "Needs review"}</strong>
      <ul>
        <li>Critical safety issues: {String(!readiness.safety.safe)}</li>
        <li>Public approval mutation risk: {String(readiness.publicApprovalMutationRisk)}</li>
        <li>SHF Impact mutation risk: {String(readiness.shfImpactMutationRisk)}</li>
        <li>Auth mutation risk: {String(readiness.authMutationRisk)}</li>
      </ul>
    </section>
  );
}
