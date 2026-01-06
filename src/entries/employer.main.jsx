import "@/styles/unified-shell.css";
// src/entries/employer.main.jsx

/* ---------------- Progressive Web (non-blocking) ---------------- */
if ("serviceWorker" in navigator) {
// (dev) disabled SW import
}

/* ---------------- Dev mocks (no top-level await) ---------------- */
if (import.meta.env.DEV) {
  import("@/dev/mockApi.js").catch(() => {});
}

/* ---------------- Tag <html> before CSS ---------------- */
try {
  const html = document.documentElement;
  html.setAttribute("data-app", "employer");
  // html.setAttribute("data-theme", "foundation"); // or "solutions"
} catch {}

/* ---------------- Base CSS (order matters) ---------------- */
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";        // loading skeletons
import "@/styles/util-wash.css";
import "@/styles/dashboard-shared.css"; // Northstar helpers
import "@/styles/kpi.css";
import "@/styles/lesson-soft.css";      // visuals used in employer demos
import "@/styles/emoji.css";            // emoji utilities
import "@/styles/employer-shell.css";   // app-scoped shell skin

/* Minimal layout safety for any device (load LAST) */
import "@/styles/app-shell.css";

/* ---------------- React / Router ---------------- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---------------- App bits ---------------- */
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import EmployerRoutes from "@/router/EmployerRoutes.jsx";
import { RoleProvider } from "@/context/RoleCtx.jsx";
import { setAppScope } from "@/utils/setAppScope.js";

/* Signal scope to shared providers/utilities */
setAppScope("employer");

/* Robust mount finder (prefers data-app) */
function getMount() {
  return (
    document.querySelector('[data-app="employer"]') ||
    document.getElementById("root") ||
    document.getElementById("app")
  );
}

const rootEl = getMount();
if (!rootEl) {
  console.error(
    '[ENTRY:employer] mount not found. Ensure employer.html includes <div id="root" data-app="employer"></div> and <script type="module" src="/src/entries/employer.main.jsx"></script>.'
  );
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <RootProviders appScope="employer">
          <RoleProvider initial="admin">
            {/* No basename with HashRouter; use employer.html#/path */}
            <HashRouter>
              <EmployerRoutes />
            </HashRouter>
          </RoleProvider>
        </RootProviders>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
