// src/components/civic/CivicKpis.jsx
import React from "react";
import KpiCard from "@/components/ui/KpiCard.jsx";

const readNum = (k) => {
  try { return Number(localStorage.getItem(k) ?? 0) || 0; } catch { return 0; }
};

export default function CivicKpis() {
  const surveysCompleted = readNum("civic:kpi:surveysCompleted");
  const notesAdded       = readNum("civic:kpi:notesAdded");
  const portfolioAdded   = readNum("civic:kpi:portfolioAdded");

  return (
    <div className="db-grid db-grid--kpis">
      <KpiCard label="Surveys Completed" value={surveysCompleted} />
      <KpiCard label="Notes Added" value={notesAdded} />
      <KpiCard label="Portfolio Added" value={portfolioAdded} />
    </div>
  );
}
