import React from "react";

export default function TrackingSignalPanel({ signals, onSignalReviewed }) {
  return (
    <section className="tracking-panel">
      <div className="panel-heading"><p>Local Signals</p><h2>Intelligence Signals</h2></div>
      <div className="tracking-list">
        {signals.length === 0 && <span className="empty-state">No local signal summary yet.</span>}
        {signals.map((signal) => (
          <article key={signal.signal_id}>
            <strong>{signal.signal_type}</strong>
            <span>{signal.summary}</span>
            <small>Priority: {signal.priority} · Reviewed: {String(signal.reviewed_locally)}</small>
            <button type="button" onClick={() => onSignalReviewed(signal.signal_id)}>Mark Signal Reviewed Locally</button>
          </article>
        ))}
      </div>
    </section>
  );
}

