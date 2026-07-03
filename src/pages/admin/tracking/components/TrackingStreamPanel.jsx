import React from "react";

export default function TrackingStreamPanel({ streams, selectedStreamId, onSelectStream }) {
  return (
    <section className="tracking-panel">
      <div className="panel-heading"><p>12 Streams</p><h2>Tracking Streams</h2></div>
      <select value={selectedStreamId} onChange={(event) => onSelectStream(event.target.value)}>
        <option value="">All streams</option>
        {streams.map((stream) => <option key={stream.stream_id} value={stream.stream_id}>{stream.name}</option>)}
      </select>
      <div className="tracking-stream-list">
        {streams.map((stream) => (
          <article key={stream.stream_id} className={selectedStreamId === stream.stream_id ? "is-selected" : ""}>
            <strong>{stream.name}</strong>
            <span>{stream.purpose}</span>
            <small>Reports: {String(stream.useful_for_reports)} · Upsells: {String(stream.useful_for_upsells)} · Retention: {String(stream.useful_for_retention)} · Governance: {String(stream.useful_for_governance)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

