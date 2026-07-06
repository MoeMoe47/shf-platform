import React from "react";

export default function EventReadinessPanel({ readiness }) {
  return (
    <section className="event-bus-panel readiness">
      <div className="panel-heading"><p>Readiness</p><h2>Event Bus Readiness</h2></div>
      <div className="readiness-score">{readiness.score}</div>
      <strong>{readiness.ready ? "Ready for local message fabric" : "Needs review"}</strong>
      <ul>
        {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
        {readiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        {!readiness.blockers.length && !readiness.warnings.length && <li>No readiness blockers.</li>}
      </ul>
    </section>
  );
}

