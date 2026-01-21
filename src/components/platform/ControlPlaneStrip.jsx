import React from "react";
import { getControlPlaneStatus } from "@/apps/manifest/runtimeStatus.js";

function chipClass(kind) {
  if (kind === "LIVE") return "cp-chip cp-live";
  if (kind === "DEV") return "cp-chip cp-dev";
  return "cp-chip";
}

export default function ControlPlaneStrip({ compact = false }) {
  const [tick, setTick] = React.useState(0);

  // Refresh periodically so overrides count updates without reload
  React.useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1500);
    return () => clearInterval(t);
  }, []);

  const s = React.useMemo(() => getControlPlaneStatus(), [tick]);

  return (
    <a className="cp-wrap" href={s.adminHref} title="Open Control Plane (Admin App Registry)">
      <span className={chipClass(s.mode)}>{s.mode}</span>
      <span className="cp-chip cp-ghost">
        Overrides: <span className="cp-num">{s.overridesCount}</span>
      </span>
      {!compact && (
        <span className="cp-chip cp-ghost">
          Contract: <span className="cp-num">{s.contractVersion}</span>
        </span>
      )}

      <style>{`
        .cp-wrap{
          display:flex; align-items:center; gap:8px;
          text-decoration:none; color: inherit;
          padding: 6px 8px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.10);
          background: rgba(255,255,255,.03);
        }
        .cp-wrap:hover{
          border-color: rgba(255,255,255,.16);
          background: rgba(255,255,255,.05);
        }
        .cp-chip{
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          letter-spacing: .06em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .cp-ghost{
          letter-spacing: 0;
          text-transform:none;
          opacity:.92;
        }
        .cp-live{
          border-color: rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
        }
        .cp-dev{
          border-color: rgba(255,255,255,.18);
          background: rgba(255,255,255,.06);
        }
        .cp-num{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; opacity:.95; }
      `}</style>
    </a>
  );
}
