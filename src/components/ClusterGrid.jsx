import React from "react";

export default function ClusterGrid({ clusters = [], onPick }) {
  if (!clusters.length) return <p className="subtle">No pathways yet.</p>;

  return (
    <div className="cg">
      {clusters.map((c) => (
        <div key={c.cluster} className="cg-card">
          <div className="cg-head">
            <strong>{c.cluster}</strong>
            <span className="cg-count">{c.items.length}</span>
          </div>
          <ul className="cg-list">
            {c.items.slice(0, 6).map((p) => (
              <li key={p.id}>
                <button className="linklike" onClick={() => onPick?.(p)}>{p.title}</button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <style>{`
        .cg{display:grid;gap:10px;grid-template-columns:1fr;}
        @media(min-width:980px){ .cg{grid-template-columns:repeat(3,1fr);} }
        .cg-card{border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fff}
        .cg-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
        .cg-count{font-size:12px;background:#f3f4f6;border-radius:999px;padding:2px 6px}
        .linklike{background:none;border:none;color:#2563eb;cursor:pointer;padding:0}
        .cg-list{margin:0;padding-left:18px}
      `}</style>
    </div>
  );
}
