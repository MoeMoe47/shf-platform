// src/components/civic/CivicTopBar.jsx
// Civic Lab's shared top bar. Lives inside CivicAppShell's right column, so
// it naturally begins at the sidebar's right edge on desktop/tablet and
// spans full width with a hamburger trigger on mobile (<768px).
//
// Left: "Civic Lab" wordmark + mobile hamburger.
// Right: Points (RewardsChip, real data), Northstar Dashboard link (real
// route), theme toggle (real, persists), Notifications (NCA-3: the
// shared, canonical NotificationBell — real recipient-scoped backend
// data, replacing the previous static "0 new" placeholder dialog).
import React from "react";
import CivicThemeSwitch from "./CivicThemeSwitch.jsx";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import NotificationBell from "@/components/shared/notifications/NotificationBell.jsx";

export default function CivicTopBar({ mobileMenuOpen, onToggleMobileMenu, mobileMenuBtnRef }) {
  return (
    <header className="cv-shell__header">
      <button
        type="button"
        ref={mobileMenuBtnRef}
        className="cv-mobileMenuBtn"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        onClick={onToggleMobileMenu}
      >
        <span className="cv-mobileMenuBar" aria-hidden="true" />
        <span className="cv-mobileMenuBar" aria-hidden="true" />
        <span className="cv-mobileMenuBar" aria-hidden="true" />
      </button>

      <a className="cv-headerBrand" href="/civic.html#/dashboard" aria-label="Civic Lab Home">
        Civic Lab
      </a>

      <div className="cv-headerExtras">
        <RewardsChip className="cv-pointsChip" />
        <a className="cv-btn cv-btn--ghost cv-northstarLink" href="/civic.html#/dashboard-ns">
          <span aria-hidden="true">⭐</span>
          <span className="cv-northstarLink__label">Northstar Dashboard</span>
        </a>
        <CivicThemeSwitch />
        <NotificationBell className="cv-notifWrap" inboxHref="/notifications" />
      </div>
    </header>
  );
}
