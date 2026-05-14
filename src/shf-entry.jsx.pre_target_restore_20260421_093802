import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import SHFImpactCommandCenter from "./pages/shf-command/SHFImpactCommandCenter.jsx";

function SHFRouteGuard() {
  try {
    return <SHFImpactCommandCenter />;
  } catch (err) {
    console.error("SHFImpactCommandCenter render failed:", err);
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          color: "#ef4444",
          fontSize: "28px",
          fontWeight: 700,
          padding: "24px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        SHFImpactCommandCenter crashed during render. Check DevTools console.
      </div>
    );
  }
}

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("SHF mount failed: missing #root element");
}

createRoot(rootEl).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<SHFRouteGuard />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
