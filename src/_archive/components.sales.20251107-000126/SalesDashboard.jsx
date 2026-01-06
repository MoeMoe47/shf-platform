import React from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/shared/DashboardShell.jsx";
import PipelineList from "@/components/sales/PipelineList.jsx";

export default function SalesDashboard() {
  const [tab, setTab] = React.useState("overview");

  // demo pipeline used for KPIs + list
  const pipeline = [
    { id:"l1", name:"Cleveland City Schools", org:"CCS", stage:"Qualified",   amount: 48000,  probability: 0.45 },
    { id:"l2", name:"Franklin District",      org:"FD",  stage:"Proposal",    amount: 120000, probability: 0.55 },
    { id:"l3", name:"Summit Charter",         org:"SC",  stage:"Lead",        amount: 25000,  probability: 0.20 },
    { id:"l4", name:"Medina County Schools",  org:"MCS", stage:"Negotiation", amount: 210000, probability: 0.65 },
  ];

  const leads30d = 128;
  const proposalsOut = pipeline.filter(p => p.stage === "Proposal").length;
  const openPipeline = pipeline
    .filter(p => !["Closed Won","Closed Lost"].includes(p.stage))
    .reduce((sum,p) => sum + p.amount, 0);
  const mrr = 28400; // placeholder until wired to real calc

  return (
    <DashboardShell
      title="Sales Dashboard"
      subtitle="Track pipeline, proposals, and ROI at a glance."
      tabs={[
        { id:"overview",  label:"Overview" },
        { id:"pipeline",  label:"Pipeline" },
        { id:"reports",   label:"Reports" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <>
          <Link to="/sales/proposal?new=1" className="sh-btn">New Proposal</Link>
          <Link to="/sales/pricing?mode=quote" className="sh-btn sh-btn--soft">Create Quote</Link>
        </>
      }
    >
      {tab === "overview" && (
        <>
          <div className="db-grid db-grid--kpis">
            <div className="card kpi"><div className="kpi-label">Leads (30d)</div><div className="kpi-value">{leads30d}</div></div>
            <div className="card kpi"><div className="kpi-label">Open Pipeline</div><div className="kpi-value">${openPipeline.toLocaleString()}</div></div>
            <div className="card kpi"><div className="kpi-label">Proposals Out</div><div className="kpi-value">{proposalsOut}</div></div>
            <div className="card kpi"><div className="kpi-label">MRR</div><div className="kpi-value">${mrr.toLocaleString()}</div></div>
          </div>

          <div className="db-grid">
            <Link to="/sales/calc" className="card linkcard"><h3>Impact Calculator</h3><p>Estimate outcomes & ROI.</p></Link>
            <Link to="/sales/pricing" className="card linkcard"><h3>Pricing</h3><p>Bundles, SKUs, and quotes.</p></Link>
            <Link to="/sales/roi" className="card linkcard"><h3>ROI</h3><p>Funding impact visuals.</p></Link>
            <Link to="/sales/ledger" className="card linkcard"><h3>Ledger</h3><p>Donations & grants (open ledger).</p></Link>
          </div>

          <div className="db-section">
            <h2>Pipeline Preview</h2>
            <PipelineList items={pipeline} />
          </div>
        </>
      )}

      {tab === "pipeline" && (
        <div className="db-section">
          <h2>Pipeline</h2>
          <PipelineList items={pipeline} />
        </div>
      )}

      {tab === "reports" && (
        <div className="db-section">
          <h2>Reports</h2>
          <p>Board-ready summaries and exports (CSV/PDF) coming soon.</p>
        </div>
      )}
    </DashboardShell>
  );
}
