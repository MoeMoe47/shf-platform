import "@/styles/shell.css";
import "@/styles/unified-shell.css";
// --- CSS: keep your app styles first, shell last ---
import "@/styles/ai-compass.css";          // your existing AI styles (keep!)
import "@/styles/ai-compass.solutions.css"; // optional theme file if you use it
import "@/styles/app-shell.css";             // ← LAST: minimal responsive/layout guard

import React from "react";
import { applyManifest } from "@/apps/manifest/applyManifest.js";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/entries/RootProviders.jsx";
import AIRoutes from "@/router/AIRoutes.jsx";

// ✅ DEV-only mocks (no CSP/rollup headaches in prod)
if (import.meta.env.DEV) {
  // Lightweight fetch shim + mock routes
  await import("@/dev/aiMock.fetch-shim.js");
  await import("@/dev/aiMock.routes.js");
}

// ✅ Register SW only in production (prevents dev build errors)
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  // This file exists in your repo; only load at runtime in prod
// (dev) disabled SW import
}

// Robust mount finder/creator
function getMount(app = "ai") {
  let el =
    document.querySelector(`[data-app="${app}"]`) ||
    document.getElementById(`${app}-root`) ||
    document.getElementById("root");

  if (!el) {
    el = document.createElement("div");
    el.id = "root";
    el.dataset.app = app;
    document.body.appendChild(el);
  }
  return el;
}

const APP = "ai";
const el = getMount(APP);

createRoot(el).render(
  <React.StrictMode>
    <RootProviders appScope={APP}>
      <HashRouter>
        <AIRoutes />
      </HashRouter>
    </RootProviders>
  </React.StrictMode>
);
