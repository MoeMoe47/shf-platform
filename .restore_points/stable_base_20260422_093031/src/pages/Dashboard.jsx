// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Open Pipeline", value: 1_245_000, sub: "All stages", icon: "📈" },
  { label: "This Month Booked", value: 184_000, sub: "Closed-Won", icon: "✅" },
  { label: "Win Rate", value: "27%", sub: "Last 90 days", icon: "🏆" },
  { label: "Avg Deal Cycle", value: "36d", sub: "Median", icon: "⏱️" },
];

export default function SalesDashboard() {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Sales Dashboard</h1>
        <p className="db-subtitle">Pipeline, bookings, and win rate</p>
        </div>
        <div className="db-headR" style={{ display: "flex", gap: 8 }}>
          <Link to="/pipeline" className="btn btn--primary">Open Pipeline</Link>
          <Link to="/analytics" className="btn">Analytics</Link>
        </div>
      </header>

      <div className="db-grid db-grid--kpis">
        {kpis.map((k) => (
          <div key={k.label} className="wash card kpi">
            <div className="kpi-label">
              <span className="kpi-icon">{k.icon}</span>
              {k.label}
            </div>
            <div className="kpi-value">
              {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
            </div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="db-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="card card--pad">
          <h3 style={{ marginTop: 0 }}>Recent Opportunities</h3>
          <table className="sh-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Stage</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>SHF Foundation Pilot</td><td>Proposal</td><td className="num">$45,000</td></tr>
              <tr><td>Rural STEM Cohort</td><td>Discovery</td><td className="num">$28,000</td></tr>
              <tr><td>Career Pathways Bundle</td><td>Negotiation</td><td className="num">$62,000</td></tr>
            </tbody>
          </table>
        </div>

        <div className="card card--pad">
          <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
          <div className="db-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <Link className="linkcard" to="/leads">View Leads</Link>
            <Link className="linkcard" to="/opportunities">New Opportunity</Link>
            <Link className="linkcard" to="/quotes">Create Quote</Link>
            <Link className="linkcard" to="/exports">Export CSV</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
