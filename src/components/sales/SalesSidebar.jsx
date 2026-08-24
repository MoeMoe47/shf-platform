// src/components/sales/SalesSidebar.jsx
//
// Nav data (routes, order, icons) is this file's own real content — kept
// unchanged. Only the CSS classes are fixed: .sh-sidebarNav/.sh-sidebarGroup/
// .sh-sidebarItem/.sh-sidebarSectionLabel were never defined anywhere in
// the project (phantom classes — this sidebar rendered as raw unstyled
// links). Swapped for .crb-rail/.crb-link, the real, styled classes
// src/styles/sales-shell.css already defines for exactly this purpose
// (the same family used by the now-restored Civic sidebar's equivalent).
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

export default function SalesSidebar({ collapsed = false, onNavigate }) {
  const linkClass = "crb-link";
  return (
    <nav aria-label="Sales" data-collapsed={collapsed ? "true" : "false"}>
      <ul className="crb-rail">
        <li>
          <AppLink app="sales" to="/dashboard" className={linkClass} onClick={onNavigate}>
            📊 <span>Dashboard</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/leads" className={linkClass} onClick={onNavigate}>
            📨 <span>Leads</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/pipeline" className={linkClass} onClick={onNavigate}>
            🛤️ <span>Pipeline</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/proposals" className={linkClass} onClick={onNavigate}>
            📄 <span>Proposals</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/quotes" className={linkClass} onClick={onNavigate}>
            🧾 <span>Quotes</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/orders" className={linkClass} onClick={onNavigate}>
            🧺 <span>Orders</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/analytics" className={linkClass} onClick={onNavigate}>
            📈 <span>Analytics</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/demo" className={linkClass} onClick={onNavigate}>
            🧪 <span>Demo Hub</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/lesson" className={linkClass} onClick={onNavigate}>
            🎓 <span>Sales Lesson</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/settings" className={linkClass} onClick={onNavigate}>
            ⚙️ <span>Settings</span>
          </AppLink>
        </li>
      </ul>

      <ul className="crb-rail" style={{ marginTop: 16 }}>
        <li>
          <AppLink app="sales" to="/help" className={linkClass} onClick={onNavigate}>
            ❓ <span>Help</span>
          </AppLink>
        </li>
        <li>
          <AppLink app="sales" to="/exports" className={linkClass} onClick={onNavigate}>
            ⬇️ <span>Exports</span>
          </AppLink>
        </li>
      </ul>
    </nav>
  );
}
