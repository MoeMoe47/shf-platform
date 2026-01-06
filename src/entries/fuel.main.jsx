import "@/styles/unified-shell.css";
// src/entries/fuel.main.jsx

/* ---------------- PWA (non-blocking) ---------------- */
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
  html.setAttribute("data-app", "fuel");
  // html.setAttribute("data-theme", "foundation"); // or "solutions" if you prefer
} catch {}

/* ---------------- Base CSS (order matters) ---------------- */
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";
/* Optional shared visuals your pages often use */
import "@/styles/emoji.css";
import "@/styles/lesson-soft.css";
/* Minimal layout safety for any device (load LAST) */
import "@/styles/app-shell.css";

/* ---------------- React / Router ---------------- */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

/* ---------------- App bits ---------------- */
import RootProviders from "@/entries/RootProviders.jsx";
import FuelRoutes from "@/router/FuelRoutes.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";

/* Robust mount finder */
function getMount() {
  return (
    document.querySelector('[data-app="fuel"]') ||
    document.getElementById("root") ||
    document.getElementById("app")
  );
}

const rootEl = getMount();
if (!rootEl) {
  console.error(
    '[ENTRY:fuel] mount not found. Ensure fuel.html includes <div id="root" data-app="fuel"></div> and <script type="module" src="/src/entries/fuel.main.jsx"></script>.'
  );
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <RootProviders appScope="fuel">
          <HashRouter>
            <FuelRoutes />
          </HashRouter>
        </RootProviders>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}
