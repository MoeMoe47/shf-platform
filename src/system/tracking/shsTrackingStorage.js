import { createSampleInternalTrackingEvent, SHS_TRACKING_SEED_EVENTS } from "./shsTrackingEvents";
import { scanTrackingEventSafety } from "./shsTrackingSafety";
import { normalizeTrackingArray } from "./shsTrackingTypes";
import {
  readCriticalStateRecords,
  writeCriticalStateRecords,
} from "@/system/persistence/migrations/criticalStateMigrationCompatibility";

export const SHS_TRACKING_STORAGE_KEY = "shs:tracking:intelligence:v1:events";
export const SHS_TRACKING_REVIEWED_SIGNALS_KEY = "shs:tracking:intelligence:v1:reviewed-signals";

export function getTrackingEvents() {
  const stored = readCriticalStateRecords("tracking_intelligence", SHS_TRACKING_STORAGE_KEY, [], {
    repository: "tracking_intelligence",
    idField: "tracking_event_id",
    schemaVersion: "shs.critical.tracking.v1",
  }).filter((record) => record.critical_record_type !== "reviewed_signal");
  return stored.length ? stored : SHS_TRACKING_SEED_EVENTS;
}

export function saveTrackingEvents(events) {
  return writeCriticalStateRecords("tracking_intelligence", SHS_TRACKING_STORAGE_KEY, normalizeTrackingArray(events).map((event) => ({
    ...event,
    critical_record_type: "tracking_event",
  })), {
    repository: "tracking_intelligence",
    idField: "tracking_event_id",
    schemaVersion: "shs.critical.tracking.v1",
    change_summary: "Tracking Intelligence critical event write",
  });
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
  return readCriticalStateRecords("tracking_intelligence", SHS_TRACKING_REVIEWED_SIGNALS_KEY, [], {
    repository: "tracking_intelligence",
    idField: "signal_id",
    schemaVersion: "shs.critical.tracking.v1",
  }).filter((record) => record.critical_record_type === "reviewed_signal").map((record) => record.signal_id);
}

export function markTrackingSignalReviewed(signalId) {
  const reviewed = Array.from(new Set([...getReviewedTrackingSignals(), signalId])).map((id) => ({
    signal_id: id,
    critical_record_type: "reviewed_signal",
    reviewed_at: new Date().toISOString(),
  }));
  const saved = writeCriticalStateRecords("tracking_intelligence", SHS_TRACKING_REVIEWED_SIGNALS_KEY, reviewed, {
    repository: "tracking_intelligence",
    idField: "signal_id",
    schemaVersion: "shs.critical.tracking.v1",
    change_summary: "Tracking Intelligence reviewed signal write",
  });
  return saved.map((record) => record.signal_id);
}
