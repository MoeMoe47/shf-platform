import React from "react";

export default function CriticalStateMigrationVerificationPanel({ verification }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Verification</p>
        <h2>Counts, IDs, Hashes</h2>
      </div>
      {verification ? (
        <ul className="status-list">
          <li><span>Repository read</span><strong>{String(verification.repository_read_pass)}</strong></li>
          <li><span>Count match</span><strong>{String(verification.count_match)}</strong></li>
          <li><span>ID set match</span><strong>{String(verification.id_set_match)}</strong></li>
          <li><span>Hash match</span><strong>{String(verification.hash_match)}</strong></li>
          <li><span>Schema match</span><strong>{String(verification.schema_match)}</strong></li>
          <li><span>Verified</span><strong>{String(verification.verified)}</strong></li>
        </ul>
      ) : <p className="empty-state">No verification run yet.</p>}
    </section>
  );
}
