// src/components/store/StoreHeader.jsx
//
// Store's new page header, matching the approved Catalog mock's structure
// (title + subtitle on the left; search, theme, notifications, and the
// cross-app switcher on the right) — the same shape CurriculumHeader.jsx
// already establishes, adapted to Store's own theme mechanism
// (useStoreTheme, not Curriculum's). Small icons duplicated locally
// (not imported from curriculum/icons.jsx) per this repo's established
// convention of not cross-coupling one app's presentational atoms into
// another's bundle (see SHFFooter.jsx's own HeartMark comment for the
// same reasoning).
//
// NCA-3: the notification control is now the shared, canonical
// NotificationBell — previously a static "You're all caught up" panel
// with no backend call at all (see
// docs/architecture/NCA-0_SYSTEM_WIDE_NOTIFICATION_COMMUNICATION_ARCHITECTURE_AUDIT.md
// §6). It now shows the real recipient-scoped unread count and opens the
// real canonical inbox.
import React from "react";
import StoreThemeSwitch from "./StoreThemeSwitch.jsx";
import AppSwitcher from "@/components/AppSwitcher.jsx";
import NotificationBell from "@/components/shared/notifications/NotificationBell.jsx";

function SearchIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function StoreHeader({
  title = "Catalog",
  subtitle = "Discover programs, solutions, and add-ons from across the Silicon Heartland ecosystem.",
  query,
  onSearchChange,
  mobileMenuOpen,
  onToggleMobileMenu,
  mobileMenuBtnRef,
}) {
  return (
    <header className="cs-headerBar">
      <button
        type="button"
        ref={mobileMenuBtnRef}
        className="cs-mobileMenuBtn"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileMenuOpen}
        onClick={onToggleMobileMenu}
      >
        <span className="cs-mobileMenuBar" aria-hidden="true" />
        <span className="cs-mobileMenuBar" aria-hidden="true" />
        <span className="cs-mobileMenuBar" aria-hidden="true" />
      </button>

      <div className="cs-headerTitles">
        <h1 className="cs-h1">{title}</h1>
        {subtitle && <p className="cs-subtitle">{subtitle}</p>}
      </div>

      <div className="cs-headerControls">
        <div className="cs-search">
          <SearchIcon className="cs-searchIcon" />
          <label htmlFor="store-catalog-search" className="cs-srOnly">
            Search programs, products, add-ons
          </label>
          <input
            id="store-catalog-search"
            type="search"
            className="cs-searchInput"
            placeholder="Search programs, products, add-ons..."
            value={query}
            onChange={(e) => onSearchChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        <StoreThemeSwitch />

        <NotificationBell className="cs-notifWrap" inboxHref="/notifications" />

        <AppSwitcher currentApp="store" />
      </div>
    </header>
  );
}
