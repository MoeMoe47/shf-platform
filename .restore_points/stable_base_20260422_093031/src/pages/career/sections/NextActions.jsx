import React from "react";
import { Link } from "react-router-dom";
export default function NextActions({ path, onComplete }) {
  return (
    <div className="card card--pad">
      <h3 style={{ marginTop: 0 }}>My Path — {path.title}</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {path.nextActions.map(a => (
          <li key={a.id} style={{ marginBottom: 8 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" onChange={() => onComplete?.(a)} aria-label={`Complete ${a.label}`} />
              <span>{a.label}</span>
              <span style={{ color: "var(--ink-soft)", fontSize: 12 }}>· due {a.due}</span>
            </label>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 10 }}>
        <Link className="btn" to="/planner">Open Planner</Link>
        <Link className="btn" style={{ marginLeft: 8 }} to="/calendar">Calendar</Link>
      </div>
    </div>
  );
}
