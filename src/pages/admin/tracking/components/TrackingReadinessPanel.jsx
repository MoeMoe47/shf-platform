import React from "react";

export default function TrackingReadinessPanel({ readiness }) {
  return (
    <section className="tracking-panel tracking-readiness">
      <div className="panel-heading"><p>Readiness</p><h2>Tracking Readiness Score</h2></div>
      <div className="readiness-score">{readiness.score}%</div>
      <strong>{readiness.ready ? "Ready" : "Needs Review"}</strong>
      <ul>
        <li>Dangerous tracking: {String(readiness.dangerous_tracking_enabled)}</li>
        <li>No public approval mutation: {String(readiness.no_public_approval_mutation)}</li>
        <li>No SHF Impact mutation: {String(readiness.no_shf_impact_mutation)}</li>
        <li>No external tracking: {String(readiness.no_external_tracking)}</li>
      </ul>
    </section>
  );
}

