// src/pages/debt/Portfolio.jsx
import React from "react";
export default function DebtPortfolio() {
  return (
    <div className="page pad" data-page="debt-portfolio">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>🗂️ Debt — Portfolio</h1>
        <p className="sh-sub">Store payoff plans, statements, receipts, and dispute docs.</p>
      </header>
      <section className="card card--pad" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Artifacts</h2>
        <p className="sh-hint">No artifacts yet. Add uploads or connect a data source.</p>
      </section>
    </div>
  );
}
