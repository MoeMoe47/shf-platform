// src/pages/AdminAnalytics.jsx
import React from "react";

const ADMIN_LOG_KEY = "shf.adminToolLogs.v1";
const CIVIC_LOG_KEY = "shf.civicMissionLogs.v1";

const APP_CONFIG = [
  { id: "civic", label: "Civic", emoji: "🏛" },
  { id: "career", label: "Career", emoji: "💼" },
  { id: "curriculum", label: "Curriculum", emoji: "📚" },
  { id: "arcade", label: "Arcade", emoji: "🕹️" },
];

const FUNDING_STREAM_LABELS = {
  perkins: "Perkins V",
  wioa: "WIOA",
  essa: "ESSA Title IV",
  medicaid: "Medicaid",
  idea: "IDEA",
  workforce: "Workforce",
  philanthropy: "Philanthropy",
  civics: "Civics / Democracy",
};

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

function normalizeAppId(raw) {
  if (!raw) return null;
  const v = String(raw).toLowerCase();
  if (v.includes("civic")) return "civic";
  if (v.includes("career")) return "career";
  if (v.includes("curriculum")) return "curriculum";
  if (v.includes("arcade")) return "arcade";
  return null;
}

function normalizeFundingTag(tag) {
  if (!tag) return null;
  const v = String(tag).toLowerCase().trim();

  if (v.startsWith("perkins")) return "perkins";
  if (v.startsWith("wioa")) return "wioa";
  if (v.startsWith("essa")) return "essa";
  if (v.includes("medicaid")) return "medicaid";
  if (v.startsWith("idea")) return "idea";
  if (v.includes("workforce")) return "workforce";
  if (v.includes("civic")) return "civics";
  if (v.includes("philanth")) return "philanthropy";

  return null;
}

function summarizeFromLogs(adminLogs, civicLogs) {
  // Tag civic logs as Civic app explicitly
  const civicTagged = (civicLogs || []).map((log) => ({
    ...log,
    _app: "civic",
  }));

  const adminTagged = (adminLogs || []).map((log) => {
    const fallbackApp =
      normalizeAppId(
        log.appId ||
          log.app ||
          log.siteId ||
          log.sourceApp ||
          log.appSlug ||
          log.source
      ) || "admin";

    return {
      ...log,
      _app: fallbackApp,
    };
  });

  const allLogs = [...civicTagged, ...adminTagged];

  const totalMinutesAll = allLogs.reduce(
    (sum, log) => sum + Number(log.duration || 0),
    0
  );
  const totalEntriesAll = allLogs.length;

  const appSummaries = {};
  const fundingTotals = {};

  APP_CONFIG.forEach((app) => {
    appSummaries[app.id] = {
      appId: app.id,
      label: app.label,
      emoji: app.emoji,
      minutes: 0,
      entries: 0,
      sharePct: 0,
      fundingTop: [],
    };
  });

  for (const log of allLogs) {
    const appId = log._app;
    const duration = Number(log.duration || 0);

    if (APP_CONFIG.some((a) => a.id === appId)) {
      const s = appSummaries[appId];
      s.minutes += duration;
      s.entries += 1;

      const tags =
        log.fundingStreams ||
        log.fundingTags ||
        log.fundingStream ||
        log.tags ||
        [];

      (Array.isArray(tags) ? tags : [tags]).forEach((tag) => {
        const norm = normalizeFundingTag(tag);
        if (!norm) return;

        // Track per-app funding minutes
        if (!s._funding) s._funding = {};
        s._funding[norm] = (s._funding[norm] || 0) + duration;

        // Track global funding minutes
        fundingTotals[norm] = (fundingTotals[norm] || 0) + duration;
      });
    }
  }

  // Compute shares + top funding streams per app
  Object.values(appSummaries).forEach((s) => {
    s.sharePct =
      totalMinutesAll > 0
        ? Math.round((s.minutes / totalMinutesAll) * 1000) / 10
        : 0;

    const ft = s._funding || {};
    const top = Object.entries(ft)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([id, minutes]) => ({
        id,
        label: FUNDING_STREAM_LABELS[id] || id,
        minutes,
      }));

    s.fundingTop = top;
    delete s._funding;
  });

  return {
    totalMinutesAll,
    totalEntriesAll,
    appSummaries,
    fundingTotals,
  };
}

export default function AdminAnalytics() {
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    const adminLogs = readJSON(ADMIN_LOG_KEY, []);
    const civicLogs = readJSON(CIVIC_LOG_KEY, []);
    const s = summarizeFromLogs(adminLogs, civicLogs);
    setSummary(s);
  }, []);

  if (!summary) {
    return (
      <section className="app-main" aria-label="Admin analytics loading">
        <div className="card card--pad">Loading analytics…</div>
      </section>
    );
  }

  const { totalMinutesAll, totalEntriesAll, appSummaries } = summary;

  return (
    <section className="app-main" aria-labelledby="admin-analytics-title">
      <header className="app-header">
        <div>
          <h1 id="admin-analytics-title">SHF App Analytics Overview</h1>
          <p className="app-subtitle">
            One view across Civic, Career, Curriculum, and Arcade —
            all driven off the same mission + admin log spine.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <span className="sh-badge">
            Total minutes logged: <strong>{totalMinutesAll}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Total entries: <strong>{totalEntriesAll}</strong>
          </span>
          <a
            href="/admin.html#/binder"
            className="sh-btn is-ghost"
            style={{ fontSize: 13 }}
          >
            Open Grant Binder →
          </a>
        </div>
      </header>

      <div
        className="app-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {APP_CONFIG.map((app) => {
          const s = appSummaries[app.id];
          const pct = s ? s.sharePct : 0;
          const mins = s ? s.minutes : 0;
          const entries = s ? s.entries : 0;
          const topStreams = s ? s.fundingTop : [];

          return (
            <article
              key={app.id}
              className="card card--pad"
              aria-label={`${app.label} analytics`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 4,
                }}
              >
                <div>
                  <div style={{ fontSize: 18 }}>
                    <span style={{ marginRight: 6 }}>{app.emoji}</span>
                    {app.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    Minutes: <strong>{mins}</strong> · Entries:{" "}
                    <strong>{entries}</strong>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    textAlign: "right",
                    opacity: 0.8,
                  }}
                >
                  Share of all minutes
                  <div style={{ fontSize: 15 }}>
                    <strong>{pct.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
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
                    width: `${Math.max(0, Math.min(100, pct))}%`,
                    height: "100%",
                    background: "var(--brand,#22c55e)",
                  }}
                />
              </div>

              {/* Top funding streams */}
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    opacity: 0.75,
                    marginBottom: 4,
                  }}
                >
                  Top funding streams for this app
                </div>
                {topStreams.length === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                    }}
                  >
                    No explicit funding tags yet — keep using the
                    Funding presets in the Tool Dashboard.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      fontSize: 11,
                    }}
                  >
                    {topStreams.map((fs) => (
                      <span
                        key={fs.id}
                        className="sh-badge is-ghost"
                        style={{ fontSize: 11 }}
                        title={`${fs.label}: ${fs.minutes} minutes tagged`}
                      >
                        {fs.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Binder drill-down */}
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <a
                  href={`/admin.html#/binder?app=${encodeURIComponent(
                    app.id
                  )}`}
                  className="sh-btn is-ghost"
                  style={{ fontSize: 12, paddingInline: 10 }}
                >
                  View {app.label} logs →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
