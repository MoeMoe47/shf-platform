// src/router/EmployerRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import EmployerLayout from "@/layouts/EmployerLayout.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

/* Pages inside the layout */
const Dashboard = lazy(() => import("@/pages/employer/Dashboard.jsx"));
const EmployerDashboardNorthstar = lazy(() =>
  import("@/pages/employer/EmployerDashboardNorthstar.jsx")
);

const Pipeline = lazy(() => import("@/pages/employer/Pipeline.jsx"));
const Candidates = lazy(() => import("@/pages/employer/Candidates.jsx"));
const Jobs = lazy(() => import("@/pages/employer/Jobs.jsx"));
const Interviews = lazy(() => import("@/pages/employer/Interviews.jsx"));
const Offers = lazy(() => import("@/pages/employer/Offers.jsx"));
const Analytics = lazy(() => import("@/pages/employer/Analytics.jsx"));
const Exports = lazy(() => import("@/pages/employer/Exports.jsx"));

const FundingFinder = lazy(() => import("@/pages/employer/FundingFinder.jsx"));
const Portfolio = lazy(() => import("@/pages/employer/Portfolio.jsx"));

const Reimburse = lazy(() =>
  import("@/pages/employer/ReimbursementCalculator.jsx").catch(() => ({
    default: () => <div className="page pad">Reimbursement Calculator</div>,
  }))
);

const Settings = lazy(() => import("@/pages/employer/Settings.jsx"));
const Help = lazy(() => import("@/pages/employer/Help.jsx"));

export default function EmployerRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        {/* Out-of-shell docs */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* App shell */}
        <Route path="/" element={<EmployerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard-ns" element={<EmployerDashboardNorthstar />} />

          <Route path="pipeline" element={<Pipeline />} />
          <Route path="candidates" element={<Candidates />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="interviews" element={<Interviews />} />
          <Route path="offers" element={<Offers />} />

          <Route path="analytics" element={<Analytics />} />
          <Route path="exports" element={<Exports />} />

          <Route path="portfolio" element={<Portfolio />} />
          <Route path="funding" element={<FundingFinder />} />
          <Route path="reimburse" element={<Reimburse />} />

          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />

          {/* safe fallback inside Employer */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
