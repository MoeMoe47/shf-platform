// src/components/CurriculumSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";
import {
  DashboardIcon,
  CalendarIcon,
  PortfolioIcon,
  LessonsIcon,
  AssignmentsIcon,
  InstructorIcon,
  MasterViewIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartMark,
} from "@/components/curriculum/icons.jsx";

const CURRICULUM_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: DashboardIcon, path: "asl/dashboard" },
  { key: "calendar", label: "Calendar", Icon: CalendarIcon, path: "asl/calendar" },
  { key: "portfolio", label: "Portfolio", Icon: PortfolioIcon, path: "asl/portfolio" },
  { key: "lessons", label: "Lessons", Icon: LessonsIcon, path: "lessons" },
  { key: "assignments", label: "Assignments", Icon: AssignmentsIcon, path: "asl/assignments" },
  // Phase 1 restoration (SHF Curriculum Infrastructure Audit §28-30): real
  // request/approval UI, previously unrouted anywhere in the app.
  { key: "live-sessions", label: "Live Sessions", Icon: CalendarIcon, path: "live-sessions" },
  // Phase 2B: real, previously-unmounted accessibility preferences.
  { key: "accessibility", label: "Accessibility", Icon: PortfolioIcon, path: "accessibility" },
];

const INSTRUCTOR_ITEMS = [
  { key: "instructor", label: "Instructor", Icon: InstructorIcon, path: "instructor" },
  { key: "master", label: "Master View", Icon: MasterViewIcon, path: "master" },
  { key: "live-sessions-admin", label: "Live Session Access", Icon: InstructorIcon, path: "live-sessions/admin" },
];

function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CurriculumSidebar({ collapsed = false, onToggleCollapsed, onNavigate }) {
  const { user, roles } = useEntitlements();
  const displayName = user?.name || "Michael Slate";
  const roleLabel = (roles && roles[0]) ? roles[0][0].toUpperCase() + roles[0].slice(1) : "Student";

  return (
    <nav className="ld-sidebar" data-collapsed={collapsed ? "true" : "false"} aria-label="Curriculum">
      <div className="ld-brand">
        <span className="ld-brandMark" aria-hidden="true">
          <HeartMark size={28} />
        </span>
        <span className="ld-brandName">Silicon Heartland Foundation</span>
        {onToggleCollapsed && !collapsed && (
          <button
            type="button"
            className="ld-brandToggle"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            title="Collapse sidebar (Alt+S)"
            aria-label="Collapse sidebar"
          >
            <ChevronLeftIcon size={15} />
          </button>
        )}
      </div>

      {onToggleCollapsed && collapsed && (
        <button
          type="button"
          className="ld-collapsedToggle"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          title="Expand sidebar (Alt+S)"
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon size={15} />
        </button>
      )}

      <div className="ld-navScroll">
        <div className="ld-navGroup">
          <div className="ld-navLabel">Curriculum</div>
          <ul className="ld-navList">
            {CURRICULUM_ITEMS.map(({ key, label, Icon, path }) => (
              <li key={key}>
                <NavLink
                  to={`/curriculum/${path}`}
                  end={key !== "lessons"}
                  onClick={onNavigate}
                  data-label={label}
                  className={({ isActive }) => `ld-navItem${isActive ? " is-active" : ""}`}
                >
                  <Icon size={19} className="ld-navIcon" />
                  <span className="ld-navText">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="ld-navDivider" role="separator" />

        <div className="ld-navGroup">
          <div className="ld-navLabel">Instructor</div>
          <ul className="ld-navList">
            {INSTRUCTOR_ITEMS.map(({ key, label, Icon, path }) => (
              <li key={key}>
                <NavLink
                  to={`/curriculum/${path}`}
                  onClick={onNavigate}
                  data-label={label}
                  className={({ isActive }) => `ld-navItem${isActive ? " is-active" : ""}`}
                >
                  <Icon size={19} className="ld-navIcon" />
                  <span className="ld-navText">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        className="ld-userCard"
        aria-haspopup="true"
        title={collapsed ? displayName : undefined}
      >
        <span className="ld-userAvatar" aria-hidden="true">{initialsFor(displayName)}</span>
        <span className="ld-userMeta">
          <span className="ld-userName">{displayName}</span>
          <span className="ld-userRole">{roleLabel}</span>
        </span>
        <ChevronDownIcon size={16} className="ld-userChevron" />
      </button>
    </nav>
  );
}
