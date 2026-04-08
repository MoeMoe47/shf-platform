import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import CapitalLayout from "@/layouts/CapitalLayout.jsx";
import OperatorControlPanel from "@/pages/capital/OperatorControlPanel.jsx";

export default function CapitalRoutes() {
  return (
    <Routes>
      <Route path="/" element={<CapitalLayout />}>
        <Route index element={<Navigate to="operator" replace />} />
        <Route path="operator" element={<OperatorControlPanel />} />
        <Route path="*" element={<Navigate to="operator" replace />} />
      </Route>
    </Routes>
  );
}
