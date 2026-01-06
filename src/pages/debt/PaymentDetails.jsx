import React from "react";
import { useParams, Link } from "react-router-dom";

export default function PaymentDetails() {
  const { id } = useParams();
  const p = { id, date:"2025-10-15", acct:"Student Loan A", amt:-220, interest:-32, principal:-188, conf:"0x9ab…c23" };

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Payment {p.id}</h1>
          <p className="db-subtitle">{p.acct} • {p.date}</p>
        </div>
        <div className="db-headR"><Link className="btn" to="/ledger">Back to Ledger</Link></div>
      </header>

      <div className="db-grid" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card card--pad">
          <table className="sh-table">
            <tbody>
              <tr><th align="left">Amount</th><td className="neg">${Math.abs(p.amt).toLocaleString()}</td></tr>
              <tr><th align="left">Interest</th><td className="neg">${Math.abs(p.interest)}</td></tr>
              <tr><th align="left">Principal</th><td className="neg">${Math.abs(p.principal)}</td></tr>
              <tr><th align="left">Confirmation</th><td><code>{p.conf}</code></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Notes</h3>
          <p className="db-subtitle">Posted successfully. Next payment due 2025-11-01.</p>
        </div>
      </div>
    </section>
  );
}
