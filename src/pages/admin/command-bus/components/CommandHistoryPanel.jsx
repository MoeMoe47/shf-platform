export default function CommandHistoryPanel({ history }) {
  return (
    <section className="command-panel history">
      <div className="panel-heading"><p>History</p><h2>Command History</h2></div>
      {history.length === 0 && <p className="empty-state">No local command history.</p>}
      <div className="compact-list">
        {history.map((entry) => (
          <article key={entry.history_id}>
            <strong>{entry.action}</strong>
            <span>{entry.command_name} - {entry.audit_status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
