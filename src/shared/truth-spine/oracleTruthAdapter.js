import { patchTruthSpineRecord } from "./truthSpineStore.js";
import { appendTruthSpineEvent, EVENT_TYPES } from "./truthSpineEvents.js";
import { calculateOracleTruth } from "./reportingReadiness.js";

export function generateOracleTruth(record, options = {}) {
  const oracle = calculateOracleTruth(record);
  const updated = patchTruthSpineRecord(record.entityId, { oracle });

  appendTruthSpineEvent({
    eventType: EVENT_TYPES.ORACLE_TRUTH_GENERATED,
    entityId: updated.entityId,
    entityType: updated.entityType,
    sourceSurface: options.sourceSurface || "oracle_truth_adapter",
    traceId: updated.trustEnvelope.traceId,
    payload: {
      oracle,
    },
  });

  return updated;
}

export function recommendOracleAction(record) {
  const oracle = calculateOracleTruth(record);
  return {
    entityId: record.entityId,
    readinessStatus: oracle.readinessStatus,
    recommendedNextAction: oracle.recommendedNextAction,
    confidenceScore: oracle.confidenceScore,
    confidenceBand: oracle.confidenceBand,
  };
}
