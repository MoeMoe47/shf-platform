import { moccTimelineCategory } from "./moccEventProjection.js";
import { getMoccIntegrationStatus } from "./moccIntegrationStatusRegistry.js";

const INCIDENT_EVENT_PREFIXES = [
  "FIRE.",
  "EMS.",
  "PUBLIC_SAFETY.",
  "INCIDENT.",
  "TRAFFIC.INCIDENT.",
  "WEATHER.EMERGENCY.",
  "UTILITY.OUTAGE.",
  "SECURITY.INCIDENT.",
];

const INCIDENT_EVENT_TYPES = new Set([
  "TRAFFIC.INCIDENT",
  "WEATHER.EMERGENCY",
  "UTILITY.OUTAGE",
  "SECURITY.INCIDENT",
]);

function text(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function isMoccIncidentEvent(event) {
  const type = text(event?.event_type)?.toUpperCase();
  return Boolean(type && (
    INCIDENT_EVENT_TYPES.has(type)
    || INCIDENT_EVENT_PREFIXES.some((prefix) => prefix.endsWith(".") && type.startsWith(prefix))
  ));
}

function operationRecord(event, integrationStatus = null) {
  return {
    operation_id: event.event_id,
    event_id: event.event_id,
    event_type: text(event.event_type),
    title: text(event.title) || text(event.event_type) || "Event",
    category: moccTimelineCategory(event),
    timestamp: text(event.timestamp),
    severity: text(event.severity),
    state: text(event.state),
    source_authority: text(event.source_authority),
    source_reference: text(event.source_event_ref) || text(event.event_id),
    location: event.location || null,
    affected_entities: event.affected_entities || [],
    dependencies: event.dependencies || [],
    mission_id: text(event.mission_id),
    scenario_id: text(event.scenario_id),
    evidence_refs: event.evidence_refs || [],
    audit_refs: event.audit_refs || [],
    integration_status: integrationStatus,
    source_event: event,
  };
}

export function projectMoccOperations(events = []) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => event && typeof event.event_id === "string" && event.event_id.length > 0)
    .map((event) => operationRecord(event));
}

function incidentIntegrationDomain(event) {
  const type = String(event?.event_type || "").toUpperCase();
  if (type.startsWith("FIRE.") || type.startsWith("EMS.") || type.startsWith("PUBLIC_SAFETY.")) return "FIRE_EMS_INCIDENTS";
  if (type === "TRAFFIC.INCIDENT" || type.startsWith("TRAFFIC.INCIDENT.")) return "TRAFFIC";
  if (type === "WEATHER.EMERGENCY" || type.startsWith("WEATHER.EMERGENCY.")) return "WEATHER_OBSERVATIONS";
  if (type === "UTILITY.OUTAGE" || type.startsWith("UTILITY.OUTAGE.")) return "UTILITIES";
  return null;
}

export function projectMoccIncidents(events = []) {
  return (Array.isArray(events) ? events : [])
    .filter((event) => event && typeof event.event_id === "string" && event.event_id.length > 0 && isMoccIncidentEvent(event))
    .map((event) => operationRecord(event, getMoccIntegrationStatus(incidentIntegrationDomain(event))?.status || null));
}

const ACTIVE_STATES = new Set(["ACTIVE", "OPEN", "IN_PROGRESS", "ONGOING", "RESPONDING"]);

export function filterMoccOperations(records = [], filters = {}) {
  return (Array.isArray(records) ? records : [])
    .filter((record) => filters.category === "all" || !filters.category || record.category === filters.category)
    .filter((record) => filters.state === "all" || !filters.state || record.state === filters.state)
    .filter((record) => filters.severity === "all" || !filters.severity || record.severity === filters.severity)
    .filter((record) => !filters.activeOnly || ACTIVE_STATES.has(String(record.state || "").toUpperCase()))
    .map((record, index) => ({ record, index, time: Date.parse(record.timestamp || "") }))
    .sort((a, b) => {
      const aTimed = Number.isFinite(a.time);
      const bTimed = Number.isFinite(b.time);
      if (aTimed !== bTimed) return aTimed ? -1 : 1;
      return aTimed ? b.time - a.time || a.index - b.index : a.index - b.index;
    })
    .map(({ record }) => record);
}
