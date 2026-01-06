// src/pages/debt/DebtDashboardNorthstar.jsx
import React from "react";

export default function DebtDashboardNorthstar() {
  return (
    <section className="crb-main" aria-labelledby="ns-title">
      <header className="db-head">
        <h1 id="ns-title" className="db-title">Northstar Dashboard</h1>
        <p className="db-subtitle">Debt clock, utilization, payoff velocity, next actions.</p>
      </header>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">
          <strong>Total Debt</strong>
          <p>$12,500</p>
        </div>
        <div className="card card--pad">
          <strong>Utilization</strong>
          <p>28%</p>
        </div>
        <div className="card card--pad">
          <strong>Payoff Velocity</strong>
          <p>4 mo streak</p>
        </div>
      </div>

      <div className="db-grid" style={{ marginTop: 16 }}>
        <div className="card card--pad">
          <strong>Next Actions</strong>
          <ol>
            <li>Round-up payment enabled</li>
            <li>Snowball transfer queued</li>
            <li>Confirm autopay date</li>
          </ol>
        </div>
        <div className="card card--pad">
          <strong>Recent Milestones</strong>
          <ul>
            <li>Paid off Store Card</li>
            <li>Reduced APR via call</li>
            <li>3 on-time payments</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
