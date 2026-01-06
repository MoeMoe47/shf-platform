// src/entries/sales.main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

// 🔌 Core providers & routes
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import SalesRoutes from "@/router/SalesRoutes.jsx";

// 🧼 Base CSS stack – same pattern as other apps
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/unified-shell.css";
import "@/styles/sidebar.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";
import "@/styles/dashboard-shared.css";
import "@/styles/kpi.css";
import "@/styles/sales-shell.css"; // if this exists for sales polish

// 🧪 Dev mocks (no top-level await, no eval)
if (import.meta.env.DEV) {
  import("@/dev/mockApi.js")
    .then(() => console.log("[sales] mockApi loaded"))
    .catch((err) => console.warn("[sales] mockApi failed", err));
}

// Tag the HTML element so your shell CSS can key off it
try {
  document.documentElement.setAttribute("data-app", "sales");
} catch (e) {
  console.warn("[sales] could not set data-app on <html>", e);
}

// 🔍 Find the mount point in the DOM
const rootEl =
  document.querySelector('[data-app="sales"]') ||
  document.getElementById("root");

if (!rootEl) {
  console.error("[sales.main] No root element found");
  document.body.innerHTML =
    '<div style="padding:24px;font-family:system-ui;color:#b91c1c">[sales.main] Could not find root element (#root or [data-app=\"sales\"]).</div>';
  throw new Error("[sales.main] No root element");
}

console.log("[sales.main] mounting into", rootEl);

// 🚀 Mount the React app
createRoot(rootEl).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <RootProviders appScope="sales">
        <HashRouter>
          <SalesRoutes />
        </HashRouter>
      </RootProviders>
    </GlobalErrorBoundary>
  </React.StrictMode>
);
