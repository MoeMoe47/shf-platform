import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/providers/RootProviders.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";

/* =========================================================
   Load order rule:
   1) tokens/theme
   2) base app css
   3) background/pattern
   4) locked skeleton (layout safety)
   5) cosmic header LAST (wins header look)
========================================================= */
import "@/styles/lordOutcomes.tokens.css";
import "@/styles/lordOutcomes.theme.css";
import "@/styles/lordOutcomes.css";

/* Background visuals */
import "@/styles/lordOutcomes.dym.pattern.css";
import "@/styles/lordOutcomes.dym.css";

/* Layout safety rules */
import "@/styles/lordOutcomes._LOCKED.skeleton.css";

/* Cosmic header (replaces locked header) */
import "@/styles/lordOutcomes.header.cosmic.css";

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
