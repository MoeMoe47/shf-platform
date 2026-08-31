// src/layouts/store/StoreCatalogShell.jsx
//
// New sidebar+header application shell for the Store app's Catalog page
// only — see src/router/StoreRoutes.jsx: `/catalog` is now a sibling
// route outside the existing <StoreLayout> (the old floating-pill-navbar
// shell, unchanged), so Marketplace/Verify/My Items/FAQ/About keep their
// current, already-live appearance exactly as-is. This mirrors the
// proven collapse/mobile-drawer/focus-trap pattern already established
// in src/layouts/arcade/ArcadeAppShell.jsx (copied, not imported — Store
// and Arcade are separate bundles) rather than inventing a new one.
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import StoreSidebar from "@/components/store/StoreSidebar.jsx";
import SHFFooter from "@/components/shared/SHFFooter.jsx";
import "@/styles/store-catalog.css";

const COLLAPSE_KEY = "store.sidebar.collapsed";

function readCollapsed() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "false");
    return typeof parsed === "boolean" ? parsed : false;
  } catch {
    return false;
  }
}

export default function StoreCatalogShell({ children }) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const sidebarRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const preOpenFocusRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

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
    // No data-app attribute here: store.html's own #root already carries
    // data-app="store" (that's how store.main.jsx finds its mount point).
    // Repeating the attribute on this div was the exact documented bug
    // ArcadeAppShell.jsx's own header comment warns about — a global
    // `[data-app]{display:flex;flex-direction:column}` rule (loaded by
    // app-shell.css) silently applies to ANY element carrying the
    // attribute, which collapsed this row layout (sidebar beside content)
    // into a column stack, pushing the header ~264px down and producing
    // the large blank area above "Catalog". Confirmed live via
    // getComputedStyle before fixing, not guessed.
    <div className="cs-shell">
      {mobileNavOpen && (
        <div className="cs-scrim" aria-hidden="true" onClick={() => setMobileNavOpen(false)} />
      )}
      <aside
        ref={sidebarRef}
        className={`cs-shell__sidebar${collapsed ? " is-collapsed" : ""}${mobileNavOpen ? " is-mobileOpen" : ""}`}
        aria-label="Primary"
      >
        {mobileNavOpen && (
          <button
            type="button"
            className="cs-drawerClose"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
        <StoreSidebar collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} />
      </aside>

      <div className="cs-shell__right">
        {React.cloneElement(children, { mobileNavOpen, onToggleMobileMenu: () => (mobileNavOpen ? setMobileNavOpen(false) : openMobileNav()), mobileMenuBtnRef })}
        <SHFFooter variant="store" />
      </div>
    </div>
  );
}
