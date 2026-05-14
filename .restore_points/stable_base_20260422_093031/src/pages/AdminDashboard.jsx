import React from "react";
import { Link } from "react-router-dom";
import AnomalyBadge from "@/components/admin/AnomalyBadge.jsx"; // you already have this
import { track } from "@/utils/analytics.js";

/**
 * AdminDashboard (standalone)
 * - KPI cards
 * - Alert badges strip (critical/warn in last 2h)
 * - Pinned “serious” events above the realtime stream (dismissable)
 * - ZoomCard (quick join + editable links)
 * - Realtime console-event stream (from analytics shim)
 * - Lightweight charts (SVG) fed by mock data
 */

export default function AdminDashboard() {
  const [events, setEvents] = React.useState([]);
  const [dismissed, setDismissed] = React.useState(() => new Set()); // pinned item dismissals

  const [kpis, setKpis] = React.useState({
    dau: 1280,
    mau: 9021,
    avgSessionMin: 12.6,
    completionRate: 0.62,
    walletConnected: 347,
    nftsIssued: 1189,
  });

  // subscribe to global analytics bus (from your shim)
  React.useEffect(() => {
    function onEvt(e) {
      if (e?.detail?.channel !== "analytics") return;
      const payload = e.detail.payload; // { ts, name, props }
      setEvents((prev) => [payload, ...prev].slice(0, 400));
    }
    window.addEventListener("sh:bus", onEvt);
    return () => window.removeEventListener("sh:bus", onEvt);
  }, []);

  // demo emitters
  const emit = (name, props = {}) => {
    const payload = {
      ts: Date.now(),
      name,
      props: { role: getRole(), ...props },
    };
    window.dispatchEvent(new CustomEvent("sh:bus", { detail: { channel: "analytics", payload } }));
    // eslint-disable-next-line no-console
    console.log("[analytics]", name, payload.props);
  };

  const getRole = () => {
    const q = new URLSearchParams(window.location.search);
    return q.get("admin") ? "admin" : "student";
  };

  // simple mock mutations
  const inc = (key, by = 1) => setKpis((k) => ({ ...k, [key]: (k[key] ?? 0) + by }));
  const bumpCompletion = (by = 0.01) =>
    setKpis((k) => ({ ...k, completionRate: Math.max(0, Math.min(1, k.completionRate + by)) }));

  // chart data (mock)
  const series7 = mockSeries(7, 40, 120);   // last 7d DAU
  const series12 = mockSeries(12, 50, 200); // last 12wk active
  const completionSpark = sparkPointsFromRate(kpis.completionRate);

  // ---------- Alerts & pinned logic ----------
  const twoHoursAgo = Date.now() - 2 * 3600 * 1000;
  const classified = React.useMemo(
    () => events.map((e) => ({ ...e, _sev: severityOf(e), _key: `${e.name}:${e.ts}` })),
    [events]
  );

  const recentAlerts = React.useMemo(
    () =>
      classified.filter((e) => e.ts >= twoHoursAgo && (e._sev === "critical" || e._sev === "warning")),
    [classified, twoHoursAgo]
  );

  const pinned = React.useMemo(
    () =>
      classified
        .filter((e) => e._sev === "critical" || e._sev === "warning")
        .filter((e) => !dismissed.has(e._key))
        .slice(0, 6),
    [classified, dismissed]
  );

  const dismiss = (key) =>
    setDismissed((s) => {
      const n = new Set(Array.from(s));
      n.add(key);
      return n;
    });

  React.useEffect(() => {
    track("admin_dashboard_viewed", { role: getRole() }, { silent: true });
  }, []);

  // ---- Zoom approvals (badge) ----
  const PENDING_LS_KEY = "zoom:pendingApprovals";
  function safeJSON(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return fallback; }
  }
  // keep a live count of pending Zoom approval requests
  const [pendingZoom, setPendingZoom] = React.useState(() => safeJSON(PENDING_LS_KEY, []));
  // stay in sync if another tab or page updates localStorage
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === PENDING_LS_KEY) setPendingZoom(safeJSON(PENDING_LS_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h1 style={styles.h1}>Admin Dashboard</h1>
          <span style={styles.role}>role: {getRole()}</span>
        </div>

        {/* Header controls + QUICK LINKS */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/admin/analytics"
            style={{ ...styles.btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            Analytics →
          </a>
          <a href="/admin/cohorts" style={{ ...styles.btn, textDecoration: "none" }}>Cohorts →</a>
          <a href="/admin/relayer" style={{ ...styles.btn, textDecoration: "none" }}>Relayer →</a>
          <a
            href="/admin/alerts"
            style={{ ...styles.btn, textDecoration: "none", position: "relative", display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            Alerts →
            {pendingZoom.length > 0 && (
              <span style={styles.badgePill} aria-label={`${pendingZoom.length} pending Zoom approvals`}>
                {pendingZoom.length}
              </span>
            )}
          </a>

          <button style={styles.btn} onClick={() => emit("demo_open_admin")}>Emit: open_admin</button>
          <button style={styles.btn} onClick={() => { emit("demo_wallet_connected"); inc("walletConnected"); }}>
            + Wallet Connected
          </button>
          <button style={styles.btn} onClick={() => { emit("demo_nft_issued"); inc("nftsIssued"); }}>
            + NFT Issued
          </button>
          <button style={styles.btn} onClick={() => { emit("demo_course_completion"); bumpCompletion(+0.02); }}>
            ↑ Completion
          </button>
          <button style={styles.btn} onClick={() => { emit("demo_session"); inc("dau", +5); }}>
            + DAU
          </button>
        </div>
      </header>

      {/* ---------- Zoom quick-join card ---------- */}
      <ZoomCard />

      {/* ---------- Alert badges strip ---------- */}
      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h3 style={styles.cardTitle}>Alerts (last 2h)</h3>
          <span style={styles.muted}>
            {recentAlerts.filter((a) => a._sev === "critical").length} critical ·{" "}
            {recentAlerts.filter((a) => a._sev === "warning").length} warning
          </span>
        </div>
        <div style={styles.badgeRow}>
          {recentAlerts.length === 0 ? (
            <div style={styles.muted}>All clear. No recent alerts.</div>
          ) : (
            recentAlerts.slice(0, 12).map((e) => (
              <AnomalyBadge
                key={e._key}
                severity={e._sev}
                label={prettyLabel(e)}
                hint={new Date(e.ts).toLocaleTimeString()}
              />
            ))
          )}
        </div>
      </section>

      {/* KPI cards */}
      <section style={styles.grid}>
        <Card title="DAU (7d)">
          <Kpi big value={kpis.dau} />
          <MiniArea data={series7} height={54} />
        </Card>
        <Card title="MAU (12wk)">
          <Kpi big value={kpis.mau} />
          <MiniArea data={series12} height={54} />
        </Card>
        <Card title="Avg Session (min)">
          <Kpi value={kpis.avgSessionMin.toFixed(1)} />
          <MiniBar data={sparkFromNumber(kpis.avgSessionMin, 8)} height={54} />
        </Card>
        <Card title="Course Completion">
          <Kpi value={(kpis.completionRate * 100).toFixed(0) + "%"} />
          <MiniLine data={completionSpark} height={54} />
        </Card>
        <Card title="Wallets Connected">
          <Kpi value={kpis.walletConnected} />
        </Card>
        <Card title="NFTs Issued">
          <Kpi value={kpis.nftsIssued} />
        </Card>
      </section>

      {/* Pinned “serious” items */}
      <section style={styles.card}>
        <div style={styles.cardHead}>
          <h2 style={styles.h2} aria-label="Pinned incidents">Pinned incidents</h2>
          <span style={styles.muted}>{pinned.length} showing</span>
        </div>
        {pinned.length === 0 ? (
          <div style={styles.muted}>No pinned incidents. You’re good.</div>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {pinned.map((e) => (
              <div key={e._key} style={styles.pinnedRow}>
                <span style={badgeDotStyle(e._sev)} aria-hidden />
                <div style={{ display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                  <b>{prettyLabel(e)}</b>
                  <span style={styles.muted}>· {new Date(e.ts).toLocaleTimeString()}</span>
                  {e?.props?.muted && <span style={styles.mutedPill}>Muted</span>}
                  <code style={styles.codeSmall}>{shortJSON(e.props)}</code>
                </div>
                <button style={styles.btnTiny} onClick={() => dismiss(e._key)}>Dismiss</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Realtime Event Stream */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Realtime Events</h2>
        <div style={styles.eventList} aria-live="polite">
          {events.length === 0 ? (
            <div style={styles.muted}>
              No events yet. Trigger some using the buttons above or interact with the app.
            </div>
          ) : (
            events.map((e, i) => (
              <div key={i} style={styles.eventRow}>
                <div style={styles.eventLeft}>
                  <span style={{ ...styles.eventName, ...(sevStyle(severityOf(e))) }}>
                    {e.name}
                  </span>
                  <span style={styles.eventMeta}>· {new Date(e.ts).toLocaleTimeString()}</span>
                </div>
                <code style={styles.code}>{JSON.stringify(e.props)}</code>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/* ---------- Zoom quick-join card ---------- */
function ZoomCard() {
  const [editing, setEditing] = React.useState(false);
  const [ops, setOps] = React.useState(() => safeGet("zoom:ops") || "https://zoom.us/j/123456789");
  const [incident, setIncident] = React.useState(() => safeGet("zoom:incident") || "https://zoom.us/j/987654321");
  const [copied, setCopied] = React.useState("");

  function save() {
    safeSet("zoom:ops", ops);
    safeSet("zoom:incident", incident);
    setEditing(false);
  }
  function copy(text, which) {
    try { navigator.clipboard.writeText(text); setCopied(which); setTimeout(()=>setCopied(""), 1200); } catch {}
  }
  function join(kind, href) {
    track("zoom_join_clicked", { surface: "admin_dashboard", kind });
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <section style={styles.card} role="region" aria-label="Zoom quick join">
      <div style={{ ...styles.cardHead, alignItems: "center" }}>
        <h3 style={styles.cardTitle} title="Daily Ops + Incident Bridge">Zoom (Ops & Support)</h3>
        {!editing ? (
          <button style={styles.btnTiny} onClick={()=>setEditing(true)} title="Edit Zoom links">Edit</button>
        ) : (
          <div style={{ display:"flex", gap:8 }}>
            <button style={styles.btnTiny} onClick={save}>Save</button>
            <button style={styles.btnTiny} onClick={()=>setEditing(false)}>Cancel</button>
          </div>
        )}
      </div>

      {!editing ? (
        <div style={{ display:"grid", gap:10 }}>
          <div style={zoomRowStyle}>
            <div style={{ display:"grid", gap:4 }}>
              <div style={{ fontWeight:700 }}>Daily Ops</div>
              <div style={styles.muted}>{ops}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="sh-btn sh-btn--primary" onClick={()=>join("ops", ops)}>Join</button>
              <button className="sh-btn sh-btn--secondary" onClick={()=>copy(ops,"ops")}>
                {copied==="ops" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={zoomRowStyle}>
            <div style={{ display:"grid", gap:4 }}>
              <div style={{ fontWeight:700 }}>Incident Bridge</div>
              <div style={styles.muted}>{incident}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="sh-btn sh-btn--primary" onClick={()=>join("incident", incident)}>Join</button>
              <button className="sh-btn sh-btn--secondary" onClick={()=>copy(incident,"incident")}>
                {copied==="incident" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div style={{ fontSize:12, color:"#6b7280" }}>
            Tip: set real links via “Edit”. Stored locally per browser.
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gap:10 }}>
          <label style={zoomLabelStyle}>
            <span>Daily Ops URL</span>
            <input value={ops} onChange={(e)=>setOps(e.target.value)} style={zoomInputStyle} />
          </label>
          <label style={zoomLabelStyle}>
            <span>Incident Bridge URL</span>
            <input value={incident} onChange={(e)=>setIncident(e.target.value)} style={zoomInputStyle} />
          </label>
        </div>
      )}
    </section>
  );
}

const zoomRowStyle = {
  display:"grid",
  gridTemplateColumns:"1fr auto",
  gap:10,
  alignItems:"center",
  border:"1px solid #f1eee8",
  borderRadius:10,
  padding:10,
  background:"#fff"
};
const zoomLabelStyle = { display:"grid", gap:6, fontSize:13 };
const zoomInputStyle = { border:"1px solid #e6e4de", borderRadius:10, padding:"8px 10px", width:"100%" };
function safeGet(k){ try{ return localStorage.getItem(k); }catch{ return null; } }
function safeSet(k,v){ try{ localStorage.setItem(k,v); }catch{} }

/* ---------- tiny components ---------- */
function Card({ title, children }) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHead}>
        <h3 style={styles.cardTitle}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

function Kpi({ value, big = false }) {
  return <div style={{ fontSize: big ? 26 : 22, fontWeight: 800, color: "#0f172a" }}>{value}</div>;
}

/* ---------- micro charts (SVG, no deps) ---------- */
function MiniArea({ data, height = 48 }) {
  const { w, h, d } = pathFromSeries(data, height);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="area chart">
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="rgba(255,79,0,.20)"></path>
      <path d={d} fill="none" stroke="#ff4f00" strokeWidth="2"></path>
    </svg>
  );
}
function MiniLine({ data, height = 48 }) {
  const { w, h, d } = pathFromSeries(data, height);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="line chart">
      <path d={d} fill="none" stroke="#ff4f00" strokeWidth="2"></path>
    </svg>
  );
}
function MiniBar({ data, height = 48 }) {
  const w = 120, h = height, pad = 6;
  const max = Math.max(...data, 1);
  const bw = (w - pad * (data.length + 1)) / data.length;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="bar chart">
      {data.map((v, i) => {
        const x = pad + i * (bw + pad);
        const bh = (v / max) * (h - 4);
        const y = h - bh;
        return <rect key={i} x={x} y={y} width={bw} height={bh} fill="#ff4f00" opacity="0.7" rx="3" />;
      })}
    </svg>
  );
}

/* ---------- helpers ---------- */
function mockSeries(n, lo = 10, hi = 100) {
  return Array.from({ length: n }, () => Math.floor(lo + Math.random() * (hi - lo)));
}
function sparkFromNumber(n, len = 10) {
  const base = Math.max(1, Math.floor(n));
  return Array.from({ length: len }, (_, i) => Math.max(1, base - (len - i) + Math.round(Math.random() * 2)));
}
function sparkPointsFromRate(rate) {
  const end = Math.max(1, Math.round(rate * 100));
  const base = Math.max(1, end - 15);
  return Array.from({ length: 10 }, (_, i) => base + i + Math.round(Math.random() * 3));
}
function pathFromSeries(data, height) {
  const w = 120, h = height;
  const max = Math.max(...data, 1), min = Math.min(...data);
  const dx = w / (data.length - 1 || 1);
  const norm = (v) => (max === min ? h / 2 : h - ((v - min) / (max - min)) * (h - 4) - 2);
  const pts = data.map((v, i) => `${i * dx},${norm(v)}`).join(" L ");
  const d = `M ${pts}`;
  return { w, h, d };
}

// classify + styling helpers
function severityOf(e) {
  const n = (e?.name || "").toLowerCase();
  const sevProp = (e?.props?.severity || "").toLowerCase();

  if (sevProp === "critical" || /critical|severe/.test(sevProp)) return "critical";
  if (n.includes("relayer_failed") || n.includes("mint_failed")) return "critical";
  if (n.includes("alerts_rule_test_fired") || n.includes("retention") || n.includes("dropoff")) return "warning";
  return "info";
}
function prettyLabel(e) {
  const n = e.name.replace(/^demo_/, "");
  const base =
    e._sev === "critical" ? `⚠︎ ${n}` :
    e._sev === "warning"  ? `△ ${n}` :
                            `ℹ︎ ${n}`;
  return e?.props?.muted ? `${base} — muted` : base; // ✅ annotate muted
}
function shortJSON(o) {
  try {
    const s = JSON.stringify(o || {});
    return s.length > 120 ? s.slice(0, 117) + "…" : s;
  } catch { return "{}"; }
}
function sevStyle(sev) {
  if (sev === "critical") return { color: "#b91c1c", fontWeight: 800 };
  if (sev === "warning")  return { color: "#b45309", fontWeight: 700 };
  return {};
}
function badgeDotStyle(sev) {
  const base = { display: "inline-block", width: 8, height: 8, borderRadius: 999, marginRight: 8 };
  if (sev === "critical") return { ...base, background: "#b91c1c" };
  if (sev === "warning")  return { ...base, background: "#b45309" };
  return { ...base, background: "#64748b" };
}

/* ---------- styles ---------- */
const styles = {
  page: {
    padding: 16,
    background: "#f6f3ed",
    minHeight: "100vh",
    color: "#0f172a",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  h1: { margin: 0, fontSize: 22, fontWeight: 800 },
  role: { fontSize: 12, color: "#6b7280", fontWeight: 600 },
  btn: {
    border: "1px solid #dcd7ce",
    background: "#fff",
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 600,
    color: "#0f172a",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
    gap: 12,
    marginBottom: 14,
  },
  section: { marginTop: 10 },
  h2: { fontSize: 16, margin: "0 0 8px", fontWeight: 800 },
  card: {
    background: "#fff",
    border: "1px solid #e6e4de",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 2px 6px rgba(0,0,0,.04)",
    marginBottom: 12,
  },
  cardHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { margin: 0, fontSize: 13, fontWeight: 700, color: "#0f172a" },

  // alerts
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },

  // events
  eventList: {
    border: "1px solid #e6e4de",
    background: "#fff",
    borderRadius: 12,
    maxHeight: "48vh",
    overflow: "auto",
    padding: 8,
    display: "grid",
    gap: 6,
  },
  eventRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 8,
    alignItems: "center",
    borderBottom: "1px solid #f1eee8",
    paddingBottom: 6,
  },
  eventLeft: { display: "flex", alignItems: "baseline", gap: 6 },
  eventName: { fontWeight: 700, color: "#0f172a" },
  eventMeta: { fontSize: 12, color: "#6b7280" },
  code: { fontSize: 12, background: "#0f172a", color: "#fff", padding: "4px 6px", borderRadius: 6 },
  codeSmall: { fontSize: 11, background: "#0f172a", color: "#fff", padding: "2px 4px", borderRadius: 6 },
  muted: { color: "#6b7280", fontSize: 13 },

  // pinned rows
  pinnedRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    gap: 8,
    alignItems: "center",
    padding: "6px 8px",
    border: "1px solid #f1eee8",
    borderRadius: 8,
    background: "#fff",
  },

  // small btn
  btnTiny: {
    border: "1px solid #e6e4de",
    background: "#fff",
    padding: "4px 8px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 700,
  },

  // badge for pending Zoom approvals
  badgePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 18,
    height: 18,
    padding: "0 6px",
    borderRadius: 999,
    background: "#b91c1c",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1,
  },

  // muted flag pill (for pinned rows)
  mutedPill: {
    display: "inline-flex",
    alignItems: "center",
    height: 18,
    padding: "0 6px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: 11,
    fontWeight: 800,
    lineHeight: 1,
  },
};
