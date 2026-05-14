import React from "react";
import { Link } from "react-router-dom";
import DashboardShell from "@/components/shared/DashboardShell.jsx";

const fmtUSD = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default function SalesDashboardV2() {
  // visual smoke test so you KNOW this file is live
  React.useEffect(() => { console.log("%cSalesDashboardV2 mounted", "color:#e11d2d;font-weight:700"); }, []);

  const [tab, setTab] = React.useState("overview");
  const pipeline = [
    { id:"l1", name:"Cleveland City Schools", stage:"Qualified",   amount: 48000 },
    { id:"l2", name:"Franklin District",      stage:"Proposal",    amount:120000 },
    { id:"l3", name:"Summit Charter",         stage:"Lead",        amount: 25000 },
    { id:"l4", name:"Medina County Schools",  stage:"Negotiation", amount:210000 },
  ];
  const leads30d = 128;
  const proposalsOut = pipeline.filter(p => p.stage === "Proposal").length;
  const openPipeline = pipeline.reduce((s,p)=>s+p.amount,0);
  const mrr = 28400;

  return (
    <DashboardShell
      title="Sales Dashboard (V2)"
      subtitle="Shared shell from Curriculum · theme-aware for Solutions."
      tabs={[
        { id: "overview", label: "Overview" },
        { id: "pipeline", label: "Pipeline" },
        { id: "reports",  label: "Reports" },
      ]}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <>
          <Link to="/sales/proposal?new=1" className="sh-btn">New Proposal</Link>
          <Link to="/sales/pricing?mode=quote" className="sh-btn sh-btn--soft">Create Quote</Link>
        </>
      }
      right={<span style={{fontSize:12,opacity:.7,padding:"4px 8px",border:"1px solid var(--ring)",borderRadius:8}}>V2 live</span>}
    >
      {tab === "overview" && (
        <>
          <div className="db-grid db-grid--kpis">
            <div className="card kpi"><div className="kpi-label">Leads (30d)</div><div className="kpi-value">{leads30d}</div></div>
            <div className="card kpi"><div className="kpi-label">Open Pipeline</div><div className="kpi-value">{fmtUSD(openPipeline)}</div></div>
            <div className="card kpi"><div className="kpi-label">Proposals Out</div><div className="kpi-value">{proposalsOut}</div></div>
            <div className="card kpi"><div className="kpi-label">MRR</div><div className="kpi-value">{fmtUSD(mrr)}</div></div>
          </div>

          <div className="db-grid">
            <Link to="/sales/calc" className="card linkcard"><h3>Impact Calculator</h3><p>Estimate outcomes & ROI.</p></Link>
            <Link to="/sales/pricing" className="card linkcard"><h3>Pricing</h3><p>Bundles, SKUs, and quotes.</p></Link>
            <Link to="/sales/roi" className="card linkcard"><h3>ROI</h3><p>Funding impact visuals.</p></Link>
            <Link to="/sales/ledger" className="card linkcard"><h3>Ledger</h3><p>Donations & grants.</p></Link>
          </div>
        </>
      )}

      {tab === "pipeline" && (
        <div className="db-section">
          <h2>Pipeline</h2>
          <ul className="pipe-list">
            {pipeline.map(p=>(
              <li key={p.id} className="pipe-row">
                <div className="pipe-main">
                  <div className="pipe-title">{p.name}</div>
                  <div className="pipe-meta"><span className="pipe-stage">{p.stage}</span></div>
                </div>
                <div className="pipe-amt">{fmtUSD(p.amount)}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "reports" && (
        <div className="db-section">
          <h2>Reports</h2>
          <p>Board-ready exports coming soon.</p>
        </div>
      )}
    </DashboardShell>
  );
}
