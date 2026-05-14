// src/pages/civic/Badges.jsx
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

function describeBadge(id) {
  switch (id) {
    case "grant-story-contributor":
      return {
        label: "Grant Story Contributor",
        emoji: "📄",
        detail:
          "You logged enough civic missions to be included in the SHF Master Grant Narrative.",
        group: "Civic & Grants",
      };
    case "policy-author":
      return {
        label: "Policy Author",
        emoji: "✍️",
        detail: "You submitted your first civic policy proposal.",
        group: "Civic & Grants",
      };
    case "policy-voter":
      return {
        label: "Policy Voter",
        emoji: "🗳️",
        detail: "You voted on a proposal in the Civic app.",
        group: "Civic & Grants",
      };
    case "policy-passed":
      return {
        label: "Policy Passed",
        emoji: "✅",
        detail: "A proposal you authored reached the PASS threshold.",
        group: "Civic & Grants",
      };
    case "micro:elections-howto":
      return {
        label: "Elections Micro-Lesson",
        emoji: "📘",
        detail: "You completed the Elections ‘how to vote’ micro-lesson.",
        group: "Micro-lessons",
      };
    default:
      return {
        label: id,
        emoji: "🏅",
        detail: "Badge earned through missions, lessons, or rewards.",
        group: "Other",
      };
  }
}

export default function CivicBadges() {
  const rewards =
    typeof useRewards === "function"
      ? useRewards()
      : { points: 0, badges: [] };

  const points = rewards.points || 0;
  const badges = rewards.badges || [];

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

  const mapped = badges.map((id) => ({ id, ...describeBadge(id) }));
  const civicBadges = mapped.filter((b) => b.group === "Civic & Grants");
  const lessonBadges = mapped.filter((b) => b.group === "Micro-lessons");
  const otherBadges = mapped.filter(
    (b) => b.group === "Other" && b.id !== BADGE_ID
  );

  return (
    <section className="crb-main" aria-labelledby="cb-title">
      <header className="db-head">
        <div>
          <h1 id="cb-title" className="db-title">
            Badges & Grant Story Progress
          </h1>
          <p className="db-subtitle">
            See the badges you’ve unlocked across Civic missions, micro-lessons,
            and how close you are to the Grant Story Contributor badge.
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
          <span className="sh-badge is-ghost">
            Total badges: {badges.length}
          </span>
          {hasGrantBadge && (
            <span
              className="sh-badge"
              style={{ background: "#ecfdf5", borderColor: "#bbf7d0" }}
            >
              📄 Grant Story Contributor
            </span>
          )}
        </div>
      </header>

      <div
        className="db-grid"
        style={{ gridTemplateColumns: "1.3fr 1fr", gap: 12 }}
      >
        {/* Left: Grant Story progress + civic badges */}
        <article className="card card--pad">
          <strong>Grant Story Contributor progress</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Your missions in Elections, Proposals, Treasury, and Debt Clock add
            minutes toward the Grant Story Contributor badge.
          </p>

          <div style={{ marginTop: 6, fontSize: 13 }}>
            Civic minutes logged: <strong>{civicMinutes}</strong> /{" "}
            {REQUIRED_MINUTES}
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
              ? "You’ve unlocked Grant Story Contributor. Your missions are already part of the SHF Master Grant Narrative."
              : minutesRemaining > 0
              ? `Log ${minutesRemaining} more minutes of civic missions to unlock the Grant Story Contributor badge.`
              : "You’re at the threshold; your badge will unlock after the next mission log sync.`"}
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--line,#e5e7eb)",
              margin: "12px 0",
            }}
          />

          <strong style={{ fontSize: 14 }}>Civic & Grant badges</strong>
          <div
            style={{
              marginTop: 6,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              fontSize: 12,
            }}
          >
            {(civicBadges.length ? civicBadges : mapped).map((b) => (
              <div
                key={b.id}
                style={{
                  borderRadius: 10,
                  border: "1px solid var(--ring,#e5e7eb)",
                  padding: "6px 8px",
                  background: "#fff",
                  minWidth: 0,
                  maxWidth: 260,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 2,
                  }}
                >
                  <span aria-hidden>{b.emoji}</span>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>
                    {b.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{b.detail}</div>
              </div>
            ))}
            {mapped.length === 0 && (
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                No badges yet — start missions and micro-lessons to earn your
                first badge.
              </span>
            )}
          </div>
        </article>

        {/* Right: Lesson + other badges */}
        <article className="card card--pad">
          <strong>Micro-lesson & other badges</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            These badges come from micro-lessons, practice ballots, proposals,
            and other activities across Civic.
          </p>

          <div
            style={{
              marginTop: 8,
              display: "grid",
              gap: 8,
              fontSize: 12,
            }}
          >
            {lessonBadges.length > 0 && (
              <section>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  Micro-lesson badges
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {lessonBadges.map((b) => (
                    <span
                      key={b.id}
                      className="sh-badge is-ghost"
                      style={{ fontSize: 11 }}
                    >
                      {b.emoji} {b.label}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {otherBadges.length > 0 && (
              <section>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  Other badges
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {otherBadges.map((b) => (
                    <span
                      key={b.id}
                      className="sh-badge is-ghost"
                      style={{ fontSize: 11 }}
                    >
                      {b.emoji} {b.label}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {lessonBadges.length === 0 && otherBadges.length === 0 && (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                As you move through the SHF ecosystem, badges from other apps
                and lessons will show up here.
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
