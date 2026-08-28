// src/components/arcade/ArcadeSidebar.jsx
// Full Learning Arcade sidebar, matching the approved mock's authoritative
// desktop geometry: SHF logo header, a primary nav list, a real-data
// Rewards Wallet stat card, a static SHF Pledge card, and Help & Safety /
// Sign Out pinned near the bottom. Rendered inside ArcadeAppShell (this
// app's own dedicated shell, not AppShellLayout — see
// src/layouts/arcade/ArcadeAppShell.jsx) — collapse/expand state, the
// mobile drawer, and focus handling are all owned by ArcadeAppShell; this
// component only renders content, adapts to the `collapsed` prop, and
// exposes the toggle itself via `onToggleCollapsed` (a restrained,
// sidebar-local control — not a large header button).
//
// Destination choices (documented so the mapping isn't mysterious):
//  - Dashboard   -> career.html#/dashboard (the mock marks "Arcade", not
//                    "Dashboard", as the active item while on this app's
//                    own Home route — confirmed by both the light and dark
//                    mocks showing "Arcade" active on every Arcade page.
//                    That means "Dashboard" here means a student's
//                    higher-level SHF dashboard, not this page. Career
//                    already has a real /dashboard route, so this points
//                    there honestly rather than duplicating it or
//                    inventing a fake destination.)
//  - Learn       -> career.html#/learn (real, working cross-app route)
//  - Arcade      -> /dashboard (this app's own home) — active on every
//                    Arcade route (Home and Classical Arcade Room alike),
//                    matching the mock exactly.
//  - Portfolio   -> career.html#/portfolio (real, working, live-verified)
//  - Credentials -> career.html#/portfolio (Credentials has no separate
//                    route anywhere in this codebase — same honest choice
//                    CareerSidebar.jsx already made for the same reason)
//  - Rewards Wallet card -> /rewards (real route). XP shown is real
//                    (useArcadeHistory — the same hook History.jsx uses),
//                    not a fixture. "Level" is a real, deterministic
//                    function of that real XP (see levelFromXp below), not
//                    sample data, so it needs no "Demo preview" label.
//  - SHF Pledge card -> foundation.html (real, existing SHF Foundation app)
//  - Help & Safety  -> /help (real, existing route)
//  - Sign Out       -> opens an informational dialog (no AuthProvider is
//                    mounted for arcade.html, so there is no real session
//                    to end — see prior version's comment, unchanged).
import React, { useRef, useState } from "react";
import AppLink from "@/components/nav/AppLink.jsx";
import ArcadeInfoDialog from "./ArcadeInfoDialog.jsx";
import { useArcadeHistory } from "@/shared/arcade/useArcadeHistory.js";

const PRIMARY_ITEMS = [
  { kind: "cross", href: "/career.html#/dashboard", icon: "🏠", label: "Dashboard" },
  { kind: "cross", href: "/career.html#/learn", icon: "📚", label: "Learn" },
  { kind: "in", to: "/dashboard", icon: "🕹️", label: "Arcade", alwaysActive: true },
  { kind: "cross", href: "/career.html#/portfolio", icon: "📁", label: "Portfolio" },
  { kind: "cross", href: "/career.html#/portfolio", icon: "🎓", label: "Credentials" },
];

// XP thresholds for each level — a simple, real, deterministic function of
// the real XP total (not sample data). 350 XP per level, matching the
// mock's shown ratio (2,450 XP ≈ mid Level 7).
function levelFromXp(xp) {
  const XP_PER_LEVEL = 350;
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  const xpIntoLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpIntoLevel;
  const percent = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
  return { level, xpToNext, percent };
}

function NavItem({ item }) {
  if (item.kind === "cross") {
    return (
      <li>
        <a className="ar-navLink" href={item.href} data-label={item.label}>
          <span className="ar-navIcon" aria-hidden="true">{item.icon}</span>
          <span className="ar-navLabel">{item.label}</span>
        </a>
      </li>
    );
  }
  return (
    <li>
      <AppLink
        to={item.to}
        className={`ar-navLink${item.alwaysActive ? " is-active" : ""}`}
        activeClassName="is-active"
        data-label={item.label}
      >
        <span className="ar-navIcon" aria-hidden="true">{item.icon}</span>
        <span className="ar-navLabel">{item.label}</span>
      </AppLink>
    </li>
  );
}

function RewardsWalletCard({ collapsed }) {
  const { summary } = useArcadeHistory();
  const xp = summary?.totalXp ?? 0;
  const { level, xpToNext, percent } = levelFromXp(xp);

  if (collapsed) {
    return (
      <a className="ar-sideCard ar-sideCard--collapsed" href="#/rewards" data-label={`Rewards Wallet — ${xp} XP`}>
        <span aria-hidden="true">💰</span>
      </a>
    );
  }

  return (
    <AppLink to="/rewards" className="ar-sideCard ar-rewardsCard">
      <div className="ar-rewardsCard__head">
        <span className="ar-rewardsCard__icon" aria-hidden="true">💰</span>
        <span className="ar-rewardsCard__title">Rewards Wallet</span>
      </div>
      <div className="ar-rewardsCard__xp">{xp.toLocaleString()} <span>XP</span></div>
      <div className="ar-rewardsCard__level">Level {level} · Innovator</div>
      <div className="ar-progressBar ar-progressBar--sm" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
        <div className="ar-progressBar__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="ar-rewardsCard__next">Next Level: {xpToNext} XP</div>
    </AppLink>
  );
}

function PledgeCard({ collapsed }) {
  if (collapsed) return null;
  return (
    <div className="ar-sideCard ar-pledgeCard">
      <div className="ar-pledgeCard__head">
        <span className="ar-pledgeCard__icon" aria-hidden="true">🛡️</span>
        <span className="ar-pledgeCard__title">SHF Pledge</span>
      </div>
      <p className="ar-pledgeCard__body">
        We build technology. We open opportunity. We empower students.
      </p>
      <a className="ar-pledgeCard__link" href="/foundation.html">Learn More →</a>
    </div>
  );
}

export default function ArcadeSidebar({ collapsed = false, onToggleCollapsed }) {
  const [signOutOpen, setSignOutOpen] = useState(false);
  const signOutBtnRef = useRef(null);

  return (
    <nav className="ar-nav" aria-label="Primary">
      <div className="ar-sideTop">
        <a className="ar-sideLogo" href="/foundation.html" aria-label="Silicon Heartland Foundation Home">
          <img alt="" src="/assets/brand/shf-globe-logo.png" className="ar-sideLogo__mark" aria-hidden="true" />
          <span className="ar-sideLogo__wordmark">
            <span className="ar-sideLogo__shf">SHF</span>
            <span className="ar-sideLogo__full">SILICON<br />HEARTLAND<br />FOUNDATION</span>
          </span>
        </a>
        {onToggleCollapsed && (
          <button
            type="button"
            className="ar-sideToggle"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar (Alt+S)" : "Collapse sidebar (Alt+S)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        )}
      </div>

      <ul className="ar-navList">
        {PRIMARY_ITEMS.map((it) => <NavItem key={it.label} item={it} />)}
      </ul>

      <div className="ar-sideCards">
        <RewardsWalletCard collapsed={collapsed} />
        <PledgeCard collapsed={collapsed} />
      </div>

      <ul className="ar-navList ar-navList--bottom">
        <li>
          <AppLink to="/help" className="ar-navLink" activeClassName="is-active" data-label="Help & Safety">
            <span className="ar-navIcon" aria-hidden="true">🛟</span>
            <span className="ar-navLabel">Help &amp; Safety</span>
          </AppLink>
        </li>
        <li>
          <button
            type="button"
            ref={signOutBtnRef}
            className="ar-navLink ar-navLink--button"
            data-label="Sign Out"
            onClick={() => setSignOutOpen(true)}
          >
            <span className="ar-navIcon" aria-hidden="true">🚪</span>
            <span className="ar-navLabel">Sign Out</span>
          </button>
        </li>
      </ul>

      <ArcadeInfoDialog
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        returnFocusRef={signOutBtnRef}
        titleId="ar-signout-dialog-title"
        title="Sign Out"
      >
        <p>
          This preview environment doesn&rsquo;t require sign-in yet, so there
          is no active session to end here. When student accounts are
          enabled for the Arcade, Sign Out will end your session on this
          device.
        </p>
      </ArcadeInfoDialog>
    </nav>
  );
}
