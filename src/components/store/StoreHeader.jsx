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
import React from "react";
import StoreThemeSwitch from "./StoreThemeSwitch.jsx";
import AppSwitcher from "@/components/AppSwitcher.jsx";

function SearchIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BellIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
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
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef(null);

  React.useEffect(() => {
    if (!notifOpen) return;
    const onDocClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [notifOpen]);

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

        <div className="cs-notifWrap" ref={notifRef}>
          <button
            type="button"
            className="cs-iconBtn"
            aria-haspopup="true"
            aria-expanded={notifOpen}
            aria-label="Notifications"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <BellIcon />
          </button>
          {notifOpen && (
            <div className="cs-notifPanel" role="dialog" aria-label="Notifications">
              <p className="cs-notifEmpty">You're all caught up — no new notifications.</p>
            </div>
          )}
        </div>

        <AppSwitcher currentApp="store" />
      </div>
    </header>
  );
}
