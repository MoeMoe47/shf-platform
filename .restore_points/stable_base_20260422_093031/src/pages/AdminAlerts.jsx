import React from "react";
import {
  listZoomRequests, listZoomApprovals,
  approveZoomAccess, revokeZoomAccess
} from "@/utils/zoomAccess.js";

const LS_RULES = "sh:alerts:rules"; // [{id, name, metric, cohort, op, threshold, windowMin, actions, muted, mutedUntil?}]
const METRICS = [
  { key: "retention_7d", label: "Retention (7d %)" },
  { key: "relayer_fail_rate", label: "Relayer fails / min" },
  { key: "assignment_spike", label: "Assignments submitted / hr" },
  { key: "lesson_dropoff", label: "Lesson drop-offs / hr" },
];
const ACTIONS = ["slack", "email", "jira"];

function readRules() {
  try { return JSON.parse(localStorage.getItem(LS_RULES) || "[]"); } catch { return []; }
}
function writeRules(rules) {
  try { localStorage.setItem(LS_RULES, JSON.stringify(rules)); } catch {}
}

// helper for safe JSON stringify in <code> cells
function shortJSON(o) {
  try {
    const s = JSON.stringify(o || {});
    return s.length > 120 ? s.slice(0,117) + "…" : s;
  } catch { return "{}"; }
}

export default function AdminAlerts() {
  const [rules, setRules] = React.useState(() => readRules());
  const [form, setForm] = React.useState({
    name: "Retention dip (any cohort)",
    metric: "retention_7d",
    cohort: "any",
    op: "sigma",
    threshold: 3,
    windowMin: 60,
    actions: { slack: true, email: true, jira: false },
    muted: false,
  });

  // ---- Zoom approvals state ----
  const [requests, setRequests] = React.useState(() => listZoomRequests());
  const [approvals, setApprovals] = React.useState(() => listZoomApprovals());

  // ---- Recent alerts stream (read from analytics bus) ----
  const [recent, setRecent] = React.useState([]); // {ts,name,props:{severity,muted,ruleId,...}}
  React.useEffect(() => {
    function onEvt(e){
      if (e?.detail?.channel !== "analytics") return;
      const p = e.detail.payload;
      // Only keep "alert-like" events (named by our testFire + anything with severity prop)
      const isAlert = p?.name?.includes("alerts_") || p?.props?.severity;
      if (!isAlert) return;
      setRecent((prev) => [p, ...prev].slice(0, 120));
    }
    window.addEventListener("sh:bus", onEvt);
    return () => window.removeEventListener("sh:bus", onEvt);
  }, []);

  // auto-trim expired mutes (mutedUntil) on mount/render
  React.useEffect(() => {
    const now = Date.now();
    const next = rules.map(r => (r.mutedUntil && r.mutedUntil < now)
      ? ({ ...r, muted: false, mutedUntil: undefined })
      : r
    );
    if (JSON.stringify(next) !== JSON.stringify(rules)) {
      setRules(next); writeRules(next);
    }
  }, []); // run once on mount

  // refresh Zoom lists periodically
  React.useEffect(() => {
    const t = setInterval(() => {
      setRequests(listZoomRequests());
      setApprovals(listZoomApprovals());
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // ---- Rule CRUD ----
  function addRule() {
    const id = "r_" + Math.random().toString(36).slice(2, 8);
    const next = [...rules, { id, ...form }];
    setRules(next); writeRules(next);
  }
  function removeRule(id) {
    const next = rules.filter(r => r.id !== id);
    setRules(next); writeRules(next);
  }
  function toggleMute(id) {
    const next = rules.map(r => r.id === id ? { ...r, muted: !r.muted, mutedUntil: undefined } : r);
    setRules(next); writeRules(next);
  }
  function mute24h(id) {
    const until = Date.now() + 24*3600*1000;
    const next = rules.map(r => r.id === id ? { ...r, muted: true, mutedUntil: until } : r);
    setRules(next); writeRules(next);
  }

  // Emit a synthetic alert event onto the bus; AdminDashboard will pick it up
  function testFire(rule) {
    const payload = {
      ts: Date.now(),
      name: "alerts_rule_test_fired",
      props: {
        ruleId: rule.id,
        name: rule.name,
        metric: rule.metric,
        cohort: rule.cohort,
        severity: rule.metric.includes("relayer") ? "critical" : "warning",
        muted: !!rule.muted || (rule.mutedUntil && rule.mutedUntil > Date.now()),
      },
    };
    window.dispatchEvent(new CustomEvent("sh:bus", { detail: { channel: "analytics", payload } }));
    // eslint-disable-next-line no-console
    console.log("[alerts] test fired", payload.props);
  }

  // ---- Zoom approvals actions ----
  const approve = (userId, hours = 4) => {
    approveZoomAccess(userId, { approver: "admin", hours });
    setRequests(listZoomRequests());
    setApprovals(listZoomApprovals());
  };
  const revoke = (userId) => {
    revokeZoomAccess(userId, "policy");
    setRequests(listZoomRequests());
    setApprovals(listZoomApprovals());
  };

  // ---- UI helpers ----
  function sevColor(sev){
    if (sev === "critical") return { color: "#b91c1c", fontWeight: 800 };
    if (sev === "warning")  return { color: "#b45309", fontWeight: 700 };
    return { color: "#0f172a" };
  }
  function prettyName(evt){
    const n = evt?.name?.replace(/^demo_/, "") || "";
    const base = n;
    return evt?.props?.muted ? `${base} — muted` : base;
  }
  function ruleLabel(ruleId){
    if (!ruleId) return "—";
    const r = rules.find(r => r.id === ruleId);
    return r ? r.name : ruleId;
  }

  return (
    <div style={sx.page}>
      <header style={sx.header}>
        <h1 style={sx.h1}>Alerts & Approvals</h1>
        <a href="/admin" style={sx.linkBtn}>← Admin Home</a>
      </header>

      {/* Rule builder */}
      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Rule Builder</h3>
          <span style={sx.muted}>{rules.length} rules</span>
        </div>

        <div style={sx.formGrid}>
          <label style={sx.label}>Name
            <input style={sx.input} value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
          </label>

          <label style={sx.label}>Metric
            <select style={sx.input} value={form.metric} onChange={e=>setForm({...form, metric:e.target.value})}>
              {METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </label>

          <label style={sx.label}>Cohort
            <input style={sx.input} value={form.cohort} onChange={e=>setForm({...form, cohort:e.target.value})} placeholder="any or cohort id" />
          </label>

          <label style={sx.label}>Window (min)
            <input style={sx.input} type="number" value={form.windowMin} onChange={e=>setForm({...form, windowMin:+e.target.value})} />
          </label>

          <label style={sx.label}>Condition
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <select style={sx.input} value={form.op} onChange={e=>setForm({...form, op:e.target.value})}>
                <option value="sigma">deviation &gt; σ</option>
                <option value="gt">&gt; threshold</option>
                <option value="lt">&lt; threshold</option>
              </select>
              <input
                style={sx.input}
                type="number"
                value={form.threshold}
                onChange={e=>setForm({...form, threshold:+e.target.value})}
                placeholder="σ or absolute value"
              />
            </div>
          </label>

          <fieldset style={sx.fieldset}>
            <legend style={sx.legend}>Actions</legend>
            {ACTIONS.map(a => (
              <label key={a} style={sx.check}>
                <input
                  type="checkbox"
                  checked={!!form.actions[a]}
                  onChange={(e)=>setForm({...form, actions:{...form.actions, [a]:e.target.checked}})}
                />
                <span style={{textTransform:"capitalize"}}>{a}</span>
              </label>
            ))}
          </fieldset>

          <div>
            <label className="sr-only">Muted</label>
            <label style={sx.check}>
              <input
                type="checkbox"
                checked={form.muted}
                onChange={(e)=>setForm({...form, muted:e.target.checked})}
              />
              <span>Start muted</span>
            </label>
          </div>

          <div>
            <button style={sx.btn} onClick={addRule}>Add Rule</button>
          </div>
        </div>
      </section>

      {/* Rules table */}
      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Active Rules</h3>
        </div>
        <div style={{overflow:"auto"}}>
          <table style={sx.table}>
            <thead>
              <tr>
                <th>Name</th><th>Metric</th><th>Cohort</th><th>Cond</th><th>Window</th><th>Actions</th><th>Test</th><th>Mute</th><th>Until</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rules.length===0 ? (
                <tr><td colSpan={10} style={sx.muted}>No rules yet. Add one above.</td></tr>
              ) : rules.map(r=>(
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.metric}</td>
                  <td>{r.cohort}</td>
                  <td>{r.op} {r.threshold}</td>
                  <td>{r.windowMin}m</td>
                  <td>{Object.keys(r.actions).filter(k=>r.actions[k]).join(", ")||"—"}</td>
                  <td><button style={sx.btnTiny} onClick={()=>testFire(r)}>Fire test</button></td>
                  <td>
                    <label style={sx.check}>
                      <input type="checkbox" checked={!!r.muted} onChange={()=>toggleMute(r.id)} /> Mute
                    </label>
                  </td>
                  <td>{r.mutedUntil ? new Date(r.mutedUntil).toLocaleString() : "—"}</td>
                  <td style={{display:"flex", gap:6}}>
                    <button style={sx.btnTiny} onClick={()=>mute24h(r.id)}>Mute 24h</button>
                    <button style={sx.btnTiny} onClick={()=>removeRule(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Alerts (from bus) */}
      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Recent Alerts</h3>
          <span style={sx.muted}>{recent.length} events</span>
        </div>
        <div style={{overflow:"auto"}}>
          <table style={sx.table}>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Severity</th>
                <th>Rule</th>
                <th>Muted</th>
                <th>Props</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={7} style={sx.muted}>No alerts yet. Use “Fire test” above or interact with the app.</td></tr>
              ) : recent.map((e, i) => {
                const muted = !!e?.props?.muted;
                const ruleId = e?.props?.ruleId;
                const sev = (e?.props?.severity || "info").toLowerCase();
                return (
                  <tr key={i}>
                    <td>{new Date(e.ts).toLocaleString()}</td>
                    <td style={{fontWeight:600}}>{prettyName(e)}</td>
                    <td style={sevColor(sev)}>{sev}</td>
                    <td>{ruleLabel(ruleId)}</td>
                    <td>
                      {muted ? <span style={sx.mutedPill}>Muted</span> : "—"}
                    </td>
                    <td><code style={sx.code}>{shortJSON(e.props)}</code></td>
                    <td style={{display:"flex", gap:6}}>
                      {/* Mute 24h / Create Jira ticket are no-ops for now (console) */}
                      {ruleId ? (
                        <button style={sx.btnTiny} onClick={()=>mute24h(ruleId)}>Mute 24h</button>
                      ) : null}
                      <button
                        style={sx.btnTiny}
                        onClick={()=>console.log("[alerts] create_jira_ticket", { ts: e.ts, name: e.name, ruleId })}
                      >
                        Create Jira ticket
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Zoom approvals */}
      <section style={sx.card}>
        <div style={sx.cardHead}>
          <h3 style={sx.cardTitle}>Zoom Access Requests</h3>
          <span style={sx.muted}>{requests.length} pending</span>
        </div>
        <div style={{overflow:"auto"}}>
          <table style={sx.table}>
            <thead><tr><th>User</th><th>Requested</th><th>Note</th><th>Approve</th></tr></thead>
            <tbody>
              {requests.length===0 ? (
                <tr><td colSpan={4} style={sx.muted}>No pending requests.</td></tr>
              ) : requests.map(r=>(
                <tr key={r.userId}>
                  <td>{r.userId}</td>
                  <td>{new Date(r.ts).toLocaleString()}</td>
                  <td><code style={sx.code}>{r.note||""}</code></td>
                  <td style={{display:"flex", gap:6}}>
                    <button style={sx.btnTiny} onClick={()=>approve(r.userId, 1)}>Approve 1h</button>
                    <button style={sx.btnTiny} onClick={()=>approve(r.userId, 4)}>Approve 4h</button>
                    <button style={sx.btnTiny} onClick={()=>approve(r.userId, 24)}>Approve 24h</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 style={{margin:"12px 0 6px"}}>Current Approvals</h4>
        <div style={{overflow:"auto"}}>
          <table style={sx.table}>
            <thead><tr><th>User</th><th>Status</th><th>Expires</th><th>Approver</th><th>Note</th><th>Revoke</th></tr></thead>
            <tbody>
              {approvals.length===0 ? (
                <tr><td colSpan={6} style={sx.muted}>No approvals yet.</td></tr>
              ) : approvals.map(a=>(
                <tr key={a.userId}>
                  <td>{a.userId}</td>
                  <td>{a.approved ? "Approved" : "Revoked"}</td>
                  <td>{a.expiresAt ? new Date(a.expiresAt).toLocaleString() : "—"}</td>
                  <td>{a.approver || "—"}</td>
                  <td><code style={sx.code}>{a.note || ""}</code></td>
                  <td>{a.approved && <button style={sx.btnTiny} onClick={()=>revoke(a.userId)}>Revoke</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ----- styles ----- */
const sx = {
  page: { padding:16, background:"#f6f3ed", minHeight:"100vh", color:"#0f172a", fontFamily:"Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" },
  header: { display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap", marginBottom:12 },
  h1: { margin:0, fontSize:22, fontWeight:800 },
  linkBtn: { border:"1px solid #dcd7ce", background:"#fff", padding:"8px 10px", borderRadius:10, textDecoration:"none", color:"#0f172a", fontWeight:700 },
  card: { background:"#fff", border:"1px solid #e6e4de", borderRadius:12, padding:12, boxShadow:"0 2px 6px rgba(0,0,0,.04)", marginBottom:12 },
  cardHead: { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 },
  cardTitle: { margin:0, fontSize:14, fontWeight:800 },
  muted: { color:"#6b7280", fontSize:13 },

  formGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:10, alignItems:"end" },
  label: { display:"grid", gap:6, fontSize:13, color:"#0f172a" },
  input: { border:"1px solid #dcd7ce", borderRadius:10, padding:"8px 10px", background:"#fff", fontSize:13 },
  fieldset: { border:"1px solid #eee", borderRadius:10, padding:10, display:"grid", gap:6 },
  legend: { fontWeight:700, fontSize:12, color:"#6b7280" },
  check: { display:"inline-flex", alignItems:"center", gap:6, fontSize:13 },

  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  code: { fontSize:12, background:"#0f172a", color:"#fff", padding:"2px 4px", borderRadius:6 },
  btn: { border:"1px solid #dcd7ce", background:"#fff", padding:"8px 10px", borderRadius:10, cursor:"pointer", fontWeight:700 },
  btnTiny: { border:"1px solid #e6e4de", background:"#fff", padding:"4px 8px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700 },

  mutedPill: {
    display:"inline-flex",
    alignItems:"center",
    height:18,
    padding:"0 6px",
    borderRadius:999,
    background:"#f3f4f6",
    color:"#6b7280",
    fontSize:11,
    fontWeight:800,
    lineHeight:1,
  },
};
