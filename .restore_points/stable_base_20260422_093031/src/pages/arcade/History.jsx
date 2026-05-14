// src/pages/arcade/History.jsx
// ------------------------------------------------------------
// SHF Arcade – Impact History
//
// Funder-facing view that shows:
//  - Live arcade events (sessions, rewards, on-chain status)
//  - Summary KPIs (sessions, XP, on-chain count)
//  - One-click CSV export for grants / board reports
//
// Data source:
//  - useArcadeHistory() hook (local ledger + Polygon metadata)
// ------------------------------------------------------------

import React from "react";
import { useArcadeHistory } from "@/shared/arcade/useArcadeHistory.js"; // adjust path/name if needed

// Small helper to keep CSV safe
function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ArcadeHistory() {
  const { events, loading, error, summary } = useArcadeHistory();

  const safeEvents = Array.isArray(events) ? events : [];

  const handleDownloadCsv = () => {
    if (!safeEvents.length) return;

    // Define the CSV columns (funding-friendly)
    const headers = [
      "timestamp",
      "userId",
      "userName",
      "eventType",
      "gameId",
      "gameTitle",
      "xpDelta",
      "evuDelta",
      "creditsDelta",
      "onChain",
      "txHash",
      "cohort",
      "location",
      "device",
      "selTags",
      "workforceTags",
    ];

    const rows = safeEvents.map((evt) => {
      const {
        timestamp,
        userId,
        userName,
        eventType,
        gameId,
        gameTitle,
        xpDelta,
        evuDelta,
        creditsDelta,
        onChain,
        txHash,
        cohort,
        location,
        device,
        selTags,
        workforceTags,
      } = evt || {};

      return [
        timestamp,
        userId,
        userName,
        eventType,
        gameId,
        gameTitle,
        xpDelta,
        evuDelta,
        creditsDelta,
        onChain ? "yes" : "no",
        txHash,
        cohort,
        location,
        device,
        Array.isArray(selTags) ? selTags.join("|") : selTags,
        Array.isArray(workforceTags) ? workforceTags.join("|") : workforceTags,
      ].map(escapeCsvValue);
    });

    const csv = [
      headers.map(escapeCsvValue).join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `shf-arcade-history-${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ar-history-page">
      {/* Header */}
      <header className="ar-history-header">
        <div>
          <h1 className="ar-history-title">Arcade Impact History</h1>
          <p className="ar-history-subtitle">
            Live feed of game sessions, XP earned, and on-chain proof of
            learning. Use this view for funders, partners, and board reports.
          </p>
        </div>
        <div className="ar-history-badge">
          <span className="ar-history-badge-dot" />
          <span>Polygon-verified arcade events</span>
        </div>
      </header>

      {/* Summary strip */}
      <section className="ar-history-summary">
        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">Total Sessions</div>
          <div className="ar-history-summary-value">
            {summary?.totalSessions ?? (safeEvents.length || "—")}
          </div>
          <div className="ar-history-summary-helper">
            Unique game runs across all students.
          </div>
        </div>

        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">XP Awarded</div>
          <div className="ar-history-summary-value">
            {summary?.totalXp ?? "—"}
          </div>
          <div className="ar-history-summary-helper">
            SHF Arcade XP driving credit and wallet growth.
          </div>
        </div>

        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">On-chain Events</div>
          <div className="ar-history-summary-value">
            {summary?.onChainCount ?? "—"}
          </div>
          <div className="ar-history-summary-helper">
            Logged to Polygon as proof of engagement.
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="ar-history-controls">
        <div className="ar-history-filter-group">
          {/* You can wire these later to filter by eventType */}
          <button className="ar-history-chip ar-history-chip--active">
            All events
          </button>
          <button className="ar-history-chip">Game starts</button>
          <button className="ar-history-chip">Game completes</button>
          <button className="ar-history-chip">Badges</button>
          <button className="ar-history-chip">Tournaments</button>
        </div>

        <label className="ar-history-toggle">
          <input type="checkbox" />
          <span>Show on-chain only</span>
        </label>
      </section>

      {/* Table card */}
      <section className="ar-history-table-card">
        <div className="ar-history-table-wrapper">
          {loading && (
            <div className="ar-history-empty">Loading arcade events…</div>
          )}

          {error && !loading && (
            <div className="ar-history-empty ar-history-empty--error">
              Could not load arcade history. Please try again or check the
              ledger service.
            </div>
          )}

          {!loading && !error && !safeEvents.length && (
            <div className="ar-history-empty">
              No arcade events yet. Once students start playing, this view will
              show every game session and on-chain reward.
            </div>
          )}

          {!loading && !error && safeEvents.length > 0 && (
            <table className="ar-history-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Student</th>
                  <th>Event</th>
                  <th>Game</th>
                  <th>XP / EVU</th>
                  <th>Credits</th>
                  <th>On-chain</th>
                </tr>
              </thead>
              <tbody>
                {safeEvents.map((evt) => (
                  <tr
                    key={
                      evt.id ||
                      `${evt.timestamp}-${evt.userId}-${evt.gameId}-${evt.eventType}`
                    }
                  >
                    <td>{evt.timestampReadable || evt.timestamp}</td>
                    <td>{evt.userName || evt.userId || "—"}</td>
                    <td>{evt.eventType}</td>
                    <td>
                      <div className="ar-history-game">
                        <span className="ar-history-game-title">
                          {evt.gameTitle || evt.gameId || "—"}
                        </span>
                        <div>
                          {Array.isArray(evt.selTags) &&
                            evt.selTags.map((tag) => (
                              <span
                                key={`sel-${evt.id}-${tag}`}
                                className="ar-history-tag ar-history-tag--sel"
                              >
                                {tag}
                              </span>
                            ))}
                          {Array.isArray(evt.workforceTags) &&
                            evt.workforceTags.map((tag) => (
                              <span
                                key={`wf-${evt.id}-${tag}`}
                                className="ar-history-tag ar-history-tag--workforce"
                              >
                                {tag}
                              </span>
                            ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      {evt.xpDelta ?? 0} XP
                      {typeof evt.evuDelta === "number" && (
                        <> · {evt.evuDelta} EVU</>
                      )}
                    </td>
                    <td>{evt.creditsDelta ?? 0}</td>
                    <td>
                      {evt.onChain ? (
                        <span className="ar-history-onchain">
                          <span className="ar-history-onchain-dot" />
                          <span className="ar-history-onchain-tx">
                            {evt.txHash
                              ? `${evt.txHash.slice(0, 8)}…`
                              : "Recorded"}
                          </span>
                        </span>
                      ) : (
                        <span className="ar-history-onchain ar-history-onchain--off">
                          Off-chain only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: CSV export */}
        <div className="ar-history-footer">
          <button
            type="button"
            className="ar-cta sm"
            onClick={handleDownloadCsv}
            disabled={!safeEvents.length}
          >
            Download CSV (Arcade Impact)
          </button>
          <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}>
            Export a funder-ready snapshot of every arcade session, including
            XP, EVU, credits, and on-chain status.
          </span>
        </div>
      </section>
    </div>
  );
}
