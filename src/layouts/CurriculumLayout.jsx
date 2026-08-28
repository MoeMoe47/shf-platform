// src/layouts/CurriculumLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import CurriculumSidebar from "@/components/CurriculumSidebar.jsx";
import CurriculumHeader from "@/components/curriculum/CurriculumHeader.jsx";
import CurriculumFooter from "@/components/curriculum/CurriculumFooter.jsx";
import { markDarkScope } from "@/utils/curriculumTheme.js";

// Desktop Shell Correction pass (2026-08-27): collapse state follows the
// repo's existing `${app}.sidebar.collapsed` convention (Arcade uses
// "arcade.sidebar.collapsed", Civic uses "civic.sidebar.collapsed" via
// CivicAppShell.jsx) rather than inventing a new preference key/pattern.
// This is desktop-only — it never touches the existing <=860px mobile
// drawer (`mobileOpen` below), which is untouched.
const COLLAPSE_KEY = "curriculum.sidebar.collapsed";

function readCollapsed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "false");
    return typeof parsed === "boolean" ? parsed : false;
  } catch {
    return false;
  }
}

// Desktop Shell Dark-Mode Correction pass (2026-08-27): the previous
// header title logic used one static "Lessons · {inferred}" template for
// every non-dashboard route, which only ever made sense for the one
// route it was actually designed around (a curriculum-scoped lesson
// list) — everywhere else it produced nonsense like "Lessons · Lessons"
// (/curriculum/lessons), "Lessons · Live Sessions" (/curriculum/
// live-sessions), "Lessons · Accessibility" (/curriculum/accessibility).
// Replaced with real per-route titles, matched against the actual routes
// registered in CurriculumRoutes.jsx — no route derives from a curriculum
// id that doesn't exist in the URL, so nothing here hardcodes "ASL" as a
// stand-in for "whatever curriculum this is."
const ROUTE_TITLES = [
  { test: /\/curriculum\/asl\/dashboard\/?$/, title: "Learning Dashboard", subtitle: "Continue your pathway and stay on track." },
  { test: /^\/curriculum\/?$/, title: "Learning Dashboard", subtitle: "Continue your pathway and stay on track." },
  { test: /\/curriculum\/asl\/calendar\/?$/, title: "Calendar" },
  { test: /\/curriculum\/asl\/assignments\/?$/, title: "Assignments" },
  { test: /\/curriculum\/lessons\/?$/, title: "Lessons" },
  { test: /\/curriculum\/live-sessions\/admin\/?$/, title: "Live Session Access" },
  { test: /\/curriculum\/live-sessions\/manage\/?$/, title: "Live Sessions" },
  { test: /\/curriculum\/live-sessions\/?$/, title: "Live Sessions" },
  { test: /\/curriculum\/accessibility\/?$/, title: "Accessibility" },
  { test: /\/curriculum\/instructor\/?$/, title: "Instructor Guide" },
  { test: /\/curriculum\/instructor\/[^/]+\/?$/, title: "Instructor" },
  { test: /\/curriculum\/master\/?$/, title: "Master Index" },
  { test: /\/curriculum\/master\/[^/]+\/?$/, title: "Master View" },
  { test: /\/curriculum\/admin(\/[^/]+)?\/?$/, title: "Admin Compare" },
  { test: /\/curriculum\/library\/lessons\/?$/, title: "Lesson Library" },
  { test: /\/curriculum\/library\/lesson(\/[^/]+)?\/?$/, title: "Lesson" },
  { test: /\/curriculum\/lesson\/[^/]+\/?$/, title: "Lesson" },
  { test: /\/curriculum\/settings\/?$/, title: "Settings" },
  { test: /\/curriculum\/help\/?$/, title: "Help" },
];

// Fallback for any route not explicitly listed above (e.g. a future
// sidebar destination) — derives a plain title from the last real path
// segment instead of falling back to a fixed, possibly-wrong label.
function humanizeLastSegment(pathname = "") {
  const parts = pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1] || "curriculum";
  return last
    .replace(/[-_]+/g, " ")
    .split(" ")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

// AITutorButton and this file's own coachOpen state/Alt+C listener/local
// <CoachSlideOver/> mount are gone — Brainiact (mounted once, globally,
// via src/entries/RootProviders.jsx) is now the one visible companion/
// Coach trigger for both Curriculum and Career, opening the same
// CoachSlideOver via companion.openCoach(). The Coach chat capability
// itself is unchanged, only its visible trigger identity moved (see
// src/companion/CompanionProvider.jsx).
export default function CurriculumLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(readCollapsed);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The whole Curriculum shell now has real dark styling (see
  // curriculum-dashboard.css / curriculum-lesson.css's dark-mode blocks),
  // so shared cross-app chrome (Brainiact — src/styles/companion.css) can
  // safely go dark here too, per markDarkScope()'s "only paint pages that
  // actually support it" rule (see src/utils/curriculumTheme.js).
  React.useEffect(() => {
    markDarkScope("curriculum", true);
    return () => markDarkScope("curriculum", false);
  }, []);

  // The Student Portfolio page (shared with the Career app) renders its own
  // complete page header — skip the generic Curriculum one here so the two
  // don't stack, rather than duplicating Portfolio's title/search/pathway
  // logic in this shared layout.
  const isPortfolio = /\/curriculum\/asl\/portfolio\/?$/.test(pathname);
  // The Student Lesson Guided Experience (StudentUnit.jsx) renders its own
  // breadcrumb + lesson title inside the guided shell (matching the
  // approved mock, which has no generic page title above the lesson) — the
  // shared header still renders here for search/notifications/pathway,
  // just with no title/subtitle of its own.
  const isLessonExperience = /\/curriculum\/lessons\/[^/]+\/?$/.test(pathname);
  const matchedRoute = ROUTE_TITLES.find((r) => r.test.test(pathname));
  const headerCopy = isLessonExperience
    ? { title: "", subtitle: "" }
    : matchedRoute
    ? { title: matchedRoute.title, subtitle: matchedRoute.subtitle || "" }
    : { title: humanizeLastSegment(pathname), subtitle: "" };

  return (
    <div className="ld-shell">
      <a href="#curriculum-main" className="ld-skip">Skip to main content</a>

      <button
        type="button"
        className="ld-mobileMenuBtn"
        aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className="ld-mobileMenuBar" />
        <span className="ld-mobileMenuBar" />
        <span className="ld-mobileMenuBar" />
      </button>

      {mobileOpen && (
        <div
          className="ld-scrim"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`ld-sidebarWrap${mobileOpen ? " is-open" : ""}`}>
        <CurriculumSidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div className="ld-body">
        {!isPortfolio && <CurriculumHeader title={headerCopy.title} subtitle={headerCopy.subtitle} />}
        <main id="curriculum-main" className="ld-main" tabIndex={-1}>
          <Outlet />
        </main>
        <CurriculumFooter />
      </div>
    </div>
  );
}
