export default function CommandApprovalPanel({ approval }) {
  return (
    <section className="command-panel approval">
      <div className="panel-heading"><p>Approval Model</p><h2>Approvals</h2></div>
      <div className="badge-grid">
        <span>Safe</span>
        <span>Owner Review</span>
        <span>Governance Review</span>
        <span>Blocked</span>
      </div>
      <p>Current preview: {approval.approval_level} - {approval.approval_status}</p>
      <strong>Approved for execution: {String(approval.approved_for_execution)}</strong>
    </section>
  );
}
