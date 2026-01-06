import "@/styles/unified-shell.css";
// src/entries/debt.main.jsx

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
  html.setAttribute("data-app", "debt");
  // html.setAttribute("data-theme", "foundation"); // or "solutions" if desired
} catch {}

/* ---------------- Base CSS (order matters) ---------------- */
import "@/styles/foundation.css";
import "@/styles/global.css";

/* Emoji / lesson surfaces (safe, shared) */
import "@/styles/emoji.css";
import "@/styles/lesson-soft.css";

/* Shell + skeleton + utilities */
import "@/styles/shell.css";             // primitives
import "@/styles/skeleton.css";          // Northstar skeletons
import "@/styles/util-wash.css";         // opt-in washes

/* Shared dashboard helpers */
import "@/styles/dashboard-shared.css";
import "@/styles/kpi.css";

/* Brand + app polish (loaded after shared so it can override) */
import "@/styles/theme-shf.css";
import "@/styles/debt-shell.css";

/* Minimal layout safety for any device (load LAST) */
import "@/styles/app-shell.css";

/* ---------------- React / Router ---------------- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---------------- App bits ---------------- */
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import DebtRoutes from "@/router/DebtRoutes.jsx";
import { RoleProvider } from "@/context/RoleCtx.jsx";
import { setAppScope } from "@/utils/setAppScope.js";

/* Signal scope to any consumers */
setAppScope("debt");

/* Robust mount finder */
function getMount() {
  return (
    document.querySelector('[data-app="debt"]') ||
    document.getElementById("root") ||
    document.getElementById("app")
  );
}

const rootEl = getMount();
if (!rootEl) {
  console.error(
    '[ENTRY:debt] mount not found. Ensure debt.html includes <div id="root" data-app="debt"></div> and <script type="module" src="/src/entries/debt.main.jsx"></script>.'
  );
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <RootProviders appScope="debt">
          <RoleProvider initial="student">
            <HashRouter>
              <DebtRoutes />
            </HashRouter>
          </RoleProvider>
        </RootProviders>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
