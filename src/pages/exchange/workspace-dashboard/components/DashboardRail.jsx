import React from "react";
import { LOGO_SRC, navItems } from "../data/dashboardData";

export default function DashboardRail({ activePanel, setActivePanel }) {
  return (
    <aside className="shsDash-rail">
      <div className="shsDash-logo">
        <img src={LOGO_SRC} alt="Silicon Heartland Solutions" />
      </div>

      <nav>
        {navItems.map(([icon, label, tone]) => (
          <button
            key={label}
            className={`shsDash-navItem shsDash-glow--${tone} ${activePanel === label ? "is-active" : ""}`}
            type="button"
            onClick={() => setActivePanel(label)}
          >
            <span>{icon}</span>
            <small>{label}</small>
            {label === "Notifications" && <b>2</b>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
