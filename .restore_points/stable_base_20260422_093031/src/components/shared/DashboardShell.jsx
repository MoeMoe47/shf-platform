// src/components/shared/DashboardShell.jsx
import React from "react";

/** Reusable dashboard header + tabs + content shell (theme-aware via CSS vars) */
export default function DashboardShell({
  title,
  subtitle,
  tabs = [],           // [{ id, label }]
  activeTab,           // id
  onTabChange = () => {},
  actions,             // React nodes (buttons/links)
  right,               // optional right-side slot
  children,
}) {
  return (
    <section className="db-shell">
      <header className="db-head">
        <div className="db-headL">
          <h1 className="db-title">{title}</h1>
          {subtitle && <p className="db-subtitle">{subtitle}</p>}
        </div>
        <div className="db-headR">
          {actions}
          {right}
        </div>
      </header>

      {tabs.length > 0 && (
        <nav className="db-tabs" aria-label="Dashboard sections">
          {tabs.map((t) => {
            const on = t.id === activeTab;
            return (
              <button
                key={t.id}
                type="button"
                className={`db-tab ${on ? "is-active" : ""}`}
                aria-current={on ? "page" : undefined}
                onClick={() => onTabChange(t.id)}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      )}

      <div className="db-content">{children}</div>
    </section>
  );
}
