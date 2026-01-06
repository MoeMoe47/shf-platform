// src/pages/civic/CivicDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import CivicKpis from "@/components/civic/CivicKpis.jsx";
import DashboardSwitcher from "@/components/civic/DashboardSwitcher.jsx";

export default function CivicDashboard() {
  return (
    <section className="crb-main" aria-labelledby="civ-title">
      <header className="db-head">
        <div>
          <h1 id="civ-title" className="db-title">
            Civic Dashboard
          </h1>
          <p className="db-subtitle">
            Micro-missions, surveys, and proposals that teach real-world
            governance.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <DashboardSwitcher />
          <RewardsChip />
        </div>
      </header>

      {/* KPI strip */}
      <section className="card card--pad" style={{ marginBottom: 12 }}>
        <CivicKpis />
      </section>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">
          <strong>Active Parties</strong>
          <p>3</p>
        </div>
        <div className="card card--pad">
          <strong>Open Proposals</strong>
          <p>8</p>
        </div>
        <div className="card card--pad">
          <strong>Voter Turnout (last)</strong>
          <p>62%</p>
        </div>
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
            <li>
              <Link to="/missions">All Missions →</Link>
            </li>
            <li>
              <Link to="/proposals">Write a Proposal →</Link>
            </li>
            <li>
              <Link to="/impact">View Community Impact →</Link>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
