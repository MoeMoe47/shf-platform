// src/components/career/CareerSidebar.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";
import WalletButton from "@/components/WalletButton.jsx";
import { loadResume, computeStrength, readinessLabel } from "@/pages/resume-builder/store.js";

const MORE_TOOLS_KEY = "career.sidebar.moreToolsExpanded";

const Item = ({ to, icon, children }) => (
  <li>
    {/* AppLink expects a plain string + activeClassName, not a NavLink-style
        render-prop function; passing a function here (as before) rendered
        the function's own source code as the literal class/aria-current
        attribute, so no sidebar item ever showed an active state. NavLink
        already sets aria-current="page" automatically, so it doesn't need
        to be passed explicitly at all.
        data-label carries the full label for the collapsed-rail hover/
        focus tooltip (career-shell.css); car-linkLabel below stays in the
        DOM (visually clipped when collapsed, not display:none) so the
        link's accessible name is never lost. */}
    <AppLink app="career" to={to} className="car-link" activeClassName="is-active" data-label={children}>
      <span className="car-linkIcon" aria-hidden>{icon}</span>
      <span className="car-linkLabel">{children}</span>
    </AppLink>
  </li>
);

const Section = ({ title, children }) => (
  <div className="car-navSection">
    <div className="car-navTitle">{title}</div>
    <ul className="car-list">{children}</ul>
  </div>
);

// The six primary Career destinations, always visible — matches the
// approved Resume Builder mock's sidebar. "Credentials" has no separate
// route of its own: CredentialsBadges already renders inside Portfolio
// (src/pages/career/portfolio-sections/CredentialsBadges.jsx), so it
// honestly points at the same real /portfolio route rather than a
// fabricated destination.
const PRIMARY_ITEMS = [
  { to: "/dashboard", icon: "📊", label: "Dashboard" },
  { to: "/learn", icon: "📚", label: "Learning" },
  { to: "/career/pathways", icon: "🧩", label: "Career Pathways" },
  { to: "/resume", icon: "📄", label: "Resume Builder" },
  { to: "/portfolio", icon: "📁", label: "Portfolio" },
  { to: "/portfolio", icon: "🎓", label: "Credentials" },
];

// "Career-readiness milestone" widget — matches the approved Resume
// Builder mock's sidebar card. Reuses the exact same `strength` data the
// Resume Builder page's own Strength meter and the (now-relocated)
// Career-readiness status chip used, computed independently here from the
// persisted resume doc (src/pages/resume-builder/store.js is the single
// source of truth for that data) rather than prop-drilled across sibling
// subtrees under AppShellLayout. Stays in sync via the same
// "resume:updated" event store.js's saveResume() dispatches on every save
// path (autosave, reset, import, restore), plus the cross-tab `storage`
// event.
function ReadinessMilestone() {
  const [strength, setStrength] = React.useState(() => {
    try { return computeStrength(loadResume()); } catch { return 0; }
  });

  React.useEffect(() => {
    const recompute = () => {
      try { setStrength(computeStrength(loadResume())); } catch {}
    };
    window.addEventListener("resume:updated", recompute);
    window.addEventListener("storage", recompute);
    return () => {
      window.removeEventListener("resume:updated", recompute);
      window.removeEventListener("storage", recompute);
    };
  }, []);

  const circumference = 2 * Math.PI * 18;
  const offset = circumference * (1 - strength / 100);

  // A single link for the whole card (not a nested <a> inside a <div>)
  // so it stays one reachable control in collapsed mode too, when only
  // the ring is visible — clicking/activating the ring itself still
  // navigates, rather than becoming a dead decoration.
  return (
    <a
      className="car-milestone"
      href="/career.html#/dashboard-ns"
      aria-label={`Career readiness ${strength}% — Build a strong resume. Complete key sections and connect evidence to reach 100%, ${readinessLabel(strength)}. View milestones.`}
    >
      <svg className="car-milestoneRing" width="52" height="52" viewBox="0 0 44 44" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--ring, #e5e7eb)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r="18" fill="none" stroke="var(--orange, #ff4f00)" strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 22 22)"
        />
        <text x="22" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="currentColor">{strength}%</text>
      </svg>
      <div className="car-milestoneBody" aria-hidden="true">
        <div className="car-milestoneTitle">Build a strong resume</div>
        <div className="car-milestoneSub">Complete key sections and connect evidence to reach 100% — {readinessLabel(strength)}</div>
        <span className="car-milestoneLink">View milestones →</span>
      </div>
    </a>
  );
}

export default function CareerSidebar({ collapsed = false }) {
  const [moreOpen, setMoreOpen] = React.useState(() => {
    try { return localStorage.getItem(MORE_TOOLS_KEY) === "1"; } catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(MORE_TOOLS_KEY, moreOpen ? "1" : "0"); } catch {}
  }, [moreOpen]);

  // DEV-only sanity: warn if key links are missing in the rendered markup.
  // Secondary routes stay mounted in the DOM (just visually collapsed via
  // CSS, not unmounted) specifically so this check — and real crawlability
  // /keyboard reachability — still holds regardless of the "More tools"
  // disclosure state.
  React.useEffect(() => {
    if (!import.meta.env.DEV) return;
    const required = [
      "/dashboard",
      "/dashboard-ns",
      "/assignments",
      "/calendar",
      "/portfolio",
      "/learn",
      "/vocab",
      "/planner",
      "/explore",
      "/career/pathways",
      "/resume",
      "/rewards",
      "/credit/report",
      "/marketplace",
      "/coach",
      "/help",
      "/settings",
    ];
    const isPresent = (p) =>
      !!document.querySelector(
        `a[href="#${p}"], a[href="${p}"], a[href$="#${p}"]`
      );
    const missing = required.filter((p) => !isPresent(p));
    if (missing.length) {
      console.warn(
        `⚠️ [CareerSidebar] Missing links: ${missing.join(
          ", "
        )}. Ensure the sidebar includes these routes.`
      );
    }
  }, []);

  return (
    <nav className="car-nav" aria-label="Main">
      <ul className="car-list car-primaryList">
        {PRIMARY_ITEMS.map((it, i) => (
          <Item key={`${it.to}-${i}`} to={it.to} icon={it.icon}>{it.label}</Item>
        ))}
      </ul>

      <ReadinessMilestone />

      <div className="car-walletRow">
        {/* Token breakdown dropped when collapsed — icon + SHF balance
            still fits and stays reachable in the 76px rail; full detail
            returns the moment the sidebar is expanded again. */}
        <WalletButton className="car-walletBtn" size="sm" showTokens={!collapsed} />
      </div>

      <button
        type="button"
        className="car-moreToggle"
        aria-expanded={moreOpen}
        aria-controls="car-more-tools"
        onClick={() => setMoreOpen((v) => !v)}
      >
        <span className="car-moreIcon" aria-hidden="true">⋯</span>
        <span className="car-moreLabel">More tools</span>
        <span className={`car-moreChevron ${moreOpen ? "is-open" : ""}`} aria-hidden="true">⌄</span>
      </button>

      <div id="car-more-tools" className={`car-moreTools ${moreOpen ? "is-open" : ""}`}>
        <Section title="LEARN">
          <Item to="/dashboard-ns" icon="⭐">Northstar Dashboard</Item>
          <Item to="/assignments" icon="📝">Assignments</Item>
          <Item to="/calendar"    icon="📅">Calendar</Item>
          <Item to="/vocab"       icon="🔤">Vocabulary</Item>
        </Section>

        <Section title="CAREER">
          <Item to="/planner" icon="🧭">Planner</Item>
          <Item to="/explore" icon="🗺️">Explore</Item>
        </Section>

        <Section title="TOOLS">
          <Item to="/rewards"        icon="🏆">Rewards Wallet</Item>
          <Item to="/credit/report"  icon="💳">Credit Report</Item>
          <Item to="/marketplace"    icon="🛍️">Marketplace</Item>
        </Section>

        <Section title="SUPPORT">
          <Item to="/coach"    icon="🧠">Coach</Item>
          <Item to="/help"     icon="❓">Help</Item>
          <Item to="/settings" icon="⚙️">Settings</Item>
        </Section>
      </div>
    </nav>
  );
}
