import React from "react";
import { Link } from "react-router-dom";

const kpis = [
  { label: "Active Reqs", value: 12, icon: "📄", sub: "Open roles" },
  { label: "Candidates",  value: 248, icon: "🧑‍💼", sub: "In pipeline" },
  { label: "Interviews",  value: 27,  icon: "📅", sub: "Next 7 days" },
  { label: "Offers",      value: 6,   icon: "🎉", sub: "Pending" },
];

export default function EmployerDashboard() {
  return (
    <section className="db-shell" data-page="employer-dashboard">
      <header className="db-head">
        <div>
          <h1 className="db-title">Employer Dashboard</h1>
          <p className="db-subtitle">Pipeline health, interviews, and offers</p>
        </div>
        <div className="db-headR" style={{display:"flex",gap:8}}>
          <Link to="/jobs" className="btn btn--primary">Post a Job</Link>
          <Link to="/candidates" className="btn">View Candidates</Link>
        </div>
      </header>

      <div className="db-grid db-grid--kpis">
        {kpis.map(k => (
          <div key={k.label} className="wash card kpi">
            <div className="kpi-label"><span className="kpi-icon">{k.icon}</span>{k.label}</div>
            <div className="kpi-value">{k.value.toLocaleString()}</div>
            <div className="kpi-sub">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="db-grid" style={{gridTemplateColumns:"2fr 1fr"}}>
        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Pipeline Snapshot</h3>
          <ul style={{margin:0, paddingLeft:18, lineHeight:1.7}}>
            <li>New candidates this week: <strong>38</strong></li>
            <li>Screening → Interview pass-through: <strong>41%</strong></li>
            <li>Average time-to-offer: <strong>17 days</strong></li>
          </ul>
          <div style={{marginTop:12}}>
            <Link className="linkcard" to="/pipeline">Open full pipeline →</Link>
          </div>
        </div>

        <div className="card card--pad">
          <h3 style={{marginTop:0}}>Quick Actions</h3>
          <div className="db-grid" style={{gridTemplateColumns:"1fr 1fr"}}>
            <Link className="linkcard" to="/candidates">Source Talent</Link>
            <Link className="linkcard" to="/interviews">Schedule Interviews</Link>
            <Link className="linkcard" to="/offers">Draft Offers</Link>
            <Link className="linkcard" to="/analytics">View Analytics</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
