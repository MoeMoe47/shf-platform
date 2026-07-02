import React from "react";

export default function PersistenceMigrationPanel({
  migrations,
  selectedMigrationId,
  migrationResult,
  onSelectMigration,
  onDryRunMigration,
}) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Dry-run only</p>
        <h2>Migration Planner</h2>
      </div>
      <div className="control-row">
        <select value={selectedMigrationId} onChange={(event) => onSelectMigration(event.target.value)}>
          {migrations.map((migration) => (
            <option key={migration.migration_id} value={migration.migration_id}>{migration.migration_id}</option>
          ))}
        </select>
        <button type="button" onClick={onDryRunMigration}>Dry-run Migration</button>
      </div>
      {migrationResult && (
        <div className="result-box">
          <strong>{migrationResult.status}</strong>
          <span>{migrationResult.migration_id}</span>
          <small>Would mutate: {String(migrationResult.would_mutate)}</small>
        </div>
      )}
    </section>
  );
}

