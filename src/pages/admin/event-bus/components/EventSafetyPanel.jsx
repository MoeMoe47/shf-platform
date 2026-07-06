import React from "react";

export default function EventSafetyPanel({ safetyResult }) {
  return (
    <section className="event-bus-panel safety">
      <div className="panel-heading"><p>Safety</p><h2>Local Guardrails</h2></div>
      <p>{safetyResult.safety_copy}</p>
      <div className="safety-flags">
        {Object.entries(safetyResult.dangerous_capabilities).map(([flag, enabled]) => (
          <span key={flag}>{flag}: {String(enabled)}</span>
        ))}
      </div>
      <strong>Dangerous payload blocked: {String(!safetyResult.safe)}</strong>
      <ul>
        {safetyResult.issues.slice(0, 6).map((issue) => (
          <li key={`${issue.path}-${issue.reason}`}>{issue.path}: {issue.reason}</li>
        ))}
      </ul>
    </section>
  );
}

