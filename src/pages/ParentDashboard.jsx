import React from "react";
import { Link } from "react-router-dom";

export default function ParentDashboard() {
  return (
    <main className="card card--pad parent-dashboard" aria-labelledby="parent-dashboard-title">
      <p className="subtle">Family view</p>
      <h1 id="parent-dashboard-title">Parent / Guardian Home</h1>
      <p className="parent-dashboardIntro">
        This space shows learner information only when an authorized family relationship is available.
        No learner records are loaded from a URL or client-provided ID alone.
      </p>
      <section className="parent-dashboardState" aria-labelledby="parent-data-title">
        <h2 id="parent-data-title">Linked learner information</h2>
        <p className="subtle">No linked learner data is available in this view yet.</p>
        <p className="subtle">Access remains governed by the canonical relationship and membership services.</p>
      </section>
      <nav className="parent-dashboardLinks" aria-label="Parent support links">
        <Link className="btn" to="/curriculum/learning">Open learning</Link>
        <Link className="btn" to="/curriculum/help">Get help</Link>
      </nav>
    </main>
  );
}
