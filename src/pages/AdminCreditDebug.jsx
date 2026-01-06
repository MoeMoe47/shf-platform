// src/pages/AdminCreditDebug.jsx
import React, { useMemo, useState } from "react";
import { useCreditCtx } from "@/context/CreditContext.jsx";
import { rateTable, toSHF } from "@/utils/creditMath.js";

const TOKEN_KEYS = ["corn", "wheat", "heart", "rocket"];

export default function AdminCreditDebug() {
  const credit = useCreditCtx();
  const { balances = {}, score = 620, logs = [], earn, convert, spend, openDispute } = credit || {};

  // --- Earn form ---
  const [award, setAward] = useState({ corn: 0, wheat: 0, heart: 0, rocket: 0, scoreDelta: 0 });

  // --- Convert form ---
  const [bundle, setBundle] = useState({ corn: 0, wheat: 0, heart: 0, rocket: 0 });
  const est = useMemo(() => toSHF(bundle), [bundle]);

  // --- Spend form ---
  const [spendAmt, setSpendAmt] = useState(0);
  const [spendNote, setSpendNote] = useState("");

  function toInt(x) {
    const n = Math.floor(Number(x || 0));
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }

  function handleAward() {
    const rewards = {};
    TOKEN_KEYS.forEach((k) => {
      const v = toInt(award[k]);
      if (v > 0) rewards[k] = v;
    });
    const delta = Number(award.scoreDelta || 0);
    if (!Object.keys(rewards).length && !delta) {
      alert("Nothing to award.");
      return;
    }
    earn?.({ action: "admin.award", rewards, scoreDelta: delta, meta: { via: "admin" } });
    window.shToast?.("✅ Awarded");
  }

  function handleConvert() {
    const clean = {};
    TOKEN_KEYS.forEach((k) => {
      const v = toInt(bundle[k]);
      if (v > 0) clean[k] = v;
    });
    if (!Object.keys(clean).length) {
      alert("Nothing to convert.");
      return;
    }
    convert?.(clean);
  }

  function handleSpend() {
    const amt = toInt(spendAmt);
    if (!amt) {
      alert("Enter a SHF amount to spend.");
      return;
    }
    const res = spend?.(amt, { note: spendNote, via: "admin" }, "admin.spend");
    if (!res?.ok) {
      alert(res?.error || "Could not spend.");
      return;
    }
    window.shToast?.(`💳 −${amt} SHF`);
  }

  function demoDispute() {
    const row = logs?.[0];
    if (!row) {
      alert("No logs to dispute.");
      return;
    }
    openDispute?.({ targetId: row.id, reason: "Example dispute from Admin panel." });
    window.shToast?.("📨 Dispute opened");
  }

  function factoryReset() {
    if (!confirm("Reset local credit state & logs? This is local-only.")) return;
    try {
      localStorage.removeItem("shf.credit.state.v1");
      localStorage.removeItem("shf.credit.ledger.v1");
    } catch {}
    location.reload();
  }

  return (
    <div className="page pad" style={{ display: "grid", gap: 12 }}>
      <div className="card card--pad">
        <div className="sh-row" style={{ alignItems: "baseline" }}>
          <h2 className="h3" style={{ margin: 0 }}>Admin • Credit Debug</h2>
          <div style={{ flex: 1 }} />
          <span className="subtle">Score: <strong>{score}</strong></span>
        </div>

        <div className="sh-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8, marginTop: 8 }}>
          {["shf","corn","wheat","heart","rocket"].map((k) => (
            <Stat key={k} label={k.toUpperCase()} value={Number(balances[k] || 0)} strong={k==="shf"} />
          ))}
        </div>
      </div>

      {/* Award */}
      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Award (earn)</h3>
        <div className="sh-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {TOKEN_KEYS.map((k) => (
            <label key={k} style={{ display:"grid", gap:4 }}>
              <span className="subtle">{k} (+)</span>
              <input
                className="sh-input"
                type="number"
                min="0"
                step="1"
                value={award[k]}
                onChange={(e)=>setAward((s)=>({ ...s, [k]: e.target.value }))}
              />
              <span className="subtle" style={{ fontSize: 12 }}>rate: {rateTable[k]} SHF / {k}</span>
            </label>
          ))}
          <label style={{ display:"grid", gap:4 }}>
            <span className="subtle">score Δ</span>
            <input
              className="sh-input"
              type="number"
              step="1"
              value={award.scoreDelta}
              onChange={(e)=>setAward((s)=>({ ...s, scoreDelta: e.target.value }))}
            />
          </label>
        </div>
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          <button className="sh-btn" onClick={handleAward}>Award now</button>
          <button
            className="sh-btn sh-btn--secondary"
            onClick={()=>setAward({ corn:0, wheat:0, heart:0, rocket:0, scoreDelta:0 })}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Convert */}
      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Convert to SHF</h3>
        <div className="sh-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
          {TOKEN_KEYS.map((k) => (
            <label key={k} style={{ display:"grid", gap:4 }}>
              <span className="subtle">{k} → SHF (max {Number(balances[k] || 0)})</span>
              <input
                className="sh-input"
                type="number"
                min="0"
                step="1"
                value={bundle[k]}
                onChange={(e)=>setBundle((s)=>({ ...s, [k]: e.target.value }))}
              />
              <span className="subtle" style={{ fontSize: 12 }}>rate: {rateTable[k]} SHF / {k}</span>
            </label>
          ))}
        </div>
        <div className="subtle" style={{ marginTop: 8 }}>Estimated: <strong>{est}</strong> SHF</div>
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          <button className="sh-btn" onClick={handleConvert}>Convert</button>
          <button
            className="sh-btn sh-btn--secondary"
            onClick={()=>setBundle({ corn:0, wheat:0, heart:0, rocket:0 })}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Spend */}
      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Spend SHF</h3>
        <div className="sh-grid" style={{ gridTemplateColumns: "180px 1fr", gap: 8 }}>
          <label style={{ display:"grid", gap:4 }}>
            <span className="subtle">SHF amount</span>
            <input
              className="sh-input"
              type="number"
              min="0"
              step="1"
              value={spendAmt}
              onChange={(e)=>setSpendAmt(e.target.value)}
            />
          </label>
          <label style={{ display:"grid", gap:4 }}>
            <span className="subtle">Meta note (optional)</span>
            <input
              className="sh-input"
              value={spendNote}
              onChange={(e)=>setSpendNote(e.target.value)}
              placeholder="eg. admin test"
            />
          </label>
        </div>
        <div className="sh-actionsRow" style={{ marginTop: 8 }}>
          <button className="sh-btn" onClick={handleSpend}>Spend</button>
          <button className="sh-btn sh-btn--secondary" onClick={()=>{ setSpendAmt(0); setSpendNote(""); }}>Clear</button>
        </div>
      </div>

      {/* Tools */}
      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Tools</h3>
        <div className="sh-actionsRow">
          <button className="sh-btn sh-btn--secondary" onClick={()=>window.shToast?.("🔔 Test toast")}>Test toast</button>
          <button className="sh-btn sh-btn--secondary" onClick={demoDispute}>Open dispute (demo)</button>
          <button className="sh-btn sh-btn--secondary" onClick={factoryReset}>Factory reset (local)</button>
        </div>
      </div>

      {/* Logs */}
      <div className="card card--pad">
        <h3 className="h4" style={{ marginTop: 0 }}>Recent logs</h3>
        {!logs.length ? (
          <div className="subtle">No logs yet.</div>
        ) : (
          <table className="sh-table">
            <thead>
              <tr>
                <th style={{ textAlign:"left" }}>When</th>
                <th>Type</th>
                <th>Action</th>
                <th>Δ</th>
              </tr>
            </thead>
            <tbody>
              {logs.slice(0, 40).map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.ts).toLocaleString()}</td>
                  <td>{r.type}</td>
                  <td>{r.action}</td>
                  <td>
                    {r.shfGain != null
                      ? `${r.shfGain > 0 ? "+" : ""}${r.shfGain} SHF`
                      : (r.scoreDelta ? `${r.scoreDelta>0?"+":""}${r.scoreDelta} score` : "")
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, strong = false }) {
  return (
    <div className="pathRow" style={{ display:"grid", gap:2 }}>
      <div className="subtle" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontWeight: strong ? 700 : 600 }}>{Number(value || 0).toLocaleString()}</div>
    </div>
  );
}
