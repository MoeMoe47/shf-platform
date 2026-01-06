import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/providers/RootProviders.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";

/* =========================================================
   Base tokens / theme (load FIRST)
========================================================= */
import "@/styles/lordOutcomes.tokens.css";
import "@/styles/lordOutcomes.theme.css";

/* =========================================================
   Base app styles
========================================================= */
import "@/styles/lordOutcomes.css";

/* =========================================================
   DYM visuals (backgrounds / patterns)
========================================================= */
import "@/styles/lordOutcomes.dym.pattern.css";
import "@/styles/lordOutcomes.dym.css";

/* =========================================================
   LOCKED layout rules (stable)
========================================================= */
import "@/styles/lordOutcomes._LOCKED.skeleton.css";
import "@/styles/lordOutcomes.header.locked.css";

/* =========================================================
   ✅ Cosmic Header (single source of truth)
========================================================= */

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
