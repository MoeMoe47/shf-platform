// Phase 4F.5 — MOL coordination foundation (not the City Event Director).
//
// MOL may observe, correlate, look up dependencies and request bounded actions.
// Requests are orchestration-owned RECORDS addressed to the owning authority;
// MOL never executes them, never moves vehicles or vessels, and can never
// address Evidence, Truth Spine, Identity, Curriculum, Career, credentials,
// Treasury, Agent Fabric execution or Mission Runtime state.

import { MOL_EVENT_TYPES as T } from "./molEventContract.js";
import { MOL_PROHIBITED_TARGETS, getMolSystem, listMolSystems } from "./molSystemRegistry.js";
import { corridorNodeId, destinationNodeId, waterwayNodeId } from "./molRegionalGraph.js";

export const MOL_ACTION_REQUEST_STATUS = "RECORDED";
const ENTITY_TARGETS = Object.freeze({
  TRANSPORT_CORRIDOR: { systemId: "road-traffic", action: "CONSIDER_CLOSURE" },
  WATERWAY: { systemId: "water-mobility", action: "CONSIDER_RESTRICTION" },
});

export function createMolActionRequest({ targetSystem, action, causationEventId, correlationId, subjectRef }) {
  const target = getMolSystem(targetSystem);
  if (!target || MOL_PROHIBITED_TARGETS.includes(target.authorityDomain) || MOL_PROHIBITED_TARGETS.includes(String(targetSystem).toUpperCase())) {
    return { ok: false, reason: "TARGET_NOT_REQUESTABLE" };
  }
  if (!target.acceptsRequests.includes(action)) return { ok: false, reason: "ACTION_NOT_DECLARED_BY_TARGET" };
  return {
    ok: true,
    request: Object.freeze({
      requestId: `${causationEventId}:${targetSystem}:${action}:${subjectRef}`,
      targetSystem, targetAuthority: target.authorityDomain, action, subjectRef, causationEventId, correlationId,
      status: MOL_ACTION_REQUEST_STATUS, executes: false,
    }),
  };
}

// Registers MOL's own routing on a bus. Marked sideEffects so replay never re-issues requests.
export function attachMolCoordinator(bus, { graph } = {}) {
  const requests = new Map();
  const impacts = [];
  bus.subscribe({
    subscriberId: "mol-coordinator",
    eventTypes: [T.INCIDENT_OPENED, T.POWER_FAILURE],
    sideEffects: true,
    handler(event) {
      if (event.eventType === T.INCIDENT_OPENED) {
        for (const entity of event.entities.filter((item) => item.role === "AFFECTED")) {
          const route = ENTITY_TARGETS[entity.entityType];
          if (!route) continue;
          const created = createMolActionRequest({ targetSystem: route.systemId, action: route.action, causationEventId: event.eventId, correlationId: event.correlationId, subjectRef: entity.entityRef });
          if (created.ok && !requests.has(created.request.requestId)) requests.set(created.request.requestId, created.request);
        }
      }
      if (event.eventType === T.POWER_FAILURE && graph && event.location?.destinationId) {
        impacts.push({ causationEventId: event.eventId, correlationId: event.correlationId, ...graph.downstreamImpact(destinationNodeId(event.location.destinationId)) });
      }
    },
  });
  return Object.freeze({ getRequests: () => [...requests.values()], getImpacts: () => impacts.map((item) => ({ ...item, impacted: [...item.impacted] })) });
}

export function graphNodeForLocation(location) {
  if (!location) return null;
  if (location.destinationId) return destinationNodeId(location.destinationId);
  if (location.layerId === "metaverse-traffic-corridors") return corridorNodeId(location.featureId);
  if (location.layerId === "metaverse-water-zones") return waterwayNodeId(location.featureId);
  return null;
}

// --- Contract-only integration seams --------------------------------------------------------

// Read-only world context a future Mission integration (Phase 4G) may observe. It carries no
// learner data and grants no Mission authority: MOL never starts, mutates or completes Missions.
export const MOL_MISSION_WORLD_CONTEXT_CONTRACT = Object.freeze({
  contractVersion: 1, consumer: "mission-runtime", missionAuthority: false, startsMissions: false, containsLearnerData: false,
  fields: Object.freeze(["contractVersion", "generatedAt", "simulated", "environment", "closures", "restrictions", "incidents", "missionAuthority"]),
});

export function projectMolMissionWorldContext(worldState) {
  const list = (category, states) => Object.values(worldState.categories[category])
    .filter((entry) => states.includes(entry.state))
    .map((entry) => ({ key: entry.key, state: entry.state, severity: entry.severity, freshness: entry.freshness, simulated: entry.simulated }));
  return {
    contractVersion: MOL_MISSION_WORLD_CONTEXT_CONTRACT.contractVersion,
    generatedAt: worldState.projectedAt,
    simulated: true,
    environment: worldState.categories.environment.weather ? { state: worldState.categories.environment.weather.state, freshness: worldState.categories.environment.weather.freshness } : null,
    closures: list("traffic", ["CLOSED", "COLLISION_REPORTED"]),
    restrictions: list("water", ["RESTRICTED"]),
    incidents: list("incidents", ["OPEN"]),
    missionAuthority: false,
  };
}

// World-event context for future governed agents. Agent Fabric remains the AI governance
// authority; this projection executes nothing and calls no model provider.
export const MOL_WORLD_EVENT_CONTEXT_CONTRACT = Object.freeze({ contractVersion: 1, consumer: "agent-fabric", executesModels: false, agentAuthority: false });

export function projectMolWorldEventContext(events, { limit = 20 } = {}) {
  return {
    contractVersion: MOL_WORLD_EVENT_CONTEXT_CONTRACT.contractVersion,
    executesModels: false,
    events: events.slice(-limit).map((event) => ({
      eventId: event.eventId, eventType: event.eventType, sourceSystem: event.sourceSystem, severity: event.severity, status: event.status,
      occurredAt: event.occurredAt, correlationId: event.correlationId, causationId: event.causationId, simulated: event.providerMode !== "LIVE",
    })),
  };
}

// --- Observability ---------------------------------------------------------------------------

export function getMolObservability({ bus, worldState, coordinator }) {
  const deadLetters = bus.getDeadLetters();
  const stale = Object.entries(worldState.categories).flatMap(([category, entries]) =>
    Object.values(entries).filter((entry) => entry.freshness !== "CURRENT").map((entry) => ({ category, key: entry.key, freshness: entry.freshness, sourceSystem: entry.sourceSystem })));
  return {
    metrics: bus.getMetrics(),
    deadLetters,
    validationFailures: deadLetters.filter((item) => item.kind === "REJECTED"),
    processingFailures: deadLetters.filter((item) => item.kind === "FAILED_PROCESSING"),
    unavailableSystems: worldState.systems.filter((system) => system.health === "UNAVAILABLE").map((system) => system.systemId),
    degradedSystems: worldState.systems.filter((system) => system.health === "DEGRADED").map((system) => system.systemId),
    staleProjections: stale,
    projectionViolations: worldState.violations,
    actionRequests: coordinator ? coordinator.getRequests() : [],
    dependencyImpacts: coordinator ? coordinator.getImpacts() : [],
    registeredSystems: listMolSystems().length,
  };
}
