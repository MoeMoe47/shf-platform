import React from "react";
export default function Benefits({ items }) {
  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Funding & Benefits</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map(b => (
          <li key={b.id} style={{ marginBottom: 8 }}>
            <strong>{b.title}</strong> — {b.provider}
            <span className="db-subtitle"> · {b.eligibility}</span>
            <a className="btn" style={{ marginLeft: 8 }} href={b.applyUrl}>Apply</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
