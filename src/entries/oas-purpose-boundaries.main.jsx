// src/entries/oas-purpose-boundaries.main.jsx
// Entry point for oas-purpose-boundaries.html — OAS Domain 02 detail
// page. Same isolation precedent as the other OAS entries: no shared
// SHF/SHS stylesheet stack, since OAS is a neutral standards identity.
import React from "react";
import { createRoot } from "react-dom/client";
import OASPurposeBoundariesPage from "@/pages/oas/OASPurposeBoundariesPage.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in oas-purpose-boundaries.html");
}

createRoot(el).render(<OASPurposeBoundariesPage />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
