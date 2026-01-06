// src/pages/sales/DemoDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import PageHeaderPortal from "@/components/sales/PageHeaderPortal.jsx";
import DemoControls, { useDemoPrefs } from "@/components/sales/DemoControls.jsx";
import ImpactForecaster from "@/components/sales/ImpactForecaster.jsx";
import GrantBrief from "@/components/sales/GrantBrief.jsx";
import CompliancePack from "@/components/sales/CompliancePack.jsx";
import RewardsMarketplace from "@/components/sales/RewardsMarketplace.jsx";
import CaseloadTable from "@/components/sales/CaseloadTable.jsx";

function useLangDict(lang="en"){
  return lang==="es" ? {
    title:"Demostración",
    sub:"Listo para presentar en minutos.",
    cta1:"Abrir Lección",
    cta2:"Abrir Quiz",
  } : {
    title:"Demo Dashboard",
    sub:"Presentation-ready in minutes.",
    cta1:"Open Lesson",
    cta2:"Open Quiz",
  };
}

export default function DemoDashboard(){
  const { sponsorView, mode, lang } = useDemoPrefs();
  const t = useLangDict(lang);
  const [kpi, setKpi] = React.useState(null);

  return (
    <>
      <PageHeaderPortal>
        <section className="lux-hero frost" style={{ paddingBottom: 16 }}>
          <div className="lux-heroL">
            <div className="lux-eyebrow">Solutions · Sales</div>
            <h1 className="lux-title">{t.title}{sponsorView ? " · Sponsor View" : ""}</h1>
            <p className="lux-sub">{t.sub} ({mode})</p>
            <div className="lux-cta">
              <Link to="/sales/demo-lesson" className="sh-btn">{t.cta1}</Link>
              <Link to="/sales/demo-quiz" className="sh-btn sh-btn--soft">{t.cta2}</Link>
            </div>
          </div>
        </section>
      </PageHeaderPortal>

      <section className="lux-page" style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
        <div style={{ display:"grid", gap:16 }}>
          <DemoControls />
          <ImpactForecaster onChange={setKpi} />
          <CompliancePack />
        </div>

        <aside style={{ display:"grid", gap:16 }}>
          <GrantBrief forecasterKpi={kpi||{}} programType={mode} />
          <RewardsMarketplace />
          <CaseloadTable />
        </aside>
      </section>
    </>
  );
}
