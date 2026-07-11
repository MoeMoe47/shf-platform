export default function CommandOverviewPanel({ metrics }) {
  return (
    <section className="command-panel overview">
      <div className="panel-heading"><p>Overview</p><h2>Command Bus</h2></div>
      <div className="metric-row">
        <article><span>Total</span><strong>{metrics.total_commands}</strong></article>
        <article><span>Queued</span><strong>{metrics.queued_commands}</strong></article>
        <article><span>Blocked</span><strong>{metrics.blocked_commands}</strong></article>
        <article><span>Types</span><strong>{metrics.command_type_count}</strong></article>
      </div>
    </section>
  );
}
