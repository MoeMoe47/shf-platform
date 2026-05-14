import React, { useEffect, useMemo, useState } from "react";
import "./shs-workspace-dashboard.css";

import DashboardRail from "./components/DashboardRail";
import DashboardHeader from "./components/DashboardHeader";
import KpiStrip from "./components/KpiStrip";
import DashboardPanel from "./components/PanelView";
import BottomDock from "./components/BottomDock";
import { normalizeDashboardPanel, readStoredProfile } from "./dashboardUtils";

import InstitutionalFooter from "@/components/shared/InstitutionalFooter.jsx";
export default function SHSWorkspaceDashboard() {
  const [activePanel, setActivePanel] = useState(() => {
    if (typeof window === "undefined") return "Overview";
    return normalizeDashboardPanel(localStorage.getItem("shs.dashboard.activePanel") || "Overview");
  });
  const [profile, setProfile] = useState(() => ({
    name: "Alex Morgan",
    role: "Senior Analyst",
    clearanceLevel: "Tier 3 - High",
    ...readStoredProfile(),
  }));

  const shellProfile = useMemo(() => profile, [profile]);

  function selectDashboardPanel(panel) {
    const nextPanel = normalizeDashboardPanel(panel);

    setActivePanel(nextPanel);

    if (typeof window !== "undefined") {
      localStorage.setItem("shs.dashboard.activePanel", nextPanel);
      window.dispatchEvent(new CustomEvent("shsDash:panelChange", { detail: nextPanel }));
    }
  }


  useEffect(() => {
    function handlePanelEvent(event) {
      if (event?.detail) selectDashboardPanel(event.detail);
    }

    window.addEventListener("shsDash:setPanel", handlePanelEvent);
    return () => window.removeEventListener("shsDash:setPanel", handlePanelEvent);
  }, []);

  return (
    <div className="shsDash-shell">

      <div className="shs-workspace-official-brand">
        <div className="shs-workspace-official-brand__mark">
          <img src="/assets/shs/shs-logo-mark.svg" alt="Silicon Heartland Solutions" />
        </div>
        <div className="shs-workspace-official-brand__text">
          <h1>Silicon Heartland Solutions</h1>
          <span>Workspace Dashboard</span>
        </div>
      </div>

      <DashboardRail activePanel={activePanel} setActivePanel={selectDashboardPanel} />

      <section className="shsDash-workspace">
        <DashboardHeader profile={shellProfile} />
        <KpiStrip />

        <DashboardPanel
          activePanel={activePanel}
          profile={profile}
          setProfile={setProfile}
        />

        <BottomDock />
      </section>
    
      <InstitutionalFooter
        logoSrc="/assets/shs/shs-logo-mark.svg"
        version="Workspace Dashboard V1"
        env="Local / Development"
      />

</div>
  );
}
