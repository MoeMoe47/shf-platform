import React from "react";

export default function Parties() {
  return (
    <section className="crb-main" aria-labelledby="pt-title">
      <header className="db-head">
        <h1 id="pt-title" className="db-title">Parties</h1>
        <p className="db-subtitle">Form coalitions, set platforms, recruit members.</p>
      </header>

      <div className="db-grid">
        <div className="card card--pad">
          <strong>Innovation Party</strong>
          <p>STEM focus • 42 members</p>
          <button className="btn">Join</button>
        </div>
        <div className="card card--pad">
          <strong>Unity Party</strong>
          <p>Community & equity • 37 members</p>
          <button className="btn">Join</button>
        </div>
      </div>
    </section>
  );
}
