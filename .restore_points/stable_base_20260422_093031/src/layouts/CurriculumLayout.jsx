// src/layouts/CurriculumLayout.jsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppShellLayout from "@/layouts/AppShellLayout.jsx";
import CurriculumSidebar from "@/components/CurriculumSidebar.jsx";

function inferCurriculumFromPath(pathname = "") {
  // Expect: /curriculum/asl/... OR /curriculum/ged-writing/...
  const parts = pathname.split("/").filter(Boolean);
  const i = parts.indexOf("curriculum");
  const next = i >= 0 ? parts[i + 1] : null;

  // Normalize known routes into friendly labels
  if (!next) return "ASL";
  if (next === "asl") return "ASL";
  if (next === "ged-writing") return "GED Writing";

  // Fallback: Title Case the segment
  return next
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
}

export default function CurriculumLayout() {
  const { pathname } = useLocation();
  const curLabel = inferCurriculumFromPath(pathname);

  return (
    <AppShellLayout
      app="curriculum"
      Sidebar={CurriculumSidebar}
      title={`Lessons · ${curLabel}`}
    >
      <Outlet />
    </AppShellLayout>
  );
}
