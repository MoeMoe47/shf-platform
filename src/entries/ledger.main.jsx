import "@/styles/unified-shell.css";
// src/entries/ledger.main.jsx

/* ---------------- PWA (non-blocking, CSP-safe) ---------------- */
if ("serviceWorker" in navigator) {
// (dev) disabled SW import
  }
  
  /* ---------------- Dev mocks (no top-level await) ---------------- */
  if (import.meta.env.DEV) {
    import("@/dev/mockApi.js").catch(() => {});
  }
  
  /* ---------------- Tag <html> before CSS ---------------- */
  /* Use "treasury" so existing treasury-* CSS scopes apply here too */
  try {
    const html = document.documentElement;
    html.setAttribute("data-app", "treasury");
    // Optional theme:
    // html.setAttribute("data-theme", "foundation");
  } catch {}
  
  /* ---------------- Base CSS (order matters) ---------------- */
  import "@/styles/foundation.css";
  import "@/styles/global.css";
  import "@/styles/shell.css";
  import "@/styles/skeleton.css";
  
  /* Shared utilities */
  import "@/styles/util-wash.css";
  import "@/styles/dashboard-shared.css";
  import "@/styles/kpi.css";
  
  /* Treasury skin + polish (works for the ledger entry as well) */
  import "@/styles/treasury-shell.css";
  import "@/styles/treasury-polish.css";
  
  /* Optional visuals used across apps */
  import "@/styles/emoji.css";
  import "@/styles/lesson-soft.css";
  
  /* Minimal layout safety for any device — keep LAST */
  import "@/styles/app-shell.css";
  
  /* ---------------- React / Router ---------------- */
  import React from "react";
  import { createRoot } from "react-dom/client";
  import { HashRouter } from "react-router-dom";
  
  /* ---------------- App bits ---------------- */
  import RootProviders from "@/entries/RootProviders.jsx";
  import TreasuryRoutes from "@/router/TreasuryRoutes.jsx";
  import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
  import { RoleProvider } from "@/context/RoleCtx.jsx";
  
  /* Robust mount finder */
  function getMount() {
    return (
      document.querySelector('[data-app="treasury"]') ||
      document.getElementById("root") ||
      document.getElementById("app")
    );
  }
  
  /* ---------------- Mount ---------------- */
  const rootEl = getMount();
  if (!rootEl) {
    console.error(
      '[ENTRY:ledger] mount not found. Ensure ledger.html includes <div id="root" data-app="treasury"></div> and <script type="module" src="/src/entries/ledger.main.jsx"></script>.'
    );
  } else {
    createRoot(rootEl).render(
      <React.StrictMode>
        <GlobalErrorBoundary>
          {/* appScope "treasury" so shared providers, styles, and routes align */}
          <RootProviders appScope="treasury">
            {/* Pick the default role you want to preview with */}
            <RoleProvider initial="admin">
              <HashRouter>
                <TreasuryRoutes />
              </HashRouter>
            </RoleProvider>
          </RootProviders>
        </GlobalErrorBoundary>
      </React.StrictMode>
    );
  }
  