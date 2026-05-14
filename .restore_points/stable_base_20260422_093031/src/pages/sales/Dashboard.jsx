// src/pages /sales/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import CivicKpis from "@/components /sales/CivicKpis.jsx";
import DashboardSwitcher from "@/components /sales/DashboardSwitcher.jsx";

export default function CivicDashboard() {
  return (
    <section className="crb-main" aria-labelledby="civ-title">
      <header className="db-head">
        <div>
          <h1 id="civ-title" className="db-title">Civic Dashboard</h1>
          <p className="db-subtitle">
            Micro-missions, surveys, and proposals that teach real-world governance.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <DashboardSwitcher />
          <RewardsChip />
        </div>
      </header>

      {/* KPI strip (reads civic:* counters) */}
      <section className="card card--pad" style={{ marginBottom: 12 }}>
        <CivicKpis />
      </section>

      {/* Your simple tiles – keep as at-a-glance stats */}
      <div className="db-grid db-grid--kpis">
        <div className="card card--pad"><strong>Active Parties</strong><p>3</p></div>
        <div className="card card--pad"><strong>Open Proposals</strong><p>8</p></div>
        <div className="card card--pad"><strong>Voter Turnout (last)</strong><p>62%</p></div>
      </div>

      <div className="db-grid" style={{ marginTop: 12 }}>
        <div className="card card--pad">
          <strong>Next Actions</strong>
          <ol>
            <li>Review proposals</li>
            <li>Join a party</li>
            <li>Vote in elections</li>
          </ol>
        </div>
        <div className="card card--pad">
          <strong>Quick Links</strong>
          <ul>
            {/* relative links keep you in the Civic shell */}
            <li><Link to="elections">Open Elections →</Link></li>
            <li><Link to="proposals">Write a Proposal →</Link></li>
            <li><Link to="debtclock">View Debt Clock →</Link></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
