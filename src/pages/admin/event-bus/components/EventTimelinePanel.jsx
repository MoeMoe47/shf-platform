import React from "react";

export default function EventTimelinePanel({ events, onArchiveEvent }) {
  return (
    <section className="event-bus-panel timeline">
      <div className="panel-heading"><p>Timeline</p><h2>Local Event Log</h2></div>
      <div className="event-list">
        {events.length === 0 && <p className="empty-state">No local events for this filter.</p>}
        {events.map((event) => (
          <article key={event.event_id}>
            <div>
              <strong>{event.event_name}</strong>
              <span>{event.channel_id} · {event.safety_status} · {event.risk_level}</span>
              <small>{event.source_layer} → {(event.route?.routed_to || []).join(", ") || "No subscribers"}</small>
            </div>
            <button type="button" onClick={() => onArchiveEvent(event.event_id)}>Archive Local Event</button>
          </article>
        ))}
      </div>
    </section>
  );
}

