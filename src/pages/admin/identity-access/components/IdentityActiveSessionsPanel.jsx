import React from "react";

export default function IdentityActiveSessionsPanel({ sessions = [] }) {
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Sessions</p><h2>Active Session Summaries</h2></div>
      <div className="identityAccess-list compact">
        {!sessions.length ? <p className="identityAccess-empty">No active server-side session summaries yet.</p> : null}
        {sessions.slice(0, 8).map((session) => (
          <article key={session.session_id}>
            <strong>{session.email}</strong>
            <span>{session.status} - {session.role}</span>
            <em>{session.expires_at}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

