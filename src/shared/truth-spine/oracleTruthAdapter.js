import { patchTruthSpineRecord } from "./truthSpineStore.js";
import { appendTruthSpineEvent, EVENT_TYPES } from "./truthSpineEvents.js";
import { calculateOracleTruth } from "./reportingReadiness.js";
import { buildTrustEnvelope } from "./auditTrace.js";
import { nowIso } from "./truthSpineTypes.js";

export function buildFrontendTruthPackage(record = {}, options = {}) {
  const oracle = calculateOracleTruth(record);
  const traceId =
    options.traceId ||
    record?.traceId ||
    record?.trustEnvelope?.traceId ||
    `trace_${record?.entityId || "unknown_entity"}`;

  const trustEnvelope = buildTrustEnvelope(
    {
      ...record,
      oracle: {
        ...oracle,
        traceId,
      },
    },
    {
      traceId,
      truthStatus: oracle.truthStatus,
      confidenceScore: oracle.confidenceScore,
      confidenceBand: oracle.confidenceBand,
      verificationStatus: oracle.verificationStatus,
      contradictionStatus: oracle.contradictionStatus,
      readinessStatus: oracle.readinessStatus,
      unresolvedItemsCount: oracle.unresolvedItems?.length || 0,
      warnings: oracle.unresolvedItems || [],
      publicationMode: options.publicationMode || record?.trustEnvelope?.publicationMode || "internal",
    }
  );

  return {
    entityId: record?.entityId || options.entityId || "unknown_entity",
    entityType: record?.entityType || options.entityType || "case",

    truthStatus: oracle.truthStatus,
    confidenceScore: oracle.confidenceScore,
    confidenceBand: oracle.confidenceBand,

    verificationStatus: oracle.verificationStatus,
    contradictionStatus: oracle.contradictionStatus,
    readinessStatus: oracle.readinessStatus,

    sourceSummary: oracle.sourceSummary || ["frontend_truth_spine"],
    unresolvedItems: oracle.unresolvedItems || [],

    recommendedNextAction: oracle.recommendedNextAction,
    lastTruthRefresh: nowIso(),
    traceId,
    trustEnvelope,
  };
}

export function generateOracleTruth(record, options = {}) {
  const truthPackage = buildFrontendTruthPackage(record, options);

  const updated = patchTruthSpineRecord(record.entityId, {
    oracle: {
      truthStatus: truthPackage.truthStatus,
      confidenceScore: truthPackage.confidenceScore,
      confidenceBand: truthPackage.confidenceBand,
      verificationStatus: truthPackage.verificationStatus,
      contradictionStatus: truthPackage.contradictionStatus,
      readinessStatus: truthPackage.readinessStatus,
      recommendedNextAction: truthPackage.recommendedNextAction,
      sourceSummary: truthPackage.sourceSummary,
      unresolvedItems: truthPackage.unresolvedItems,
      traceId: truthPackage.traceId,
      trustEnvelope: truthPackage.trustEnvelope,
    },
    trustEnvelope: truthPackage.trustEnvelope,
    traceId: truthPackage.traceId,
  });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.ORACLE_TRUTH_GENERATED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "oracle_truth_adapter",
    traceId: updated.trustEnvelope?.traceId || truthPackage.traceId,
    payload: {
      oracle: updated.oracle,
      trustEnvelope: updated.trustEnvelope,
    },
  });

  return updated;
}

export function recommendOracleAction(record) {
  const truthPackage = buildFrontendTruthPackage(record);
  return {
    entityId: truthPackage.entityId,
    readinessStatus: truthPackage.readinessStatus,
    recommendedNextAction: truthPackage.recommendedNextAction,
    confidenceScore: truthPackage.confidenceScore,
    confidenceBand: truthPackage.confidenceBand,
    truthStatus: truthPackage.truthStatus,
    verificationStatus: truthPackage.verificationStatus,
    contradictionStatus: truthPackage.contradictionStatus,
  };
}
