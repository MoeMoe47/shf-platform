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
import "@/styles/curriculum-dashboard.css";
import "@/styles/curriculum-learning.css";
import "@/styles/curriculum-lesson.css";
import "@/styles/curriculum-import.css";
import "@/styles/student-portfolio.css";
import "@/styles/student-portfolio-dark.css";

/* SHF AIEL Phase 4 — Curriculum & Lesson Accessibility Integration. Loaded
   last among Curriculum CSS so its data-a11y-* attribute selectors are
   unambiguous next to the base --ld-* token definitions above. */
import "@/styles/curriculum-a11y.css";
import "@/styles/studio.css";

/* ---------- React / Router ---------- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---------- App bits ---------- */
import RootProviders from "@/entries/RootProviders.jsx";
import { AuthProvider } from "@/auth/auth-context.jsx";
import { UserProvider } from "@/context/UserContext.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import CurriculumRoutes from "@/router/CurriculumRoutes.jsx";

/* ---------- Phase 2B: cross-cutting accessibility providers ----------
   ReadingLevelProvider already existed (real, working) but was never
   mounted anywhere in the Curriculum app. AccessibilityPreferencesProvider
   is new (see its own file header — no existing generic capability-based
   preference system was found). LiveAnnouncer is a real, existing
   primitive from src/components/ally/A11yTools.jsx, also never mounted
   here before — CurriculumLayout.jsx already has its own real skip link
   (`.ld-skip` -> #curriculum-main), so A11yTools' SkipToContent is
   deliberately NOT also added here (would be a duplicate, confusing
   screen-reader users with two skip links). */
import ReadingLevelProvider from "@/context/ReadingLevelProvider.jsx";
import AccessibilityPreferencesProvider from "@/context/AccessibilityPreferences.jsx";
import { LiveAnnouncer } from "@/components/ally/A11yTools.jsx";

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
      <AuthProvider>
        <UserProvider>
          <RootProviders appScope="curriculum">
            <AccessibilityPreferencesProvider>
              <ReadingLevelProvider>
                <LiveAnnouncer />
                <HashRouter>
                  <CurriculumRoutes />
                </HashRouter>
              </ReadingLevelProvider>
            </AccessibilityPreferencesProvider>
          </RootProviders>
        </UserProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
