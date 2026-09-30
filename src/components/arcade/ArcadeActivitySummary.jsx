// src/components/arcade/ArcadeActivitySummary.jsx
// Shared display of legacy/local history counts and clearly labeled demo values.
import React from "react";
import { Link } from "react-router-dom";
import { useArcadeHistory } from "@/shared/arcade/useArcadeHistory.js";
import { ARCADE_ACTIVITY_DEMO } from "@/data/arcadeHomeFixtures.js";

export default function ArcadeActivitySummary({ headingId, title, variant = "home", className = "" }) {
  const { events, summary, loading, error } = useArcadeHistory();
  const safeEvents = Array.isArray(events) ? events : [];
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
            <span className="ar-kpi__value">{summary?.totalEntries ?? 0}</span>
            <span className="ar-kpi__label">History Entries</span>
          </div>
          <div className="ar-kpi ar-kpi--green">
            <span className="ar-kpi__icon" aria-hidden="true">🛡️</span>
            <span className="ar-kpi__value">{summary?.distinctEventTypes ?? 0}</span>
            <span className="ar-kpi__label">Activity Types</span>
          </div>
          {variant === "room" ? (
            <div className="ar-kpi ar-kpi--cyan">
              <span className="ar-kpi__icon" aria-hidden="true">🕹️</span>
              <span className="ar-kpi__value">{summary?.distinctGames ?? 0}</span>
              <span className="ar-kpi__label">Games Seen</span>
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
          ? `Latest legacy entry: ${mostRecent.eventType}${mostRecent.gameTitle ? ` — ${mostRecent.gameTitle}` : ""}`
          : "No legacy Arcade history entries."}
      </p>

      <div className="ar-activityLinks">
        <Link className="ar-activityLink" to="/leaderboards">Leaderboard <span aria-hidden="true">→</span></Link>
        <Link className="ar-activityLink" to="/history">Game History <span aria-hidden="true">→</span></Link>
        <Link className="ar-activityLink" to="/rewards">Rewards <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
