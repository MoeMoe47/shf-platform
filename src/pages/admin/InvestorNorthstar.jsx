// src/pages/admin/InvestorNorthstar.jsx
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

function buildSummary() {
  const adminLogs = readJSON(ADMIN_LOG_KEY, []);
  const civicLogs = readJSON(CIVIC_LOG_KEY, []);

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

  const totalMinutes = allLogs.reduce(
    (sum, log) => sum + Number(log.duration || 0),
    0
  );
  const totalEntries = allLogs.length;

  const minutesByApp = {};
  const minutesByFunding = {};

  APP_CONFIG.forEach((a) => {
    minutesByApp[a.id] = 0;
  });

  for (const log of allLogs) {
    const appId = log._app;
    const duration = Number(log.duration || 0);

    if (APP_CONFIG.some((a) => a.id === appId)) {
      minutesByApp[appId] = (minutesByApp[appId] || 0) + duration;
    }

    const tags =
      log.fundingStreams ||
      log.fundingTags ||
      log.fundingStream ||
      log.tags ||
      [];

    (Array.isArray(tags) ? tags : [tags]).forEach((tag) => {
      const norm = normalizeFundingTag(tag);
      if (!norm) return;
      minutesByFunding[norm] = (minutesByFunding[norm] || 0) + duration;
    });
  }

  return {
    totalMinutes,
    totalEntries,
    minutesByApp,
    minutesByFunding,
  };
}

export default function InvestorNorthstar() {
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    const s = buildSummary();
    setSummary(s);
  }, []);

  if (!summary) {
    return (
      <section className="app-main" aria-label="Investor dashboard loading">
        <div className="card card--pad">Loading investor view…</div>
      </section>
    );
  }

  const { totalMinutes, totalEntries, minutesByApp, minutesByFunding } = summary;

  const fundingEntries = Object.entries(minutesByFunding).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <section className="app-main" aria-labelledby="investor-ns-title">
      <header className="app-header">
        <div>
          <h1 id="investor-ns-title">Investor &amp; Grant Northstar</h1>
          <p className="app-subtitle">
            Cross-app view of SHF usage by app and funding stream —
            ready for pitch decks, grant portals, and board reports.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="sh-badge">
            Total minutes logged: <strong>{totalMinutes}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Total log entries: <strong>{totalEntries}</strong>
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
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 12,
        }}
      >
        {/* By app slice */}
        <article className="card card--pad" aria-label="By application">
          <strong style={{ fontSize: 16 }}>Usage by application</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Each card shows total minutes of AI-assisted work or missions
            in that app, with its share of all logged minutes.
          </p>

          <div
            style={{
              marginTop: 10,
              display: "grid",
              gap: 8,
            }}
          >
            {APP_CONFIG.map((app) => {
              const mins = minutesByApp[app.id] || 0;
              const pct =
                totalMinutes > 0
                  ? Math.round((mins / totalMinutes) * 1000) / 10
                  : 0;

              return (
                <div
                  key={app.id}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid var(--line,#e5e7eb)",
                    background: "#fff",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <div style={{ fontSize: 14 }}>
                      <span style={{ marginRight: 6 }}>{app.emoji}</span>
                      {app.label}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                      {mins} min · {pct.toFixed(1)}%
                    </div>
                  </div>
                  <div
                    style={{
                      height: 6,
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
                  <div style={{ marginTop: 2, fontSize: 11 }}>
                    <a
                      href={`/admin.html#/binder?app=${encodeURIComponent(
                        app.id
                      )}`}
                      className="sh-link"
                    >
                      View {app.label} logs in Grant Binder →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        {/* By funding stream slice */}
        <article className="card card--pad" aria-label="By funding stream">
          <strong style={{ fontSize: 16 }}>Usage by funding stream</strong>
          <p style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
            Minutes tagged to Perkins, WIOA, ESSA, Medicaid, IDEA,
            workforce, philanthropy, and civics narratives.
          </p>

          {fundingEntries.length === 0 ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                opacity: 0.75,
              }}
            >
              No funding tags yet. Use the Funding presets in the Tool
              Dashboard to start tagging sessions and missions.
            </div>
          ) : (
            <div
              style={{
                marginTop: 8,
                display: "grid",
                gap: 6,
              }}
            >
              {fundingEntries.map(([id, minutes]) => {
                const label = FUNDING_STREAM_LABELS[id] || id;
                const pct =
                  totalMinutes > 0
                    ? Math.round((minutes / totalMinutes) * 1000) / 10
                    : 0;

                return (
                  <div
                    key={id}
                    style={{
                      display: "grid",
                      gap: 2,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                      }}
                    >
                      <span>{label}</span>
                      <span style={{ opacity: 0.8 }}>
                        {minutes} min · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "#e5e7eb",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, pct))}%`,
                          height: "100%",
                          background: "#0ea5e9",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11 }}>
                      <a
                        href={`/admin.html#/binder?funding=${encodeURIComponent(
                          id
                        )}`}
                        className="sh-link"
                      >
                        View {label} logs in Grant Binder →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
