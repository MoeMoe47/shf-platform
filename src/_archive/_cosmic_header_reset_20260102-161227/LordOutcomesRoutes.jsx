// src/router/LordOutcomesRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LordOutcomesLayout from "@/layouts/LordOutcomesLayout.jsx";

import LordOutcomesHome from "@/pages/lordOutcomes/LordOutcomesHome.jsx";
import StateOutcomesPage from "@/pages/lordOutcomes/StateOutcomesPage.jsx";
import ProgramOutcomesPage from "@/pages/lordOutcomes/ProgramOutcomesPage.jsx";
import EmployerImpactPage from "@/pages/lordOutcomes/EmployerImpactPage.jsx";
import FundingImpactPage from "@/pages/lordOutcomes/FundingImpactPage.jsx";

// Pilots
import PilotLauncherPage from "@/pages/lordOutcomes/PilotLauncher.jsx";
import ActivePilotsPage from "@/pages/lordOutcomes/pilots/ActivePilots.jsx";
import PilotTemplatesPage from "@/pages/lordOutcomes/pilots/PilotTemplates.jsx";

export default function LordOutcomesRoutes() {
  return (
    <Routes>
      <Route element={<LordOutcomesLayout />}>
        <Route index element={<LordOutcomesHome />} />

        <Route path="states" element={<StateOutcomesPage />} />
        <Route path="programs" element={<ProgramOutcomesPage />} />
        <Route path="employers" element={<EmployerImpactPage />} />
        <Route path="funding" element={<FundingImpactPage />} />

        {/* Pilots group (matches DYM header/footer paths) */}
        <Route path="pilots">
          <Route index element={<Navigate to="launch" replace />} />
          <Route path="launch" element={<PilotLauncherPage />} />
          <Route path="active" element={<ActivePilotsPage />} />
          <Route path="templates" element={<PilotTemplatesPage />} />
        </Route>

        {/* optional: 404 back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
