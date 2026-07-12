import React from "react";

export default function ExecutivePriorityQueue({ priorities, onReview }) {
  const critical = priorities.filter((item) => ["P0", "P1"].includes(item.priority_level));
  return (
    <section className="ecc-panel ecc-span-8">
      <div className="ecc-panel-heading"><p>Critical Attention Strip</p><h2>Priority Queue</h2></div>
      <div className="ecc-priority-strip">
        {critical.map((item) => <span key={item.priority_id}>{item.priority_level} {item.title}</span>)}
        {!critical.length && <span>No P0/P1 items.</span>}
      </div>
      <div className="ecc-list">
        {priorities.slice(0, 8).map((item) => (
          <article key={item.priority_id}>
            <div>
              <strong>{item.priority_level} - {item.title}</strong>
              <span>{item.summary}</span>
              <small>{item.reason} - approval required: {String(item.approval_required)} - execution: {String(item.execution_enabled)}</small>
            </div>
            <button type="button" onClick={() => onReview(item.priority_id)}>{item.reviewed ? "Reviewed" : "Mark reviewed"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
