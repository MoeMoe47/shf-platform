import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppRegistry from "@/pages/admin/AppRegistry.jsx";
import Registry from "@/pages/admin/Registry.jsx";
import ToolDashboard from "@/pages/admin/ToolDashboard.jsx";
import MasterNarrativeViewer from "@/pages/admin/MasterNarrativeViewer.jsx";
import GrantBinder from "@/pages/admin/GrantBinder.jsx";
import AlignmentSwitchboard from "@/pages/admin/AlignmentSwitchboard.jsx";
import BuilderHub from "@/pages/admin/BuilderHub.jsx";
import PartnerActionQueue from "@/pages/hub/PartnerActionQueue.jsx";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/builder" element={<BuilderHub />} />
      <Route path="/builder/tools" element={<ToolDashboard />} />
      <Route path="/builder/narrative" element={<MasterNarrativeViewer />} />
      <Route path="/builder/grant-binder" element={<GrantBinder />} />
      <Route path="/builder/alignment" element={<AlignmentSwitchboard />} />

      <Route path="/app-registry" element={<AppRegistry />} />
      <Route path="/registry" element={<Registry />} />

      <Route path="/hub/queue" element={<PartnerActionQueue />} />

      <Route path="*" element={<Navigate to="/builder" replace />} />
    </Routes>
  );
}
