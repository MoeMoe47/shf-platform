import React from "react";

export default function LeaderboardCard({ you, rows = [] }) {
  if (!rows.length) return <p className="sh-muted">No leaderboard data yet.</p>;
  return (
    <ul className="dash-plainList" aria-label="Leaderboard">
      {rows.map((r) => (
        <li className={`dash-row ${you && r.rank === you.rank ? "you" : ""}`} key={r.rank}>
          <span className="dash-rank">#{r.rank}</span>
          <div className="dash-rowMain">
            <div className="dash-title">{r.name}</div>
            <div className="dash-sub">{r.xp} XP</div>
          </div>
          {you && r.rank === you.rank ? (
            <span className="dash-tag ok">You</span>
          ) : (
            <span className="dash-dot">•</span>
          )}
        </li>
      ))}
    </ul>
  );
}
