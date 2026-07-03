import React from "react";

export default function TrackingEventTimeline({ events, onArchiveEvent }) {
  return (
    <section className="tracking-panel">
      <div className="panel-heading"><p>Activity Timeline</p><h2>Event Timeline</h2></div>
      <div className="tracking-list">
        {events.length === 0 && <span className="empty-state">No events for this filter.</span>}
        {events.map((event) => (
          <article key={event.tracking_event_id}>
            <strong>{event.label}</strong>
            <span>{event.source} · {event.action}</span>
            <small>{event.stream_id} · {event.visibility} · {event.safety_status}</small>
            <button type="button" onClick={() => onArchiveEvent(event.tracking_event_id)}>Archive Local Event</button>
          </article>
        ))}
      </div>
    </section>
  );
}

