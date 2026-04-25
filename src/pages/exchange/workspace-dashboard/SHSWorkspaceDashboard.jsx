import React, { useEffect, useMemo, useState } from "react";
import "./shs-workspace-dashboard.css";

import DashboardRail from "./components/DashboardRail";
import DashboardHeader from "./components/DashboardHeader";
import KpiStrip from "./components/KpiStrip";
import DashboardPanel from "./components/PanelView";
import BottomDock from "./components/BottomDock";
import { readStoredProfile } from "./dashboardUtils";

export default function SHSWorkspaceDashboard() {
  const [activePanel, setActivePanel] = useState("Overview");
  const [profile, setProfile] = useState(() => ({
    name: "Alex Morgan",
    role: "Senior Analyst",
    clearanceLevel: "Tier 3 - High",
    ...readStoredProfile(),
  }));

  const shellProfile = useMemo(() => profile, [profile]);

  useEffect(() => {
    function handlePanelEvent(event) {
      if (event?.detail) setActivePanel(event.detail);
    }

    window.addEventListener("shsDash:setPanel", handlePanelEvent);
    return () => window.removeEventListener("shsDash:setPanel", handlePanelEvent);
  }, []);

  return (
    <div className="shsDash-shell">
      <DashboardRail activePanel={activePanel} setActivePanel={setActivePanel} />

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
    </div>
  );
}
