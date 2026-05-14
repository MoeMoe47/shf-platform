import {
  CONTRADICTION_STATUSES,
  PUBLICATION_MODES,
  SOURCE_SYSTEMS,
  TRUTH_ENTITY_TYPES,
  VERIFICATION_STATUSES,
  makeTraceId,
  nowIso,
} from "./truthSpineTypes.js";
import { buildTrustEnvelope } from "./auditTrace.js";
import { calculateOracleTruth, calculateReportingReadiness } from "./reportingReadiness.js";

export const TRUTH_SPINE_RECORD_KEY = "shs_truth_spine_records_v1";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // dev-safe no-op
  }
  return value;
}

export function createBaseTruthSpineRecord(input = {}) {
  const entityId = input.entityId || input.id || `hub_referral_${Date.now()}`;
  const traceId = input.traceId || makeTraceId();

  const base = {
    version: "v1",
    entityId,
    entityType: input.entityType || TRUTH_ENTITY_TYPES.REFERRAL,
    sourceSystem: input.sourceSystem || SOURCE_SYSTEMS.HUB,
    sourceSurface: input.sourceSurface || "unknown_surface",
    currentStatus: input.currentStatus || input.status || "open",
    title: input.title || input.name || input.needCategory || "Hub referral",
    summary: input.summary || input.notes || "",
    partnerId: input.partnerId || input.receiverId || null,
    organizationId: input.organizationId || "shf-core",
    createdAt: input.createdAt || nowIso(),
    updatedAt: nowIso(),

    aggregation: {
      normalized: true,
      lineageId: input.lineageId || `lin_${entityId}`,
      sourceIds: input.sourceIds || [entityId],
      freshnessStatus: input.freshnessStatus || "current",
    },

    verification: {
      verificationStatus: input.verificationStatus || VERIFICATION_STATUSES.PENDING,
      evidenceCount: Number(input.evidenceCount || 0),
      evidenceStrength: input.evidenceStrength || "low",
      verifiedBy: input.verifiedBy || null,
      verifiedAt: input.verifiedAt || null,
    },

    reconciliation: {
      contradictionStatus: input.contradictionStatus || CONTRADICTION_STATUSES.NONE,
      conflictCount: Number(input.conflictCount || 0),
      resolutionStatus: input.resolutionStatus || "not_required",
    },

    oracle: {
      truthStatus: "pending",
      confidenceScore: 0,
      confidenceBand: "low",
      readinessStatus: "not_ready",
      recommendedNextAction: "Attach evidence before reporting.",
    },

    trustEnvelope: {
      traceId,
      auditReady: false,
      reportingReady: false,
      sourceCoverage: "partial",
      publicationMode: PUBLICATION_MODES.INTERNAL,
    },

    raw: input.raw || null,
  };

  const oracle = calculateOracleTruth(base);
  const readiness = calculateReportingReadiness({ ...base, oracle });
  const trustEnvelope = buildTrustEnvelope(
    { ...base, oracle },
    {
      traceId,
      auditReady: readiness.auditReady,
      reportingReady: readiness.reportingReady,
      sourceCoverage: "partial",
      publicationMode: PUBLICATION_MODES.INTERNAL,
    }
  );

  return {
    ...base,
    oracle,
    trustEnvelope,
  };
}

export function normalizeTruthSpineRecord(record) {
  const base = createBaseTruthSpineRecord(record);
  const merged = {
    ...base,
    ...record,
    aggregation: { ...base.aggregation, ...(record?.aggregation || {}) },
    verification: { ...base.verification, ...(record?.verification || {}) },
    reconciliation: { ...base.reconciliation, ...(record?.reconciliation || {}) },
    oracle: { ...base.oracle, ...(record?.oracle || {}) },
    trustEnvelope: { ...base.trustEnvelope, ...(record?.trustEnvelope || {}) },
    updatedAt: nowIso(),
  };

  const oracle = calculateOracleTruth(merged);
  const readiness = calculateReportingReadiness({ ...merged, oracle });
  const trustEnvelope = buildTrustEnvelope(
    { ...merged, oracle },
    {
      traceId: merged.trustEnvelope.traceId,
      auditReady: readiness.auditReady,
      reportingReady: readiness.reportingReady,
      sourceCoverage: merged.trustEnvelope.sourceCoverage,
      publicationMode: merged.trustEnvelope.publicationMode,
    }
  );

  return {
    ...merged,
    oracle,
    trustEnvelope,
  };
}

export function getTruthSpineRecords() {
  const records = readJson(TRUTH_SPINE_RECORD_KEY, []);
  return Array.isArray(records) ? records.map(normalizeTruthSpineRecord) : [];
}

export function saveTruthSpineRecords(records) {
  const normalized = Array.isArray(records) ? records.map(normalizeTruthSpineRecord) : [];
  return writeJson(TRUTH_SPINE_RECORD_KEY, normalized);
}

export function upsertTruthSpineRecord(record) {
  const normalized = normalizeTruthSpineRecord(record);
  const existing = getTruthSpineRecords();
  const without = existing.filter((item) => item.entityId !== normalized.entityId);
  const next = [normalized, ...without];
  saveTruthSpineRecords(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("shs:truth-spine-record-updated", { detail: normalized }));
  }

  return normalized;
}

export function patchTruthSpineRecord(entityId, patch = {}) {
  const existing = getTruthSpineRecords();
  const current = existing.find((item) => item.entityId === entityId);

  if (!current) {
    return upsertTruthSpineRecord({ entityId, ...patch });
  }

  return upsertTruthSpineRecord({
    ...current,
    ...patch,
    aggregation: { ...current.aggregation, ...(patch.aggregation || {}) },
    verification: { ...current.verification, ...(patch.verification || {}) },
    reconciliation: { ...current.reconciliation, ...(patch.reconciliation || {}) },
    oracle: { ...current.oracle, ...(patch.oracle || {}) },
    trustEnvelope: { ...current.trustEnvelope, ...(patch.trustEnvelope || {}) },
    updatedAt: nowIso(),
  });
}

export function getTruthSpineRecord(entityId) {
  return getTruthSpineRecords().find((item) => item.entityId === entityId) || null;
}
