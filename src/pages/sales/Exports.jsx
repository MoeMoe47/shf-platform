// src/pages/sales/Exports.jsx
// Restored from src/_archive/pages.sales.20251107-000126/Exports.jsx.
// Fixed one class: the original used ".btn", which isn't defined in any
// stylesheet loaded by sales.main.jsx — swapped for ".sh-btn".
import React from "react";
export default function Exports(){
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Exports</h1><p className="db-subtitle">CSV / JSON</p></div></header>
      <div className="card card--pad" style={{display:"flex",gap:8}}>
        <button className="sh-btn" disabled>Export CSV</button>
        <button className="sh-btn" disabled>Export JSON</button>
      </div>
    </section>
  );
}
