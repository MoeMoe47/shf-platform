// src/layouts/AppShellLayout.jsx
import React from "react";
import ControlPlaneStrip from "@/components/platform/ControlPlaneStrip.jsx";
import { Outlet, useLocation } from "react-router-dom";
import ToastHub from "@/components/ToastHub.jsx";
import ThemeSwitch from "@/components/ThemeSwitch.jsx";
import AppSwitcher from "@/components/AppSwitcher.jsx";

const DEVTOOLS_KEY = "shf:devtools";

// Whether to show internal diagnostics (ControlPlaneStrip: DEV/LIVE mode,
// override counts, contract version). Deliberately NOT gated on
// import.meta.env.PROD/DEV alone — a student opening a development
// preview build must still see the plain student interface. Visibility is
// an explicit opt-in instead: append ?devtools=1 once (persisted to
// localStorage for that browser) to see it; ?devtools=0 turns it back
// off. Nobody sees it by default. This preserves the capability for
// authorized dev/admin use without deleting it or relying on build mode.
function readDevtoolsFlag() {
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("devtools");
    if (q === "1") { localStorage.setItem(DEVTOOLS_KEY, "1"); return true; }
    if (q === "0") { localStorage.removeItem(DEVTOOLS_KEY); return false; }
    return localStorage.getItem(DEVTOOLS_KEY) === "1";
  } catch {
    return false;
  }
}

export default function AppShellLayout({ app="app", Sidebar, title="App", headerRight, ThemeControl, brandLabel, children }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(`${app}.sidebar.collapsed`) || "false");
      return typeof parsed === "boolean" ? parsed : false; // validate: reject anything but a real boolean
    } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(`${app}.sidebar.collapsed`, JSON.stringify(collapsed)); } catch {}
  }, [app, collapsed]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setCollapsed(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const [showDevControls] = React.useState(readDevtoolsFlag);

  // ---- Mobile off-canvas navigation drawer ----
  // Below the shell's mobile breakpoint (840px, see index.css) the sidebar is
  // pulled out of the flex row via position:fixed so `.sh-main` gets the full
  // viewport width, and is shown/hidden as a drawer instead. This mirrors the
  // one other live, working mobile-drawer pattern in the app
  // (CurriculumLayout.jsx's `.ld-*` classes) rather than the unused legacy
  // `.app-*`/`drawer-open` CSS elsewhere in shell.css.
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const mobileMenuBtnRef = React.useRef(null);
  const sidebarRef = React.useRef(null);
  const preOpenFocusRef = React.useRef(null);
  const location = useLocation();

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // A page (e.g. Resume Builder's own compact header) can open this same
  // drawer without prop-drilling through <Outlet/> by clicking the real
  // hamburger button directly (`document.querySelector(".sh-mobileMenuBtn")`).
  // That keeps a single source of truth for the open state instead of a
  // second, independent drawer implementation.

  React.useEffect(() => {
    if (!mobileNavOpen) return;
    const node = sidebarRef.current;
    if (!node) return;
    const focusables = () =>
      Array.from(node.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileNavOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      (preOpenFocusRef.current || mobileMenuBtnRef.current)?.focus?.();
    };
  }, [mobileNavOpen]);

  const openMobileNav = () => {
    preOpenFocusRef.current = document.activeElement;
    setMobileNavOpen(true);
  };

  return (
    <div className="sh-shell" data-app={app}>
      <header className="sh-header app-header">
        <button
          type="button"
          ref={mobileMenuBtnRef}
          className="sh-mobileMenuBtn"
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileNavOpen}
          onClick={() => (mobileNavOpen ? setMobileNavOpen(false) : openMobileNav())}
        >
          <span className="sh-mobileMenuBar" aria-hidden="true" />
          <span className="sh-mobileMenuBar" aria-hidden="true" />
          <span className="sh-mobileMenuBar" aria-hidden="true" />
        </button>

        <div className="sh-brand app-brand">
          {/* Two-line "Silicon Heartland / Foundation" wordmark matches the
              approved mock's brand lockup exactly. The per-app name
              (formerly a visible "{title}" span here) isn't lost — it's
              still the accessible name of this very link (aria-label
              below) and is shown live in the App Switcher's "currently
              {App}" trigger, so removing the redundant visible text loses
              no capability, just matches the mock's cleaner brand block. */}
          <a className="brand-link" href={`/${app}.html#/`} aria-label={`${title} Home`}>
            {brandLabel ? (
              // Consuming app (e.g. Arcade) owns its own SHF logo/wordmark
              // elsewhere in its shell (Arcade renders it in the sidebar,
              // matching its approved mock) — this slot then shows the
              // app's own title text instead of duplicating that mark.
              <span className="brand-label">{brandLabel}</span>
            ) : (
              <>
                <img
                  alt="Silicon Heartland Foundation"
                  src="/assets/brand/shf-globe-logo.png"
                  className="brand-mark"
                />
                <span className="brand-wordmark" aria-hidden="true">
                  <span className="brand-wordmark-line">Silicon Heartland</span>
                  <span className="brand-wordmark-line">Foundation</span>
                </span>
              </>
            )}
          </a>
        </div>

        {/* Cross-app navigation consolidated into one accessible switcher
            (was a permanent row of 5 separate buttons — see AppSwitcher.jsx).
            Every destination it replaces is still reachable, just behind
            one control instead of always-on-screen. */}
        <AppSwitcher currentApp={app} />

        <div className="sh-headerActions" style={{display:"flex",gap:8,alignItems:"center"}}>
          {headerRight}
          {/* Locked shared-shell placement: one theme control, one location,
              immediately before the trailing utility control (there is no
              Profile/More in this header yet) — never duplicated per page
              or per breakpoint. See src/components/ThemeSwitch.jsx.
              ThemeControl lets a consuming app substitute its own scoped
              theme control (e.g. Arcade's ArcadeThemeSwitch, wired to its
              own per-app theme hook) instead of Career's; defaulting to the
              original <ThemeSwitch/> keeps every existing caller (Career)
              rendering exactly as before. */}
          {ThemeControl ? <ThemeControl /> : <ThemeSwitch />}
          <button
            className="sh-btn sh-btn--soft sh-sidebarToggle"
            aria-expanded={!collapsed}
            aria-controls="sh-sidebar-nav"
            title="Toggle sidebar (Alt+S)"
            onClick={() => setCollapsed(v => !v)}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
            <span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </button>
        </div>

      {/* Control Plane (internal diagnostics) — hidden from the
          student-facing experience by default; see readDevtoolsFlag()
          above. Capability preserved for authorized dev/admin use via
          ?devtools=1, not deleted. */}
      {showDevControls && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ControlPlaneStrip />
        </div>
      )}
</header>

      <div className="sh-shellBody">
        {mobileNavOpen && (
          <div className="sh-scrim is-visible" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />
        )}
        <aside
          id="sh-sidebar-nav"
          ref={sidebarRef}
          className={`sh-sidebar ${collapsed ? "is-collapsed" : ""} ${mobileNavOpen ? "is-mobileOpen" : ""}`}
          aria-label="Primary"
        >
          {Sidebar ? <Sidebar collapsed={collapsed} onToggle={setCollapsed} /> : null}
        </aside>

        <main id="main" className="sh-main app-main" role="main" aria-live="polite">
          {children ?? <Outlet />}
        </main>
      </div>

      <ToastHub />
    </div>
  );
}
