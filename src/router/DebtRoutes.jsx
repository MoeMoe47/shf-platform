import React, { Suspense, lazy } from "react";
const Portfolio = lazy(() => import("@/pages/debt/Portfolio.jsx"));
// src/router/DebtRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import DebtLayout from "@/layouts/DebtLayout.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

/* Pages (inside <Outlet/>) */
const Dashboard = lazy(() => import("@/pages/debt/Dashboard.jsx"));
const Accounts  = lazy(() => import("@/pages/debt/Accounts.jsx"));
const Ledger    = lazy(() => import("@/pages/debt/Ledger.jsx"));
const Plan      = lazy(() => import("@/pages/debt/Plan.jsx"));
const Settings  = lazy(() => import("@/pages/debt/Settings.jsx"));
const Help      = lazy(() => import("@/pages/debt/Help.jsx"));
const Payment   = lazy(() => import("@/pages/debt/PaymentDetails.jsx"));

/* ⭐ Northstar */
const DebtDashboardNorthstar = lazy(() =>
  import("@/pages/debt/DebtDashboardNorthstar.jsx")
);

export default function DebtRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        {/* Out-of-shell docs */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* App shell with shared Header + Sidebar */}
        <Route path="/" element={<DebtLayout />}>
          {/* Default → dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Dashboards */}
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="dashboard-ns"  element={<DebtDashboardNorthstar />} /> {/* ⭐ NEW */}

          {/* Features */}
          <Route path="accounts"      element={<Accounts />} />
          <Route path="ledger"        element={<Ledger />} />
          <Route path="plan"          element={<Plan />} />
          <Route path="payment/:id"   element={<Payment />} />
          <Route path="settings"      element={<Settings />} />
          <Route path="help"          element={<Help />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
          <Route path="portfolio" element={<Portfolio />} />
        </Routes>
    </Suspense>
  );
}