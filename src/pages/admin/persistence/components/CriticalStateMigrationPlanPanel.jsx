import React from "react";

export default function CriticalStateMigrationPlanPanel({ plan, onPlan, onBackup, onApply, onVerify }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Dry Run</p>
        <h2>Plan and Apply</h2>
      </div>
      <div className="control-row migration-actions">
        <button type="button" onClick={onPlan}>Create Dry-Run Plan</button>
        <button type="button" onClick={onBackup}>Create Safe Backup</button>
        <button type="button" onClick={onApply}>Apply Approved Local Migration</button>
        <button type="button" onClick={onVerify}>Verify Migration</button>
      </div>
      {plan && (
        <div className="result-box">
          <strong>{plan.domain || plan.status}</strong>
          <span>Detected: {plan.record_count_detected ?? plan.source_count ?? 0}</span>
          <span>Valid: {plan.record_count_valid ?? plan.migrated_count ?? 0}</span>
          <span>Blocked: {plan.record_count_blocked ?? plan.blocked_count ?? 0}</span>
          <span>Duplicates: {plan.record_count_duplicate ?? plan.duplicate_count ?? 0}</span>
          <small>Dry run: {String(plan.dry_run !== false)} - destructive: {String(plan.destructive === true)}</small>
        </div>
      )}
    </section>
  );
}
