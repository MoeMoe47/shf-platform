// src/pages/civic/GrantStory.jsx
import React from "react";
import { loadMasterNarrativeFromStorage } from "@/utils/binderMerge.js";

const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

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

// Build a simple leaderboard from local civic logs
function buildLeaderboard(logs) {
  const map = new Map();

  (logs || []).forEach((log) => {
    const id =
      log.missionId || log.mission || log.missionTitle || "Other mission";
    const title = log.missionTitle || id;
    const mins = Number(log.duration || 0);

    if (!map.has(id)) {
      map.set(id, { id, title, minutes: 0, count: 0 });
    }
    const entry = map.get(id);
    entry.minutes += mins;
    entry.count += 1;
  });

  return Array.from(map.values()).sort((a, b) => b.minutes - a.minutes);
}

export default function GrantStory() {
  // Master narrative + meta (written by Admin Tool Dashboard)
  const [{ markdown, meta }, setNarrative] = React.useState({
    markdown: "",
    meta: {},
  });

  // Local civic mission logs for THIS browser (this student)
  const [civicLogs, setCivicLogs] = React.useState([]);

  React.useEffect(() => {
    try {
      const loaded = loadMasterNarrativeFromStorage();
      setNarrative(loaded);
    } catch {
      setNarrative({ markdown: "", meta: {} });
    }

    setCivicLogs(readJSON(CIVIC_LOG_KEY, []));
  }, []);

  // Total civic minutes across all students (from Admin sync meta)
  const totalCivicMinutesAll = Number(meta?.civicMinutesTotal || 0);

  // This student’s minutes + missions
  const myMinutes = civicLogs.reduce(
    (sum, log) => sum + Number(log.duration || 0),
    0
  );
  const myMissions = civicLogs.length;

  const share =
    totalCivicMinutesAll > 0
      ? Math.min(100, (myMinutes / totalCivicMinutesAll) * 100)
      : 0;

  const updatedAt = meta?.updatedAt || "—";

  const leaderboard = React.useMemo(
    () => buildLeaderboard(civicLogs),
    [civicLogs]
  );
  const topFive = leaderboard.slice(0, 5);

  return (
    <section className="crb-main" aria-labelledby="gs-title">
      <header className="db-head">
        <div>
          <h1 id="gs-title" className="db-title">
            Grant Story – How Your Missions Help SHF
          </h1>
          <p className="db-subtitle">
            This screen shows how your civic missions connect to real grant
            narratives and funding impact for Silicon Heartland Foundation.
          </p>
        </div>
      </header>

      {/* 🔹 Contribution stats bar */}
      <section
        className="card card--pad"
        aria-label="Your contribution to SHF impact"
        style={{
          marginBottom: 12,
          display: "grid",
          gap: 8,
        }}
      >
        <strong style={{ fontSize: 15 }}>Your contribution to SHF impact</strong>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: 13,
          }}
        >
          <span className="sh-badge">
            Your missions: <strong>{myMissions}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Your minutes: <strong>{myMinutes}</strong>
          </span>
          <span className="sh-badge">
            All civic minutes (SHF):{" "}
            <strong>{totalCivicMinutesAll || 0}</strong>
          </span>
        </div>

        <div style={{ fontSize: 13, opacity: 0.8 }}>
          {totalCivicMinutesAll > 0 ? (
            <>
              Your missions currently make up{" "}
              <strong>{share.toFixed(1)}%</strong> of all civic minutes logged
              in this Master Narrative update (
              <span style={{ fontSize: 11 }}>last updated {updatedAt}</span>).
            </>
          ) : (
            "Once Admin runs a narrative sync, you’ll see how your minutes compare to all SHF civic activity."
          )}
        </div>

        {/* Simple horizontal progress bar */}
        <div
          style={{
            marginTop: 4,
            height: 8,
            borderRadius: 999,
            background: "#e5e7eb",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(100, share))}%`,
              height: "100%",
              background: "var(--brand,#22c55e)",
            }}
          />
        </div>
      </section>

      {/* 🔹 Local mission leaderboard (this device) */}
      <section
        className="card card--pad"
        aria-label="Civic mission leaderboard"
        style={{ marginBottom: 12, display: "grid", gap: 8 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <strong style={{ fontSize: 15 }}>Civic mission leaderboard</strong>
          <span style={{ fontSize: 11, opacity: 0.7 }}>
            Based on missions logged on this device.
          </span>
        </div>

        {topFive.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            No missions logged yet. Use the mission log boxes on Elections,
            Proposals, Treasury, and Debt Clock to start filling this board.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 6,
            }}
          >
            {topFive.map((row, idx) => (
              <li
                key={row.id || idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 8px",
                  borderRadius: 8,
                  border: "1px solid var(--ring,#e5e7eb)",
                  background: "#ffffff",
                  fontSize: 13,
                }}
              >
                <span
                  style={{
                    width: 20,
                    textAlign: "center",
                    fontWeight: 600,
                    opacity: 0.8,
                  }}
                >
                  #{idx + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {row.title || "Mission"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.75,
                      marginTop: 2,
                    }}
                  >
                    {row.count} log(s) · {row.minutes} min total
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 🔹 Narrative viewer */}
      <section
        className="card card--pad"
        aria-label="Master grant narrative"
        style={{ display: "grid", gap: 8 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
          }}
        >
          <strong style={{ fontSize: 15 }}>
            Master Grant Narrative (read-only)
          </strong>
          <span className="sh-badge is-ghost" style={{ fontSize: 11 }}>
            Updated {updatedAt}
          </span>
        </div>

        <p style={{ fontSize: 12, opacity: 0.8, marginTop: 0 }}>
          This is the same narrative your admin team uses in real grant portals.
          Your Elections, Proposals, Treasury, and Debt Clock missions are part
          of the story they copy into Perkins, WIOA, ESSA, Medicaid, and
          philanthropy applications.
        </p>

        <textarea
          readOnly
          value={markdown || "No master narrative has been generated yet."}
          style={{
            minHeight: 260,
            width: "100%",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: 12,
            lineHeight: 1.45,
          }}
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            fontSize: 12,
          }}
        >
          <button
            type="button"
            className="sh-btn is-ghost"
            onClick={() => {
              try {
                navigator.clipboard.writeText(markdown || "");
              } catch {
                // ignore
              }
            }}
          >
            Copy narrative
          </button>
          <button
            type="button"
            className="sh-btn is-ghost"
            onClick={() => {
              const blob = new Blob([markdown || ""], {
                type: "text/markdown;charset=utf-8",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "shf-master-grant-narrative.md";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            Download .md
          </button>
        </div>
      </section>

      <section
        className="card card--pad"
        style={{ marginTop: 12, fontSize: 12, opacity: 0.85 }}
      >
        <strong>How to boost your impact score</strong>
        <ul style={{ marginTop: 6, paddingLeft: 18 }}>
          <li>
            Complete more <strong>Elections, Proposals, Treasury, and Debt Clock</strong>{" "}
            missions.
          </li>
          <li>
            Use the mission log box on each page so your minutes are counted in
            the Grant Story.
          </li>
          <li>
            When Admin syncs the narrative again, your contribution bar and
            leaderboard will update.
          </li>
        </ul>
      </section>
    </section>
  );
}
