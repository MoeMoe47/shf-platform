import React from "react";
import { getControlPlaneStatus } from "@/apps/manifest/runtimeStatus.js";

function shallowEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

export default function ControlPlaneStrip({ compact = false }) {
  const [status, setStatus] = React.useState(() => getControlPlaneStatus());

  React.useEffect(() => {
    let alive = true;

    const update = () => {
      if (!alive) return;
      try {
        const next = getControlPlaneStatus();
        setStatus((prev) => (shallowEqual(prev, next) ? prev : next));
      } catch {}
    };

    update();

    window.addEventListener("shf:app-state", update);
    window.addEventListener("storage", update);

    const t = window.setInterval(update, 2000);

    return () => {
      alive = false;
      window.removeEventListener("shf:app-state", update);
      window.removeEventListener("storage", update);
      window.clearInterval(t);
    };
  }, []);

  const mode = status?.mode ?? "DEV";
  const overrides = status?.overridesCount ?? { persisted: 0, session: 0, total: 0 };
  const contractVersion = status?.contractVersion ?? "?";
  const adminHref = status?.adminHref ?? "/admin.html#/app-registry";

  const isDemo = Number(overrides.session || 0) > 0;

  return (
    <a
      className={"cp-strip " + (isDemo ? "cp-demo" : "cp-dev")}
      href={adminHref}
      title="Control Plane: mode / overrides / contract (click to open Admin App Registry)"
      style={{ textDecoration: "none" }}
    >
      <span className="cp-pill">{mode}</span>
      <span className="cp-kv">
        overrides <span className="cp-num">{String(overrides.total || 0)}</span>
        {Number(overrides.session || 0) > 0 ? (
          <span className="cp-sub">
            {" "}
            (demo <span className="cp-num">{String(overrides.session || 0)}</span>)
          </span>
        ) : null}
      </span>
      <span className="cp-dot">•</span>
      <span className="cp-kv">
        contract <span className="cp-num">{String(contractVersion)}</span>
      </span>

      <style>{`
        .cp-strip{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding:6px 10px;
          border-radius:999px;
          border:1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: rgba(255,255,255,.92);
          font-size: 12px;
          line-height: 1;
          letter-spacing: .2px;
          user-select: none;
          white-space: nowrap;
        }
        .cp-dev{
          background: rgba(255,255,255,.06);
          border-color: rgba(255,255,255,.16);
        }
        .cp-demo{
          background: rgba(255,165,0,.10);
          border-color: rgba(255,165,0,.25);
        }
        .cp-pill{
          padding:4px 8px;
          border-radius:999px;
          background: rgba(0,0,0,.25);
          border:1px solid rgba(255,255,255,.10);
          font-weight: 750;
          opacity: .95;
        }
        .cp-kv{ opacity:.92; }
        .cp-sub{ opacity:.78; }
        .cp-dot{ opacity:.55; }
        .cp-num{
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          opacity:.95;
          margin-left:4px;
        }
      `}</style>
    </a>
  );
}
