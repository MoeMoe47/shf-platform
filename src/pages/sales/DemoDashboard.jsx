// src/pages/sales/DemoDashboard.jsx
//
// Restored from src/_archive/components.sales.20251107-000126/
// DemoDashboard.jsx — the real integration page composing the demo
// component library (DemoControls, ImpactForecaster, GrantBrief,
// CompliancePack, RewardsMarketplace, CaseloadTable) into one pitch tool.
// Adapted: the original wrapped its title in PageHeaderPortal (portals
// into a #page-header-slot this layout doesn't provide — would have
// silently rendered nothing) and used .lux-hero for that title; replaced
// with an inline .db-head, matching every other restored Sales page.
import React from "react";
import { Link } from "react-router-dom";
import DemoControls, { useDemoPrefs } from "@/components/sales/DemoControls.jsx";
import ImpactForecaster from "@/components/sales/ImpactForecaster.jsx";
import GrantBrief from "@/components/sales/GrantBrief.jsx";
import CompliancePack from "@/components/sales/CompliancePack.jsx";
import RewardsMarketplace from "@/components/sales/RewardsMarketplace.jsx";
import CaseloadTable from "@/components/sales/CaseloadTable.jsx";
import FundingCalculator from "@/components/sales/FundingCalculator.jsx";

function useLangDict(lang="en"){
  return lang==="es" ? {
    title:"Demostración",
    sub:"Listo para presentar en minutos.",
    cta1:"Abrir Lección",
  } : {
    title:"Demo Dashboard",
    sub:"Presentation-ready in minutes.",
    cta1:"Open Lesson",
  };
}

export default function DemoDashboard(){
  const { sponsorView, mode, lang } = useDemoPrefs();
  const t = useLangDict(lang);
  const [kpi, setKpi] = React.useState(null);

  return (
    <section className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">{t.title}{sponsorView ? " · Sponsor View" : ""}</h1>
          <p className="db-subtitle">{t.sub} ({mode})</p>
        </div>
        <Link to="/lesson" className="sh-btn">{t.cta1}</Link>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* minmax(0, 1fr) — not a bare "grid" — so these columns can
            shrink below their widest child's natural width instead of
            forcing the whole row wider than the viewport (the same
            min-width:auto grid-item default that caused the Civic
            mobile-overflow closure earlier this session). */}
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
          <DemoControls />
          <FundingCalculator />
          <ImpactForecaster onChange={setKpi} />
          <CompliancePack />
        </div>

        <aside style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
          <GrantBrief forecasterKpi={kpi || {}} programType={mode} />
          <RewardsMarketplace />
          <CaseloadTable />
        </aside>
      </div>
    </section>
  );
}
