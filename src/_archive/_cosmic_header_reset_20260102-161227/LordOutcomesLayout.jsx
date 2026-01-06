// src/layouts/LordOutcomesLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import LordOutcomesHeaderLocked from "@/components/lordOutcomes/shell/LordOutcomesHeaderLocked.jsx";

export default function LordOutcomesLayout() {
  return (
    <div className="looPage loo-dymApp">
      {/* Decorative layers (pattern/noise/vignette) */}
      <div className="loo-dymGrid" aria-hidden="true" />
      <div className="loo-dymNoise" aria-hidden="true" />
      <div className="loo-vignette" aria-hidden="true" />

      {/* UI */}
      <LordOutcomesHeaderLocked />
      <main className="looMain">
        <Outlet />
      </main>
    </div>
  );
}
