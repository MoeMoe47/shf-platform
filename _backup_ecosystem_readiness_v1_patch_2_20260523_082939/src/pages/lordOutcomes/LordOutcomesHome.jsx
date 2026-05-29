import React from "react";
import Hero from "@/components/lordOutcomes/ui/Hero.jsx";
import MetricTile from "@/components/lordOutcomes/ui/MetricTile.jsx";
import "../../styles/lordOutcomes.css";


const IMPACT_INTELLIGENCE_DEMO_OUTCOMES = [
  {
    id: "impact_outcome_training_completion",
    status: "verified",
    evidenceStatus: "verified",
    confidenceScore: 94,
    count: 64,
    cost: 128000,
    program: "Workforce Training",
    partner: "SHF Workforce Lane",
  },
  {
    id: "impact_outcome_job_placement",
    status: "verified",
    evidenceStatus: "certified",
    confidenceScore: 91,
    count: 28,
    cost: 84000,
    program: "Career Placement",
    partner: "Employer Network",
  },
  {
    id: "impact_outcome_supportive_referral",
    status: "pending",
    evidenceStatus: "in_review",
    confidenceScore: 67,
    count: 19,
    cost: 28500,
    program: "Hub Referral Support",
    partner: "Hub Partner Network",
  },
  {
    id: "impact_outcome_followup_weak",
    status: "weak",
    evidenceStatus: "insufficient_evidence",
    confidenceScore: 42,
    count: 7,
    cost: 10500,
    program: "Follow-up Services",
    partner: "Pending Evidence Partner",
  },
];


const IMPACT_COMPARISON_DEMO_ENTITIES = [
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
    id: "program_hub_referral",
    name: "Hub Referral Support",
    type: "program",
    fundingAmount: 145000,
    outcomes: [
      { status: "verified", evidenceStatus: "verified", confidenceScore: 88, count: 31, cost: 93000 },
      { status: "weak", evidenceStatus: "insufficient_evidence", confidenceScore: 38, count: 12, cost: 24000 },
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
];

function ImpactComparisonSurface() {
  const model = buildImpactComparisonModel({
    source: "lord_outcomes_home",
    comparisonType: "program",
    entities: IMPACT_COMPARISON_DEMO_ENTITIES,
  });

  const leaderRows = buildImpactComparisonLeaderRows(model);
  const rankingRows = model.rankings.byImpactEfficiency.slice(0, 5);

  return (
    <section className={["lo-impactComparison", impactComparisonStatusClass(model.comparisonStatus)].join(" ")}>
      <div className="lo-impactComparison__header">
        <div>
          <p className="lo-impactComparison__eyebrow">Impact Comparison Engine</p>
          <h2>{model.comparisonLabel}</h2>
          <span>{model.recommendedNextAction}</span>
        </div>

        <div className="lo-impactComparison__score">
          <small>Entities Compared</small>
          <strong>{model.summary.entityCount}</strong>
          <em>{model.summary.underfundedHighPerformerCount} underfunded high performers</em>
        </div>
      </div>

      <div className="lo-impactComparison__leaders">
        {leaderRows.map((row) => (
          <article key={row.label}>
            <span>{row.label}</span>
            <strong>{row.entity}</strong>
            <em>{row.value}</em>
          </article>
        ))}
      </div>

      <div className="lo-impactComparison__ranking">
        <div className="lo-impactComparison__rankingHeader">
          <strong>Program impact ranking</strong>
          <span>Ranked by impact efficiency, evidence strength, funding readiness, and weak-evidence risk.</span>
        </div>

        <div className="lo-impactComparison__table">
          {rankingRows.map((row) => (
            <article key={row.id}>
              <div>
                <span>#{row.rank}</span>
                <strong>{row.label}</strong>
                <em>{row.comparisonLabel}</em>
              </div>

              <dl>
                <div>
                  <dt>Verified</dt>
                  <dd>{row.metrics.verificationRate}%</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>{row.metrics.evidenceStrengthScore}%</dd>
                </div>
                <div>
                  <dt>Cost / Verified</dt>
                  <dd>${Number(row.metrics.costPerVerifiedOutcome || 0).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Funding Ready</dt>
                  <dd>{row.metrics.fundingReadinessScore}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="lo-impactComparison__decision">
        <div>
          <strong>Best scale candidate</strong>
          <p>
            {model.leaders.bestScaleCandidate?.label || "—"} — {model.leaders.bestScaleCandidate?.recommendations?.scaleRecommendation || "No scale candidate available."}
          </p>
        </div>

        <div>
          <strong>Evidence risk to review</strong>
          <p>
            {model.leaders.weakestEvidenceRisk?.label || "—"} has the highest weak-evidence risk at {model.leaders.weakestEvidenceRisk?.metrics?.weakEvidenceRate ?? 0}%.
          </p>
        </div>
      </div>
    </section>
  );
}


function ImpactIntelligenceScorecard() {
  const model = buildImpactMeasurementModel({
    source: "lord_outcomes_home",
    outcomes: IMPACT_INTELLIGENCE_DEMO_OUTCOMES,
    programs: [
      { id: "workforce_training" },
      { id: "career_placement" },
      { id: "hub_referral_support" },
    ],
    partners: [
      { id: "shf_workforce_lane" },
      { id: "employer_network" },
      { id: "hub_partner_network" },
    ],
  });

  const rows = buildImpactScorecardRows(model);

  return (
    <section className={["lo-impactScorecard", impactStatusClass(model.impactStatus)].join(" ")}>
      <div className="lo-impactScorecard__header">
        <div>
          <p className="lo-impactScorecard__eyebrow">Impact Intelligence V1</p>
          <h2>{model.impactLabel}</h2>
          <span>{model.recommendedNextAction}</span>
        </div>

        <div className="lo-impactScorecard__score">
          <small>Funding Readiness</small>
          <strong>{model.metrics.fundingReadinessScore}%</strong>
          <em>{model.metrics.fundingReadinessLabel}</em>
        </div>
      </div>

      <div className="lo-impactScorecard__grid">
        {rows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="lo-impactScorecard__decision">
        <div>
          <strong>Funding decision signal</strong>
          <p>{model.recommendations.fundingDecision}</p>
        </div>

        <div>
          <strong>Scale recommendation</strong>
          <p>{model.recommendations.scaleRecommendation}</p>
        </div>
      </div>

      {model.blockers.length ? (
        <div className="lo-impactScorecard__blockers">
          <strong>Active impact blockers</strong>
          <p>{model.blockers.join(", ")}</p>
        </div>
      ) : (
        <div className="lo-impactScorecard__clear">
          <strong>Measurement package active</strong>
          <p>
            Claimed, verified, pending, weak-evidence, cost, and funding-readiness metrics are now measured through one shared model.
          </p>
        </div>
      )}
    </section>
  );
}


export default function LordOutcomesHome(){
  return (
    <>
      <Hero
        title="Lord of Outcomes"
        subtitle="Regional outcome intelligence, funding performance, and pilot-ready metrics."
      />

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 18
      }}>
        <MetricTile label="Total Participants" value="12,480" />
        <MetricTile label="Programs Active" value="42" />
        <MetricTile label="Placements Verified" value="3,912" />
        <MetricTile label="Retention Rate" value="78%" />
        <MetricTile label="Funding Efficiency" value="$1.42 / $1" hint="ROI per dollar" />
        <MetricTile label="Pilots Running" value="7" />
      </div>
    </>
  );
}
