export default function CommandAuditPanel({ audit }) {
  return (
    <section className="command-panel audit">
      <div className="panel-heading"><p>Audit</p><h2>Audit Record</h2></div>
      <strong>{audit.audit_status || "recorded"}</strong>
      <span>Execution performed: {String(audit.execution_performed)}</span>
      <span>Completion: {audit.completion_status || "preview_only"}</span>
    </section>
  );
}
