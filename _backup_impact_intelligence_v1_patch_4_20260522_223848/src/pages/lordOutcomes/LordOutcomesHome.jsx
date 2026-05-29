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
