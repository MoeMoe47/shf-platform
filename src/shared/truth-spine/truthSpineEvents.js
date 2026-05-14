import { EVENT_TYPES, makeEventId, makeTraceId, nowIso } from "./truthSpineTypes.js";

export const TRUTH_SPINE_EVENT_KEY = "shs_truth_spine_events_v1";

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // dev-safe no-op
  }
  return value;
}

export function getTruthSpineEvents() {
  return readJson(TRUTH_SPINE_EVENT_KEY, []);
}

export function saveTruthSpineEvents(events) {
  return writeJson(TRUTH_SPINE_EVENT_KEY, Array.isArray(events) ? events : []);
}

export function createTruthSpineEvent({
  eventType,
  entityId,
  entityType = "referral",
  actorId = "demo-user-1",
  actorRole = "hub_operator",
  organizationId = "shf-core",
  sourceSurface = "unknown_surface",
  traceId,
  payload = {},
}) {
  return {
    eventId: makeEventId(),
    eventType,
    entityId,
    entityType,
    actorId,
    actorRole,
    organizationId,
    sourceSurface,
    timestamp: nowIso(),
    traceId: traceId || makeTraceId(),
    payload,
  };
}

export function appendTruthSpineEvent(eventInput) {
  const event = eventInput?.eventId ? eventInput : createTruthSpineEvent(eventInput);
  const next = [event, ...getTruthSpineEvents()].slice(0, 250);
  saveTruthSpineEvents(next);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("shs:truth-spine-event", { detail: event }));
  }

  return event;
}

export { EVENT_TYPES };
