// src/entries/oas-1.main.jsx
// Entry point for oas-1.html — the official OAS-1 standards-entry page.
// Same isolation precedent as oas.main.jsx: no shared SHF/SHS stylesheet
// stack, since OAS is a neutral standards identity, not an SHF surface.
import React from "react";
import { createRoot } from "react-dom/client";
import OAS1Page from "@/pages/oas/OAS1Page.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in oas-1.html");
}

createRoot(el).render(<OAS1Page />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
