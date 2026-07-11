export default function CommandPolicyPanel() {
  return (
    <section className="command-panel policies">
      <div className="panel-heading"><p>Policies</p><h2>Command Policies</h2></div>
      <ul>
        <li>Automatic and autonomous modes are blocked.</li>
        <li>Critical commands require governance review and remain blocked in V1.</li>
        <li>Approved mode requires explicit approval status.</li>
        <li>Command chaining is not allowed without approval.</li>
      </ul>
    </section>
  );
}
