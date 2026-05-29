// ========================================
// SHS TRUTH SPINE — FRONTEND STATUS CONTRACT
// Aligned to backend Oracle domain/types.ts
// V1 rule: backend Oracle language is the source of truth.
// ========================================

export const TRUTH_STATUSES = Object.freeze({
  UNKNOWN: "unknown",
  CANDIDATE: "candidate",
  CERTIFIED: "certified",
  DISPUTED: "disputed",
  BLOCKED: "blocked",
  STALE: "stale",

  // Backward-compatible aliases. Do not use for new code.
  PENDING: "candidate",
  LIKELY_TRUE: "candidate",
  VERIFIED_TRUE: "certified",
  CONFLICTED: "disputed",
});

export const VERIFICATION_STATUSES = Object.freeze({
  UNREVIEWED: "unreviewed",
  IN_REVIEW: "in_review",
  VERIFIED: "verified",
  INSUFFICIENT_EVIDENCE: "insufficient_evidence",
  REJECTED: "rejected",

  // Backward-compatible aliases. Do not use for new code.
  PENDING: "unreviewed",
  REVIEW_REQUIRED: "in_review",
});

export const CONTRADICTION_STATUSES = Object.freeze({
  NONE: "none",
  MINOR_CONFLICT: "minor_conflict",
  UNRESOLVED_CONFLICT: "unresolved_conflict",
  ESCALATED: "escalated",
  RESOLVED: "resolved",

  // Backward-compatible aliases. Do not use for new code.
  ACTIVE: "unresolved_conflict",
});

export const READINESS_STATUSES = Object.freeze({
  NOT_READY: "not_ready",
  INTERNALLY_READY: "internally_ready",
  LEADERSHIP_READY: "leadership_ready",
  FUNDER_READY: "funder_ready",
  PUBLIC_READY: "public_ready",
  BLOCKED: "blocked",

  // Backward-compatible aliases. Do not use for new code.
  REVIEW_REQUIRED: "not_ready",
  REPORT_READY: "leadership_ready",
  READY: "leadership_ready",
});

export const PUBLICATION_MODES = Object.freeze({
  INTERNAL: "internal",
  LEADERSHIP: "leadership",
  PARTNER_SCOPED: "partner_scoped",
  DEIDENTIFIED_FUNDER: "deidentified_funder",
  PUBLIC_SAFE: "public_safe",

  // Backward-compatible aliases. Do not use for new code.
  ADMIN_INTERNAL: "internal",
  OPERATOR: "internal",
});

export const CONFIDENCE_BANDS = Object.freeze({
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  VERY_HIGH: "very_high",

  // Backward-compatible alias.
  MEDIUM: "moderate",
});


// ---------- STRUCTURAL ENTITY TYPES ----------
// Kept for frontend Truth Spine store compatibility.
// These do not override Oracle truth status language.
export const TRUTH_ENTITY_TYPES = Object.freeze({
  CASE: "case",
  REFERRAL: "referral",
  PARTICIPANT: "participant",
  PERSON: "person",
  ORGANIZATION: "organization",
  PROGRAM: "program",
  OUTCOME: "outcome",
  METRIC: "metric",
  REPORT: "report",
  AUDIT_EVENT: "audit_event",
  TRUST_ENVELOPE: "trust_envelope",
  UNKNOWN: "unknown",
});

// ---------- SOURCE SYSTEMS ----------
// Kept for source intake / trace compatibility.
export const SOURCE_SYSTEMS = Object.freeze({
  MANUAL: "manual",
  HUB: "hub",
  SHF: "shf",
  SHS: "shs",
  AGGREGATION_LAYER: "aggregation_layer",
  VERIFICATION_LAYER: "verification_layer",
  ORACLE_LAYER: "oracle_layer",
  REPORTING_LAYER: "reporting_layer",
  AI_ANALYST: "ai_analyst",
  PARTNER_UPLOAD: "partner_upload",
  CSV_UPLOAD: "csv_upload",
  API: "api",
  WEBHOOK: "webhook",
  UNKNOWN: "unknown",
});

export function nowIso() {
  return new Date().toISOString();
}

export function makeTraceId(prefix = "trace") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeTruthStatus(value) {
  const next = String(value || "").toLowerCase();
  if (next === "verified_true") return TRUTH_STATUSES.CERTIFIED;
  if (next === "likely_true") return TRUTH_STATUSES.CANDIDATE;
  if (next === "conflicted") return TRUTH_STATUSES.DISPUTED;
  if (Object.values(TRUTH_STATUSES).includes(next)) return next;
  return TRUTH_STATUSES.UNKNOWN;
}

export function normalizeVerificationStatus(value) {
  const next = String(value || "").toLowerCase();
  if (next === "pending") return VERIFICATION_STATUSES.UNREVIEWED;
  if (next === "review_required") return VERIFICATION_STATUSES.IN_REVIEW;
  if (Object.values(VERIFICATION_STATUSES).includes(next)) return next;
  return VERIFICATION_STATUSES.UNREVIEWED;
}

export function normalizeContradictionStatus(value) {
  const next = String(value || "").toLowerCase();
  if (next === "active") return CONTRADICTION_STATUSES.UNRESOLVED_CONFLICT;
  if (Object.values(CONTRADICTION_STATUSES).includes(next)) return next;
  return CONTRADICTION_STATUSES.NONE;
}

export function normalizeReadinessStatus(value) {
  const next = String(value || "").toLowerCase();
  if (next === "report_ready") return READINESS_STATUSES.LEADERSHIP_READY;
  if (next === "review_required") return READINESS_STATUSES.NOT_READY;
  if (next === "needs_review") return READINESS_STATUSES.NOT_READY;
  if (next === "execution_mode") return READINESS_STATUSES.LEADERSHIP_READY;
  if (next === "verification_hold") return READINESS_STATUSES.NOT_READY;
  if (Object.values(READINESS_STATUSES).includes(next)) return next;
  return READINESS_STATUSES.NOT_READY;
}

export function normalizeConfidenceBand(value) {
  const next = String(value || "").toLowerCase();
  if (next === "medium") return CONFIDENCE_BANDS.MODERATE;
  if (Object.values(CONFIDENCE_BANDS).includes(next)) return next;
  return CONFIDENCE_BANDS.LOW;
}

export function getConfidenceBand(score = 0) {
  const numeric = Number(score) || 0;
  if (numeric >= 90) return CONFIDENCE_BANDS.VERY_HIGH;
  if (numeric >= 75) return CONFIDENCE_BANDS.HIGH;
  if (numeric >= 55) return CONFIDENCE_BANDS.MODERATE;
  return CONFIDENCE_BANDS.LOW;
}
