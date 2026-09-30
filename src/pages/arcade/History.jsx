import React from "react";
import { useCanonicalArcadeHistory } from "@/shared/arcade/useCanonicalArcadeHistory.js";

const PAGE_SIZE = 50;

function csv(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function readableDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ArcadeHistory() {
  const { items, loading, error, offset, nextOffset, load } = useCanonicalArcadeHistory({ limit: PAGE_SIZE });
  const safeItems = Array.isArray(items) ? items : [];

  const downloadCsv = () => {
    if (!safeItems.length) return;
    const fields = [
      "resultId", "attemptId", "activityId", "activitySlug", "activityTitle",
      "completedAt", "score", "maxScore", "passed", "masteryAchieved",
    ];
    const rows = [fields, ...safeItems.map((item) => fields.map((field) => item[field]))];
    const blob = new Blob([rows.map((row) => row.map(csv).join(",")).join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `canonical-arcade-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="ar-history-page">
      <header className="ar-history-header">
        <div>
          <h1 className="ar-history-title">Arcade History</h1>
          <p className="ar-history-subtitle">Server-recorded Arcade results from the canonical Arcade Result system.</p>
        </div>
        <div className="ar-history-badge"><span className="ar-history-badge-dot" /><span>Canonical results</span></div>
      </header>

      <section className="ar-history-controls">
        <div className="ar-history-toggle">Server-recorded Arcade Results · read only</div>
      </section>

      <section className="ar-history-table-card">
        <div className="ar-history-table-wrapper">
          {loading && <div className="ar-history-empty" role="status">Loading canonical Arcade history…</div>}
          {!loading && error && <div className="ar-history-empty ar-history-empty--error" role="alert">Canonical Arcade history is temporarily unavailable.</div>}
          {!loading && !error && safeItems.length === 0 && <div className="ar-history-empty">No canonical Arcade results have been recorded yet.</div>}
          {!loading && !error && safeItems.length > 0 && (
            <table className="ar-history-table">
              <thead><tr><th>Completed</th><th>Activity</th><th>Score</th><th>Result</th><th>Mastery</th></tr></thead>
              <tbody>
                {safeItems.map((item) => (
                  <tr key={item.resultId}>
                    <td>{readableDate(item.completedAt)}</td>
                    <td><div className="ar-history-game"><span className="ar-history-game-title">{item.activityTitle || item.activitySlug}</span></div></td>
                    <td>{item.score === null || item.score === undefined ? "—" : `${item.score}${item.maxScore === null || item.maxScore === undefined ? "" : ` / ${item.maxScore}`}`}</td>
                    <td>{item.passed === true ? "Passed" : item.passed === false ? "Not passed" : "Recorded"}</td>
                    <td>{item.masteryAchieved ? "Achieved" : "Not achieved"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="ar-history-footer">
          <button type="button" className="ar-cta sm" onClick={downloadCsv} disabled={loading || !!error || !safeItems.length}>Download CSV (Canonical Arcade History)</button>
          {!loading && !error && safeItems.length > 0 && <div className="ar-history-pagination">
            <button type="button" className="ar-cta sm" onClick={() => load(Math.max(0, offset - PAGE_SIZE))} disabled={offset <= 0}>Previous</button>
            <span>Results {offset + 1}–{offset + safeItems.length}</span>
            <button type="button" className="ar-cta sm" onClick={() => nextOffset !== null && load(nextOffset)} disabled={nextOffset === null}>Next</button>
          </div>}
          <span style={{ marginLeft: "0.75rem", fontSize: "0.8rem" }}>Canonical Arcade Result fields only. Evidence and Truth Spine status are not included in this read model.</span>
        </div>
      </section>
    </div>
  );
}
