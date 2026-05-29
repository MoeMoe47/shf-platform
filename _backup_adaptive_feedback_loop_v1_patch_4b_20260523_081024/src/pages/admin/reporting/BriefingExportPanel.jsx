import useAuth from "../../../auth/useAuth";
import React, { useMemo, useState } from "react";
import { evaluateReportingExportReadiness } from "./reporting-readiness";
import ExportReadinessCard from "./ExportReadinessCard.jsx";
import { recordExportAuditTrail } from "./export-audit-trail";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";
import { generateBriefingExport } from "./reporting-actions";
import { buildReportingTraceRouteMap } from "./reporting-trace-routes";
import { buildReportingTraceRecord, getReportingTraceRows } from "./reporting-trace";
import { buildFundingDecisionBriefModel, buildFundingDecisionBriefRows, fundingBriefStatusClass } from "@/shared/funding/fundingDecisionBriefModel.js";
import { findBridgeLinkBySourceCaseId } from "./bridge-record-links";
import {
import { SHS_FEEDBACK_EVENT_TYPES, buildFeedbackEvent, buildAdaptiveFeedbackModel, buildFeedbackSummaryRows, feedbackLearningStatusClass } from "@/shared/feedback/feedbackEventModel.js";
  deriveBridgeWorkflowReadiness,
  getBridgeWorkflowState,
} from "./bridge-workflow-store";

function StatusBadge({ status }) {
  const cls =
    status === "ready"
      ? "reporting-command__badge reporting-command__badge--ready"
      : "reporting-command__badge reporting-command__badge--pending";

  return <span className={cls}>{String(status).toUpperCase()}</span>;
}


const BRIEFING_FUNDING_DECISION_ENTITIES = [
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


const BRIEFING_ADAPTIVE_FEEDBACK_EVENTS = [
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

function AdaptiveFeedbackBriefingBridge() {
  const model = buildAdaptiveFeedbackModel({
    source: "briefing_export_feedback_bridge",
    events: BRIEFING_ADAPTIVE_FEEDBACK_EVENTS,
  });

  const rows = buildFeedbackSummaryRows(model);

  return (
    <article
      className={[
        "reporting-command__card",
        "adaptive-feedback-briefing-bridge",
        feedbackLearningStatusClass(model.learningStatus),
      ].join(" ")}
      data-export-bridge="adaptive-feedback-briefing"
    >
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Adaptive Feedback Loop</p>
          <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
            {model.learningLabel}
          </h3>
        </div>
        <StatusBadge status={model.learningStatus === "strong" || model.learningStatus === "ready" ? "ready" : "pending"} />
      </div>

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
          <article className="reporting-command__card" key={signal.eventId}>
            <div className="reporting-command__card-top">
              <div>
                <p className="reporting-command__card-kicker">{signal.eventType}</p>
                <h4 className="reporting-command__card-title" style={{ fontSize: 18 }}>
                  {signal.decisionLabel || signal.recommendationLabel || signal.entityId}
                </h4>
              </div>
            </div>

            <p className="reporting-command__summary" style={{ fontSize: 13, lineHeight: 1.6 }}>
              Outcome: {signal.outcome} · Status: {signal.outcomeStatus} · Feedback score: {signal.feedbackScore}%
            </p>
          </article>
        ))}
      </div>
    </article>
  );
}


function FundingDecisionBriefExportBridge() {
  const outcomes = BRIEFING_FUNDING_DECISION_ENTITIES.flatMap((entity) => entity.outcomes);

  const brief = buildFundingDecisionBriefModel({
    source: "briefing_export_panel",
    audience: "leadership",
    outcomes,
    programs: BRIEFING_FUNDING_DECISION_ENTITIES,
    comparisonEntities: BRIEFING_FUNDING_DECISION_ENTITIES,
  });

  const rows = buildFundingDecisionBriefRows(brief);

  return (
    <article
      className={[
        "reporting-command__card",
        "funding-brief-export-bridge",
        fundingBriefStatusClass(brief.briefStatus),
      ].join(" ")}
      data-export-bridge="funding-decision-brief"
    >
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Funding Decision Brief</p>
          <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
            {brief.decisionLabel}
          </h3>
        </div>
        <StatusBadge status={brief.briefStatus === "scale" || brief.briefStatus === "ready" ? "ready" : "pending"} />
      </div>

      <p className="reporting-command__summary" style={{ fontSize: 14, lineHeight: 1.65 }}>
        {brief.executiveSummary}
      </p>

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
        <article className="reporting-command__card">
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Basis</p>
              <h4 className="reporting-command__card-title" style={{ fontSize: 18 }}>
                Evidence Basis
              </h4>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(203, 213, 225, 0.9)", lineHeight: 1.6 }}>
            {brief.evidenceBasis.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="reporting-command__card">
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Risk</p>
              <h4 className="reporting-command__card-title" style={{ fontSize: 18 }}>
                Risk Notes
              </h4>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(203, 213, 225, 0.9)", lineHeight: 1.6 }}>
            {brief.riskNotes.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="reporting-command__card">
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Action</p>
              <h4 className="reporting-command__card-title" style={{ fontSize: 18 }}>
                Recommended Actions
              </h4>
            </div>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "rgba(203, 213, 225, 0.9)", lineHeight: 1.6 }}>
            {brief.recommendedActions.slice(0, 4).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
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
          ["Lowest Cost / Verified", brief.leaders.lowestCostPerVerifiedOutcome?.label || "—"],
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


const BRIEFING_SECTIONS = [
  {
    title: "Decision Summary",
    detail:
      "Executive overview of the current workflow state, readiness, and immediate next actions.",
  },
  {
    title: "Operational Snapshot",
    detail:
      "Short-form view of the bridge, verification, and reporting posture for leadership review.",
  },
  {
    title: "Trust + Publication Posture",
    detail:
      "Current trust, trace, and publication-mode posture carried into briefing generation.",
  },
  {
    title: "Recommended Actions",
    detail:
      "Leadership-facing next moves based on the current verified workflow chain.",
  },
];

export default function BriefingExportPanel() {
  const auth = useAuth();
  const [flash, setFlash] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const bridgeState = useMemo(() => getBridgeWorkflowState(), [refreshKey]);
  const bridgeReadiness = useMemo(
    () => deriveBridgeWorkflowReadiness(bridgeState),
    [bridgeState]
  );

  const link = useMemo(() => {
    return (
      findBridgeLinkBySourceCaseId(bridgeState.caseId) || {
        sourceCaseId: bridgeState.caseId || "hub_case_demo_001",
        verificationRecordId: "ver_hub_case_demo_001",
        bridgeTraceId: `live_bridge_${bridgeState.caseId || "hub_case_demo_001"}`,
        reportArtifactId: "rep_hub_case_demo_001",
      }
    );
  }, [bridgeState.caseId]);

  const readiness = useMemo(
    () =>
      evaluateReportingExportReadiness({
        exportKind: "briefing_export",
        bridgeReadiness,
        verificationState: bridgeState.verificationState,
        sourceToReportTraceCoverage: bridgeState.sourceToReportTraceCoverage,
        publicationMode: bridgeState.publicationMode || "admin_internal",
        trustEnvelopePresent: true,
      }),
    [bridgeReadiness, bridgeState]
  );


  const canGenerateExport =
    readiness.allowedActions.generate &&
    auth.hasPermission(SHS_SECURITY_PERMISSIONS.REPORTS_EXPORT);

  const traceTargets = {
    sourceObjectId: link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001",
    bridgeTraceId:
      link.bridgeTraceId ||
      `live_bridge_${bridgeState.caseId || "hub_case_demo_001"}`,
    verificationRecordId: link.verificationRecordId || "ver_hub_case_demo_001",
    reportArtifactId: link.reportArtifactId || "rep_hub_case_demo_001",
  };

  const traceRecord = buildReportingTraceRecord(
    "briefing_export",
    {
      ...traceTargets,
      traceCoverageStatus: bridgeState.sourceToReportTraceCoverage ? "complete" : "missing",
    }
  );

  const traceRows = getReportingTraceRows(
    "briefing_export",
    traceRecord
  );

  const traceRoutes = buildReportingTraceRouteMap(traceRecord);

  async function handleGenerate() {
    if (!canGenerateExport) {
      recordExportAuditTrail({
        exportKind: "briefing_export",
        artifactId: traceTargets.reportArtifactId,
        publicationMode: bridgeState.publicationMode || "admin_internal",
        requestedBy: "user_admin_001",
        readiness,
        traceRecord,
        oracleTruth: typeof oracleTruth !== "undefined" ? oracleTruth : null,
        oracleGate: typeof oracleGate !== "undefined" ? oracleGate : null,
        canGenerateExport,
        status: "blocked",
        source: "briefing_export_panel",
      });
      return;
    }

    const result = await generateBriefingExport({
      publicationMode: bridgeState.publicationMode || "admin_internal",
      relatedEntityIds: [
        traceTargets.sourceObjectId,
        traceTargets.bridgeTraceId,
        traceTargets.verificationRecordId,
        traceTargets.reportArtifactId,
      ],
      requestedBy: "user_admin_001",
      reportArtifactId: traceTargets.reportArtifactId,
    });

    recordExportAuditTrail({
      exportKind: "briefing_export",
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
      source: "briefing_export_panel",
    });

    setFlash(result.message || `Briefing export completed: ${result.exportId}`);
  }

  function handleRefresh() {
    setRefreshKey((value) => value + 1);
    setFlash("Briefing panel refreshed from shared bridge workflow state.");
  }

  return (
    <section className="reporting-command__card" style={{ gap: 16 }}>
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">PDF Export</p>
          <h2 className="reporting-command__card-title">Briefing Export</h2>
        </div>
        <StatusBadge status={readiness.status} />
      </div>

      <p className="reporting-command__summary">
        Decision-ready export for leadership review with key metrics, trust state, and recommended next steps.
      </p>

      <FundingDecisionBriefExportBridge />

      <AdaptiveFeedbackBriefingBridge />

      <ExportReadinessCard
        exportKind="briefing_export"
        audience="Leadership"
        format="PDF"
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
            border: "1px solid rgba(34, 197, 94, 0.52)",
            background:
              "linear-gradient(180deg, rgba(9, 18, 36, 0.96), rgba(8, 15, 30, 0.98))",
            color: "rgba(134, 239, 172, 0.98)",
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
          <span className="reporting-command__stat-label">Pages</span>
          <strong className="reporting-command__stat-value">6–8</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Audience</span>
          <strong className="reporting-command__stat-value">Leadership</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Format</span>
          <strong className="reporting-command__stat-value">PDF</strong>
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
            <p className="reporting-command__card-kicker">Trace</p>
            <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
              Source-to-Report Trace
            </h3>
          </div>
          <StatusBadge status={traceRecord.traceCoverageStatus === "complete" ? "ready" : "pending"} />
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {[
            { label: "Source Object", value: traceTargets.sourceObjectId },
            { label: "Bridge Trace", value: traceTargets.bridgeTraceId },
            { label: "Verification Record", value: traceTargets.verificationRecordId },
            { label: "Report Artifact", value: traceTargets.reportArtifactId },
            { label: "Lineage ID", value: `lineage_${traceTargets.sourceObjectId}_v1` },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 12,
                alignItems: "start",
                padding: "10px 0",
                borderTop: "1px solid rgba(148, 163, 184, 0.08)",
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
                  fontSize: 14,
                  lineHeight: 1.45,
                  color: "rgba(241, 245, 249, 0.98)",
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
      </article>

      <div
        className="reporting-command__grid"
        style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
      >
        {BRIEFING_SECTIONS.map((section) => (
          <article key={section.title} className="reporting-command__card">
            <div className="reporting-command__card-top">
              <div>
                <p className="reporting-command__card-kicker">Section</p>
                <h3 className="reporting-command__card-title" style={{ fontSize: 22 }}>
                  {section.title}
                </h3>
              </div>
            </div>
            <p className="reporting-command__summary">{section.detail}</p>
          </article>
        ))}
      </div>

      <div className="reporting-command__actions">
        <button type="button" onClick={handleRefresh}>
          Refresh Briefing State
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
          Generate Briefing Export
        </button>
      </div>
    </section>
  );
}
