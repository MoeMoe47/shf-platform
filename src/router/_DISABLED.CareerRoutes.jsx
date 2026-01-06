import React from "react";
import { Routes, Route } from "react-router-dom";
import CareerLayout from "@/layouts/CareerLayout.jsx";
import CareerDashboard from "@/pages/career/CareerDashboard.jsx";
// etc...

export function CareerRoutes() {
  return (
    <Routes>
      <Route element={<CareerLayout />}>
        <Route index element={<CareerDashboard />} />
        {/* more routes */}
      </Route>
    </Routes>
  );
}
