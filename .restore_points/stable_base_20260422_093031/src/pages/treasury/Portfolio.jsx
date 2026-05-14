// src/pages/treasury/Portfolio.jsx
import React from "react";
export default function TreasuryPortfolio() {
  return (
    <div className="page pad" data-page="treasury-portfolio">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>🗂️ Treasury — Portfolio</h1>
        <p className="sh-sub">Store budget snapshots, proofs, audits, and donor materials.</p>
      </header>
      <section className="card card--pad" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Artifacts</h2>
        <p className="sh-hint">No artifacts yet. Add uploads or connect a data source.</p>
      </section>
    </div>
  );
}
