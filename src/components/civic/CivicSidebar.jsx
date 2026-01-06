// src/components/civic/CivicSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function CivicSidebar() {
  return (
    <aside className="civic-sidebar">
      <nav className="civic-nav">

        <div className="civic-section">
          <div className="civic-section-title">Overview</div>
          <NavLink to="/dashboard" className="civic-link">Dashboard</NavLink>
          <NavLink to="/dashboard-ns" className="civic-link">Northstar Dashboard</NavLink>
        </div>

        <div className="civic-section">
          <div className="civic-section-title">Civic Tools</div>
          <NavLink to="/elections" className="civic-link">Elections</NavLink>
          <NavLink to="/proposals" className="civic-link">Proposals</NavLink>
          <NavLink to="/survey" className="civic-link">Issue Survey</NavLink>
          <NavLink to="/grant-story" className="civic-link">Grant Story</NavLink>
          <NavLink to="/debtclock" className="civic-link">Debt Clock</NavLink>
          <NavLink to="/treasury-sim" className="civic-link">Treasury Simulator</NavLink>
          <NavLink to="/snapshots" className="civic-link">Treasury Snapshots</NavLink>
        </div>

        <div className="civic-section">
          <div className="civic-section-title">Learning</div>
          <NavLink to="/missions" className="civic-link">Missions</NavLink>
          <NavLink to="/profile" className="civic-link">Profile Results</NavLink>
          <NavLink to="/journal" className="civic-link">Constitution Journal</NavLink>
          <NavLink to="/badges" className="civic-link">Badges</NavLink>
          <NavLink to="/leaderboard" className="civic-link">Leaderboard</NavLink>
        </div>

        <div className="civic-section">
          <div className="civic-section-title">Your Stuff</div>
          <NavLink to="/notes" className="civic-link">Notes</NavLink>
          <NavLink to="/portfolio" className="civic-link">Portfolio</NavLink>
          <NavLink to="/rewards" className="civic-link">Rewards</NavLink>
          <NavLink to="/settings" className="civic-link">Settings</NavLink>
          <NavLink to="/help" className="civic-link">Help</NavLink>
        </div>

      </nav>
    </aside>
  );
}
