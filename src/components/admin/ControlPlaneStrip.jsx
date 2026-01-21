import React from "react";
import { countAllOverrides, isDemoMode, getOverrideEvents } from "@/apps/manifest/overrides.js";

function fmt(ts) {
  if (!ts) return "—";
  try {
    // keep it simple; investors want clarity not locale drama
    return ts.replace("T", " ").replace("Z", " UTC");
  } catch {
    return String(ts);
  }
}

export default function ControlPlaneStrip({ contractVersion }) {
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    function onEvt() { setTick((n) => n + 1); }
    window.addEventListener("shf:app-state", onEvt);
    return () => window.removeEventListener("shf:app-state", onEvt);
  }, []);

  const mode = isDemoMode() ? "DEMO" : "LIVE";
  const counts = countAllOverrides();
  const ev = getOverrideEvents()?.[0];
  const lastChange = ev?.ts || null;

  return (
    <div className="cp-strip" role="status" aria-label="Control plane status">
      <div className="cp-left">
        <span className={mode === "DEMO" ? "cp-badge cp-demo" : "cp-badge cp-live"}>
          {mode}
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
      `}</style>
    </div>
  );
}
