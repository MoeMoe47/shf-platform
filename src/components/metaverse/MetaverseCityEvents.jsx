import React from "react";

export default function MetaverseCityEvents({ events = [], open = false }) {
  if (!open || !events.length) return null;
  return (
    <section className="met-events" aria-labelledby="met-events-title">
      <h2 id="met-events-title">City Events</h2>
      <ul>
        {events.slice(0, 4).map((event) => (
          <li key={event.event_id}>
            <span>{event.title}</span>
            <small>{event.source} source · {event.status}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
