import React from "react";
import { Outlet, Link } from "react-router-dom";
import Sidebar from "@/components/Sidebar.jsx";

export default function AppLayout() {
  return (
    <div className="app-shell" data-shell="career-v1">
      <a className="skip-link" href="#main">Skip to main content</a>

      <header className="app-header" role="banner">
        <Link to="/dashboard" className="brand" aria-label="Silicon Heartland — Home">
          <img src="/logo-foundation.png" alt="" />
          <span className="brand-wordmark" aria-hidden>
            SILICON HEARTLAND <small>FOUNDATION</small>
          </span>
        </Link>
        <div className="header-spacer" />
        <nav aria-label="Utilities" className="header-actions" />
      </header>

      <div className="app-body">
        <aside className="app-sidebar" aria-label="Primary">
          <Sidebar />
        </aside>
        <main id="main" className="app-main" role="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
