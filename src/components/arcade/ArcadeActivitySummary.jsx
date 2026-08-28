// src/components/arcade/ArcadeActivitySummary.jsx
// Shared "your real Arcade activity" card — reads useArcadeHistory() (the
// real ledger-backed hook, same one History.jsx uses) for XP, Badges, and
// Games Played/On-chain events. Used by both Learning Arcade Home
// ("Arcade Activity") and Classical Arcade Room ("Your Arcade Activity")
// so the two pages consume the exact same real data path rather than each
// inventing its own.
//
// Rank has no real source anywhere in this codebase (no cross-student
// aggregate exists), so it's a clearly-isolated fixture, not computed —
// see ARCADE_ACTIVITY_DEMO in arcadeHomeFixtures.js. The 4th stat differs
// per the approved mocks: Home shows "Next Tournament" (also a fixture —
// Tournaments.jsx is itself still a pre-existing placeholder), Classical
// Arcade Room shows "Games Played" (real, from the same hook).
import React from "react";
import { Link } from "react-router-dom";
import { useArcadeHistory } from "@/shared/arcade/useArcadeHistory.js";
import { ARCADE_ACTIVITY_DEMO } from "@/data/arcadeHomeFixtures.js";

export default function ArcadeActivitySummary({ headingId, title, variant = "home", className = "" }) {
  const { events, summary, loading, error } = useArcadeHistory();
  const safeEvents = Array.isArray(events) ? events : [];
  const badgeCount = safeEvents.filter((e) => e.eventType === "Badge claimed").length;
  const mostRecent = safeEvents[0];
  const { rank, nextTournamentDay } = ARCADE_ACTIVITY_DEMO;

  return (
    <section className={`ar-card ar-section ar-activityCard${className ? ` ${className}` : ""}`} aria-labelledby={headingId}>
      <div className="ar-section__head">
        <h2 id={headingId} className="ar-section__title">{title}</h2>
        <Link className="ar-note ar-note--link" to="/history">View All →</Link>
      </div>

      {loading && <p className="ar-muted">Loading your arcade activity…</p>}
      {error && !loading && <p className="ar-muted">Could not load arcade activity right now.</p>}

      {!loading && (
        <div className="ar-activityGrid">
          <div className="ar-kpi ar-kpi--gold">
            <span className="ar-kpi__icon" aria-hidden="true">👑</span>
            <span className="ar-kpi__value">{rank}</span>
            <span className="ar-kpi__label">Rank <span className="ar-note">(demo)</span></span>
          </div>
          <div className="ar-kpi ar-kpi--violet">
            <span className="ar-kpi__icon" aria-hidden="true">⭐</span>
            <span className="ar-kpi__value">{(summary?.totalXp ?? 0).toLocaleString()}</span>
            <span className="ar-kpi__label">XP</span>
          </div>
          <div className="ar-kpi ar-kpi--green">
            <span className="ar-kpi__icon" aria-hidden="true">🛡️</span>
            <span className="ar-kpi__value">{badgeCount}</span>
            <span className="ar-kpi__label">Badges</span>
          </div>
          {variant === "room" ? (
            <div className="ar-kpi ar-kpi--cyan">
              <span className="ar-kpi__icon" aria-hidden="true">🕹️</span>
              <span className="ar-kpi__value">{summary?.totalSessions ?? 0}</span>
              <span className="ar-kpi__label">Games Played</span>
            </div>
          ) : (
            <div className="ar-kpi ar-kpi--cyan">
              <span className="ar-kpi__icon" aria-hidden="true">🏆</span>
              <span className="ar-kpi__value">{nextTournamentDay}</span>
              <span className="ar-kpi__label">Next Tournament <span className="ar-note">(demo)</span></span>
            </div>
          )}
        </div>
      )}

      <p className="ar-activityRecent">
        {mostRecent
          ? `Most recent: ${mostRecent.eventType}${mostRecent.gameTitle ? ` — ${mostRecent.gameTitle}` : ""}`
          : "No arcade sessions recorded yet."}
      </p>

      <div className="ar-activityLinks">
        <Link className="ar-activityLink" to="/leaderboard">Leaderboard <span aria-hidden="true">→</span></Link>
        <Link className="ar-activityLink" to="/history">Game History <span aria-hidden="true">→</span></Link>
        <Link className="ar-activityLink" to="/rewards">Rewards Wallet <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
