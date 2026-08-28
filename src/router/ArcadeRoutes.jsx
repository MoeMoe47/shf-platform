// src/router/ArcadeRoutes.jsx
// ------------------------------------------------------------
// L1X Arcade routes
// ------------------------------------------------------------

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ArcadeLayout from "@/layouts/ArcadeLayout.jsx";

import ArcadeDashboard from "@/pages/arcade/ArcadeDashboard.jsx";
import ClassicalArcadeRoom from "@/pages/arcade/ClassicalArcadeRoom.jsx";
import History from "@/pages/arcade/History.jsx";
import ArcadeLibrary from "@/pages/arcade/ArcadeLibrary.jsx";
import Leaderboard from "@/pages/arcade/Leaderboard.jsx";
import Rewards from "@/pages/arcade/Rewards.jsx";
import Tournaments from "@/pages/arcade/Tournaments.jsx";
import Help from "@/pages/arcade/Help.jsx";

import GrowthObservationTower from "@/pages/metaverse/GrowthObservationTower.jsx";
import BFETestPage from "@/pages/metaverse/BFETestPage.jsx";

export default function ArcadeRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/dashboard"
        element={
          <ArcadeLayout>
            <ArcadeDashboard />
          </ArcadeLayout>
        }
      />

      <Route
        path="/classical-arcade"
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
        path="/games"
        element={
          <ArcadeLayout>
            <ArcadeLibrary />
          </ArcadeLayout>
        }
      />

      <Route
        path="/leaderboard"
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
        path="/tournaments/*"
        element={
          <ArcadeLayout>
            <Tournaments />
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

      <Route
        path="*"
        element={
          <ArcadeLayout>
            <Navigate to="/dashboard" replace />
          </ArcadeLayout>
        }
      />
    </Routes>
  );
}
