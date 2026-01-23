// src/components/admin/AdminHeader.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";

function titleFromPath(pathname) {
  if (pathname.startsWith("/tool-dashboard")) return "AI Tool Workflow";
  if (pathname.startsWith("/placement-kpis")) return "Placement KPIs";
  if (pathname.startsWith("/partner-jobs"))   return "Partner Jobs (CSV)";
  return "Overview";
}

export default function AdminHeader() {
  const { pathname } = useLocation();
  const current = titleFromPath(pathname);

  return (
    <header className="app-header">
      {/* Left: brand block */}
      <div className="app-headerBrand">
        <Link
          to="/"
          className="app-headerBrandLink"
          aria-label="Admin home"
          style={{ width: "100%", height: "100%" }}
        >
          <img
            className="app-brandImg"
            src="/assets/brand/shf-logo-stacked.svg"
            alt="Silicon Heartland Admin"
          />
        </Link>
      </div>

      {/* Right: breadcrumb + actions */}
      <div className="app-headerRight">
        <div className="app-breadcrumbs">
          Admin / <strong>{current}</strong>
        </div>

        <button className="sh-btn sh-btn--secondary" type="button">
          Data
        </button>
        <button className="sh-btn sh-btn--secondary" type="button">
          Tools
        </button>
        <button className="sh-btn sh-btn--secondary" type="button">
          Export snapshot
        </button>
        <button className="sh-btn sh-btn--primary" type="button">
          Admin Help
        </button>
      </div>
    </header>
  );
}
