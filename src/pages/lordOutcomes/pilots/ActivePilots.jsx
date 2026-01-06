import React from "react";

export default function ActivePilotsPage() {
  return (
    <div className="loo-dymContainer">
      <div className="loo-pageHeader">
        <h1 className="loo-h1">Active Pilots</h1>
        <p className="loo-sub">List + status of pilots currently running (coming next).</p>
      </div>

      <section className="loo-card">
        <div className="loo-cardTitle">Status</div>
        <p className="loo-text">
          This page will show pilot cycles, evidence coverage, reporting cadence, and partner visibility.
        </p>
      </section>
    </div>
  );
}
