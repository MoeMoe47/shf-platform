import "@/styles/unified-shell.css";
// src/entries/treasury.main.jsx
// Safe bootstrap for Treasury while we repair styles + mocks.
// All CSS + dev-mock imports are commented out so Vite can't fail on them.

/* 1) Dev mocks (temporarily disabled) */
// if (import.meta.env.DEV) {
//   await import("@/dev/mockApi.js");
// }

/* 2) Scope <html> to this app ASAP (before CSS loads) */
try {
  const html = document.documentElement;
  html.setAttribute("data-app", "treasury");
  // Optional theme switch:
  // html.setAttribute("data-theme", "foundation");
} catch {}

/* 3) Base CSS stack (TEMPORARILY DISABLED to avoid missing-file errors) */
// import "@/styles/foundation.css";
// import "@/styles/global.css";
// import "@/styles/shell.css";
// import "@/styles/skeleton.css";
// import "@/styles/util-wash.css";
// import "@/styles/dashboard-shared.css";
// import "@/styles/kpi.css";

/* 4) Treasury-specific polish (also disabled for now) */
// import "@/styles/treasury-shell.css";
// import "@/styles/treasury-polish.css";

/* 5) Optional emoji + soft card visuals (disabled) */
// import "@/styles/emoji.css";
// import "@/styles/lesson-soft.css";

/* 6) React / Router / Providers */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import RootProviders from "@/entries/RootProviders.jsx";
import { RoleProvider } from "@/context/RoleCtx.jsx";

/* 7) Routes */
import TreasuryRoutes from "@/router/TreasuryRoutes.jsx";

/* 8) App scope signal for any shared utilities that read it */
import { setAppScope } from "@/utils/setAppScope.js";
setAppScope("treasury");

/* 9) Robust mount: [data-app="treasury"] → #root → #app (creates if missing) */
function getMount(app) {
  let el =
    document.querySelector(`[data-app="${app}"]`) ||
    document.getElementById("root") ||
    document.getElementById("app");
  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    el.dataset.app = app;
    document.body.appendChild(el);
  }
  return el;
}

const mount = getMount("treasury");

/* 10) Render */
createRoot(mount).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RootProviders appScope="treasury">
        <RoleProvider initial="admin">
          {/* With multi-HTML entries, use HashRouter WITHOUT basename.
              Navigate like: /treasury.html#/dashboard */}
          <HashRouter>
            <TreasuryRoutes />
          </HashRouter>
        </RoleProvider>
      </RootProviders>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
