// src/components/CurriculumSidebar.jsx
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useEntitlements } from "@/context/EntitlementsContext.jsx";
import {
  DashboardIcon,
  CalendarIcon,
  PortfolioIcon,
  BookIcon,
  AssignmentsIcon,
  InstructorIcon,
  MasterViewIcon,
  SparkleIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartMark,
} from "@/components/curriculum/icons.jsx";

// Phase 5.5 Unified Learning Workspace: "Lessons" -> "Learning", now
// pointing at the course-first Learning landing (src/pages/curriculum/
// Learning.jsx) instead of the old flat MyLessons.jsx list. The old
// "lessons" path itself still exists as a redirect to "learning" (see
// CurriculumRoutes.jsx) for bookmark compatibility.
const CURRICULUM_ITEMS = [
  { key: "dashboard", label: "Dashboard", Icon: DashboardIcon, path: "asl/dashboard" },
  { key: "calendar", label: "Calendar", Icon: CalendarIcon, path: "asl/calendar" },
  { key: "portfolio", label: "Portfolio", Icon: PortfolioIcon, path: "asl/portfolio" },
  { key: "learning", label: "Learning", Icon: BookIcon, path: "learning" },
  { key: "assignments", label: "Assignments", Icon: AssignmentsIcon, path: "asl/assignments" },
  { key: "career", label: "Career", Icon: SparkleIcon, external: "/career.html#/dashboard" },
  // Phase 1 restoration (SHF Curriculum Infrastructure Audit §28-30): real
  // request/approval UI, previously unrouted anywhere in the app.
  { key: "live-sessions", label: "Live Sessions", Icon: CalendarIcon, path: "live-sessions" },
  { key: "studio", label: "Studio", Icon: SparkleIcon, path: "/studio" },
  // Phase 2B: real, previously-unmounted accessibility preferences.
  { key: "accessibility", label: "Accessibility", Icon: PortfolioIcon, path: "accessibility" },
];

const INSTRUCTOR_ITEMS = [
  { key: "instructor", label: "Instructor", Icon: InstructorIcon, path: "instructor/operations" },
  { key: "master", label: "Master View", Icon: MasterViewIcon, path: "master" },
  { key: "live-sessions-admin", label: "Live Session Access", Icon: InstructorIcon, path: "live-sessions/admin" },
  { key: "curriculum-import", label: "Curriculum Import", Icon: InstructorIcon, path: "import" },
];

function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function CurriculumSidebar({ collapsed = false, onToggleCollapsed, onNavigate }) {
  const { user, roles } = useEntitlements();
  const location = useLocation();
  // Course Workspace (/curriculum/courses/*) is reached from Learning, so
  // it should read as part of the same nav destination rather than
  // leaving the sidebar with nothing highlighted once a student drills
  // into a course.
  const inCourseWorkspace = location.pathname.startsWith("/curriculum/courses/");
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
            {CURRICULUM_ITEMS.map(({ key, label, Icon, path, external }) => (
              <li key={key}>
                {path ? (
                  <NavLink
                    to={path.startsWith("/") ? path : `/curriculum/${path}`}
                    end={key !== "learning" && key !== "studio"}
                    onClick={onNavigate}
                    data-label={label}
                    className={({ isActive }) => `ld-navItem${isActive || (key === "learning" && inCourseWorkspace) || (key === "studio" && location.pathname.startsWith("/studio")) ? " is-active" : ""}`}
                  >
                    <Icon size={19} className="ld-navIcon" />
                    <span className="ld-navText">{label}</span>
                  </NavLink>
                ) : (
                  <a className="ld-navItem" href={external} onClick={onNavigate} data-label={label}>
                    <Icon size={19} className="ld-navIcon" />
                    <span className="ld-navText">{label}</span>
                  </a>
                )}
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
