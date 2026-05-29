import useAuth from "../../../auth/useAuth";
import React, { useMemo, useState } from "react";
import { evaluateReportingExportReadiness } from "./reporting-readiness";
import ExportReadinessCard from "./ExportReadinessCard.jsx";
import { recordExportAuditTrail } from "./export-audit-trail";
import { SHS_SECURITY_PERMISSIONS } from "@/system/security/security-permissions";
import { generateAuditPackExport } from "./reporting-actions";
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

export default function AuditPackPanel() {
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
        reportArtifactId: "rep_audit_pack_demo_001",
      }
    );
  }, [bridgeState.caseId]);

  const readiness = useMemo(
    () =>
      evaluateReportingExportReadiness({
        exportKind: "audit_pack_export",
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
    reportArtifactId: "rep_audit_pack_demo_001",
    canonicalEntityId: link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001",
    lineageId: `lineage_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}_v1`,
    oracleTraceId: `trace_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}`,
    trustEnvelopeTraceId: `trace_${link.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}`,
    publicationMode: bridgeState.publicationMode || "internal",
  };

  const traceRecord = buildReportingTraceRecord(
    "audit_pack_export",
    {
      ...traceTargets,
      traceCoverageStatus: bridgeState.sourceToReportTraceCoverage ? "complete" : "missing",
    }
  );

  const traceRows = getReportingTraceRows(
    "audit_pack_export",
    traceRecord
  );

  const traceRoutes = buildReportingTraceRouteMap(traceRecord);

  const auditPackItems = useMemo(
    () => [
      {
        artifact: "Verification Queue Export",
        status: bridgeReadiness.verificationReady ? "ready" : "pending",
        detail: bridgeReadiness.verificationReady
          ? "Structured verification queue rows included in audit bundle."
          : "Verification queue remains incomplete until verification readiness clears.",
      },
      {
        artifact: "Bridge Readiness Snapshot",
        status: bridgeReadiness.aggregationReady ? "ready" : "pending",
        detail: bridgeReadiness.aggregationReady
          ? "Live bridge readiness state and missing-field logic included."
          : "Bridge readiness snapshot still reflects unresolved aggregation blockers.",
      },
      {
        artifact: "Trace Linkage Register",
        status: traceRecord.traceCoverageStatus === "complete" ? "ready" : "pending",
        detail: traceRecord.traceCoverageStatus === "complete"
          ? "Source, bridge, canonical entity, verification, report artifact, lineage, Oracle trace, and trust envelope linkage included."
          : `Trace linkage is ${traceRecord.traceCoverageStatus}; missing fields: ${traceRecord.missingTraceFields.join(", ") || "none"}.`,
      },
      {
        artifact: "Analyst Memo Snapshot",
        status: readiness.ready ? "ready" : "pending",
        detail: readiness.ready
          ? "Memo export is now eligible for inclusion in the audit bundle."
          : "Memo export remains blocked until reporting readiness is fully cleared.",
      },
    ],
    [bridgeReadiness, bridgeState.sourceToReportTraceCoverage, readiness.ready]
  );

  async function handleGenerate() {
    if (!canGenerateExport) {
      recordExportAuditTrail({
        exportKind: "audit_pack_export",
        artifactId: traceTargets.reportArtifactId,
        publicationMode: bridgeState.publicationMode || "admin_internal",
        requestedBy: "user_admin_001",
        readiness,
        traceRecord,
        oracleTruth: typeof oracleTruth !== "undefined" ? oracleTruth : null,
        oracleGate: typeof oracleGate !== "undefined" ? oracleGate : null,
        canGenerateExport,
        status: "blocked",
        source: "audit_pack_export_panel",
      });
      return;
    }

    const result = await generateAuditPackExport({
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
      exportKind: "audit_pack_export",
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
      source: "audit_pack_export_panel",
    });

    setFlash(result.message || `Audit Pack export completed: ${result.exportId}`);
  }

  function handleRefresh() {
    setRefreshKey((value) => value + 1);
    setFlash("Audit Pack panel refreshed from shared bridge workflow state.");
  }

  return (
    <section className="reporting-command__card" style={{ gap: 16 }}>
      <div className="reporting-command__card-top">
        <div>
          <p className="reporting-command__card-kicker">Audit Bundle</p>
          <h2 className="reporting-command__card-title">Audit Pack</h2>
        </div>
        <StatusBadge status={readiness.status} />
      </div>

      <p className="reporting-command__summary">
        Consolidated audit-pack surface for evidence review, verification coverage, bridge status,
        and trace-aware export generation.
      </p>

      <ExportReadinessCard
        exportKind="audit_pack_export"
        audience="Audit / Institutional"
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
          <span className="reporting-command__stat-label">Pack Length</span>
          <strong className="reporting-command__stat-value">10–25</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Primary Format</span>
          <strong className="reporting-command__stat-value">PDF</strong>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Audience</span>
          <strong className="reporting-command__stat-value">Audit / Institutional</strong>
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

      <div className="reporting-command__table-wrap">
        <table className="reporting-command__table">
          <thead>
            <tr>
              <th>Included Artifact</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {auditPackItems.map((item, index) => (
              <tr key={`${item.artifact}-${index}`}>
                <td>{item.artifact}</td>
                <td><StatusBadge status={item.status} /></td>
                <td>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="reporting-command__actions">
        <button type="button" onClick={handleRefresh}>
          Refresh Audit Pack State
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
          Generate Audit Pack
        </button>
      </div>
    </section>
  );
}
