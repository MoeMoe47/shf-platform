// src/components/arcade/ArcadeHeaderExtras.jsx
// Header-right cluster for the Learning Arcade, rebuilt to match the
// approved mock's header geometry: search, notifications, and a student
// profile — with the cross-app "Apps" switcher trigger hidden for Arcade
// specifically (via arcade-shell.css, [data-app="arcade"] .app-switcher{
// display:none}) since the mock's header doesn't show one. Equivalent
// cross-app reach is preserved elsewhere in the shell instead: the sidebar
// already links to career.html#/dashboard, #/learn, #/portfolio, and the
// SHF Pledge card links to foundation.html — so no navigation capability is
// actually lost, only this one trigger's visible location changed.
//
// Honesty constraints (unchanged from the certified package):
//  - Search is a REAL, working quick-jump control (unchanged logic).
//  - Notifications has no live feed anywhere in this codebase, so it
//    honestly shows 0 and opens an informational dialog.
//  - Profile links to the real, working Student Portfolio route.
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArcadeInfoDialog from "./ArcadeInfoDialog.jsx";
import ArcadeThemeSwitch from "./ArcadeThemeSwitch.jsx";

const DESTINATIONS = [
  { to: "/dashboard", label: "Learning Arcade Home" },
  { to: "/classical-arcade", label: "Classical Arcade Room" },
  { to: "/games", label: "Explore Games" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/rewards", label: "Rewards Wallet" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/history", label: "Arcade Impact History" },
  { to: "/help", label: "Help & Safety" },
];

const COMPACT_SEARCH_QUERY = "(max-width: 599.98px)";

function ArcadeQuickSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  // Mobile tier (<=599.98px): no permanent 220px input in the header row —
  // the control starts as an icon-only trigger and reveals the real input
  // as an overlay bar under the header on demand (see .ar-quickSearch--
  // compactOpen in arcade-shell.css). Above that width the input is always
  // inline, same as before.
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(COMPACT_SEARCH_QUERY).matches : false
  );
  const [compactOpen, setCompactOpen] = useState(false);
  const listId = useId();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(COMPACT_SEARCH_QUERY);
    const onChange = () => {
      setIsCompact(mq.matches);
      if (!mq.matches) setCompactOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DESTINATIONS.filter((d) => d.label.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  const go = (to) => {
    navigate(to);
    setQuery("");
    setOpen(false);
    setCompactOpen(false);
  };

  const focusTriggerOnCloseRef = useRef(false);

  const closeCompact = () => {
    setCompactOpen(false);
    setQuery("");
    setOpen(false);
    // Not triggerRef.current?.focus() here directly: closing unmounts this
    // icon button's element and mounts a NEW one (the `isCompact &&
    // !compactOpen` branch below), so at the moment this handler runs,
    // triggerRef still points at the stale/about-to-unmount node (or null)
    // — React hasn't re-rendered yet. Deferred to the effect below, which
    // runs after the new trigger button has actually mounted.
    focusTriggerOnCloseRef.current = true;
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      if (isCompact && compactOpen) closeCompact();
      return;
    }
    if (e.key === "Enter" && matches.length) {
      e.preventDefault();
      go(matches[0].to);
    }
  };

  useEffect(() => {
    if (isCompact && compactOpen) {
      inputRef.current?.focus();
    } else if (isCompact && !compactOpen && focusTriggerOnCloseRef.current) {
      focusTriggerOnCloseRef.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [isCompact, compactOpen]);

  if (isCompact && !compactOpen) {
    return (
      <button
        type="button"
        ref={triggerRef}
        className="ar-iconBtn"
        aria-label="Search Arcade pages"
        onClick={() => setCompactOpen(true)}
      >
        <span aria-hidden="true">🔍</span>
      </button>
    );
  }

  return (
    <div className={`ar-quickSearch${isCompact ? " ar-quickSearch--compactOpen" : ""}`}>
      <label className="ar-srOnly" htmlFor="ar-quick-search-input">
        Search Arcade pages
      </label>
      {!isCompact && <span className="ar-quickSearch__icon" aria-hidden="true">🔍</span>}
      <input
        id="ar-quick-search-input"
        ref={inputRef}
        type="search"
        className="ar-quickSearch__input"
        placeholder="Search games, projects, skills, creators..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {isCompact && (
        <button type="button" className="ar-quickSearch__close" aria-label="Close search" onClick={closeCompact}>
          ✕
        </button>
      )}
      {open && matches.length > 0 && (
        <ul id={listId} className="ar-quickSearch__list" role="listbox">
          {matches.map((m) => (
            <li key={m.to} role="option" aria-selected="false">
              <button type="button" className="ar-quickSearch__option" onMouseDown={() => go(m.to)}>
                {m.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArcadeNotifications() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="ar-iconBtn"
        aria-label="Notifications, 0 new"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">🔔</span>
        <span className="ar-iconBtn__badge" aria-hidden="true">0</span>
      </button>
      <ArcadeInfoDialog
        open={open}
        onClose={() => setOpen(false)}
        returnFocusRef={triggerRef}
        titleId="ar-notifications-title"
        title="Notifications"
      >
        <p>
          There are no notifications yet — the Arcade doesn&rsquo;t have a
          live notification feed wired up in this phase. This will show
          real activity (instructor review updates, tournament reminders)
          once that system is built.
        </p>
      </ArcadeInfoDialog>
    </>
  );
}

function ArcadeProfileChip() {
  return (
    <a className="ar-profileChip" href="/career.html#/portfolio" aria-label="Jamie Rivera, Student — view your Portfolio">
      <span className="ar-profileChip__avatar" aria-hidden="true">🧑‍🚀</span>
      <span className="ar-profileChip__text">
        <span className="ar-profileChip__name">Jamie Rivera</span>
        <span className="ar-profileChip__role">Student</span>
      </span>
      <span className="ar-profileChip__chevron" aria-hidden="true">⌄</span>
    </a>
  );
}

export default function ArcadeHeaderExtras() {
  return (
    <div className="ar-headerExtras">
      <ArcadeQuickSearch />
      <ArcadeNotifications />
      <ArcadeThemeSwitch />
      <ArcadeProfileChip />
    </div>
  );
}
