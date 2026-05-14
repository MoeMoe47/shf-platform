// src/pages/civic/DashboardNorthstar.jsx
import React from "react";
import { useRewards } from "@/hooks/useRewards.js";

const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";
const BADGE_ID = "grant-story-contributor";
const REQUIRED_MINUTES = 60;

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

// 🔹 Tiny pill that only shows when badge is unlocked
function GrantStoryContributorPill() {
  const rewards =
    typeof useRewards === "function"
      ? useRewards()
      : { badges: [], points: 0 };

  const badges = rewards.badges || [];
  const hasBadge = badges.includes(BADGE_ID);

  if (!hasBadge) return null;

  return (
    <span
      className="sh-badge"
      style={{
        background: "#ecfdf5",
        borderColor: "#4ade80",
        fontSize: 11,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
      title="Your civic missions are part of the SHF Master Grant Narrative."
    >
      <span aria-hidden>🌱</span>
      <span>Grant Story Contributor</span>
    </span>
  );
}

export default function CivicDashboardNorthstar() {
  const { points = 0, badges = [] } =
    typeof useRewards === "function"
      ? useRewards()
      : { points: 0, badges: [] };

  const [civicMinutes, setCivicMinutes] = React.useState(0);

  React.useEffect(() => {
    const compute = () => {
      const logs = readJSON(CIVIC_LOG_KEY, []);
      const minutes = logs.reduce(
        (sum, item) => sum + Number(item.duration || 0),
        0
      );
      setCivicMinutes(minutes);
    };

    compute();

    const onStorage = (e) => {
      if (!e || e.key == null || e.key === CIVIC_LOG_KEY) {
        compute();
      }
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(compute, 1500);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  const hasGrantBadge = badges.includes(BADGE_ID);
  const minutesRemaining = Math.max(0, REQUIRED_MINUTES - civicMinutes);
  const progressPct = Math.min(
    100,
    (civicMinutes / Math.max(1, REQUIRED_MINUTES)) * 100
  );

  return (
    <section className="crb-main" aria-labelledby="ns-title">
      <header className="db-head">
        <div>
          <h1 id="ns-title" className="db-title">
            Northstar Dashboard
          </h1>
          <p className="db-subtitle">
            Your summary across points, missions, and contribution to Silicon
            Heartland’s grant story.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <span className="sh-badge">Points: {points}</span>
          <span className="sh-badge is-ghost">Badges: {badges.length}</span>

          {/* 🔹 New: shows only when badge is unlocked */}
          <GrantStoryContributorPill />
        </div>
      </header>

      <div
        className="db-grid"
        style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}
      >
        <article className="card card--pad">
          <strong>Grant Story contribution</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Your civic missions (Elections, Proposals, Treasury, Debt Clock) are
            part of the Foundation’s grant narrative.
          </p>

          <div style={{ fontSize: 13, marginTop: 6 }}>
            Minutes logged: <strong>{civicMinutes}</strong>
          </div>

          <div
            style={{
              marginTop: 6,
              height: 8,
              borderRadius: 999,
              background: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: "100%",
                background: hasGrantBadge ? "#22c55e" : "#38bdf8",
              }}
            />
          </div>

          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            {hasGrantBadge
              ? "You’ve unlocked the Grant Story Contributor badge. Your work is already in the Master Grant Narrative."
              : minutesRemaining > 0
              ? `Log ${minutesRemaining} more minutes of missions to unlock the Grant Story Contributor badge.`
              : "You’re at the threshold; your badge will unlock after the next mission log sync."}
          </div>
        </article>

        <article className="card card--pad">
          <strong>Badge board</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            A quick look at your key badges. Use Rewards for full badge history.
          </p>

          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              fontSize: 12,
            }}
          >
            {hasGrantBadge && (
              <span
                className="sh-badge"
                style={{ background: "#ecfdf5", borderColor: "#bbf7d0" }}
              >
                📄 Grant Story Contributor
              </span>
            )}
            {badges
              .filter((id) => id !== BADGE_ID)
              .slice(0, 6)
              .map((id) => (
                <span key={id} className="sh-badge is-ghost">
                  {id}
                </span>
              ))}
            {badges.length === 0 && (
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                No badges yet — complete missions and micro-lessons to earn
                some.
              </span>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
