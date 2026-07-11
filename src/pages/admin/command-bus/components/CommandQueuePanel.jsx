export default function CommandQueuePanel({ queue, onPreview, onDryRun }) {
  return (
    <section className="command-panel queue">
      <div className="panel-heading"><p>Queue</p><h2>Execution Requests</h2></div>
      <div className="command-list">
        {queue.map((command) => (
          <article key={command.command_id}>
            <div>
              <strong>{command.command_name}</strong>
              <span>{command.command_type} - {command.execution_mode} - {command.execution_status}</span>
              <small>{command.target_layer} - risk {command.risk_level}</small>
            </div>
            <div className="command-row-actions">
              <button type="button" onClick={() => onPreview(command)}>Preview</button>
              <button type="button" onClick={() => onDryRun(command)}>Dry Run</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
