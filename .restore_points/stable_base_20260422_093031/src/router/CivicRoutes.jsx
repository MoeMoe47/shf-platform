// src/router/CivicRoutes.jsx
import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CivicLayout from "@/layouts/CivicLayout.jsx";
import RouteFallback from "@/components/RouteFallback.jsx";

const CivicGrantStory = lazy(() => import("@/pages/civic/GrantStory.jsx"));

/* ---- Lazy pages (names now match your actual files) ---- */
const CivicDashboard    = lazy(() => import("@/pages/civic/CivicDashboard.jsx"));
const CivicDashboardNS  = lazy(() => import("@/pages/civic/DashboardNorthstar.jsx"));
const CivicElections    = lazy(() => import("@/pages/civic/Elections.jsx"));
const CivicProposals    = lazy(() => import("@/pages/civic/Proposals.jsx"));
const CivicTreasurySim  = lazy(() => import("@/pages/civic/TreasurySim.jsx"));
const CivicDebtClock    = lazy(() => import("@/pages/civic/DebtClock.jsx"));
const CivicSnapshots    = lazy(() => import("@/pages/civic/TreasurySnapshots.jsx"));
const CivicSurvey       = lazy(() => import("@/pages/civic/IssueSurvey.jsx"));
const CivicProfile      = lazy(() => import("@/pages/civic/ProfileResults.jsx"));
const CivicNotes        = lazy(() => import("@/pages/civic/Notes.jsx"));
const CivicPortfolio    = lazy(() => import("@/pages/civic/Portfolio.jsx"));
const CivicRewards      = lazy(() => import("@/pages/civic/Rewards.jsx"));
const CivicSettings     = lazy(() => import("@/pages/civic/Settings.jsx"));
const CivicHelp         = lazy(() => import("@/pages/civic/Help.jsx"));
const CivicLesson       = lazy(() => import("@/pages/civic/Lesson.jsx"));
const CivicAssignments  = lazy(() => import("@/pages/civic/Assignments.jsx"));
const ConstitutionJournal = lazy(() =>
  import("@/pages/civic/ConstitutionJournal.jsx")
);
const CivicBadges      = lazy(() => import("@/pages/civic/Badges.jsx"));
const CivicLeaderboard = lazy(() => import("@/pages/civic/Leaderboard.jsx"));

/* ---- Small, CSP-safe skeleton so a slow chunk doesn’t look blank ---- */
function Loader() {
  return (
    <div
      className="skeleton pad"
      role="status"
      aria-live="polite"
      style={{ padding: 16 }}
    >
      Loading…
    </div>
  );
}

export default function CivicRoutes() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<CivicLayout />}>
          {/* Default → dashboard */}
          <Route index element={<Navigate to="dashboard" replace />} />

          {/* Overview */}
          <Route path="dashboard"     element={<CivicDashboard />} />
          <Route path="dashboard-ns"  element={<CivicDashboardNS />} />

          {/* Micro-lessons */}
          <Route path="micro-lessons" element={<CivicAssignments />} />
          <Route path="assignments"   element={<CivicAssignments />} />
          <Route path="lesson"        element={<CivicLesson />} />    {/* ?id=... */}
          <Route path="lesson/:id"    element={<CivicLesson />} />    {/* /lesson/<id> */}

          {/* Civic features */}
          <Route path="elections"     element={<CivicElections />} />
          <Route path="proposals"     element={<CivicProposals />} />
          <Route path="treasury-sim"  element={<CivicTreasurySim />} />
          <Route path="debtclock"     element={<CivicDebtClock />} />
          <Route path="grant-story"   element={<CivicGrantStory />} />
          <Route path="leaderboard"   element={<CivicLeaderboard />} />
          <Route path="snapshots"     element={<CivicSnapshots />} />
          <Route path="survey"        element={<CivicSurvey />} />
          <Route path="profile"       element={<CivicProfile />} />
          <Route path="journal"       element={<ConstitutionJournal />} />
          <Route path="badges"        element={<CivicBadges />} />

          {/* Core nav */}
          <Route path="notes"         element={<CivicNotes />} />
          <Route path="portfolio"     element={<CivicPortfolio />} />

          {/* App meta */}
          <Route path="rewards"       element={<CivicRewards />} />
          <Route path="settings"      element={<CivicSettings />} />
          <Route path="help"          element={<CivicHelp />} />

          {/* Aliases */}
          <Route
            path="missions"
            element={<Navigate to="../micro-lessons" replace />}
          />
          <Route
            path="treasury"
            element={<Navigate to="../treasury-sim" replace />}
          />

          {/* 404 */}
          <Route path="*" element={<RouteFallback />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
