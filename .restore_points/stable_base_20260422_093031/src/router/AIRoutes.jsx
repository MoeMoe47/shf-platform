import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import JobCompass from "@/pages/ai/JobCompass.jsx";

export default function AIRoutes() {
  return (
    <Routes>
      <Route path="job-compass" element={<JobCompass />} />
      {/* default → job-compass */}
      <Route path="*" element={<Navigate to="/job-compass" replace />} />
    </Routes>
  );
}