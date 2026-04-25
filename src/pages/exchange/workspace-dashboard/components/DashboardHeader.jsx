import React from "react";
import { statusChips } from "../data/dashboardData";

export default function DashboardHeader({ profile }) {
  return (
    <header className="shsDash-header">
      <div className="shsDash-titleBlock">
        <h1>Silicon Heartland Solutions</h1>
        <p>Workspace Dashboard</p>
      </div>

      <div className="shsDash-statusChips">
        {statusChips.map(([icon, label, tone]) => (
          <article className={`shsDash-statusChip shsDash-glow--${tone}`} key={label}>
            <span>{icon}</span>
            <strong>{label}</strong>
          </article>
        ))}
      </div>

      <button className="shsDash-export" type="button">Export⌄</button>

      <div className="shsDash-user">
        <div>
          <strong>{profile.name || "Alex Morgan"}</strong>
          <small>{profile.role || "Senior Analyst"}</small>
        </div>

        <div className="shsDash-userAvatar">
          {profile.photoUrl ? <img src={profile.photoUrl} alt="" /> : <span>AM</span>}
          <i />
        </div>
      </div>
    </header>
  );
}
