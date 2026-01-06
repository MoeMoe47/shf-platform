// src/components/admin/AdminSidebar.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";
import { NavLink } from "react-router-dom";
import { loadMasterNarrativeFromStorage } from "@/utils/binderMerge.js";

function navClass({ isActive }) {
  return "app-nav__item" + (isActive ? " active" : "");
}

export default function AdminSidebar() {
  const [hasNarrative, setHasNarrative] = React.useState(false);
  const [updatedAt, setUpdatedAt] = React.useState(null);

  React.useEffect(() => {
    try {
      const { markdown, meta } = loadMasterNarrativeFromStorage();
      setHasNarrative(!!markdown && markdown.trim().length > 0);
      setUpdatedAt(meta?.updatedAt || null);
    } catch {
      setHasNarrative(false);
      setUpdatedAt(null);
    }
  }, []);

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__inner">
        {/* Section label */}
        <div className="app-label">Admin navigation</div>

        {/* Quick search */}
        <div className="app-search">
          <input
            className="app-search__input"
            placeholder="Search admin tools…"
          />
          <span className="app-kbd">/</span>
        </div>

        {/* Primary CTA */}
        <div className="app-cta">
          <button className="app-ctaBtn" type="button">
            <span className="app-ico">⚡</span>
            <span>Generate funding report</span>
          </button>
        </div>

        {/* Workspace pills */}
        <div className="app-ws">
          <button className="app-ws__pill is-active" type="button">
            Core Admin
          </button>
          <button className="app-ws__pill" type="button">
            Grants
          </button>
          <button className="app-ws__pill" type="button">
            Employers
          </button>
        </div>

        {/* Main nav */}
        <nav className="app-nav">
          <AppLink to="/" end className={navClass}>
            <span className="app-ico">📊</span>
            <span>Overview</span>
          </AppLink>

          <AppLink to="/tool-dashboard" className={navClass}>
            <span className="app-ico">🧠</span>
            <span>AI Tool Workflow</span>
          </AppLink>

          <AppLink to="/placement-kpis" className={navClass}>
            <span className="app-ico">📈</span>
            <span>Placement KPIs</span>
          </AppLink>

          <AppLink to="/partner-jobs" className={navClass}>
            <span className="app-ico">📁</span>
            <span>Partner Jobs (CSV)</span>
          </AppLink>

          <AppLink to="/master-narrative" className={navClass}>
            <span className="app-ico">📄</span>
            <span>Grant Narrative</span>
          </AppLink>
        </nav>

        {/* Grant story status */}
        <div className="app-miniRow" style={{ marginTop: 10 }}>
          <span>Grant story</span>
          <span
            className="app-miniMeta"
            style={{
              color: hasNarrative
                ? "var(--green, #15803d)"
                : "var(--danger, #b91c1c)",
            }}
          >
            {hasNarrative
              ? updatedAt
                ? `Ready · ${updatedAt}`
                : "Ready"
              : "Not generated"}
          </span>
        </div>

        {/* Mini meters */}
        <div className="app-mini">
          <div className="app-miniRow">
            <span>Data coverage</span>
            <span className="app-miniMeta">86%</span>
          </div>
          <div className="app-miniMeter" style={{ "--pct": "86%" }}>
            <div className="app-miniBar" />
          </div>

          <div className="app-miniRow">
            <span>Tool usage</span>
            <span className="app-miniMeta">64%</span>
          </div>
          <div className="app-miniMeter" style={{ "--pct": "64%" }}>
            <div className="app-miniBar" />
          </div>
        </div>

        {/* Footer / identity */}
        <div className="app-sideFoot">
          <div className="app-user">
            <div className="app-avatar">A</div>
            <div className="app-userMeta">
              <div className="app-userName">Admin</div>
              <div className="app-userEmail">admin@siliconheartland.org</div>
            </div>
          </div>

          <div className="app-footActions">
            <button className="app-footBtn" type="button">
              <span className="app-ico">🧾</span>
              <span>Audit log</span>
            </button>
            <button className="app-footBtn" type="button">
              <span className="app-ico">⚙️</span>
              <span>Grant settings</span>
            </button>
          </div>

          <div className="app-copy">
            Silicon Heartland · Admin console · v1.0
          </div>
        </div>
      </div>
    </aside>
  );
}
