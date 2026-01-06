// src/templates/lordOutcomes/LordOutcomesTemplate.jsx
import React from "react";
import { Outlet } from "react-router-dom";

import LordOutcomesHeaderLocked from "@/components/lordOutcomes/shell/LordOutcomesHeaderLocked.jsx";

export default function LordOutcomesTemplate() {
  return (
    <div className="looPage">
      <LordOutcomesHeaderLocked />
      <main className="looMain">
        <Outlet />
      </main>
    </div>
  );
}
