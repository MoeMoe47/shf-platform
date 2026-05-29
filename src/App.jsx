import React, { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

// EXISTING PAGE
const SHSExchangeMissionControl = lazy(() => import("@/pages/exchange/SHSExchangeMissionControl.jsx"));

// NEW SHF PAGE
import SHFImpactCommandCenter from "./pages/shf-command/SHFImpactCommandCenter";
import { installGlobalButtonClickSound } from "./shared/ui/globalButtonClickSound.js";


function AppRouteFallback() {
  return (
    <div
      style={{
        minHeight: "320px",
        display: "grid",
        placeItems: "center",
        padding: "32px",
        color: "rgba(226, 232, 240, 0.92)",
        background: "linear-gradient(180deg, rgba(8,24,44,.96), rgba(3,10,22,.98))",
      }}
    >
      Loading SHS route surface…
    </div>
  );
}

function withAppLazyBoundary(element) {
  return <Suspense fallback={<AppRouteFallback />}>{element}</Suspense>;
}

export default function App() {
  return (
    <Router>
      <Routes>

        {/* EXISTING ROUTE */}
        <Route path="/exchange-mission" element={withAppLazyBoundary(<SHSExchangeMissionControl />)} />

        {/* NEW SHF COMMAND CENTER */}
        <Route path="/shf-command" element={<SHFImpactCommandCenter />} />

      </Routes>
    </Router>
  );
}

installGlobalButtonClickSound();
