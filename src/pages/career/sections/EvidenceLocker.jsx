import React from "react";
import { Link } from "react-router-dom";
export default function EvidenceLocker({ items }) {
  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>Evidence Locker</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {items.map(ev => (
          <li key={ev.id} style={{ marginBottom: 6 }}>
            <strong>{ev.title}</strong>
            <span className="db-subtitle"> · {ev.file}</span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 10 }}>
        <Link className="btn" to="/portfolio">Open Portfolio</Link>
      </div>
    </div>
  );
}
