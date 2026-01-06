import React from "react";
import { STAGES } from ".";
export default function PipelineBoard({ items, onAdvance }) {
  const byStage = Object.fromEntries(STAGES.map(s => [s, []]));
  items.forEach(i => (byStage[i.stage] || (byStage[i.stage] = [])).push(i));

  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Applications & Interviews</h3>
      <div className="db-grid" style={{ gridTemplateColumns: "repeat(4, minmax(220px,1fr))" }}>
        {STAGES.map(stage => (
          <div key={stage} className="card card--pad" style={{ background: "#fff" }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{stage}</div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
              {(byStage[stage] || []).map(item => (
                <li key={item.id} className="wash" style={{ padding: 10, borderRadius: 10, border: "1px solid var(--ring,#eee)" }}>
                  <div style={{ fontWeight: 600 }}>{item.role}</div>
                  <div className="db-subtitle">{item.employer}</div>
                  <div className="db-subtitle">Updated {item.updated}</div>
                  <div style={{ marginTop: 6 }}>
                    {stage !== "Offer"
                      ? <button className="btn" onClick={() => onAdvance?.(item)}>Move to next →</button>
                      : <span className="db-subtitle">Awaiting decision</span>}
                  </div>
                </li>
              ))}
              {(byStage[stage] || []).length === 0 && (
                <li className="db-subtitle" style={{ color: "var(--ink-soft)" }}>No items</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
