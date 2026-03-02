import React from "react";

// === LOO CSS LOCK START ===
import "@/styles/lordOutcomes.scaffold.css";
import "@/styles/lordOutcomes.theme.css";
import "@/styles/lordOutcomes.header.locked.css";
// === LOO CSS LOCK END ===
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import RootProviders from "@/providers/RootProviders.jsx";
import LordOutcomesRoutes from "@/router/LordOutcomesRoutes.jsx";

/* =========================================================
   Base tokens / theme (LOAD FIRST)
========================================================= */
import "@/styles/lordOutcomes.tokens.css";
// import "@/styles/lordOutcomes.theme.css";

/* =========================================================
   Core/legacy styling (SAFE)
========================================================= */
import "@/styles/lordOutcomes.css";

/* =========================================================
   Background pattern layer (SAFE) — keep behind UI
========================================================= */
import "@/styles/lordOutcomes.dym.pattern.css";

/* =========================================================
   Layout skeleton (LOCKED) — keep
========================================================= */
import "@/styles/lordOutcomes._LOCKED.skeleton.css";

/* =========================================================
   ✅ COSMIC HEADER — MUST LOAD LAST (wins)
   (Make sure this file exists: src/styles/lordOutcomes.header.cosmic.css)
========================================================= */
import "@/styles/lordOutcomes.header.cosmic.css";

/* =========================================================
   🚫 DO NOT IMPORT:
   - lordOutcomes.header.locked.css
   - lordOutcomes.header.slim.css
   - lordOutcomes.dym.afterLocked.patch.css
   - lordOutcomes.dym.patch.css
   - lordOutcomes.ref.css
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
