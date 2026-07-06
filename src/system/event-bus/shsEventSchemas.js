import { SHS_EVENT_CHANNELS, SHS_EVENT_RISK_LEVELS, SHS_EVENT_TYPES } from "./shsEventBusTypes";

export const SHS_EVENT_REQUIRED_FIELDS = [
  "event_id",
  "event_type",
  "event_name",
  "source_layer",
  "target_layers",
  "entity_type",
  "entity_id",
  "risk_level",
  "visibility",
  "payload",
  "safety_status",
  "timestamp",
  "operator_note",
];

export function getEventChannelByType(eventType) {
  return SHS_EVENT_CHANNELS.find((channel) => channel.event_type === eventType) || SHS_EVENT_CHANNELS[9];
}

export function validateShsEventSchema(event = {}) {
  const errors = [];
  SHS_EVENT_REQUIRED_FIELDS.forEach((field) => {
    if (!(field in event)) errors.push(`missing field: ${field}`);
  });
  if (!SHS_EVENT_TYPES.includes(event.event_type)) errors.push("invalid event_type");
  if (!SHS_EVENT_RISK_LEVELS.includes(event.risk_level)) errors.push("invalid risk_level");
  if (event.visibility !== "internal_only") errors.push("visibility must be internal_only");
  if (!Array.isArray(event.target_layers)) errors.push("target_layers must be an array");
  if (!event.payload || typeof event.payload !== "object" || Array.isArray(event.payload)) {
    errors.push("payload must be an object");
  }
  return {
    valid: errors.length === 0,
    errors,
    channel: getEventChannelByType(event.event_type).channel_id,
  };
}

