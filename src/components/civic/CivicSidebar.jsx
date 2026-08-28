// src/components/civic/CivicSidebar.jsx
// Civic Lab's primary navigation. Rendered inside CivicAppShell (this app's
// own dedicated shell) — collapse/expand state, the mobile drawer, and
// focus handling are all owned by CivicAppShell; this component only
// renders content, adapts to the `collapsed` prop, and exposes the toggle
// itself via `onToggleCollapsed` (a restrained, sidebar-local control).
//
// Every destination below is a real, routed Civic page (cross-checked
// against src/router/CivicRoutes.jsx) — no placeholder hrefs.
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";

const SECTIONS = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", icon: "🏠", label: "Dashboard" },
      { to: "/dashboard-ns", icon: "⭐", label: "Northstar Dashboard" },
    ],
  },
  {
    title: "Civic Tools",
    items: [
      { to: "/elections", icon: "🗳️", label: "Elections" },
      { to: "/proposals", icon: "📜", label: "Proposals" },
      { to: "/survey", icon: "📊", label: "Issue Survey" },
      { to: "/grant-story", icon: "📖", label: "Grant Story" },
      { to: "/debtclock", icon: "⏱️", label: "Debt Clock" },
      { to: "/treasury-sim", icon: "🏛️", label: "Treasury Simulator" },
      { to: "/snapshots", icon: "🗂️", label: "Treasury Snapshots" },
    ],
  },
  {
    title: "Learning",
    items: [
      { to: "/missions", icon: "🎯", label: "Missions" },
      { to: "/profile", icon: "🧭", label: "Profile Results" },
      { to: "/journal", icon: "📔", label: "Constitution Journal" },
      { to: "/badges", icon: "🎖️", label: "Badges" },
      { to: "/leaderboard", icon: "🏆", label: "Leaderboard" },
    ],
  },
  {
    title: "Your Stuff",
    items: [
      { to: "/notes", icon: "📝", label: "Notes" },
      { to: "/portfolio", icon: "💼", label: "Portfolio" },
      { to: "/rewards", icon: "🏅", label: "Rewards" },
      { to: "/settings", icon: "⚙️", label: "Settings" },
      { to: "/help", icon: "🛟", label: "Help" },
    ],
  },
];

function readPublicHandle() {
  try {
    const raw = localStorage.getItem("civic:privacy");
    const parsed = raw ? JSON.parse(raw) : null;
    const handle = parsed?.publicHandle;
    return typeof handle === "string" && handle.trim() ? handle.trim() : "";
  } catch {
    return "";
  }
}

function NavItem({ item }) {
  return (
    <li>
      <AppLink
        to={item.to}
        className="cv-navLink"
        activeClassName="is-active"
        data-label={item.label}
      >
        <span className="cv-navIcon" aria-hidden="true">{item.icon}</span>
        <span className="cv-navLabel">{item.label}</span>
      </AppLink>
    </li>
  );
}

export default function CivicSidebar({ collapsed = false, onToggleCollapsed }) {
  const [handle, setHandle] = React.useState(readPublicHandle);

  React.useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || e.key === "civic:privacy") setHandle(readPublicHandle());
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(() => setHandle(readPublicHandle()), 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  return (
    <nav className="cv-nav" aria-label="Civic Lab primary">
      <div className="cv-sideTop">
        <AppLink to="/dashboard" className="cv-brand" aria-label="Civic Lab home">
          <span className="cv-brand__mark" aria-hidden="true">🏛️</span>
          <span className="cv-brand__text">
            <span className="cv-brand__name">CIVIC LAB</span>
            <span className="cv-brand__tagline">PRACTICE. UNDERSTAND.<br />MAKE IMPACT.</span>
          </span>
        </AppLink>
        {onToggleCollapsed && (
          <button
            type="button"
            className="cv-sideToggle"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar (Alt+S)" : "Collapse sidebar (Alt+S)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        )}
      </div>

      <div className="cv-navScroll">
        {SECTIONS.map((section) => (
          <div className="cv-navSection" key={section.title}>
            <div className="cv-navSection__title">{section.title}</div>
            <ul className="cv-navList">
              {section.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="cv-sideProfile">
        <span className="cv-sideProfile__avatar" aria-hidden="true">🎓</span>
        <span className="cv-sideProfile__text">
          <span className="cv-sideProfile__name">{handle || "Civic Lab User"}</span>
          <span className="cv-sideProfile__role">Student</span>
        </span>
      </div>
    </nav>
  );
}
