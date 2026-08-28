// src/router/CareerRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CareerLayout from "@/layouts/CareerLayout.jsx";

/* Pages inside the layout */
const CareerDashboard = lazy(() => import("@/pages/career/CareerDashboard.jsx"));
const CareerDashboardNorthstar = lazy(() =>
  import("@/pages/career/CareerDashboardNorthstar.jsx")
);

const Assignments = lazy(() => import("@/pages/Assignments.jsx"));
// Career keeps its dedicated data/adaptor page; Curriculum reuses the same
// calendar view primitives through its own domain adapter.
const Calendar = lazy(() => import("@/pages/career/CareerCalendar.jsx"));
const Portfolio = lazy(() => import("@/pages/career/Portfolio.jsx"));

const CareerLearningBridge = lazy(() => import("@/pages/CareerLearningBridge.jsx"));
const Lesson = lazy(() => import("@/pages/career/Lesson.jsx"));
const CareerVocabulary = lazy(() => import("@/pages/CareerVocabulary.jsx"));

const CareerPlanner = lazy(() => import("@/pages/CareerPlanner.jsx"));
const PathwaysExplore = lazy(() => import("@/pages/PathwaysExplore.jsx"));
const CareerPathways = lazy(() => import("@/pages/CareerPathways.jsx"));
const ResumeBuilder = lazy(() => import("@/pages/ResumeBuilder.jsx"));

const RewardsWallet = lazy(() => import("@/pages/RewardsWallet.jsx"));
const CreditReport = lazy(() => import("@/pages/CreditReport.jsx"));
const Marketplace = lazy(() => import("@/pages/Marketplace.jsx"));

const Coach = lazy(() => import("@/pages/Coach.jsx"));
const Help = lazy(() => import("@/pages/Help.jsx"));
const Settings = lazy(() => import("@/pages/Settings.jsx"));

export function CareerRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        <Route path="/" element={<CareerLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />

          <Route path="dashboard" element={<CareerDashboard />} />
          <Route path="dashboard-ns" element={<CareerDashboardNorthstar />} />

          <Route path="assignments" element={<Assignments />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="portfolio" element={<Portfolio />} />

          <Route path="learn" element={<CareerLearningBridge />} />
          <Route path="learn/:id" element={<Lesson />} />
          <Route path="vocab" element={<CareerVocabulary />} />

          <Route path="planner" element={<CareerPlanner />} />
          <Route path="explore" element={<PathwaysExplore />} />
          <Route path="career/pathways" element={<CareerPathways />} />
          <Route path="resume" element={<ResumeBuilder />} />

          <Route path="rewards" element={<RewardsWallet />} />
          <Route path="credit/report" element={<CreditReport />} />
          <Route path="marketplace" element={<Marketplace />} />

          <Route path="coach" element={<Coach />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<Settings />} />

          {/* safe fallback inside Career (absolute path: "*" matches the full
              unmatched remainder, so a relative target here would keep
              appending to it and loop forever) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default CareerRoutes;
