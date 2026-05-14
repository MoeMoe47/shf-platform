import React from "react";
export default function Candidates(){
  return (
    <section className="db-shell">
      <header className="db-head"><div><h1 className="db-title">Candidates</h1></div></header>
      <div className="card card--pad">
        <div className="table-wrap">
          <table className="sh-table">
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody><tr><td colSpan={4} style={{color:"var(--ink-soft)"}}>Connect to data source…</td></tr></tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
