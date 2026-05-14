import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SolutionsLayout from "@/layouts/SolutionsLayout.jsx";

import SolutionsHome from "@/pages/solutions/SolutionsHome.jsx";
import SHSMeetTheTeamPage from "@/pages/solutions/SHSMeetTheTeamPage.jsx";
import SHSBlockchainTransparencyPage from "@/pages/solutions/SHSBlockchainTransparencyPage.jsx";
import SHSRequestDemoPage from "@/pages/solutions/SHSRequestDemoPage.jsx";
import SHSLayersPage from "@/pages/solutions/SHSLayersPage.jsx";

export default function SolutionsRoutes() {
  return (
    <Routes>
      <Route path="/request-demo" element={<SHSRequestDemoPage />} />
      <Route path="request-demo" element={<SHSRequestDemoPage />} />
      <Route path="/contact" element={<SHSRequestDemoPage />} />
      <Route path="contact" element={<SHSRequestDemoPage />} />
      <Route path="/blockchain-transparency" element={<SHSBlockchainTransparencyPage />} />
      <Route path="blockchain-transparency" element={<SHSBlockchainTransparencyPage />} />
      <Route path="/transparency" element={<SHSBlockchainTransparencyPage />} />
      <Route path="transparency" element={<SHSBlockchainTransparencyPage />} />
      <Route path="/about/team" element={<SHSMeetTheTeamPage />} />
      <Route path="/team" element={<SHSMeetTheTeamPage />} />
      <Route path="about/team" element={<SHSMeetTheTeamPage />} />
      <Route path="team" element={<SHSMeetTheTeamPage />} />
      <Route path="/layers" element={<SHSLayersPage />} />
      <Route path="layers" element={<SHSLayersPage />} />
      <Route element={<SolutionsLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<SolutionsHome />} />
<Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
