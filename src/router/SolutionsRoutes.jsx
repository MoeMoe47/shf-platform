import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import ShsHome from "@/pages/solutions/ShsHome.jsx";
import BosHome from "@/pages/solutions/BosHome.jsx";
import ShsAIWorkforcePage from "@/pages/solutions/ShsAIWorkforcePage.jsx";
import ShsGovernPage from "@/pages/solutions/ShsGovernPage.jsx";
import SolutionsInfrastructurePage from "@/pages/solutions/SolutionsInfrastructurePage.jsx";
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
      <Route path="/bos" element={<BosHome />} />
      <Route path="bos" element={<BosHome />} />
      <Route path="/ai-workforce" element={<ShsAIWorkforcePage />} />
      <Route path="ai-workforce" element={<ShsAIWorkforcePage />} />
      <Route path="/govern" element={<ShsGovernPage />} />
      <Route path="govern" element={<ShsGovernPage />} />
      <Route path="/infrastructure" element={<SolutionsInfrastructurePage />} />
      <Route path="infrastructure" element={<SolutionsInfrastructurePage />} />
      <Route path="/home" element={<ShsHome />} />
      <Route path="home" element={<ShsHome />} />
      <Route index element={<Navigate to="home" replace />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
