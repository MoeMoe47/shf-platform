// src/entries/universe.main.jsx
// ------------------------------------------------------------
// Entry point for universe.html — reachable directly as /universe.html,
// and (via Vite's default dev-server SPA fallback, and root index.html
// mounting this exact same component — see src/entries/index.main.jsx)
// also reachable as the canonical /universe.
//
// This file only mounts UniverseApp; it owns no routing or destination
// logic of its own — see src/pages/universe-v1/UniverseApp.jsx and
// universeDestinationRegistry.js for that.
// ------------------------------------------------------------
import React from "react";
import { createRoot } from "react-dom/client";
import UniverseApp from "@/pages/universe-v1/UniverseApp.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in universe.html");
}

createRoot(el).render(<UniverseApp />);
