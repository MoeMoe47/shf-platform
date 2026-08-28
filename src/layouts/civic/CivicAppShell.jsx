// src/layouts/civic/CivicAppShell.jsx
// Civic's own responsive application shell, mirroring the proven pattern
// already established for Arcade (src/layouts/arcade/ArcadeAppShell.jsx):
// collapsible desktop sidebar, an auto-collapsed icon rail at tablet widths,
// and an off-canvas focus-trapped drawer on mobile. Breakpoints here are
// Civic's own (per the approved dashboard redesign spec), not copied
// verbatim from Arcade's:
//   >= 1200px   desktop — full sidebar, user-collapsible
//   768–1199px  tablet  — always the collapsed icon rail
//   < 768px     mobile  — sidebar hidden, hamburger + drawer
//
// State ownership: sidebar-collapse state uses "civic.sidebar.collapsed",
// following the repo's existing `${app}.sidebar.collapsed` convention
// (Arcade uses "arcade.sidebar.collapsed", Career uses
// "career.sidebar.collapsed" via AppShellLayout) rather than inventing a
// new preference system. Mobile drawer open/closed state is local React
// state, not persisted — matches the existing convention elsewhere.
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import CivicSidebar from "@/components/civic/CivicSidebar.jsx";
import CivicTopBar from "@/components/civic/CivicTopBar.jsx";

const COLLAPSE_KEY = "civic.sidebar.collapsed";

function readCollapsed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "false");
    return typeof parsed === "boolean" ? parsed : false;
  } catch {
    return false;
  }
}

const RAIL_TIER_QUERY = "(min-width: 768px) and (max-width: 1199.98px)";

function readRailTier() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(RAIL_TIER_QUERY).matches;
}

export default function CivicAppShell({ children }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // 768-1199.98px always renders the compact icon rail, distinct from the
  // >=1200px expanded desktop sidebar and the <768px off-canvas drawer —
  // a pure viewport-driven render choice that never reads/writes the
  // collapse-toggle's own persisted state, so the real desktop
  // expand/collapse preference is untouched above 1200px.
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
    <div className="cv-shell">
      {mobileNavOpen && (
        <div className="cv-shell__scrim" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside
        ref={sidebarRef}
        className={`cv-shell__sidebar${effectiveCollapsed ? " is-collapsed" : ""}${mobileNavOpen ? " is-mobileOpen" : ""}`}
        aria-label="Civic Lab primary navigation"
      >
        {mobileNavOpen && (
          <button
            type="button"
            className="cv-drawerClose"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
        <CivicSidebar
          collapsed={effectiveCollapsed}
          onToggleCollapsed={isRailTier ? undefined : () => setCollapsed((v) => !v)}
        />
      </aside>

      <div className="cv-shell__right">
        <CivicTopBar
          mobileMenuOpen={mobileNavOpen}
          onToggleMobileMenu={() => (mobileNavOpen ? setMobileNavOpen(false) : openMobileNav())}
          mobileMenuBtnRef={mobileMenuBtnRef}
        />
        {children}
      </div>
    </div>
  );
}
