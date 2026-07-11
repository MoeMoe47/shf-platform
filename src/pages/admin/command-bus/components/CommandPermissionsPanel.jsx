export default function CommandPermissionsPanel() {
  return (
    <section className="command-panel permissions">
      <div className="panel-heading"><p>Permissions</p><h2>Route Access</h2></div>
      <strong>Allowed role: shs_admin</strong>
      <span>client_admin: blocked</span>
      <span>public: blocked</span>
      <span>External callers: blocked</span>
    </section>
  );
}
