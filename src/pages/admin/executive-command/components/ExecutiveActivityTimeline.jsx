import React from "react";

export default function ExecutiveActivityTimeline({ state }) {
  const items = [
    ...state.priorities.slice(0, 4).map((item) => ({ id: item.priority_id, title: item.title, detail: item.reason })),
    ...state.notes.slice(0, 3).map((item) => ({ id: item.note_id, title: "Operator note", detail: item.note })),
    ...state.snapshots.slice(0, 3).map((item) => ({ id: item.snapshot_id, title: "Executive snapshot", detail: item.created_at })),
  ];
  return (
    <section className="ecc-panel ecc-span-6">
      <div className="ecc-panel-heading"><p>Activity Timeline</p><h2>Safe combined local history</h2></div>
      <div className="ecc-list compact">
        {items.map((item) => <article key={item.id}><strong>{item.title}</strong><span>{item.detail}</span></article>)}
        {!items.length && <p className="ecc-empty">No local activity yet.</p>}
      </div>
    </section>
  );
}
