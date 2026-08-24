// src/router/SalesRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import SalesLayout from "@/layouts/SalesLayout.jsx";
import RouteFallback from "@/components/RouteFallback.jsx";

const SalesDashboard = lazy(() => import("@/pages/sales/SalesDashboard.jsx"));
const SalesDashboardNorthstar = lazy(() =>
  import("@/pages/sales/DashboardNorthstar.jsx").catch(() => ({
    default: () => <div style={{ padding: 16 }}>Northstar coming soon</div>,
  }))
);

const Leads = lazy(() => import("@/pages/sales/Leads.jsx"));
const Pipeline = lazy(() => import("@/pages/sales/Pipeline.jsx"));
const Proposals = lazy(() => import("@/pages/sales/Proposals.jsx"));
const Quotes = lazy(() => import("@/pages/sales/Quotes.jsx"));
const Orders = lazy(() => import("@/pages/sales/Orders.jsx"));
const Analytics = lazy(() => import("@/pages/sales/Analytics.jsx"));
const Exports = lazy(() => import("@/pages/sales/Exports.jsx"));
const Settings = lazy(() => import("@/pages/sales/Settings.jsx"));
const Help = lazy(() => import("@/pages/sales/Help.jsx"));

const Lesson = lazy(() => import("@/pages/sales/Lesson.jsx"));
const DemoDashboard = lazy(() => import("@/pages/sales/DemoDashboard.jsx"));
const DemoProposal = lazy(() => import("@/pages/sales/DemoProposal.jsx"));

function Loader() {
  return (
    <div className="skeleton pad" role="status" aria-live="polite" style={{ padding: 16 }}>
      Loading…
    </div>
  );
}

export default function SalesRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<SalesLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SalesDashboard />} />
          <Route path="northstar" element={<SalesDashboardNorthstar />} />

          <Route path="leads" element={<Leads />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="quotes" element={<Quotes />} />
          <Route path="orders" element={<Orders />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="exports" element={<Exports />} />

          <Route path="lesson" element={<Lesson />} />
          <Route path="lesson/:id" element={<Lesson />} />
          <Route path="demo" element={<DemoDashboard />} />
          <Route path="demo/proposal" element={<DemoProposal />} />

          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />

          {/* 404 inside Sales */}
          <Route path="*" element={<RouteFallback app="sales" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
