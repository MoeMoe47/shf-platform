import "@/styles/unified-shell.css";
// src/entries/solutions.main.jsx
// (optional) Service worker registration – keep disabled until CSP finalized
// (dev) disabled SW import

/* 1) Dev mocks FIRST so they hook fetch before anything else */
if (import.meta.env.DEV) {
  await import("@/dev/mockApi.js");
}

/* 2) Scope <html> to this app (and theme) ASAP, before CSS loads */
try {
  const html = document.documentElement;
  html.setAttribute("data-app", "solutions");
  html.setAttribute("data-theme", "solutions"); // uses styles/theme-solutions.css
} catch {}

/* 3) Base CSS stack (order matters; low-specificity, safe) */
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";

/* 4) Solutions theme + any app-specific skin */
import "@/styles/theme-solutions.css";       // night-launch palette
import "@/styles/ai-compass.solutions.css";  // (present in your tree; optional)

/* 5) Map library CSS (you’re using MapLibre elsewhere) */

/* 6) React / Router / Providers */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import RootProviders from "@/entries/RootProviders.jsx";
import { RoleProvider } from "@/context/RoleCtx.jsx";

/* 7) Routes */
import SolutionsRoutes from "@/router/SolutionsRoutes.jsx";

/* 8) Mount helper: prefer [data-app="solutions"], then #root, then #app */
function getMount(app) {
  return (
    document.querySelector(`[data-app="${app}"]`) ||
    document.getElementById("root") ||
    document.getElementById("app")
  );
}

const mount = getMount("solutions");
if (!mount) {
  console.error(
    '[ENTRY:solutions] mount not found. Ensure solutions.html has <div id="root" data-app="solutions"></div> and loads /src/entries/solutions.main.jsx.'
  );
} else {
  createRoot(mount).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <RootProviders appScope="solutions">
          <RoleProvider initial="student">
            {/* With multi-HTML entries, use HashRouter WITHOUT basename.
               Navigate like: /solutions.html#/top */}
            <HashRouter>
              <SolutionsRoutes />
            </HashRouter>
          </RoleProvider>
        </RootProviders>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
