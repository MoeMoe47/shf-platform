// src/layouts/arcade/ArcadeAppShell.jsx
// ------------------------------------------------------------
// Arcade's own dedicated application shell — NOT AppShellLayout.
//
// ROOT CAUSE this replaces (found during the shell/density repair,
// confirmed by direct DOM measurement, not assumption): AppShellLayout's
// DOM topology is a full-width header ABOVE a body row that then contains
// the sidebar and main side by side (`.sh-header` at x=0,w=100%, then
// `.sh-shellBody` below it holding `.sh-sidebar` + `.sh-main`). Measured
// live: sidebar top was y=56 (below the header), not y=0. The approved
// Arcade mock's geometry is structurally different and incompatible with
// that topology — the sidebar must run the FULL viewport height starting
// at (0,0), with the header occupying only the area to its right
// (starting at x≈243-248px). No CSS restyle of AppShellLayout's existing
// DOM order can produce that; the sidebar-beside-header relationship has
// to be the outermost split, not the header-above-body one. Hence a
// dedicated shell, per the authorized package's explicit instruction not
// to "merely restyle the existing Courses shell."
//
// What IS reused (low-level, not visibly): the same proven collapse/
// mobile-drawer/focus-trap logic AppShellLayout uses (copied here, not
// imported, since Arcade must not visibly nest inside a second
// AppShellLayout instance), the same theme infrastructure
// (useArcadeTheme/ArcadeThemeSwitch), the same data hooks
// (useArcadeHistory), and the same accessibility primitives (focus
// trapping, Escape-to-close, aria-* patterns already proven in
// ArcadeInfoDialog.jsx).
//
// State ownership: sidebar-collapse state uses the key
// "arcade.sidebar.collapsed" — already Arcade-exclusive (confirmed live:
// Career uses "career.sidebar.collapsed" via the same `${app}.` prefix
// convention in AppShellLayout.jsx; the two keys never collided). Kept
// under this name rather than inventing a new one, per the authorized
// package's own preference to follow an existing appropriate convention
// when one exists. Mobile drawer open/closed state is local React state,
// not persisted — matches the existing convention elsewhere in the app.
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ArcadeSidebar from "@/components/arcade/ArcadeSidebar.jsx";
import ArcadeHeader from "@/components/arcade/ArcadeHeader.jsx";

const COLLAPSE_KEY = "arcade.sidebar.collapsed";

function readCollapsed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "false");
    return typeof parsed === "boolean" ? parsed : false;
  } catch {
    return false;
  }
}

const RAIL_TIER_QUERY = "(min-width: 900px) and (max-width: 1199.98px)";

function readRailTier() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(RAIL_TIER_QUERY).matches;
}

export default function ArcadeAppShell({ children }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // 900-1199.98px (tablet landscape / compact desktop) always renders a
  // compact icon rail — distinct from the >=1200px expanded desktop
  // sidebar and the <900px off-canvas drawer. This is a pure viewport-
  // driven render choice: it never reads or writes the collapse-toggle's
  // own persisted state (arcade.sidebar.collapsed), so the real desktop
  // expand/collapse preference is untouched above 1200px, and nothing
  // here can contaminate it.
  const [isRailTier, setIsRailTier] = useState(readRailTier);
  const sidebarRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const preOpenFocusRef = useRef(null);
  const location = useLocation();
  const effectiveCollapsed = isRailTier || collapsed;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(RAIL_TIER_QUERY);
    const onChange = () => setIsRailTier(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  // Cross-tab / external-write sync — if something else ever changes this
  // exact key (e.g. a future admin reset tool), reflect it, but nothing
  // else writes it today; this app's own toggle is the only writer.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === COLLAPSE_KEY) setCollapsed(readCollapsed());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
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
    // No data-app attribute here: arcade.html's own #root already carries
    // data-app="arcade" (that's how arcade.main.jsx finds its mount
    // point). Duplicating the attribute onto this div was a real bug,
    // found live: app-shell.css deliberately loads last and defines
    // `#root, [data-app] { display:flex; flex-direction:column }` for the
    // mount root's own baseline layout — matching that same attribute on
    // *this* div a second time silently forced it into a column flex
    // container too, collapsing the sidebar/header side-by-side layout
    // into a stacked one (confirmed via computed-style inspection, not
    // guessed).
    <div className="ar-shell">
      {mobileNavOpen && (
        <div className="ar-shell__scrim" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside
        ref={sidebarRef}
        className={`ar-shell__sidebar${effectiveCollapsed ? " is-collapsed" : ""}${mobileNavOpen ? " is-mobileOpen" : ""}`}
        aria-label="Primary"
      >
        {mobileNavOpen && (
          <button
            type="button"
            className="ar-drawerClose"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
        <ArcadeSidebar
          collapsed={effectiveCollapsed}
          onToggleCollapsed={isRailTier ? undefined : () => setCollapsed((v) => !v)}
        />
      </aside>

      <div className="ar-shell__right">
        <ArcadeHeader
          mobileMenuOpen={mobileNavOpen}
          onToggleMobileMenu={() => (mobileNavOpen ? setMobileNavOpen(false) : openMobileNav())}
          mobileMenuBtnRef={mobileMenuBtnRef}
        />
        {children}
      </div>
    </div>
  );
}
