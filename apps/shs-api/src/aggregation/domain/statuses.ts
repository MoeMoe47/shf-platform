export const RECORD_STATES = [
  "raw",
  "normalized",
  "matched",
  "unresolved",
  "reconciled",
  "verified",
  "published",
  "superseded",
  "excluded",
] as const;

export const VERIFICATION_STATES = [
  "verified",
  "provisionally_verified",
  "self_reported",
  "estimated",
  "incomplete_evidence",
  "disputed",
] as const;

export const PUBLICATION_MODES = [
  "internal_operational",
  "leadership_restricted",
  "partner_scoped",
  "deidentified_funder",
  "public_safe_aggregate",
] as const;
