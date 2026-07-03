export const SHS_TRACKING_SCHEMA_VERSION = "shs.tracking.v1";

export const SHS_TRACKING_SAFETY_COPY =
  "SHS Tracking Intelligence V1 records internal operational events only. It does not add third-party analytics, public tracking pixels, cookies, external delivery, warehouse writes, report publishing, public approval mutation, or SHF Impact Data mutation.";

export const SHS_TRACKING_DANGEROUS_FLAGS = Object.freeze({
  external_tracking_enabled: false,
  third_party_analytics_enabled: false,
  cookie_tracking_enabled: false,
  pixel_tracking_enabled: false,
  webhook_sending_enabled: false,
  notification_sending_enabled: false,
  warehouse_write_enabled: false,
  report_publishing_enabled: false,
  public_approved_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  credential_capture_enabled: false,
});

export const TRACKING_EVENT_TYPES = Object.freeze([
  "sales",
  "production",
  "qa",
  "clientops",
  "report",
  "agent",
  "orchestrator",
  "direct_connect",
  "persistence",
  "support",
  "billing",
  "revenue",
  "impact",
  "governance",
  "system",
]);

export const TRACKING_ENTITY_TYPES = Object.freeze([
  "client",
  "project",
  "report",
  "agent",
  "workflow",
  "task",
  "proof",
  "snapshot",
  "route",
  "system",
  "unknown",
]);

export const TRACKING_SIGNAL_TYPES = Object.freeze([
  "upgrade_opportunity",
  "renewal_risk",
  "report_engagement",
  "support_hotspot",
  "qa_blocker",
  "production_delay",
  "agent_activity_spike",
  "proof_gap",
  "governance_attention",
  "client_value_signal",
  "revenue_signal",
  "impact_report_candidate",
]);

export function nowIso() {
  return new Date().toISOString();
}

export function createTrackingId(prefix = "trk") {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now()}_${random}`;
}

export function normalizeTrackingArray(value) {
  return Array.isArray(value) ? value : [];
}

