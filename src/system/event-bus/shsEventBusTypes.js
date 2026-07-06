export const SHS_EVENT_BUS_VERSION = "shs.bos.event-bus.v1";

export const SHS_EVENT_BUS_SAFETY_COPY =
  "SHS BOS Event Bus / Message Fabric V1 routes internal local events only. It does not use external brokers, send network messages, mutate production data, publish reports, change public approval, write warehouse records, modify auth, or store credentials.";

export const SHS_EVENT_TYPES = [
  "orchestrator",
  "tracking",
  "persistence",
  "registry",
  "agent",
  "workflow",
  "report",
  "direct_connect",
  "governance",
  "system",
];

export const SHS_EVENT_RISK_LEVELS = ["low", "medium", "high", "critical"];
export const SHS_EVENT_SAFETY_STATUSES = ["allowed", "blocked", "needs_review"];

export const SHS_EVENT_CHANNELS = Object.freeze([
  { channel_id: "orchestrator.events", event_type: "orchestrator", owner_layer: "SHS System Orchestrator" },
  { channel_id: "tracking.events", event_type: "tracking", owner_layer: "SHS Tracking Intelligence" },
  { channel_id: "persistence.events", event_type: "persistence", owner_layer: "SHS Durable Persistence" },
  { channel_id: "registry.events", event_type: "registry", owner_layer: "SHS System Registry" },
  { channel_id: "agent.events", event_type: "agent", owner_layer: "Agent Workbench" },
  { channel_id: "workflow.events", event_type: "workflow", owner_layer: "Workflow Engine" },
  { channel_id: "report.events", event_type: "report", owner_layer: "SHS Reports" },
  { channel_id: "direct_connect.events", event_type: "direct_connect", owner_layer: "Direct Connect Batch 2" },
  { channel_id: "governance.events", event_type: "governance", owner_layer: "Governance" },
  { channel_id: "system.events", event_type: "system", owner_layer: "SHS BOS System" },
]);

export const SHS_EVENT_DANGEROUS_CAPABILITIES = Object.freeze({
  external_broker_enabled: false,
  network_delivery_enabled: false,
  webhook_send_enabled: false,
  notification_send_enabled: false,
  production_mutation_enabled: false,
  public_approval_mutation_enabled: false,
  shf_impact_data_mutation_enabled: false,
  report_publish_enabled: false,
  warehouse_write_enabled: false,
  auth_mutation_enabled: false,
  credential_storage_enabled: false,
  autonomous_execution_enabled: false,
});

export function createShsEvent(input = {}) {
  return {
    event_id: input.event_id || `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    event_type: input.event_type || "system",
    event_name: input.event_name || "system.event",
    source_layer: input.source_layer || "SHS BOS",
    target_layers: Array.isArray(input.target_layers) ? input.target_layers : [],
    entity_type: input.entity_type || "system",
    entity_id: input.entity_id || "",
    risk_level: input.risk_level || "low",
    visibility: "internal_only",
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    safety_status: input.safety_status || "needs_review",
    timestamp: input.timestamp || new Date().toISOString(),
    operator_note: input.operator_note || "",
  };
}

