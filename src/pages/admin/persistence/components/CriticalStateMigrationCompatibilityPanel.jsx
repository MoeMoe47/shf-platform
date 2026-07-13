import React from "react";

export default function CriticalStateMigrationCompatibilityPanel({ domain }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Compatibility</p>
        <h2>Repository Primary With Fallback</h2>
      </div>
      {domain ? (
        <ul className="status-list">
          <li><span>Stage</span><strong>{domain.stage}</strong></li>
          <li><span>Mode</span><strong>{domain.compatibility_mode}</strong></li>
          <li><span>Legacy deletion</span><strong>false</strong></li>
          <li><span>Permanent dual-write</span><strong>false</strong></li>
          <li><span>Target repository</span><strong>{domain.target_repository}</strong></li>
        </ul>
      ) : <p className="empty-state">Select a migration domain.</p>}
    </section>
  );
}
