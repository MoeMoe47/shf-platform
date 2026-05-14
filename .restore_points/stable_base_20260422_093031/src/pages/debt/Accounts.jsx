import React from "react";
import { Link } from "react-router-dom";

const ACCOUNTS = [
  { id:"A-STU-1", name:"Student Loan A", type:"student", apr:5.2,  bal:8200, min:120 },
  { id:"A-CC-1",  name:"Visa 4421",      type:"credit",  apr:21.9, bal:3100, min:55  },
  { id:"A-AUTO",  name:"Auto Finance",   type:"auto",    apr:6.5,  bal:9600, min:240 },
  { id:"A-CC-2",  name:"Amex Blue",      type:"credit",  apr:18.4, bal:3950, min:70  },
];

export default function Accounts() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Accounts</h1>
          <p className="db-subtitle">Balances, APRs, and minimums</p>
        </div>
        <div className="db-headR">
          <Link className="btn btn--primary" to="/plan">Rebuild Plan</Link>
        </div>
      </header>

      <div className="card card--pad">
        <div className="table-wrap">
          <table className="sh-table">
            <thead>
              <tr><th>Account</th><th>Type</th><th className="num">APR</th><th className="num">Balance</th><th className="num">Minimum</th></tr>
            </thead>
            <tbody>
              {ACCOUNTS.map(a => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.type}</td>
                  <td className="num">{a.apr}%</td>
                  <td className="num">${a.bal.toLocaleString()}</td>
                  <td className="num">${a.min.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:12}}>
          <Link className="linkcard" to="/ledger">Open Ledger →</Link>
        </div>
      </div>
    </section>
  );
}
