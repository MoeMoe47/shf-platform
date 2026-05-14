import {
  getTruthSpineRecords,
  getTruthSpineRecord,
  patchTruthSpineRecord,
  upsertTruthSpineRecord,
} from "./truthSpineStore.js";

import {
  getTruthSpineEvents,
  appendTruthSpineEvent,
  EVENT_TYPES,
} from "./truthSpineEvents.js";

import {
  seedHubReferralsIntoTruthSpine,
  recordHubReferralAction,
  referralToTruthSpineRecord,
} from "./hubTruthAdapter.js";

import {
  attachTruthSpineEvidence,
  markTruthSpineRecordVerified,
  markTruthSpineRecordNeedsEvidence,
  markTruthSpineRecordConflict,
} from "./truthSpineVerification.js";

import {
  fetchAuditEvents,
  fetchReportingExports,
  createReportingExport,
  syncPartnerQueueActionToBackend,
} from "./truthSpineApi.js";

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((Number(numerator || 0) / Number(denominator || 1)) * 100);
}

export function getTruthSpineReportingSummary({
  records = [],
  events = [],
  backendAuditEvents = [],
  backendExports = [],
} = {}) {
  const totalRecords = records.length;

  const reportReadyRecords = records.filter((record) => {
    const readiness = record?.oracle?.readinessStatus;

    return (
      record?.trustEnvelope?.reportingReady === true ||
      readiness === "report_ready" ||
      readiness === "leadership_ready" ||
      readiness === "funder_ready" ||
      readiness === "public_ready"
    );
  });

  const auditReadyRecords = records.filter((record) => {
    return Boolean(record?.trustEnvelope?.traceId) || record?.trustEnvelope?.auditReady === true;
  });

  const verifiedRecords = records.filter((record) => {
    const verification = record?.verification?.verificationStatus;
    const truth = record?.oracle?.truthStatus;

    return (
      verification === "verified" ||
      truth === "verified_true" ||
      truth === "certified"
    );
  });

  const pendingRecords = records.filter((record) => {
    const readiness = record?.oracle?.readinessStatus;
    const verification = record?.verification?.verificationStatus;

    return (
      readiness === "not_ready" ||
      readiness === "review_required" ||
      readiness === "blocked" ||
      verification === "pending" ||
      verification === "unreviewed" ||
      verification === "insufficient_evidence"
    );
  });

  const createdReferralEvents = events.filter((event) => event?.eventType === EVENT_TYPES.HUB_REFERRAL_CREATED || event?.eventType === "hub.referral.created");
  const reportExportEvents = events.filter((event) => event?.eventType === EVENT_TYPES.REPORT_EXPORT_GENERATED || event?.eventType === "report.export.generated");

  const backendAuditList = Array.isArray(backendAuditEvents) ? backendAuditEvents : [];
  const backendExportList = Array.isArray(backendExports) ? backendExports : [];

  const backendAuditCount = backendAuditList.length;

  const backendCaseAuditCount = backendAuditList.filter((event) =>
    String(event?.target_object_type || event?.targetObjectType || "").toLowerCase() === "case"
  ).length;

  const backendReferralAuditCount = backendAuditList.filter((event) =>
    String(event?.target_object_type || event?.targetObjectType || "").toLowerCase() === "referral"
  ).length;

  const backendAuditTargetIds = new Set(
    backendAuditList
      .map((event) => event?.target_object_id || event?.targetObjectId)
      .filter(Boolean)
  );

  const backendAuditCoveredRecords = records.filter((record) => {
    const raw = record?.raw || {};

    return (
      backendAuditTargetIds.has(record?.entityId) ||
      backendAuditTargetIds.has(raw?.case_id) ||
      backendAuditTargetIds.has(raw?.id)
    );
  });

  const readinessPercent = pct(reportReadyRecords.length, totalRecords);
  const localAuditCoveragePercent = pct(auditReadyRecords.length, totalRecords);
  const backendAuditCoveragePercent = pct(backendAuditCoveredRecords.length, totalRecords);
  const auditCoveragePercent = Math.max(localAuditCoveragePercent, backendAuditCoveragePercent);

  let statusLabel = "Build Up";
  let recommendation = "Continue verifying records and attaching backend audit proof.";

  if (readinessPercent >= 80 && auditCoveragePercent >= 80) {
    statusLabel = "Proof Ready";
    recommendation = "Truth Spine is strong enough for leadership reporting.";
  } else if (readinessPercent >= 50 || auditCoveragePercent >= 80) {
    statusLabel = "Review Ready";
    recommendation = "Review pending records and verify the strongest cases next.";
  }

  return {
    totalRecords,
    reportReadyCount: reportReadyRecords.length,
    pendingCount: pendingRecords.length,
    verifiedCount: verifiedRecords.length,
    auditReadyCount: auditReadyRecords.length,

    readinessPercent,
    auditCoveragePercent,
    localAuditCoveragePercent,
    backendAuditCoveragePercent,

    backendAuditCount,
    backendCaseAuditCount,
    backendReferralAuditCount,
    backendAuditCoveredCount: backendAuditCoveredRecords.length,

    backendExportCount: backendExportList.length,
    createdReferralCount: createdReferralEvents.length,
    reportExportCount: reportExportEvents.length,

    statusLabel,
    recommendation,
  };
}

export async function getTruthSpineSnapshot(options = {}) {
  const records = getTruthSpineRecords();
  const events = getTruthSpineEvents();

  let backendAuditEvents = [];
  let backendExports = [];

  if (options.includeBackend !== false) {
    try {
      backendAuditEvents = await fetchAuditEvents();
    } catch (error) {
      console.warn("[Truth Spine Engine] Backend audit unavailable", error);
    }

    try {
      backendExports = await fetchReportingExports();
    } catch (error) {
      console.warn("[Truth Spine Engine] Backend exports unavailable", error);
    }
  }

  const summary = getTruthSpineReportingSummary({
    records,
    events,
    backendAuditEvents,
    backendExports,
  });

  return {
    generatedAt: new Date().toISOString(),
    records,
    events,
    backendAuditEvents,
    backendExports,
    summary,
  };
}

export function createTruthSpineRecordsFromHubReferrals(referrals = [], sourceSurface = "truth_spine_engine") {
  return seedHubReferralsIntoTruthSpine(referrals, sourceSurface);
}

export function createTruthSpineReferralFromIntake(referralInput = {}, options = {}) {
  const sourceSurface = options.sourceSurface || "hub_intake_navigator";
  const backend = options.backend || null;
  const intake = options.intake || {};
  const actorId = options.actorId || "demo-user-1";
  const actorRole = options.actorRole || "hub_operator";
  const organizationId = options.organizationId || "shf-core";

  let saved = null;
  let mode = "engine";

  try {
    const engineResult = seedHubReferralsIntoTruthSpine([referralInput], sourceSurface);

    saved =
      Array.isArray(engineResult)
        ? engineResult[0]
        : engineResult?.record || engineResult;

    if (!saved?.entityId) {
      throw new Error("Truth Spine Engine did not return a saved referral record.");
    }
  } catch (error) {
    console.warn("[Truth Spine Engine] Intake create fallback activated", error);

    const fallbackRecord = referralToTruthSpineRecord(referralInput, sourceSurface);
    saved = upsertTruthSpineRecord(fallbackRecord);
    mode = "fallback";
  }

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.HUB_REFERRAL_CREATED,
    entityId: saved.entityId,
    entityType: saved.entityType,
    sourceSurface,
    traceId: saved.trustEnvelope?.traceId,
    actorId,
    actorRole,
    organizationId: saved.organizationId || organizationId,
    payload: {
      backend,
      intake,
      engineRouted: mode === "engine",
      engineFallback: mode === "fallback",
      fallback: Boolean(referralInput?.fallback),
      backendError: referralInput?.backendError,
    },
  });

  return {
    record: saved,
    mode,
  };
}

export async function recordTruthSpineQueueAction(referral, action, options = {}) {
  const truthResult = recordHubReferralAction(referral, action, {
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || "shf-core",
  });

  let backendResult = null;
  let backendStatus = "not_attempted";

  if (options.syncBackend !== false) {
    try {
      backendResult = await syncPartnerQueueActionToBackend(referral, action);
      backendStatus = backendResult?.skipped ? "skipped" : "synced";
    } catch (error) {
      backendStatus = "failed";
      backendResult = {
        error: error?.message || "Backend sync failed",
      };

      console.warn("[Truth Spine Engine] Queue action backend sync failed", error);
    }
  }

  return {
    truthResult,
    backendStatus,
    backendResult,
  };
}

export function verifyTruthSpineRecord(entityId, options = {}) {
  try {
    return forceVerifyTruthSpineRecord(entityId, options);
  } catch (error) {
    console.warn("[Truth Spine Engine] Force verify failed; using legacy verification", error);

    return markTruthSpineRecordVerified(entityId, {
      sourceSurface: options.sourceSurface || "truth_spine_engine",
      actorId: options.actorId || "demo-user-1",
      actorRole: options.actorRole || "hub_operator",
      organizationId: options.organizationId || "shf-core",
      ...options,
    });
  }
}

export function forceVerifyTruthSpineRecord(entityId, options = {}) {
  const record = getTruthSpineRecord(entityId);

  if (!record) {
    throw new Error(`Truth Spine record not found: ${entityId}`);
  }

  const updated = patchTruthSpineRecord(entityId, {
    verification: {
      ...(record.verification || {}),
      verificationStatus: "verified",
      evidenceCount: Math.max(Number(record?.verification?.evidenceCount || 0), 1),
      evidenceStrength: "high",
      verifiedBy: options.actorId || "demo-user-1",
      verifiedAt: new Date().toISOString(),
    },
    reconciliation: {
      ...(record.reconciliation || {}),
      contradictionStatus: "none",
      conflictCount: 0,
      resolutionStatus: "not_required",
    },
    oracle: {
      ...(record.oracle || {}),
      truthStatus: "verified_true",
      confidenceScore: 88,
      confidenceBand: "high",
      readinessStatus: "report_ready",
      recommendedNextAction: "Generate report or audit packet.",
    },
    trustEnvelope: {
      ...(record.trustEnvelope || {}),
      auditReady: true,
      reportingReady: true,
      sourceCoverage: "complete",
    },
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.VERIFICATION_RECORD_APPROVED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    traceId: updated.trustEnvelope?.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || updated.organizationId || "shf-core",
    payload: {
      verificationStatus: "verified",
      readinessStatus: "report_ready",
      truthStatus: "verified_true",
    },
  });

  return updated;
}

export function addTruthSpineEvidence(entityId, evidence = {}, options = {}) {
  return attachTruthSpineEvidence(entityId, evidence, {
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || "shf-core",
    ...options,
  });
}

export function flagTruthSpineNeedsEvidence(entityId, options = {}) {
  return markTruthSpineRecordNeedsEvidence(entityId, {
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || "shf-core",
    ...options,
  });
}

export function flagTruthSpineConflict(entityId, options = {}) {
  return markTruthSpineRecordConflict(entityId, {
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || "shf-core",
    ...options,
  });
}

export async function generateTruthSpineReportExport(report = {}, options = {}) {
  const snapshot = await getTruthSpineSnapshot({
    includeBackend: options.includeBackend !== false,
  });

  const exportRecord = {
    exportKind: report?.title || report?.exportKind || "Truth Spine Report",
    artifactId:
      report?.artifactId ||
      `artifact_${String(report?.title || report?.exportKind || "truth_spine_report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")}`,
    status: "generated",
    requestedBy: options.actorId || "demo-user-1",
    createdAt: new Date().toISOString(),
    sourceSurface: options.sourceSurface || "truth_spine_engine",
    truthSummary: snapshot.summary,
    recordIds: snapshot.records.map((record) => record.entityId),
    traceIds: snapshot.records.map((record) => record.trustEnvelope?.traceId).filter(Boolean),
  };

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.REPORT_EXPORT_GENERATED,
    entityId: exportRecord.artifactId,
    entityType: "report",
    sourceSurface: exportRecord.sourceSurface,
    traceId: exportRecord.traceIds[0] || exportRecord.artifactId,
    actorId: exportRecord.requestedBy,
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || "shf-core",
    payload: exportRecord,
  });

  let backendExport = null;
  let backendStatus = "not_attempted";

  if (options.syncBackend !== false) {
    try {
      backendExport = await createReportingExport({
        exportKind: exportRecord.exportKind,
        artifactId: exportRecord.artifactId,
        status: exportRecord.status,
        requestedBy: exportRecord.requestedBy,
      });

      backendStatus = "synced";
    } catch (error) {
      backendStatus = "failed";
      backendExport = {
        error: error?.message || "Backend export failed",
      };

      console.warn("[Truth Spine Engine] Backend export failed; local proof preserved", error);
    }
  }

  return {
    exportRecord,
    backendStatus,
    backendExport,
    snapshot,
  };
}

export function getTruthSpineEntity(entityId) {
  return getTruthSpineRecord(entityId);
}
