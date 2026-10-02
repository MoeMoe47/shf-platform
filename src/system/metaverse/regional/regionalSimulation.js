// Phase 9 — Regional Simulation Authority.
//
// The Regional Simulation Authority owns simulated regional world state. It does not establish real-world civic truth.
//
// It coordinates registered MOL systems through the existing MOL bus, Regional Twin Graph, approved scenarios and
// world-state projection; it adds only: a deterministic simulation clock, honest simulation modes, hosting of
// regional scenarios, and SIMULATED propagation of impacts along DECLARED dependency edges. It never rewrites a domain
// system's internal state: impacts are its own events (REGIONAL_IMPACT_PROJECTED), owned by REGIONAL_SIMULATION.
// Everything is in-memory and deterministic: time advances only through explicit controls.

import {
  MOL_EVIDENCE_POLICY, MOL_EVENT_TYPES as T, MOL_TRUTH_POLICY, createMolEvent,
} from "../mol/molEventContract.js";
import { createMolEventBus } from "../mol/molEventBus.js";
import { buildMolRegionalTwinGraph, systemNodeId } from "../mol/molRegionalGraph.js";
import { graphNodeForLocation, projectMolMissionWorldContext } from "../mol/molCoordination.js";
import { MOL_SCENARIO_DEFAULT_START, buildMolScenarioEvents } from "../mol/molScenarios.js";
import { getMolSystem, listMolSystems } from "../mol/molSystemRegistry.js";
import { projectMolWorldState } from "../mol/molWorldState.js";
import { REGIONAL_SCENARIOS } from "./regionalScenarios.js";

export const REGIONAL_SIMULATION_SYSTEM_ID = "regional-simulation";
export const REGIONAL_SIMULATION_AUTHORITY = "REGIONAL_SIMULATION";
export const REGIONAL_SIMULATION_STATUSES = Object.freeze(["STOPPED", "RUNNING", "PAUSED"]);
export const REGIONAL_SIMULATION_MODES = Object.freeze(["TEST", "SIMULATED", "HYBRID"]);
export const REGIONAL_SIMULATION_CONTROLS = Object.freeze(["START", "PAUSE", "RESUME", "RESET", "ADVANCE"]);
export const REGIONAL_SCENARIO_STATES = Object.freeze(["RUNNING", "PAUSED", "STOPPED", "COMPLETED", "BLOCKED"]);
export const REGIONAL_DEPENDENCY_TAGS = Object.freeze(["DECLARED", "SIMULATED", "VERIFIED"]);
export const REGIONAL_LIMITS = Object.freeze({ maxAdvanceMs: 24 * 60 * 60 * 1000, maxActiveScenarios: 4, maxEventsPerAdvance: 200 });
export const REGIONAL_WORLD_TRUTH = Object.freeze({ realWorld: false, truthPolicy: MOL_TRUTH_POLICY, evidencePolicy: MOL_EVIDENCE_POLICY });

// Source events that open simulated impacts, and the events that resolve them.
const IMPACT_SOURCES = Object.freeze([T.POWER_FAILURE, T.INCIDENT_OPENED]);
const RESOLUTIONS = Object.freeze({ [T.POWER_RESTORED]: T.POWER_FAILURE, [T.INCIDENT_CLOSED]: T.INCIDENT_OPENED });

// Systems that supply world state (contribute a world-state category), excluding orchestration itself.
function worldProviders() {
  return listMolSystems().filter((system) => system.worldStateContributions.length && system.systemId !== REGIONAL_SIMULATION_SYSTEM_ID);
}

// REAL vs SIMULATED: LIVE is never a regional simulation mode, and HYBRID needs at least one LIVE world provider.
export function evaluateRegionalSimulationMode(mode) {
  if (mode === "LIVE") return { ok: false, reason: "REGIONAL_LIVE_REQUIRES_LIVE_PROVIDER_AUTHORITY" };
  if (!REGIONAL_SIMULATION_MODES.includes(mode)) return { ok: false, reason: "UNKNOWN_SIMULATION_MODE" };
  if (mode === "HYBRID" && !worldProviders().some((system) => system.mode === "LIVE")) return { ok: false, reason: "HYBRID_REQUIRES_LIVE_WORLD_PROVIDER" };
  return { ok: true };
}

export function createRegionalSimulation({ simulationId, mode = "SIMULATED", startAt = MOL_SCENARIO_DEFAULT_START, trafficRoutes = [], label = "CURRENT" } = {}) {
  if (typeof simulationId !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,120}$/.test(simulationId)) return { ok: false, reason: "SIMULATION_ID_INVALID" };
  const modeCheck = evaluateRegionalSimulationMode(mode);
  if (!modeCheck.ok) return modeCheck;
  if (Number.isNaN(Date.parse(startAt))) return { ok: false, reason: "START_TIME_INVALID" };

  const startMs = Date.parse(startAt);
  const graph = buildMolRegionalTwinGraph({ trafficRoutes });
  let clockMs = startMs;
  let status = "STOPPED";
  let revision = 0;
  let bus;
  let scenarios = new Map();
  let activeImpacts = new Map(); // impactedNodeId -> { causeEventId, causeEventType, correlationId, originNodeId }
  let stateEventSeq = 0;
  const iso = () => new Date(clockMs).toISOString();

  function attach() {
    bus = createMolEventBus({ now: () => clockMs });
    // Marked sideEffects: replay never re-derives impacts; replay re-applies the logged impact events instead.
    bus.subscribe({ subscriberId: "regional-simulation", eventTypes: [...IMPACT_SOURCES, ...Object.keys(RESOLUTIONS)], sideEffects: true, handler: propagate });
  }

  function impactEvent(cause, eventId, item, impact) {
    const node = graph.getNode(item.nodeId);
    const system = node?.kind === "SYSTEM" ? getMolSystem(node.ref.canonicalId) : null;
    return createMolEvent({
      eventId, eventType: T.REGIONAL_IMPACT_PROJECTED, occurredAt: iso(), simulationId, simulationTime: iso(),
      sourceSystem: REGIONAL_SIMULATION_SYSTEM_ID, authority: REGIONAL_SIMULATION_AUTHORITY, providerMode: "SIMULATED",
      location: node?.kind === "FACILITY" ? { coordinateFamily: cause.location?.coordinateFamily ?? "METAVERSE", destinationId: node.ref.canonicalId } : null,
      severity: impact === "CLEARED" ? "INFO" : item.depth === 1 ? "MAJOR" : "MODERATE",
      status: impact === "CLEARED" ? "RESOLVED" : "ACTIVE",
      entities: [{ entityType: node?.kind ?? "UNKNOWN", entityRef: node?.ref.canonicalId ?? item.nodeId, role: "AFFECTED" }],
      correlationId: cause.correlationId, causationId: cause.eventId,
      payload: {
        impactedNodeId: item.nodeId, impactedKind: node?.kind ?? "UNKNOWN", viaNodeId: item.via ?? "none", depth: item.depth ?? 0, impact,
        relationship: "DECLARED", sourceEventType: cause.eventType,
        // A system with no provider cannot confirm its own state; the impact is modeled only.
        participantStatus: system ? (system.mode === "UNAVAILABLE" ? "PROVIDER_UNAVAILABLE" : `${system.mode}_PROVIDER`) : "NOT_A_SYSTEM",
      },
    });
  }

  // Propagation follows DECLARED graph edges only (bounded BFS in molRegionalGraph). It publishes simulated impact
  // events; it never edits another authority's state.
  function propagate(event) {
    const origin = graphNodeForLocation(event.location);
    if (IMPACT_SOURCES.includes(event.eventType)) {
      if (!origin) return;
      for (const item of graph.downstreamImpact(origin).impacted) {
        // The failing source system is the cause, not an impacted dependent.
        if (activeImpacts.has(item.nodeId) || item.nodeId === systemNodeId(event.sourceSystem)) continue;
        activeImpacts.set(item.nodeId, { causeEventId: event.eventId, causeEventType: event.eventType, correlationId: event.correlationId, originNodeId: origin });
        bus.publish(impactEvent(event, `${event.eventId}:impact:${item.nodeId}`, item, "DEGRADED"));
      }
      return;
    }
    const resolves = RESOLUTIONS[event.eventType];
    for (const [nodeId, impact] of [...activeImpacts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      if (impact.causeEventType !== resolves || (origin && impact.originNodeId !== origin)) continue;
      activeImpacts.delete(nodeId);
      bus.publish(impactEvent(event, `${event.eventId}:clear:${nodeId}`, { nodeId, depth: 0, via: impact.originNodeId }, "CLEARED"));
    }
  }

  function recordState(previousStatus, control) {
    stateEventSeq += 1;
    revision += 1;
    bus.publish(createMolEvent({
      eventId: `${simulationId}:state:${stateEventSeq}`, eventType: T.SIMULATION_STATE_CHANGED, occurredAt: iso(), simulationId, simulationTime: iso(),
      sourceSystem: REGIONAL_SIMULATION_SYSTEM_ID, authority: REGIONAL_SIMULATION_AUTHORITY, providerMode: "SIMULATED", severity: "INFO",
      status: status === "STOPPED" ? "RESOLVED" : "ACTIVE", correlationId: `${simulationId}:lifecycle`,
      entities: [{ entityType: "SYSTEM", entityRef: REGIONAL_SIMULATION_SYSTEM_ID, role: "SUBJECT" }],
      payload: { status, previousStatus, control, revision, mode },
    }));
  }

  const transition = (from, to, control) => {
    if (!from.includes(status)) return { ok: false, reason: "INVALID_TRANSITION", status };
    const previous = status;
    status = to;
    recordState(previous, control);
    return { ok: true, status, revision };
  };

  function start() { return transition(["STOPPED"], "RUNNING", "START"); }
  function pause() { return transition(["RUNNING"], "PAUSED", "PAUSE"); }
  function resume() { return transition(["PAUSED"], "RUNNING", "RESUME"); }
  function reset() {
    clockMs = startMs;
    status = "STOPPED";
    scenarios = new Map();
    activeImpacts = new Map();
    stateEventSeq = 0;
    revision += 1;
    attach();
    return { ok: true, status, revision };
  }

  // Deterministic: emits every scheduled scenario event due by the new clock, in time then step order.
  function advance(ms) {
    if (status !== "RUNNING") return { ok: false, reason: "SIMULATION_NOT_RUNNING", status };
    if (!Number.isInteger(ms) || ms < 0 || ms > REGIONAL_LIMITS.maxAdvanceMs) return { ok: false, reason: "ADVANCE_OUT_OF_BOUNDS" };
    const target = clockMs + ms;
    const published = [];
    for (;;) {
      const due = [...scenarios.values()].filter((run) => run.state === "RUNNING")
        .flatMap((run) => run.pending.length ? [{ run, event: run.pending[0] }] : [])
        .filter(({ event }) => Date.parse(event.occurredAt) <= target)
        .sort((a, b) => Date.parse(a.event.occurredAt) - Date.parse(b.event.occurredAt) || a.event.eventId.localeCompare(b.event.eventId))[0];
      if (!due || published.length >= REGIONAL_LIMITS.maxEventsPerAdvance) break;
      const { run, event } = due;
      run.pending.shift();
      clockMs = Math.max(clockMs, Date.parse(event.occurredAt));
      const outcome = event.causationId && run.rejected.has(event.causationId)
        ? { outcome: "SKIPPED", reasons: ["CAUSE_NOT_ACCEPTED"] }
        : bus.publish({ ...event, simulationId, simulationTime: event.occurredAt });
      if (outcome.outcome !== "ACCEPTED" && outcome.outcome !== "DUPLICATE") run.rejected.add(event.eventId);
      run.timeline.push({ eventId: event.eventId, eventType: event.eventType, outcome: outcome.outcome });
      published.push(event.eventId);
      if (!run.pending.length) run.state = "COMPLETED";
    }
    clockMs = target;
    revision += 1;
    return { ok: true, simulationTime: iso(), published };
  }

  // Hosts an existing approved MOL scenario. Required participants that are unavailable BLOCK it; optional ones
  // DEGRADE it. Mission execution stays with Mission Runtime.
  function startScenario(regionalScenarioId, { seed = "seed-1" } = {}) {
    const definition = REGIONAL_SCENARIOS[regionalScenarioId];
    if (!definition) return { ok: false, reason: "UNKNOWN_REGIONAL_SCENARIO" };
    if (status !== "RUNNING") return { ok: false, reason: "SIMULATION_NOT_RUNNING" };
    if (scenarios.has(regionalScenarioId) && !["COMPLETED", "STOPPED", "BLOCKED"].includes(scenarios.get(regionalScenarioId).state)) return { ok: false, reason: "SCENARIO_ALREADY_ACTIVE" };
    if ([...scenarios.values()].filter((run) => run.state === "RUNNING" || run.state === "PAUSED").length >= REGIONAL_LIMITS.maxActiveScenarios) return { ok: false, reason: "SCENARIO_LIMIT_REACHED" };
    const health = bus.getHealth();
    const participants = definition.participants.map((item) => {
      const system = getMolSystem(item.systemId);
      const available = Boolean(system) && system.mode !== "UNAVAILABLE" && health[item.systemId] !== "UNAVAILABLE";
      return { ...item, status: !system ? "UNKNOWN" : available ? (health[item.systemId] === "DEGRADED" ? "DEGRADED" : "AVAILABLE") : "UNAVAILABLE" };
    });
    const absent = definition.absentParticipants.map((concept) => ({ concept, status: "UNAVAILABLE", reason: "NO_REGISTERED_SYSTEM" }));
    const blockedBy = participants.filter((item) => item.required && item.status !== "AVAILABLE" && item.status !== "DEGRADED").map((item) => item.systemId);
    if (blockedBy.length) {
      scenarios.set(regionalScenarioId, { regionalScenarioId, state: "BLOCKED", participants, absent, pending: [], rejected: new Set(), timeline: [], correlationId: null });
      return { ok: false, reason: "REQUIRED_PARTICIPANT_UNAVAILABLE", blockedBy, state: "BLOCKED" };
    }
    const built = buildMolScenarioEvents(definition.molScenarioId, { seed, startAt: iso(), trafficRoutes });
    if (!built.ok) return { ok: false, reason: "SCENARIO_REFERENCES_UNRESOLVED", errors: built.errors };
    const degraded = participants.filter((item) => item.status !== "AVAILABLE").map((item) => item.systemId);
    const run = { regionalScenarioId, state: "RUNNING", participants, absent, pending: [...built.events], rejected: new Set(), timeline: [], correlationId: built.correlationId };
    scenarios.set(regionalScenarioId, run);
    revision += 1;
    return { ok: true, state: "RUNNING", correlationId: built.correlationId, condition: degraded.length || absent.length ? "DEGRADED" : "NOMINAL", degradedParticipants: degraded, absentParticipants: absent };
  }

  const scenarioControl = (regionalScenarioId, from, to) => {
    const run = scenarios.get(regionalScenarioId);
    if (!run) return { ok: false, reason: "UNKNOWN_REGIONAL_SCENARIO" };
    if (!from.includes(run.state)) return { ok: false, reason: "INVALID_TRANSITION", state: run.state };
    run.state = to;
    revision += 1;
    return { ok: true, state: to };
  };

  function getWorldState() {
    return projectMolWorldState(bus.getEvents(), { now: clockMs });
  }

  // Bounded state contract: simulated regional world state only. No learner identity, accommodation data,
  // credentials, Evidence, financial data or real dispatch data can appear here: it is projected from MOL events,
  // whose contract forbids them.
  function getState() {
    const world = getWorldState();
    const events = bus.getEvents();
    const last = events.at(-1);
    const entries = (category, states) => Object.values(world.categories[category]).filter((entry) => states.includes(entry.state)).map((entry) => entry.key).sort();
    return {
      simulationId, simulationRevision: revision, status, label,
      clock: { startedAt: new Date(startMs).toISOString(), simulationTime: iso(), elapsedMs: clockMs - startMs },
      environmentMode: mode, ...REGIONAL_WORLD_TRUTH,
      activeSystems: world.systems.filter((system) => system.projectionAvailable).map((system) => system.systemId),
      systemStates: world.systems.map((system) => ({ systemId: system.systemId, mode: system.mode, maturity: system.maturity, health: system.health })),
      activeIncidents: entries("incidents", ["OPEN"]),
      mobilitySummary: { closedCorridors: entries("traffic", ["CLOSED", "COLLISION_REPORTED"]), restrictedWaterways: entries("water", ["RESTRICTED"]) },
      infrastructureSummary: { failed: entries("infrastructure", ["FAILED"]), impacted: entries("regionalImpacts", ["DEGRADED"]) },
      environmentSummary: { weather: world.categories.environment.weather?.state ?? "CLEAR" },
      activeScenarios: [...scenarios.values()].map((run) => ({ regionalScenarioId: run.regionalScenarioId, state: run.state, correlationId: run.correlationId,
        participants: run.participants.map((item) => ({ systemId: item.systemId, required: item.required, status: item.status })), absentParticipants: run.absent.map((item) => item.concept) })),
      worldFlags: {
        powerDisruption: entries("infrastructure", ["FAILED"]).length > 0,
        stormActive: !["CLEAR", undefined].includes(world.categories.environment.weather?.state),
        incidentsOpen: entries("incidents", ["OPEN"]).length > 0,
      },
      lastEventRef: last ? { eventId: last.eventId, eventType: last.eventType, sequence: events.length } : null,
      createdAt: new Date(startMs).toISOString(), updatedAt: iso(),
    };
  }

  // Dependency graph projection: DECLARED edges come from the registry/graph; SIMULATED edges are this
  // simulation's active impacts. Nothing here is VERIFIED.
  function getDependencyProjection() {
    const declared = graph.edges.filter((edge) => edge.type === "DEPENDS_ON").map((edge) => ({ from: edge.from, to: edge.to, tag: "DECLARED" }));
    const simulated = [...activeImpacts.entries()].map(([nodeId, impact]) => ({ from: impact.originNodeId, to: nodeId, tag: "SIMULATED", causeEventId: impact.causeEventId }));
    return { readOnly: true, edges: [...declared, ...simulated].sort((a, b) => `${a.tag}${a.from}${a.to}`.localeCompare(`${b.tag}${b.from}${b.to}`)), verifiedEdges: 0 };
  }

  attach();
  return {
    ok: true,
    simulation: Object.freeze({
      simulationId, mode, label,
      start, pause, resume, reset, advance,
      startScenario,
      pauseScenario: (id) => scenarioControl(id, ["RUNNING"], "PAUSED"),
      resumeScenario: (id) => scenarioControl(id, ["PAUSED"], "RUNNING"),
      stopScenario: (id) => scenarioControl(id, ["RUNNING", "PAUSED"], "STOPPED"),
      getState, getWorldState, getDependencyProjection,
      getEvents: () => bus.getEvents(),
      getLog: () => bus.getLog(),
      getHealth: () => bus.getHealth(),
      getGraph: () => graph,
      // Read-only Mission world context through the existing MOL contract (Mission Runtime stays authoritative).
      getMissionWorldContext: () => projectMolMissionWorldContext(getWorldState()),
      // Domain systems publish their own events through MOL; the simulation never authors them.
      publishDomainEvent: (event) => bus.publish(event),
      nodeForSystem: (systemId) => systemNodeId(systemId),
    }),
  };
}
