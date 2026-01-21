import React from "react";
import { buildUnifiedLogSummary, APP_CONFIG, FUNDING_STREAM_LABELS } from "@/utils/logAggregator.js";

export default function AdminAnalytics() {
  const [summary, setSummary] = React.useState(null);

  React.useEffect(() => {
    const s = buildUnifiedLogSummary();
    setSummary(s);
  }, []);

  if (!summary) {
    return (
      <section className="app-main" aria-label="Admin analytics loading">
        <div className="card card--pad">Loading analytics…</div>
      </section>
    );
  }

  const { totalMinutes, totalEntries, appSummaries } = summary;

  return (
    <section className="app-main" aria-labelledby="admin-analytics-title">
      <header className="app-header">
        <div>
          <h1 id="admin-analytics-title">SHF App Analytics Overview</h1>
          <p className="app-subtitle">
            One view across Civic, Career, Curriculum, and Arcade — all driven off the same log spine.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className="sh-badge">
            Total minutes logged: <strong>{totalMinutes}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Total entries: <strong>{totalEntries}</strong>
          </span>
          <a href="/admin.html#/binder" className="sh-btn is-ghost" style={{ fontSize: 13 }}>
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
            <article key={app.id} className="card card--pad" aria-label={`${app.label} analytics`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 18 }}>
                    <span style={{ marginRight: 6 }}>{app.emoji}</span>
                    {app.label}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                    Minutes: <strong>{mins}</strong> · Entries: <strong>{entries}</strong>
                  </div>
                </div>
                <div style={{ fontSize: 11, textAlign: "right", opacity: 0.8 }}>
                  Share of all minutes
                  <div style={{ fontSize: 15 }}>
                    <strong>{pct.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 6, height: 8, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
                <div style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: "100%", background: "var(--brand,#22c55e)" }} />
              </div>

              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>
                  Top funding streams for this app
                </div>

                {topStreams.length === 0 ? (
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    No explicit funding tags yet — keep using the Funding presets in the Tool Dashboard.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, fontSize: 11 }}>
                    {topStreams.map((fs) => (
                      <span
                        key={fs.id}
                        className="sh-badge is-ghost"
                        style={{ fontSize: 11 }}
                        title={`${fs.label}: ${fs.minutes} minutes tagged`}
                      >
                        {FUNDING_STREAM_LABELS[fs.id] || fs.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <a
                  href={`/admin.html#/binder?app=${encodeURIComponent(app.id)}`}
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
