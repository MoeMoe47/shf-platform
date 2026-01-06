// src/router/AdminRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "@/layouts/AdminLayout.jsx";
import GrantBinder from "@/pages/admin/GrantBinder.jsx";

// Lazy admin pages
const MasterNarrativeViewer = lazy(() =>
  import("@/pages/admin/MasterNarrativeViewer.jsx")
);
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard.jsx"));
const ToolDashboard  = lazy(() => import("@/pages/admin/ToolDashboard.jsx"));
const PlacementKPIs  = lazy(() => import("@/pages/admin/PlacementKPIs.jsx"));
const PartnerJobs    = lazy(() => import("@/pages/admin/PartnerJobs.jsx"));

export default function AdminRoutes() {
  return (
    <AdminLayout>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
        <Routes>
          {/* Main admin home */}
          <Route path="/" element={<AdminDashboard />} />

          {/* New Tool Dashboard */}
          <Route path="/tool-dashboard" element={<ToolDashboard />} />

          {/* Master grant narrative viewer */}
          <Route path="/master-narrative" element={<MasterNarrativeViewer />} />

          {/* Data tools */}
          <Route path="/placement-kpis" element={<PlacementKPIs />} />
          <Route path="/partner-jobs"   element={<PartnerJobs />} />
          <Route path="/binder"         element={<GrantBinder />} />

          {/* Fallback – send unknown paths back to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
}
