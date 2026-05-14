import React from "react";
import { employerOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import EmployerOutcomesTable from "@/components/lordOutcomes/tables/EmployerOutcomesTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";

export default function EmployerImpactPage() {
  return (
    <div className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Employer Impact</h1>
          <p className="db-subtitle">
            Measure hires, retention, and wage gains by employer partner.
          </p>
        </div>
        <OutcomeFilterBar />
      </header>

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          <EmployerOutcomesTable rows={employerOutcomes} />
        </div>
      </section>
    </div>
  );
}
