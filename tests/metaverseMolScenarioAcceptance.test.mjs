import assert from "node:assert/strict";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  MOL_MISSION_WORLD_CONTEXT_CONTRACT,
  MOL_WORLD_EVENT_CONTEXT_CONTRACT,
  attachMolCoordinator,
  buildMolRegionalTwinGraph,
  buildMolScenarioEvents,
  createMolEventBus,
  createMolScenarioRun,
  getMolObservability,
  graphNodeForLocation,
  listMolScenarios,
  projectMolMissionWorldContext,
  projectMolWorldEventContext,
  projectMolWorldState,
  replayMolEvents,
  resolveMolLocation,
} from "../src/system/metaverse/mol/index.js";

const ROUTES = trafficRouteData.routes;
const START = "2026-01-01T08:00:00.000Z";
const NOW = Date.parse(START) + 10 * 60_000;

function session() {
  const bus = createMolEventBus({ now: () => NOW });
  const graph = buildMolRegionalTwinGraph({ trafficRoutes: ROUTES });
  const coordinator = attachMolCoordinator(bus, { graph });
  return { bus, graph, coordinator };
}

function chain(events) {
  return events.map(({ eventId, eventType, sourceSystem, authority, correlationId, causationId, occurredAt }) => ({ eventId, eventType, sourceSystem, authority, correlationId, causationId, occurredAt }));
}

// ---------------------------------------------------------------- scenario runner

test("every approved scenario resolves only real registry references", () => {
  for (const scenario of listMolScenarios()) {
    const built = buildMolScenarioEvents(scenario.scenarioId, { trafficRoutes: ROUTES });
    assert.deepEqual(built.errors, [], scenario.scenarioId);
    assert.equal(built.events.length, scenario.steps.length);
  }
  assert.deepEqual(buildMolScenarioEvents("CITYWIDE_BLACKOUT").errors, ["UNAPPROVED_SCENARIO:CITYWIDE_BLACKOUT"]);
  // Without the approved route registry, corridor references cannot be invented.
  assert.match(buildMolScenarioEvents("TRAFFIC_COLLISION", { trafficRoutes: [] }).errors.join(), /UNKNOWN_CORRIDOR/);
  assert.equal(resolveMolLocation({ kind: "waterway", id: "IMAGINARY_LAKE" }).ok, false);
  assert.equal(resolveMolLocation({ kind: "destination", id: "moon-base" }).ok, false);
});

test("a deterministic scenario produces the same event chain twice", () => {
  const first = createMolScenarioRun({ bus: createMolEventBus({ now: () => NOW }), scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START, seed: "s1" });
  const second = createMolScenarioRun({ bus: createMolEventBus({ now: () => NOW }), scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START, seed: "s1" });
  first.run();
  second.run();
  assert.deepEqual(first.events, second.events);
  assert.deepEqual(first.getTimeline(), second.getTimeline());
  const other = buildMolScenarioEvents("BRIDGE_INCIDENT", { trafficRoutes: ROUTES, startAt: START, seed: "s2" });
  assert.notEqual(other.events[0].eventId, first.events[0].eventId);
});

test("step and pause/resume control a run deterministically", () => {
  const { bus } = session();
  const run = createMolScenarioRun({ bus, scenarioId: "WATER_RESTRICTION", trafficRoutes: ROUTES, startAt: START });
  assert.equal(run.getState(), "READY");
  run.step();
  assert.equal(run.getState(), "PAUSED");
  assert.equal(bus.getEvents().length, 1);
  run.step();
  assert.equal(bus.getEvents().length, 2);
  assert.equal(run.resume(), "COMPLETED");
  assert.equal(bus.getEvents().length, 4);
  assert.equal(run.step(), null);
  assert.equal(run.pause(), "COMPLETED");
});

test("a degraded provider stops only its own causal chain; unrelated coordination continues", () => {
  const { bus } = session();
  bus.setSystemHealth("road-traffic", "UNAVAILABLE", "corridor provider offline");
  const run = createMolScenarioRun({ bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START });
  run.run();
  const outcomes = Object.fromEntries(run.getTimeline().map((item) => [item.eventType, item.outcome]));
  assert.equal(outcomes.STORM_STARTED, "ACCEPTED");
  assert.equal(outcomes.VEHICLE_COLLISION, "REJECTED");
  assert.equal(outcomes.INCIDENT_OPENED, "SKIPPED");
  const world = projectMolWorldState(bus.getEvents(), { now: NOW });
  assert.equal(world.categories.environment.weather.state, "HEAVY_RAIN");
  assert.deepEqual(world.categories.traffic, {}, "no traffic state fabricated while the provider is down");
});

// ---------------------------------------------------------------- replay

test("replay preserves order, IDs, correlation, causation, attribution and timestamps without side effects", () => {
  const { bus, coordinator } = session();
  createMolScenarioRun({ bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START }).run();
  assert.equal(coordinator.getRequests().length, 2);
  const events = bus.getEvents();
  const replay = replayMolEvents(events, { now: NOW });
  assert.deepEqual(chain(replay.bus.getEvents()), chain(events));
  assert.deepEqual(replay.timeline.map((item) => item.outcome), events.map(() => "ACCEPTED"));
  assert.deepEqual(replay.worldState, projectMolWorldState(events, { now: NOW }));

  // Side-effecting subscribers (MOL routing) are skipped in replay mode; requests are not re-issued.
  let sideEffects = 0;
  const replayBus = createMolEventBus({ replay: true, now: () => NOW });
  replayBus.subscribe({ subscriberId: "would-notify", sideEffects: true, handler: () => { sideEffects += 1; } });
  const replayCoordinator = attachMolCoordinator(replayBus, { graph: buildMolRegionalTwinGraph({ trafficRoutes: ROUTES }) });
  for (const event of events) replayBus.publish(structuredClone(event));
  assert.equal(sideEffects, 0);
  assert.equal(replayCoordinator.getRequests().length, 0);
  // Replaying into the live bus is idempotent: duplicates are not reprocessed.
  for (const event of events) assert.equal(bus.publish(structuredClone(event)).outcome, "DUPLICATE");
  assert.equal(coordinator.getRequests().length, 2);
});

// ---------------------------------------------------------------- integration acceptance

test("Traffic event → contract → bus → world state → dependency lookup → command-center data", async () => {
  const { bus, graph, coordinator } = session();
  createMolScenarioRun({ bus, scenarioId: "TRAFFIC_COLLISION", trafficRoutes: ROUTES, startAt: START }).step();
  const [event] = bus.getEvents();
  assert.equal(event.eventType, "VEHICLE_COLLISION");
  assert.equal(event.sourceSystem, "road-traffic");
  const world = projectMolWorldState(bus.getEvents(), { now: NOW });
  assert.equal(world.categories.traffic["route-1-1-mu6436lq"].state, "COLLISION_REPORTED");
  assert.equal(graph.getNode(graphNodeForLocation(event.location)).kind, "TRANSPORT_CORRIDOR");
  const { buildMolCommandCenterViewModel } = await import("../src/system/metaverse/mol/index.js");
  const vm = buildMolCommandCenterViewModel({ bus, graph, coordinator, now: () => NOW });
  assert.equal(vm.eventStream[0].eventType, "VEHICLE_COLLISION");
  assert.equal(vm.worldState[0].sourceSystem, "road-traffic");
});

test("a Water event is visible in MOL without Traffic taking authority", () => {
  const { bus } = session();
  createMolScenarioRun({ bus, scenarioId: "WATER_RESTRICTION", trafficRoutes: ROUTES, startAt: START }).run();
  const world = projectMolWorldState(bus.getEvents().slice(0, 2), { now: NOW });
  assert.equal(world.categories.water.RAPIDS_ZONE_01.sourceSystem, "water-mobility");
  assert.deepEqual(world.categories.traffic, {});
  assert.ok(bus.getEvents().every((event) => event.eventType.startsWith("WATERWAY") ? event.authority === "WATER_MOBILITY" : true));
});

test("one correlated incident coordinates four projections and records requests to owning authorities", () => {
  const { bus, coordinator } = session();
  const run = createMolScenarioRun({ bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START, seed: "acceptance" });
  run.run();
  const events = bus.getEvents();
  assert.ok(events.every((event) => event.correlationId === "BRIDGE_INCIDENT:acceptance"));
  const incident = events.find((event) => event.eventType === "INCIDENT_OPENED");
  assert.equal(events.find((event) => event.eventType === "ROAD_CLOSED").causationId, incident.eventId);
  assert.equal(events.find((event) => event.eventType === "WATERWAY_RESTRICTED").causationId, incident.eventId);
  const world = projectMolWorldState(events, { now: NOW });
  const touched = Object.entries(world.categories).filter(([, entries]) => Object.keys(entries).length).map(([category]) => category).sort();
  assert.deepEqual(touched, ["environment", "incidents", "traffic", "water"]);
  assert.deepEqual(coordinator.getRequests().map((item) => [item.targetSystem, item.targetAuthority, item.action, item.executes]), [
    ["road-traffic", "TRAFFIC", "CONSIDER_CLOSURE", false],
    ["water-mobility", "WATER_MOBILITY", "CONSIDER_RESTRICTION", false],
  ]);
  // Each projection remains attributed to its own source system.
  assert.equal(world.categories.traffic["bridge1w-2-mu64aurl"].sourceSystem, "road-traffic");
  assert.equal(world.categories.water.BRIDGE_DISTURBANCE_BRIDGE_01.sourceSystem, "water-mobility");
  assert.equal(world.categories.incidents["sim-incident-bridge-1"].sourceSystem, "incident");
});

test("infrastructure failure surfaces bounded downstream impact without inventing data-center state", () => {
  const { bus, coordinator } = session();
  createMolScenarioRun({ bus, scenarioId: "INFRASTRUCTURE_FAILURE", trafficRoutes: ROUTES, startAt: START }).step();
  const [impact] = coordinator.getImpacts();
  assert.equal(impact.origin, "destination:power-electrical-facility");
  assert.ok(impact.impacted.some((item) => item.nodeId === "system:data-center"));
  const world = projectMolWorldState(bus.getEvents(), { now: NOW });
  assert.deepEqual(Object.keys(world.categories.infrastructure), ["power-electrical-facility"]);
  const observability = getMolObservability({ bus, worldState: world, coordinator });
  assert.deepEqual(observability.unavailableSystems, ["data-center"]);
});

test("Mission Runtime and Agent Fabric integrations are read-only, learner-free contracts", () => {
  const { bus } = session();
  createMolScenarioRun({ bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START }).run();
  const world = projectMolWorldState(bus.getEvents(), { now: NOW });
  const missionContext = projectMolMissionWorldContext(world);
  assert.equal(MOL_MISSION_WORLD_CONTEXT_CONTRACT.missionAuthority, false);
  assert.equal(MOL_MISSION_WORLD_CONTEXT_CONTRACT.startsMissions, false);
  assert.deepEqual(Object.keys(missionContext).sort(), [...MOL_MISSION_WORLD_CONTEXT_CONTRACT.fields].sort());
  assert.equal(missionContext.missionAuthority, false);
  assert.deepEqual(missionContext.incidents.map((item) => item.key), ["sim-incident-bridge-1"]);
  assert.doesNotMatch(JSON.stringify(missionContext), /userId|learner|email|organization/i);

  const agentContext = projectMolWorldEventContext(bus.getEvents(), { limit: 3 });
  assert.equal(MOL_WORLD_EVENT_CONTEXT_CONTRACT.executesModels, false);
  assert.equal(agentContext.executesModels, false);
  assert.equal(agentContext.events.length, 3);
  assert.ok(agentContext.events.every((item) => item.simulated === true && !("payload" in item)));
});

test("MOL coordination performs no external calls", () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error("external HTTP forbidden"); };
  try {
    const { bus } = session();
    for (const scenario of listMolScenarios()) createMolScenarioRun({ bus, scenarioId: scenario.scenarioId, trafficRoutes: ROUTES, startAt: START, seed: scenario.scenarioId }).run();
    replayMolEvents(bus.getEvents(), { now: NOW });
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(calls, 0);
});
