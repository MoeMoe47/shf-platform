import React from "react";

export default function DebtClock() {
  return (
    <section className="crb-main" aria-labelledby="dc-title">
      <header className="db-head">
        <h1 id="dc-title" className="db-title">Debt Clock</h1>
        <p className="db-subtitle">State/County debt visualized for education (simulated).</p>
      </header>

      <div className="card card--pad">
        <strong>Current Debt</strong>
        <p>$89,420,000,000</p>
        <small className="text-subtle">Source: Public treasury data (educational use)</small>
      </div>
    </section>
  );
}
