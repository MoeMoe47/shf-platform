import { patchTruthSpineRecord, getTruthSpineRecord } from "./truthSpineStore.js";
import { appendTruthSpineEvent, EVENT_TYPES } from "./truthSpineEvents.js";
import { VERIFICATION_STATUSES, CONTRADICTION_STATUSES, nowIso } from "./truthSpineTypes.js";

function ensureRecord(entityId) {
  const record = getTruthSpineRecord(entityId);
  if (!record) {
    throw new Error(`Truth Spine record not found: ${entityId}`);
  }
  return record;
}

export function attachTruthSpineEvidence(entityId, evidence = {}, options = {}) {
  const record = ensureRecord(entityId);
  const currentEvidenceCount = Number(record?.verification?.evidenceCount || 0);
  const nextEvidenceCount = currentEvidenceCount + 1;

  const updated = patchTruthSpineRecord(entityId, {
    verification: {
      ...record.verification,
      verificationStatus:
        nextEvidenceCount > 0
          ? VERIFICATION_STATUSES.REVIEW_REQUIRED
          : VERIFICATION_STATUSES.PENDING,
      evidenceCount: nextEvidenceCount,
      evidenceStrength: evidence.evidenceStrength || options.evidenceStrength || "medium",
      lastEvidenceAt: nowIso(),
    },
    raw: {
      ...(record.raw || {}),
      evidence: [
        ...((record.raw && Array.isArray(record.raw.evidence)) ? record.raw.evidence : []),
        {
          evidenceId: evidence.evidenceId || `evidence_${Date.now()}`,
          evidenceType: evidence.evidenceType || "operator_note",
          label: evidence.label || "Evidence attached",
          source: evidence.source || options.sourceSurface || "truth_spine_verification",
          createdAt: nowIso(),
          payload: evidence.payload || {},
        },
      ],
    },
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.VERIFICATION_PACKAGE_CREATED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "truth_spine_verification",
    traceId: updated.trustEnvelope?.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || updated.organizationId || "shf-core",
    payload: {
      evidence,
      evidenceCount: updated.verification?.evidenceCount,
    },
  });

  return updated;
}

export function markTruthSpineRecordVerified(entityId, options = {}) {
  const record = ensureRecord(entityId);

  const updated = patchTruthSpineRecord(entityId, {
    verification: {
      ...record.verification,
      verificationStatus: VERIFICATION_STATUSES.VERIFIED,
      evidenceCount: Math.max(Number(record?.verification?.evidenceCount || 0), 1),
      evidenceStrength: options.evidenceStrength || record?.verification?.evidenceStrength || "high",
      verifiedBy: options.verifiedBy || options.actorId || "demo-user-1",
      verifiedAt: nowIso(),
    },
    reconciliation: {
      ...record.reconciliation,
      contradictionStatus: CONTRADICTION_STATUSES.NONE,
      conflictCount: 0,
      resolutionStatus: "not_required",
    },
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.VERIFICATION_RECORD_APPROVED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "truth_spine_verification",
    traceId: updated.trustEnvelope?.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || updated.organizationId || "shf-core",
    payload: {
      verificationStatus: updated.verification?.verificationStatus,
      confidenceScore: updated.oracle?.confidenceScore,
      readinessStatus: updated.oracle?.readinessStatus,
    },
  });

  return updated;
}

export function markTruthSpineRecordNeedsEvidence(entityId, options = {}) {
  const record = ensureRecord(entityId);

  const updated = patchTruthSpineRecord(entityId, {
    verification: {
      ...record.verification,
      verificationStatus: VERIFICATION_STATUSES.REVIEW_REQUIRED,
      evidenceStrength: "low",
      missingEvidence: options.missingEvidence || ["supporting_documentation"],
    },
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.VERIFICATION_RECORD_REJECTED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "truth_spine_verification",
    traceId: updated.trustEnvelope?.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || updated.organizationId || "shf-core",
    payload: {
      reason: options.reason || "Additional evidence required",
      missingEvidence: updated.verification?.missingEvidence || [],
    },
  });

  return updated;
}

export function markTruthSpineRecordConflict(entityId, options = {}) {
  const record = ensureRecord(entityId);

  const updated = patchTruthSpineRecord(entityId, {
    reconciliation: {
      ...record.reconciliation,
      contradictionStatus: CONTRADICTION_STATUSES.ACTIVE,
      conflictCount: Math.max(Number(record?.reconciliation?.conflictCount || 0), 1),
      resolutionStatus: "review_required",
      unresolvedItems: options.unresolvedItems || ["conflicting_information"],
    },
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.RECONCILIATION_CONFLICT_DETECTED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "truth_spine_verification",
    traceId: updated.trustEnvelope?.traceId,
    actorId: options.actorId || "demo-user-1",
    actorRole: options.actorRole || "hub_operator",
    organizationId: options.organizationId || updated.organizationId || "shf-core",
    payload: {
      unresolvedItems: updated.reconciliation?.unresolvedItems || [],
      conflictCount: updated.reconciliation?.conflictCount,
    },
  });

  return updated;
}
