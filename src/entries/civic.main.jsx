// src/entries/civic.main.jsx

/* ---- App ID (used for mount + theming) ---- */
const APP = "civic";

import { initCivicTheme, getStoredPreference, resolveTheme } from "@/utils/civicTheme.js";

/* ---- Very-early scoping for CSS (no await) ---- */
try {
  const html = document.documentElement;
  html.setAttribute("data-app", APP);
  // Applied synchronously before first paint (all imports/top-level module
  // code run before this line executes, but still before React mounts and
  // before the browser's first paint) so there is no flash of the wrong
  // theme on load, matching the persisted "civic:theme" preference.
  initCivicTheme();
} catch {}

/* ---- Base CSS (keep imports at top; order matters) ---- */
import "@/styles/emoji.css";
import "@/styles/lesson-soft.css";
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";
import "@/styles/dashboard-shared.css";
import "@/styles/kpi.css";
import "@/styles/civic-shell.css";
import "@/styles/civic-dashboard.css";
import "@/styles/civic-elections.css";
import "@/styles/civic-proposals.css";
import "@/styles/civic-grantstory.css";
import "@/styles/civic-debtclock.css";
import "@/styles/civic-treasurysim.css";
import "@/styles/civic-journal.css";
/* Layout guardrails LAST so nothing collapses on mobile/desktop */
import "@/styles/app-shell.css";

/* ---- React / Router ---- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---- App scaffolding ---- */
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import { RoleProvider } from "@/context/RoleCtx.jsx";
import { ToastsProvider } from "@/context/Toasts.jsx";
import { setAppScope } from "@/utils/setAppScope.js";
import CivicRoutes from "@/router/CivicRoutes.jsx";

/* ---- Focus mode (UI + behavior) ---- */
import "@/styles/FocusMode.css";
import "@/shared/ui/focusMode.js";

/* ---- Lesson helpers (UI mounted at root) ---- */
import CoachDrawer from "@/components/civic/CoachDrawer.jsx";

/* ---- Bilingual + Reading-level providers ---- */
import LocaleProvider from "@/context/LocaleProvider.jsx";
import ReadingLevelProvider from "@/context/ReadingLevelProvider.jsx";

/* ---- Optional dev mocks (no top-level await) ---- */
if (import.meta.env.DEV) {
  // fire-and-forget import so there’s no TLA
  import("@/dev/mockApi.js");
}

/* ---- App scope (env signal) ---- */
// setAppScope's default `theme: "auto"` computes purely from system
// prefers-color-scheme and would overwrite the data-theme the inline
// civic.html script + initCivicTheme() already applied from the real,
// user-controlled "civic:theme" preference — found live: it raced in
// ~250-300ms after first paint and visibly flipped dark back to light
// whenever the OS-level preference disagreed with the saved choice.
// Passing the already-resolved civic theme here (instead of "auto") keeps
// setAppScope's data-app bookkeeping intact without it fighting over
// data-theme; CivicThemeSwitch's own effect still re-applies data-theme
// correctly on every later toggle regardless of this one-time call.
setAppScope(APP, { theme: resolveTheme(getStoredPreference()) });

/* ---- Robust mount helper (works with #root or [data-app="civic"]) ---- */
function getMount() {
  let el =
    document.getElementById("root") ||
    document.querySelector(`[data-app="${APP}"]`);
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    el.dataset.app = APP;
    document.body.appendChild(el);
  }
  return el;
}

/* ---- Mount ---- */
createRoot(getMount()).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <LocaleProvider>
        <ReadingLevelProvider>
          <RootProviders appScope={APP}>
            {/* RoleProvider takes `initialRoles` (an array) — previewing
                the app as an admin by default, matching the original
                intent, but with the prop name RoleCtx.jsx actually
                declares (see src/context/RoleCtx.jsx). */}
            <RoleProvider initialRoles={["admin"]}>
              {/* Found during the Proposals redesign: every civic page has
                  always called useToasts()/toast() (vote confirmations,
                  delete-with-Undo, mission-log confirmations, etc.), but no
                  ToastsProvider was ever mounted anywhere in this app's
                  provider tree — useToasts() silently fell back to
                  Toasts.jsx's own no-op default context, so no toast has
                  ever actually been visible in production. Purely additive
                  fix: mounting the provider only makes an already-coded,
                  already-called feature visible; it changes nothing about
                  what any page's own logic does. */}
              <ToastsProvider>
                <HashRouter>
                  {/* Global coach panel lives at the shell level */}
                  <CoachDrawer />
                  <CivicRoutes />
                </HashRouter>
              </ToastsProvider>
            </RoleProvider>
          </RootProviders>
        </ReadingLevelProvider>
      </LocaleProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
