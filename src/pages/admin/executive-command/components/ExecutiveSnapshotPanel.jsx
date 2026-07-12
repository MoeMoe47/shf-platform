import React from "react";

export default function ExecutiveSnapshotPanel({ snapshots, comparison, note, onNote, onCreate, onCompare, onArchive }) {
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Executive Snapshot</p><h2>Local snapshot and operator note</h2></div>
      <textarea value={note} onChange={(event) => onNote(event.target.value)} placeholder="Add local operator note" />
      <div className="ecc-actions-row">
        <button type="button" onClick={onCreate}>Create Local Snapshot</button>
        <button type="button" onClick={onCompare}>Compare Snapshots</button>
      </div>
      <p>{comparison.summary}</p>
      <div className="ecc-list compact">
        {snapshots.slice(0, 4).map((snapshot) => (
          <article key={snapshot.snapshot_id}>
            <strong>{snapshot.overall_status} - R{snapshot.overall_readiness_score} H{snapshot.overall_health_score}</strong>
            <span>{snapshot.created_at}</span>
            <button type="button" onClick={() => onArchive(snapshot.snapshot_id)}>Archive local snapshot</button>
          </article>
        ))}
      </div>
    </section>
  );
}
