// src/pages/admin/GrantBinder.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loadMasterNarrativeFromStorage } from "@/utils/binderMerge.js";

/* ---------- Storage keys (same backbone as ToolDashboard) ---------- */

const ADMIN_LOG_KEY = "shf.adminToolLogs.v1";
const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

/* ---------- Funding stream IDs + labels (shared across app) ---------- */

export const FUNDING_STREAM_IDS = [
  "perkins",
  "wioa",
  "essa",
  "medicaid",
  "idea",
  "workforce",
  "philanthropy",
  "civics",
];

const FUNDING_LABELS = {
  perkins: "Perkins V",
  wioa: "WIOA",
  essa: "ESSA Title IV",
  medicaid: "Medicaid",
  idea: "IDEA / Special Ed",
  workforce: "Workforce / Local Board",
  philanthropy: "Private Philanthropy",
  civics: "Civics / Democracy",
};

/* Apps / programs buckets for high-level grouping */
const APP_LABELS = {
  admin: "Admin",
  civic: "Civic Lab",
  career: "Career Center",
  curriculum: "Curriculum",
  arcade: "Arcade",
  debt: "Debt Lab",
  employer: "Employer",
  treasury: "Treasury",
  other: "Other / Misc",
};

/* ---------- Small helpers ---------- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) || typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeFundingId(tag) {
  if (!tag || typeof tag !== "string") return null;
  const s = tag.toLowerCase().trim();

  if (s.includes("perkins")) return "perkins";
  if (s.includes("wioa")) return "wioa";
  if (s.includes("essa")) return "essa";
  if (s.includes("medicaid")) return "medicaid";
  if (s.includes("idea")) return "idea";
  if (s.includes("workforce")) return "workforce";
  if (s.includes("civic")) return "civics";
  if (s.includes("philanth")) return "philanthropy";

  // already normalized?
  if (FUNDING_STREAM_IDS.includes(s)) return s;
  return null;
}

function normalizeApp(source, rawApp) {
  const s = (rawApp || "").toLowerCase();
  if (s.includes("civic")) return "civic";
  if (s.includes("career")) return "career";
  if (s.includes("curriculum")) return "curriculum";
  if (s.includes("arcade")) return "arcade";
  if (s.includes("debt")) return "debt";
  if (s.includes("employer")) return "employer";
  if (s.includes("treasury")) return "treasury";
  if (s.includes("admin")) return "admin";
  if (source === "civic") return "civic";
  if (source === "admin") return "admin";
  return "other";
}

function normalizeFundingArray(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  const out = new Set();
  for (const item of arr) {
    if (typeof item === "string") {
      // split "Perkins V, WIOA" style strings
      const bits = item.split(/[;,/]+/);
      for (const bit of bits) {
        const id = normalizeFundingId(bit);
        if (id) out.add(id);
      }
    }
  }
  return Array.from(out);
}

/**
 * Normalizes a single log entry from either Admin or Civic.
 * We keep this forgiving so older logs still render.
 */
function normalizeEntry(source, item, idx) {
  const ts = item.timestamp || item.at || Date.now();
  const id = item.id || `${source}-${idx}-${ts}`;

  const app = normalizeApp(source, item.app || item.appId);
  const siteId = item.siteId || item.site || null;
  const programId = item.programId || item.program || item.pathwayId || null;

  // Try to extract funding tags from several possible shapes
  const fundingStreams =
    normalizeFundingArray(
      item.fundingStreams ||
        item.funding_tags ||
        item.fundingTags ||
        item.funding
    );

  const duration = Number(item.duration || item.minutes || 0);
  const summary =
    item.summary ||
    item.missionTitle ||
    item.title ||
    item.goalLabel ||
    "";
  const outcome = item.outcome || item.notes || "";

  return {
    id,
    source, // "admin" | "civic"
    app,
    siteId,
    programId,
    fundingStreams,
    duration,
    summary,
    outcome,
    timestamp: ts,
    raw: item,
  };
}

function getQueryFilters(location) {
  const params = new URLSearchParams(location.search || "");
  const funding = params.get("funding") || "";
  const app = params.get("app") || "";
  const site = params.get("site") || "";
  return { funding, app, site };
}

function updateQuery(navigate, location, filters) {
  const params = new URLSearchParams(location.search || "");
  if (filters.funding) params.set("funding", filters.funding);
  else params.delete("funding");

  if (filters.app) params.set("app", filters.app);
  else params.delete("app");

  if (filters.site) params.set("site", filters.site);
  else params.delete("site");

  const search = params.toString();
  navigate(
    {
      pathname: location.pathname,
      search: search ? `?${search}` : "",
    },
    { replace: true }
  );
}

function exportBlob(filename, text, type = "text/plain;charset=utf-8") {
  try {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

function buildMarkdown(entries, labelForFunding) {
  if (!entries.length) {
    return "# Grant Binder Export\n\n_No entries match the current filters._\n";
  }

  const lines = [];
  lines.push("# Grant Binder Export");
  lines.push("");
  lines.push(
    `Total entries: ${entries.length}  ·  Total minutes: ${entries
      .reduce((s, e) => s + (e.duration || 0), 0)
      .toFixed(1)}`
  );
  lines.push("");

  for (const e of entries) {
    const funding = e.fundingStreams.map(labelForFunding).join(", ") || "—";
    const site = e.siteId || "—";
    const program = e.programId || "—";
    const appLabel = APP_LABELS[e.app] || e.app || "Other";

    lines.push(`## ${e.summary || "Untitled entry"}`);
    lines.push("");
    lines.push(`- Source: **${e.source}**`);
    lines.push(`- App: **${appLabel}**`);
    lines.push(`- Site: **${site}**`);
    lines.push(`- Program: **${program}**`);
    lines.push(`- Minutes: **${e.duration || 0}**`);
    lines.push(`- Funding streams: **${funding}**`);
    if (e.outcome) {
      lines.push("");
      lines.push("**Outcome / notes:**");
      lines.push("");
      lines.push(e.outcome);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/* ---------- Component ---------- */

export default function GrantBinder() {
  const location = useLocation();
  const navigate = useNavigate();

  // Narrative meta is written by ToolDashboard sync
  const [{ meta }, setNarrative] = React.useState({
    markdown: "",
    meta: {},
  });

  const [entries, setEntries] = React.useState([]);
  const [fundingFilter, setFundingFilter] = React.useState("");
  const [appFilter, setAppFilter] = React.useState("");
  const [siteFilter, setSiteFilter] = React.useState("");

  React.useEffect(() => {
    // Load master narrative meta for global stats
    try {
      const loaded = loadMasterNarrativeFromStorage();
      setNarrative(loaded);
    } catch {
      setNarrative({ markdown: "", meta: {} });
    }

    // Load raw logs
    const adminLogs = readJSON(ADMIN_LOG_KEY, []);
    const civicLogs = readJSON(CIVIC_LOG_KEY, []);

    const normalized = [
      ...adminLogs.map((item, idx) => normalizeEntry("admin", item, idx)),
      ...civicLogs.map((item, idx) => normalizeEntry("civic", item, idx)),
    ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    setEntries(normalized);

    // Initialize filters from query params
    const { funding, app, site } = getQueryFilters(location);
    if (funding) setFundingFilter(funding);
    if (app) setAppFilter(app);
    if (site) setSiteFilter(site);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Keep URL in sync when filters change
  React.useEffect(() => {
    updateQuery(navigate, location, {
      funding: fundingFilter,
      app: appFilter,
      site: siteFilter,
    });
  }, [fundingFilter, appFilter, siteFilter, navigate, location]);

  const allFundingUsed = React.useMemo(() => {
    const set = new Set();
    for (const e of entries) {
      for (const f of e.fundingStreams || []) set.add(f);
    }
    return Array.from(set);
  }, [entries]);

  const allAppsUsed = React.useMemo(() => {
    const set = new Set();
    for (const e of entries) {
      if (e.app) set.add(e.app);
    }
    return Array.from(set);
  }, [entries]);

  const allSitesUsed = React.useMemo(() => {
    const set = new Set();
    for (const e of entries) {
      if (e.siteId) set.add(e.siteId);
    }
    return Array.from(set);
  }, [entries]);

  const filtered = React.useMemo(() => {
    return entries.filter((e) => {
      if (fundingFilter && !(e.fundingStreams || []).includes(fundingFilter)) {
        return false;
      }
      if (appFilter && e.app !== appFilter) {
        return false;
      }
      if (siteFilter && e.siteId !== siteFilter) {
        return false;
      }
      return true;
    });
  }, [entries, fundingFilter, appFilter, siteFilter]);

  const totalMinutesAll = entries.reduce(
    (sum, e) => sum + Number(e.duration || 0),
    0
  );
  const totalMinutesFiltered = filtered.reduce(
    (sum, e) => sum + Number(e.duration || 0),
    0
  );

  const updatedAt = meta?.updatedAt || "—";

  const handleExportJson = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      filters: {
        funding: fundingFilter || null,
        app: appFilter || null,
        site: siteFilter || null,
      },
      entries: filtered,
    };
    exportBlob(
      "shf-grant-binder-export.json",
      JSON.stringify(payload, null, 2),
      "application/json;charset=utf-8"
    );
  };

  const handleExportMarkdown = () => {
    const md = buildMarkdown(filtered, (id) => FUNDING_LABELS[id] || id);
    exportBlob(
      "shf-grant-binder-export.md",
      md,
      "text/markdown;charset=utf-8"
    );
  };

  return (
    <section className="app-main" aria-labelledby="binder-title">
      <header className="app-header">
        <div>
          <h1 id="binder-title">Grant Binder</h1>
          <p className="app-subtitle">
            Slice your Admin + Civic logs by funding stream, app, and site.
            Export filtered entries straight into Perkins, WIOA, ESSA, Medicaid,
            and philanthropy packets.
          </p>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              opacity: 0.8,
            }}
          >
            Last narrative sync: <strong>{updatedAt}</strong> · Entries:{" "}
            <strong>{entries.length}</strong> · Minutes (all logs):{" "}
            <strong>{totalMinutesAll.toFixed(1)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="sh-btn is-ghost"
              onClick={handleExportJson}
              disabled={!filtered.length}
            >
              Export JSON (filtered)
            </button>
            <button
              type="button"
              className="sh-btn is-ghost"
              onClick={handleExportMarkdown}
              disabled={!filtered.length}
            >
              Export Markdown (filtered)
            </button>
          </div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.75,
              textAlign: "right",
            }}
          >
            Tip: Use <code>?funding=perkins</code> or{" "}
            <code>?funding=wioa&amp;site=east-high</code> on the URL to deep
            link from Investor / Grant dashboards.
          </div>
        </div>
      </header>

      <div className="app-grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* ---------- Left rail: Filters & stats ---------- */}
        <aside
          className="card card--pad"
          aria-label="Grant binder filters"
          style={{ display: "grid", gap: 12 }}
        >
          <strong style={{ fontSize: 15 }}>Filters</strong>

          {/* Funding streams */}
          <div>
            <div
              style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}
            >
              Funding streams
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <button
                type="button"
                className={
                  fundingFilter ? "sh-btn is-ghost" : "sh-btn"
                }
                onClick={() => setFundingFilter("")}
                style={{ fontSize: 12, paddingInline: 10 }}
              >
                All
              </button>
              {FUNDING_STREAM_IDS.filter((id) =>
                allFundingUsed.includes(id)
              ).map((id) => {
                const active = fundingFilter === id;
                const label = FUNDING_LABELS[id] || id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={
                      active ? "sh-btn" : "sh-btn is-ghost"
                    }
                    onClick={() =>
                      setFundingFilter(active ? "" : id)
                    }
                    style={{ fontSize: 12, paddingInline: 10 }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* App bucket */}
          <div>
            <div
              style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}
            >
              App / program bucket
            </div>
            <select
              className="sh-input"
              value={appFilter}
              onChange={(e) => setAppFilter(e.target.value)}
            >
              <option value="">All apps</option>
              {allAppsUsed.map((id) => (
                <option key={id} value={id}>
                  {APP_LABELS[id] || id}
                </option>
              ))}
            </select>
          </div>

          {/* Site selector */}
          <div>
            <div
              style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}
            >
              Site / partner
            </div>
            <select
              className="sh-input"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            >
              <option value="">All sites</option>
              {allSitesUsed.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>

          {/* Filtered stats */}
          <div
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTop: "1px solid var(--line,#e5e7eb)",
              fontSize: 12,
              display: "grid",
              gap: 4,
            }}
          >
            <div>
              Filtered entries:{" "}
              <strong>{filtered.length}</strong>
            </div>
            <div>
              Filtered minutes:{" "}
              <strong>{totalMinutesFiltered.toFixed(1)}</strong>
            </div>
            <div style={{ opacity: 0.8 }}>
              {totalMinutesAll > 0 ? (
                <>
                  This slice is{" "}
                  <strong>
                    {(
                      (totalMinutesFiltered /
                        Math.max(1, totalMinutesAll)) *
                      100
                    ).toFixed(1)}
                    %
                  </strong>{" "}
                  of all logged minutes.
                </>
              ) : (
                "Run a few admin + civic logs and sync the narrative to populate this binder."
              )}
            </div>
          </div>
        </aside>

        {/* ---------- Right: Entries list ---------- */}
        <section
          className="card card--pad"
          aria-label="Grant binder entries"
          style={{ display: "grid", gap: 10 }}
        >
          <strong style={{ fontSize: 15 }}>
            Entries ({filtered.length}) – ready for grant packets
          </strong>

          {!filtered.length && (
            <div
              style={{
                fontSize: 13,
                opacity: 0.8,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px dashed var(--line,#e5e7eb)",
              }}
            >
              No entries match the current filters. Try clearing the
              funding stream, app, or site filters. Once you log more
              Admin sessions and Civic missions (and sync the
              narrative), they’ll show up here.
            </div>
          )}

          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 520,
              overflow: "auto",
            }}
          >
            {filtered.map((e) => {
              const appLabel = APP_LABELS[e.app] || e.app || "Other";
              const funding =
                e.fundingStreams && e.fundingStreams.length
                  ? e.fundingStreams
                  : [];
              const ts = e.timestamp
                ? new Date(e.timestamp).toLocaleString()
                : "—";

              return (
                <article
                  key={e.id}
                  style={{
                    borderRadius: 10,
                    border: "1px solid var(--line,#e5e7eb)",
                    padding: "8px 10px",
                    background: "#fff",
                    display: "grid",
                    gap: 4,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: 2,
                        }}
                      >
                        {e.summary || "Untitled entry"}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.75,
                        }}
                      >
                        {ts}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                        alignItems: "flex-end",
                      }}
                    >
                      <span className="sh-badge is-ghost">
                        {appLabel}
                      </span>
                      {e.siteId && (
                        <span
                          className="sh-badge is-ghost"
                          style={{ fontSize: 11 }}
                        >
                          Site: {e.siteId}
                        </span>
                      )}
                      {e.programId && (
                        <span
                          className="sh-badge is-ghost"
                          style={{ fontSize: 11 }}
                        >
                          Program: {e.programId}
                        </span>
                      )}
                      <span className="sh-badge">
                        {e.duration || 0} min
                      </span>
                    </div>
                  </div>

                  {funding.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      {funding.map((id) => (
                        <span
                          key={id}
                          className="sh-badge is-ghost"
                          style={{ fontSize: 11 }}
                        >
                          {FUNDING_LABELS[id] || id}
                        </span>
                      ))}
                    </div>
                  )}

                  {e.outcome && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        opacity: 0.9,
                      }}
                    >
                      {e.outcome}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
