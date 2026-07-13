import React from "react";

export default function CriticalStateMigrationBackupPanel({ backups }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Backup</p>
        <h2>Scoped Local Backups</h2>
      </div>
      <div className="history-list">
        {backups.length ? backups.slice(-6).reverse().map((backup) => (
          <article key={backup.backup_id}>
            <strong>{backup.domain}</strong>
            <span>{backup.backup_id}</span>
            <small>{backup.record_count} record(s) - {backup.source_key}</small>
          </article>
        )) : <p className="empty-state">No critical-state backups yet.</p>}
      </div>
    </section>
  );
}
