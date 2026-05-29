import { normalizePublicationMode } from "./reporting-readiness";

export function buildOracleReportingGate(oracleTruth: any, options: { publicationMode?: string } = {}) {
  const reasons: string[] = [];
  const publicationMode = normalizePublicationMode(
    options.publicationMode ||
      oracleTruth?.trustEnvelope?.publicationMode ||
      oracleTruth?.publicationMode ||
      "internal"
  );

  if (!oracleTruth) reasons.push("oracle_missing");
  if (!oracleTruth?.trustEnvelope) reasons.push("trust_envelope_missing");

  const truthStatus = String(oracleTruth?.truthStatus || "unknown").toLowerCase();
  const verificationStatus = String(oracleTruth?.verificationStatus || "unknown").toLowerCase();
  const contradiction = String(oracleTruth?.contradictionStatus || "none").toLowerCase();
  const readiness = String(oracleTruth?.readinessStatus || "unknown").toLowerCase();
  const confidenceScore = Number(oracleTruth?.confidenceScore || 0);

  if (!publicationMode) {
    reasons.push("publication_mode_invalid");
  }

  if (truthStatus !== "certified") {
    reasons.push(`oracle_truth_${truthStatus}`);
  }

  if (verificationStatus !== "verified") {
    reasons.push(`oracle_verification_${verificationStatus}`);
  }

  if (contradiction !== "none" && contradiction !== "resolved") {
    reasons.push(`oracle_contradiction_${contradiction}`);
  }

  if (readiness === "blocked" || readiness === "not_ready" || readiness === "unknown") {
    reasons.push(`oracle_readiness_${readiness}`);
  }

  if (publicationMode === "public_safe" && confidenceScore < 90) {
    reasons.push(`oracle_confidence_public_${confidenceScore}`);
  }

  if (publicationMode === "deidentified_funder" && confidenceScore < 75) {
    reasons.push(`oracle_confidence_funder_${confidenceScore}`);
  }

  if (
    (publicationMode === "leadership" || publicationMode === "partner_scoped") &&
    confidenceScore < 55
  ) {
    reasons.push(`oracle_confidence_leadership_${confidenceScore}`);
  }

  return {
    allowed: reasons.length === 0,
    reasons: Array.from(new Set(reasons)),
    label: reasons.length === 0 ? "ORACLE LOCKED" : "ORACLE BLOCKED",
  };
}

export function ensureOracleExportAllowed(oracleTruth: any, options: { publicationMode?: string } = {}) {
  const gate = buildOracleReportingGate(oracleTruth, options);
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
