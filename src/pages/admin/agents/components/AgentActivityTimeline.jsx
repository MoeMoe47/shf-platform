import React from "react";

export default function AgentActivityTimeline({ task }) {
  const events = [...(task?.audit_events || [])].reverse();

  return (
    <section className="agent-workbench-panel" aria-label="Activity Timeline">
      <div className="agent-workbench-panel__head">
        <div>
          <span>Activity Timeline</span>
          <strong>{events.length} audit events</strong>
        </div>
      </div>
      <ol className="agent-workbench-timeline">
        {events.map((event) => (
          <li key={event.event_id}>
            <span>{event.event_type}</span>
            <strong>{event.message}</strong>
            <small>{event.actor} · {new Date(event.created_at).toLocaleString()}</small>
          </li>
        ))}
        {!events.length ? <li><strong>No audit events yet.</strong></li> : null}
      </ol>
    </section>
  );
}
