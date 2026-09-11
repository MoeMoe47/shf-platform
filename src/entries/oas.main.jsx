// src/entries/oas.main.jsx
// Entry point for oas.html — the public Open Autonomous Standard landing
// page. Deliberately does NOT import the shared SHF/SHS global.css /
// theme-shf.css / unified-shell.css stack that most other app entries
// do — OAS is a neutral standards identity, not an SHF-branded surface.
// This mirrors the same opt-out precedent already established by
// universe.main.jsx for the canonical Universe experience.
import React from "react";
import { createRoot } from "react-dom/client";
import OASLandingPage from "@/pages/oas/OASLandingPage.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in oas.html");
}

createRoot(el).render(<OASLandingPage />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
