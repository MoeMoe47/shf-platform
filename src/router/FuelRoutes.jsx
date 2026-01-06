// src/router/FoundationRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import FoundationLayout from "@/layouts/FoundationLayout.jsx";
import FoundationTop from "@/pages/foundation/Top.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

import PublicApps from "@/pages/foundation/PublicApps.jsx";
import AdminAppsGallery from "@/pages/foundation/AdminAppsGallery.jsx";
import RequireAdmin from "@/components/RequireAdmin.jsx";

// Admin pages (lazy-loaded)
const PlacementKPIs     = lazy(() => import("@/pages/admin/PlacementKPIs.jsx"));
const PartnerJobs       = lazy(() => import("@/pages/admin/PartnerJobs.jsx"));
const InvestorNorthstar = lazy(() => import("@/pages/admin/InvestorNorthstar.jsx"));
const TalentSources     = lazy(() => import("@/pages/admin/TalentSources.jsx"));
const Attribution       = lazy(() => import("@/pages/admin/Attribution.jsx"));

export default function FoundationRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <Routes>
        {/* Out-of-shell docs */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* Public foundation shell */}
        <Route path="/" element={<FoundationLayout />}>
          {/* /foundation.html#/  →  /foundation.html#/top */}
          <Route index element={<Navigate to="top" replace />} />

          <Route path="top" element={<FoundationTop />} />
          <Route path="apps" element={<PublicApps />} />

          {/* IMPORTANT: use absolute path here to avoid /top/top/top loop */}
          <Route path="*" element={<Navigate to="/top" replace />} />
        </Route>

        {/* ADMIN-ONLY routes (behind RequireAdmin) */}
        <Route
          path="admin/apps-gallery"
          element={
            <RequireAdmin>
              <AdminAppsGallery />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/placement-kpis"
          element={
            <RequireAdmin>
              <PlacementKPIs />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/investor-northstar"
          element={
            <RequireAdmin>
              <InvestorNorthstar />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/talent-sources"
          element={
            <RequireAdmin>
              <TalentSources />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/attribution"
          element={
            <RequireAdmin>
              <Attribution />
            </RequireAdmin>
          }
        />
        <Route
          path="admin/partner-jobs"
          element={
            <RequireAdmin>
              <PartnerJobs />
            </RequireAdmin>
          }
        />
      </Routes>
    </Suspense>
  );
}
