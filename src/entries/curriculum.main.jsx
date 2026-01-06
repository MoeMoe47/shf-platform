// src/entries/curriculum.main.jsx

/* ---------- Tag <html> immediately ---------- */
try {
  document.documentElement.setAttribute("data-app", "curriculum");
} catch {}

/* ---------- Dev mocks (safe) ---------- */
if (import.meta.env.DEV) {
  void import("@/dev/mockApi.js").catch(() => {});
}

/* ---------- CSS (SHVR1 verified order) ---------- */
import "@/styles/unified-shell.css";

import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/emoji.css";
import "@/styles/lesson-soft.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";
import "@/styles/dashboard-shared.css";

/* Curriculum-specific (FLAT paths — this was the bug) */
import "@/styles/curriculum-shell.css";
import "@/styles/curriculum-sidebar.css";
import "@/styles/curriculum-skin.css";

/* ---------- React / Router ---------- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---------- App bits ---------- */
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import CurriculumRoutes from "@/router/CurriculumRoutes.jsx";

/* ---------- Robust mount (SHVR1 style) ---------- */
function getOrCreateMount() {
  let el =
    document.querySelector('div[data-app="curriculum"]') ||
    document.getElementById("root") ||
    document.getElementById("app");

  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    el.dataset.app = "curriculum";
    document.body.appendChild(el);
  }
  return el;
}

createRoot(getOrCreateMount()).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RootProviders appScope="curriculum">
        <HashRouter>
          <CurriculumRoutes />
        </HashRouter>
      </RootProviders>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
