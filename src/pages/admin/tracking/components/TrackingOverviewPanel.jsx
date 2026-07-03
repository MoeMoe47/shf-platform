import React from "react";

export default function TrackingOverviewPanel({ metrics, readiness }) {
  return (
    <section className="tracking-panel tracking-overview">
      <div className="panel-heading"><p>Overview</p><h2>Internal Activity Spine</h2></div>
      <div className="tracking-metrics">
        <article><span>Streams</span><strong>{metrics.stream_count}</strong></article>
        <article><span>Events</span><strong>{metrics.event_count}</strong></article>
        <article><span>Signals</span><strong>{metrics.signal_count}</strong></article>
        <article><span>Readiness</span><strong>{readiness.score}%</strong></article>
      </div>
    </section>
  );
}

