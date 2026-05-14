// src/pages/sales/Pipeline.jsx
import React from "react";
import { Link } from "react-router-dom";

const rows = [
  { id:"O-1012", name:"SHF Foundation Pilot", stage:"Proposal", amt:45000 },
  { id:"O-1011", name:"Rural STEM Cohort",    stage:"Discovery", amt:28000 },
  { id:"O-1010", name:"Career Pathways",      stage:"Negotiation", amt:62000 },
];

export default function Pipeline(){
  return (
    <section className="db-shell">
      <header className="db-head">
        <div><h1 className="db-title">Pipeline</h1><p className="db-subtitle">Opportunities by stage</p></div>
      </header>
      <div className="card card--pad">
        <table className="sh-table">
          <thead><tr><th>Name</th><th>Stage</th><th className="num">Amount</th><th></th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id}>
                <td>{r.name}</td><td>{r.stage}</td>
                <td className="num">${r.amt.toLocaleString()}</td>
                <td><Link className="btn" to={`/deal/${r.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
