import React from "react";
import { NavLink } from "react-router-dom";
import AppLink from "@/components/nav/AppLink.jsx";

const navClass = ({ isActive }) =>
  isActive ? "adm-navLink is-active" : "adm-navLink";

const SECTIONS = [
  {
    title: "Production Ops",
    items: [
      { to: "/ops/production", icon: "▣", label: "Production" },
      { to: "/ops/projects", icon: "◇", label: "Projects" },
      { to: "/ops/brand-profile", icon: "◈", label: "Brand Profile" },
      { to: "/ops/page-intent", icon: "→", label: "Page Intent" },
      { to: "/ops/layout-blueprint", icon: "□", label: "Layout Blueprint" },
      { to: "/ops/visual-treatment", icon: "◐", label: "Visual Treatment" },
      { to: "/ops/assets", icon: "◧", label: "Assets" },
      { to: "/ops/data-binding", icon: "≡", label: "Data Binding" },
      { to: "/ops/mock-review", icon: "✓", label: "Mock Review" },
      { to: "/ops/build-packet", icon: "▤", label: "Build Packet" },
      { to: "/ops/screenshot-qa", icon: "◫", label: "Screenshot QA" },
      { to: "/ops/launch-workflow", icon: "L", label: "Launch Workflow" },
      { to: "/ops/reports", icon: "▥", label: "Reports Command" },
      { to: "/ops/learning", icon: "↻", label: "Learning" }
    ]
  },
  {
    title: "Operations",
    items: [
      { to: "/command", icon: "⌘", label: "Command Center" },
      { to: "/dashboard", icon: "▦", label: "Dashboard" },
      { to: "/reports", icon: "▤", label: "Reports" },
      { to: "/ops/reports/history", icon: "H", label: "Report History" },
      { to: "/builder", icon: "▥", label: "Website Studio" },
      { to: "/builder/tools", icon: "🧰", label: "Tool Dashboard" },
      { to: "/admin", icon: "🛡️", label: "Admin Home", end: true },
      { to: "/admin/users", icon: "👥", label: "Users" },
      { to: "/admin/settings", icon: "⚙️", label: "Settings" }
    ]
  },
  {
    title: "Analytics",
    items: [
      { to: "/analytics", icon: "📊", label: "App Analytics" },
      { to: "/lord-outcomes", icon: "🏁", label: "Lord of Outcomes" }
    ]
  },
  {
    title: "System",
    items: [
      { to: "/registry", icon: "R", label: "Registry" },
      { to: "/truth-spine", icon: "T", label: "Truth Spine", badge: "V1" },
      { to: "/oracle", icon: "O", label: "Oracle", badge: "V1" },
      { to: "/ai-guardrails", icon: "A", label: "AI Guardrails", badge: "V1" },
      { to: "/game-theory", icon: "G", label: "Game Theory", badge: "V1" },
      { to: "/agent-fabric", icon: "F", label: "Agent Fabric", badge: "V1" },
      { to: "/dev/docs", icon: "📚", label: "Docs" },
      { to: "/health", icon: "💚", label: "Health", badge: "NEW" }
    ]
  }
];

const Item = ({ to, icon, label, end, badge }) => (
  <li className="adm-navItem">
    <NavLink to={to} end={end} className={navClass}>
      <span className="adm-ico">{icon}</span>
      <span className="adm-label">{label}</span>
      {badge && <span className="adm-badge">{badge}</span>}
    </NavLink>
  </li>
);

export default function AdminSidebar() {
  return (
    <aside className="adm-rail">
      <div className="adm-top">
        <div className="adm-title">Admin</div>
        <div className="adm-sub">Control Center</div>
      </div>

      <nav className="adm-nav">
        {SECTIONS.map(section => (
          <div className="adm-section" key={section.title}>
            <div className="adm-sectionTitle">{section.title}</div>
            <ul className="adm-list">
              {section.items.map(item => (
                <Item key={item.to} {...item} />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="adm-bottom">
        <AppLink to="/" className="adm-homeBtn">
          <span className="adm-ico">⬅️</span>
          <span className="adm-label">Back to Home</span>
        </AppLink>
      </div>
    </aside>
  );
}
