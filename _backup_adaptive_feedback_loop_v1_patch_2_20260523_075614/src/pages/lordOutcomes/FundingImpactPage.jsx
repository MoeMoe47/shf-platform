import React from "react";
import { fundingOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import FundingImpactTable from "@/components/lordOutcomes/tables/FundingImpactTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";
import { buildFundingDecisionBriefModel, buildFundingDecisionBriefRows, fundingBriefStatusClass } from "@/shared/funding/fundingDecisionBriefModel.js";


const FUNDING_DECISION_DEMO_ENTITIES = [
  {
    id: "program_workforce_training",
    name: "Workforce Training",
    type: "program",
    fundingAmount: 85000,
    outcomes: [
      { status: "verified", evidenceStatus: "verified", confidenceScore: 94, count: 42, cost: 84000 },
      { status: "pending", evidenceStatus: "in_review", confidenceScore: 66, count: 8, cost: 12000 },
    ],
  },
  {
    id: "program_reentry_support",
    name: "Reentry Support",
    type: "program",
    fundingAmount: 72000,
    outcomes: [
      { status: "verified", evidenceStatus: "certified", confidenceScore: 96, count: 29, cost: 58000 },
      { status: "verified", evidenceStatus: "verified", confidenceScore: 91, count: 7, cost: 10000 },
    ],
  },
  {
    id: "program_hub_referral",
    name: "Hub Referral Support",
    type: "program",
    fundingAmount: 145000,
    outcomes: [
      { status: "verified", evidenceStatus: "verified", confidenceScore: 88, count: 31, cost: 93000 },
      { status: "weak", evidenceStatus: "insufficient_evidence", confidenceScore: 38, count: 12, cost: 24000 },
    ],
  },
];

function FundingDecisionBriefSurface() {
  const outcomes = FUNDING_DECISION_DEMO_ENTITIES.flatMap((entity) => entity.outcomes);

  const brief = buildFundingDecisionBriefModel({
    source: "funding_impact_page",
    audience: "leadership",
    outcomes,
    programs: FUNDING_DECISION_DEMO_ENTITIES,
    comparisonEntities: FUNDING_DECISION_DEMO_ENTITIES,
  });

  const rows = buildFundingDecisionBriefRows(brief);

  return (
    <section className={["lo-fundingBrief", fundingBriefStatusClass(brief.briefStatus)].join(" ")}>
      <div className="lo-fundingBrief__header">
        <div>
          <p className="lo-fundingBrief__eyebrow">Funding Decision Brief V1</p>
          <h2>{brief.decisionLabel}</h2>
          <span>{brief.executiveSummary}</span>
        </div>

        <div className="lo-fundingBrief__score">
          <small>Decision Confidence</small>
          <strong>{brief.confidence}%</strong>
          <em>{brief.metrics.fundingReadinessLabel}</em>
        </div>
      </div>

      <div className="lo-fundingBrief__decisionReason">
        <strong>Decision reason</strong>
        <p>{brief.decisionReason}</p>
      </div>

      <div className="lo-fundingBrief__grid">
        {rows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="lo-fundingBrief__sections">
        <article>
          <strong>Evidence basis</strong>
          <ul>
            {brief.evidenceBasis.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <strong>Risk notes</strong>
          <ul>
            {brief.riskNotes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article>
          <strong>Recommended actions</strong>
          <ul>
            {brief.recommendedActions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="lo-fundingBrief__leaders">
        <div>
          <span>Best scale candidate</span>
          <strong>{brief.leaders.bestScaleCandidate?.label || "—"}</strong>
        </div>
        <div>
          <span>Underfunded high performer</span>
          <strong>{brief.leaders.underfundedHighPerformer?.label || "—"}</strong>
        </div>
        <div>
          <span>Lowest cost / verified outcome</span>
          <strong>{brief.leaders.lowestCostPerVerifiedOutcome?.label || "—"}</strong>
        </div>
        <div>
          <span>Evidence risk</span>
          <strong>{brief.leaders.weakestEvidenceRisk?.label || "—"}</strong>
        </div>
      </div>
    </section>
  );
}


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

      <FundingDecisionBriefSurface />

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          <FundingImpactTable rows={fundingOutcomes} />
        </div>
      </section>
    </div>
  );
}
