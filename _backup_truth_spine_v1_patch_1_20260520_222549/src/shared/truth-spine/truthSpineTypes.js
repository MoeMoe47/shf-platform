/**
 * SHS Truth Spine V1
 * Official frontend/dev contract.
 *
 * No-drift rule:
 * This file defines the shared shape only. It does not change any page layout,
 * route, CSS, or visual mock.
 */

export const TRUTH_SPINE_VERSION = "v1";

export const TRUTH_ENTITY_TYPES = Object.freeze({
  REFERRAL: "referral",
  PARTNER: "partner",
  ORGANIZATION: "organization",
  OUTCOME: "outcome",
  REPORT: "report",
  CASE: "case",
});

export const SOURCE_SYSTEMS = Object.freeze({
  HUB: "hub",
  SHS: "shs",
  SHF: "shf",
  VERIFIED_RX: "verifiedrx",
  KERMIT: "kermit",
  MANUAL: "manual",
});

export const VERIFICATION_STATUSES = Object.freeze({
  NOT_STARTED: "not_started",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  REVIEW_REQUIRED: "review_required",
});

export const CONTRADICTION_STATUSES = Object.freeze({
  NONE: "none",
  ACTIVE: "active",
  RESOLVED: "resolved",
  NOT_REQUIRED: "not_required",
});

export const TRUTH_STATUSES = Object.freeze({
  PENDING: "pending",
  LIKELY_TRUE: "likely_true",
  VERIFIED_TRUE: "verified_true",
  CONFLICTED: "conflicted",
  NOT_READY: "not_ready",
});

export const READINESS_STATUSES = Object.freeze({
  NOT_READY: "not_ready",
  REVIEW_REQUIRED: "review_required",
  BLOCKED: "blocked",
  REPORT_READY: "report_ready",
  EXECUTION_MODE: "execution_mode",
});

export const CONFIDENCE_BANDS = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
});

export const PUBLICATION_MODES = Object.freeze({
  INTERNAL: "internal",
  LEADERSHIP: "leadership",
  PARTNER_SCOPED: "partner_scoped",
  FUNDER_SAFE: "funder_safe",
  PUBLIC_SAFE: "public_safe",
});

export const EVENT_TYPES = Object.freeze({
  HUB_REFERRAL_CREATED: "hub.referral.created",
  HUB_REFERRAL_ASSIGNED: "hub.referral.assigned",
  HUB_REFERRAL_REVIEW_STARTED: "hub.referral.review_started",
  HUB_REFERRAL_HOLD_ADDED: "hub.referral.hold_added",
  HUB_REFERRAL_RESOLVED: "hub.referral.resolved",
  HUB_REFERRAL_CLOSED: "hub.referral.closed",
  HUB_REFERRAL_ESCALATED: "hub.referral.escalated",

  VERIFICATION_PACKAGE_CREATED: "verification.package.created",
  VERIFICATION_RECORD_APPROVED: "verification.record.approved",
  VERIFICATION_RECORD_REJECTED: "verification.record.rejected",

  RECONCILIATION_CONFLICT_DETECTED: "reconciliation.conflict.detected",
  RECONCILIATION_CONFLICT_RESOLVED: "reconciliation.conflict.resolved",

  ORACLE_TRUTH_GENERATED: "oracle.truth.generated",
  ORACLE_ACTION_RECOMMENDED: "oracle.action.recommended",
  ORACLE_ACTION_RECORDED: "oracle.action.recorded",

  REPORT_READINESS_UPDATED: "report.readiness.updated",
  REPORT_EXPORT_GENERATED: "report.export.generated",

  AUDIT_TRACE_CREATED: "audit.trace.created",
});

export function makeTraceId(prefix = "trace") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function makeEventId(prefix = "evt") {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}
