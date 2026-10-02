import assert from "node:assert/strict";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  MOL_IMPACT_LIMITS,
  MOL_STALE_POLICY,
  buildMolRegionalTwinGraph,
  buildMolScenarioEvents,
  createMolEventBus,
  createMolGraph,
  createMolScenarioRun,
  destinationNodeId,
  projectMolWorldState,
} from "../src/system/metaverse/mol/index.js";

const ROUTES = trafficRouteData.routes;
const START = "2026-01-01T08:00:00.000Z";
const AT = (minutes) => Date.parse(START) + minutes * 60_000;

function runScenario(scenarioId, bus = createMolEventBus({ now: () => AT(1) })) {
  const run = createMolScenarioRun({ bus, scenarioId, trafficRoutes: ROUTES, startAt: START });
  run.run();
  return { bus, run };
}

// ---------------------------------------------------------------- world state

test("authoritative events update their own projections with source attribution", () => {
  const { bus } = runScenario("TRAFFIC_COLLISION");
  const events = bus.getEvents();
  const mid = projectMolWorldState(events.slice(0, 2), { now: AT(2) });
  const corridor = mid.categories.traffic["route-1-1-mu6436lq"];
  assert.equal(corridor.state, "CLOSED");
  assert.equal(corridor.sourceSystem, "road-traffic");
  assert.equal(corridor.authority, "TRAFFIC");
  assert.equal(corridor.simulated, true);
  assert.equal(corridor.lastEventId, events[1].eventId);
  assert.equal(corridor.freshness, "CURRENT");
  assert.equal(projectMolWorldState(events, { now: AT(16) }).categories.traffic["route-1-1-mu6436lq"].state, "OPEN");
  assert.equal(mid.stalePolicy, MOL_STALE_POLICY);
});

test("Water events update only the Water projection; a forged cross-authority log cannot write", () => {
  const { bus } = runScenario("WATER_RESTRICTION");
  const events = bus.getEvents().slice(0, 2);
  const state = projectMolWorldState(events, { now: AT(3) });
  assert.equal(state.categories.water.RAPIDS_ZONE_01.state, "RESTRICTED");
  assert.equal(state.categories.water.RAPIDS_ZONE_01.authority, "WATER_MOBILITY");
  assert.deepEqual(state.categories.traffic, {});
  // A log entry claiming Traffic authority over a water event is not applied by the reducer.
  const forged = { ...events[1], eventId: "forged", authority: "TRAFFIC", location: { ...events[1].location, featureId: "FLOWING_WATER_MAIN" } };
  const result = projectMolWorldState([...events, forged], { now: AT(3) });
  assert.equal(result.categories.water.FLOWING_WATER_MAIN, undefined);
  assert.deepEqual(result.violations.map((item) => item.reason), ["CATEGORY_OWNED_BY_OTHER_AUTHORITY"]);
});

test("degraded or offline sources keep last-known values marked stale, never refreshed or invented", () => {
  const bus = createMolEventBus({ now: () => AT(2) });
  runScenario("TRAFFIC_COLLISION", bus);
  const completed = projectMolWorldState(bus.getEvents(), { now: AT(2) });
  assert.equal(completed.categories.traffic["route-1-1-mu6436lq"].state, "OPEN");
  const partial = createMolEventBus({ now: () => AT(2) });
  for (const event of bus.getEvents().slice(0, 2)) partial.publish(event);
  partial.setSystemHealth("road-traffic", "UNAVAILABLE", "provider offline");
  const offline = projectMolWorldState(partial.getEvents(), { now: AT(60) });
  const corridor = offline.categories.traffic["route-1-1-mu6436lq"];
  assert.equal(corridor.state, "CLOSED", "last-known value retained, not reopened");
  assert.equal(corridor.freshness, "SOURCE_UNAVAILABLE");
  partial.setSystemHealth("road-traffic", "DEGRADED", "partial");
  assert.equal(projectMolWorldState(partial.getEvents(), { now: AT(3) }).categories.traffic["route-1-1-mu6436lq"].freshness, "STALE");
  // Time alone also marks stale.
  const fresh = createMolEventBus({ now: () => AT(2) });
  for (const event of bus.getEvents().slice(0, 2)) fresh.publish(event);
  assert.equal(projectMolWorldState(fresh.getEvents(), { now: AT(120) }).categories.traffic["route-1-1-mu6436lq"].freshness, "STALE");
});

test("no current state is invented for unavailable systems", () => {
  const { bus } = runScenario("INFRASTRUCTURE_FAILURE");
  const state = projectMolWorldState(bus.getEvents().slice(0, 1), { now: AT(1) });
  assert.equal(state.categories.infrastructure["power-electrical-facility"].state, "FAILED");
  assert.equal(state.categories.infrastructure["main-data-center"], undefined);
  const dataCenter = state.systems.find((system) => system.systemId === "data-center");
  assert.deepEqual([dataCenter.health, dataCenter.projectionAvailable], ["UNAVAILABLE", false]);
});

test("replay of the same log reconstructs the identical projection", () => {
  const { bus } = runScenario("BRIDGE_INCIDENT");
  const events = bus.getEvents();
  assert.deepEqual(projectMolWorldState(structuredClone(events), { now: AT(10) }), projectMolWorldState(events, { now: AT(10) }));
});

// ---------------------------------------------------------------- failures

test("handler failures are captured in dead-letter, isolated from other subscribers, and retried only within a cap", () => {
  const bus = createMolEventBus({ now: () => 0 });
  const healthy = [];
  let attempts = 0;
  bus.subscribe({ subscriberId: "healthy", handler: (event) => healthy.push(event.eventId) });
  bus.subscribe({ subscriberId: "flaky", handler: () => { attempts += 1; throw new Error("projection store offline"); } });
  const [event] = buildMolScenarioEvents("TRAFFIC_COLLISION", { trafficRoutes: ROUTES }).events;
  const result = bus.publish(event);
  assert.equal(result.outcome, "ACCEPTED");
  assert.deepEqual(result.deliveries.map((item) => item.status), ["DELIVERED", "FAILED"]);
  assert.deepEqual(healthy, [event.eventId]);
  const [record] = bus.getDeadLetters();
  assert.equal(record.kind, "FAILED_PROCESSING");
  assert.deepEqual(record.reasons, ["projection store offline"]);
  assert.equal(bus.retryDeadLetter(record.deadLetterId).status, "FAILED");
  assert.equal(bus.retryDeadLetter(record.deadLetterId).status, "EXHAUSTED");
  assert.equal(bus.retryDeadLetter(record.deadLetterId).status, "EXHAUSTED");
  assert.equal(attempts, 3, "never retried beyond the cap");
  assert.equal(bus.getDeadLetters()[0].exhausted, true);
  assert.equal(bus.getMetrics().failedProcessing, 1);
});

test("dead-letter storage is bounded and drops are counted, not silent", () => {
  const bus = createMolEventBus({ now: () => 0, limits: { maxLog: 10, maxDeadLetters: 3, maxProcessingAttempts: 3, maxErrorChars: 50 } });
  for (let index = 0; index < 5; index += 1) bus.publish({ eventId: `junk-${index}` });
  assert.equal(bus.getDeadLetters().length, 3);
  assert.equal(bus.getMetrics().deadLettersDropped, 2);
});

// ---------------------------------------------------------------- dependency graph / digital twin

test("the regional twin graph references canonical IDs without copying records", () => {
  const graph = buildMolRegionalTwinGraph({ trafficRoutes: ROUTES });
  assert.deepEqual(graph.errors, []);
  const facility = graph.getNode(destinationNodeId("main-data-center"));
  assert.deepEqual(facility.ref, { authority: "CANONICAL_DESTINATION_REGISTRY", canonicalId: "main-data-center" });
  assert.deepEqual(Object.keys(facility).sort(), ["kind", "label", "nodeId", "ref"]);
  assert.equal(graph.nodes.filter((node) => node.kind === "TRANSPORT_CORRIDOR").length, ROUTES.filter((route) => route.status === "APPROVED").length);
  assert.ok(graph.nodes.filter((node) => node.kind === "WATERWAY").length > 5);
  assert.deepEqual(graph.dependenciesOf(destinationNodeId("main-data-center")).sort(), [destinationNodeId("cooling-mechanical-plant"), destinationNodeId("power-electrical-facility")]);
});

test("downstream impact is bounded, cycle-safe and reports truncation", () => {
  const graph = buildMolRegionalTwinGraph({ trafficRoutes: ROUTES });
  const impact = graph.downstreamImpact(destinationNodeId("power-electrical-facility"));
  const impacted = impact.impacted.map((item) => item.nodeId);
  for (const nodeId of ["destination:main-data-center", "destination:network-operations-center", "destination:security-operations-center", "system:data-center"]) assert.ok(impacted.includes(nodeId), nodeId);
  assert.ok(impact.impacted.every((item) => item.depth <= MOL_IMPACT_LIMITS.maxDepth));
  assert.equal(graph.downstreamImpact("destination:nowhere").known, false);
  assert.deepEqual(graph.findDependencyCycles(), []);

  const node = (nodeId) => ({ nodeId, kind: "FACILITY", label: nodeId, ref: { authority: "TEST", canonicalId: nodeId } });
  const cyclic = createMolGraph(["a", "b", "c"].map(node), [
    { from: "b", to: "a", type: "DEPENDS_ON" }, { from: "c", to: "b", type: "DEPENDS_ON" }, { from: "a", to: "c", type: "DEPENDS_ON" },
  ]);
  assert.equal(cyclic.findDependencyCycles().length, 1);
  const loop = cyclic.downstreamImpact("a");
  assert.deepEqual(loop.impacted.map((item) => item.nodeId), ["b", "c"], "each node visited once despite the cycle");

  const chain = Array.from({ length: 12 }, (_, i) => node(`n${i}`));
  const line = createMolGraph(chain, chain.slice(1).map((item, i) => ({ from: item.nodeId, to: `n${i}`, type: "DEPENDS_ON" })));
  const bounded = line.downstreamImpact("n0", { maxDepth: 3 });
  assert.equal(bounded.impacted.length, 3);
  assert.equal(bounded.truncated, true);
  assert.equal(line.downstreamImpact("n0", { maxDepth: 20, maxNodes: 5 }).impacted.length, 5);

  const invalid = createMolGraph([node("x")], [{ from: "x", to: "ghost", type: "DEPENDS_ON" }, { from: "x", to: "x", type: "OWNS" }]);
  assert.equal(invalid.errors.length, 2);
  assert.equal(invalid.edges.length, 0);
});
