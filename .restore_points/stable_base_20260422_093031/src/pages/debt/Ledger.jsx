// src/pages/debt/Ledger.jsx
import React from "react";
import { Link, useSearchParams } from "react-router-dom";

const ROWS = [
  { id:"P-3020", date:"2025-10-15", memo:"Payment",  acct:"Student Loan A", amt:-220, interest:-32, principal:-188 },
  { id:"P-3019", date:"2025-10-12", memo:"Payment",  acct:"Auto Finance",   amt:-245, interest:-41, principal:-204 },
  { id:"I-3018", date:"2025-10-10", memo:"Interest", acct:"Visa 4421",      amt:+58,  interest:+58, principal:0   },
];

export default function DebtLedger() {
  const [params, setParams] = useSearchParams();
  const view = params.get("view"); // upcoming | interest | delinquent

  let list = [...ROWS];
  if (view === "interest") list = list.filter((r) => r.interest > 0);

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Ledger</h1>
        <p className="db-subtitle">Payments, interest, and adjustments</p>
        </div>
        <div className="db-headR" style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => setParams({})}>All</button>
          <button className="btn" onClick={() => setParams({ view: "interest" })}>Interest</button>
          <a className="btn btn--primary" href="#export">Export</a>
        </div>
      </header>

      <div className="card card--pad">
        <div className="table-wrap">
          <table className="sh-table">
            <thead>
              <tr>
                <th>Date</th><th>Memo</th><th>Account</th>
                <th className="num">Amount</th>
                <th className="num">Interest</th>
                <th className="num">Principal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.memo}</td>
                  <td>{r.acct}</td>
                  <td className={`num ${r.amt < 0 ? "neg" : "pos"}`}>{r.amt.toLocaleString()}</td>
                  <td className={`num ${r.interest < 0 ? "neg" : "pos"}`}>{r.interest.toLocaleString()}</td>
                  <td className={`num ${r.principal < 0 ? "neg" : "pos"}`}>{r.principal.toLocaleString()}</td>
                  <td><Link className="btn" to={`/payment/${r.id}`}>Details</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="export" className="card card--pad" style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>Export</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">Export CSV</button>
          <button className="btn">Export JSON</button>
        </div>
      </div>
    </section>
  );
}
