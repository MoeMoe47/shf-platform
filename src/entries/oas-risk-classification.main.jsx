// src/entries/oas-risk-classification.main.jsx
// Entry point for oas-risk-classification.html — OAS Risk
// Classification page. Same isolation precedent as the other OAS
// entries: no shared SHF/SHS stylesheet stack, since OAS is a neutral
// standards identity.
import React from "react";
import { createRoot } from "react-dom/client";
import OASRiskClassificationPage from "@/pages/oas/OASRiskClassificationPage.jsx";

const el = document.getElementById("root");
if (!el) {
  throw new Error("Root element #root not found in oas-risk-classification.html");
}

createRoot(el).render(<OASRiskClassificationPage />);

if (import.meta.hot) {
  import.meta.hot.accept();
}
