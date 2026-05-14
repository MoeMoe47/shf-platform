import React from "react";
import { stateOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import StateOutcomesTable from "@/components/lordOutcomes/tables/StateOutcomesTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";

export default function StateOutcomesPage() {
  return (
    <div className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">State Outcomes</h1>
          <p className="db-subtitle">
            Compare outcomes by state across your regional footprint.
          </p>
        </div>
        <OutcomeFilterBar />
      </header>

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          <StateOutcomesTable rows={stateOutcomes} />
        </div>
      </section>
    </div>
  );
}
