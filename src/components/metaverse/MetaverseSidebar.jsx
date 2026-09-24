import React, { useEffect, useState } from "react";

const SIDEBAR_EXPANDED_STORAGE_KEY = "met-sidebar-expanded";

const STATUS_LABEL = {
  AVAILABLE: "Available",
  AWAY: "Away",
  DO_NOT_DISTURB: "Do not disturb",
  OFFLINE: "Appear offline",
};

function readStoredExpanded() {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_EXPANDED_STORAGE_KEY);
    return raw === null ? false : raw === "true";
  } catch {
    return false;
  }
}

function writeStoredExpanded(value) {
  try {
    window.localStorage.setItem(SIDEBAR_EXPANDED_STORAGE_KEY, value ? "true" : "false");
  } catch {
    // Private-browsing / storage-disabled — collapse preference just
    // won't persist across sessions. Not worth surfacing to the learner.
  }
}

// SLIM COLLAPSIBLE BLUE-FROST SIDEBAR V2 — PART 6: an optional
// `sublabel` (a static, non-data descriptive tagline, never real user/
// backend content) renders as a second, muted line under the primary
// label — matching the approved mock's two-line row treatment. Purely
// presentational: the accessible name (aria-label) and the collapsed-
// rail tooltip (data-tooltip) both still carry primary + sublabel
// together, so nothing is lost for keyboard/screen-reader users when
// the visual second line is hidden by the collapsed rail's label-clip.
function NavItem({ icon, label, sublabel, badge, dot, active, onClick, expanded }) {
  const accessibleName = sublabel ? `${label}, ${sublabel}` : label;
  return (
    <li>
      <button
        type="button"
        className="met-sidebar__item"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        aria-label={accessibleName}
        data-tooltip={accessibleName}
      >
        <span className="met-sidebar__item-icon" aria-hidden="true">{icon}</span>
        <span className="met-sidebar__item-text">
          <span className="met-sidebar__item-label">{label}</span>
          {sublabel ? <span className="met-sidebar__item-sublabel">{sublabel}</span> : null}
        </span>
        {expanded && dot ? <span className="met-sidebar__item-dot" aria-hidden="true" /> : null}
        {typeof badge === "number" && badge > 0 ? (
          <span className="met-sidebar__item-badge" aria-hidden="true">{badge > 9 ? "9+" : badge}</span>
        ) : null}
        {/* SIDEBAR VISUAL MATCH V3 — PART 8: a chevron on the active row
            only, matching the mock's "active item has an arrow" detail. */}
        {expanded && active ? <span className="met-sidebar__item-chevron" aria-hidden="true">{"›"}</span> : null}
      </button>
    </li>
  );
}

// MET-15J — canonical frosted sidebar. Organized by user intent (Home,
// Next Action, Explore, Missions, Opportunities, Me, More — then Chat,
// Settings) rather than backend system names. Collapses to a thin
// icon-only rail; the expand preference persists client-side only
// (localStorage) — no server authority involved.
export default function MetaverseSidebar({
  activeDrawerMode,
  navigatorOpen,
  missionsOpen,
  missionCount,
  opportunitiesOpen,
  opportunityCount,
  nextActionAvailable,
  totalOnline,
  status,
  chatUnreadCount,
  chatAvailable,
  onHome,
  onNextAction,
  onExplore,
  onMissions,
  onOpportunities,
  onMe,
  onChat,
  onSettings,
  moreContent,
  moreOpen,
  onToggleMore,
  devContent,
}) {
  // HARD VISUAL MATCH — PART 1: the sidebar defaults to COLLAPSED
  // (readStoredExpanded() returns false with nothing stored yet) —
  // exactly the scenario a fresh/clean browser profile hits on first
  // visit. That collapses away not just labels but the entire
  // Developer section with it, which is very likely the real root
  // cause behind "no visible DEV controls" reports. devContent is only
  // ever truthy when devModeEnabled is true (MetaverseCityPage.jsx), so
  // using it here forces an expanded start under ?metaverseDev=1
  // regardless of any stored collapse preference — a normal student
  // session (devContent null) keeps the real, unmodified preference.
  const [expanded, setExpanded] = useState(() => (devContent ? true : readStoredExpanded()));

  // Persisted only from the explicit toggle click below (not via an
  // effect reacting to every `expanded` change) — so the forced-true
  // dev-mode initial value above is never silently written back over a
  // real student's stored collapse preference just because the page
  // happened to mount with ?metaverseDev=1 once.
  const toggleExpanded = () => {
    setExpanded((value) => {
      const next = !value;
      writeStoredExpanded(next);
      return next;
    });
  };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && moreOpen) onToggleMore();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen, onToggleMore]);

  return (
    <nav
      className={`met-sidebar ${expanded ? "is-expanded" : ""}`}
      aria-label="Global systems"
      data-expanded={expanded ? "true" : "false"}
    >
      <button
        type="button"
        className="met-sidebar__toggle"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <span aria-hidden="true">{expanded ? "‹" : "›"}</span>
      </button>

      <div className="met-sidebar__logo-row">
        <span className="met-sidebar__logo-frame">
          <img
            className="met-sidebar__logo"
            src="/assets/metaverse/branding/silicon-heartland-metaverse-logo-white.png"
            alt="Silicon Heartland Metaverse"
          />
        </span>
      </div>

      {/* PART 3/7 — the primary nav is its own enclosed, brighter card
          (background+border+radius), not bare rows floating on the
          sidebar's base shell — matching the mock's segmented "main
          navigation stack" module. */}
      <ul className="met-sidebar__nav" aria-label="Primary">
        <NavItem icon="🏠" label="Home" sublabel="City Overview" active={false} onClick={onHome} expanded={expanded} />
        <NavItem
          icon="🎯"
          label="Next Action"
          sublabel="Your Next Step"
          active={activeDrawerMode === "NEXT_ACTION"}
          dot={nextActionAvailable}
          onClick={onNextAction}
          expanded={expanded}
        />
        <NavItem icon="📍" label="Explore" sublabel="Interactive City Map" active={navigatorOpen} onClick={onExplore} expanded={expanded} />
        <NavItem icon="🧭" label="Missions" sublabel="Your Next Actions" active={missionsOpen} badge={missionCount} onClick={onMissions} expanded={expanded} />
        <NavItem icon="💼" label="Opportunities" sublabel="Jobs, Internships, Events" active={opportunitiesOpen} badge={opportunityCount} onClick={onOpportunities} expanded={expanded} />
        <NavItem icon="👤" label="Me" sublabel="Profile & Status" active={activeDrawerMode === "PROFILE_DETAIL"} onClick={onMe} expanded={expanded} />
        <NavItem icon="☰" label="More" active={moreOpen} onClick={onToggleMore} expanded={expanded} />
      </ul>

      {/* VISUAL RECONCILIATION — the DEV Scene section (when
          devModeEnabled) renders HERE, immediately after the primary
          nav, unconditional on `moreOpen`/scroll position — it must be
          "visible without searching" the instant the sidebar is
          expanded, not buried inside the collapsible More panel. */}
      {expanded && devContent ? devContent : null}

      {expanded && moreOpen ? (
        <div className="met-sidebar__more-panel" role="region" aria-label="More systems">
          {moreContent}
        </div>
      ) : null}

      <ul className="met-sidebar__nav met-sidebar__nav--secondary" aria-label="Community and support">
        <NavItem
          icon="💬"
          label="Chat"
          sublabel="Messages & Support"
          active={activeDrawerMode === "CHAT"}
          badge={chatAvailable ? chatUnreadCount : undefined}
          onClick={onChat}
          expanded={expanded}
        />
        <NavItem icon="⚙️" label="Settings" sublabel="Account & Preferences" active={false} onClick={onSettings} expanded={expanded} />
      </ul>

      <div className="met-sidebar__user">
        <span className="met-sidebar__avatar" aria-hidden="true">
          SH
          <span className={`met-sidebar__presence-dot met-sidebar__presence-dot--${(status || "available").toLowerCase()}`} />
        </span>
        {expanded ? (
          <button type="button" className="met-sidebar__user-text met-sidebar__user-button" onClick={onMe} aria-label="Open profile and status">
            {/* Real presence data (unchanged) — the mock's own "Silicon
                Heartland / People · Innovation · Opportunity" org
                caption is decorative-only copy with no real backing
                data, so it's not a fair substitute for this genuine
                online-count/status readout. */}
            <p className="met-sidebar__user-online">{totalOnline} online &middot; {STATUS_LABEL[status] || "Available"}</p>
            <p className="met-sidebar__user-tagline">Silicon Heartland &middot; People &middot; Innovation</p>
          </button>
        ) : null}
      </div>

      {/* PART 10 — a dedicated, bordered/glowing card (not plain text),
          matching the mock's "Today's Focus" module. Static evergreen
          navigation copy, never personalized/fabricated data about the
          specific student; its chevron opens the real Explore panel
          (the same action the copy itself describes). Expanded only. */}
      {expanded ? (
        <button type="button" className="met-sidebar__focus-card" onClick={onExplore}>
          <span className="met-sidebar__focus-icon" aria-hidden="true">💡</span>
          <span className="met-sidebar__focus-text">
            <span className="met-sidebar__focus-title">Today&rsquo;s Focus</span>
            <span className="met-sidebar__focus-body">Explore districts, connect with classmates, and discover new opportunities.</span>
          </span>
          <span className="met-sidebar__focus-chevron" aria-hidden="true">{"›"}</span>
        </button>
      ) : null}

      {/* PART 11 — small decorative brand footer, matching the mock's
          bottom strip; purely presentational, hidden when collapsed
          since there's no room and nothing functional lives here. */}
      {expanded ? (
        <div className="met-sidebar__brand-strip" aria-hidden="true">
          <span className="met-sidebar__brand-strip-icon">📊</span>
          <span className="met-sidebar__brand-strip-text">A Brighter Tomorrow, Together.</span>
        </div>
      ) : null}
    </nav>
  );
}
