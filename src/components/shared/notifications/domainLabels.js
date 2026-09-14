// NCA-3 §12: makes each notification's source domain understandable
// without exposing internal technical event/notification_type strings
// (e.g. "DOCUMENTATION_SIGNATURE_REQUIRED") directly to end users.
//
// Keyed by the same `notification_type` values the backend's canonical
// classification registry uses (apps/shs-api/src/domain/notifications/
// contracts/notification-classification.ts) — this is presentation-only
// and does not duplicate that registry's category/urgency/actionRequired
// logic, only adds a human-readable domain label on top of the `type`
// field the API already returns.
const DOMAIN_LABELS = {
  DOCUMENTATION_REQUIRED: "Documents",
  DOCUMENTATION_CORRECTION_REQUIRED: "Documents",
  DOCUMENTATION_SIGNATURE_REQUIRED: "Documents",
  DOCUMENTATION_SIGNATURE_COMPLETE: "Documents",
  DOCUMENTATION_SIGNATURE_EXPIRED: "Documents",
  DOCUMENTATION_MANUAL_VERIFICATION: "Documents",
  DOCUMENTATION_MANUAL_CORRECTION: "Documents",
  DOCUMENTATION_SUPERSEDED: "Documents",
  REVIEW_ASSIGNED: "Studio",
  REVIEW_DECISION: "Studio",
  CREDENTIAL_EARNED: "Credentials",
  CREDENTIAL_REVOKED: "Credentials",
  DEPLOYMENT_LIVE: "Studio",
  DEPLOYMENT_FAILED: "Studio",
  REGISTRY_ACCEPTED: "Agent Registry",
  REGISTRY_CHANGES_REQUESTED: "Agent Registry",
  REGISTRY_REJECTED: "Agent Registry",
  REGISTRY_FAILED: "Agent Registry",
  COMPLETION_ACHIEVED: "Curriculum",
};

/** Conservative fallback for any notification_type not yet in the map — never invents a false-sounding domain. */
const DEFAULT_DOMAIN_LABEL = "Platform";

export function domainLabelForType(notificationType) {
  return DOMAIN_LABELS[notificationType] || DEFAULT_DOMAIN_LABEL;
}

const URGENCY_LABELS = {
  info: "Informational",
  notice: "Notice",
  warning: "Needs attention",
  critical: "Urgent",
};

export function urgencyLabel(urgency) {
  return URGENCY_LABELS[urgency] || "Notice";
}
