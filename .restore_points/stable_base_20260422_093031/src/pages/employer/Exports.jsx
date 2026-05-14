import React from "react";
export default function Exports(){
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Exports</h1></div></header>
      <div className="card card--pad" id="export">
        <button className="btn">Export CSV</button>
        <button className="btn" style={{marginLeft:8}}>Export JSON</button>
      </div>
    </section>
  );
}
