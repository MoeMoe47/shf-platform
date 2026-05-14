import React from "react";
import { getMode, setMode } from "@/runtime/mode.js";
import { countAllOverrides, isDemoMode, getOverrideEvents } from "@/apps/manifest/overrides.js";

function fmt(ts) {
  if (!ts) return "—";
  try { return String(ts).replace("T", " ").replace("Z", " UTC"); } catch { return String(ts); }
}

export default function ControlPlaneStrip({ contractVersion }) {
  const [tick, setTick] = React.useState(0);
  const [shfMode, setShfMode] = React.useState(() => {
    try { return String(getMode() || "PILOT").toUpperCase(); } catch { return "PILOT"; }
  });

  // Re-render strip when override events happen
  React.useEffect(() => {
    function onEvt() { setTick((n) => n + 1); }
    window.addEventListener("shf:app-state", onEvt);
    return () => window.removeEventListener("shf:app-state", onEvt);
  }, []);

  // Keep DOM/global in sync when mode changes
  React.useEffect(() => {
    try { document.documentElement.setAttribute("data-shf-mode", shfMode); } catch {}
    try { window.__SHF_MODE__ = shfMode; } catch {}
  }, [shfMode]);

  function setRuntimeMode(next) {
    const m = String(next || "PILOT").toUpperCase();
    try { setMode(m); } catch {}
    setShfMode(m);
    // notify app surfaces (AppRegistry can listen + refresh list)
    try { window.dispatchEvent(new CustomEvent("shf:mode", { detail: { mode: m } })); } catch {}
  }

  const liveBadge = isDemoMode() ? "DEMO" : "LIVE";
  const counts = countAllOverrides();
  const ev = getOverrideEvents()?.[0];
  const lastChange = ev?.ts || null;

  return (
    <div className="cp-strip" role="status" aria-label="Control plane status">
      <div className="cp-left">
        <span className={liveBadge === "DEMO" ? "cp-badge cp-demo" : "cp-badge cp-live"}>
          {liveBadge}
        </span>

        <span className="cp-dot">•</span>

        <span className="cp-kv">
          Overrides: <b>{counts.total}</b>
          <span className="cp-sub"> (demo {counts.session} / saved {counts.persisted})</span>
        </span>

        <span className="cp-dot">•</span>

        <span className="cp-kv">
          Last change: <b>{fmt(lastChange)}</b>
        </span>
      </div>

      <div className="cp-right">
        <div className="cp-mode" data-testid="shf-mode-toggle" role="group" aria-label="SHF Mode">
          <div className="cp-modeLabel">Mode</div>

          <button
            type="button"
            className={shfMode === "PILOT" ? "cp-modeBtn cp-modeBtnOn" : "cp-modeBtn"}
            onClick={() => setRuntimeMode("PILOT")}
            title="PILOT mode: safer defaults + pilot gates enforced"
          >
            PILOT
          </button>

          <button
            type="button"
            className={shfMode === "SYSTEM" ? "cp-modeBtn cp-modeBtnOn" : "cp-modeBtn"}
            onClick={() => setRuntimeMode("SYSTEM")}
            title="SYSTEM mode: system-only apps can run, pilot-only apps gated"
          >
            SYSTEM
          </button>
        </div>

        <span className="cp-kv">
          Contract: <b>{contractVersion ?? "?"}</b>
        </span>
      </div>

      <style>{`
        .cp-strip{
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          padding: 10px 12px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
          border-radius: 14px;
          box-shadow: 0 10px 26px rgba(0,0,0,.14);
          margin: 10px 0 14px;
        }
        .cp-left, .cp-right{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .cp-badge{
          font-size: 11px;
          letter-spacing: .12em;
          text-transform: uppercase;
          padding: 5px 9px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          opacity: .95;
          font-weight: 750;
        }
        .cp-demo{ border-color: rgba(255,255,255,.22); background: rgba(255,255,255,.08); }
        .cp-live{ opacity:.9; }
        .cp-dot{ opacity:.55; }
        .cp-kv{ font-size: 12px; opacity:.88; }
        .cp-sub{ opacity:.70; }

        .cp-mode{ display:flex; align-items:center; gap:8px; padding: 6px 8px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.03);
        }
        .cp-modeLabel{ font-size: 11px; letter-spacing:.12em; text-transform: uppercase; opacity:.70; margin-right: 4px; }
        .cp-modeBtn{
          font-size: 11px;
          letter-spacing: .10em;
          text-transform: uppercase;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          color: inherit;
          cursor: pointer;
          opacity: .88;
          font-weight: 750;
        }
        .cp-modeBtn:hover{ opacity: 1; }
        .cp-modeBtnOn{
          border-color: rgba(255,255,255,.22);
          background: rgba(255,255,255,.10);
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
