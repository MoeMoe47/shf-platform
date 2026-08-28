// src/components/arcade/ArcadeHeader.jsx
// Arcade's own compact header — lives inside ArcadeAppShell's right column,
// so it naturally begins at the sidebar's right edge (x≈243-248px) rather
// than spanning the full viewport above the sidebar (AppShellLayout's
// topology, which this replaces — see ArcadeAppShell.jsx's header
// comment for the measured root cause).
//
// Deliberately does NOT render: the cross-app "Apps" switcher, a large
// labeled "Theme" button, or a large "Expand/Collapse sidebar" button —
// none of those appear in the approved mock's header. Theme stays fully
// functional as a compact icon-only trigger (ArcadeThemeSwitch, restyled
// — see arcade-shell.css's `.ar-themeSwitch--compact`); the sidebar
// toggle moves into the sidebar itself (a restrained location, per the
// authorized package), not the header.
import React from "react";
import ArcadeHeaderExtras from "./ArcadeHeaderExtras.jsx";

export default function ArcadeHeader({ mobileMenuOpen, onToggleMobileMenu, mobileMenuBtnRef }) {
  return (
    <header className="ar-shell__header">
      <button
        type="button"
        ref={mobileMenuBtnRef}
        className="ar-mobileMenuBtn"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        onClick={onToggleMobileMenu}
      >
        <span className="ar-mobileMenuBar" aria-hidden="true" />
        <span className="ar-mobileMenuBar" aria-hidden="true" />
        <span className="ar-mobileMenuBar" aria-hidden="true" />
      </button>

      <a className="ar-headerBrand" href="/arcade.html#/dashboard" aria-label="Learning Arcade Home">
        LEARNING ARCADE
      </a>

      <ArcadeHeaderExtras />
    </header>
  );
}
