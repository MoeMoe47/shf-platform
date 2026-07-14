import React from "react";

export default function IdentityAuditTimeline({ events = [] }) {
  return (
    <section className="identityAccess-panel span-6">
      <div className="panel-heading"><p>Audit</p><h2>Redacted Authentication Events</h2></div>
      <div className="identityAccess-list compact">
        {!events.length ? <p className="identityAccess-empty">No auth events visible yet.</p> : null}
        {events.slice(0, 8).map((event) => (
          <article key={event.auth_event_id}>
            <strong>{event.event_type}</strong>
            <span>{event.result} {event.reason ? `- ${event.reason}` : ""}</span>
            <em>{event.timestamp}</em>
          </article>
        ))}
      </div>
    </section>
  );
}

