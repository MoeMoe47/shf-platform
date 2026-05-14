// src/pages/civic/Leaderboard.jsx
import React from "react";

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

export default function CivicLeaderboard() {
  const [rows, setRows] = React.useState([]);

  React.useEffect(() => {
    const compute = () => {
      const logs = readJSON(CIVIC_LOG_KEY, []);
      const map = new Map();

      for (const log of logs) {
        const identity = log.identity || {};
        const id =
          identity.studentId ||
          identity.email ||
          identity.userId ||
          "local-device";
        const name =
          identity.studentName ||
          identity.name ||
          "Local student (this device)";
        const site = identity.siteId || identity.site || log.siteId || "";
        const program =
          identity.programCode ||
          identity.program ||
          log.programCode ||
          "";

        const prev = map.get(id) || {
          id,
          name,
          site,
          program,
          missions: 0,
          minutes: 0,
        };

        prev.missions += 1;
        prev.minutes += Number(log.duration || 0) || 0;
        map.set(id, prev);
      }

      const list = Array.from(map.values()).sort(
        (a, b) => b.minutes - a.minutes
      );
      setRows(list);
    };

    compute();
    const onStorage = (e) => {
      if (!e || e.key == null || e.key === CIVIC_LOG_KEY) {
        compute();
      }
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(compute, 2000);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(t);
    };
  }, []);

  const totalMinutes = rows.reduce((s, r) => s + r.minutes, 0);

  return (
    <section className="crb-main" aria-labelledby="lb-title">
      <header className="db-head">
        <div>
          <h1 id="lb-title" className="db-title">
            Civic Leaderboard
          </h1>
          <p className="db-subtitle">
            Top mission contributors based on civic minutes logged into the Grant
            Story.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="sh-badge">
            Total civic minutes: <strong>{totalMinutes}</strong>
          </span>
        </div>
      </header>

      <section className="card card--pad" aria-label="Leaderboard table">
        {rows.length === 0 ? (
          <div
            style={{
              fontSize: 13,
              opacity: 0.75,
            }}
          >
            No civic missions logged yet. Use the mission log boxes in Elections,
            Proposals, Treasury, and Debt Clock to appear here.
          </div>
        ) : (
          <div style={{ maxHeight: 320, overflow: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 420,
                fontSize: 13,
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 6 }}>Rank</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Student</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Site</th>
                  <th style={{ textAlign: "left", padding: 6 }}>Program</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Missions</th>
                  <th style={{ textAlign: "right", padding: 6 }}>Minutes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => {
                  const share =
                    totalMinutes > 0
                      ? ((r.minutes / totalMinutes) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={r.id}>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        #{idx + 1}
                      </td>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        {r.name}
                        <div
                          style={{
                            fontSize: 11,
                            opacity: 0.7,
                          }}
                        >
                          {share}% of civic minutes
                        </div>
                      </td>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        {r.site || "—"}
                      </td>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                        }}
                      >
                        {r.program || "—"}
                      </td>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                          textAlign: "right",
                        }}
                      >
                        {r.missions}
                      </td>
                      <td
                        style={{
                          padding: 6,
                          borderTop: "1px solid #e5e7eb",
                          textAlign: "right",
                        }}
                      >
                        {r.minutes}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
