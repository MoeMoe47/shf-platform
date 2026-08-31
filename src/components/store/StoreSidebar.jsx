// src/components/store/StoreSidebar.jsx
//
// Reuses the SAME visual sidebar system as Curriculum's approved shell
// (src/components/CurriculumSidebar.jsx) — same item list, same icon
// style, same grouping (Curriculum items, then an Instructor group),
// same collapse control, same bottom user card — per the approved
// Catalog mock and the explicit correction requiring this shell to be
// reused rather than reinvented.
//
// One real technical constraint made literal React-component reuse
// impossible: Curriculum and Store are separate Vite HTML entrypoints
// (curriculum.html / store.html), each with its own HashRouter. Importing
// CurriculumSidebar.jsx's actual <NavLink to="asl/dashboard"> items
// directly into Store's router would resolve against store.html's route
// tree, producing dead links (no such routes exist there) — the same
// "no fake/dead links" rule this whole project has enforced everywhere
// else. The resolution: every item that is genuinely a Curriculum page
// (Dashboard/Calendar/Portfolio/Lessons/Assignments/Live Sessions/
// Accessibility/Instructor/Master View/Live Session Access) is a real
// cross-app <a href="/curriculum.html#/..."> link — the same pattern
// SHFFooter.jsx and CurriculumSidebar's own footer already use for
// cross-app destinations. "Library" links to the one real (if thin)
// route that exists for it, /curriculum/library/lessons — not omitted,
// since a real route does resolve there, but noted honestly here as
// minimal. Only "Catalog" is a real in-app route, and is the active item.
import React from "react";
import { NavLink } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";

function HeartMark({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.6C.4 7 2.6 3.5 6.3 3.5c2.1 0 3.7 1.1 5.7 3.4C14 4.6 15.6 3.5 17.7 3.5 21.4 3.5 23.6 7 22 10.9c-2.5 5-10 9.6-10 9.6Z" />
    </svg>
  );
}

function Icon({ children }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
const DashboardIcon = () => <Icon><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>;
const CalendarIcon = () => <Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>;
const PortfolioIcon = () => <Icon><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></Icon>;
const LessonsIcon = () => <Icon><path d="M4 3.5A2.5 2.5 0 0 1 6.5 1H12v18H6.5A2.5 2.5 0 0 0 4 21.5V3.5Z" /><path d="M12 1h5.5A2.5 2.5 0 0 1 20 3.5V17a2.5 2.5 0 0 0-2.5-2.5H12" /></Icon>;
const AssignmentsIcon = () => <Icon><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z" /><path d="M8.5 12.5 10.5 14.5 15.5 9.5" /></Icon>;
const LibraryIcon = () => <Icon><path d="M4 19V5a2 2 0 0 1 2-2h2v18H6a2 2 0 0 1-2-2Z" /><path d="M12 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><path d="M18 7h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2" /></Icon>;
const CatalogIcon = () => <Icon><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 4v17" /></Icon>;
const AccessibilityIcon = () => <Icon><circle cx="12" cy="4" r="1.6" /><path d="M4 8h16M12 8v13M8 21l4-6 4 6M8 12l4 1.5L16 12" /></Icon>;
const InstructorIcon = () => <Icon><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20.5c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" /></Icon>;
const MasterViewIcon = () => <Icon><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Icon>;

const CURRICULUM_HOME = "/curriculum.html#/curriculum";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: DashboardIcon, href: `${CURRICULUM_HOME}/asl/dashboard` },
  { key: "calendar", label: "Calendar", Icon: CalendarIcon, href: `${CURRICULUM_HOME}/asl/calendar` },
  { key: "portfolio", label: "Portfolio", Icon: PortfolioIcon, href: `${CURRICULUM_HOME}/asl/portfolio` },
  { key: "lessons", label: "Lessons", Icon: LessonsIcon, href: `${CURRICULUM_HOME}/lessons` },
  { key: "assignments", label: "Assignments", Icon: AssignmentsIcon, href: `${CURRICULUM_HOME}/asl/assignments` },
  { key: "live-sessions", label: "Live Sessions", Icon: CalendarIcon, href: `${CURRICULUM_HOME}/live-sessions` },
  { key: "library", label: "Library", Icon: LibraryIcon, href: `${CURRICULUM_HOME}/library/lessons` },
  { key: "catalog", label: "Catalog", Icon: CatalogIcon, to: "/catalog" },
  { key: "accessibility", label: "Accessibility", Icon: AccessibilityIcon, href: `${CURRICULUM_HOME}/accessibility` },
];

const INSTRUCTOR_ITEMS = [
  { key: "instructor", label: "Instructor", Icon: InstructorIcon, href: `${CURRICULUM_HOME}/instructor` },
  { key: "master", label: "Master View", Icon: MasterViewIcon, href: `${CURRICULUM_HOME}/master` },
  { key: "live-sessions-admin", label: "Live Session Access", Icon: InstructorIcon, href: `${CURRICULUM_HOME}/live-sessions/admin` },
];

function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NavItem({ item, collapsed }) {
  const content = (
    <>
      <span className="cs-navIcon" aria-hidden="true"><item.Icon /></span>
      {!collapsed && <span className="cs-navLabel">{item.label}</span>}
    </>
  );
  if (item.to) {
    return (
      <NavLink to={item.to} className={({ isActive }) => `cs-navLink${isActive ? " is-active" : ""}`}>
        {content}
      </NavLink>
    );
  }
  return (
    <a className="cs-navLink" href={item.href}>
      {content}
    </a>
  );
}

export default function StoreSidebar({ collapsed = false, onToggleCollapsed }) {
  const { user, roles } = useEntitlements();
  const displayName = user?.name || "Dev User";
  const roleLabel = roles && roles[0] ? roles[0][0].toUpperCase() + roles[0].slice(1) : "Student";

  return (
    <nav className="cs-sidebar" aria-label="Silicon Heartland">
      <div className="cs-brand">
        <span className="cs-brandMark" aria-hidden="true">
          <HeartMark size={28} />
        </span>
        {!collapsed && <span className="cs-brandName">Silicon Heartland Foundation</span>}
        {onToggleCollapsed && (
          <button
            type="button"
            className="cs-brandToggle"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        )}
      </div>

      <div className="cs-navGroup">
        {!collapsed && <p className="cs-navGroupLabel">Curriculum</p>}
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} collapsed={collapsed} />
        ))}
      </div>

      <div className="cs-navGroup cs-navGroup--support">
        {!collapsed && <p className="cs-navGroupLabel">Instructor</p>}
        {INSTRUCTOR_ITEMS.map((item) => (
          <NavItem key={item.key} item={item} collapsed={collapsed} />
        ))}
      </div>

      <div className="cs-sidebarUser">
        <span className="cs-sidebarUser__avatar" aria-hidden="true">{initialsFor(displayName)}</span>
        {!collapsed && (
          <span className="cs-sidebarUser__text">
            <span className="cs-sidebarUser__name">{displayName}</span>
            <span className="cs-sidebarUser__role">{roleLabel}</span>
          </span>
        )}
      </div>
    </nav>
  );
}
