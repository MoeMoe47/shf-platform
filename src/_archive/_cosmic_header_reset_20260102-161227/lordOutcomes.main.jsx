import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/providers/RootProviders.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";

/* Base tokens/theme (load FIRST) */
import "@/styles/lordOutcomes.tokens.css";
import "@/styles/lordOutcomes.theme.css";

/* Legacy styles (safe to keep) */
import "@/styles/lordOutcomes.css";

/* Cosmic background layer */
import "@/styles/lordOutcomes.dym.pattern.css";

/* Skeleton + layout rules */
import "@/styles/lordOutcomes._LOCKED.skeleton.css";

/* Header dropdown/menu styling */
import "@/styles/lordOutcomes.header.locked.css";

const mount = document.getElementById("root");

createRoot(mount).render(
  <React.StrictMode>
    <RootProviders>
      <HashRouter>
        <LordOutcomesRoutes />
      </HashRouter>
    </RootProviders>
  </React.StrictMode>
);
