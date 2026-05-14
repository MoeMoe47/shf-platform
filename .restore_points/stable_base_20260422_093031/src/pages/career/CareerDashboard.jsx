// src/pages/career/CareerDashboard.jsx
import React from "react";

export default function CareerDashboard() {
  return (
    <section className="crb-main">
      <header className="db-head">
        <div>
          <h1 className="db-title">Career Center</h1>
          <p className="db-subtitle">Assignments, calendar, portfolio</p>
        </div>
      </header>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">Upcoming assignments: <strong>3</strong></div>
        <div className="card card--pad">Portfolio items: <strong>5</strong></div>
        <div className="card card--pad">Events this week: <strong>2</strong></div>
      </div>
    </section>
  );
}
