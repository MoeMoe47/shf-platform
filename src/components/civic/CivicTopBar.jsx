// src/components/civic/CivicTopBar.jsx
// Civic Lab's shared top bar. Lives inside CivicAppShell's right column, so
// it naturally begins at the sidebar's right edge on desktop/tablet and
// spans full width with a hamburger trigger on mobile (<768px).
//
// Left: "Civic Lab" wordmark + mobile hamburger.
// Right: Points (RewardsChip, real data), Northstar Dashboard link (real
// route), theme toggle (real, persists), Notifications (honest — no live
// feed exists yet, matches the same pattern already established for
// Arcade's ArcadeHeaderExtras.jsx rather than faking activity).
import React, { useRef, useState } from "react";
import CivicThemeSwitch from "./CivicThemeSwitch.jsx";
import CivicInfoDialog from "./CivicInfoDialog.jsx";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";

function CivicNotifications() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="cv-iconBtn"
        aria-label="Notifications, 0 new"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">🔔</span>
        <span className="cv-iconBtn__badge" aria-hidden="true">0</span>
      </button>
      <CivicInfoDialog
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
        titleId="cv-notifications-title"
        title="Notifications"
      >
        <p>
          There are no notifications yet — Civic Lab doesn&rsquo;t have a live
          notification feed wired up in this phase. This will show real
          activity (mission reminders, proposal updates, instructor
          feedback) once that system is built.
        </p>
      </CivicInfoDialog>
    </>
  );
}

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
        <CivicNotifications />
      </div>
    </header>
  );
}
