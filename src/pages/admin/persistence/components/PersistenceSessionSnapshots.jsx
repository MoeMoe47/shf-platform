import React from "react";
import { getSnapshotScopes } from "@/system/persistence/sessionSnapshots";

export default function PersistenceSessionSnapshots({
  snapshots,
  restorePreview,
  onCreateSnapshot,
  onDryRunRestore,
}) {
  const [scope, setScope] = React.useState("all_safe");
  const scopes = React.useMemo(() => getSnapshotScopes(), []);

  return (
    <section className="persistence-panel">
      <div className="panel-heading">
        <p>Save / restore</p>
        <h2>Session Snapshots</h2>
      </div>
      <div className="control-row">
        <select value={scope} onChange={(event) => setScope(event.target.value)}>
          {scopes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button type="button" onClick={() => onCreateSnapshot(scope)}>Create Snapshot</button>
      </div>
      <div className="history-list">
        {snapshots.length === 0 && <span className="empty-state">No snapshots recorded yet.</span>}
        {snapshots.slice(-5).reverse().map((snapshot) => (
          <article key={snapshot.snapshot_id}>
            <strong>{snapshot.scope}</strong>
            <span>{snapshot.repositories.join(", ")}</span>
            <button type="button" onClick={() => onDryRunRestore(snapshot.snapshot_id)}>Dry-run Restore</button>
          </article>
        ))}
      </div>
      {restorePreview && (
        <div className="result-box">
          <strong>{restorePreview.status}</strong>
          <span>{restorePreview.snapshot_id}</span>
        </div>
      )}
    </section>
  );
}

