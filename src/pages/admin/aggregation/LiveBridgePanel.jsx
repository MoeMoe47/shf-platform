import React, { useEffect, useMemo, useState } from "react";
import useReferrals from "@/lib/hub/useReferrals";
import {
  createBridgeTrustEnvelope,
  createReportPackageFromReferral,
  createVerificationPackageFromReferral,
  mapHubReferralToCanonicalReferral,
} from "@/system/contracts";
import {
  deriveBridgeWorkflowReadiness,
  getBridgeWorkflowState,
  resetBridgeWorkflowState,
  updateBridgeWorkflowState,
} from "@/pages/admin/reporting/bridge-workflow-store";
import {
  mapBridgeTrustToTrustEnvelope,
  mapBridgeWorkflowToReadinessStatus,
} from "@/system/contracts/core-adapters";

function ReadinessBadge({ label, active }) {
  return (
    <span
      className={[
        "admin-aggregation-badge",
        active ? "is-verified" : "is-pending",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function getRemediationHints(missingFields = []) {
  const hints = [];

  if (missingFields.includes("toOrganizationId")) {
    hints.push({
      field: "toOrganizationId",
      nextStep: "Assign a receiving organization in the Hub referral workflow.",
      why: "Without a target organization, Aggregation cannot resolve the destination entity.",
      blocks: "Aggregation, Verification, Reporting",
    });
  }

  if (missingFields.includes("fromOrganizationId")) {
    hints.push({
      field: "fromOrganizationId",
      nextStep: "Confirm or restore the sending organization identity in Hub.",
      why: "The referral source must be known before the record can be trusted across layers.",
      blocks: "Aggregation, Verification, Reporting",
    });
  }

  if (missingFields.includes("createdAt")) {
    hints.push({
      field: "createdAt",
      nextStep: "Restore a valid created timestamp from the source referral event.",
      why: "Institutional reporting and audit trails require a reliable event timestamp.",
      blocks: "Aggregation, Verification, Reporting",
    });
  }

  if (missingFields.includes("completed_or_closed_status")) {
    hints.push({
      field: "completed_or_closed_status",
      nextStep: "Advance the referral lifecycle to completed or closed before verification/report generation.",
      why: "The bridge only treats mature lifecycle states as verification/report-ready.",
      blocks: "Verification, Reporting",
    });
  }

  return hints;
}

function ContractCard({ title, data }) {
  return (
    <article className="admin-aggregation-bridge__card">
      <span className="admin-aggregation-bridge__label">{title}</span>
      <pre className="admin-aggregation-bridge__code">
{JSON.stringify(data, null, 2)}
      </pre>
    </article>
  );
}

export default function LiveBridgePanel() {
  const { items, loading, error } = useReferrals();
  const [flash, setFlash] = useState("");
  const source = useMemo(() => (items || [])[0], [items]);
  const [bridgeState, setBridgeState] = useState(getBridgeWorkflowState());

  useEffect(() => {
    setBridgeState(getBridgeWorkflowState());
  }, []);

  if (loading) {
    return (
      <section className="admin-aggregation-bridge">
        <div className="admin-aggregation-bridge__header">
          <div>
            <p className="admin-aggregation-bridge__eyebrow">Live Hub Bridge</p>
            <h2 className="admin-aggregation-bridge__title">Live Bridge Panel</h2>
            <p className="admin-aggregation-bridge__subtitle">Loading live Hub referral…</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="admin-aggregation-bridge">
        <div className="admin-aggregation-bridge__header">
          <div>
            <p className="admin-aggregation-bridge__eyebrow">Live Hub Bridge</p>
            <h2 className="admin-aggregation-bridge__title">Live Bridge Panel</h2>
            <p className="admin-aggregation-bridge__subtitle">
              Failed to load live Hub referral: {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (!source) {
    return (
      <section className="admin-aggregation-bridge">
        <div className="admin-aggregation-bridge__header">
          <div>
            <p className="admin-aggregation-bridge__eyebrow">Live Hub Bridge</p>
            <h2 className="admin-aggregation-bridge__title">Live Bridge Panel</h2>
            <p className="admin-aggregation-bridge__subtitle">
              No live Hub referrals available yet.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const readiness = deriveBridgeWorkflowReadiness(bridgeState);

  const trust = createBridgeTrustEnvelope({
    verificationState: bridgeState.verificationState,
    confidenceLevel: readiness.verificationReady ? "high" : "medium",
    confidenceScore: readiness.verificationReady ? 91 : 84,
    freshnessLabel: "live",
    sourceCount: 1,
    sourceIds: ["hub_live_referral"],
    lineageId: `live_bridge_${source.case_id}`,
    lastUpdatedAt: source.updated_at || source.created_at || new Date().toISOString(),
    publicationMode: bridgeState.publicationMode,
  });

  const canonicalReferral = mapHubReferralToCanonicalReferral(source, trust);
  if (bridgeState.toOrganizationId) {
    canonicalReferral.toOrganizationId = bridgeState.toOrganizationId;
  }

  const verificationPackage = createVerificationPackageFromReferral(
    canonicalReferral,
    "hub_referral",
    source.case_id,
    trust
  );

  const reportingPackage = createReportPackageFromReferral(
    canonicalReferral,
    "hub_referral",
    source.case_id,
    trust
  );

  verificationPackage.readiness = readiness;
  reportingPackage.readiness = readiness;

  const remediationHints = getRemediationHints(readiness.missingFields || []);

  const readinessStatus = mapBridgeWorkflowToReadinessStatus({
    caseId: bridgeState.caseId || source.case_id || "hub_case_demo_001",
    toOrganizationId: bridgeState.toOrganizationId,
    verificationState: bridgeState.verificationState,
    sourceToReportTraceCoverage: bridgeState.sourceToReportTraceCoverage,
    publicationMode: bridgeState.publicationMode,
  });

  const trustEnvelope = mapBridgeTrustToTrustEnvelope({
    trustId: `trust_${source.case_id || "hub_case_demo_001"}`,
    entityId: source.case_id || "hub_case_demo_001",
    verificationState: bridgeState.verificationState,
    confidenceScore: readiness.verificationReady ? 91 : 84,
    confidenceLabel: readiness.verificationReady ? "high" : "medium",
    sourceCount: 1,
    lastVerifiedAt: source.updated_at || source.created_at || new Date().toISOString(),
    publicationMode: bridgeState.publicationMode,
  });

  function syncStore(partial, message) {
    const next = updateBridgeWorkflowState(partial);
    setBridgeState(next);
    setFlash(message);
  }

  function handleAssignReceiver() {
    const nextId = "org_franklin_workforce_partner";
    syncStore(
      {
        caseId: source.case_id || "hub_case_demo_001",
        toOrganizationId: nextId,
      },
      `Receiving organization assigned: ${nextId}`
    );
  }

  function handleApproveVerification() {
    syncStore(
      {
        caseId: source.case_id || "hub_case_demo_001",
        verificationState: "verified",
      },
      `Verification approved for ${source.case_id}`
    );
  }

  function handleEnableTrace() {
    syncStore(
      {
        caseId: source.case_id || "hub_case_demo_001",
        sourceToReportTraceCoverage: true,
      },
      `Source-to-report trace coverage enabled for ${source.case_id}`
    );
  }

  function handleResetBridge() {
    const next = resetBridgeWorkflowState();
    setBridgeState(next);
    setFlash(`Bridge workflow reset for ${source.case_id}`);
  }

  return (
    <section className="admin-aggregation-bridge">
      <div className="admin-aggregation-bridge__header">
        <div>
          <p className="admin-aggregation-bridge__eyebrow">Live Hub Bridge</p>
          <h2 className="admin-aggregation-bridge__title">Live Bridge Panel</h2>
          <p className="admin-aggregation-bridge__subtitle">
            Live Hub referral mapped into canonical referral, verification, and reporting packages.
          </p>
        </div>
      </div>

      {flash ? (
        <div
          className="admin-aggregation-bridge__missing"
          style={{
            borderColor: "rgba(70,180,110,0.30)",
            background: "rgba(70,180,110,0.12)",
            color: "rgba(187,247,208,0.98)",
          }}
        >
          {flash}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <ReadinessBadge
          label={`Aggregation ${readiness.aggregationReady ? "Ready" : "Pending"}`}
          active={readiness.aggregationReady}
        />
        <ReadinessBadge
          label={`Verification ${readiness.verificationReady ? "Ready" : "Pending"}`}
          active={readiness.verificationReady}
        />
        <ReadinessBadge
          label={`Reporting ${readiness.reportingReady ? "Ready" : "Pending"}`}
          active={readiness.reportingReady}
        />
      </div>

      {readiness.missingFields?.length ? (
        <div className="admin-aggregation-bridge__missing">
          Missing fields: {readiness.missingFields.join(", ")}
        </div>
      ) : null}

      {remediationHints.length ? (
        <div className="admin-aggregation-bridge__hints">
          {remediationHints.map((hint) => (
            <article key={hint.field} className="admin-aggregation-bridge__hint-card">
              <div className="admin-aggregation-bridge__hint-title">{hint.field}</div>
              <div className="admin-aggregation-bridge__hint-row">
                <span>Next step</span>
                <strong>{hint.nextStep}</strong>
              </div>
              <div className="admin-aggregation-bridge__hint-row">
                <span>Why</span>
                <strong>{hint.why}</strong>
              </div>
              <div className="admin-aggregation-bridge__hint-row">
                <span>Blocks</span>
                <strong>{hint.blocks}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="admin-aggregation-bridge__actions">
        <div className="admin-aggregation-bridge__action-group">
          <span className="admin-aggregation-bridge__action-label">Workflow actions</span>
          <div className="admin-aggregation-commandbar__actions">
            <button type="button" onClick={handleAssignReceiver}>
              Assign Receiver
            </button>
            <button
              type="button"
              onClick={handleApproveVerification}
              disabled={!readiness.aggregationReady}
              className={!readiness.aggregationReady ? "admin-aggregation-bridge__btn-disabled" : ""}
            >
              Approve Verification
            </button>
            <button
              type="button"
              onClick={handleEnableTrace}
              disabled={!readiness.verificationReady}
              className={!readiness.verificationReady ? "admin-aggregation-bridge__btn-disabled" : ""}
            >
              Enable Trace
            </button>
            <button type="button" onClick={handleResetBridge}>
              Reset Bridge
            </button>
          </div>
        </div>
      </div>

      <div className="admin-aggregation-bridge__grid">
        <ContractCard title="ReadinessStatus Contract" data={readinessStatus} />
        <ContractCard title="TrustEnvelope Contract" data={trustEnvelope} />
        <ContractCard title="Live Hub Source" data={source} />
        <ContractCard title="Canonical Referral" data={canonicalReferral} />
        <ContractCard title="Verification Package" data={verificationPackage} />
        <ContractCard title="Reporting Package" data={reportingPackage} />
      </div>
    </section>
  );
}
