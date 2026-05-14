// src/pages/debt/Help.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Help & Docs</h1>
          <p className="db-subtitle">Managing debt, plans, and exports</p>
        </div>
        <div className="db-headR">
          <a className="btn" href="/debt.html#/__docs">Open Dev Docs</a>
        </div>
      </header>

      <div className="db-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="card card--pad">
          <h3 style={{ marginTop: 0 }}>Common tasks</h3>
          <ol style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            <li>Review accounts → <Link to="/accounts">Accounts</Link></li>
            <li>See interest → <Link to="/ledger?view=interest">Ledger</Link></li>
            <li>Rebuild plan → <Link to="/plan">Plan</Link></li>
          </ol>
        </div>

        <div className="card card--pad">
          <h3 style={{ marginTop: 0 }}>Contact</h3>
          <p className="db-subtitle">support@example.org</p>
        </div>
      </div>
    </section>
  );
}
