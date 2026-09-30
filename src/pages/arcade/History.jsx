// src/pages/arcade/History.jsx
// ------------------------------------------------------------
// Legacy/local Arcade activity retained for compatibility and review.
// ------------------------------------------------------------

import React from "react";
import { useArcadeHistory } from "@/shared/arcade/useArcadeHistory.js";

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

    const headers = [
      "timestamp",
      "userId",
      "userName",
      "eventType",
      "gameId",
      "gameTitle",
      "cohort",
      "location",
      "device",
      "selTags",
      "workforceTags",
      "source",
      "authoritative",
    ];

    const rows = safeEvents.map((evt) => {
      const {
        timestamp,
        userId,
        userName,
        eventType,
        gameId,
        gameTitle,
        cohort,
        location,
        device,
        selTags,
        workforceTags,
        source,
        authoritative,
      } = evt || {};

      return [
        timestamp,
        userId,
        userName,
        eventType,
        gameId,
        gameTitle,
        cohort,
        location,
        device,
        Array.isArray(selTags) ? selTags.join("|") : selTags,
        Array.isArray(workforceTags) ? workforceTags.join("|") : workforceTags,
        source,
        authoritative,
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
          <h1 className="ar-history-title">Arcade History</h1>
          <p className="ar-history-subtitle">
            Legacy Arcade activity retained for compatibility and review. Verified outcomes are recorded by the canonical Arcade Result, Verified Evidence, and Truth Spine systems.
          </p>
        </div>
        <div className="ar-history-badge">
          <span className="ar-history-badge-dot" />
          <span>Legacy activity history</span>
        </div>
      </header>

      {/* Summary strip */}
      <section className="ar-history-summary">
        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">History Entries</div>
          <div className="ar-history-summary-value">
            {summary?.totalEntries ?? (safeEvents.length || "—")}
          </div>
          <div className="ar-history-summary-helper">
            Legacy/local history rows; not verified sessions.
          </div>
        </div>

        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">Distinct Games</div>
          <div className="ar-history-summary-value">
            {summary?.distinctGames ?? 0}
          </div>
          <div className="ar-history-summary-helper">
            Game titles represented in legacy history.
          </div>
        </div>

        <div className="ar-history-summary-card">
          <div className="ar-history-summary-label">Activity Types</div>
          <div className="ar-history-summary-value">
            {summary?.distinctEventTypes ?? 0}
          </div>
          <div className="ar-history-summary-helper">
            Historical event labels in these entries.
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
          <button className="ar-history-chip">Badge event records</button>
          <button className="ar-history-chip">Tournaments</button>
        </div>

        <div className="ar-history-toggle">Legacy records · not verified outcomes</div>
      </section>

      {/* Table card */}
      <section className="ar-history-table-card">
        <div className="ar-history-table-wrapper">
          {loading && (
            <div className="ar-history-empty">Loading arcade events…</div>
          )}

          {error && !loading && (
            <div className="ar-history-empty ar-history-empty--error">
            Could not load legacy Arcade history.
            </div>
          )}

          {!loading && !error && !safeEvents.length && (
            <div className="ar-history-empty">
              No legacy Arcade history entries are available.
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
                  <th>Classification</th>
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
                      Legacy event: {evt.eventType}
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
            Download CSV (Arcade History)
          </button>
          <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}>
            Exports legacy activity metadata only. Source: legacy_local_history; authoritative: false.
          </span>
        </div>
      </section>
    </div>
  );
}
