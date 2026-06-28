const DANGEROUS_TRUE_KEYS = [
  "public_approved",
  "truth_spine_claim_created",
  "shf_impact_data_mutated",
  "live_connection_enabled",
  "credential_required",
  "external_api_called",
];

export const DIRECT_SOURCE_PROOF_SAFETY_COPY =
  "Direct Connect Batch 2 is direct-source proof only. It does not connect to bank accounts, external systems, credentials, APIs, or payment systems.";

export function applyDirectSourceProofSafetyDefaults(proof = {}) {
  return {
    ...proof,
    visibility: "internal_only",
    safe_for_shf_public_surface: false,
    public_approved: false,
    truth_spine_claim_created: false,
    shf_impact_data_mutated: false,
    live_connection_enabled: false,
    credential_required: false,
    external_api_called: false,
  };
}

export function calculateDirectSourceProofReadiness(proof = {}, evidenceRefs = []) {
  const safeProof = applyDirectSourceProofSafetyDefaults(proof);
  const refs = Array.isArray(evidenceRefs) ? evidenceRefs : [];
  const blockers = [];
  const warnings = [];
  let readiness_score = 100;

  if (!safeProof.source_owner) {
    readiness_score -= 25;
    blockers.push("missing_source_owner");
  }
  if (!safeProof.source_reference && refs.length === 0) {
    readiness_score -= 20;
    blockers.push("missing_evidence_reference");
  }
  if (!safeProof.source_registry_ref) {
    readiness_score -= 20;
    warnings.push("missing_source_registry_ref");
  }
  if (!safeProof.evidence_package_ref) {
    readiness_score -= 20;
    warnings.push("missing_evidence_package_ref");
  }
  if (safeProof.privacy_status !== "clear") {
    readiness_score -= 20;
    blockers.push("privacy_not_clear");
  }
  if (safeProof.ownership_status !== "clear") {
    readiness_score -= 20;
    blockers.push("ownership_not_clear");
  }
  if (!["verification_ready", "verification_reviewed", "approval_ready"].includes(safeProof.verification_pathway)) {
    readiness_score -= 25;
    warnings.push("verification_pathway_not_ready");
  }

  DANGEROUS_TRUE_KEYS.forEach((key) => {
    if (safeProof[key] === true) {
      readiness_score -= 50;
      blockers.push(`dangerous_flag_true:${key}`);
    }
  });

  readiness_score = Math.max(0, readiness_score);
  const uniqueBlockers = [...new Set([...(safeProof.blockers || []), ...blockers])];
  const uniqueWarnings = [...new Set([...(safeProof.warnings || []), ...warnings])];
  const safe_for_shs_reporting = (
    readiness_score >= 80
    && safeProof.visibility === "internal_only"
    && Boolean(safeProof.source_owner)
    && Boolean(safeProof.source_reference || refs.length)
    && safeProof.privacy_status === "clear"
    && safeProof.ownership_status === "clear"
    && uniqueBlockers.length === 0
    && DANGEROUS_TRUE_KEYS.every((key) => safeProof[key] === false)
  );

  return {
    ...safeProof,
    readiness_score,
    safe_for_shs_reporting,
    safe_for_shf_public_surface: false,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
  };
}
