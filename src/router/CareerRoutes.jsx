// src/router/CareerRoutes.jsx
import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import CareerLayout from "@/layouts/CareerLayout.jsx";
import {
  CAREER_HOME,
  CAREER_PATHWAYS,
  CAREER_ROUTE_CONTRACT,
} from "@/router/paths.js";

/* Pages inside the layout */
const CareerHomePlaceholder = lazy(() => import("@/pages/career/CareerHomePlaceholder.jsx"));
const CareerDetail = lazy(() => import("@/pages/career/CareerDetail.jsx"));
const PathwayDetail = lazy(() => import("@/pages/career/PathwayDetail.jsx"));
const CareerDiscovery = lazy(() => import("@/pages/career/CareerDiscovery.jsx"));
const PublicOpportunities = lazy(() => import("@/pages/career/PublicOpportunities.jsx"));
const PublicOpportunityDetail = lazy(() => import("@/pages/career/PublicOpportunities.jsx").then((module) => ({ default: module.PublicOpportunityDetail })));
const PublicEmployerDirectory = lazy(() => import("@/pages/career/PublicOpportunities.jsx").then((module) => ({ default: module.PublicEmployerDirectory })));
const PublicEmployerProfile = lazy(() => import("@/pages/career/PublicOpportunities.jsx").then((module) => ({ default: module.PublicEmployerProfile })));
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

const CareerPlanner = lazy(() => import("@/pages/CareerPathways.jsx"));
const PathwaysExplore = lazy(() => import("@/pages/PathwaysExplore.jsx"));
const ResumeBuilder = lazy(() => import("@/pages/ResumeBuilder.jsx"));

const RewardsWallet = lazy(() => import("@/pages/RewardsWallet.jsx"));
const CreditReport = lazy(() => import("@/pages/CreditReport.jsx"));
const Marketplace = lazy(() => import("@/pages/Marketplace.jsx"));

const Coach = lazy(() => import("@/pages/Coach.jsx"));
const Help = lazy(() => import("@/pages/Help.jsx"));
const Settings = lazy(() => import("@/pages/Settings.jsx"));

export const PUBLIC_CAREER_ROUTES = Object.values(CAREER_ROUTE_CONTRACT.public);
export const PERSONAL_CAREER_ROUTES = Object.values(CAREER_ROUTE_CONTRACT.personal);

export function CareerRoutes() {
  return (
    <Suspense fallback={<div className="skeleton pad">Loading…</div>}>
      <Routes>
        <Route path="/" element={<CareerLayout />}>
          <Route index element={<CareerHomePlaceholder />} />

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
          <Route path="pathways" element={<PathwaysExplore />} />
          <Route path="pathways/:pathwaySlug" element={<PathwayDetail />} />
          <Route path="careers/:careerSlug" element={<CareerDetail />} />
          <Route path="discovery" element={<CareerDiscovery />} />
          <Route path="opportunities" element={<PublicOpportunities />} />
          <Route path="opportunities/:opportunityId" element={<PublicOpportunityDetail />} />
          <Route path="employers" element={<PublicEmployerDirectory />} />
          <Route path="employers/:employerSlugOrId" element={<PublicEmployerProfile />} />
          <Route path="career/pathways" element={<Navigate to={CAREER_PATHWAYS} replace />} />
          <Route path="resume" element={<ResumeBuilder />} />

          <Route path="rewards" element={<RewardsWallet />} />
          <Route path="credit/report" element={<CreditReport />} />
          <Route path="marketplace" element={<Marketplace />} />

          <Route path="coach" element={<Coach />} />
          <Route path="help" element={<Help />} />
          <Route path="settings" element={<Settings />} />

          {/* Unknown public Career URLs land on the public entry, not the
              personal dashboard. Backend permissions remain authoritative for
              protected data; this router only establishes the UI boundary. */}
          <Route path="*" element={<Navigate to={CAREER_HOME} replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default CareerRoutes;
