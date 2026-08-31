// src/router/StoreRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import StoreLayout from "@/layouts/StoreLayout.jsx";
import StoreCatalogShell from "@/layouts/store/StoreCatalogShell.jsx";
import DevDocsViewer from "@/pages/dev/Docs.jsx";

// Public pages (lazy where it makes sense)
const SolutionsMarketplace = lazy(() =>
  import("@/pages/solutions/SolutionsMarketplace.jsx")
);
const StoreCatalog = lazy(() =>
  import("@/pages/store/StoreCatalog.jsx")
);

const Verify = () => <div className="pad">Verify a purchase (coming soon)</div>;
const MyItems = () => <div className="pad">Your purchases (coming soon)</div>;
const FAQ = () => <div className="pad">FAQ (coming soon)</div>;
const About = () => <div className="pad">About (coming soon)</div>;

export default function StoreRoutes() {
  return (
    <Suspense fallback={<div className="pad">Loading…</div>}>
      <Routes>
        {/* Out-of-shell docs (no StoreLayout chrome) */}
        <Route path="/__docs" element={<DevDocsViewer />} />

        {/* Catalog gets its own new sidebar+header shell (see
            src/layouts/store/StoreCatalogShell.jsx) — a sibling route
            OUTSIDE <StoreLayout>, not nested inside it, so every other
            existing Store page below keeps its current, already-live
            <StoreLayout> chrome completely unchanged. The public URL is
            unaffected: still /store.html#/catalog. */}
        <Route
          path="/catalog"
          element={
            <StoreCatalogShell>
              <StoreCatalog />
            </StoreCatalogShell>
          }
        />

        {/* Existing Store shell, unchanged, for everything else */}
        <Route path="/" element={<StoreLayout />}>
          {/* Default: go to catalog */}
          <Route index element={<Navigate to="catalog" replace />} />

          {/* Existing pages */}
          <Route path="marketplace" element={<SolutionsMarketplace />} />
          <Route path="verify" element={<Verify />} />
          <Route path="my" element={<MyItems />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="about" element={<About />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="catalog" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
