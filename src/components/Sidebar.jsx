// src/components/Sidebar.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

/**
 * RULE: Never mix NavLink + AppLink in the same item.
 * AppLink already uses NavLink internally when a Router exists.
 */

const Item = ({ to, icon, children, end = false }) => (
  <li>
    <AppLink
      to={to}
      end={end}
      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      aria-current={({ isActive }) => (isActive ? "page" : undefined)}
    >
      <span className="nav-icon" aria-hidden>{icon}</span>
      <span className="nav-label">{children}</span>
    </AppLink>
  </li>
);

export default function Sidebar() {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-brand">
        <img src="/logo-foundation.png" alt="" />
      </div>

      <div className="nav-section">
        <div className="nav-title">LEARN</div>
        <ul>
          <Item to="/dashboard"   icon="📊" end>Dashboard</Item>
          <Item to="/assignments" icon="📝">Assignments</Item>
          <Item to="/calendar"    icon="📅">Calendar</Item>
          <Item to="/portfolio"   icon="📁">Portfolio</Item>
        </ul>
      </div>

      <div className="nav-section">
        <div className="nav-title">CAREER</div>
        <ul>
          <Item to="/planner" icon="🧭">Planner</Item>
          <Item to="/explore" icon="🧭">Explore</Item>
        </ul>
      </div>
    </nav>
  );
}
