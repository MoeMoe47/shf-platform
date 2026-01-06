// src/layouts/FuelLayout.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import FuelBackground from "@/components/fuel/FuelBackground.jsx"; // canvas ambient bg

// Namespaced, conflict-free CSS injection for Fuel
const CSS_ID = "fuel-css";
const CSS = `
:root{
  --ft-bg:var(--shf-foundation-bg, #fffdf7);
  --ft-ink:var(--shf-foundation-ink, #0f172a);
  --ft-dim:var(--shf-foundation-dim, #667085);
  --ft-line:var(--shf-foundation-line, #e7e5e4);
  --ft-chip:var(--shf-foundation-chip, #faf8f4);
  --ft-accent:var(--shf-foundation-accent, #ff4f00);
}
html[data-app="fuel"] body{background:var(--ft-bg);color:var(--ft-ink)}
.ft-wrap{max-width:1280px;margin:0 auto;padding:12px 16px 56px}
.ft-appbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:16px;padding:12px 16px;border:1px solid var(--ft-line);border-radius:16px;background:rgba(255,255,255,.75);backdrop-filter:blur(8px)}
.ft-brand{display:flex;align-items:baseline;gap:10px;font-weight:800;letter-spacing:.02em}
.ft-dot{width:10px;height:10px;border-radius:50%;background:var(--ft-accent)}
.ft-name{font-size:14px}
.ft-sub{font-size:12px;color:var(--ft-dim);text-transform:uppercase}
.ft-nav{display:flex;gap:10px}
.ft-nav a{padding:8px 10px;border-radius:10px;text-decoration:none;color:var(--ft-dim);border:1px solid transparent}
.ft-nav a.active{color:var(--ft-ink);border-color:var(--ft-accent);background:rgba(255,79,0,.06)}
.ft-actions{margin-left:auto;display:flex;gap:8px}
.ft-ghost{border:1px solid var(--ft-line);background:#fff;color:var(--ft-ink);padding:8px;border-radius:10px}

.ft-hero{display:grid;gap:10px;padding:18px 4px 8px}
.ft-metrics{display:flex;gap:10px;flex-wrap:wrap}
.ft-pill{display:flex;align-items:center;gap:8px;border:1px solid var(--ft-line);background:var(--ft-chip);padding:8px 12px;border-radius:999px}
.ft-pill b{font-weight:800}

.ft-main{display:grid;grid-template-columns:1fr 360px;gap:16px;margin-top:8px}
.ft-panel{border:1px solid var(--ft-line);border-radius:16px;background:#fff;overflow:hidden}
.ft-panel .ft-head{padding:12px 14px;border-bottom:1px solid var(--ft-line);font-weight:700}
.ft-panel .ft-body{padding:12px 14px}
.ft-list{display:grid;gap:10px}
@media (max-width:980px){.ft-main{grid-template-columns:1fr}}
`;

function ensureCss(){
  if(document.getElementById(CSS_ID)) return;
  const el=document.createElement("style");
  el.id = CSS_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export default function FuelLayout(){
  React.useEffect(() => {
    // set app scope and inject layout CSS
    document.documentElement.dataset.app = "fuel";
    ensureCss();
  }, []);

  return (
    <div className="ft-wrap">
      {/* Ambient background (behind everything) */}
      <FuelBackground />
      {/* TIP: Tweak behavior:
          <FuelBackground density={0.00022} maxSpeed={0.2} pulseSpeed={0.02} />
      */}
      <header className="ft-appbar">
        <div className="ft-brand">
          <span className="ft-dot" />
          <span className="ft-name">SILICON HEARTLAND</span>
          <span className="ft-sub">Fuel Tank</span>
        </div>

        <nav className="ft-nav">
          <NavLink to="/top">Top</NavLink>
          <NavLink to="/winners">Winners</NavLink>
          <NavLink to="/how">How it works</NavLink>
          <NavLink to="/submit">Submit</NavLink>
        </nav>

        <div className="ft-actions">
          <button className="ft-ghost" title="Search">🔎</button>
        </div>
      </header>

      {/* Routed pages */}
      <Outlet />
    </div>
  );
}
