// src/pages/civic/CivicDashboard.jsx
// Civic Lab Dashboard — redesigned per the approved visual/structural spec.
// No approved mock IMAGE was found anywhere in the repo or supplied with
// the task (checked assets-source/, Desktop, and every folder the task
// named); the extremely detailed written specification is what this page
// is built against, treated as the design authority in its place.
//
// Every metric below is either real (read from the same localStorage keys
// the rest of the Civic app already writes) or, where no real source
// exists for a named metric (Active Parties / Voter Turnout — there is no
// "party" or "electorate" concept anywhere in this codebase), an
// explicitly labeled "Demo preview" placeholder rather than a number
// presented as if it were live. See docs/architecture/civic/
// CIVIC_APP_CAPABILITY_AUDIT_V1.md for the full forensic basis.
import React from "react";
import { Link } from "react-router-dom";
import { useRewards } from "@/hooks/useRewards.js";
import { getStreakCount, getLastTouchedAt, streakTooltip } from "@/shared/engagement/streaks.js";
import microLessons from "@/data/civic/micro-lessons.v1.json";

/* ---------------- localStorage readers (mirrors the pattern already used
   throughout src/pages/civic/*.jsx — small inline helpers, not a new
   abstraction layer) ---------------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function readNum(key) {
  try {
    return Number(localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
}
function readHandle() {
  const priv = readJSON("civic:privacy", null);
  const handle = priv?.publicHandle;
  return typeof handle === "string" && handle.trim() ? handle.trim() : "";
}

/* ---------------- Next mission derivation ---------------- */
function useNextMission() {
  return React.useMemo(() => {
    const attestations = readJSON("civic:attestations", []);
    const completedIds = new Set(
      (attestations || [])
        .filter((a) => a?.eventType === "micro-lesson-complete")
        .map((a) => a.lessonId)
    );
    const items = microLessons?.items || [];
    const next = items.find((it) => !completedIds.has(it.id));
    return {
      mission: next || null,
      completedCount: completedIds.size,
      totalCount: items.length,
      allComplete: !next && items.length > 0,
    };
  }, []);
}

/* ---------------- Activity derivation ---------------- */
const TOOL_KPI_MAP = [
  { key: "civic:kpi:votesCast", label: "Elections", to: "/elections" },
  { key: "civic:kpi:proposalsSubmitted", label: "Proposals", to: "/proposals" },
  { key: "civic:kpi:treasurySims", label: "Treasury Simulator", to: "/treasury-sim" },
  { key: "civic:kpi:surveysCompleted", label: "Issue Survey", to: "/survey" },
  { key: "civic:kpi:notesAdded", label: "Notes", to: "/notes" },
  { key: "civic:kpi:portfolioAdded", label: "Portfolio", to: "/portfolio" },
];

function relativeTime(ms) {
  if (!ms) return null;
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day === 1 ? "" : "s"} ago`;
}

function useActivity() {
  return React.useMemo(() => {
    const logs = readJSON("shf.civicMissionLogs.v1", []);
    const sorted = Array.isArray(logs)
      ? [...logs].sort((a, b) => (b?.ts || 0) - (a?.ts || 0))
      : [];
    const recent = sorted[0] || null;

    const mostUsed = TOOL_KPI_MAP.map((t) => ({ ...t, count: readNum(t.key) }))
      .sort((a, b) => b.count - a.count)[0];

    const streakCount = getStreakCount();
    const lastTouchedAt = getLastTouchedAt();

    return {
      recentMissionLabel: recent ? (recent.chapter || recent.missionTitle || recent.mission || "Logged mission") : null,
      recentMissionWhen: recent ? relativeTime(recent.ts) : null,
      lastActiveLabel: lastTouchedAt ? relativeTime(lastTouchedAt) : null,
      mostUsedTool: mostUsed && mostUsed.count > 0 ? mostUsed : null,
      streakCount,
    };
  }, []);
}

/* ---------------- Community simulation ---------------- */
function useCommunitySim() {
  return React.useMemo(() => {
    const proposals = readJSON("civic:proposals", []);
    const openProposals = Array.isArray(proposals)
      ? proposals.filter((p) => p?.status === "open").length
      : 0;
    return { openProposals };
  }, []);
}

/* ---------------- Small inline "scale" illustration for the mission card —
   an institutional vector recreation (trade-offs / balance motif), not a
   generic emoji, since no approved hero asset exists in the repo. ---------------- */
function TradeoffScaleArt() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true" className="cv-hero__art">
      <line x1="60" y1="10" x2="60" y2="76" stroke="#3a4459" strokeWidth="3" strokeLinecap="round" />
      <line x1="18" y1="28" x2="102" y2="28" stroke="#3a4459" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="10" r="4" fill="#ec4899" />
      <path d="M18 28 L8 54 A16 12 0 0 0 28 54 Z" stroke="#d97706" strokeWidth="2.5" fill="rgba(217,119,6,0.16)" strokeLinejoin="round" />
      <path d="M102 28 L92 46 A16 12 0 0 0 112 46 Z" stroke="#8b5cf6" strokeWidth="2.5" fill="rgba(139,92,246,0.18)" strokeLinejoin="round" />
      <line x1="18" y1="28" x2="18" y2="54" stroke="#3a4459" strokeWidth="2" />
      <line x1="102" y1="28" x2="102" y2="46" stroke="#3a4459" strokeWidth="2" />
      <rect x="42" y="76" width="36" height="8" rx="3" fill="#3a4459" />
      <rect x="50" y="84" width="20" height="6" rx="2" fill="#262f42" />
    </svg>
  );
}

/* ---------------- KPI card ---------------- */
function KpiCard({ icon, accent, value, label, sub }) {
  return (
    <div className="cv-card cv-kpi">
      <span className={`cv-kpi__icon cv-kpi__icon--${accent}`} aria-hidden="true">{icon}</span>
      <span className="cv-kpi__value">{value}</span>
      <span className="cv-kpi__label">{label}</span>
      {sub && <span className="cv-kpi__sub">{sub}</span>}
    </div>
  );
}

export default function CivicDashboard() {
  const { points } = useRewards();
  const surveysCompleted = readNum("civic:kpi:surveysCompleted");
  const notesAdded = readNum("civic:kpi:notesAdded");
  const portfolioAdded = readNum("civic:kpi:portfolioAdded");

  const { mission, completedCount, totalCount, allComplete } = useNextMission();
  const activity = useActivity();
  const community = useCommunitySim();
  const handle = React.useMemo(readHandle, []);

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="cv-dash">
      <h1 className="cv-srOnly">Civic Lab Dashboard</h1>

      {/* Greeting */}
      <section className="cv-greeting" aria-labelledby="cv-greeting-title">
        <p className="cv-greeting__title" id="cv-greeting-title">
          Good {timeOfDayGreeting()}, {handle || "Civic Scholar"}! 👋
        </p>
        <p className="cv-greeting__sub">
          Every mission, vote, and choice you make builds a stronger community.
        </p>
      </section>

      {/* 4 KPI Cards */}
      <section aria-label="Your Civic Lab metrics">
        <div className="cv-kpiGrid">
          <KpiCard icon="📋" accent="pink" value={surveysCompleted} label="Surveys Completed" sub="Issue Survey responses" />
          <KpiCard icon="📝" accent="gold" value={notesAdded} label="Notes Added" sub="Saved to Notes" />
          <KpiCard icon="💼" accent="purple" value={portfolioAdded} label="Portfolio Items" sub="Saved to Portfolio" />
          <KpiCard icon="⭐" accent="gold" value={points.toLocaleString()} label="Civic Points" sub="Earned across Civic Lab" />
        </div>
      </section>

      <div className="cv-row2">
        {/* Continue Your Civic Journey */}
        <section className="cv-hero" aria-labelledby="cv-hero-title">
          <span className="cv-hero__eyebrow">{allComplete ? "All caught up" : "Next mission"}</span>
          <h2 className="cv-hero__title" id="cv-hero-title">Continue Your Civic Journey</h2>
          {mission ? (
            <>
              <p className="cv-hero__desc">
                <strong>{mission.title}</strong> — {mission.objective}
              </p>
              <TradeoffScaleArt />
              <div className="cv-hero__progressRow">
                <div className="cv-hero__progressTrack">
                  <div className="cv-hero__progressFill" style={{ width: `${progressPct}%` }} />
                </div>
                <span className="cv-hero__progressLabel">{completedCount}/{totalCount} missions</span>
              </div>
              <Link className="cv-hero__cta" to={`/lesson?id=${encodeURIComponent(mission.id)}`}>
                Resume Mission →
              </Link>
            </>
          ) : (
            <>
              <p className="cv-hero__desc">
                You&rsquo;ve completed every micro-lesson currently available. Revisit any
                mission any time, or explore Elections, Proposals, and the Treasury
                Simulator to keep practicing.
              </p>
              <TradeoffScaleArt />
              <Link className="cv-hero__cta" to="/micro-lessons">
                Browse Missions →
              </Link>
            </>
          )}
        </section>

        {/* Your Activity */}
        <section className="cv-card cv-activity" aria-labelledby="cv-activity-title">
          <div className="cv-sectionHead">
            <h2 className="cv-sectionTitle" id="cv-activity-title">Your Activity</h2>
            <Link className="cv-viewAll" to="/dashboard-ns">View all →</Link>
          </div>
          <div className="cv-activityRows">
            <div className="cv-activityRow">
              <span className="cv-activityRow__label">Recent Mission</span>
              <span className="cv-activityRow__value">
                {activity.recentMissionLabel
                  ? `${activity.recentMissionLabel}${activity.recentMissionWhen ? ` · ${activity.recentMissionWhen}` : ""}`
                  : "No missions logged yet"}
              </span>
            </div>
            <div className="cv-activityRow">
              <span className="cv-activityRow__label">Last Active</span>
              <span className="cv-activityRow__value">{activity.lastActiveLabel || "No recent activity yet"}</span>
            </div>
            <div className="cv-activityRow">
              <span className="cv-activityRow__label">Most Used Tool</span>
              <span className="cv-activityRow__value">{activity.mostUsedTool ? activity.mostUsedTool.label : "Not started yet"}</span>
            </div>
            <div className="cv-activityRow">
              <span className="cv-activityRow__label">Current Streak</span>
              <span className="cv-activityRow__value" title={streakTooltip(activity.streakCount)}>
                {activity.streakCount > 0 ? `${activity.streakCount} day${activity.streakCount === 1 ? "" : "s"}` : "Start a streak today"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="cv-row2b">
        {/* Community Simulation */}
        <section className="cv-card cv-community" aria-labelledby="cv-community-title">
          <div className="cv-sectionHead">
            <h2 className="cv-sectionTitle" id="cv-community-title">Community Simulation</h2>
          </div>
          <div className="cv-communityGrid">
            <div className="cv-communityItem">
              <span className="cv-communityItem__icon" aria-hidden="true">🏛️</span>
              <span className="cv-communityItem__value">3</span>
              <span className="cv-communityItem__label">Active Parties</span>
              <span className="cv-communityItem__sub">Demo preview</span>
            </div>
            <div className="cv-communityItem">
              <span className="cv-communityItem__icon" aria-hidden="true">📜</span>
              <span className="cv-communityItem__value">{community.openProposals}</span>
              <span className="cv-communityItem__label">Open Proposals</span>
              <span className="cv-communityItem__sub">Live from Proposals</span>
            </div>
            <div className="cv-communityItem">
              <span className="cv-communityItem__icon" aria-hidden="true">🗳️</span>
              <span className="cv-communityItem__value">62%</span>
              <span className="cv-communityItem__label">Voter Turnout</span>
              <span className="cv-communityItem__sub">Demo preview</span>
            </div>
          </div>
        </section>

        {/* Next Actions */}
        <section className="cv-card cv-nextActions" aria-labelledby="cv-nextactions-title">
          <div className="cv-sectionHead">
            <h2 className="cv-sectionTitle" id="cv-nextactions-title">Next Actions</h2>
          </div>
          <ul className="cv-nextActionsList">
            <li>
              <Link className="cv-nextAction" to="/proposals">
                <span className="cv-nextAction__icon" aria-hidden="true">📜</span>
                Review open proposals
                <span className="cv-nextAction__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link className="cv-nextAction" to={mission ? `/lesson?id=${encodeURIComponent(mission.id)}` : "/micro-lessons"}>
                <span className="cv-nextAction__icon" aria-hidden="true">🎯</span>
                Continue your mission
                <span className="cv-nextAction__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link className="cv-nextAction" to="/elections">
                <span className="cv-nextAction__icon" aria-hidden="true">🗳️</span>
                Cast a practice vote
                <span className="cv-nextAction__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
            <li>
              <Link className="cv-nextAction" to="/grant-story">
                <span className="cv-nextAction__icon" aria-hidden="true">📖</span>
                Log mission time to your Grant Story
                <span className="cv-nextAction__arrow" aria-hidden="true">→</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>

      {/* Explore Civic Tools */}
      <section aria-labelledby="cv-tools-title">
        <div className="cv-sectionHead">
          <h2 className="cv-sectionTitle" id="cv-tools-title">Explore Civic Tools</h2>
        </div>
        <div className="cv-toolsGrid">
          <Link className="cv-card cv-tool" to="/elections">
            <span className="cv-tool__icon" aria-hidden="true">🗳️</span>
            <span className="cv-tool__label">Elections</span>
          </Link>
          <Link className="cv-card cv-tool" to="/proposals">
            <span className="cv-tool__icon" aria-hidden="true">📜</span>
            <span className="cv-tool__label">Proposals</span>
          </Link>
          <Link className="cv-card cv-tool" to="/survey">
            <span className="cv-tool__icon" aria-hidden="true">📊</span>
            <span className="cv-tool__label">Issue Survey</span>
          </Link>
          <Link className="cv-card cv-tool" to="/debtclock">
            <span className="cv-tool__icon" aria-hidden="true">⏱️</span>
            <span className="cv-tool__label">Debt Clock</span>
          </Link>
          <Link className="cv-card cv-tool" to="/treasury-sim">
            <span className="cv-tool__icon" aria-hidden="true">🏛️</span>
            <span className="cv-tool__label">Treasury Simulator</span>
          </Link>
          <Link className="cv-card cv-tool" to="/snapshots">
            <span className="cv-tool__icon" aria-hidden="true">🗂️</span>
            <span className="cv-tool__label">Treasury Snapshots</span>
          </Link>
        </div>
      </section>

      {/* Your Work Creates Real Impact */}
      <section className="cv-card cv-impact" aria-labelledby="cv-impact-title">
        <h2 className="cv-impact__title" id="cv-impact-title">Your work creates real impact.</h2>
        <p className="cv-impact__desc">
          Missions you complete feed directly into the Silicon Heartland
          Foundation&rsquo;s Grant Story and community reports — an
          educational simulation of how real civic participation is
          documented, not a live funding pipeline.
        </p>
        <div className="cv-impact__flow">
          <Link className="cv-impact__step" to="/micro-lessons">Learn</Link>
          <span className="cv-impact__arrow" aria-hidden="true">→</span>
          <Link className="cv-impact__step" to="/elections">Participate</Link>
          <span className="cv-impact__arrow" aria-hidden="true">→</span>
          <Link className="cv-impact__step" to="/journal">Document</Link>
          <span className="cv-impact__arrow" aria-hidden="true">→</span>
          <Link className="cv-impact__step" to="/portfolio">Portfolio</Link>
          <span className="cv-impact__arrow" aria-hidden="true">→</span>
          <Link className="cv-impact__step" to="/grant-story">Impact</Link>
        </div>
      </section>
    </div>
  );
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
