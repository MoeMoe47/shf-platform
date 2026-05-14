import React, { useMemo, useState } from "react";
import "./reporting-command.css";
import { runVerificationAuditAction } from "./verification-audit-actions";
import {
  deriveBridgeWorkflowReadiness,
  getBridgeWorkflowState,
  resetBridgeWorkflowState,
  updateBridgeWorkflowState,
} from "./bridge-workflow-store";
import {
  findBridgeLinkBySourceCaseId,
  findBridgeLinkByVerificationRecordId,
} from "./bridge-record-links";
import { getFocusedVerificationId } from "@/system/routing/hash-query";

const INITIAL_QUEUE_ROWS = [
  {
    id: "ver_hub_case_001",
    entityType: "Referral",
    sourceLayer: "Hub Bridge",
    verificationState: "verified",
    confidence: "92%",
    missingFields: "—",
    updatedAt: "2026-04-16 10:42",
  },
  {
    id: "ver_hub_case_002",
    entityType: "Referral",
    sourceLayer: "Hub Bridge",
    verificationState: "pending",
    confidence: "84%",
    missingFields: "toOrganizationId",
    updatedAt: "2026-04-16 10:47",
  },
  {
    id: "ver_report_003",
    entityType: "Report Artifact",
    sourceLayer: "Reporting",
    verificationState: "blocked",
    confidence: "71%",
    missingFields: "completed_or_closed_status",
    updatedAt: "2026-04-16 10:51",
  },
  {
    id: "ver_unmet_004",
    entityType: "Unmet Need",
    sourceLayer: "Aggregation",
    verificationState: "pending",
    confidence: "78%",
    missingFields: "county",
    updatedAt: "2026-04-16 10:58",
  },
];

function buildTraceRows(bridgeState, linkedVerificationId) {
  const link = findBridgeLinkByVerificationRecordId(linkedVerificationId);

  return [
    {
      label: "Source Object",
      value: link?.sourceCaseId || bridgeState.caseId || "hub_case_demo_001",
    },
    {
      label: "Bridge Trace",
      value: link?.bridgeTraceId || "live_bridge_hub_case_demo_001",
    },
    {
      label: "Verification Package",
      value: linkedVerificationId || link?.verificationRecordId || "ver_hub_case_demo_001",
    },
    {
      label: "Reporting Package",
      value: link?.reportArtifactId || "rep_hub_case_demo_001",
    },
    {
      label: "Lineage ID",
      value: `lineage_${link?.sourceCaseId || bridgeState.caseId || "hub_case_demo_001"}_v1`,
    },
  ];
}

function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const cls =
    normalized === "verified" || normalized === "ready"
      ? "reporting-command__badge reporting-command__badge--ready"
      : "reporting-command__badge reporting-command__badge--pending";

  return <span className={cls}>{String(status).toUpperCase()}</span>;
}

export default function VerificationAuditSurface() {
  const focusedVerificationId = getFocusedVerificationId();
  const [flash, setFlash] = useState("");
  const [queueRows] = useState(INITIAL_QUEUE_ROWS);
  const [activityLog, setActivityLog] = useState([]);
  const [bridgeState, setBridgeState] = useState(getBridgeWorkflowState());

  const readiness = deriveBridgeWorkflowReadiness(bridgeState);

  const sourceLink = useMemo(
    () => findBridgeLinkBySourceCaseId(bridgeState.caseId),
    [bridgeState.caseId]
  );

  const focusedLink = useMemo(
    () => findBridgeLinkByVerificationRecordId(focusedVerificationId),
    [focusedVerificationId]
  );

  const activeVerificationId =
    focusedLink?.verificationRecordId ||
    sourceLink?.verificationRecordId ||
    focusedVerificationId ||
    "ver_hub_case_002";

  const traceRows = useMemo(
    () => buildTraceRows(bridgeState, activeVerificationId),
    [bridgeState, activeVerificationId]
  );

  const derivedRows = useMemo(() => {
    return queueRows.map((row) => {
      if (row.id !== activeVerificationId) return row;

      return {
        ...row,
        verificationState: bridgeState.verificationState,
        missingFields: readiness.missingFields.length
          ? readiness.missingFields.join(", ")
          : "—",
        updatedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      };
    });
  }, [queueRows, activeVerificationId, bridgeState, readiness]);

  const derivedSummary = useMemo(() => {
    const verified = derivedRows.filter(
      (row) => String(row.verificationState).toLowerCase() === "verified"
    ).length;
    const pending = derivedRows.filter(
      (row) => String(row.verificationState).toLowerCase() === "pending"
    ).length;
    const blocked = derivedRows.filter(
      (row) => String(row.verificationState).toLowerCase() === "blocked"
    ).length;
    const auditReady = verified;
    return { verified, pending, blocked, auditReady };
  }, [derivedRows]);

  function appendActivity(message) {
    setActivityLog((prev) => [
      {
        id: `${Date.now()}_${prev.length}`,
        message,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  function syncBridge(partial, baseMessage) {
    const next = updateBridgeWorkflowState(partial);
    setBridgeState(next);
    setFlash(`${baseMessage} | ${new Date().toISOString()}`);
    appendActivity(baseMessage);
  }

  function handleApproveVerification() {
    syncBridge(
      { verificationState: "verified" },
      `Verification approved for ${activeVerificationId}`
    );
  }

  function handleFlagForReview() {
    syncBridge(
      { verificationState: "pending" },
      `Record flagged for review: ${activeVerificationId}`
    );
  }

  function handleGenerateAuditPack() {
    const result = runVerificationAuditAction({
      actionKind: "generate_audit_pack",
      targetId: activeVerificationId,
      requestedBy: "user_admin_001",
    });
    setFlash(`${result.message} | ${result.createdAt}`);
    appendActivity(result.message);
  }

  function handleOpenSourceObject() {
    const result = runVerificationAuditAction({
      actionKind: "open_source_object",
      targetId: bridgeState.caseId || sourceLink?.sourceCaseId || "hub_case_demo_001",
      requestedBy: "user_admin_001",
    });
    setFlash(`${result.message} | ${result.createdAt}`);
    appendActivity(result.message);
  }

  function handleResetWorkflow() {
    const next = resetBridgeWorkflowState();
    setBridgeState(next);
    setFlash("Bridge workflow reset from verification surface.");
    appendActivity("Bridge workflow reset from verification surface.");
  }

  function handleRefreshState() {
    setBridgeState(getBridgeWorkflowState());
    setFlash("Verification state refreshed from shared bridge workflow store.");
  }

  return (
    <main className="reporting-command">
      <section className="reporting-command__hero">
        <div>
          <p className="reporting-command__eyebrow">Verification + Audit Layer</p>
          <h1 className="reporting-command__title">Verification Audit Surface</h1>
          <p className="reporting-command__subtitle">
            Review verification state, readiness blockers, trace evidence, and audit-pack
            eligibility across the system.
          </p>
        </div>

        <div className="reporting-command__hero-actions">
          <button type="button" onClick={handleRefreshState}>
            Refresh Verification State
          </button>
          <button type="button" onClick={handleGenerateAuditPack}>
            Generate Audit Pack
          </button>
        </div>
      </section>

      {focusedVerificationId ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(59, 130, 246, 0.28)",
            background: "rgba(30, 64, 175, 0.16)",
            color: "rgba(191, 219, 254, 0.98)",
            fontSize: 13,
            lineHeight: 1.5,
          }}
        >
          Focused record: <strong>{focusedVerificationId}</strong>
          {sourceLink ? (
            <>
              {" "}
              | Linked source case: <strong>{sourceLink.sourceCaseId}</strong>
            </>
          ) : null}
        </div>
      ) : null}

      {flash ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 14,
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

      <section className="reporting-command__stats">
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Verified Records</span>
          <strong className="reporting-command__stat-value">{derivedSummary.verified}</strong>
          <span className="reporting-command__summary">
            Records currently cleared for institutional use.
          </span>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Pending Verification</span>
          <strong className="reporting-command__stat-value">{derivedSummary.pending}</strong>
          <span className="reporting-command__summary">
            Records still waiting for review or source repair.
          </span>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Blocked Records</span>
          <strong className="reporting-command__stat-value">{derivedSummary.blocked}</strong>
          <span className="reporting-command__summary">
            Records blocked by missing fields or failed readiness.
          </span>
        </article>
        <article className="reporting-command__stat">
          <span className="reporting-command__stat-label">Audit-Ready Records</span>
          <strong className="reporting-command__stat-value">{derivedSummary.auditReady}</strong>
          <span className="reporting-command__summary">
            Records suitable for audit pack and controlled publication.
          </span>
        </article>
      </section>

      <section className="reporting-command__card" style={{ gap: 16 }}>
        <div className="reporting-command__card-top">
          <div>
            <p className="reporting-command__card-kicker">Verification Queue</p>
            <h2 className="reporting-command__card-title">Verification Queue Table</h2>
          </div>
          <StatusBadge status={readiness.verificationReady ? "verified" : "pending"} />
        </div>

        <div className="reporting-command__table-wrap">
          <table className="reporting-command__table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Entity Type</th>
                <th>Source Layer</th>
                <th>Verification State</th>
                <th>Confidence</th>
                <th>Missing Fields</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              {derivedRows.map((row) => {
                const isFocused = focusedVerificationId && row.id === focusedVerificationId;
                return (
                  <tr
                    key={row.id}
                    style={
                      isFocused
                        ? {
                            background: "rgba(30, 64, 175, 0.16)",
                            outline: "1px solid rgba(59, 130, 246, 0.24)",
                          }
                        : undefined
                    }
                  >
                    <td>{row.id}</td>
                    <td>{row.entityType}</td>
                    <td>{row.sourceLayer}</td>
                    <td><StatusBadge status={row.verificationState} /></td>
                    <td>{row.confidence}</td>
                    <td>{row.missingFields}</td>
                    <td>{row.updatedAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="reporting-command__actions">
          <button
            type="button"
            disabled={!readiness.aggregationReady}
            style={!readiness.aggregationReady ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
            onClick={handleApproveVerification}
          >
            Approve Verification
          </button>
          <button type="button" onClick={handleFlagForReview}>
            Flag for Review
          </button>
          <button type="button" onClick={handleResetWorkflow}>
            Reset Workflow
          </button>
        </div>
      </section>

      <section className="reporting-command__grid" style={{ gridTemplateColumns: "1.2fr 1fr" }}>
        <article className="reporting-command__card">
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Audit Trace</p>
              <h2 className="reporting-command__card-title">Audit Trace Panel</h2>
            </div>
            <StatusBadge status={readiness.reportingReady ? "ready" : "pending"} />
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {traceRows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr",
                  gap: 12,
                  alignItems: "start",
                  padding: "10px 0",
                  borderTop: "1px solid rgba(20,20,20,0.08)",
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
        </article>

        <article className="reporting-command__card">
          <div className="reporting-command__card-top">
            <div>
              <p className="reporting-command__card-kicker">Actions</p>
              <h2 className="reporting-command__card-title">Audit Controls</h2>
            </div>
            <StatusBadge status="ready" />
          </div>

          <p className="reporting-command__summary">
            Use these controls to move records through audit review and publication readiness.
          </p>

          <div className="reporting-command__actions" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <button
              type="button"
              disabled={!readiness.aggregationReady}
              style={!readiness.aggregationReady ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              onClick={handleApproveVerification}
            >
              Approve Verification
            </button>
            <button type="button" onClick={handleFlagForReview}>
              Flag for Review
            </button>
            <button
              type="button"
              disabled={!readiness.verificationReady}
              style={!readiness.verificationReady ? { opacity: 0.45, cursor: "not-allowed" } : undefined}
              onClick={handleGenerateAuditPack}
            >
              Generate Audit Pack
            </button>
            <button type="button" onClick={handleOpenSourceObject}>
              Open Source Object
            </button>
          </div>
        </article>
      </section>

      <section className="reporting-command__card" style={{ gap: 16 }}>
        <div className="reporting-command__card-top">
          <div>
            <p className="reporting-command__card-kicker">Workflow Activity</p>
            <h2 className="reporting-command__card-title">Verification Activity Log</h2>
          </div>
          <StatusBadge status="ready" />
        </div>

        {activityLog.length === 0 ? (
          <p className="reporting-command__summary">
            No workflow events yet. Run an action to create a verification activity entry.
          </p>
        ) : (
          <div className="reporting-command__table-wrap">
            <table className="reporting-command__table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((item) => (
                  <tr key={item.id}>
                    <td>{item.createdAt}</td>
                    <td>{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
