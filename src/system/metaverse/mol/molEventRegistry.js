// Phase 9 — Universal Metaverse Event Registry.
//
// Extends the canonical MOL Event Contract (molEventContract.js); it is not a second registry. The envelope,
// versioning, single-owner rule and NOT_EVIDENCE / NOT_INSTITUTIONAL_TRUTH markers stay in the contract and the
// System Registry. This module adds per-type metadata — category, replay/audit/spatial/sensory/MOCC eligibility,
// default severity — and a bounded payload contract so payloads never become an untyped dumping ground.
// Source system and authority are DERIVED from the System Registry, never restated here.

import { MOL_EVENT_CONTRACT_VERSION, MOL_EVENT_TYPES as T, MOL_EVENT_TYPE_VALUES, validateMolEvent } from "./molEventContract.js";
import { getMolEventOwner } from "./molSystemRegistry.js";

export const MOL_EVENT_CATEGORIES = Object.freeze([
  "MOBILITY", "INFRASTRUCTURE", "PUBLIC_SAFETY", "ENVIRONMENT", "WEATHER", "MARINE", "AVIATION", "PORT", "MISSION", "ARCADE",
  "WORKFORCE", "UTILITY", "SYSTEM_HEALTH", "SENSORY", "OPERATOR", "SCENARIO",
]);

// Payload keys shared by every scenario-emitted event.
const SCENARIO_KEYS = Object.freeze(["scenarioId", "scenarioStep", "simulated"]);

const definition = (eventType, category, { spatial = true, sensoryEligible = true, payloadKeys = SCENARIO_KEYS, defaultSeverity = "MODERATE" } = {}) => Object.freeze({
  eventType, category, schemaVersion: MOL_EVENT_CONTRACT_VERSION, simulationAllowed: true, replayable: true, auditable: true,
  spatial, sensoryEligible, moccVisible: true, defaultSeverity, payloadKeys: Object.freeze([...payloadKeys]),
});

const DEFINITIONS = Object.freeze([
  definition(T.ROAD_CLOSED, "MOBILITY"),
  definition(T.ROAD_REOPENED, "MOBILITY", { defaultSeverity: "INFO" }),
  definition(T.VEHICLE_COLLISION, "MOBILITY", { defaultSeverity: "MAJOR" }),
  definition(T.WATERWAY_RESTRICTED, "MARINE"),
  definition(T.WATERWAY_RESTRICTION_LIFTED, "MARINE", { defaultSeverity: "INFO" }),
  definition(T.STORM_STARTED, "WEATHER", { spatial: false, payloadKeys: [...SCENARIO_KEYS, "weatherPreset"], defaultSeverity: "MAJOR" }),
  definition(T.STORM_ENDED, "WEATHER", { spatial: false, payloadKeys: [...SCENARIO_KEYS, "weatherPreset"], defaultSeverity: "INFO" }),
  definition(T.POWER_FAILURE, "UTILITY", { defaultSeverity: "CRITICAL" }),
  definition(T.POWER_RESTORED, "UTILITY", { defaultSeverity: "INFO" }),
  definition(T.INCIDENT_OPENED, "PUBLIC_SAFETY", { defaultSeverity: "MAJOR" }),
  definition(T.INCIDENT_CLOSED, "PUBLIC_SAFETY", { defaultSeverity: "INFO" }),
  definition(T.SYSTEM_HEALTH_CHANGED, "SYSTEM_HEALTH", { spatial: false, sensoryEligible: false, payloadKeys: ["systemId", "health", "reason"], defaultSeverity: "INFO" }),
  definition(T.SIMULATION_STATE_CHANGED, "SCENARIO", { spatial: false, sensoryEligible: false, payloadKeys: ["status", "previousStatus", "control", "revision", "mode"], defaultSeverity: "INFO" }),
  definition(T.REGIONAL_IMPACT_PROJECTED, "INFRASTRUCTURE", {
    payloadKeys: ["impactedNodeId", "impactedKind", "viaNodeId", "depth", "impact", "relationship", "sourceEventType", "participantStatus"],
  }),
]);

const BY_TYPE = new Map(DEFINITIONS.map((item) => [item.eventType, item]));

export function getMolEventDefinition(eventType) {
  const item = BY_TYPE.get(eventType);
  if (!item) return null;
  const owner = getMolEventOwner(eventType);
  return Object.freeze({ ...item, sourceSystem: owner?.systemId ?? null, sourceAuthority: owner?.authorityDomain ?? null });
}

export function listMolEventDefinitions() {
  return MOL_EVENT_TYPE_VALUES.map(getMolEventDefinition);
}

// Every contract type is registered exactly once, has exactly one owner, and uses a known category.
export function validateMolEventRegistry() {
  const errors = [];
  for (const type of MOL_EVENT_TYPE_VALUES) {
    const item = getMolEventDefinition(type);
    if (!item) errors.push(`${type}: not registered`);
    else {
      if (!item.sourceSystem) errors.push(`${type}: no owning system`);
      if (!MOL_EVENT_CATEGORIES.includes(item.category)) errors.push(`${type}: unknown category`);
    }
  }
  for (const type of BY_TYPE.keys()) if (!MOL_EVENT_TYPE_VALUES.includes(type)) errors.push(`${type}: registered but not in the event contract`);
  return Object.freeze(errors);
}

// Contract validation + registry validation: a known type, the registered owner and authority, and only the
// payload keys its contract declares.
export function validateRegisteredMolEvent(event) {
  const contract = validateMolEvent(event);
  const errors = [...contract.errors];
  const item = getMolEventDefinition(event?.eventType);
  if (!item) errors.push(`eventType ${String(event?.eventType)} is not registered`);
  else {
    if (event.sourceSystem !== item.sourceSystem) errors.push(`sourceSystem must be ${item.sourceSystem}`);
    if (event.authority !== item.sourceAuthority) errors.push(`authority must be ${item.sourceAuthority}`);
    for (const key of Object.keys(event.payload ?? {})) if (!item.payloadKeys.includes(key)) errors.push(`payload.${key} is not declared for ${event.eventType}`);
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze([...new Set(errors)]) });
}
