import React from "react";

export default function SystemBlastRadiusPanel({ blastRadius }) {
  return (
    <section className="system-registry-panel blast-radius">
      <div className="panel-heading"><p>Blast Radius</p><h2>{blastRadius.risk_level}</h2></div>
      <div className="detail-grid">
        <span><b>Direct dependents</b>{blastRadius.direct_dependents.length}</span>
        <span><b>Transitive dependents</b>{blastRadius.transitive_dependents.length}</span>
        <span><b>Validators</b>{blastRadius.validators_to_run.length}</span>
        <span><b>Manual reviews</b>{blastRadius.manual_reviews_required.length}</span>
      </div>
      <ul>
        {blastRadius.safe_change_guidance.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

