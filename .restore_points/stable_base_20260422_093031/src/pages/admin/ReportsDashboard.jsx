import React, { useEffect, useMemo, useState } from "react";
import "@/styles/admin.reports.css";

const FABRIC_URL = (import.meta.env.VITE_FABRIC_URL || "http://127.0.0.1:8090").replace(/\/+$/,"");
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || "";

async function jget(path) {
  const r = await fetch(`${FABRIC_URL}${path}`, { headers: { "X-Admin-Key": ADMIN_KEY } });
  const t = await r.text();
  let data = null;
  try { data = JSON.parse(t); } catch { data = { raw: t }; }
  if (!r.ok) throw new Error(data?.detail || data?.message || `HTTP ${r.status}`);
  return data;
}

export default function ReportsDashboard() {
  const [snap, setSnap] = useState(null);
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  const enabled = !!import.meta.env.VITE_ENABLE_ADMIN;

  const badge = useMemo(() => {
    const host = new URL(FABRIC_URL).host;
    return `LOCAL • REPORTS • ${host}`;
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const s = await jget("/reports/snapshot");
      setSnap(s);
      setOut(JSON.stringify(s, null, 2));
    } catch (e) {
      setOut(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  function dl(path) {
    window.open(`${FABRIC_URL}${path}`, "_blank", "noopener,noreferrer");
  }

  useEffect(() => { if (enabled) refresh(); }, [enabled]);

  if (!enabled) return null;

  const usage = snap?.data?.usage?.totals || {};
  const containment = snap?.data?.containment?.current || {};
  const outcomes = snap?.data?.outcomes?.totals || {};
  const sys = snap?.data?.system_health?.totals || {};

  return (
    <div className="shf-rp-shell">
      <div className="shf-rp-top">
        <div>
          <h1 className="shf-rp-title">Reports</h1>
          <p className="shf-rp-sub">Funder-grade rollups and exports. Charts render in UI, data comes from /reports/*.</p>
        </div>
        <div className="shf-rp-badge">
          <span className="shf-rp-dot" />
          <span>{badge}</span>
        </div>
      </div>

      <div className="shf-rp-grid">
        <div className="shf-rp-card">
          <h3>Usage</h3>
          <div className="shf-rp-metric">
            <div>
              <div className="shf-rp-num">{usage.requests ?? 0}</div>
              <div className="shf-rp-mini">Requests (30d default)</div>
            </div>
            <div className="shf-rp-mini">Users: {usage.unique_users ?? 0} • Apps: {usage.unique_apps ?? 0}</div>
          </div>
        </div>

        <div className="shf-rp-card">
          <h3>Containment</h3>
          <div className="shf-rp-metric">
            <div>
              <div className="shf-rp-num">{containment.LIMITED ?? 0}</div>
              <div className="shf-rp-mini">LIMITED now</div>
            </div>
            <div className="shf-rp-mini">OFF: {containment.OFF ?? 0} • ON: {containment.ON ?? 0} • Forced: {containment.forced_overrides ?? 0}</div>
          </div>
        </div>

        <div className="shf-rp-card">
          <h3>Outcomes</h3>
          <div className="shf-rp-metric">
            <div>
              <div className="shf-rp-num">{outcomes.executed ?? 0}</div>
              <div className="shf-rp-mini">Executed</div>
            </div>
            <div className="shf-rp-mini">Plans: {outcomes.plans ?? 0} • Failed: {outcomes.failed ?? 0}</div>
          </div>
        </div>

        <div className="shf-rp-card">
          <h3>System Health</h3>
          <div className="shf-rp-metric">
            <div>
              <div className="shf-rp-num">{sys.errors ?? 0}</div>
              <div className="shf-rp-mini">Errors</div>
            </div>
            <div className="shf-rp-mini">Req: {sys.requests ?? 0} • P95: {sys.p95_ms ?? 0}ms</div>
          </div>
        </div>
      </div>

      <div className="shf-rp-row">
        <button className="shf-rp-btn primary" onClick={refresh} disabled={loading}>Refresh Snapshot</button>
        <button className="shf-rp-btn" onClick={() => dl("/reports/export/usage.csv")} disabled={loading}>Download Usage CSV</button>
        <button className="shf-rp-btn" onClick={() => dl("/reports/export/containment.csv")} disabled={loading}>Download Containment CSV</button>
        <button className="shf-rp-btn" onClick={() => dl("/reports/export/outcomes.csv")} disabled={loading}>Download Outcomes CSV</button>
        <button className="shf-rp-btn" onClick={() => dl("/reports/export/system-health.csv")} disabled={loading}>Download System Health CSV</button>
      </div>

      <pre className="shf-rp-pre">{out || "—"}</pre>
    </div>
  );
}
