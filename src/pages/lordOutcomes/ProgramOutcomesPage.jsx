import React from "react";
import { programOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import ProgramOutcomesTable from "@/components/lordOutcomes/tables/ProgramOutcomesTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";
import {
  exportOutcomesToCsv,
  exportOutcomesToJson,
} from "@/utils/lordOutcomes/exportOutcomes.js";

export default function ProgramOutcomesPage() {
  // This is the array we feed both to the table and to the export buttons
  const rows = programOutcomes || [];

  return (
    <div className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Program Outcomes</h1>
          <p className="db-subtitle">
            Track outcomes by program, pathway, and cohort.
          </p>
        </div>
        <OutcomeFilterBar />
      </header>

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          {/* Export toolbar */}
          <div className="lo-exportBar">
            <span className="lo-exportLabel">Export program outcomes:</span>
            <button
              type="button"
              className="lo-exportBtn"
              onClick={() =>
                exportOutcomesToCsv(rows, "lord-outcomes-programs")
              }
            >
              Download CSV
            </button>
            <button
              type="button"
              className="lo-exportBtn lo-exportBtn--ghost"
              onClick={() =>
                exportOutcomesToJson(rows, "lord-outcomes-programs")
              }
            >
              Download JSON
            </button>
          </div>

          {/* Outcomes table */}
          <ProgramOutcomesTable rows={rows} />
        </div>
      </section>
    </div>
  );
}
