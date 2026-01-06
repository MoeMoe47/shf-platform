import React from "react";
export default function SkillsChecklist({ items, onToggle, onAttach }) {
  const pending = items.filter(s => s.status !== "verified");
  const verified = items.filter(s => s.status === "verified");

  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Skills to Verify</h3>

      {pending.length === 0 ? (
        <div className="db-subtitle">All required skills are verified — great work!</div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {pending.map(s => (
            <li key={s.id} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" onChange={() => onToggle?.(s)} aria-label={`Mark ${s.title} verified`} />
                  <strong>{s.title}</strong>
                  <span className="db-subtitle">· {s.type}</span>
                </label>
                <button className="btn" onClick={() => onAttach?.(s)}>Attach evidence</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {verified.length > 0 && (
        <>
          <div style={{ marginTop: 12, fontWeight: 600 }}>Verified</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {verified.map(s => (<li key={s.id} className="db-subtitle">{s.title}</li>))}
          </ul>
        </>
      )}
    </div>
  );
}
