// Phase 4H — MOL integrated acceptance (root side).
// Proves the 4F.5 foundation still works on its own, that 4G did not make MOL learner-aware or
// Mission-authoritative, that the command center stays a diagnostic surface, that Phase 4 added no
// competing spatial authority, and that current contracts remain forward-compatible with the MOCC.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import { CANONICAL_DESTINATION_IDS } from "../src/system/metaverse/metaverseCanonicalDestinationRegistry.js";
import { COORDINATE_FAMILIES } from "../src/shared/spatial/contracts/constants.js";
import {
  MOL_BUS_LIMITS,
  MOL_EVENT_LIMITS,
  MOL_IMPACT_LIMITS,
  MOL_MISSION_WORLD_CONTEXT_CONTRACT,
  MOL_SUPPORTED_EVENT_VERSIONS,
  MOL_WORLD_EVENT_CONTEXT_CONTRACT,
  buildMolCommandCenterViewModel,
  createMolScenarioRun,
  createMolSession,
  listMolScenarios,
  listMolSystems,
  projectMolMissionWorldContext,
  projectMolWorldState,
  replayMolEvents,
  validateMolSystemRegistry,
} from "../src/system/metaverse/mol/index.js";

const ROUTES = trafficRouteData.routes;
const START = "2026-01-01T08:00:00.000Z";
const NOW = Date.parse(START) + 30 * 60_000;

function files(dir) {
  const root = new URL(dir, import.meta.url);
  return readdirSync(root).flatMap((name) => {
    const path = new URL(name, root);
    if (statSync(path).isDirectory()) return files(`${dir}${name}/`);
    return /\.(js|jsx|ts|mjs)$/.test(name) ? [[`${dir}${name}`, readFileSync(path, "utf8")]] : [];
  });
}

const PHASE4_SOURCES = [
  ...files("../src/system/metaverse/mol/"),
  ...files("../apps/shs-api/src/domain/mission-content/"),
  ...files("../apps/shs-api/src/domain/mission-runtime/"),
  ...files("../apps/shs-api/src/domain/mission-director/"),
  ["../src/pages/metaverse/MolCommandCenterPage.jsx", readFileSync(new URL("../src/pages/metaverse/MolCommandCenterPage.jsx", import.meta.url), "utf8")],
];

test("S17 the 4F.5 MOL foundation still runs end to end on its own", () => {
  assert.deepEqual(validateMolSystemRegistry(), []);
  const session = createMolSession({ trafficRoutes: ROUTES, now: () => NOW });
  for (const scenario of listMolScenarios()) {
    const run = createMolScenarioRun({ bus: session.bus, scenarioId: scenario.scenarioId, trafficRoutes: ROUTES, startAt: START, seed: scenario.scenarioId });
    assert.equal(run.run(), "COMPLETED", scenario.scenarioId);
    assert.ok(run.getTimeline().every((step) => step.outcome === "ACCEPTED"), scenario.scenarioId);
  }
  const events = session.bus.getEvents();
  const world = projectMolWorldState(events, { now: NOW });
  assert.deepEqual(world.violations, []);
  const replay = replayMolEvents(events, { now: NOW });
  assert.deepEqual(replay.worldState, world, "replay reconstructs the identical projection");
  assert.equal(session.coordinator.getRequests().length, 2);
  assert.ok(session.coordinator.getImpacts()[0].impacted.length > 0);
  session.bus.setSystemHealth("water-mobility", "DEGRADED", "acceptance");
  const vm = buildMolCommandCenterViewModel(session);
  assert.equal(vm.worldStatus.orchestrationState, "DEGRADED");
  assert.ok(vm.systemRegistry.every((row) => row.mode !== "LIVE" || ["mission-runtime", "agent-fabric"].includes(row.systemId)), "only contract-only authorities are LIVE");
});

test("S17 4G did not make MOL learner-aware or Mission-authoritative", () => {
  assert.equal(MOL_MISSION_WORLD_CONTEXT_CONTRACT.missionAuthority, false);
  assert.equal(MOL_MISSION_WORLD_CONTEXT_CONTRACT.startsMissions, false);
  assert.equal(MOL_MISSION_WORLD_CONTEXT_CONTRACT.containsLearnerData, false);
  assert.equal(MOL_WORLD_EVENT_CONTEXT_CONTRACT.executesModels, false);
  const session = createMolSession({ trafficRoutes: ROUTES, now: () => NOW });
  createMolScenarioRun({ bus: session.bus, scenarioId: "INFRASTRUCTURE_FAILURE", trafficRoutes: ROUTES, startAt: START }).run();
  const context = projectMolMissionWorldContext(projectMolWorldState(session.bus.getEvents(), { now: NOW }));
  assert.deepEqual(Object.keys(context).sort(), [...MOL_MISSION_WORLD_CONTEXT_CONTRACT.fields].sort());
  assert.doesNotMatch(JSON.stringify(context), /user|learner|email|organization|tenant|accommodat/i);
  for (const [file, source] of files("../src/system/metaverse/mol/")) {
    assert.doesNotMatch(source, /accommodat|MissionRuntimeService|startPublishedMission|mission-runtimes|\.userId\b|prepare_prove|truth_spine/, file);
  }
});

test("S18 the command center stays an in-memory diagnostic surface with no production authority", () => {
  const page = readFileSync(new URL("../src/pages/metaverse/MolCommandCenterPage.jsx", import.meta.url), "utf8");
  const imports = [...page.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(imports.filter((specifier) => !/^(react|@\/system\/metaverse\/(mol\/index\.js|traffic\/metaverseTrafficRoutes\.json)|\.\/mol-command-center\.css)$/.test(specifier)), []);
  assert.doesNotMatch(page, /\bfetch\s*\(|"\/api\/|mission-runtimes|startPublishedMission|accommodat|localStorage|sessionStorage/);
  assert.match(page, /In-memory session/);
  const vm = buildMolCommandCenterViewModel(createMolSession({ trafficRoutes: ROUTES, now: () => NOW }));
  for (const row of vm.systemRegistry.filter((item) => item.mode === "SIMULATED")) assert.equal(row.simulated, true, row.systemId);
  assert.match(page, /\(simulated\)/, "simulated providers are visibly labeled");
});

test("Quick Map / Digital Twin guard: Phase 4 introduced no competing map, coordinate, destination or route authority", () => {
  for (const [file, source] of PHASE4_SOURCES) {
    assert.doesNotMatch(source, /createCoordinateSpaceRegistry|CoordinateSpaceRegistry\s*\(|createSpatialLayerRegistry|COORDINATE_FAMILIES\s*=|CANONICAL_DESTINATION_IDS\s*=|MiniMap[A-Za-z]*Registry\s*=|QuickMap[A-Za-z]*Registry\s*=|RoadTrace[A-Za-z]*\s*=|METAVERSE_[A-Z_]*ROUTES?\s*=/, file);
  }
  // MOL references the canonical registries rather than copying them.
  const session = createMolSession({ trafficRoutes: ROUTES, now: () => NOW });
  const facilities = session.graph.nodes.filter((node) => node.kind === "FACILITY");
  assert.equal(facilities.length, Object.values(CANONICAL_DESTINATION_IDS).length);
  assert.ok(facilities.every((node) => node.ref.authority === "CANONICAL_DESTINATION_REGISTRY"));
  createMolScenarioRun({ bus: session.bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START }).run();
  assert.ok(session.bus.getEvents().every((event) => event.location === null || Object.values(COORDINATE_FAMILIES).includes(event.location.coordinateFamily)));
});

test("MOCC forward compatibility: current contracts can feed a future operations center without rework of authority", () => {
  // Versioned, attributable event contract (→ Universal Event Registry).
  assert.deepEqual([...MOL_SUPPORTED_EVENT_VERSIONS], [1]);
  // Registry already declares publish / consume / request / state contributions (→ control declarations).
  for (const system of listMolSystems()) {
    for (const key of ["publishes", "consumes", "acceptsRequests", "worldStateContributions", "dependsOn", "mode", "maturity", "authorityDomain"]) assert.ok(key in system, `${system.systemId}.${key}`);
  }
  // Dependency impact and replay timelines are structured data (→ cascade and replay views).
  const session = createMolSession({ trafficRoutes: ROUTES, now: () => NOW });
  createMolScenarioRun({ bus: session.bus, scenarioId: "INFRASTRUCTURE_FAILURE", trafficRoutes: ROUTES, startAt: START }).run();
  const impact = session.coordinator.getImpacts()[0];
  assert.ok(impact.impacted.every((item) => typeof item.depth === "number" && item.via));
  const replay = replayMolEvents(session.bus.getEvents(), { now: NOW });
  assert.ok(replay.timeline.every((item) => item.eventId && item.correlationId && item.authority && item.sourceSystem));
});

test("bounded behavior of MOL limits", () => {
  assert.ok(MOL_EVENT_LIMITS.maxEventBytes <= 4096 && MOL_EVENT_LIMITS.maxPayloadBytes <= 1024 && MOL_EVENT_LIMITS.maxEntities <= 12);
  assert.ok(MOL_BUS_LIMITS.maxLog <= 2000 && MOL_BUS_LIMITS.maxDeadLetters <= 200 && MOL_BUS_LIMITS.maxProcessingAttempts <= 3);
  assert.ok(MOL_IMPACT_LIMITS.maxDepth <= 4 && MOL_IMPACT_LIMITS.maxNodes <= 50);
});
