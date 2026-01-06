// src/layouts/AppShellLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import ToastHub from "@/components/ToastHub.jsx";
import WalletButton from "@/components/WalletButton.jsx";

export default function AppShellLayout({ app="app", Sidebar, title="App", headerRight, children }) {
  const [collapsed, setCollapsed] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem(`${app}.sidebar.collapsed`) || "false"); }
    catch { return false; }
  });
  React.useEffect(() => {
    try { localStorage.setItem(`${app}.sidebar.collapsed`, JSON.stringify(collapsed)); } catch {}
  }, [app, collapsed]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.altKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setCollapsed(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="sh-shell" data-app={app}>
      <header className="sh-header app-header">
        <div className="sh-brand app-brand">
          <a className="brand-link" href={`/${app}.html#/`} aria-label={`${title} Home`}>
            <img alt="Silicon Heartland" src="/assets/brand/shf-logo-stacked.svg" className="brand-mark" />
            <span className="brand-name">{title}</span>
          </a>
        </div>

        <nav className="app-nav" aria-label="Cross app">
          <a className="sh-btn sh-btn--soft" href="/career.html#/dashboard">Career</a>
          <a className="sh-btn sh-btn--soft" href="/curriculum.html#/">Curriculum</a>
          <a className="sh-btn sh-btn--soft" href="/sales.html#/sales/dashboard">Sales</a>
          <a className="sh-btn sh-btn--soft" href="/arcade.html#/dashboard">Arcade</a>
          <a className="sh-btn sh-btn--soft" href="/debt.html#/clock">Debt</a>
        </nav>

        <div className="sh-headerActions" style={{display:"flex",gap:8,alignItems:"center"}}>
          {headerRight}
          <WalletButton className="sh-btn--tiny" />
          <button
            className="sh-btn sh-btn--soft"
            aria-pressed={collapsed}
            title="Toggle sidebar (Alt+S)"
            onClick={() => setCollapsed(v => !v)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        </div>
      </header>

      <div className="sh-shellBody">
        <aside className={`sh-sidebar ${collapsed ? "is-collapsed" : ""}`} aria-label="Primary">
          {Sidebar ? <Sidebar collapsed={collapsed} onToggle={setCollapsed} /> : null}
        </aside>

        <main id="main" className="sh-main app-main" role="main" aria-live="polite">
          {children ?? <Outlet />}
        </main>
      </div>

      <ToastHub />
    </div>
  );
}
