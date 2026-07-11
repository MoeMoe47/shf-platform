export default function CommandMetricsPanel({ metrics }) {
  return (
    <section className="command-panel metrics">
      <div className="panel-heading"><p>Metrics</p><h2>Command Type Coverage</h2></div>
      <div className="type-list">
        {metrics.by_type.map((item) => (
          <span key={item.command_type}>{item.command_type}: {item.count}</span>
        ))}
      </div>
    </section>
  );
}
