import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import SolutionsLayout from "@/layouts/SolutionsLayout.jsx";

import SolutionsHome from "@/pages/solutions/SolutionsHome.jsx";

export default function SolutionsRoutes() {
  return (
    <Routes>
      <Route element={<SolutionsLayout />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<SolutionsHome />} />
        <Route path="*" element={<Navigate to="home" replace />} />
      </Route>
    </Routes>
  );
}
