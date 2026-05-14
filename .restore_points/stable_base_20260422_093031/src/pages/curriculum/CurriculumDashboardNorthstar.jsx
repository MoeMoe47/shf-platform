// src/pages/curriculum/CurriculumDashboardNorthstar.jsx
import React from "react";

export default function CurriculumDashboardNorthstar() {
  return (
    <section className="crb-main" aria-labelledby="ns-title">
      <header className="db-head">
        <h1 id="ns-title" className="db-title">Northstar Dashboard</h1>
        <p className="db-subtitle">Course progress, mastery, artifacts, and next steps.</p>
      </header>

      <div className="db-grid db-grid--kpis">
        <div className="card card--pad">
          <strong>Progress</strong>
          <p>46%</p>
        </div>
        <div className="card card--pad">
          <strong>Mastery</strong>
          <p>Level 2</p>
        </div>
        <div className="card card--pad">
          <strong>Artifacts</strong>
          <p>5</p>
        </div>
      </div>

      <div className="db-grid" style={{ marginTop: 16 }}>
        <div className="card card--pad">
          <strong>Next Actions</strong>
          <ol>
            <li>Finish Lesson 3 quiz</li>
            <li>Upload portfolio artifact</li>
            <li>Book coach office hours</li>
          </ol>
        </div>
        <div className="card card--pad">
          <strong>Recent Milestones</strong>
          <ul>
            <li>Completed Unit 2</li>
            <li>Mastery badge unlocked</li>
            <li>Peer review submitted</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
