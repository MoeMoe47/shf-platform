import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout.jsx";
import GrantBinder from "@/pages/admin/GrantBinder.jsx";

const AdminDashboard = lazy(() => import("@/pages/AdminDashboard.jsx"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics.jsx"));
const ToolDashboard  = lazy(() => import("@/pages/admin/ToolDashboard.jsx"));
const AlignmentSwitchboard = lazy(() => import("@/pages/admin/AlignmentSwitchboard.jsx"));
const ReportsDashboard = lazy(() => import("@/pages/admin/ReportsDashboard.jsx"));
const PlacementKPIs  = lazy(() => import("@/pages/admin/PlacementKPIs.jsx"));
const PartnerJobs    = lazy(() => import("@/pages/admin/PartnerJobs.jsx"));
const MasterNarrativeViewer = lazy(() => import("@/pages/admin/MasterNarrativeViewer.jsx"));
const InvestorNorthstar = lazy(() => import("@/pages/admin/InvestorNorthstar.jsx"));

export default function AdminRoutes() {
  if (!import.meta.env.VITE_ENABLE_ADMIN) return null;

  return (
    <AdminLayout>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="/tool-dashboard" element={<ToolDashboard />} />
          <Route path="/master-narrative" element={<MasterNarrativeViewer />} />
          <Route path="/placement-kpis" element={<PlacementKPIs />} />
          <Route path="/partner-jobs" element={<PartnerJobs />} />
          <Route path="/binder" element={<GrantBinder />} />
          <Route path="/investor-northstar" element={<InvestorNorthstar />} />
          <Route path="/alignment" element={<AlignmentSwitchboard />} />
          <Route path="/reports" element={<ReportsDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}
