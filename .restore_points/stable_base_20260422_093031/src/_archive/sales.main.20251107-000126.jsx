// src/entries/sales.main.jsx
import "@/entries/register-sw.js";

if (import.meta.env.DEV) await import("@/dev/mockApi.js");

try { document.documentElement.setAttribute("data-app", "sales"); } catch {}

import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";

import getMount from "@/entries/getMount.js";
import RootProviders from "@/entries/RootProviders.jsx";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary.jsx";
import SalesRoutes from "@/router/SalesRoutes.jsx";

// Base CSS (order matters, keep minimal to test)
import "@/styles/foundation.css";
import "@/styles/global.css";
import "@/styles/shell.css";
import "@/styles/skeleton.css";
import "@/styles/util-wash.css";

const rootEl = getMount("sales"); // finds [data-app="sales"] or #root/#app; creates if missing

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
