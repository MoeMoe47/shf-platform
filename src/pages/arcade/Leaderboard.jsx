import React from "react";
import { Link } from "react-router-dom";
import { useArcadeLeaderboard } from "@/shared/arcade/leaderboard/useArcadeLeaderboard.js";

const PAGE_SIZE = 50;

export default function Leaderboard() {
  const leaderboard = useArcadeLeaderboard({ limit: PAGE_SIZE });
  const selectedActivity = leaderboard.activities.find((activity) => activity.id === leaderboard.activityId);

  return (
    <main className="page pad" aria-labelledby="arcade-leaderboard-title">
      <header className="page__header">
        <div>
          <h1 id="arcade-leaderboard-title">Learning Arcade Leaderboard</h1>
          <p className="muted">Rankings are a read projection of scored canonical Arcade Results in your active organization.</p>
        </div>
        <Link className="sh-btn sh-btn--secondary" to="/learning">Back to Arcade</Link>
      </header>

      <section className="card card--pad" aria-label="Activity leaderboard">
        <label htmlFor="leaderboard-activity">Arcade Activity</label>
        <select
          id="leaderboard-activity"
          value={leaderboard.activityId}
          onChange={(event) => leaderboard.setActivityId(event.target.value)}
          disabled={leaderboard.loadingActivities || leaderboard.activities.length === 0}
        >
          {leaderboard.activities.map((activity) => (
            <option key={activity.id} value={activity.id}>{activity.title}</option>
          ))}
        </select>

        {leaderboard.loadingActivities && <p role="status">Loading Arcade Activities…</p>}
        {!leaderboard.loadingActivities && leaderboard.activities.length === 0 && (
          <p role="status">No Arcade Activities are available.</p>
        )}
        {selectedActivity && <h2>{selectedActivity.title}</h2>}
        {leaderboard.error && (
          <p role="alert">
            {leaderboard.error.status === 403
              ? "Organization leaderboard access is not available for this account."
              : "The canonical Arcade leaderboard is temporarily unavailable."}
          </p>
        )}
        {leaderboard.loading && <p role="status">Loading canonical Results…</p>}

        {!leaderboard.loading && !leaderboard.error && leaderboard.activityId && leaderboard.items.length === 0 && (
          <p role="status">No scored canonical Arcade Results are available for this Activity.</p>
        )}

        {leaderboard.items.length > 0 && (
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Organization-scoped Learning Arcade ranks</caption>
              <thead>
                <tr><th scope="col">Rank</th><th scope="col">Learner</th><th scope="col">Score</th><th scope="col">Achieved</th></tr>
              </thead>
              <tbody>
                {leaderboard.items.map((item) => (
                  <tr key={item.resultId}>
                    <td>{item.rank}</td>
                    <td>{item.displayName}</td>
                    <td>{item.score}{item.maxScore == null ? "" : ` / ${item.maxScore}`}</td>
                    <td>{new Date(item.achievedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <nav aria-label="Leaderboard pages">
          <button type="button" className="sh-btn sh-btn--secondary" disabled={leaderboard.loading || leaderboard.offset === 0} onClick={() => leaderboard.load(Math.max(0, leaderboard.offset - PAGE_SIZE))}>Previous</button>
          <button type="button" className="sh-btn sh-btn--secondary" disabled={leaderboard.loading || !leaderboard.hasMore} onClick={() => leaderboard.load(leaderboard.offset + PAGE_SIZE)}>Next</button>
        </nav>
      </section>

      <aside className="card card--pad" aria-label="Leaderboard scope">
        <h2>Classic Arcade</h2>
        <p>Server ranking is not yet available for Classic Arcade. Runtime telemetry and save state are not score sources.</p>
        <p>Rank is presentation only; it does not establish mastery, evidence, credentials, rewards, or institutional truth.</p>
      </aside>
    </main>
  );
}
