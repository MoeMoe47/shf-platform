// src/entries/oas-control-domains.main.jsx
// Entry point for oas-control-domains.html — the OAS control-domains
// framework page. Same isolation precedent as oas.main.jsx /
// oas-1.main.jsx: no shared SHF/SHS stylesheet stack, since OAS is a
// neutral standards identity, not an SHF surface.
import React from "react";
import { createRoot } from "react-dom/client";
import OASControlDomainsPage from "@/pages/oas/OASControlDomainsPage.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in oas-control-domains.html");
}

createRoot(el).render(<OASControlDomainsPage />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
