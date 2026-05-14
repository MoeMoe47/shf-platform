import React from "react";
import { NavLink, Outlet } from "react-router-dom";

// NOTE: We inject namespaced CSS at runtime so nothing bleeds globally.
const CSS_ID = "launchpad-css";
const CSS = `
:root { --lp-line:#e6e8eb; --lp-ink:#0f172a; --lp-dim:#667085; --lp-bg:#ffffff; --lp-chip:#f5f7fa; --lp-accent:#ff4f00; }
html[data-app="launch"] body{background:var(--lp-bg); color:var(--lp-ink);}
.lp-wrap{max-width:1280px;margin:0 auto;padding:12px 16px 56px}
.lp-appbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid var(--lp-line);border-radius:16px;background:rgba(255,255,255,.75);backdrop-filter:blur(8px)}
.lp-brand{display:flex;align-items:baseline;gap:10px;font-weight:800;letter-spacing:.02em}
.lp-dot{width:10px;height:10px;border-radius:50%;background:#ff8a00}
.lp-name{font-size:14px}
.lp-sub{font-size:12px;color:var(--lp-dim);text-transform:uppercase}
.lp-nav{display:flex;gap:14px}
.lp-nav a{padding:8px 10px;border-radius:10px;text-decoration:none;color:var(--lp-dim);border:1px solid transparent}
.lp-nav a.active{color:var(--lp-ink);border-color:var(--lp-accent);background:rgba(255,79,0,.06)}
.lp-actions{margin-left:auto;display:flex;gap:8px}
.lp-ghost{border:1px solid var(--lp-line);background:#fff;color:var(--lp-ink);padding:8px;border-radius:10px}
.lp-hero{display:grid;grid-template-columns:1fr;gap:12px;padding:18px 4px 8px}
.lp-metrics{display:flex;gap:10px;flex-wrap:wrap}
.lp-pill{display:flex;align-items:center;gap:8px;border:1px solid var(--lp-line);background:var(--lp-chip);padding:8px 12px;border-radius:999px}
.lp-pill b{font-weight:800}
.lp-main{display:grid;grid-template-columns:1fr 360px;gap:16px;margin-top:8px}
.lp-panel{border:1px solid var(--lp-line);border-radius:16px;background:#fff;overflow:hidden}
.lp-panel .lp-head{padding:12px 14px;border-bottom:1px solid var(--lp-line);font-weight:700}
.lp-panel .lp-body{padding:12px 14px}
.lp-list{display:grid;gap:10px}
.lp-card{border:1px solid var(--lp-line);border-radius:14px;padding:12px;display:grid;gap:6px;background:#fff}
.lp-card .lp-row{display:flex;align-items:center;justify-content:space-between;gap:10px}
.lp-chip{border:1px solid var(--lp-line);background:var(--lp-chip);border-radius:999px;padding:2px 8px;font-size:11px}
@media (max-width: 980px){ .lp-main{grid-template-columns:1fr} }
`;

function ensureCss() {
  if (document.getElementById(CSS_ID)) return;
  const el = document.createElement("style");
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export default function LaunchLayout() {
  React.useEffect(ensureCss, []);

  return (
    <div className="lp-wrap" data-theme="foundation">
      {/* top app bar */}
      <header className="lp-appbar">
        <div className="lp-brand">
          <span className="lp-dot" />
          <span className="lp-name">SILICON HEARTLAND</span>
          <span className="lp-sub">launchpad</span>
        </div>

        <nav className="lp-nav">
          <NavLink to="/top">Top</NavLink>
          <NavLink to="/latest">Latest</NavLink>
          <NavLink to="/breeding">Breeding</NavLink>
        </nav>

        <div className="lp-actions">
          <button className="lp-ghost" title="Search">🔎</button>
          {/* If you prefer your shared wallet actions, you can swap this with AppHeaderActions later */}
        </div>
      </header>

      <Outlet />
    </div>
  );
}
