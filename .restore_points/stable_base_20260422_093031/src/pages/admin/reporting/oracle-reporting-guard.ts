export function buildOracleReportingGate(oracleTruth: any) {
  const reasons: string[] = [];

  if (!oracleTruth) reasons.push("oracle_missing");
  if (!oracleTruth?.trustEnvelope) reasons.push("trust_envelope_missing");

  if ((oracleTruth?.truthStatus || "unknown") !== "certified") {
    reasons.push(`oracle_truth_${oracleTruth?.truthStatus || "unknown"}`);
  }

  const contradiction = String(oracleTruth?.contradictionStatus || "none").toLowerCase();
  if (contradiction !== "none" && contradiction !== "resolved") {
    reasons.push(`oracle_contradiction_${oracleTruth?.contradictionStatus || "unknown"}`);
  }

  const readiness = String(oracleTruth?.readinessStatus || "unknown").toLowerCase();
  if (readiness === "blocked" || readiness === "not_ready" || readiness === "unknown") {
    reasons.push(`oracle_readiness_${oracleTruth?.readinessStatus || "unknown"}`);
  }

  if ((oracleTruth?.confidenceScore || 0) < 90) {
    reasons.push(`oracle_confidence_${oracleTruth?.confidenceScore || 0}`);
  }

  return {
    allowed: reasons.length === 0,
    reasons,
    label: reasons.length === 0 ? "ORACLE LOCKED" : "ORACLE BLOCKED",
  };
}

export function ensureOracleExportAllowed(oracleTruth: any) {
  const gate = buildOracleReportingGate(oracleTruth);
  if (!gate.allowed) {
    throw new Error(`Oracle export blocked: ${gate.reasons.join(", ")}`);
  }
  return gate;
}

export function withOracleExportMetadata(record: any, oracleTruth: any, selectedEntityId?: string | null) {
  return {
    ...record,
    entityId: selectedEntityId || oracleTruth?.entityId || record?.entityId || "unknown_entity",
    oracleTruthStatus: oracleTruth?.truthStatus || "unknown",
    oracleConfidenceScore: oracleTruth?.confidenceScore ?? null,
    oracleReadinessStatus: oracleTruth?.readinessStatus || "unknown",
    oracleContradictionStatus: oracleTruth?.contradictionStatus || "unknown",
    oracleRecommendedNextAction: oracleTruth?.recommendedNextAction || "—",
    trustEnvelopePresent: Boolean(oracleTruth?.trustEnvelope),
    trustEnvelope: oracleTruth?.trustEnvelope || null,
    traceId: oracleTruth?.traceId || oracleTruth?.trustEnvelope?.traceId || null,
  };
}
