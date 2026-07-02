import React from "react";

export default function PersistenceVersionHistory({ versions }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Revision metadata</p>
        <h2>Version History</h2>
      </div>
      <div className="history-list">
        {versions.length === 0 && <span className="empty-state">No local versions recorded yet.</span>}
        {versions.slice(-6).reverse().map((version) => (
          <article key={version.version_id}>
            <strong>v{version.version_number} · {version.repository}</strong>
            <span>{version.change_summary}</span>
            <small>{version.record_hash}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

