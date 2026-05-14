import React from "react";

export default function EmployerDashboardNorthstar() {
  return (
    <section className="crb-main" aria-labelledby="ns-title">
      <header className="db-head">
        <h1 id="ns-title" className="db-title">Northstar Dashboard</h1>
        <p className="db-subtitle">Candidates, interviews, and onboarding readiness.</p>
      </header>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">
          <strong>Open Roles</strong>
          <p>7</p>
        </div>
        <div className="card card--pad">
          <strong>Qualified Candidates</strong>
          <p>24</p>
        </div>
        <div className="card card--pad">
          <strong>Time-to-Hire (avg)</strong>
          <p>18 days</p>
        </div>
      </div>
    </section>
  );
}
