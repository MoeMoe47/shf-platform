// src/pages/sales/SalesDashboard.jsx
//
// Rebuilt from src/_archive/components.sales.20251107-000126/
// SalesDashboard.jsx, which used DashboardShell.jsx (a real, existing,
// shared component at src/components/shared/DashboardShell.jsx) plus
// .db-grid/.db-grid--kpis/.card/.kpi-label/.kpi-value/.linkcard — all
// confirmed defined in src/styles/shell.css and dashboard-shared.css,
// both already loaded by sales.main.jsx. The archive's own
// PipelineList.jsx/.pipe-* classes were NOT used here — those classes
// aren't defined anywhere in the project, so the pipeline preview below
// uses a plain inline-styled list instead (matching the deal data used on
// the Pipeline page). Quick Links only points at routes this restoration
// actually wires up.
import React from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/shared/DashboardShell.jsx";

const pipeline = [
  { id: "O-1012", name: "SHF Foundation Pilot", stage: "Proposal", amount: 45000 },
  { id: "O-1011", name: "Rural STEM Cohort", stage: "Discovery", amount: 28000 },
  { id: "O-1010", name: "Career Pathways", stage: "Negotiation", amount: 62000 },
];

const usd0 = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SalesDashboard() {
  const [tab, setTab] = React.useState("overview");

  const openPipeline = pipeline.reduce((sum, p) => sum + p.amount, 0);
  const proposalsOut = pipeline.filter((p) => p.stage === "Proposal").length;

  return (
    <DashboardShell
      title="Sales Dashboard"
      subtitle="Track pipeline, proposals, and outreach at a glance."
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "pipeline", label: "Pipeline" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <>
          <Link to="/proposals" className="sh-btn">New Proposal</Link>
          <Link to="/demo" className="sh-btn sh-btn--soft">Demo Hub</Link>
        </>
      }
    >
      {tab === "overview" && (
        <>
          <div className="db-grid db-grid--kpis">
            <div className="card kpi"><div className="kpi-label">Open Pipeline</div><div className="kpi-value">{usd0(openPipeline)}</div></div>
            <div className="card kpi"><div className="kpi-label">Proposals Out</div><div className="kpi-value">{proposalsOut}</div></div>
            <div className="card kpi"><div className="kpi-label">Opportunities</div><div className="kpi-value">{pipeline.length}</div></div>
          </div>

          <div className="db-grid">
            <Link to="/lesson" className="card linkcard"><h3>Sales Lesson</h3><p>ICP, pipeline, and discovery fundamentals.</p></Link>
            <Link to="/demo" className="card linkcard"><h3>Demo Hub</h3><p>Funding calculator, grant brief, and pitch tools.</p></Link>
            <Link to="/leads" className="card linkcard"><h3>Leads</h3><p>Employer-sourced leads bridged into Sales.</p></Link>
          </div>

          <div className="card card--pad" style={{ marginTop: 12 }}>
            <strong>Pipeline Preview</strong>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
              {pipeline.map((p) => (
                <li key={p.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--ring)", paddingBottom: 8 }}>
                  <span>{p.name} <span style={{ color: "var(--ink-soft, #6b7280)" }}>· {p.stage}</span></span>
                  <span>{usd0(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {tab === "pipeline" && (
        <div className="card card--pad">
          <strong>Pipeline</strong>
          <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 8 }}>
            {pipeline.map((p) => (
              <li key={p.id} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--ring)", paddingBottom: 8 }}>
                <span>{p.name} <span style={{ color: "var(--ink-soft, #6b7280)" }}>· {p.stage}</span></span>
                <span>{usd0(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardShell>
  );
}
