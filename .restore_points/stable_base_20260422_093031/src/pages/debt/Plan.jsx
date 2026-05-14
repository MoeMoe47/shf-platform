// src/pages/debt/Plan.jsx
import React from "react";

export default function Plan() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Repayment Plan</h1>
          <p className="db-subtitle">Snowball / Avalanche scenarios</p>
        </div>
      </header>

      <div className="db-grid" style={{gridTemplateColumns:"1.4fr 1fr"}}>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Strategy</h3>
          <label className="db-subtitle">Method</label>
          <select className="sh-select" defaultValue="avalanche">
            <option value="snowball">Snowball (smallest balance first)</option>
            <option value="avalanche">Avalanche (highest APR first)</option>
          </select>
          <label className="db-subtitle" style={{marginTop:8}}>Extra Payment / mo</label>
          <input className="sh-input" type="number" defaultValue={150} />
          <div style={{marginTop:10}}>
            <button className="btn btn--primary">Recalculate</button>
          </div>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Projection</h3>
          <ul style={{margin:0, paddingLeft:18, lineHeight:1.7}}>
            <li>Debt-free in ~ <strong>26 months</strong></li>
            <li>Interest saved: <strong>$3,140</strong></li>
            <li>Peak monthly outlay: <strong>$820</strong></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
