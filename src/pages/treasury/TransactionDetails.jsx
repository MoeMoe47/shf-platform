import React from "react";
import { Link, useParams } from "react-router-dom";

export default function TransactionDetails() {
  const { id } = useParams();

  // Mock—replace with fetch by id
  const tx = {
    id, date:"2025-10-21", memo:"EVU: Career Launchpad v1.2",
    program:"grants", amt:+3200, asset:"A-1001", chain:"0xabc…91e",
    notes:"Batch prepared; awaiting inclusion."
  };

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Transaction {tx.id}</h1>
          <p className="db-subtitle">Program: {tx.program}</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <Link className="btn" to="/ledger">Back to Ledger</Link>
          <button className="btn btn--primary">Rebatch</button>
        </div>
      </header>

      <div className="db-grid" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Details</h3>
          <table className="sh-table">
            <tbody>
              <tr><th align="left">Date</th><td>{tx.date}</td></tr>
              <tr><th align="left">Memo</th><td>{tx.memo}</td></tr>
              <tr><th align="left">Program</th><td>{tx.program}</td></tr>
              <tr><th align="left">Amount</th><td className={tx.amt>=0?"pos":"neg"}>{tx.amt}</td></tr>
              <tr><th align="left">Asset</th><td>{tx.asset ?? "—"}</td></tr>
              <tr><th align="left">Chain</th><td><code>{tx.chain}</code></td></tr>
            </tbody>
          </table>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Notes</h3>
          <p className="db-subtitle">{tx.notes}</p>
          <div style={{display:"flex",gap:8, marginTop:8}}>
            <button className="btn">Copy Link</button>
            <button className="btn">Export JSON</button>
          </div>
        </div>
      </div>
    </section>
  );
}
