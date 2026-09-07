export const CLAIM_LIFECYCLE_STATES = [
  "DRAFT", "SUBMITTED", "UNDER_REVIEW", "EVIDENCE_INCOMPLETE", "READY_FOR_VERIFICATION",
  "VERIFIED", "PARTIALLY_VERIFIED", "REJECTED", "SUPERSEDED", "WITHDRAWN",
] as const;
export const VERIFICATION_STATUSES = ["PENDING", "IN_PROGRESS", "NEEDS_EVIDENCE", "NEEDS_REVIEW", "PASSED", "PARTIAL", "FAILED", "INCONCLUSIVE", "SUPERSEDED", "CANCELLED"] as const;
export const VERIFICATION_LEVELS = ["V0", "V1", "V2", "V3", "V4", "V5"] as const;
export const VERIFICATION_MODES = ["HUMAN", "AUTOMATED", "HYBRID"] as const;
export const EVIDENCE_LINK_RELATIONSHIPS = ["PRIMARY", "SUPPORTING", "CORROBORATING", "CONTRADICTORY", "EXCEPTION", "CONTEXT"] as const;
export const ADMISSIBILITY_DECISIONS = ["ADMISSIBLE", "MISSING_PROVENANCE", "SOURCE_NOT_AUTHORIZED", "PURPOSE_NOT_ALLOWED", "STALE", "SUPERSEDED", "CLASSIFICATION_DENIED", "INTEGRITY_UNVERIFIED", "SUBJECT_MISMATCH", "INCOMPLETE"] as const;

export const GPA_VERIFICATION_CODES = {
  CLAIM_NOT_FOUND: "GPA_CLAIM_NOT_FOUND",
  CLAIM_STATE_INVALID: "GPA_CLAIM_STATE_INVALID",
  EVIDENCE_REQUIRED: "GPA_EVIDENCE_REQUIRED",
  EVIDENCE_NOT_ADMISSIBLE: "GPA_EVIDENCE_NOT_ADMISSIBLE",
  METHOD_NOT_FOUND: "GPA_VERIFICATION_METHOD_NOT_FOUND",
  METHOD_INACTIVE: "GPA_VERIFICATION_METHOD_INACTIVE",
  METHOD_EXPIRED: "GPA_VERIFICATION_METHOD_EXPIRED",
  METHOD_INELIGIBLE: "GPA_VERIFICATION_METHOD_INELIGIBLE",
  LEVEL_UNSUPPORTED: "GPA_VERIFICATION_LEVEL_UNSUPPORTED",
  LEVEL_NOT_EARNED: "GPA_VERIFICATION_LEVEL_NOT_EARNED",
  SELF_VERIFICATION_DENIED: "GPA_SELF_VERIFICATION_DENIED",
  REVIEW_REQUIRED: "GPA_VERIFICATION_REVIEW_REQUIRED",
  CONTRADICTION_BLOCKING: "GPA_CONTRADICTION_BLOCKING",
  WORK_ITEM_NOT_FOUND: "GPA_VERIFICATION_WORK_ITEM_NOT_FOUND",
} as const;

export const VERIFICATION_LEVEL_REQUIREMENTS: Record<string, string> = {
  V0: "Claim exists and is reported; no independent support is required.",
  V1: "Supporting documentation exists and is linked to the claim.",
  V2: "Linked evidence passes admissibility and validation checks.",
  V3: "Independent corroborating evidence or method is present where required.",
  V4: "An authoritative source or equivalent authoritative method confirms the claim.",
  V5: "An audit-grade method and final attributable determination are present.",
};

export function levelRank(level: string | null | undefined) {
  const index = VERIFICATION_LEVELS.indexOf(String(level || "V0") as any);
  return index < 0 ? -1 : index;
}

export function maxAchievableLevel(input: { evidenceCount: number; admissibleCount: number; corroboratingCount: number; authoritativeCount: number; auditGrade: boolean }) {
  if (input.auditGrade && input.admissibleCount > 0) return "V5";
  if (input.authoritativeCount > 0 && input.admissibleCount > 0) return "V4";
  if (input.corroboratingCount > 1 && input.admissibleCount > 0) return "V3";
  if (input.admissibleCount > 0) return "V2";
  if (input.evidenceCount > 0) return "V1";
  return "V0";
}
