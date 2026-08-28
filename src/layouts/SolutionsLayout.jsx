// src/layouts/SolutionsLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const ID = "solutions-css";
const CSS = `
html[data-app="solutions"] body { background:#fff; }
.sl-wrap { max-width: 1280px; margin: 0 auto; padding: 12px 16px 56px; }
.sl-appbar{position:sticky;top:0;z-index:10;display:flex;gap:12px;align-items:center;border:1px solid #e7e5e4;border-radius:16px;background:#fff;padding:10px 12px}
.sl-nav a{padding:8px 10px;border-radius:10px;text-decoration:none;color:#667085;border:1px solid transparent}
.sl-nav a.active{color:#0f172a;border-color:#e7e5e4;background:#fafafa}
.sl-return-universe{margin-left:auto;padding:8px 14px;border-radius:999px;border:1px solid #e7e5e4;background:#0f172a;color:#fff;text-decoration:none;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
.sl-return-universe--disabled{background:#f1f0ee;color:#9ca3af;border-color:#e7e5e4;cursor:default}
`;

function ensureCss(){
  if(document.getElementById(ID)) return;
  const el=document.createElement("style"); el.id=ID; el.textContent=CSS; document.head.appendChild(el);
}

// Same env-var-driven pattern as
// src/foundation/layout/FoundationHeader.jsx's Return to Universe pill —
// centralizes the canonical Universe origin in one place
// (VITE_UNIVERSE_ORIGIN) rather than hardcoding a port here, and
// degrades gracefully (a disabled, non-navigating pill) if unconfigured.
const universeOrigin = String(import.meta.env.VITE_UNIVERSE_ORIGIN || "").replace(/\/+$/, "");
const returnToUniverseHref = universeOrigin ? `${universeOrigin}/universe` : "";

export default function SolutionsLayout(){
  React.useEffect(()=>{ document.documentElement.dataset.app="solutions"; ensureCss(); },[]);
  return (
    <div className="app-shell sl-wrap">
      <header className="sl-appbar">
        <strong>Solutions</strong>
        <nav className="sl-nav">
          <NavLink to="/top">Top</NavLink>
        </nav>
        {returnToUniverseHref ? (
          <a className="sl-return-universe" href={returnToUniverseHref} aria-label="Return to Universe">
            Return to Universe
          </a>
        ) : (
          <span
            className="sl-return-universe sl-return-universe--disabled"
            aria-disabled="true"
            title="Universe origin is not configured."
          >
            Return to Universe
          </span>
        )}
      </header>
      <Outlet />
    </div>
  );
}
