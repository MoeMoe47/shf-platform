import React from "react";
import { fundingOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import FundingImpactTable from "@/components/lordOutcomes/tables/FundingImpactTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";

export default function FundingImpactPage() {
  return (
    <div className="db-shell">
      <header className="db-head">
        <div>
          <h1 className="db-title">Funding Impact</h1>
          <p className="db-subtitle">
            Show how grants and contracts translate into real outcomes.
          </p>
        </div>
        <OutcomeFilterBar />
      </header>

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          <FundingImpactTable rows={fundingOutcomes} />
        </div>
      </section>
    </div>
  );
}
