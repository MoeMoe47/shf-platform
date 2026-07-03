import React from "react";

export default function SystemArchitectureTimeline({ timeline }) {
  return (
    <section className="system-registry-panel timeline">
      <div className="panel-heading"><p>Architecture Timeline</p><h2>System Evolution</h2></div>
      <div className="timeline-list">
        {timeline.map((item) => (
          <article key={item.timeline_id}>
            <span>{item.order}</span>
            <strong>{item.label}</strong>
            <small>{item.status}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

