import React from "react";

export default function EventReplayPanel({ replay }) {
  return (
    <section className="event-bus-panel replay">
      <div className="panel-heading"><p>Replay</p><h2>Replay Preview</h2></div>
      <div className="replay-summary">
        <span><b>{replay.preview_count}</b> preview steps</span>
        <span><b>{replay.allowed_count}</b> allowed</span>
        <span><b>{replay.blocked_count}</b> blocked</span>
      </div>
      <ol className="replay-list">
        {replay.preview.map((step) => (
          <li key={`${step.replay_step}-${step.event_id}`}>
            <strong>{step.event_name}</strong>
            <span>{step.channel_id} · {step.safety_status}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

