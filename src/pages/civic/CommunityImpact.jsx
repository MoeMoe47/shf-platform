// src/pages/civic/CommunityImpact.jsx
import React from "react";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

export default function CommunityImpact() {
  return (
    <section className="crb-main" aria-labelledby="ci-title">
      <header className="db-head">
        <div>
          <h1 id="ci-title" className="db-title">Community Impact</h1>
          <p className="db-subtitle">
            High-level snapshot of missions, proposals, and outcomes across the
            community.
          </p>
        </div>
        <RewardsChip />
      </header>

      <div className="card card--pad">
        <p style={{ marginTop: 0 }}>
          This is a placeholder for the full impact dashboard. You’ll plug in:
        </p>
        <ul>
          <li>✅ Total missions completed</li>
          <li>✅ Votes cast and turnout by cohort</li>
          <li>✅ Top parties / proposals by support</li>
          <li>✅ Reward points issued through Civic</li>
        </ul>
      </div>
    </section>
  );
}
