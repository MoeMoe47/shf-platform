import React from "react";

export default function IdentitySessionPanel({ auth, onRefresh, onLogout }) {
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Current Session</p><h2>Sanitized Session Summary</h2></div>
      <div className="identityAccess-kv">
        <span>User</span><strong>{auth.user?.email || "not signed in"}</strong>
        <span>Status</span><strong>{auth.sessionStatus}</strong>
        <span>Expires</span><strong>{auth.expiresAt || "not available"}</strong>
        <span>CSRF</span><strong>{auth.csrfToken ? "present" : "not exposed"}</strong>
      </div>
      <div className="identityAccess-actions">
        <button type="button" onClick={onRefresh}>Rotate Session</button>
        <button type="button" onClick={onLogout}>Logout</button>
      </div>
    </section>
  );
}

