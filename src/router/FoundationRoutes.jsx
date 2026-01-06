// src/router/FoundationRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import FoundationLayout from "@/layouts/FoundationLayout.jsx";
import FoundationTop from "@/pages/foundation/Top.jsx";

// Lazy-loaded pages
const DevDocsViewer     = lazy(() => import("@/pages/dev/Docs.jsx"));
const PublicApps        = lazy(() => import("@/pages/foundation/PublicApps.jsx"));
const AdminAppsGallery  = lazy(() => import("@/pages/foundation/AdminAppsGallery.jsx"));

const PlacementKPIs     = lazy(() => import("@/pages/admin/PlacementKPIs.jsx"));
const PartnerJobs       = lazy(() => import("@/pages/admin/PartnerJobs.jsx"));
const InvestorNorthstar = lazy(() => import("@/pages/admin/InvestorNorthstar.jsx"));
const TalentSources     = lazy(() => import("@/pages/admin/TalentSources.jsx"));
const Attribution       = lazy(() => import("@/pages/admin/Attribution.jsx"));

import RequireAdmin from "@/components/RequireAdmin.jsx";

export default function FoundationRoutes() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <Routes>
        {/* Out-of-shell docs viewer */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* Public foundation shell */}
        <Route path="/" element={<FoundationLayout />}>
          {/* When you hit #/ → go to /top */}
          <Route index element={<Navigate to="/top" replace />} />

          {/* Top tab */}
          <Route path="top" element={<FoundationTop />} />

          {/* PUBLIC apps gallery – anyone can see */}
          <Route path="apps" element={<PublicApps />} />
        </Route>

        {/* ADMIN-ONLY routes (NOT nested under "/") */}
        <Route
          path="/admin/apps-gallery"
          element={
            <RequireAdmin>
              <AdminAppsGallery />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/placement-kpis"
          element={
            <RequireAdmin>
              <PlacementKPIs />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/investor-northstar"
          element={
            <RequireAdmin>
              <InvestorNorthstar />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/talent-sources"
          element={
            <RequireAdmin>
              <TalentSources />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/attribution"
          element={
            <RequireAdmin>
              <Attribution />
            </RequireAdmin>
          }
        />

        <Route
          path="/admin/partner-jobs"
          element={
            <RequireAdmin>
              <PartnerJobs />
            </RequireAdmin>
          }
        />

        {/* FINAL catch-all for *anything* bad under foundation.html */}
        <Route path="*" element={<Navigate to="/top" replace />} />
      </Routes>
    </Suspense>
  );
}
