// src/components/arcade/ArcadeTopNav.jsx
// The Learning Arcade's primary section tabs: Play / Learn / Create /
// My Studio / Showcase. Rendered once, in the shared ArcadeLayout header
// (not duplicated per page), so both authorized pages this phase
// (Learning Arcade Home, Classical Arcade Room) share the exact same tab
// row rather than each page building its own.
//
// Only Play and Learn are real destinations this phase. Create, My Studio,
// and Showcase are explicitly out of scope per the authorized package
// ("Do not implement the remaining planned screens yet") — rendered as
// real, fully operable buttons (deliberately not `disabled` or
// `aria-disabled`, since they DO perform a real action — opening an
// honest informational dialog — so marking them as disabled would
// contradict their actual behavior for assistive-tech users) with a
// visible "Coming soon" tag and a title attribute for extra context.
import React, { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLink from "@/components/nav/AppLink.jsx";
import ArcadeInfoDialog from "./ArcadeInfoDialog.jsx";

const PLAY_ROUTES = new Set(["/dashboard", "/classical-arcade"]);

const FUTURE_TABS = [
  {
    key: "create",
    label: "Create",
    icon: "</>",
    body: "Create is part of a future phase. It will let you start a new AI agent game or website project from here — nothing is built yet, and no project is created by this button.",
  },
  {
    key: "my-studio",
    label: "My Studio",
    icon: "</>",
    body: "My Studio is part of a future phase. It will hold your in-progress builds, agent versions, and drafts — nothing is stored yet, and this button does not create anything.",
  },
  {
    key: "showcase",
    label: "Showcase",
    icon: "🏆",
    body: "Showcase is part of a future phase, and publishing stays fail-closed until real instructor and safety review exists. This button does not publish or submit anything.",
  },
];

export default function ArcadeTopNav() {
  const location = useLocation();
  const playActive = PLAY_ROUTES.has(location.pathname);
  const [openTab, setOpenTab] = useState(null);
  const triggerRefs = useRef({});
  // Classical Arcade Room's approved mock has no visible "Coming soon"
  // pills in the top nav (Home's approved mock does, and Home's own
  // certified tests assert it stays visible there — see
  // "future top-nav tabs... are reachable and honestly labeled" in
  // tests/ui/arcade-learning-arcade.spec.mjs). The capability-honesty
  // requirement itself is unchanged either way: the button still performs
  // the same real action (opens an informational dialog), still isn't
  // `disabled`, and still exposes the same information — just via a
  // visually-hidden span here instead of a visible badge, so it doesn't
  // compete with the approved compact composition.
  const hideComingSoonBadge = location.pathname === "/classical-arcade";

  return (
    <nav className="ar-topNav" aria-label="Arcade sections">
      <ul className="ar-topNavList">
        <li>
          <AppLink
            to="/dashboard"
            className={`ar-topNavTab${playActive ? " is-active" : ""}`}
            aria-current={playActive ? "page" : undefined}
          >
            <span className="ar-topNavTab__icon" aria-hidden="true">▶</span>
            Play
          </AppLink>
        </li>
        <li>
          <a className="ar-topNavTab" href="/career.html#/learn">
            <span className="ar-topNavTab__icon" aria-hidden="true">📖</span>
            Learn
          </a>
        </li>
        {FUTURE_TABS.map((tab) => (
          <li key={tab.key}>
            <button
              type="button"
              ref={(el) => { triggerRefs.current[tab.key] = el; }}
              className="ar-topNavTab ar-topNavTab--future"
              title={`${tab.label} — coming in a future phase`}
              onClick={() => setOpenTab(tab.key)}
            >
              <span className="ar-topNavTab__icon" aria-hidden="true">{tab.icon}</span>
              {tab.label}
              {hideComingSoonBadge ? (
                <span className="ar-srOnly">, coming soon</span>
              ) : (
                <span className="ar-comingSoon">Coming soon</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      {FUTURE_TABS.map((tab) => (
        <ArcadeInfoDialog
          key={tab.key}
          open={openTab === tab.key}
          onClose={() => setOpenTab(null)}
          returnFocusRef={{ current: triggerRefs.current[tab.key] }}
          titleId={`ar-future-${tab.key}-title`}
          title={tab.label}
        >
          <p>{tab.body}</p>
        </ArcadeInfoDialog>
      ))}
    </nav>
  );
}
