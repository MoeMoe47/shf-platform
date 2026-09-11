import React from "react";
import { Link } from "react-router-dom";

/** Demo-only local defaults so the retained pilot page always renders. */
const DEFAULT_SEED = {
  kpis: [
    { id: "readiness", label: "Demo Readiness Signal", value: 87, unit: "%", goal: 100, higherIsBetter: true },
    { id: "fundingSteps", label: "Funding Steps", value: 3, unit: "of 4", goal: 4, higherIsBetter: true },
    { id: "placement", label: "Demo Placement Signal", value: 78, unit: "", goal: 100, higherIsBetter: true },
  ],
  nextActions: [
    "Book career coach call",
    "Upload updated résumé",
    "Submit internship preferences",
  ],
  milestones: [
    "Completed Unit 2",
    "Uploaded Portfolio Artifact",
    "Joined live mentor session",
  ],
  links: [
    { to: "/planner", label: "Open Planner" },
    { to: "/portfolio", label: "View Portfolio" },
    { to: "/learn", label: "Continue Learning" },
  ],
};

export default function CareerDashboardNorthstar() {
  // Absolutely no external reads that could be undefined
  const model = DEFAULT_SEED;

  return (
    <section className="crb-main" aria-labelledby="ns-title">
      <header className="db-head">
        <h1 id="ns-title" className="db-title">Northstar Dashboard</h1>
        <p className="db-subtitle">Demo-only seed snapshot. This is not a production readiness, placement, or outcome record.</p>
      </header>

      <p className="card card--pad" role="note">
        Sample data for pilot navigation only. Canonical portfolio, credential, calendar, evidence, and workforce records remain in their own domains.
      </p>

      <div className="db-grid db-grid--kpis">
        {model.kpis.map(k => (
          <div key={k.id} className="card card--pad">
            <strong>{k.label}</strong>
            <p>{formatVal(k.value, k.unit)}</p>
          </div>
        ))}
      </div>

      <div className="db-grid" style={{ marginTop: 12 }}>
        <div className="card card--pad">
          <strong>Next Actions</strong>
          <ol style={{ marginTop: 8 }}>
            {model.nextActions.map((a, i) => <li key={i}>{a}</li>)}
          </ol>
        </div>

        <div className="card card--pad">
          <strong>Recent Milestones</strong>
          <ul style={{ marginTop: 8 }}>
            {model.milestones.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>

        <div className="card card--pad">
          <strong>Quick Links</strong>
          <ul style={{ marginTop: 8 }}>
            {model.links.map((l, i) => (
              <li key={i}><Link to={l.to}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function formatVal(v, unit) {
  if (unit === "$") return Number(v).toLocaleString(undefined, { style: "currency", currency: "USD" });
  if (String(unit).includes("%")) return `${Number(v)}%`;
  return unit ? `${v} ${unit}` : String(v);
}
