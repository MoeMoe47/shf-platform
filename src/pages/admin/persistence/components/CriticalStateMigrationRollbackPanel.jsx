import React from "react";

export default function CriticalStateMigrationRollbackPanel({ rollbackPreview, rollbackResult, onPreviewRollback, onApplyRollback }) {
  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Rollback</p>
        <h2>Explicit Domain Rollback</h2>
      </div>
      <div className="control-row">
        <button type="button" onClick={onPreviewRollback}>Preview Rollback</button>
        <button type="button" onClick={onApplyRollback}>Apply Confirmed Rollback</button>
      </div>
      {(rollbackPreview || rollbackResult) && (
        <div className="result-box">
          <strong>{rollbackResult?.status || rollbackPreview?.status}</strong>
          <span>{rollbackResult?.domain || rollbackPreview?.domain}</span>
          <small>Would mutate preview: {String(rollbackPreview?.would_mutate ?? false)}</small>
        </div>
      )}
    </section>
  );
}
