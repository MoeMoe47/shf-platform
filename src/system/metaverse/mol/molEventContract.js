// Phase 4F.5 — Metaverse Orchestration Layer (MOL): Canonical Metaverse Event Contract v1.
//
// MOL coordinates. Domain systems remain authoritative. Every event is
// versioned, attributable to a source system and its authority, replayable,
// and correlation/causation aware. Events are data only: no executable
// content, no tool calls, no embedded domain mutations.
//
// Naming convention: UPPER_SNAKE `<SUBJECT>_<PAST_TENSE_VERB>` (ROAD_CLOSED,
// STORM_STARTED). The owning system for each type is declared in the System
// Registry; an event type never has two owners.

import { COORDINATE_FAMILIES } from "../../../shared/spatial/contracts/constants.js";

export const MOL_EVENT_CONTRACT_VERSION = 1;
export const MOL_SUPPORTED_EVENT_VERSIONS = Object.freeze([1]);

// Small v1 proof set grounded in systems that exist today (see the 4F.5 audit).
export const MOL_EVENT_TYPES = Object.freeze({
  ROAD_CLOSED: "ROAD_CLOSED",
  ROAD_REOPENED: "ROAD_REOPENED",
  VEHICLE_COLLISION: "VEHICLE_COLLISION",
  WATERWAY_RESTRICTED: "WATERWAY_RESTRICTED",
  WATERWAY_RESTRICTION_LIFTED: "WATERWAY_RESTRICTION_LIFTED",
  STORM_STARTED: "STORM_STARTED",
  STORM_ENDED: "STORM_ENDED",
  POWER_FAILURE: "POWER_FAILURE",
  POWER_RESTORED: "POWER_RESTORED",
  INCIDENT_OPENED: "INCIDENT_OPENED",
  INCIDENT_CLOSED: "INCIDENT_CLOSED",
  SYSTEM_HEALTH_CHANGED: "SYSTEM_HEALTH_CHANGED",
});
export const MOL_EVENT_TYPE_VALUES = Object.freeze(Object.values(MOL_EVENT_TYPES));
export const MOL_EVENT_TYPE_PATTERN = /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/;

export const MOL_PROVIDER_MODES = Object.freeze(["LIVE", "SIMULATED", "HYBRID", "TEST", "UNAVAILABLE"]);
export const MOL_EVENT_SEVERITIES = Object.freeze(["INFO", "MINOR", "MODERATE", "MAJOR", "CRITICAL"]);
export const MOL_EVENT_STATUSES = Object.freeze(["REPORTED", "ACTIVE", "RESOLVED", "CANCELLED"]);
export const MOL_ENTITY_ROLES = Object.freeze(["SUBJECT", "AFFECTED", "LOCATION", "RESPONDER", "CAUSE"]);
// Simulation events are never evidence and never institutional truth. Both
// markers are fixed literals in v1 so no producer can claim otherwise.
export const MOL_EVIDENCE_POLICY = "NOT_EVIDENCE";
export const MOL_TRUTH_POLICY = "NOT_INSTITUTIONAL_TRUTH";

export const MOL_EVENT_LIMITS = Object.freeze({
  maxEventBytes: 4096,
  maxPayloadBytes: 1024,
  maxPayloadKeys: 16,
  maxEntities: 12,
  maxCapabilities: 8,
  maxTextChars: 280,
  maxIdChars: 160,
});

const ENVELOPE_KEYS = Object.freeze([
  "eventId", "eventVersion", "eventType", "occurredAt", "sourceSystem", "authority", "providerMode", "location",
  "severity", "entities", "correlationId", "causationId", "status", "requiredCapabilities", "relatedMission",
  "evidencePolicy", "truthPolicy", "payload",
]);
const LOCATION_KEYS = Object.freeze(["coordinateFamily", "coordinateSpaceId", "destinationId", "featureId", "layerId"]);
const ENTITY_KEYS = Object.freeze(["entityType", "entityRef", "role"]);
const MISSION_KEYS = Object.freeze(["missionId", "missionVersion"]);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;
const EXECUTABLE_TEXT = /<\s*script\b|javascript\s*:|\beval\s*\(|\bnew\s+Function\b|=>|\bimport\s*\(|\brequire\s*\(/i;
// Payload keys that would smuggle authority owned elsewhere.
const FORBIDDEN_PAYLOAD_KEYS = new Set([
  "evidence", "evidenceid", "truth", "truthspine", "credential", "credentialid", "mastery", "userid", "email", "password",
  "token", "permission", "role", "membership", "treasury", "reward", "careereligibility", "curriculum", "command", "tool", "toolcall", "sql",
]);

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isId(value) {
  return typeof value === "string" && value.length <= MOL_EVENT_LIMITS.maxIdChars && ID_PATTERN.test(value);
}

function byteLength(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

function onlyKeys(value, allowed, path, errors) {
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${path}.${key}: unsupported field`);
}

function validatePayload(payload, errors) {
  if (!isRecord(payload)) return void errors.push("payload must be a plain object");
  const keys = Object.keys(payload);
  if (keys.length > MOL_EVENT_LIMITS.maxPayloadKeys) errors.push("payload has too many fields");
  if (byteLength(payload) > MOL_EVENT_LIMITS.maxPayloadBytes) errors.push("payload exceeds size limit");
  for (const [key, value] of Object.entries(payload)) {
    if (!isId(key)) errors.push("payload contains an invalid key");
    if (FORBIDDEN_PAYLOAD_KEYS.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) errors.push(`payload.${key}: field is outside MOL authority`);
    // Flat scalar payloads only: no nesting, no functions, no executable strings.
    if (!["string", "number", "boolean"].includes(typeof value) || (typeof value === "number" && !Number.isFinite(value))) {
      errors.push(`payload.${key} must be a finite scalar`);
    } else if (typeof value === "string" && (value.length > MOL_EVENT_LIMITS.maxTextChars || EXECUTABLE_TEXT.test(value))) {
      errors.push(`payload.${key} must be bounded safe text`);
    }
  }
}

// Pure, closed-shape validation. Returns a frozen result; never throws.
export function validateMolEvent(event) {
  const errors = [];
  if (!isRecord(event)) return Object.freeze({ valid: false, unsupportedVersion: false, errors: Object.freeze(["event must be a plain object"]) });
  if (byteLength(event) > MOL_EVENT_LIMITS.maxEventBytes) errors.push("event exceeds size limit");
  onlyKeys(event, ENVELOPE_KEYS, "event", errors);
  const unsupportedVersion = !MOL_SUPPORTED_EVENT_VERSIONS.includes(event.eventVersion);
  if (unsupportedVersion) errors.push(`eventVersion ${String(event.eventVersion)} is not supported`);
  for (const key of ["eventId", "sourceSystem", "authority", "correlationId"]) if (!isId(event[key])) errors.push(`${key} is required and must be a stable identifier`);
  if (event.causationId !== null && !isId(event.causationId)) errors.push("causationId must be null or a stable identifier");
  if (typeof event.eventType !== "string" || !MOL_EVENT_TYPE_PATTERN.test(event.eventType)) errors.push("eventType must be UPPER_SNAKE_CASE");
  if (typeof event.occurredAt !== "string" || Number.isNaN(Date.parse(event.occurredAt))) errors.push("occurredAt must be an ISO timestamp");
  if (!MOL_PROVIDER_MODES.includes(event.providerMode) || event.providerMode === "UNAVAILABLE") errors.push("providerMode is invalid");
  if (!MOL_EVENT_SEVERITIES.includes(event.severity)) errors.push("severity is invalid");
  if (!MOL_EVENT_STATUSES.includes(event.status)) errors.push("status is invalid");
  if (event.evidencePolicy !== MOL_EVIDENCE_POLICY) errors.push(`evidencePolicy must be ${MOL_EVIDENCE_POLICY}`);
  if (event.truthPolicy !== MOL_TRUTH_POLICY) errors.push(`truthPolicy must be ${MOL_TRUTH_POLICY}`);

  if (event.location !== null) {
    if (!isRecord(event.location)) errors.push("location must be null or an object");
    else {
      onlyKeys(event.location, LOCATION_KEYS, "location", errors);
      if (!Object.values(COORDINATE_FAMILIES).includes(event.location.coordinateFamily)) errors.push("location.coordinateFamily is invalid");
      for (const key of ["coordinateSpaceId", "destinationId", "featureId", "layerId"]) {
        if (event.location[key] !== undefined && !isId(event.location[key])) errors.push(`location.${key} is invalid`);
      }
    }
  }
  if (!Array.isArray(event.entities) || event.entities.length > MOL_EVENT_LIMITS.maxEntities) errors.push("entities must be a bounded array");
  else event.entities.forEach((entity, index) => {
    if (!isRecord(entity)) return void errors.push(`entities[${index}] must be an object`);
    onlyKeys(entity, ENTITY_KEYS, `entities[${index}]`, errors);
    if (!isId(entity.entityType) || !isId(entity.entityRef)) errors.push(`entities[${index}] requires entityType and entityRef identifiers`);
    if (!MOL_ENTITY_ROLES.includes(entity.role)) errors.push(`entities[${index}].role is invalid`);
  });
  if (event.requiredCapabilities !== undefined && (!Array.isArray(event.requiredCapabilities)
    || event.requiredCapabilities.length > MOL_EVENT_LIMITS.maxCapabilities || !event.requiredCapabilities.every(isId))) {
    errors.push("requiredCapabilities must be a bounded identifier array");
  }
  if (event.relatedMission !== undefined) {
    if (!isRecord(event.relatedMission)) errors.push("relatedMission must be an object reference");
    else {
      onlyKeys(event.relatedMission, MISSION_KEYS, "relatedMission", errors);
      if (!isId(event.relatedMission.missionId)) errors.push("relatedMission.missionId is invalid");
      if (event.relatedMission.missionVersion !== undefined && (!Number.isInteger(event.relatedMission.missionVersion) || event.relatedMission.missionVersion < 1)) {
        errors.push("relatedMission.missionVersion is invalid");
      }
    }
  }
  validatePayload(event.payload, errors);
  return Object.freeze({ valid: errors.length === 0, unsupportedVersion, errors: Object.freeze([...new Set(errors)]) });
}

// Builds a complete v1 envelope with safe defaults; callers still pass it through the bus for validation.
export function createMolEvent(fields) {
  return {
    eventVersion: MOL_EVENT_CONTRACT_VERSION,
    location: null,
    severity: "INFO",
    entities: [],
    causationId: null,
    status: "REPORTED",
    evidencePolicy: MOL_EVIDENCE_POLICY,
    truthPolicy: MOL_TRUTH_POLICY,
    payload: {},
    ...fields,
  };
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
  }
  return value;
}
