// src/router/LordOutcomesRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import LordOutcomesLayout from "@/layouts/LordOutcomesLayout.jsx";

import LordOutcomesHome from "@/pages/lordOutcomes/LordOutcomesHome.jsx";
import StateOutcomesPage from "@/pages/lordOutcomes/StateOutcomesPage.jsx";
import ProgramOutcomesPage from "@/pages/lordOutcomes/ProgramOutcomesPage.jsx";
import EmployerImpactPage from "@/pages/lordOutcomes/EmployerImpactPage.jsx";
import FundingImpactPage from "@/pages/lordOutcomes/FundingImpactPage.jsx";

// Pilot Launcher (you already have the component in components/lordOutcomes/pilots)
import PilotLauncher from "@/components/lordOutcomes/pilots/PilotLauncher.jsx";

export default function LordOutcomesRoutes() {
  return (
    <Routes>
      <Route element={<LordOutcomesLayout />}>
        {/* Overview */}
        <Route index element={<LordOutcomesHome />} />

        {/* Tabs */}
        <Route path="states" element={<StateOutcomesPage />} />
        <Route path="programs" element={<ProgramOutcomesPage />} />
        <Route path="employers" element={<EmployerImpactPage />} />
        <Route path="funding" element={<FundingImpactPage />} />

        {/* Pilot Launcher */}
        <Route path="pilots" element={<PilotLauncher />} />
        {/* Friendly alias (optional) */}
        <Route path="pilot-launcher" element={<Navigate to="/pilots" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
