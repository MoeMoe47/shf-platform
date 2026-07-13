import React from "react";

export default function CriticalStateMigrationOverview({ metrics }) {
  return (
    <section className="persistence-panel critical-state-overview">
      <div className="panel-heading">
        <p>Critical State</p>
        <h2>Migration Overview</h2>
      </div>
      <div className="metric-row">
        <article><span>Domains</span><strong>{metrics.total_domains}</strong></article>
        <article><span>Verified runs</span><strong>{metrics.migrated_domains}</strong></article>
        <article><span>Backups</span><strong>{metrics.backup_count}</strong></article>
        <article><span>Database adapter</span><strong>{metrics.database_adapter_enabled ? "on" : "off"}</strong></article>
      </div>
      <p className="safety-copy">
        Critical-state migration routes P0/P1 state through the Durable Persistence Layer local adapter.
        It does not enable a production database, external sync, autonomous execution, public approval mutation,
        SHF Impact mutation, or external notification delivery.
      </p>
    </section>
  );
}
