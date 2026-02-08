import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AppRegistry from "@/pages/admin/AppRegistry.jsx";
import Registry from "@/pages/admin/Registry.jsx";

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Use absolute paths to avoid relative redirect loops */}
      <Route path="/app-registry" element={<AppRegistry />} />
      <Route path="/registry" element={<Registry />} />
      <Route path="*" element={<Navigate to="/app-registry" replace />} />
    </Routes>
  );
}
