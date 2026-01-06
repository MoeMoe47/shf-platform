import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/providers/RootProviders.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";

/* =========================================================
   1️⃣ TOKENS + THEME (FOUNDATION — LOAD FIRST)
========================================================= */
import "@/styles/lordOutcomes.tokens.css";
import "@/styles/lordOutcomes.theme.css";

/* =========================================================
   2️⃣ CORE LAYOUT + LEGACY SAFETY
========================================================= */
import "@/styles/lordOutcomes.css";

/* =========================================================
   3️⃣ CINEMATIC VISUAL SYSTEM (ONE SYSTEM ONLY)
   ❌ DO NOT load pattern + cinematic together
========================================================= */
import "@/styles/lordOutcomes.dym.css";

/* =========================================================
   4️⃣ LOCKED STRUCTURE + HEADER
========================================================= */
import "@/styles/lordOutcomes._LOCKED.skeleton.css";
import "@/styles/lordOutcomes.header.locked.css";

/* =========================================================
   5️⃣ FINAL OVERRIDE — MUST LOAD LAST
   (This kills the dark veil permanently)
========================================================= */
import "@/styles/lordOutcomes.dym.afterLocked.patch.css";

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
