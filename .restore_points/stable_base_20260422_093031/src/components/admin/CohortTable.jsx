// src/components/admin/CohortTable.jsx
import React from "react";
import AnomalyBadge from "./AnomalyBadge.jsx";

export default function CohortTable({ rows = [], focusId = "" }) {
  if (!rows.length) return <div className="sh-muted">No cohorts</div>;

  const data = rows.map((r) => ({ ...r, _id: r.id || slugify(r.school + r.program) }));
  const hasFocus = focusId && data.some((d) => d._id === focusId);

  function setFocus(id) {
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("focus", id);
    else url.searchParams.delete("focus");
    window.history.pushState({}, "", url.toString());
  }

  function onRowClick(e, rowId, isFocused) {
    // Ignore clicks that originated on interactive elements (links/buttons)
    const tag = e.target?.closest("a,button,input,label,select,textarea");
    if (tag) return;
    setFocus(isFocused ? "" : rowId);
  }

  return (
    <div style={{ overflow: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Start</th>
            <th>School</th>
            <th>Program</th>
            <th>Instructor</th>
            <th>Wallet %</th>
            <th>Enroll</th>
            <th>1st</th>
            <th>7d</th>
            <th>Done</th>
            <th>Minted</th>
            <th>Jobs</th>
            <th>Anom</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {data.map((r) => {
            const isFocus = focusId && r._id === focusId;
            return (
              <tr
                key={r._id}
                onClick={(e) => onRowClick(e, r._id, isFocus)}
                style={{ ...(isFocus ? styles.focusRow : styles.tr), cursor: "pointer" }}
                aria-current={isFocus ? "true" : undefined}
                title={isFocus ? "Click to clear focus" : "Click to focus this cohort"}
              >
                <td>{r.startMonth}</td>
                <td>{r.school}</td>
                <td>{r.program}</td>
                <td>{r.instructor}</td>
                <td>{r.walletConnPct}%</td>
                <td>{r.enrolled}</td>
                <td>{r.first}</td>
                <td style={sevStyle(r.r7)}>{pct(r.r7)}</td>
                <td>{r.completed}</td>
                <td>{r.minted}</td>
                <td>{r.jobs}</td>
                <td>
                  <AnomalyBadge z={r.anomalyZ} />
                </td>
                <td>
                  <a
                    href={`/admin/analytics?cohort=${encodeURIComponent(r.id)}`}
                    style={styles.link}
                    title="Open in Analytics"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Drill →
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {focusId && !hasFocus && (
        <div style={styles.note}>
          No matching cohort for focus id: <code style={styles.code}>{focusId}</code>
        </div>
      )}
    </div>
  );
}

/* --- helpers --- */
function slugify(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function pct(n) {
  if (n == null || isNaN(n)) return "—";
  return `${Math.round(n * 100)}%`;
}
function sevStyle(v) {
  if (v == null || isNaN(v)) return {};
  if (v < 0.4) return { color: "#b91c1c", fontWeight: 800 }; // critical
  if (v < 0.6) return { color: "#b45309", fontWeight: 700 }; // warning
  return {};
}

/* --- styles --- */
const styles = {
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    fontSize: 13,
    border: "1px solid #e6e4de",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  link: { color: "#ff4f00", fontWeight: 700, textDecoration: "none" },
  tr: { borderBottom: "1px solid #f3f0ea" },
  focusRow: {
    background: "#fff7ed",
    outline: "2px solid #ffedd5",
  },
  note: { padding: 10, color: "#6b7280" },
  code: {
    fontFamily: "ui-monospace, Menlo, Consolas, monospace",
    fontSize: 12,
    background: "#0f172a",
    color: "#fff",
    padding: "1px 4px",
    borderRadius: 4,
  },
};
