import React, { useMemo, useState } from "react";
import { fundingOutcomes } from "@/utils/lordOutcomes/mockOutcomesData.js";
import FundingImpactTable from "@/components/lordOutcomes/tables/FundingImpactTable.jsx";
import OutcomeFilterBar from "@/components/lordOutcomes/filters/OutcomeFilterBar.jsx";
import { buildFundingDecisionBriefModel, buildFundingDecisionBriefRows, fundingBriefStatusClass } from "@/shared/funding/fundingDecisionBriefModel.js";
import { SHS_FEEDBACK_EVENT_TYPES, buildFeedbackEvent, buildAdaptiveFeedbackModel, buildFeedbackSummaryRows, feedbackLearningStatusClass, appendFeedbackEventToStorage, readFeedbackEventsFromStorage } from "@/shared/feedback/feedbackEventModel.js";


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


const ADAPTIVE_FEEDBACK_DEMO_EVENTS = [
  buildFeedbackEvent({
    eventType: SHS_FEEDBACK_EVENT_TYPES.FUNDING_DECISION_ACCEPTED,
    entityId: "program_reentry_support",
    entityType: "program",
    decisionLabel: "Increase / Defend Funding",
    originalConfidence: 91,
    outcome: "successful",
    outcomeStatus: "complete",
    operatorRating: 5,
    notes: "Leadership accepted the funding defense recommendation.",
    actor: "leadership",
  }),
  buildFeedbackEvent({
    eventType: SHS_FEEDBACK_EVENT_TYPES.REFERRAL_COMPLETED,
    entityId: "referral_001",
    entityType: "referral",
    recommendationLabel: "Assign partner follow-up",
    originalConfidence: 84,
    outcome: "verified",
    outcomeStatus: "verified",
    operatorRating: 4,
    notes: "Referral completed and verified by partner workflow.",
    actor: "hub_operator",
  }),
  buildFeedbackEvent({
    eventType: SHS_FEEDBACK_EVENT_TYPES.EVIDENCE_STRENGTHENED,
    entityId: "program_workforce_training",
    entityType: "program",
    recommendationLabel: "Improve verification packet",
    originalConfidence: 76,
    outcome: "positive",
    outcomeStatus: "resolved",
    operatorRating: 4,
    notes: "Evidence package improved after review.",
    actor: "verification_team",
  }),
  buildFeedbackEvent({
    eventType: SHS_FEEDBACK_EVENT_TYPES.RECOMMENDATION_REJECTED,
    entityId: "program_hub_referral",
    entityType: "program",
    recommendationLabel: "Scale program",
    originalConfidence: 63,
    outcome: "mixed",
    outcomeStatus: "in_review",
    operatorRating: 2,
    notes: "Operator rejected scale recommendation pending stronger evidence.",
    actor: "analyst",
  }),
];

function AdaptiveFeedbackLearningSurface() {
  const [capturedEvents, setCapturedEvents] = useState(() => readFeedbackEventsFromStorage());

  const allEvents = useMemo(
    () => [...capturedEvents, ...ADAPTIVE_FEEDBACK_DEMO_EVENTS],
    [capturedEvents]
  );

  const model = useMemo(
    () =>
      buildAdaptiveFeedbackModel({
        source: "funding_impact_page",
        events: allEvents,
      }),
    [allEvents]
  );

  const rows = buildFeedbackSummaryRows(model);

  function captureFeedbackEvent(eventConfig) {
    const event = appendFeedbackEventToStorage(
      buildFeedbackEvent({
        source: "funding_impact_page_capture",
        actor: "operator",
        ...eventConfig,
      })
    );

    setCapturedEvents((current) => [event, ...current].slice(0, 250));
  }

  const captureActions = [
    {
      label: "Accept recommendation",
      eventType: SHS_FEEDBACK_EVENT_TYPES.RECOMMENDATION_ACCEPTED,
      entityId: "program_reentry_support",
      entityType: "program",
      recommendationLabel: "Scale / defend Reentry Support",
      outcome: "positive",
      outcomeStatus: "complete",
      operatorRating: 5,
      notes: "Operator accepted the SHS recommendation.",
    },
    {
      label: "Reject recommendation",
      eventType: SHS_FEEDBACK_EVENT_TYPES.RECOMMENDATION_REJECTED,
      entityId: "program_hub_referral",
      entityType: "program",
      recommendationLabel: "Scale Hub Referral Support",
      outcome: "mixed",
      outcomeStatus: "in_review",
      operatorRating: 2,
      notes: "Operator rejected the recommendation pending stronger evidence.",
    },
    {
      label: "Mark outcome verified",
      eventType: SHS_FEEDBACK_EVENT_TYPES.OUTCOME_VERIFIED_LATER,
      entityId: "outcome_verified_later_001",
      entityType: "outcome",
      recommendationLabel: "Verify delayed outcome",
      outcome: "verified",
      outcomeStatus: "verified",
      operatorRating: 4,
      notes: "Outcome was verified after the original recommendation.",
    },
    {
      label: "Mark referral completed",
      eventType: SHS_FEEDBACK_EVENT_TYPES.REFERRAL_COMPLETED,
      entityId: "referral_completed_001",
      entityType: "referral",
      recommendationLabel: "Complete partner referral",
      outcome: "successful",
      outcomeStatus: "complete",
      operatorRating: 4,
      notes: "Referral completed after partner action.",
    },
    {
      label: "Mark evidence strengthened",
      eventType: SHS_FEEDBACK_EVENT_TYPES.EVIDENCE_STRENGTHENED,
      entityId: "program_workforce_training",
      entityType: "program",
      recommendationLabel: "Strengthen evidence packet",
      outcome: "positive",
      outcomeStatus: "resolved",
      operatorRating: 4,
      notes: "Evidence package improved after analyst review.",
    },
  ];

  return (
    <section className={["lo-adaptiveFeedback", feedbackLearningStatusClass(model.learningStatus)].join(" ")}>
      <div className="lo-adaptiveFeedback__header">
        <div>
          <p className="lo-adaptiveFeedback__eyebrow">Adaptive Feedback Loop V1</p>
          <h2>{model.learningLabel}</h2>
          <span>{model.recommendedNextAction}</span>
        </div>

        <div className="lo-adaptiveFeedback__score">
          <small>Avg. Feedback Score</small>
          <strong>{model.metrics.averageFeedbackScore}%</strong>
          <em>{model.metrics.completionRate}% completion rate</em>
        </div>
      </div>

      <div className="lo-adaptiveFeedback__capture">
        <div>
          <strong>Capture feedback event</strong>
          <span>Record what happened after SHS made a recommendation or funding decision.</span>
        </div>

        <div className="lo-adaptiveFeedback__captureButtons">
          {captureActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => captureFeedbackEvent(action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      <div className="lo-adaptiveFeedback__grid">
        {rows.map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="lo-adaptiveFeedback__signals">
        <div className="lo-adaptiveFeedback__signalsHeader">
          <strong>Learning signals</strong>
          <span>Recommendation → Action → Result → Learning Signal</span>
        </div>

        <div className="lo-adaptiveFeedback__signalList">
          {model.learningSignals.slice(0, 6).map((signal) => (
            <article key={signal.eventId}>
              <div>
                <span>{signal.eventType}</span>
                <strong>{signal.decisionLabel || signal.recommendationLabel || signal.entityId}</strong>
                <em>{signal.entityId}</em>
              </div>

              <dl>
                <div>
                  <dt>Outcome</dt>
                  <dd>{signal.outcome}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{signal.outcomeStatus}</dd>
                </div>
                <div>
                  <dt>Score</dt>
                  <dd>{signal.feedbackScore}%</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="lo-adaptiveFeedback__decision">
        <div>
          <strong>What SHS learns</strong>
          <p>
            High-scoring completed events should strengthen future recommendation patterns. Rejected or in-review events should trigger analyst review before SHS promotes similar future recommendations.
          </p>
        </div>

        <div>
          <strong>Next learning action</strong>
          <p>{model.recommendedNextAction}</p>
        </div>
      </div>
    </section>
  );
}


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

      <AdaptiveFeedbackLearningSurface />

      <section className="db-grid">
        <div className="card card--pad wash wash--card">
          <FundingImpactTable rows={fundingOutcomes} />
        </div>
      </section>
    </div>
  );
}
