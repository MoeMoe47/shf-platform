import React from "react";

export default function EventBusOverviewPanel({ metrics }) {
  return (
    <section className="event-bus-panel overview">
      <div className="panel-heading"><p>Overview</p><h2>Message Fabric</h2></div>
      <div className="metric-row">
        <article><span>Channels</span><strong>{metrics.channel_count}</strong></article>
        <article><span>Events</span><strong>{metrics.event_count}</strong></article>
        <article><span>Subscribers</span><strong>{metrics.subscriber_count}</strong></article>
        <article><span>Blocked</span><strong>{metrics.blocked_event_count}</strong></article>
      </div>
    </section>
  );
}

