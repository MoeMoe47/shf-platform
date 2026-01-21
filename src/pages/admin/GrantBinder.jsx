import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buildUnifiedLogSummary,
  APP_CONFIG,
  FUNDING_STREAM_LABELS,
} from "@/utils/logAggregator.js";

function useQueryParams() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search || ""), [search]);
}

function clampIdentity(v) {
  const x = String(v || "").toLowerCase().trim();
  if (x === "public") return "public";
  if (x === "funder") return "funder";
  return "admin";
}

function toCsvSafe(v) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

function redactLog(log, identity) {
  if (identity === "admin") return log;

  const drop = new Set([
    "email",
    "phone",
    "ip",
    "userAgent",
    "deviceId",
    "sessionId",
    "raw",
    "notes",
    "freeText",
    "prompt",
    "response",
    "evidenceText",
  ]);

  const masked = {};
  Object.keys(log || {}).forEach((k) => {
    if (drop.has(k)) return;
    if (k.toLowerCase().includes("email")) return;
    if (k.toLowerCase().includes("phone")) return;
    if (k.toLowerCase().includes("ip")) return;
    if (k.toLowerCase().includes("useragent")) return;
    if (k.toLowerCase().includes("device")) return;
    if (k.toLowerCase().includes("session")) return;
    if (k.toLowerCase().includes("prompt")) return;
    if (k.toLowerCase().includes("response")) return;
    if (k.toLowerCase().includes("note")) return;
    masked[k] = log[k];
  });

  if (masked.userId) masked.userId = "redacted";
  if (masked.studentId) masked.studentId = "redacted";
  if (masked.clientId) masked.clientId = "redacted";

  return masked;
}

function normalizeSite(log) {
  return (
    log.site ||
    log.siteId ||
    log.program ||
    log.programId ||
    log.org ||
    log.orgId ||
    ""
  );
}

function normalizeApp(log) {
  return log._app || log.appId || log.app || "";
}

function normalizeFundingArray(log) {
  const t =
    log._funding ||
    log.fundingStreams ||
    log.fundingTags ||
    log.fundingStream ||
    log.tags ||
    [];
  const arr = Array.isArray(t) ? t : [t];
  return arr
    .map((x) => String(x || "").toLowerCase().trim())
    .filter(Boolean);
}

function downloadBlob(filename, contentType, text) {
  const blob = new Blob([text], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function buildMarkdownExport({ identity, filters, summary, logs }) {
  const lines = [];
  lines.push(`# Grant Binder Export`);
  lines.push(``);
  lines.push(`**Identity mode:** ${identity}`);
  lines.push(``);
  lines.push(`## Filters`);
  lines.push(`- App: ${filters.app || "All"}`);
  lines.push(`- Site/Program: ${filters.site || "All"}`);
  lines.push(`- Funding Stream: ${filters.funding || "All"}`);
  lines.push(``);
  lines.push(`## Totals`);
  lines.push(`- Minutes: ${summary.totalMinutes}`);
  lines.push(`- Entries: ${summary.totalEntries}`);
  lines.push(``);
  lines.push(`## App Breakdown`);
  Object.values(summary.appSummaries || {}).forEach((a) => {
    lines.push(`- ${a.emoji} ${a.label}: ${a.minutes} min (${a.sharePct}%) · ${a.entries} entries`);
  });
  lines.push(``);
  lines.push(`## Logs (filtered)`);
  lines.push(``);
  logs.slice(0, 250).forEach((l, idx) => {
    const app = normalizeApp(l) || "unknown";
    const site = normalizeSite(l) || "—";
    const dur = Number(l.duration || 0);
    const ts = l.ts || l.timestamp || l.createdAt || "";
    const title = l.title || l.action || l.event || l.type || "log";
    const funding = (normalizeFundingArray(l) || []).slice(0, 4).join(", ");
    lines.push(`### ${idx + 1}. ${title}`);
    lines.push(`- App: ${app}`);
    lines.push(`- Site: ${site}`);
    lines.push(`- Duration: ${dur}`);
    if (ts) lines.push(`- Timestamp: ${ts}`);
    if (funding) lines.push(`- Funding: ${funding}`);
    lines.push(``);
  });
  if (logs.length > 250) {
    lines.push(`(Showing first 250 logs. Total filtered logs: ${logs.length})`);
    lines.push(``);
  }
  return lines.join("\n");
}

const Chip = ({ children, onClear }) => (
  <span
    className="sh-badge is-ghost"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
    }}
  >
    <span>{children}</span>
    {onClear ? (
      <button
        type="button"
        className="sh-btn is-ghost"
        onClick={onClear}
        style={{
          padding: "0 8px",
          lineHeight: "18px",
          borderRadius: 999,
          fontSize: 12,
        }}
        aria-label="Clear filter"
        title="Clear"
      >
        ✕
      </button>
    ) : null}
  </span>
);

export default function GrantBinder() {
  const q = useQueryParams();
  const navigate = useNavigate();

  const appQ = (q.get("app") || "").trim().toLowerCase();
  const siteQ = (q.get("site") || "").trim();
  const fundingQ = (q.get("funding") || "").trim().toLowerCase();
  const identity = clampIdentity(q.get("identity") || "admin");

  const summary = React.useMemo(() => {
    const app = appQ || undefined;
    const site = siteQ || undefined;
    const funding = fundingQ || undefined;
    return buildUnifiedLogSummary({ app, site, funding });
  }, [appQ, siteQ, fundingQ]);

  const allLogs = summary.logs || [];

  const siteOptions = React.useMemo(() => {
    const set = new Set();
    allLogs.forEach((l) => {
      const s = normalizeSite(l);
      if (s) set.add(s);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allLogs]);

  const fundingOptions = React.useMemo(() => {
    const set = new Set();
    allLogs.forEach((l) => normalizeFundingArray(l).forEach((x) => set.add(x)));
    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b));
    return arr;
  }, [allLogs]);

  const redactedLogs = React.useMemo(() => {
    return allLogs.map((l) => redactLog(l, identity));
  }, [allLogs, identity]);

  function setParam(next) {
    const p = new URLSearchParams(q.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") p.delete(k);
      else p.set(k, String(v));
    });
    navigate({ search: `?${p.toString()}` }, { replace: true });
  }

  function exportJSON() {
    const payload = {
      exportedAt: new Date().toISOString(),
      identity,
      filters: { app: appQ || null, site: siteQ || null, funding: fundingQ || null },
      summary: {
        totalMinutes: summary.totalMinutes,
        totalEntries: summary.totalEntries,
        appSummaries: summary.appSummaries,
      },
      logs: redactedLogs,
    };
    downloadBlob(
      `grant-binder.${identity}.${appQ || "all"}.${siteQ || "all"}.${fundingQ || "all"}.json`,
      "application/json;charset=utf-8",
      JSON.stringify(payload, null, 2)
    );
  }

  function exportMarkdown() {
    const md = buildMarkdownExport({
      identity,
      filters: { app: appQ || null, site: siteQ || null, funding: fundingQ || null },
      summary,
      logs: redactedLogs,
    });
    downloadBlob(
      `grant-binder.${identity}.${appQ || "all"}.${siteQ || "all"}.${fundingQ || "all"}.md`,
      "text/markdown;charset=utf-8",
      md
    );
  }

  function exportCSV() {
    const cols = [
      "title",
      "app",
      "site",
      "duration",
      "timestamp",
      "funding",
      "type",
      "action",
      "event",
    ];
    const header = cols.join(",");
    const rows = redactedLogs.map((l) => {
      const row = {
        title: l.title || "",
        app: normalizeApp(l) || "",
        site: normalizeSite(l) || "",
        duration: Number(l.duration || 0),
        timestamp: l.ts || l.timestamp || l.createdAt || "",
        funding: normalizeFundingArray(l).slice(0, 6).join("|"),
        type: l.type || "",
        action: l.action || "",
        event: l.event || "",
      };
      return cols.map((c) => toCsvSafe(row[c])).join(",");
    });
    downloadBlob(
      `grant-binder.${identity}.${appQ || "all"}.${siteQ || "all"}.${fundingQ || "all"}.csv`,
      "text/csv;charset=utf-8",
      [header, ...rows].join("\n")
    );
  }

  const chips = [
    appQ ? (
      <Chip key="app" onClear={() => setParam({ app: "" })}>
        App: {appQ}
      </Chip>
    ) : null,
    siteQ ? (
      <Chip key="site" onClear={() => setParam({ site: "" })}>
        Site: {siteQ}
      </Chip>
    ) : null,
    fundingQ ? (
      <Chip key="funding" onClear={() => setParam({ funding: "" })}>
        Funding: {FUNDING_STREAM_LABELS[fundingQ] || fundingQ}
      </Chip>
    ) : null,
    identity !== "admin" ? (
      <Chip key="identity" onClear={() => setParam({ identity: "admin" })}>
        Identity: {identity}
      </Chip>
    ) : null,
  ].filter(Boolean);

  return (
    <section className="app-main" aria-labelledby="binder-title">
      <header className="app-header">
        <div>
          <h1 id="binder-title">Grant Binder</h1>
          <p className="app-subtitle">
            Filtered, exportable, identity-safe reporting across the same log spine.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="sh-badge">
            Minutes: <strong>{summary.totalMinutes}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Entries: <strong>{summary.totalEntries}</strong>
          </span>
          <button className="sh-btn" type="button" onClick={exportJSON}>
            Export JSON
          </button>
          <button className="sh-btn is-ghost" type="button" onClick={exportMarkdown}>
            Export Markdown
          </button>
          <button className="sh-btn is-ghost" type="button" onClick={exportCSV}>
            Export CSV
          </button>
        </div>
      </header>

      <div className="card card--pad" style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
            alignItems: "end",
          }}
        >
          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>App</div>
            <select
              className="sh-select"
              value={appQ}
              onChange={(e) => setParam({ app: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All apps</option>
              {APP_CONFIG.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Site / Program</div>
            <select
              className="sh-select"
              value={siteQ}
              onChange={(e) => setParam({ site: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All sites</option>
              {siteOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Funding Stream</div>
            <select
              className="sh-select"
              value={fundingQ}
              onChange={(e) => setParam({ funding: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All funding</option>
              {fundingOptions.map((f) => (
                <option key={f} value={f}>
                  {FUNDING_STREAM_LABELS[f] || f}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Identity Mode</div>
            <select
              className="sh-select"
              value={identity}
              onChange={(e) => setParam({ identity: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="admin">Admin (full detail)</option>
              <option value="funder">Funder-safe</option>
              <option value="public">Public-safe</option>
            </select>
          </div>
        </div>

        {chips.length ? (
          <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {chips}
            <button
              type="button"
              className="sh-btn is-ghost"
              onClick={() => navigate({ search: "" }, { replace: true })}
              style={{ fontSize: 12 }}
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      <div
        className="app-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {Object.values(summary.appSummaries || {}).map((a) => (
          <article key={a.id} className="card card--pad">
            <div style={{ fontSize: 18 }}>
              <span style={{ marginRight: 8 }}>{a.emoji}</span>
              {a.label}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {a.minutes} minutes · {a.entries} entries · {a.sharePct}% share
            </div>
            <div
              style={{
                marginTop: 8,
                height: 8,
                borderRadius: 999,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(0, Math.min(100, a.sharePct))}%`,
                  height: "100%",
                  background: "var(--brand,#22c55e)",
                }}
              />
            </div>
          </article>
        ))}
      </div>

      <div className="card card--pad">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Filtered Logs</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Showing <strong>{redactedLogs.length}</strong> entries
              {identity !== "admin" ? " (redacted for safety)" : ""}
            </div>
          </div>
          <a
            className="sh-btn is-ghost"
            href={`/admin.html#/investor-northstar`}
            style={{ fontSize: 12 }}
          >
            Open Investor Northstar →
          </a>
        </div>

        <div style={{ marginTop: 10, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>App</th>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Site</th>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Title</th>
                <th style={{ textAlign: "right", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Minutes</th>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Funding</th>
                <th style={{ textAlign: "left", padding: "8px 6px", borderBottom: "1px solid #e5e7eb" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {redactedLogs.slice(0, 200).map((l, idx) => {
                const app = normalizeApp(l) || "—";
                const site = normalizeSite(l) || "—";
                const title = l.title || l.action || l.event || l.type || "log";
                const mins = Number(l.duration || 0);
                const ts = l.ts || l.timestamp || l.createdAt || "";
                const funding = normalizeFundingArray(l)
                  .slice(0, 3)
                  .map((f) => FUNDING_STREAM_LABELS[f] || f)
                  .join(", ");
                return (
                  <tr key={idx}>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{app}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{site}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{title}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>{mins}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{funding || "—"}</td>
                    <td style={{ padding: "8px 6px", borderBottom: "1px solid #f1f5f9" }}>{ts || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {redactedLogs.length > 200 ? (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
              Showing first 200 entries. Export to capture the full filtered set.
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
