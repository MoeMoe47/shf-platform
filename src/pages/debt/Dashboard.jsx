// src/pages/debt/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Total Debt",      value: 24850,  sub: "All accounts",    icon: "💸" },
  { label: "Monthly Payment", value: 742,    sub: "Min + plan",      icon: "📆" },
  { label: "Avg APR",         value: "16.4%",sub: "Weighted",        icon: "📈" },
  { label: "Paid YTD",        value: 5810,   sub: "Principal+Int",   icon: "✅" },
];

const upcoming = [
  { id:"P-3022", date:"2025-11-01", acct:"Student Loan A",  amt:220 },
  { id:"P-3023", date:"2025-11-05", acct:"Visa 4421",      amt:110 },
  { id:"P-3024", date:"2025-11-12", acct:"Auto Finance",   amt:245 },
];

export default function DebtDashboard() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Debt Dashboard</h1>
          <p className="db-subtitle">Overview of balances, APR, and upcoming payments</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <Link to="/plan" className="btn btn--primary">Build Plan</Link>
          <Link to="/ledger" className="btn">Open Ledger</Link>
        </div>
      </header>

      <div className="db-grid db-grid--kpis">
        {kpis.map(k => (
          <div key={k.label} className="wash card kpi">
            <div className="kpi-label"><span className="kpi-icon">{k.icon}</span>{k.label}</div>
            <div className="kpi-value">{typeof k.value === "number" ? k.value.toLocaleString() : k.value}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="db-grid" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Upcoming Payments</h3>
          <table className="sh-table">
            <thead><tr><th>Date</th><th>Account</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {upcoming.map(u => (
                <tr key={u.id}>
                  <td>{u.date}</td>
                  <td>{u.acct}</td>
                  <td className="num">${u.amt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{marginTop:12}}>
            <Link className="linkcard" to="/ledger?view=upcoming">See all upcoming →</Link>
          </div>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Quick Actions</h3>
          <div className="db-grid" style={{gridTemplateColumns:"1fr 1fr"}}>
            <Link className="linkcard" to="/accounts">Review Accounts</Link>
            <Link className="linkcard" to="/plan">Recalculate Plan</Link>
            <Link className="linkcard" to="/ledger?view=interest">Interest Breakdown</Link>
            <Link className="linkcard" to="/settings">Configure Alerts</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
