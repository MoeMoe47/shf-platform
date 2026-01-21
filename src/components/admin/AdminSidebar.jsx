import React from "react";
import { NavLink } from "react-router-dom";
import AppLink from "@/components/nav/AppLink.jsx";

const navClass = ({ isActive }) =>
  isActive ? "adm-navLink is-active" : "adm-navLink";

const SECTIONS = [
  {
    title: "Operations",
    items: [
      { to: "/tool-dashboard", icon: "🧰", label: "Tool Dashboard" },
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
