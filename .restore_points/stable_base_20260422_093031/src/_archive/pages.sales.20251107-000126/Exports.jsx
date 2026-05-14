// src/pages/sales/Exports.jsx
import React from "react";
export default function Exports(){
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Exports</h1><p className="db-subtitle">CSV / JSON</p></div></header>
      <div className="card card--pad" style={{display:"flex",gap:8}}>
        <button className="btn">Export CSV</button>
        <button className="btn">Export JSON</button>
      </div>
    </section>
  );
}
