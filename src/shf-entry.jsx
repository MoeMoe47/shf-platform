import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import SHFImpactCommandCenter from "./pages/shf-command/SHFImpactCommandCenter.jsx";
import CountyDetail from "./foundation/pages/CountyDetail.jsx";
import CaseDetail from "./foundation/pages/CaseDetail.jsx";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("SHF mount failed: missing #root element");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<SHFImpactCommandCenter />} />
        <Route path="/county/:slug" element={<CountyDetail />} />
        <Route path="/case/:entityId" element={<CaseDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
