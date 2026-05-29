import useAuth from "../../../auth/useAuth";
import React, { useEffect, useMemo, useState } from "react";
import { evaluateReportingExportReadiness } from "./reporting-readiness";
import ExportReadinessCard from "./ExportReadinessCard.jsx";
import { recordExportAuditTrail } from "./export-audit-trail";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";
import { generateAnalystMemoExport } from "./reporting-actions";
import { buildReportingTraceRouteMap } from "./reporting-trace-routes";
import { buildReportingTraceRecord, getReportingTraceRows } from "./reporting-trace";
import { findBridgeLinkByVerificationRecordId } from "./bridge-record-links";
import {
  deriveBridgeWorkflowReadiness,
  getBridgeWorkflowState,
} from "./bridge-workflow-store";
import { fetchOracleTruth } from "./oracle-backend-adapter";
import { buildAnalystContext } from "./analyst/analyst-context-builder";
import DecisionBand from "@/components/system/DecisionBand";
import InterpretationGrid from "@/components/system/InterpretationGrid";
import ProofSection from "@/components/system/ProofSection";
import ActionBar from "@/components/system/ActionBar";
import { getOracleMemoRecommendation, buildOracleMemoSummary } from "./analyst/oracle-memo-adapter";
import { buildFundingDecisionBriefModel, buildFundingDecisionBriefRows, fundingBriefStatusClass } from "@/shared/funding/fundingDecisionBriefModel.js";
import { SHS_FEEDBACK_EVENT_TYPES, buildFeedbackEvent, buildAdaptiveFeedbackModel, buildFeedbackSummaryRows, feedbackLearningStatusClass } from "@/shared/feedback/feedbackEventModel.js";

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "ready" ||
    normalized === "certified" ||
    normalized === "verified" ||
    normalized === "resolved" ||
    normalized === "funder_ready" ||
    normalized === "leadership_ready" ||
    normalized === "public_ready"
      ? "reporting-command__badge reporting-command__badge--ready"
      : "reporting-command__badge reporting-command__badge--pending";

  return <span className={cls}>{String(status).toUpperCase()}</span>;
}

function buildAudienceMemoSections({ oracleTruth, analystContext, audience }) {
  if (!oracleTruth) {
    return [
      {
        title: "Key Findings",
        detail: "No certified Oracle truth package is currently available for memo generation.",
      },
      {
        title: "Readiness Blockers",
        detail: "Memo output should be treated as provisional until Oracle truth is available.",
      },
      {
        title: "Recommended Actions",
        detail: "Refresh Oracle state and verify the case before publication or downstream use.",
      },
      {
        title: "Interpretation Layer",
        detail: "Analyst interpretation is deferred because the certified truth layer is unavailable.",
      },
    ];
  }

  const unresolvedCount = oracleTruth.unresolvedItems?.length || 0;
  const contradictionState = oracleTruth.contradictionStatus || "none";
  const readinessState = oracleTruth.readinessStatus || "not_ready";
  const confidenceText = `${oracleTruth.confidenceScore} (${oracleTruth.confidenceBand})`;

  const blockerText =
    unresolvedCount > 0
      ? `Open blockers remain: ${oracleTruth.unresolvedItems.join(", ")}.`
      : contradictionState !== "none" && contradictionState !== "resolved"
      ? `Contradiction state is ${contradictionState}, which limits publication and should be resolved before broader use.`
      : `No active blockers are present. Oracle currently reports zero unresolved items and no active contradiction state.`;

  const baseFindings =
    audience === "executive"
      ? `The case is currently ${oracleTruth.truthStatus} with confidence ${confidenceText}. Readiness is ${readinessState}, which indicates the current decision posture for leadership review.`
      : audience === "funder"
      ? `The case is currently ${oracleTruth.truthStatus} with confidence ${confidenceText}. Readiness is ${readinessState}, supporting downstream institutional and funding-oriented use when policy conditions allow.`
      : audience === "public_safe"
      ? `The system currently classifies this case as ${oracleTruth.truthStatus} with a ${oracleTruth.confidenceBand} confidence level.`
      : `This case has reached ${oracleTruth.truthStatus} status with confidence ${confidenceText}, supported by ${oracleTruth.verificationStatus} inputs and contradiction state ${contradictionState}. Readiness is currently ${readinessState}.`;

  const interpretation =
    audience === "executive"
      ? `The current state indicates that system risk is ${analystContext.riskLevel}. This matters because readiness has moved to ${readinessState}, shaping whether the case should proceed, pause, or stay under observation.`
      : audience === "funder"
      ? `The current truth package suggests ${analystContext.riskLevel} operational risk. This matters because confidence, readiness, and contradiction state directly affect whether the case is suitable for funder-facing interpretation.`
      : audience === "public_safe"
      ? `The system view suggests ${analystContext.riskLevel} risk and recommends continued monitored handling.`
      : `The transition to ${oracleTruth.truthStatus} is driven by current verification and contradiction conditions. This matters because the readiness state ${readinessState} determines whether reporting, escalation, or continued monitoring is appropriate. Analyst risk is currently ${analystContext.riskLevel}.`;

  return [
    {
      title: "Key Findings",
      detail: baseFindings,
    },
    {
      title: "Readiness Blockers",
      detail: blockerText,
    },
    {
      title: "Recommended Actions",
      detail: oracleTruth.recommendedNextAction || "Review the case before downstream action.",
    },
    {
      title: "Interpretation Layer",
      detail: interpretation,
    },
  ];
}


const ANALYST_MEMO_FUNDING_DECISION_ENTITIES = [
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


const ANALYST_ADAPTIVE_FEEDBACK_EVENTS = [
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

function AdaptiveFeedbackAnalystMemoBridge() {
  const model = buildAdaptiveFeedbackModel({
    source: "analyst_memo_feedback_bridge",
    events: ANALYST_ADAPTIVE_FEEDBACK_EVENTS,
  });

  const rows = buildFeedbackSummaryRows(model);

  return (
    <article
      className={[
        "reporting-command__card",
        "adaptive-feedback-analyst-memo-bridge",
        feedbackLearningStatusClass(model.learningStatus),
      ].join(" ")}
      data-export-bridge="adaptive-feedback-analyst-memo"
    >
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Adaptive Feedback Intelligence</p>
          <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
            {model.learningLabel}
          </h3>
        </div>
        <StatusBadge status={model.learningStatus === "strong" || model.learningStatus === "ready" ? "ready" : "pending"} />
      </div>

      <DecisionBand
        summary={`Feedback score ${model.metrics.averageFeedbackScore}% | Acceptance ${model.metrics.acceptanceRate}% | Completion ${model.metrics.completionRate}% | Reversal ${model.metrics.reversalRate}%`}
      />

      <p className="reporting-command__summary" style={{ fontSize: 14, lineHeight: 1.65 }}>
        {model.recommendedNextAction}
      </p>

      <div
        className="reporting-command__stats"
        style={{ padding: 0, background: "transparent", border: "none", boxShadow: "none" }}
      >
        {rows.map(([label, value]) => (
          <article className="reporting-command__stat" key={label}>
            <span className="reporting-command__stat-label">{label}</span>
            <strong className="reporting-command__stat-value">{value}</strong>
          </article>
        ))}
      </div>

      <div
        className="reporting-command__grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
      >
        {model.learningSignals.slice(0, 3).map((signal) => (
          <MemoSectionCard
            key={signal.eventId}
            title={signal.decisionLabel || signal.recommendationLabel || signal.entityId}
            detail={`Event: ${signal.eventType}. Outcome: ${signal.outcome}. Status: ${signal.outcomeStatus}. Feedback score: ${signal.feedbackScore}%.`}
          />
        ))}
      </div>

      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(125, 211, 252, 0.18)",
          background: "rgba(14, 165, 233, 0.08)",
          color: "rgba(224, 242, 254, 0.94)",
          lineHeight: 1.55,
        }}
      >
        <strong style={{ display: "block", marginBottom: 5 }}>Analyst learning note</strong>
        <span>
          High-scoring completed feedback should increase confidence in similar future recommendations.
          Rejected, reversed, or blocked feedback should trigger analyst review before SHS promotes the same pattern again.
        </span>
      </div>
    </article>
  );
}


function FundingDecisionAnalystMemoBridge() {
  const outcomes = ANALYST_MEMO_FUNDING_DECISION_ENTITIES.flatMap((entity) => entity.outcomes);

  const brief = buildFundingDecisionBriefModel({
    source: "analyst_memo_export_panel",
    audience: "analyst",
    outcomes,
    programs: ANALYST_MEMO_FUNDING_DECISION_ENTITIES,
    comparisonEntities: ANALYST_MEMO_FUNDING_DECISION_ENTITIES,
  });

  const rows = buildFundingDecisionBriefRows(brief);

  return (
    <article
      className={[
        "reporting-command__card",
        "funding-brief-analyst-memo-bridge",
        fundingBriefStatusClass(brief.briefStatus),
      ].join(" ")}
      data-export-bridge="funding-decision-analyst-memo"
    >
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Funding Decision Intelligence</p>
          <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
            {brief.decisionLabel}
          </h3>
        </div>
        <StatusBadge status={brief.briefStatus === "scale" || brief.briefStatus === "ready" ? "ready" : "pending"} />
      </div>

      <DecisionBand
        summary={`${brief.decisionLabel} | ${brief.confidence}% Confidence | ${brief.metrics.fundingReadinessLabel} | Cost / Verified Outcome ${rows.find(([label]) => label === "Cost / Verified Outcome")?.[1] || "—"}`}
      />

      <p className="reporting-command__summary" style={{ fontSize: 14, lineHeight: 1.65 }}>
        {brief.executiveSummary}
      </p>

      <div
        style={{
          padding: "12px 14px",
          borderRadius: 14,
          border: "1px solid rgba(125, 211, 252, 0.18)",
          background: "rgba(14, 165, 233, 0.08)",
          color: "rgba(224, 242, 254, 0.94)",
          lineHeight: 1.55,
        }}
      >
        <strong style={{ display: "block", marginBottom: 5 }}>Analyst interpretation</strong>
        <span>{brief.decisionReason}</span>
      </div>

      <div
        className="reporting-command__stats"
        style={{ padding: 0, background: "transparent", border: "none", boxShadow: "none" }}
      >
        {rows.slice(0, 8).map(([label, value]) => (
          <article className="reporting-command__stat" key={label}>
            <span className="reporting-command__stat-label">{label}</span>
            <strong className="reporting-command__stat-value">{value}</strong>
          </article>
        ))}
      </div>

      <div
        className="reporting-command__grid"
        style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}
      >
        <MemoSectionCard
          title="Funding Evidence Basis"
          detail={brief.evidenceBasis.slice(0, 4).join(" ")}
        />

        <MemoSectionCard
          title="Funding Risk Notes"
          detail={brief.riskNotes.slice(0, 4).join(" ")}
        />

        <MemoSectionCard
          title="Funding Recommended Actions"
          detail={brief.recommendedActions.slice(0, 4).join(" ")}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {[
          ["Best Scale Candidate", brief.leaders.bestScaleCandidate?.label || "—"],
          ["Underfunded High Performer", brief.leaders.underfundedHighPerformer?.label || "—"],
          ["Highest Funding Readiness", brief.leaders.highestFundingReadiness?.label || "—"],
          ["Evidence Risk", brief.leaders.weakestEvidenceRisk?.label || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(148, 163, 184, 0.14)",
              background: "rgba(2, 8, 18, 0.42)",
            }}
          >
            <span
              style={{
                display: "block",
                marginBottom: 6,
                color: "rgba(148, 163, 184, 0.9)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <strong style={{ color: "rgba(248, 250, 252, 0.98)" }}>{value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}


function MemoSectionCard({ title, detail }) {
  return (
    <article className="reporting-command__card">
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Section</p>
          <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
            {title}
          </h3>
        </div>
      </div>

      <p className="reporting-command__summary" style={{ fontSize: 15, lineHeight: 1.7 }}>
        {detail}
      </p>
    </article>
  );
}

export default function AnalystMemoExportPanel() {
  const auth = useAuth();
  const [flash, setFlash] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [oracleTruth, setOracleTruth] = useState(null);
  const [oracleError, setOracleError] = useState("");
  const [audienceMode, setAudienceMode] = useState("analyst");

  const bridgeState = useMemo(() => getBridgeWorkflowState(), [refreshKey]);
  const bridgeReadiness = useMemo(
    () => deriveBridgeWorkflowReadiness(bridgeState),
    [bridgeState]
  );

  useEffect(() => {
    let isActive = true;
    const entityId = bridgeState.caseId || "test_case_001";

    setOracleError("");

    fetchOracleTruth(entityId)
      .then((data) => {
        if (!isActive) return;
        setOracleTruth(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setOracleTruth(null);
        setOracleError(err instanceof Error ? err.message : "Oracle unavailable");
      });

    return () => {
      isActive = false;
    };
  }, [bridgeState.caseId, refreshKey]);

  const analystContext = useMemo(() => {
    return buildAnalystContext(oracleTruth);
  }, [oracleTruth]);

  const decisionSummary = useMemo(() => {
    if (!oracleTruth) return buildOracleMemoSummary(oracleTruth);

    const readinessLabel = String(oracleTruth.readinessStatus || "not_ready")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const contradictionLabel =
      oracleTruth.contradictionStatus === "none"
        ? "No Contradictions"
        : `Contradiction: ${oracleTruth.contradictionStatus}`;

    return [
      oracleTruth.truthStatus === "certified" ? "Certified" : oracleTruth.truthStatus,
      `${oracleTruth.confidenceScore} ${oracleTruth.confidenceBand} Confidence`,
      contradictionLabel,
      readinessLabel,
      (analystContext?.recommendation || "Review before action")
        .replace("Proceed with authorized downstream use.", "Proceed")
        .replace("Proceed with authorized downstream use", "Proceed"),
    ].join(" | ");
  }, [oracleTruth, analystContext]);

  const link = useMemo(() => {
    return (
      findBridgeLinkByVerificationRecordId("ver_hub_case_002") || {
        sourceCaseId: bridgeState.caseId || "hub_case_demo_001",
        verificationRecordId: "ver_hub_case_demo_001",
        bridgeTraceId: "live_bridge_hub_case_demo_001",
        reportArtifactId: "rep_analyst_memo_demo_001",
      }
    );
  }, [bridgeState]);

  const readinessInput = useMemo(
    () => ({
      exportKind: "analyst_memo_export",
      bridgeReadiness,
      verificationState: bridgeState.verificationState,
      missingFields: [],
      sourceToReportTraceCoverage: bridgeState.sourceToReportTraceCoverage,
      publicationMode: bridgeState.publicationMode || "admin_internal",
      trustEnvelopePresent: true,
    }),
    [bridgeReadiness, bridgeState]
  );

  const readiness = useMemo(
    () => evaluateReportingExportReadiness(readinessInput),
    [readinessInput]
  );


  const canGenerateExport =
    readiness.allowedActions.generate &&
    auth.hasPermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT);

  const traceTargets = {
    sourceObjectId: link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001",
    bridgeTraceId: link.bridgeTraceId || "live_bridge_hub_case_demo_001",
    verificationRecordId: link.verificationRecordId || "ver_hub_case_demo_001",
    reportArtifactId: link.reportArtifactId || "rep_analyst_memo_demo_001",
    canonicalEntityId: link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001",
    lineageId: `lineage_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}_v1`,
    oracleTraceId: oracleTruth?.traceId || `trace_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}`,
    trustEnvelopeTraceId: oracleTruth?.trustEnvelope?.traceId || oracleTruth?.traceId || `trace_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}`,
    publicationMode: oracleTruth?.trustEnvelope?.publicationMode || bridgeState.publicationMode || "internal",
  };

  const traceRecord = buildReportingTraceRecord(
    "analyst_memo_export",
    {
      ...traceTargets,
      traceCoverageStatus: bridgeState.sourceToReportTraceCoverage ? "complete" : "missing",
    }
  );

  const traceRows = getReportingTraceRows(
    "analyst_memo_export",
    traceRecord
  );

  const traceRoutes = buildReportingTraceRouteMap(traceRecord);


  const memoSections = useMemo(() => {
    return buildAudienceMemoSections({
      oracleTruth,
      analystContext,
      audience: audienceMode,
    });
  }, [oracleTruth, analystContext, audienceMode]);

  const trustEnvelope = oracleTruth?.trustEnvelope || null;

  function handleGenerate() {
    if (!canGenerateExport) {
      recordExportAuditTrail({
        exportKind: "analyst_memo_export",
        artifactId: traceTargets.reportArtifactId,
        publicationMode: bridgeState.publicationMode || "admin_internal",
        requestedBy: "user_admin_001",
        readiness,
        traceRecord,
        oracleTruth: typeof oracleTruth !== "undefined" ? oracleTruth : null,
        oracleGate: typeof oracleGate !== "undefined" ? oracleGate : null,
        canGenerateExport,
        status: "blocked",
        source: "analyst_memo_export_panel",
      });
      return;
    }

    const result = generateAnalystMemoExport({
      publicationMode: bridgeState.publicationMode || "admin_internal",
      relatedEntityIds: [
        traceTargets.sourceObjectId,
        traceTargets.bridgeTraceId,
        traceTargets.verificationRecordId,
        traceTargets.reportArtifactId,
      ],
      requestedBy: "user_admin_001",
    });

    recordExportAuditTrail({
      exportKind: "analyst_memo_export",
      artifactId: traceTargets.reportArtifactId,
      publicationMode: bridgeState.publicationMode || "admin_internal",
      requestedBy: "user_admin_001",
      readiness,
      traceRecord,
      oracleTruth: typeof oracleTruth !== "undefined" ? oracleTruth : null,
      oracleGate: typeof oracleGate !== "undefined" ? oracleGate : null,
      canGenerateExport,
      result,
      status: result?.status || "generated",
      source: "analyst_memo_export_panel",
    });

    setFlash(
      `Analyst memo export generated: ${result.exportId} | ${result.status.toUpperCase()} | ${result.createdAt}`
    );
  }

  function handleRefresh() {
    setRefreshKey((value) => value + 1);
    setFlash("Analyst memo panel refreshed from shared bridge workflow state and Oracle truth.");
  }

  return (
    <section className="reporting-command__card" style={{ gap: 18 }}>
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">PDF / JSON Export</p>
          <h2 className="reporting-command__card-title">Analyst Memo Export</h2>
        </div>
        <StatusBadge status={readiness.status} />
      </div>

      <DecisionBand summary={decisionSummary} />

      <p className="reporting-command__summary">
        Narrative memo surface for institutional interpretation, bridge findings, and readiness-based recommendations.
      </p>

      <FundingDecisionAnalystMemoBridge />

      <AdaptiveFeedbackAnalystMemoBridge />

      <ExportReadinessCard
        exportKind="analyst_memo_export"
        audience="Analyst / Internal"
        format="PDF / JSON"
        readiness={readiness}
        traceRecord={traceRecord}
        oracleTruth={typeof oracleTruth !== "undefined" ? oracleTruth : null}
        oracleGate={typeof oracleGate !== "undefined" ? oracleGate : null}
        canGenerateExport={canGenerateExport}
      />

      {flash ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(70, 180, 110, 0.30)",
            background: "rgba(70, 180, 110, 0.12)",
            color: "rgba(187, 247, 208, 0.98)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          {flash}
        </div>
      ) : null}

      {!auth.hasPermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT) ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(248, 113, 113, 0.24)",
            background: "rgba(127, 29, 29, 0.16)",
            color: "rgba(254, 202, 202, 0.96)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Missing permission: reports.export
        </div>
      ) : null}

      {readiness.reasons.length ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(245, 158, 11, 0.22)",
            background: "rgba(120, 53, 15, 0.16)",
            color: "rgba(253, 230, 138, 0.96)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Blocked by: {readiness.reasons.join(", ")}
          {readiness.missingFields.length
            ? ` | Missing: ${readiness.missingFields.join(", ")}`
            : ""}
        </div>
      ) : null}

      <div
        className="reporting-command__stats"
        style={{ padding: 0, background: "transparent", border: "none", boxShadow: "none" }}
      >
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Sections</span>
          <strong className="reporting-command__stat-value">{memoSections.length}</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Audience</span>
          <strong className="reporting-command__stat-value">
            {audienceMode === "analyst"
              ? "Analyst / Internal"
              : audienceMode === "executive"
              ? "Executive"
              : audienceMode === "funder"
              ? "Funder"
              : "Public Safe"}
          </strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Formats</span>
          <strong className="reporting-command__stat-value">PDF / JSON</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Readiness</span>
          <strong className="reporting-command__stat-value">
            {readiness.ready ? "Ready" : "Pending"}
          </strong>
        </article>
      </div>

      <article className="reporting-command__card">
        <div className="reporting-command__card-top">
          <div>
            <p className="reporting-command__card-kicker">Adaptive Audience</p>
            <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
              Memo Audience Mode
            </h3>
          </div>
          <StatusBadge status="ready" />
        </div>

        <div className="reporting-command__actions">
          <button type="button" onClick={() => setAudienceMode("analyst")}>
            Analyst
          </button>
          <button type="button" onClick={() => setAudienceMode("executive")}>
            Executive
          </button>
          <button type="button" onClick={() => setAudienceMode("funder")}>
            Funder
          </button>
          <button type="button" onClick={() => setAudienceMode("public_safe")}>
            Public Safe
          </button>
        </div>

        {oracleError ? (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(239, 68, 68, 0.22)",
              background: "rgba(127, 29, 29, 0.14)",
              color: "rgba(254, 202, 202, 0.98)",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {oracleError}
          </div>
        ) : null}
      </article>

      <InterpretationGrid>
        {memoSections.map((section) => (
          <MemoSectionCard
            key={section.title}
            title={section.title}
            detail={section.detail}
          />
        ))}
      </InterpretationGrid>

      <ProofSection title="Verified Evidence Chain">
        <article
          className="reporting-command__card"
          style={{
            marginTop: 10,
            border: "1px solid rgba(59,130,246,0.24)",
            background: "linear-gradient(180deg, rgba(4,10,20,0.98), rgba(3,8,16,0.995))",
            boxShadow: "0 18px 40px rgba(2, 6, 23, 0.20)",
          }}
        >
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Verified Evidence Chain</p>
              <h3 className="reporting-command__card-title" style={{ fontSize: 24 }}>
                Source-to-Report Proof Register
              </h3>
            </div>
            <StatusBadge status={oracleTruth?.truthStatus || "pending"} />
          </div>

          <p
            className="reporting-command__summary"
            style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(219, 234, 254, 0.96)", maxWidth: "1100px" }}
          >
            This evidence chain shows why the memo can be trusted. Each record below ties the memo
            to the source object, bridge process, verification path, and final report artifact.
          </p>

          <div style={{ display: "grid", gap: 12, marginTop: 8 }}>
            {traceRows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "180px 1fr",
                  gap: 16,
                  alignItems: "start",
                  padding: "18px 0",
                  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(148, 163, 184, 0.86)",
                  }}
                >
                  {row.label}
                </span>
                <strong
                  style={{
                    fontSize: 17,
                    lineHeight: 1.65,
                    color: "rgba(241, 245, 249, 0.98)",
                    fontWeight: 700,
                  }}
                >
                  {row.value}
                </strong>
              </div>
            ))}
          </div>

          <div className="reporting-command__actions">
            <a className="reporting-command__linkbtn" href={traceRoutes.sourceObject.href}>
              Open Source Object
            </a>
            <a className="reporting-command__linkbtn" href={traceRoutes.bridgeTrace.href}>
              Open Bridge Trace
            </a>
            <a className="reporting-command__linkbtn" href={traceRoutes.verificationRecord.href}>
              Open Verification Record
            </a>
            <a className="reporting-command__linkbtn" href={traceRoutes.reportArtifact.href}>
              Open Report Artifact
            </a>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 14,
              border: "1px solid rgba(34,197,94,0.20)",
              background: "rgba(10,18,33,0.72)",
            }}
          >
            <div className="reporting-command__card-top" style={{ marginBottom: 8 }}>
              <div>
                <p className="reporting-command__card-kicker">Trust Envelope</p>
                <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
                  Certified Publication Basis
                </h3>
              </div>
              <StatusBadge status={trustEnvelope?.truthStatus || "pending"} />
            </div>

            {trustEnvelope ? (
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  { label: "Truth Status", value: trustEnvelope.truthStatus },
                  { label: "Confidence", value: `${trustEnvelope.confidenceScore} (${trustEnvelope.confidenceBand})` },
                  { label: "Verification State", value: trustEnvelope.verificationStatus },
                  { label: "Contradiction State", value: trustEnvelope.contradictionStatus },
                  { label: "Readiness State", value: trustEnvelope.readinessStatus },
                  { label: "Publication Mode", value: trustEnvelope.publicationMode },
                  { label: "Trace ID", value: trustEnvelope.traceId },
                  { label: "Last Refresh", value: trustEnvelope.lastUpdatedAt },
                  { label: "Unresolved Items", value: String(trustEnvelope.unresolvedItemsCount) },
                  {
                    label: "Warnings",
                    value: (trustEnvelope.warnings || []).length
                      ? trustEnvelope.warnings.join(", ")
                      : "none",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: 16,
                      alignItems: "start",
                      padding: "14px 0",
                      borderTop: "1px solid rgba(148, 163, 184, 0.12)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "rgba(148, 163, 184, 0.86)",
                      }}
                    >
                      {row.label}
                    </span>
                    <strong
                      style={{
                        fontSize: 15,
                        lineHeight: 1.55,
                        color: "rgba(241, 245, 249, 0.98)",
                        fontWeight: 700,
                      }}
                    >
                      {row.value}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="reporting-command__summary">
                Trust envelope unavailable.
              </p>
            )}

            <div
              style={{
                marginTop: 18,
                padding: "14px 16px",
                borderRadius: 12,
                border: "1px solid rgba(34,197,94,0.22)",
                background: "rgba(34,197,94,0.08)",
                color: "rgba(220, 252, 231, 0.98)",
                fontSize: 14,
                lineHeight: 1.7,
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              Verified by Oracle • {oracleTruth?.confidenceBand || "pending"} confidence • {oracleTruth?.contradictionStatus === "none" ? "no contradictions detected" : `contradiction state: ${oracleTruth?.contradictionStatus || "pending"}`} • approved for {String(oracleTruth?.readinessStatus || "pending").replace(/_/g, " ")} use
            </div>
          </div>
        </article>
      </ProofSection>

      <ActionBar>
        <button type="button" onClick={handleRefresh}>
          Refresh from Workflow
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerateExport}
          style={
            !canGenerateExport
              ? { opacity: 0.45, cursor: "not-allowed" }
              : undefined
          }
        >
          Generate Memo Export
        </button>
      </ActionBar>
    </section>
  );
}
