import {
  SHS_TRACKING_SCHEMA_VERSION,
  TRACKING_ENTITY_TYPES,
  TRACKING_EVENT_TYPES,
  createTrackingId,
  nowIso,
} from "./shsTrackingTypes";
import { scanTrackingEventSafety, stripUnsafeTrackingMetadata } from "./shsTrackingSafety";

export const SHS_TRACKING_SEED_EVENTS = [
  createTrackingEvent({
    tracking_event_id: "trk_evt_report_usage_ready",
    event_type: "report",
    event_name: "Premium report reviewed",
    event_source: "SHS Reports",
    event_action: "reviewed",
    entity_type: "report",
    entity_id: "report_premium_shs_v1",
    client_id: "client_ccs_demo",
    report_id: "report_premium_shs_v1",
    risk_level: "medium",
    visibility: "client_report_candidate",
    metadata: { stream_id: "reports_usage", report_useful: true, engagement_score: 84 },
    operator_note: "Report is useful for internal ClientOps review before any public use.",
  }),
  createTrackingEvent({
    tracking_event_id: "trk_evt_agent_activity",
    event_type: "agent",
    event_name: "Agent workflow reviewed",
    event_source: "Agent Workbench",
    event_action: "reviewed",
    entity_type: "agent",
    entity_id: "shs_qa_agent",
    agent_id: "shs_qa_agent",
    workflow_id: "workflow_qa_readiness",
    risk_level: "low",
    metadata: { stream_id: "agent_activity", activity_count: 7 },
  }),
  createTrackingEvent({
    tracking_event_id: "trk_evt_proof_gap",
    event_type: "direct_connect",
    event_name: "Direct-source proof gap noted",
    event_source: "Direct Connect",
    event_action: "gap_noted",
    entity_type: "proof",
    entity_id: "proof_ccs_accounting",
    client_id: "client_ccs_demo",
    risk_level: "high",
    visibility: "governance_candidate",
    metadata: { stream_id: "direct_connect_proof", proof_ready: false, blocker: true },
    operator_note: "Ownership review required before report use.",
  }),
];

export function createTrackingEvent(input = {}) {
  const event = {
    tracking_event_id: input.tracking_event_id || createTrackingId("trk_evt"),
    event_type: TRACKING_EVENT_TYPES.includes(input.event_type) ? input.event_type : "system",
    event_name: input.event_name || "Internal tracking event",
    event_source: input.event_source || "SHS Tracking Intelligence",
    event_action: input.event_action || "recorded",
    entity_type: TRACKING_ENTITY_TYPES.includes(input.entity_type) ? input.entity_type : "unknown",
    entity_id: input.entity_id || "",
    client_id: input.client_id || "",
    project_id: input.project_id || "",
    report_id: input.report_id || "",
    agent_id: input.agent_id || "",
    workflow_id: input.workflow_id || "",
    risk_level: input.risk_level || "low",
    visibility: input.visibility || "internal_only",
    safety_status: "allowed",
    timestamp: input.timestamp || nowIso(),
    metadata: stripUnsafeTrackingMetadata(input.metadata || {}),
    operator_note: input.operator_note || "",
    schema_version: SHS_TRACKING_SCHEMA_VERSION,
    archived: Boolean(input.archived),
  };
  const safety = scanTrackingEventSafety(event);
  return { ...event, safety_status: safety.safety_status, safety_result: safety };
}

export function createSampleInternalTrackingEvent() {
  return createTrackingEvent({
    event_type: "production",
    event_name: "Local production movement recorded",
    event_source: "Tracking Intelligence",
    event_action: "sample_created",
    entity_type: "project",
    entity_id: "project_sample",
    project_id: "project_sample",
    metadata: { stream_id: "production_movement", sample: true, readiness_delta: 5 },
    operator_note: "Local sample event for admin smoke testing.",
  });
}

