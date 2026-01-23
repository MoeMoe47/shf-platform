import React, { useEffect, useMemo, useState } from "react";

const env = import.meta.env;

const ENABLED = String(env.VITE_ENABLE_ADMIN || "").toLowerCase() === "true";
const FABRIC_URL = (env.VITE_FABRIC_URL || "http://127.0.0.1:8090").replace(/\/+$/, "");
const APP_GATEWAY_KEY = env.VITE_APP_GATEWAY_KEY || "";
const ADMIN_KEY = env.VITE_ADMIN_KEY || "";

function useNow() {
  const [t, setT] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="shf-modalOverlay" role="dialog" aria-modal="true">
      <div className="shf-modal">
        <div className="shf-modalHead">
          <div className="shf-modalTitle">{title}</div>
          <button className="shf-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="shf-modalBody">{children}</div>
      </div>
    </div>
  );
}

export default function AlignmentSwitchboard() {
  if (!ENABLED) return null;

  const now = useNow();

  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const [apps, setApps] = useState([]);
  const [plans, setPlans] = useState([]);
  const [err, setErr] = useState("");
  const [planActionOut, setPlanActionOut] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [confirmPlanId, setConfirmPlanId] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);

  const localBadge = useMemo(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocal = host === "localhost" || host === "127.0.0.1";
    return isLocal ? "LOCAL • ADMIN MODE" : "LIVE • ADMIN MODE";
  }, []);

  async function jget(path, headers = {}) {
    const r = await fetch(`${FABRIC_URL}${path}`, { headers });
    const txt = await r.text();
    if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
    try { return JSON.parse(txt); } catch { return txt; }
  }

  async function jpost(path, body, headers = {}) {
    const r = await fetch(`${FABRIC_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body || {}),
    });
    const txt = await r.text();
    if (!r.ok) throw new Error(txt || `HTTP ${r.status}`);
    try { return JSON.parse(txt); } catch { return txt; }
  }

  async function refreshAll() {
    setLoading(true);
    setErr("");
    try {
      const m = await jget("/admin/mode", { "X-Admin-Key": ADMIN_KEY });
      setMode(m);
    } catch (e) {
      setMode(null);
    }
    try {
      const a = await jget("/admin/apps", { "X-Admin-Key": ADMIN_KEY });
      setApps(Array.isArray(a?.apps) ? a.apps : Array.isArray(a) ? a : []);
    } catch (e) {
      setApps([]);
    }
    try {
      const p = await jget("/admin/align/plans", { "X-Admin-Key": ADMIN_KEY });
      const list = Array.isArray(p?.plans) ? p.plans : Array.isArray(p) ? p : [];
      setPlans(list.map((x) => ({
        planId: x.planId || x.id || x.plan_id || x,
        status: x.status,
        agent: (x.agent && (x.agent.name || x.agent)) || x.agentName || x.agent_id || x.agentId,
        executedAt: x.executedAt,
        requestId: x.requestId,
      })));
    } catch (e) {
      setPlans([]);
    }
    setLoading(false);
  }

  useEffect(() => { refreshAll(); }, []);

  async function setAppState(appId, state) {
    setLoading(true);
    setErr("");
    try {
      const out = await jpost(`/admin/apps/${encodeURIComponent(appId)}/state`, { state }, { "X-Admin-Key": ADMIN_KEY });
      await refreshAll();
      setPlanActionOut(JSON.stringify(out, null, 2));
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setLoading(false);
  }

  async function forceAppState(appId, forced_state) {
    setLoading(true);
    setErr("");
    try {
      const out = await jpost(`/admin/apps/${encodeURIComponent(appId)}/force`, { forced_state }, { "X-Admin-Key": ADMIN_KEY });
      await refreshAll();
      setPlanActionOut(JSON.stringify(out, null, 2));
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setLoading(false);
  }

  async function clearForced(appId) {
    setLoading(true);
    setErr("");
    try {
      const out = await jpost(`/admin/apps/${encodeURIComponent(appId)}/force/clear`, {}, { "X-Admin-Key": ADMIN_KEY });
      await refreshAll();
      setPlanActionOut(JSON.stringify(out, null, 2));
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setLoading(false);
  }

  async function planCall(planId, action, extra) {
    setLoading(true);
    setErr("");
    setPlanActionOut("");
    try {
      if (action === "validate") {
        const out = await jpost("/runs/validate", { planId }, { "X-Admin-Key": ADMIN_KEY });
        setPlanActionOut(JSON.stringify(out, null, 2));
      } else if (action === "dry-run") {
        const out = await jpost("/runs/dry-run", { planId }, { "X-Admin-Key": ADMIN_KEY });
        setPlanActionOut(JSON.stringify(out, null, 2));
      } else if (action === "approve-execute") {
        setConfirmPlanId(planId);
        setConfirmText("");
        setConfirmOpen(true);
      } else {
        const out = await jpost("/runs/execute", { planId, ...(extra || {}) }, { "X-Admin-Key": ADMIN_KEY });
        setPlanActionOut(JSON.stringify(out, null, 2));
      }
      await refreshAll();
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setLoading(false);
  }

  async function confirmExecute() {
    if (confirmText.trim() !== "EXECUTE PLAN") return;
    setConfirmBusy(true);
    setErr("");
    try {
      const out = await jpost("/runs/execute", { planId: confirmPlanId, approved: true }, { "X-Admin-Key": ADMIN_KEY });
      setPlanActionOut(JSON.stringify(out, null, 2));
      setConfirmOpen(false);
      setConfirmPlanId("");
      setConfirmText("");
      await refreshAll();
    } catch (e) {
      setErr(String(e?.message || e));
    }
    setConfirmBusy(false);
  }

  const css = `
  .shf-wrap{max-width:1200px;margin:0 auto;padding:18px 14px;color:rgba(255,255,255,0.92)}
  .shf-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .shf-title{font-size:18px;font-weight:800;letter-spacing:.2px}
  .shf-sub{font-size:12px;opacity:.75;margin-top:2px}
  .shf-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 10px;border-radius:999px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,140,0,0.10);font-size:12px;font-weight:800}
  .shf-dot{width:9px;height:9px;border-radius:999px;background:orange;box-shadow:0 0 18px rgba(255,165,0,0.6)}
  .shf-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .shf-modal .sh-btn{padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.10);color:rgba(255,255,255,0.92);font-weight:700}
  .sh-btn:hover{background:rgba(255,255,255,0.14)}
  .sh-btn:disabled{opacity:.5;cursor:not-allowed}
  .sh-btn--soft{background:rgba(255,255,255,0.06)}
  .shf-card{margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,0.10);background:rgba(0,0,0,0.12)}
  .shf-err{margin-top:10px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,90,90,0.25);background:rgba(255,70,70,0.08);font-size:13px;white-space:pre-wrap}
  .shf-modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,0.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:9999}
  .shf-modal{width:min(720px,100%);border-radius:16px;border:1px solid rgba(255,255,255,0.14);background:rgba(18,18,22,0.96);box-shadow:0 20px 70px rgba(0,0,0,0.5);overflow:hidden}
  .shf-modalHead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.10)}
  .shf-modalTitle{font-weight:900}
  .shf-x{width:34px;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9);font-size:18px}
  .shf-modalBody{padding:14px}
  .shf-input{width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.92);outline:none}
  `;

  return (
    <div className="shf-wrap">
      <style>{css}</style>

      <div className="shf-top">
        <div>
          <div className="shf-title">Admin Switchboard</div>
          <div className="shf-sub">
            Fabric: {FABRIC_URL} • {new Date(now).toLocaleString()}
          </div>
        </div>

        <div className="shf-row">
          <div className="shf-badge" title="Environment badge">
            <span className="shf-dot" aria-hidden />
            {localBadge}
          </div>
          <button className="sh-btn sh-btn--soft" onClick={refreshAll} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <div className="shf-err">{err}</div> : null}

      <div className="shf-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>Control Plane</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            mode: {mode?.fabric?.mode || mode?.mode || "unknown"} • security: {String(mode?.security?.ok ?? "unknown")}
          </div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                <th style={{ padding: "10px 8px" }}>App</th>
                <th style={{ padding: "10px 8px" }}>Owner</th>
                <th style={{ padding: "10px 8px" }}>Risk</th>
                <th style={{ padding: "10px 8px" }}>State</th>
                <th style={{ padding: "10px 8px" }}>Last Seen</th>
                <th style={{ padding: "10px 8px" }}>Forced</th>
                <th style={{ padding: "10px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => {
                const forced = a?.swarm?.forced_state || a?.swarm?.forced || a?.forced_state;
                return (
                  <tr key={a.app_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ fontWeight: 800 }}>{a.display_name || a.app_id}</div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>{a.app_id}</div>
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{a.owner || "admin"}</td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{a.risk_profile || "medium"}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <select
                        value={a?.swarm?.state || "LIMITED"}
                        onChange={(e) => setAppState(a.app_id, e.target.value)}
                        disabled={loading}
                        style={{ padding: 8, borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "inherit" }}
                      >
                        <option value="OFF">OFF</option>
                        <option value="LIMITED">LIMITED</option>
                        <option value="ON">ON</option>
                      </select>
                    </td>
                    <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }}>{a.last_seen_at || "—"}</td>
                    <td style={{ padding: "10px 8px", fontSize: 13 }}>{forced ? <b>{forced}</b> : <span style={{ opacity: 0.6 }}>—</span>}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="sh-btn sh-btn--soft" onClick={() => forceAppState(a.app_id, "OFF")} disabled={loading}>Force OFF</button>
                        <button className="sh-btn sh-btn--soft" onClick={() => forceAppState(a.app_id, "LIMITED")} disabled={loading}>Force LIMITED</button>
                        <button className="sh-btn sh-btn--soft" onClick={() => clearForced(a.app_id)} disabled={loading}>Clear Force</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!apps.length ? (
                <tr>
                  <td colSpan={7} style={{ padding: 12, opacity: 0.75 }}>No apps loaded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shf-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>Plans (Admin)</div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>{plans.length} plans</div>
        </div>

        <div style={{ marginTop: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 920 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
                <th style={{ padding: "10px 8px" }}>PlanId</th>
                <th style={{ padding: "10px 8px" }}>Status</th>
                <th style={{ padding: "10px 8px" }}>Agent</th>
                <th style={{ padding: "10px 8px" }}>Executed</th>
                <th style={{ padding: "10px 8px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.planId} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontSize: 12 }}>{p.planId}</div>
                    {p.requestId ? <div style={{ fontSize: 12, opacity: 0.7 }}>req: {p.requestId}</div> : null}
                  </td>
                  <td style={{ padding: "10px 8px", fontSize: 13 }}>{p.status || "—"}</td>
                  <td style={{ padding: "10px 8px", fontSize: 13 }}>{p.agent || "—"}</td>
                  <td style={{ padding: "10px 8px", fontSize: 12, opacity: 0.85 }}>{p.executedAt || "—"}</td>
                  <td style={{ padding: "10px 8px" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="sh-btn sh-btn--soft" onClick={() => planCall(p.planId, "validate")} disabled={loading}>Validate</button>
                      <button className="sh-btn sh-btn--soft" onClick={() => planCall(p.planId, "dry-run")} disabled={loading}>Dry-run</button>
                      <button className="sh-btn" onClick={() => planCall(p.planId, "approve-execute")} disabled={loading}>Approve + Execute</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!plans.length ? (
                <tr>
                  <td colSpan={5} style={{ padding: 12, opacity: 0.75 }}>No plans loaded.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>Plan action output</div>
          <pre style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", background: "rgba(0,0,0,0.15)", overflowX: "auto", minHeight: 120, whiteSpace: "pre" }}>
            {planActionOut || "—"}
          </pre>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title="Confirm irreversible action"
        onClose={() => { if (!confirmBusy) { setConfirmOpen(false); setConfirmText(""); setConfirmPlanId(""); } }}
      >
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Plan: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{confirmPlanId}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
          Type <b>EXECUTE PLAN</b> to approve + execute.
        </div>
        <div style={{ marginTop: 10 }}>
          <input className="shf-input" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="EXECUTE PLAN" />
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="sh-btn sh-btn--soft" onClick={() => { setConfirmOpen(false); setConfirmText(""); setConfirmPlanId(""); }} disabled={confirmBusy}>Cancel</button>
          <button className="sh-btn" onClick={confirmExecute} disabled={confirmBusy || confirmText.trim() !== "EXECUTE PLAN"}>Execute</button>
        </div>
      </Modal>
    </div>
  );
}
