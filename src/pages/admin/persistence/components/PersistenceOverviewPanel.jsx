import React from "react";

export default function PersistenceOverviewPanel({ metrics }) {
  return (
    <section className="persistence-panel persistence-overview">
      <div className="panel-heading">
        <p>Readiness</p>
        <h2>Adapter Status</h2>
      </div>
      <div className="metric-row">
        <article><span>Repositories</span><strong>{metrics.repository_count}</strong></article>
        <article><span>Transactions</span><strong>{metrics.transaction_count}</strong></article>
        <article><span>Versions</span><strong>{metrics.version_count}</strong></article>
        <article><span>Snapshots</span><strong>{metrics.snapshot_count}</strong></article>
      </div>
      <ul className="status-list">
        <li><span>Local adapter</span><strong>Enabled</strong></li>
        <li><span>In-memory adapter</span><strong>Enabled</strong></li>
        <li><span>Database adapter</span><strong>Disabled placeholder</strong></li>
      </ul>
    </section>
  );
}

