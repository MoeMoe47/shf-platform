import { createSampleInternalTrackingEvent, SHS_TRACKING_SEED_EVENTS } from "./shsTrackingEvents";
import { scanTrackingEventSafety } from "./shsTrackingSafety";
import { normalizeTrackingArray } from "./shsTrackingTypes";

export const SHS_TRACKING_STORAGE_KEY = "shs:tracking:intelligence:v1:events";
export const SHS_TRACKING_REVIEWED_SIGNALS_KEY = "shs:tracking:intelligence:v1:reviewed-signals";

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readJson(key, fallback) {
  if (!canUseLocalStorage()) return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (!canUseLocalStorage()) return value;
  window.localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getTrackingEvents() {
  const stored = readJson(SHS_TRACKING_STORAGE_KEY, []);
  return stored.length ? stored : SHS_TRACKING_SEED_EVENTS;
}

export function saveTrackingEvents(events) {
  return writeJson(SHS_TRACKING_STORAGE_KEY, normalizeTrackingArray(events));
}

export function appendTrackingEvent(event) {
  const safety = scanTrackingEventSafety(event);
  const safeEvent = { ...event, safety_status: safety.safety_status, safety_result: safety };
  if (!safety.safe) return { event: safeEvent, blocked: true, events: getTrackingEvents() };
  const events = [safeEvent, ...getTrackingEvents()];
  saveTrackingEvents(events);
  return { event: safeEvent, blocked: false, events };
}

export function createLocalSampleTrackingEvent() {
  return appendTrackingEvent(createSampleInternalTrackingEvent());
}

export function archiveTrackingEvent(eventId) {
  const events = getTrackingEvents().map((event) => (
    event.tracking_event_id === eventId
      ? { ...event, archived: true, archived_at: new Date().toISOString() }
      : event
  ));
  saveTrackingEvents(events);
  return events;
}

export function resetTrackingEvents() {
  saveTrackingEvents(SHS_TRACKING_SEED_EVENTS);
  return SHS_TRACKING_SEED_EVENTS;
}

export function getReviewedTrackingSignals() {
  return readJson(SHS_TRACKING_REVIEWED_SIGNALS_KEY, []);
}

export function markTrackingSignalReviewed(signalId) {
  const reviewed = Array.from(new Set([...getReviewedTrackingSignals(), signalId]));
  writeJson(SHS_TRACKING_REVIEWED_SIGNALS_KEY, reviewed);
  return reviewed;
}

