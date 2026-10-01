// src/router/ArcadeRoutes.jsx
// ------------------------------------------------------------
// L1X Arcade routes
// Phase 1: canonical route normalization
// ------------------------------------------------------------

import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";

import ArcadeLayout from "@/layouts/ArcadeLayout.jsx";

import ArcadeDashboard from "@/pages/arcade/ArcadeDashboard.jsx";
import ArcadeNotifications from "@/pages/arcade/ArcadeNotifications.jsx";
import ClassicalArcadeRoom from "@/pages/arcade/ClassicalArcadeRoom.jsx";
import History from "@/pages/arcade/History.jsx";
import ArcadeLibrary from "@/pages/arcade/ArcadeLibrary.jsx";
import Leaderboard from "@/pages/arcade/Leaderboard.jsx";
import Rewards from "@/pages/arcade/Rewards.jsx";
import Tournaments from "@/pages/arcade/Tournaments.jsx";
import Tournament from "@/pages/arcade/Tournament.jsx";
import Help from "@/pages/arcade/Help.jsx";
import ArcadeRuntimeDevHarness from "@/pages/arcade/ArcadeRuntimeDevHarness.jsx";

import GrowthObservationTower from "@/pages/metaverse/GrowthObservationTower.jsx";
import BFETestPage from "@/pages/metaverse/BFETestPage.jsx";

function ArcadeNotFound() {
  return (
    <ArcadeLayout>
      <div className="page pad">
        <div className="card card--pad">
          <h1 style={{ margin: 0 }}>Arcade page not found</h1>
          <p className="muted">
            This Arcade link does not point to a current route.
          </p>
          <div style={{ marginTop: 12 }}>
            <Link className="sh-btn sh-btn--secondary" to="/learning">
              Return to Learning Arcade
            </Link>
          </div>
        </div>
      </div>
    </ArcadeLayout>
  );
}

export default function ArcadeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/learning" replace />} />

      <Route
        path="/learning"
        element={
          <ArcadeLayout>
            <ArcadeDashboard />
          </ArcadeLayout>
        }
      />

      <Route
        path="/learning/library"
        element={
          <ArcadeLayout>
            <ArcadeLibrary />
          </ArcadeLayout>
        }
      />

      <Route
        path="/classic"
        element={
          <ArcadeLayout>
            <ClassicalArcadeRoom />
          </ArcadeLayout>
        }
      />

      <Route
        path="/history"
        element={
          <ArcadeLayout>
            <History />
          </ArcadeLayout>
        }
      />

      <Route
        path="/leaderboards"
        element={
          <ArcadeLayout>
            <Leaderboard />
          </ArcadeLayout>
        }
      />

      <Route
        path="/rewards"
        element={
          <ArcadeLayout>
            <Rewards />
          </ArcadeLayout>
        }
      />

      <Route
        path="/tournaments"
        element={
          <ArcadeLayout>
            <Tournaments />
          </ArcadeLayout>
        }
      />

      <Route
        path="/tournaments/:id"
        element={
          <ArcadeLayout>
            <Tournament />
          </ArcadeLayout>
        }
      />

      <Route
        path="/notifications"
        element={
          <ArcadeLayout>
            <ArcadeNotifications />
          </ArcadeLayout>
        }
      />

      <Route
        path="/help"
        element={
          <ArcadeLayout>
            <Help />
          </ArcadeLayout>
        }
      />

      <Route
        path="/dev/runtime"
        element={
          <ArcadeLayout>
            <ArcadeRuntimeDevHarness />
          </ArcadeLayout>
        }
      />

      <Route
        path="/metaverse/growth-observatory"
        element={
          <ArcadeLayout>
            <GrowthObservationTower />
          </ArcadeLayout>
        }
      />

      <Route
        path="/metaverse/bfe-test"
        element={
          <ArcadeLayout>
            <BFETestPage />
          </ArcadeLayout>
        }
      />

      <Route path="/dashboard" element={<Navigate to="/learning" replace />} />
      <Route path="/games" element={<Navigate to="/learning/library" replace />} />
      <Route path="/classical-arcade" element={<Navigate to="/classic" replace />} />
      <Route path="/leaderboard" element={<Navigate to="/leaderboards" replace />} />
      <Route path="/arcade" element={<Navigate to="/learning" replace />} />
      <Route path="/arcade/games" element={<Navigate to="/learning/library" replace />} />
      <Route path="/games/leaderboard" element={<Navigate to="/leaderboards" replace />} />

      <Route path="*" element={<ArcadeNotFound />} />
    </Routes>
  );
}
