// src/components/sales/SalesSidebar.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

export default function SalesSidebar({ collapsed = false, onNavigate }) {
  const linkClass = "sh-sidebarItem";
  return (
    <nav className="sh-sidebarNav" data-collapsed={collapsed ? "true" : "false"}>
      <ul className="sh-sidebarGroup">
        <li>
          <AppLink app="sales" to="/dashboard" className={linkClass} onClick={onNavigate}>
            📊 <span className="cur-label">Dashboard</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/leads" className={linkClass} onClick={onNavigate}>
            📨 <span className="cur-label">Leads</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/pipeline" className={linkClass} onClick={onNavigate}>
            🛤️ <span className="cur-label">Pipeline</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/quotes" className={linkClass} onClick={onNavigate}>
            🧾 <span className="cur-label">Quotes</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/orders" className={linkClass} onClick={onNavigate}>
            🧺 <span className="cur-label">Orders</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/analytics" className={linkClass} onClick={onNavigate}>
            📈 <span className="cur-label">Analytics</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/settings" className={linkClass} onClick={onNavigate}>
            ⚙️ <span className="cur-label">Settings</span>
          </AppLink>
        </li>
      </ul>

      <div className="sh-sidebarSectionLabel">Docs</div>
      <ul className="sh-sidebarGroup">
        <li>
          <AppLink app="sales" to="/help" className={linkClass} onClick={onNavigate}>
            ❓ <span className="cur-label">Help</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/exports" className={linkClass} onClick={onNavigate}>
            ⬇️ <span className="cur-label">Exports</span>
          </AppLink>
        </li>
      </ul>
    </nav>
  );
}
