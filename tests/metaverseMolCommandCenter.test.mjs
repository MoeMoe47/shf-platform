import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  MOL_COMMAND_CENTER_ROUTE,
  MOL_COMMAND_CENTER_SECTIONS,
  buildMolCommandCenterViewModel,
  createMolScenarioRun,
  createMolSession,
  molStatusLabel,
  replayMolEvents,
} from "../src/system/metaverse/mol/index.js";

const ROUTES = trafficRouteData.routes;
const START = "2026-01-01T08:00:00.000Z";
const NOW = Date.parse(START) + 5 * 60_000;
const page = readFileSync(new URL("../src/pages/metaverse/MolCommandCenterPage.jsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/pages/metaverse/mol-command-center.css", import.meta.url), "utf8");
const cityPage = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");

function activeSession() {
  const session = createMolSession({ trafficRoutes: ROUTES, now: () => NOW });
  const run = createMolScenarioRun({ bus: session.bus, scenarioId: "BRIDGE_INCIDENT", trafficRoutes: ROUTES, startAt: START });
  run.run();
  return { session, run };
}

test("the command center is routed at /metaverse/dev/orchestration beside the existing dev routes", () => {
  assert.equal(MOL_COMMAND_CENTER_ROUTE, "/metaverse/dev/orchestration");
  assert.match(cityPage, /routePath === "\/metaverse\/dev\/orchestration"\) return <MolCommandCenterPage \/>/);
  assert.match(cityPage, /import MolCommandCenterPage from "@\/pages\/metaverse\/MolCommandCenterPage\.jsx"/);
});

test("world status, registry, event stream, dependency list and world state render from the view model", () => {
  const { session, run } = activeSession();
  const vm = buildMolCommandCenterViewModel(session, { scenarioRun: run });
  assert.deepEqual(vm.sections.map((section) => section.id), ["world-status", "system-registry", "event-stream", "dependency-graph", "world-state", "scenario-replay", "diagnostics"]);
  assert.equal(vm.worldStatus.orchestrationState, "HEALTHY");
  assert.equal(vm.worldStatus.activeIncidents, 1);
  assert.equal(vm.worldStatus.activeMissions, null, "Missions are not observed in 4F.5");
  assert.equal(vm.systemRegistry.find((row) => row.systemId === "road-traffic").simulated, true);
  assert.equal(vm.eventStream.length, 5);
  assert.equal(vm.eventStream[0].eventType, "WATERWAY_RESTRICTED", "newest first");
  assert.ok(vm.eventStream.every((row) => row.correlationId && row.simulated));
  assert.ok(vm.dependencyGraph.edges.length >= 6);
  assert.deepEqual(vm.worldState.map((row) => row.category).sort(), ["environment", "incidents", "traffic", "water"]);
  assert.equal(vm.scenario.active.state, "COMPLETED");
  assert.equal(vm.scenario.actionRequests.length, 2);
  for (const section of MOL_COMMAND_CENTER_SECTIONS) assert.match(page, new RegExp(`id="${section.id}"`), section.id);
});

test("degraded systems and failed events are visible with text labels, not color alone", () => {
  const { session } = activeSession();
  session.bus.setSystemHealth("water-mobility", "DEGRADED", "sensor gap");
  session.bus.publish({ eventId: "broken" });
  session.bus.subscribe({ subscriberId: "fails", handler: () => { throw new Error("projection sink down"); } });
  createMolScenarioRun({ bus: session.bus, scenarioId: "TRAFFIC_COLLISION", trafficRoutes: ROUTES, startAt: START }).step();
  const vm = buildMolCommandCenterViewModel(session);
  assert.equal(vm.worldStatus.orchestrationState, "DEGRADED");
  assert.deepEqual(vm.worldStatus.degradedSystems, ["water-mobility"]);
  assert.equal(vm.systemRegistry.find((row) => row.systemId === "water-mobility").healthLabel, "! Degraded");
  assert.equal(vm.systemRegistry.find((row) => row.systemId === "data-center").healthLabel, "✕ Unavailable");
  assert.equal(vm.diagnostics.validationFailures.length, 1);
  assert.equal(vm.diagnostics.processingFailures.length, 1);
  assert.ok(vm.diagnostics.staleProjections.some((row) => row.sourceSystem === "water-mobility"));
  assert.equal(vm.eventStream[0].processing, "FAILED_PROCESSING");
  for (const status of ["HEALTHY", "DEGRADED", "UNAVAILABLE", "STALE", "SOURCE_UNAVAILABLE", "REJECTED"]) assert.match(molStatusLabel(status), /^[✓!✕] [A-Z]/);
});

test("replay is exposed and reports whether it reconstructs the live projection", () => {
  const { session, run } = activeSession();
  const replay = replayMolEvents(session.bus.getEvents(), { now: NOW });
  const vm = buildMolCommandCenterViewModel(session, { scenarioRun: run, replay: { timeline: replay.timeline, matchesLive: true } });
  assert.equal(vm.scenario.replay.timeline.length, 5);
  assert.match(page, /replayMolEvents\(/);
  assert.match(page, /matchesLive/);
});

test("controls are keyboard-accessible native elements with labels, captions and a polite live region", () => {
  const buttons = [...page.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
  assert.ok(buttons.length >= 7);
  assert.ok(buttons.every((button) => /type="button"/.test(button)));
  for (const id of ["mol-cc-scenario", "mol-cc-health-system", "mol-cc-health-state"]) {
    assert.match(page, new RegExp(`<label htmlFor="${id}"`));
    assert.match(page, new RegExp(`<select id="${id}"`));
  }
  for (const label of ["Run scenario", "Step", "Pause", "Resume autoplay", "Replay event chain", "Reset session"]) assert.match(page, new RegExp(`>${label}<`));
  assert.match(page, /<caption>\{caption\}<\/caption>/);
  assert.match(page, /<th key=\{key\} scope="col">/);
  assert.match(page, /role="status" aria-live="polite"/);
  assert.match(page, /tabIndex=\{0\}/, "scrollable tables are focusable");
  assert.doesNotMatch(page, /<svg|<canvas|onClick=\{[^}]*\}\s*role=/, "no graph-only or div-button UI");
  assert.match(css, /:focus-visible/);
});

test("reduced motion is respected and the surface has no animations", () => {
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /animation: none !important/);
  assert.doesNotMatch(css.replace(/@media \(prefers-reduced-motion: reduce\)[\s\S]*$/, ""), /@keyframes|animation:|transition:/);
});

test("the command center has no production-admin powers or domain reach", () => {
  assert.doesNotMatch(page, /\bfetch\s*\(|"\/api\/|localStorage|sessionStorage/);
  const imports = [...page.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(imports.filter((specifier) => !/^(react|@\/system\/metaverse\/(mol\/index|traffic\/metaverseTrafficRoutes)\.(js|json)|\.\/mol-command-center\.css)$/.test(specifier)), []);
  assert.match(page, /In-memory session/);
  assert.match(page, /createMolScenarioRun\(\{/);
});
