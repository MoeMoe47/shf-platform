import { createShsEvent } from "./shsEventBusTypes";
import { validateShsEventSchema } from "./shsEventSchemas";
import { routeEvent } from "./shsEventRouter";
import { scanEventSafety } from "./shsEventSafety";
import { createSubscriber, SHS_EVENT_DEFAULT_SUBSCRIBERS } from "./shsEventSubscribers";

const EVENT_STORAGE_KEY = "shs_bos_event_bus_v1_events";
const SUBSCRIBER_STORAGE_KEY = "shs_bos_event_bus_v1_subscribers";
const ARCHIVE_STORAGE_KEY = "shs_bos_event_bus_v1_archived_events";

function readLocalJson(key, fallback) {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key, value) {
  if (typeof localStorage === "undefined") return value;
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getEventBusSubscribers() {
  return readLocalJson(SUBSCRIBER_STORAGE_KEY, SHS_EVENT_DEFAULT_SUBSCRIBERS);
}

export function saveEventBusSubscribers(subscribers) {
  return writeLocalJson(SUBSCRIBER_STORAGE_KEY, subscribers);
}

export function subscribeLocalLayer(input = {}) {
  const subscribers = getEventBusSubscribers();
  const next = createSubscriber(input);
  const filtered = subscribers.filter((subscriber) => subscriber.subscriber_id !== next.subscriber_id);
  return saveEventBusSubscribers([...filtered, next]);
}

export function unsubscribeLocalLayer(subscriberId) {
  const subscribers = getEventBusSubscribers().map((subscriber) =>
    subscriber.subscriber_id === subscriberId ? { ...subscriber, active: false } : subscriber
  );
  return saveEventBusSubscribers(subscribers);
}

export function getEventBusEvents() {
  return readLocalJson(EVENT_STORAGE_KEY, []);
}

export function saveEventBusEvents(events) {
  return writeLocalJson(EVENT_STORAGE_KEY, events);
}

export function publishLocalEvent(input = {}) {
  const draft = createShsEvent(input);
  const schema = validateShsEventSchema(draft);
  const safety = scanEventSafety(draft);
  const event = {
    ...draft,
    safety_status: schema.valid ? safety.safety_status : "blocked",
    schema_valid: schema.valid,
    schema_errors: schema.errors,
    channel_id: schema.channel,
  };
  const subscribers = getEventBusSubscribers();
  const route = routeEvent(event, subscribers);
  const record = { ...event, route };
  const events = [record, ...getEventBusEvents()].slice(0, 50);
  saveEventBusEvents(events);
  return { event: record, events, safety, schema, route };
}

export function createSampleSafeEvent() {
  return publishLocalEvent({
    event_type: "orchestrator",
    event_name: "orchestrator.plan.ready_for_review",
    source_layer: "SHS System Orchestrator",
    target_layers: ["Tracking Intelligence", "System Registry"],
    entity_type: "orchestration_plan",
    entity_id: "local-plan-preview",
    risk_level: "low",
    payload: {
      summary: "Local preview event for readiness awareness.",
      public_candidate: false,
      mutation_requested: false,
    },
    operator_note: "Sample local event created from Event Bus admin.",
  });
}

export function createDangerousPayloadPreview() {
  const event = createShsEvent({
    event_type: "system",
    event_name: "blocked.external.delivery.preview",
    source_layer: "SHS BOS Event Bus",
    target_layers: ["External Broker"],
    entity_type: "safety_preview",
    entity_id: "blocked-preview",
    risk_level: "high",
    payload: {
      blocked_webhook_marker: "external delivery blocked",
      blocked_public_approval_marker: "public approval mutation blocked",
      blocked_broker_marker: "external broker blocked",
    },
  });
  return scanEventSafety(event);
}

export function archiveLocalEvent(eventId) {
  const events = getEventBusEvents();
  const event = events.find((item) => item.event_id === eventId);
  const remaining = events.filter((item) => item.event_id !== eventId);
  if (event) {
    const archived = readLocalJson(ARCHIVE_STORAGE_KEY, []);
    writeLocalJson(ARCHIVE_STORAGE_KEY, [{ ...event, archived_at: new Date().toISOString() }, ...archived].slice(0, 50));
  }
  return saveEventBusEvents(remaining);
}

export function loadSeedEventBusEvents() {
  const existing = getEventBusEvents();
  if (existing.length) return existing;
  return publishLocalEvent({
    event_type: "registry",
    event_name: "registry.layer.reviewed",
    source_layer: "SHS System Registry",
    target_layers: ["Governance", "Tracking Intelligence"],
    entity_type: "system_layer",
    entity_id: "event_bus_message_fabric",
    risk_level: "medium",
    payload: { local_registry_awareness: true, external_delivery: false },
    operator_note: "Seed local event for Event Bus V1.",
  }).events;
}
