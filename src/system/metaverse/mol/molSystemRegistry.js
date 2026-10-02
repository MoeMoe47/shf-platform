// Phase 4F.5 — MOL System Registry and Authority Matrix.
//
// The registry describes systems; it does not run them. Maturity reflects the
// 4F.5 audit honestly: Traffic, Ocean/Weather and River/Water zones exist only
// as presentation models, and there is no Water Mobility or Incident engine
// yet. Their MOL providers are deterministic SIMULATED providers, explicitly
// labeled, that reference real registry IDs and never control the engines.

import { MOL_EVENT_TYPES as T, MOL_PROVIDER_MODES } from "./molEventContract.js";

export const MOL_SYSTEM_MODES = MOL_PROVIDER_MODES;
export const MOL_CAPABILITY_MATURITY = Object.freeze(["PLANNED", "CONTRACT_DEFINED", "SIMULATED", "PARTIAL", "LIVE", "PRODUCTION"]);
export const MOL_INTEGRATION_MODES = Object.freeze(["EVENT_PROVIDER", "EVENT_CONSUMER", "CONTRACT_ONLY", "AUTHORITY_BOUNDARY", "ORCHESTRATOR"]);
export const MOL_HEALTH_STATES = Object.freeze(["HEALTHY", "DEGRADED", "UNAVAILABLE"]);

// World-state categories and the single authority allowed to change each.
export const MOL_WORLD_STATE_OWNERS = Object.freeze({
  traffic: "TRAFFIC",
  water: "WATER_MOBILITY",
  environment: "OCEAN_ENVIRONMENT",
  infrastructure: "POWER_GRID",
  incidents: "INCIDENT",
});

// Authorities MOL can never write to, request writes from, or impersonate.
export const MOL_PROHIBITED_TARGETS = Object.freeze([
  "EVIDENCE", "TRUTH_SPINE", "IDENTITY", "CURRICULUM", "CAREER", "CREDENTIALS", "TREASURY", "AGENT_FABRIC_EXECUTION", "MISSION_RUNTIME_STATE",
]);

function system(entry) {
  return Object.freeze({
    publishes: Object.freeze([]),
    consumes: Object.freeze([]),
    acceptsRequests: Object.freeze([]),
    worldStateContributions: Object.freeze([]),
    dependsOn: Object.freeze([]),
    ...entry,
  });
}

export const MOL_SYSTEMS = Object.freeze([
  system({
    systemId: "road-traffic", displayName: "Road Traffic", systemType: "MOBILITY", authorityDomain: "TRAFFIC",
    owner: "MET-16 Traffic Corridor", mode: "SIMULATED", maturity: "PARTIAL", integrationMode: "EVENT_PROVIDER",
    capabilities: Object.freeze(["authored-corridor-reference", "closure-projection"]),
    publishes: Object.freeze([T.ROAD_CLOSED, T.ROAD_REOPENED, T.VEHICLE_COLLISION]),
    acceptsRequests: Object.freeze(["CONSIDER_CLOSURE"]),
    worldStateContributions: Object.freeze(["traffic"]),
    interfaces: Object.freeze(["src/system/metaverse/traffic/metaverseTrafficCorridorRuntime.js", "src/system/metaverse/traffic/metaverseTrafficRoutes.json"]),
    notes: "Corridor runtime is presentation-only (LIVING_CITY_AUTHORITY_BOUNDARY.trafficTriggersBusinessLogic=false). MOL references approved route IDs and never moves vehicles.",
  }),
  system({
    systemId: "water-mobility", displayName: "Water Mobility", systemType: "MOBILITY", authorityDomain: "WATER_MOBILITY",
    owner: "Water Mobility (no engine yet)", mode: "SIMULATED", maturity: "CONTRACT_DEFINED", integrationMode: "EVENT_PROVIDER",
    capabilities: Object.freeze(["waterway-restriction-projection"]),
    publishes: Object.freeze([T.WATERWAY_RESTRICTED, T.WATERWAY_RESTRICTION_LIFTED]),
    acceptsRequests: Object.freeze(["CONSIDER_RESTRICTION"]),
    worldStateContributions: Object.freeze(["water"]),
    interfaces: Object.freeze(["src/system/metaverse/metaverseRiverFlowRegistry.js"]),
    notes: "No vessel routing engine exists. The deterministic simulated provider references declared water zones only.",
  }),
  system({
    systemId: "ocean-environment", displayName: "Ocean & Weather Environment", systemType: "ENVIRONMENT", authorityDomain: "OCEAN_ENVIRONMENT",
    owner: "Ocean Motion Engine / Environment Runtime", mode: "SIMULATED", maturity: "PARTIAL", integrationMode: "EVENT_PROVIDER",
    capabilities: Object.freeze(["weather-preset-reference"]),
    publishes: Object.freeze([T.STORM_STARTED, T.STORM_ENDED]),
    worldStateContributions: Object.freeze(["environment"]),
    interfaces: Object.freeze(["src/system/metaverse/oceanMotionEngine.js", "src/system/metaverse/metaverseEnvironmentRuntime.js"]),
    notes: "Weather presets are presentation configuration. MOL references declared preset names only.",
  }),
  system({
    systemId: "incident", displayName: "Incident", systemType: "PUBLIC_SAFETY", authorityDomain: "INCIDENT",
    owner: "Incident (no engine yet)", mode: "SIMULATED", maturity: "CONTRACT_DEFINED", integrationMode: "EVENT_PROVIDER",
    capabilities: Object.freeze(["simulated-incident-lifecycle"]),
    publishes: Object.freeze([T.INCIDENT_OPENED, T.INCIDENT_CLOSED]),
    worldStateContributions: Object.freeze(["incidents"]),
    interfaces: Object.freeze([]),
    notes: "No incident or dispatch engine exists and PRODUCTION_EMERGENCY_AUTHORITIES is empty. Incidents are educational simulations only.",
  }),
  system({
    systemId: "power-grid", displayName: "Power Grid", systemType: "INFRASTRUCTURE", authorityDomain: "POWER_GRID",
    owner: "Power & Electrical Facility (no engine yet)", mode: "SIMULATED", maturity: "CONTRACT_DEFINED", integrationMode: "EVENT_PROVIDER",
    capabilities: Object.freeze(["simulated-power-state"]),
    publishes: Object.freeze([T.POWER_FAILURE, T.POWER_RESTORED]),
    worldStateContributions: Object.freeze(["infrastructure"]),
    interfaces: Object.freeze(["src/system/metaverse/metaverseCanonicalDestinationRegistry.js"]),
    notes: "Anchored to canonical destination power-electrical-facility by reference.",
  }),
  system({
    systemId: "data-center", displayName: "Data Center", systemType: "INFRASTRUCTURE", authorityDomain: "DATA_CENTER",
    owner: "Main Data Center (no engine yet)", mode: "UNAVAILABLE", maturity: "PLANNED", integrationMode: "EVENT_CONSUMER",
    capabilities: Object.freeze([]),
    consumes: Object.freeze([T.POWER_FAILURE, T.POWER_RESTORED]),
    dependsOn: Object.freeze(["power-grid"]),
    interfaces: Object.freeze([]),
    notes: "Declared so dependency impact is visible; reports UNAVAILABLE until a provider exists. MOL never fabricates its state.",
  }),
  system({
    systemId: "mission-runtime", displayName: "Mission Runtime", systemType: "LEARNING", authorityDomain: "MISSION_RUNTIME",
    owner: "Phase 4B Mission Runtime (shs-api)", mode: "LIVE", maturity: "PRODUCTION", integrationMode: "CONTRACT_ONLY",
    capabilities: Object.freeze(["mission-world-context-contract"]),
    interfaces: Object.freeze(["apps/shs-api/src/domain/mission-runtime"]),
    notes: "MOL exposes a read-only world-context contract. It never starts, mutates or completes Missions (deferred to Phase 4G).",
  }),
  system({
    systemId: "agent-fabric", displayName: "Agent Fabric", systemType: "AI_GOVERNANCE", authorityDomain: "AGENT_FABRIC",
    owner: "Agent Fabric", mode: "LIVE", maturity: "PRODUCTION", integrationMode: "CONTRACT_ONLY",
    capabilities: Object.freeze(["world-event-context-contract"]),
    interfaces: Object.freeze(["services/shf-agent-fabric"]),
    notes: "AI governance authority. MOL provides world-event context only and never executes models.",
  }),
  system({
    systemId: "mol", displayName: "Metaverse Orchestration Layer", systemType: "ORCHESTRATION", authorityDomain: "ORCHESTRATION",
    owner: "Phase 4F.5 MOL", mode: "TEST", maturity: "PARTIAL", integrationMode: "ORCHESTRATOR",
    capabilities: Object.freeze(["event-bus", "world-state-projection", "dependency-lookup", "scenario-runner", "replay"]),
    publishes: Object.freeze([T.SYSTEM_HEALTH_CHANGED]),
    interfaces: Object.freeze(["src/system/metaverse/mol"]),
    notes: "Coordinates only. Owns orchestration operational state, never domain facts.",
  }),
]);

// SYSTEM | OWNS | MOL MAY READ | MOL MAY REQUEST | MOL MAY NOT CONTROL
export const MOL_AUTHORITY_MATRIX = Object.freeze([
  ["road-traffic", "Vehicle movement, corridor geometry, closures", "Closure events, approved route IDs", "CONSIDER_CLOSURE (record only)", "Vehicle movement, route geometry, signal timing"],
  ["water-mobility", "Vessel movement, waterway routing", "Restriction events, water zone IDs", "CONSIDER_RESTRICTION (record only)", "Vessel routes, harbor control"],
  ["ocean-environment", "Ocean behavior, weather presentation", "Storm events, preset names", "Nothing", "Wave/weather parameters"],
  ["incident", "Incident lifecycle and state", "Incident events", "Nothing", "Incident creation, dispatch, closure"],
  ["power-grid", "Power state", "Power events", "Nothing", "Grid switching"],
  ["data-center", "Data center operations", "Declared dependency only", "Nothing", "Any data center state"],
  ["mission-runtime", "Mission state, revision, events", "Nothing (contract-only)", "Nothing (4G)", "Mission start, state, completion"],
  ["agent-fabric", "AI governance and execution", "Nothing", "Nothing", "Model execution, AI policy"],
  ["evidence", "Learning/workforce evidence", "Nothing", "Nothing", "Any evidence record"],
  ["truth-spine", "Verified institutional fact", "Nothing", "Nothing", "Any truth record"],
  ["identity-governance", "Users, roles, permissions", "Nothing", "Nothing", "Any identity or permission"],
  ["curriculum-career", "Instruction, pathways", "Nothing", "Nothing", "Any curriculum or career record"],
  ["mol", "Orchestration operational state (log, projections, health)", "All accepted MOL events", "Bounded record-only requests", "Domain facts owned above"],
].map(([system, owns, molMayRead, molMayRequest, molMayNotControl]) => Object.freeze({ system, owns, molMayRead, molMayRequest, molMayNotControl })));

const BY_ID = new Map(MOL_SYSTEMS.map((entry) => [entry.systemId, entry]));

export function getMolSystem(systemId) {
  return BY_ID.get(systemId) || null;
}

export function listMolSystems() {
  return MOL_SYSTEMS;
}

// Exactly one publisher per event type.
export function getMolEventOwner(eventType) {
  return MOL_SYSTEMS.find((entry) => entry.publishes.includes(eventType)) || null;
}

export function validateMolSystemRegistry(systems = MOL_SYSTEMS) {
  const errors = [];
  const ids = new Set();
  const owners = new Map();
  for (const entry of systems) {
    if (ids.has(entry.systemId)) errors.push(`duplicate systemId ${entry.systemId}`);
    ids.add(entry.systemId);
    if (!MOL_SYSTEM_MODES.includes(entry.mode)) errors.push(`${entry.systemId}: invalid mode`);
    if (!MOL_CAPABILITY_MATURITY.includes(entry.maturity)) errors.push(`${entry.systemId}: invalid maturity`);
    if (!MOL_INTEGRATION_MODES.includes(entry.integrationMode)) errors.push(`${entry.systemId}: invalid integration mode`);
    if (MOL_PROHIBITED_TARGETS.includes(entry.authorityDomain)) errors.push(`${entry.systemId}: MOL cannot register a prohibited authority`);
    for (const type of entry.publishes) {
      if (owners.has(type)) errors.push(`${type} has two publishers: ${owners.get(type)} and ${entry.systemId}`);
      owners.set(type, entry.systemId);
    }
    for (const category of entry.worldStateContributions) {
      if (MOL_WORLD_STATE_OWNERS[category] !== entry.authorityDomain) errors.push(`${entry.systemId} cannot contribute to ${category}`);
    }
  }
  for (const entry of systems) for (const dep of entry.dependsOn) if (!ids.has(dep)) errors.push(`${entry.systemId} depends on unknown ${dep}`);
  return Object.freeze(errors);
}

// Deterministic authority validation for an already schema-valid event.
export function checkMolEventAuthority(event, { health = {} } = {}) {
  const source = getMolSystem(event.sourceSystem);
  if (!source) return { ok: false, reason: "UNKNOWN_SOURCE_SYSTEM" };
  if (event.authority !== source.authorityDomain) return { ok: false, reason: "AUTHORITY_MISMATCH" };
  if (!source.publishes.includes(event.eventType)) {
    return { ok: false, reason: getMolEventOwner(event.eventType) ? "EVENT_TYPE_OWNED_BY_OTHER_SYSTEM" : "UNSUPPORTED_EVENT_TYPE" };
  }
  if (source.mode === "UNAVAILABLE" || health[source.systemId] === "UNAVAILABLE") return { ok: false, reason: "SOURCE_UNAVAILABLE" };
  // A provider may only emit in its registered mode; simulated facts can never pose as LIVE.
  if (event.providerMode !== source.mode) return { ok: false, reason: "PROVIDER_MODE_MISMATCH" };
  return { ok: true, source };
}
