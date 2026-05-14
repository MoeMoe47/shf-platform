import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildUnifiedLogSummary, APP_CONFIG, FUNDING_STREAM_LABELS } from "@/utils/logAggregator.js";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search || ""), [search]);
}

function clampMode(v) {
  const x = String(v || "").toLowerCase().trim();
  if (x === "public") return "public";
  if (x === "funder") return "funder";
  return "admin";
}

function redactNumbersForPublic(n, mode) {
  const val = Number(n || 0);
  if (mode === "admin") return val;
  if (val <= 0) return 0;
  if (val < 10) return "1–9";
  if (val < 50) return "10–49";
  if (val < 200) return "50–199";
  if (val < 1000) return "200–999";
  return "1000+";
}

export default function InvestorNorthstar() {
  const q = useQuery();
  const navigate = useNavigate();

  const identity = clampMode(q.get("identity") || "funder");
  const app = (q.get("app") || "").trim().toLowerCase();
  const funding = (q.get("funding") || "").trim().toLowerCase();

  const summary = React.useMemo(() => {
    return buildUnifiedLogSummary({
      app: app || undefined,
      funding: funding || undefined,
    });
  }, [app, funding]);

  function setParam(next) {
    const p = new URLSearchParams(q.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") p.delete(k);
      else p.set(k, String(v));
    });
    navigate({ search: `?${p.toString()}` }, { replace: true });
  }

  const totalMinutes = redactNumbersForPublic(summary.totalMinutes, identity);
  const totalEntries = redactNumbersForPublic(summary.totalEntries, identity);

  return (
    <section className="app-main" aria-labelledby="inv-title">
      <header className="app-header">
        <div>
          <h1 id="inv-title">Investor / Grant Northstar</h1>
          <p className="app-subtitle">
            Cross-app outcomes view driven by the same unified analytics spine.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="sh-badge">
            Total minutes: <strong>{String(totalMinutes)}</strong>
          </span>
          <span className="sh-badge is-ghost">
            Total entries: <strong>{String(totalEntries)}</strong>
          </span>

          <select
            className="sh-select"
            value={identity}
            onChange={(e) => setParam({ identity: e.target.value })}
            style={{ minWidth: 180 }}
          >
            <option value="admin">Admin mode</option>
            <option value="funder">Funder-safe mode</option>
            <option value="public">Public-safe mode</option>
          </select>

          <a className="sh-btn is-ghost" href="/admin.html#/binder" style={{ fontSize: 13 }}>
            Open Grant Binder →
          </a>
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
              value={app}
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
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>Funding Stream</div>
            <select
              className="sh-select"
              value={funding}
              onChange={(e) => setParam({ funding: e.target.value })}
              style={{ width: "100%" }}
            >
              <option value="">All funding</option>
              {Object.keys(FUNDING_STREAM_LABELS).map((k) => (
                <option key={k} value={k}>
                  {FUNDING_STREAM_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
            <button className="sh-btn is-ghost" type="button" onClick={() => navigate({ search: "" }, { replace: true })}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <div
        className="app-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {APP_CONFIG.map((appRow) => {
          const a = summary.appSummaries[appRow.id];
          const minutes = redactNumbersForPublic(a?.minutes || 0, identity);
          const entries = redactNumbersForPublic(a?.entries || 0, identity);

          const top = (a?.fundingTop || []).map((x) => FUNDING_STREAM_LABELS[x.id] || x.label);

          return (
            <article key={appRow.id} className="card card--pad" aria-label={`${appRow.label} investor metrics`}>
              <div style={{ fontSize: 18 }}>
                <span style={{ marginRight: 8 }}>{appRow.emoji}</span>
                {appRow.label}
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Minutes: <strong>{String(minutes)}</strong> · Entries: <strong>{String(entries)}</strong>
              </div>

              <div style={{ marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                Top funding signals: {top.length ? top.join(", ") : "—"}
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <a
                  className="sh-btn is-ghost"
                  href={`/admin.html#/binder?app=${encodeURIComponent(appRow.id)}&identity=${encodeURIComponent(identity)}`}
                  style={{ fontSize: 12 }}
                >
                  View in Binder →
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
