// src/pages/sales/Portfolio.jsx
import React from "react";

export default function SalesPortfolio() {
  return (
    <div className="page pad" data-page="sales-portfolio">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>🗂️ Sales — Portfolio</h1>
        <p className="sh-sub">
          Store deal artifacts, proposals, quotes, invoices, and client assets here.
          (This is a minimal scaffold — wire your grid/list later.)
        </p>
      </header>

      <section className="card card--pad" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Artifacts</h2>
        <p className="sh-hint">No artifacts yet. Add uploads or connect to your data source.</p>
      </section>
    </div>
  );
}
