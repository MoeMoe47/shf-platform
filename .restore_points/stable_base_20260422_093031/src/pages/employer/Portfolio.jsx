// src/pages/employer/Portfolio.jsx
import React from "react";
export default function EmployerPortfolio() {
  return (
    <div className="page pad" data-page="employer-portfolio">
      <header className="card card--pad">
        <h1 style={{ margin: 0 }}>🗂️ Employer — Portfolio</h1>
        <p className="sh-sub">Store job posts, candidate packets, interview kits, and offers.</p>
      </header>
      <section className="card card--pad" style={{ marginTop: 12 }}>
        <h2 style={{ marginTop: 0 }}>Artifacts</h2>
        <p className="sh-hint">No artifacts yet. Add uploads or connect a data source.</p>
      </section>
    </div>
  );
}
