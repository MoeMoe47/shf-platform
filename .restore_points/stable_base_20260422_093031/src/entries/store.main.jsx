import "@/styles/unified-shell.css";
// src/entries/store.main.jsx
// (optional) SW registration — keep disabled until CSP finalized
// (dev) disabled SW import

/* 1) Dev mocks FIRST so they hook fetch before anything else */
if (import.meta.env.DEV) {
  await import("@/dev/mockApi.js");
}

/* 2) Scope <html> to this app ASAP (before CSS loads) */
try {
  const html = document.documentElement;
  html.setAttribute("data-app", "store");
  // Optional theme (uncomment if you want the Solutions palette here):
  // html.setAttribute("data-theme", "solutions");
} catch {}

/* 3) Base CSS stack (order matters; low-specificity, safe) */
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css"; // non-invasive washes for KPI/tiles
// Add store-specific CSS below if/when you have it, AFTER util-wash.
// import "@/styles/store-shell.css";

/* 4) React / Router / Providers */
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import RootProviders from "@/entries/RootProviders.jsx";

/* 5) Routes */
import StoreRoutes from "@/router/StoreRoutes.jsx";

/* 6) Robust mount helper: [data-app="store"] → #root → #app (creates if missing) */
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

const mount = getMount("store");

/* 7) Render */
createRoot(mount).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RootProviders appScope="store">
        {/* With multi-HTML entries, use HashRouter WITHOUT basename.
            Navigate like: /store.html#/route */}
        <HashRouter>
          <StoreRoutes />
        </HashRouter>
      </RootProviders>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
