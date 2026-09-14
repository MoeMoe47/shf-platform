// NCA-1 — Canonical Notification Contracts, Consolidation & Policy.
//
// Static classification registry for the ~19 real `notification_type`
// values already produced by EVENT_POLICIES in ../service/notification-service.ts.
// This is the concrete, read-time implementation of the mandatory/optional
// model (NCA-0 §31), the urgency model (NCA-0 §32), the attention model
// (NCA-0 §33), and channel eligibility (NCA-0 §39) — all approved as
// architecture-determined or locked by NCA_OWNER_DECISION_LOCK.md.
//
// This registry does not persist anything. It classifies a notification
//_type_ string, computed fresh every time a notification row is read.
// Adding a new EVENT_POLICIES entry without adding a matching row here is
// not an error — classifyNotificationType() falls back to a conservative
// default and logs a warning so the gap is visible, never silent.

import type { NotificationCategory, NotificationChannel, NotificationUrgency } from "./communication-contracts.js";
export type { NotificationCategory } from "./communication-contracts.js";

export interface NotificationClassification {
  category: NotificationCategory;
  actionRequired: boolean;
  urgency: NotificationUrgency;
  /** Today this is always ["IN_APP"] for every real type — no other channel is wired to the general notification path yet (NCA-0 §9/§39). */
  channelEligibility: NotificationChannel[];
}

const IN_APP_ONLY: NotificationChannel[] = ["IN_APP"];

/**
 * Keyed by `notification_type` (the `type` field in EVENT_POLICIES /
 * `notification_type` column), not by `event_type` — several event types
 * share one notification type (e.g. studio.review.routed and
 * studio.review.reassigned both produce REVIEW_ASSIGNED).
 */
const NOTIFICATION_CLASSIFICATION: Record<string, NotificationClassification> = {
  // DGAL / documentation — policies exist today but are not yet reachable
  // (no domain code emits these events; NCA-0 §23, decision lock NCA-D002).
  // Classified now so the projection contract is correct the moment DGAL's
  // own program wires emission — NCA does not add that emission itself.
  DOCUMENTATION_REQUIRED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_CORRECTION_REQUIRED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_SIGNATURE_REQUIRED: { category: "MANDATORY_OPERATIONAL", actionRequired: true, urgency: "critical", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_SIGNATURE_COMPLETE: { category: "TRANSACTIONAL", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_SIGNATURE_EXPIRED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_MANUAL_VERIFICATION: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_MANUAL_CORRECTION: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  DOCUMENTATION_SUPERSEDED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "notice", channelEligibility: IN_APP_ONLY },

  // Studio — the most complete real, wired example (NCA-0 §19).
  REVIEW_ASSIGNED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "notice", channelEligibility: IN_APP_ONLY },
  REVIEW_DECISION: { category: "TRANSACTIONAL", actionRequired: false, urgency: "notice", channelEligibility: IN_APP_ONLY },

  // Credentials.
  CREDENTIAL_EARNED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },
  CREDENTIAL_REVOKED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "warning", channelEligibility: IN_APP_ONLY },

  // Deployment.
  DEPLOYMENT_LIVE: { category: "TRANSACTIONAL", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },
  DEPLOYMENT_FAILED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },

  // Agent registry submission.
  REGISTRY_ACCEPTED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },
  REGISTRY_CHANGES_REQUESTED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  REGISTRY_REJECTED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "warning", channelEligibility: IN_APP_ONLY },
  REGISTRY_FAILED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },

  // Curriculum.
  COMPLETION_ACHIEVED: { category: "OPTIONAL_PRODUCT", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },

  // NCA-5 micro-gap fix: these 7 notification_type values have been
  // produced by EVENT_POLICIES since NCA-4 (CivicSure referrals, ARAG
  // release assurance, Studio QA/handoff) but were never added here, so
  // every one of them was silently falling back to DEFAULT_CLASSIFICATION
  // (OPTIONAL_PRODUCT / not action-required / suppressible) instead of the
  // classification NCA-4's own report already documented for them. That
  // meant a referral or a failed release could be user-suppressed and
  // would never surface in the attention projection as actionable — a real
  // read-time state-mapping defect, not a hypothetical one. Values below
  // match the NCA-4 report's Domain Event Matrix exactly.
  CASE_REFERRAL_RECEIVED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "notice", channelEligibility: IN_APP_ONLY },
  ARAG_ASSURANCE_BLOCKED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  ARAG_APPROVAL_DECISION_RECORDED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "notice", channelEligibility: IN_APP_ONLY },
  ARAG_RELEASE_SUCCEEDED: { category: "TRANSACTIONAL", actionRequired: false, urgency: "info", channelEligibility: IN_APP_ONLY },
  ARAG_RELEASE_FAILED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "warning", channelEligibility: IN_APP_ONLY },
  STUDIO_QA_COMPLETE: { category: "TRANSACTIONAL", actionRequired: false, urgency: "notice", channelEligibility: IN_APP_ONLY },
  STUDIO_HANDOFF_ASSIGNED: { category: "REQUIRED_ACTION", actionRequired: true, urgency: "notice", channelEligibility: IN_APP_ONLY },
};

/**
 * Conservative default for any notification_type not yet in the registry:
 * never over-claims urgency or action-required status for something
 * unclassified. Logs once per lookup (not cached) so an unclassified type
 * reaching production is visible in operational logs rather than silently
 * mis-triaged.
 */
const DEFAULT_CLASSIFICATION: NotificationClassification = {
  category: "OPTIONAL_PRODUCT",
  actionRequired: false,
  urgency: "info",
  channelEligibility: IN_APP_ONLY,
};

export function classifyNotificationType(notificationType: string): NotificationClassification {
  const entry = NOTIFICATION_CLASSIFICATION[notificationType];
  if (entry) return entry;
  console.warn("[notifications] unclassified notification_type, using conservative default", { notificationType });
  return DEFAULT_CLASSIFICATION;
}

// NCA-2 — Preference Policy (NCA_OWNER_DECISION_LOCK.md §7 / NCA-2 §16).
// Only these two categories may ever be user-suppressed in-app. This is
// enforced twice, deliberately: here (service-layer validation) and again
// at the database level by the CHECK constraint on
// notification_preferences.category (migration 143) — mandatory/required
// communication must not become suppressible by a service-layer bug alone.
export const SUPPRESSIBLE_CATEGORIES: NotificationCategory[] = ["OPTIONAL_PRODUCT", "DIGEST_ELIGIBLE"];

export function isSuppressibleCategory(category: NotificationCategory): boolean {
  return (SUPPRESSIBLE_CATEGORIES as string[]).includes(category);
}

/**
 * Reverse lookup: every notification_type currently classified under a
 * given category. Used to translate a user's category-level preference
 * ("I don't want OPTIONAL_PRODUCT notifications") into a concrete
 * notification_type exclusion list for SQL filtering, without needing a
 * `category` column on the `notifications` table itself (category stays
 * derived/read-time, per the NCA-1 principle this registry preserves).
 */
export function notificationTypesByCategory(category: NotificationCategory): string[] {
  return Object.entries(NOTIFICATION_CLASSIFICATION)
    .filter(([, classification]) => classification.category === category)
    .map(([type]) => type);
}
