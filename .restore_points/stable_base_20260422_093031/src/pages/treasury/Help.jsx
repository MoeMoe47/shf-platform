import React from "react";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Help & Docs</h1>
          <p className="db-subtitle">Guides for EVU accounting and chain proofs</p>
        </div>
        <div className="db-headR">
          <a className="btn" href="/treasury.html#/__docs">Open Dev Docs</a>
        </div>
      </header>

      <div className="db-grid" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Common tasks</h3>
          <ol style={{paddingLeft:18, lineHeight:1.7}}>
            <li>Record donation → <Link to="/ledger?view=donations">Ledger</Link></li>
            <li>Add a new EVU asset → <Link to="/assets">Assets</Link></li>
            <li>Mirror batch to chain → <Link to="/proofs?tab=batches">Proofs</Link></li>
          </ol>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Contact</h3>
          <p className="db-subtitle">foundation@example.org</p>
          <p className="db-subtitle">Status: All systems nominal.</p>
        </div>
      </div>
    </section>
  );
}
