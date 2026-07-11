export default function CommandReadinessPanel({ readiness }) {
  return (
    <section className="command-panel readiness">
      <div className="panel-heading"><p>Readiness</p><h2>Command Bus Readiness</h2></div>
      <div className="readiness-score">{readiness.score}</div>
      <strong>{readiness.ready ? "Ready for V1 local command requests" : "Needs review"}</strong>
      <ul>
        {readiness.blockers.map((item) => <li key={item}>{item}</li>)}
        {readiness.warnings.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
