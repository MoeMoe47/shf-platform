// src/pages/credit/Dashboard.jsx
import React from "react";
export default function CreditDashboard() {
  return (
    <div className="page pad" style={{ display:"grid", gap:12 }}>
      <header className="card card--pad">
        <h1 style={{ margin:0 }}>Credit Bureau Dashboard</h1>
        <p style={{ margin:"6px 0 0", color:"var(--ink-soft)" }}>
          Overview of reports, disputes, furnishers, and verification activity.
        </p>
      </header>

      <section className="card card--pad">
        <strong>Today</strong>
        <ul style={{ margin:"8px 0 0", paddingLeft:18 }}>
          <li>New disputes received: 0 (mock)</li>
          <li>Reports updated: 0 (mock)</li>
          <li>Verifications completed: 0 (mock)</li>
        </ul>
      </section>
    </div>
  );
}
