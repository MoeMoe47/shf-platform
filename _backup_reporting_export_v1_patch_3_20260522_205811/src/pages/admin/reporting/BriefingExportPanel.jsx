import useAuth from "../../../auth/useAuth";
import React, { useMemo, useState } from "react";
import { evaluateReportingExportReadiness } from "./reporting-readiness";
import ExportReadinessCard from "./ExportReadinessCard.jsx";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";
import { generateBriefingExport } from "./reporting-actions";
import { buildReportingTraceRouteMap } from "./reporting-trace-routes";
import { buildReportingTraceRecord, getReportingTraceRows } from "./reporting-trace";
import { findBridgeLinkBySourceCaseId } from "./bridge-record-links";
import {
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
    if (!canGenerateExport) return;

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
