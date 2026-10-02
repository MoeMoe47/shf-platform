// Phase 9 — Living Regional Simulation + Core MOCC + World Audio Engine (shared, pure layer).
// The Regional Simulation Authority owns simulated regional world state. It does not establish real-world civic truth.
// The MOCC coordinates authorities; it does not replace them.
// The World Audio Engine presents authoritative or simulated events. It does not create the underlying event.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import {
  MOL_EVENT_TYPES as T, createMolEvent, getMolEventDefinition, getMolSystem, listMolSystems, validateMolEventRegistry, validateMolSystemRegistry,
  validateRegisteredMolEvent, MOL_EVENT_CATEGORIES,
} from "../src/system/metaverse/mol/index.js";
import {
  REGIONAL_SCENARIOS, createRegionalSimulation, createReplaySession, evaluateRegionalSimulationMode, runWhatIf,
} from "../src/system/metaverse/regional/index.js";
import {
  MOCC_CONTROLS, MOCC_CONTRACT, MOCC_OVERLAYS, MOCC_PERMISSIONS, buildMoccViewModel, createMoccAuditLog, createMoccPresentationState,
  executeMoccOperatorAction, executeMoccOperatorActionDurable, filterMoccTimeline,
} from "../src/system/metaverse/mocc/index.js";
import {
  AUDIO_PRIORITY_CLASSES, MUSIC_STATES, computeSpatialGain, createWorldAudioEngine, deriveCityMood, nextMusicState, signageForEvent,
  storytellingForEvent, validateAudioSource, validateSign,
} from "../src/shared/experience/audio/index.js";
import {
  ACCESSIBILITY_SENSORY_KEYS, REGIONAL_AUDIO_LANDMARKS, REGIONAL_WORLD_SENSORY_TRIGGERS, SOUND_CATEGORIES, buildSensoryRegistry,
} from "../src/shared/experience/sensory/index.js";
import { defaultSpatialLayerRegistry } from "../src/shared/spatial/index.js";
import { MINIMAP_ASSET } from "../src/system/metaverse/metaverseMiniMapRegistry.js";

const OPERATOR = { operatorId: "operator-1", permissions: [MOCC_PERMISSIONS.VIEW, MOCC_PERMISSIONS.OPERATE] };
const VIEWER = { operatorId: "viewer-1", permissions: [MOCC_PERMISSIONS.VIEW] };
const NONE = Object.fromEntries(ACCESSIBILITY_SENSORY_KEYS.map((key) => [key, false]));
const registry = buildSensoryRegistry();

function powerRun(id = "sim-power") {
  const { simulation } = createRegionalSimulation({ simulationId: id });
  simulation.start();
  simulation.startScenario("REGIONAL_POWER_DISRUPTION");
  simulation.advance(0);
  return simulation;
}
const engineFor = (accessibility = NONE, extra = {}) => createWorldAudioEngine({ sensoryRegistry: registry, policyId: "policy.regional-world", accessibility, triggers: REGIONAL_WORLD_SENSORY_TRIGGERS, ...extra });
const learnerPattern = /learner|user_?id|userId|email|accommodat|diagnosis|credentialId|evidenceId|password|token/i;

// ---------------------------------------------------------------- regional simulation (1–20)

test("1/2/3 the Regional Simulation Authority is registered in MOL, honest about mode/maturity, and never real-world truth", () => {
  const system = getMolSystem("regional-simulation");
  assert.deepEqual([system.authorityDomain, system.mode, system.maturity], ["REGIONAL_SIMULATION", "SIMULATED", "SIMULATED"]);
  assert.deepEqual([...system.publishes].sort(), ["REGIONAL_IMPACT_PROJECTED", "SIMULATION_STATE_CHANGED"]);
  assert.ok(system.consumes.includes("POWER_FAILURE") && system.worldStateContributions.includes("regionalImpacts"));
  assert.deepEqual(validateMolSystemRegistry(), []);
  const state = powerRun().getState();
  assert.deepEqual([state.realWorld, state.truthPolicy, state.evidencePolicy], [false, "NOT_INSTITUTIONAL_TRUTH", "NOT_EVIDENCE"]);
});

test("4/5/6/7/8 deterministic clock: start, pause, resume, reset, advance", () => {
  const { simulation } = createRegionalSimulation({ simulationId: "sim-clock", startAt: "2026-03-01T00:00:00.000Z" });
  assert.equal(simulation.getState().status, "STOPPED");
  assert.deepEqual(simulation.advance(1000), { ok: false, reason: "SIMULATION_NOT_RUNNING", status: "STOPPED" });
  assert.equal(simulation.start().status, "RUNNING");
  assert.equal(simulation.advance(60000).simulationTime, "2026-03-01T00:01:00.000Z");
  assert.equal(simulation.pause().status, "PAUSED");
  assert.deepEqual(simulation.pause().reason, "INVALID_TRANSITION");
  assert.equal(simulation.advance(1000).reason, "SIMULATION_NOT_RUNNING", "time never moves while paused");
  assert.equal(simulation.resume().status, "RUNNING");
  assert.equal(simulation.advance(-1).reason, "ADVANCE_OUT_OF_BOUNDS");
  const reset = simulation.reset();
  assert.deepEqual([reset.status, simulation.getState().clock.simulationTime, simulation.getEvents().length], ["STOPPED", "2026-03-01T00:00:00.000Z", 0]);
});

test("9/10/15 deterministic event ordering; replay preserves order and correlation", () => {
  const a = powerRun("same-id");
  const b = powerRun("same-id");
  assert.deepEqual(a.getEvents().map((event) => event.eventId), b.getEvents().map((event) => event.eventId));
  a.advance(1300 * 1000);
  const events = a.getEvents();
  const replay = createReplaySession(events, { now: 0 }).session;
  replay.resume();
  assert.deepEqual(replay.getTimeline().map((item) => item.eventId), events.map((event) => event.eventId));
  assert.deepEqual(replay.getTimeline().map((item) => [item.correlationId, item.causationId]), events.map((event) => [event.correlationId, event.causationId]));
  assert.equal(replay.compareWith(events).matches, true);
  // Every impact cites its cause.
  for (const event of events.filter((item) => item.eventType === T.REGIONAL_IMPACT_PROJECTED)) {
    assert.ok(events.some((cause) => cause.eventId === event.causationId), event.eventId);
    assert.equal(event.correlationId, "INFRASTRUCTURE_FAILURE:seed-1");
  }
});

test("11 replay cannot mutate canonical real-world authorities and re-derives nothing", () => {
  const simulation = powerRun();
  const before = simulation.getEvents().length;
  const replay = createReplaySession(simulation.getEvents(), { now: 0 }).session;
  replay.resume();
  assert.deepEqual([replay.label, replay.mutatesAuthorities, replay.realWorld], ["REPLAY", false, false]);
  assert.equal(simulation.getEvents().length, before, "the source simulation is untouched");
  assert.equal(replay.getTimeline().length, before, "replay re-applies logged impacts; it does not re-derive new ones");
  assert.deepEqual(createReplaySession(simulation.getEvents(), { fromSequence: 5, toSequence: 2 }), { ok: false, reason: "REPLAY_RANGE_INVALID" });
});

test("12/13/14 event envelope and registry: registered types, owner authority and bounded payloads", () => {
  assert.deepEqual(validateMolEventRegistry(), []);
  const definition = getMolEventDefinition("POWER_FAILURE");
  assert.deepEqual([definition.category, definition.sourceSystem, definition.sourceAuthority, definition.replayable, definition.auditable, definition.moccVisible],
    ["UTILITY", "power-grid", "POWER_GRID", true, true, true]);
  assert.ok(MOL_EVENT_CATEGORIES.includes("OPERATOR") && MOL_EVENT_CATEGORIES.includes("SCENARIO"));
  const base = createMolEvent({ eventId: "e1", eventType: "POWER_FAILURE", occurredAt: "2026-01-01T00:00:00Z", sourceSystem: "power-grid", authority: "POWER_GRID", providerMode: "SIMULATED", correlationId: "c1" });
  assert.equal(validateRegisteredMolEvent(base).valid, true);
  assert.ok(validateRegisteredMolEvent({ ...base, eventType: "DRAGON_SIGHTED" }).errors.includes("eventType DRAGON_SIGHTED is not registered"));
  assert.ok(validateRegisteredMolEvent({ ...base, authority: "" }).errors.some((error) => /authority/.test(error)));
  assert.ok(validateRegisteredMolEvent({ ...base, authority: "TRAFFIC" }).errors.includes("authority must be POWER_GRID"));
  assert.ok(validateRegisteredMolEvent({ ...base, payload: { dumpingGround: "x" } }).errors.includes("payload.dumpingGround is not declared for POWER_FAILURE"));
  assert.ok(validateRegisteredMolEvent({ ...base, simulationId: "bad id!" }).errors.includes("simulationId must be a stable identifier"));
  // The bus rejects an unknown type from any source.
  const { simulation } = createRegionalSimulation({ simulationId: "sim-reject" });
  assert.equal(simulation.publishDomainEvent({ ...base, eventType: "DRAGON_SIGHTED" }).outcome, "REJECTED");
});

test("16/17/18 propagation follows declared dependencies; required blocked participants block; optional ones degrade", () => {
  const simulation = powerRun();
  const impacted = simulation.getState().infrastructureSummary.impacted;
  assert.ok(impacted.includes("destination:main-data-center") && impacted.includes("system:data-center"));
  assert.ok(!impacted.includes("system:power-grid"), "the failing source is not its own dependent");
  const projection = simulation.getDependencyProjection();
  assert.equal(projection.readOnly, true);
  assert.equal(projection.verifiedEdges, 0);
  assert.ok(projection.edges.some((edge) => edge.tag === "DECLARED" && edge.from === "destination:main-data-center" && edge.to === "destination:power-electrical-facility"));
  assert.ok(projection.edges.filter((edge) => edge.tag === "SIMULATED").every((edge) => edge.from === "destination:power-electrical-facility"));
  const started = createRegionalSimulation({ simulationId: "sim-degraded" }).simulation;
  started.start();
  const degraded = started.startScenario("REGIONAL_POWER_DISRUPTION");
  assert.deepEqual([degraded.ok, degraded.condition, degraded.degradedParticipants], [true, "DEGRADED", ["data-center"]]);
  assert.ok(degraded.absentParticipants.every((item) => item.status === "UNAVAILABLE" && item.reason === "NO_REGISTERED_SYSTEM"));
  // A required participant that is unavailable blocks the scenario.
  const original = REGIONAL_SCENARIOS.REGIONAL_POWER_DISRUPTION.participants;
  const mutable = { ...REGIONAL_SCENARIOS };
  assert.equal(original.find((item) => item.systemId === "data-center").required, false);
  const blockedSim = createRegionalSimulation({ simulationId: "sim-blocked" }).simulation;
  blockedSim.start();
  const health = blockedSim.publishDomainEvent;
  assert.ok(health && mutable);
  // Mark the required power provider unavailable through MOL's own health event, then start.
  blockedSim.publishDomainEvent(createMolEvent({ eventId: "h1", eventType: "SYSTEM_HEALTH_CHANGED", occurredAt: "2026-01-01T08:00:00.000Z", sourceSystem: "mol",
    authority: "ORCHESTRATION", providerMode: "TEST", correlationId: "h", payload: { systemId: "power-grid", health: "UNAVAILABLE", reason: "test" } }));
  const blocked = blockedSim.startScenario("REGIONAL_POWER_DISRUPTION");
  assert.deepEqual([blocked.ok, blocked.reason, blocked.blockedBy, blocked.state], [false, "REQUIRED_PARTICIPANT_UNAVAILABLE", ["power-grid"], "BLOCKED"]);
});

test("19 a simulation provider cannot be called LIVE; HYBRID needs a real LIVE world provider", () => {
  assert.deepEqual(evaluateRegionalSimulationMode("LIVE"), { ok: false, reason: "REGIONAL_LIVE_REQUIRES_LIVE_PROVIDER_AUTHORITY" });
  assert.deepEqual(evaluateRegionalSimulationMode("HYBRID"), { ok: false, reason: "HYBRID_REQUIRES_LIVE_WORLD_PROVIDER" });
  assert.equal(createRegionalSimulation({ simulationId: "x", mode: "LIVE" }).ok, false);
  assert.ok(powerRun().getEvents().every((event) => event.providerMode !== "LIVE"));
});

test("20/32 regional state and MOCC output contain no learner identity or private data", () => {
  const simulation = powerRun();
  const view = buildMoccViewModel({ simulation, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), operator: OPERATOR });
  assert.doesNotMatch(JSON.stringify(simulation.getState()), learnerPattern);
  assert.doesNotMatch(JSON.stringify({ ...view, permissions: undefined }), learnerPattern);
});

// ---------------------------------------------------------------- MOCC (21–37)

test("21/22 the existing Quick Map is the Digital Twin; overlays are canonical layers on it; no second map", () => {
  const view = buildMoccViewModel({ simulation: powerRun(), auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), operator: OPERATOR });
  assert.deepEqual([view.digitalTwin.baseMap.asset, view.digitalTwin.baseMap.coordinateSpaceId, view.digitalTwin.baseMap.reused], [MINIMAP_ASSET, "metaverse.quick-map", true]);
  for (const overlay of MOCC_OVERLAYS.filter((item) => item.status === "IMPLEMENTED")) {
    const layer = defaultSpatialLayerRegistry.get(overlay.layerId);
    assert.ok(layer.ok, overlay.layerId);
    assert.deepEqual([...layer.layer.supportedCoordinateSpaces], ["metaverse.quick-map"]);
  }
  // Features without a calibrated Quick Map location are listed, never placed.
  const infrastructure = view.digitalTwin.overlays.find((item) => item.overlayId === "infrastructure");
  assert.ok(infrastructure.features.length > 0 && infrastructure.features.every((feature) => feature.mapStatus === "UNMAPPED" && feature.position === null));
  const sources = (dir) => readdirSync(dir).flatMap((name) => statSync(new URL(name, dir)).isDirectory() ? sources(new URL(`${name}/`, dir)) : [[name, readFileSync(new URL(name, dir), "utf8")]]);
  for (const [name, source] of [...sources(new URL("../src/system/metaverse/mocc/", import.meta.url)), ...sources(new URL("../src/system/metaverse/regional/", import.meta.url))]) {
    assert.doesNotMatch(source, /createCoordinateSpace|new CoordinateSpaceRegistry|new SpatialLayerRegistry|MINIMAP_LOCATION_REGISTRY\s*=|\.png"/, `${name} must not define a map or coordinate system`);
  }
});

test("23/24 system health is deterministic and comes from the MOL log, never frontend presence", () => {
  const make = () => buildMoccViewModel({ simulation: powerRun(), auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), operator: OPERATOR }).systemHealth;
  assert.deepEqual(make(), make());
  const health = Object.fromEntries(make().map((item) => [item.systemId, item]));
  assert.equal(health["data-center"].health, "UNAVAILABLE", "a registered but provider-less system is never shown healthy");
  assert.equal(health["power-grid"].currentScenarioImpact, "REGIONAL_POWER_DISRUPTION:AVAILABLE");
  assert.equal(health["regional-simulation"].simulationStatus, "RUNNING");
  const paused = powerRun();
  paused.pause();
  const pausedHealth = buildMoccViewModel({ simulation: paused, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState() }).systemHealth.find((item) => item.systemId === "regional-simulation");
  assert.equal(pausedHealth.health, "PAUSED");
});

test("25/26/36 timeline filters work; current, simulation, replay, test and what-if are labeled", () => {
  const simulation = powerRun();
  const view = buildMoccViewModel({ simulation, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), operator: OPERATOR });
  const entries = view.timeline.entries;
  assert.ok(entries.every((entry) => view.timeline.labels.includes(entry.label)));
  assert.ok(entries.some((entry) => entry.label === "SIMULATION"));
  assert.deepEqual([...new Set(filterMoccTimeline(entries, { system: "power-grid" }).map((entry) => entry.sourceSystem))], ["power-grid"]);
  assert.ok(filterMoccTimeline(entries, { category: "INFRASTRUCTURE" }).every((entry) => entry.eventType === "REGIONAL_IMPACT_PROJECTED"));
  assert.equal(filterMoccTimeline(entries, { severity: "CRITICAL" }).length, 1);
  assert.equal(filterMoccTimeline(entries, { correlationId: "INFRASTRUCTURE_FAILURE:seed-1" }).length, entries.filter((entry) => entry.correlationId === "INFRASTRUCTURE_FAILURE:seed-1").length);
  assert.ok(filterMoccTimeline(entries, { region: "main-data-center" }).every((entry) => entry.destinationId === "main-data-center"));
  const replay = createReplaySession(simulation.getEvents(), { now: 0 }).session;
  replay.resume();
  const withReplay = buildMoccViewModel({ simulation, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), replay });
  assert.equal(withReplay.replay.label, "REPLAY");
  const { simulation: testSim } = createRegionalSimulation({ simulationId: "t", mode: "TEST" });
  testSim.start();
  assert.ok(buildMoccViewModel({ simulation: testSim, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState() }).timeline.entries.length >= 1);
});

test("27/28/29/30/31 operator actions: allow-listed, authorized, request-only for domains, all audited, no workforce activation", () => {
  const { simulation } = createRegionalSimulation({ simulationId: "sim-ops" });
  const auditLog = createMoccAuditLog();
  const presentation = createMoccPresentationState();
  const run = (operator, controlId, params) => executeMoccOperatorAction({ simulation, operator, controlId, params, auditLog, presentation });
  for (const item of MOCC_CONTROLS) {
    for (const key of ["controlId", "targetSystem", "requiredPermission", "owningAuthority", "simulationOnly", "liveAllowed", "auditRequired", "confirmationRequired"]) assert.ok(key in item, `${item.controlId}.${key}`);
    assert.equal(item.liveAllowed, false);
    assert.equal(item.auditRequired, true);
  }
  assert.equal(run(OPERATOR, "executeCommand", { system: "road-traffic" }).decision, "NOT_ALLOWED");
  assert.equal(run(VIEWER, "START_SIMULATION").decision, "NOT_AUTHORIZED");
  assert.equal(run({ operatorId: "", permissions: OPERATOR.permissions }, "START_SIMULATION").result.reason, "ANONYMOUS_OPERATOR");
  assert.equal(run(OPERATOR, "START_SIMULATION").decision, "EXECUTED");
  assert.equal(run(OPERATOR, "RESET_SIMULATION").decision, "CONFIRMATION_REQUIRED");
  assert.equal(run(OPERATOR, "RESET_SIMULATION", { confirmed: true }).decision, "REASON_REQUIRED");
  const request = run(OPERATOR, "REQUEST_DOMAIN_ACTION", { targetSystem: "road-traffic", action: "CONSIDER_CLOSURE", subjectRef: "route-1", reason: "storm" });
  assert.deepEqual([request.decision, request.result.executed, request.result.request.status], ["REQUEST_ONLY", false, "RECORDED"]);
  const activation = run(OPERATOR, "REQUEST_DOMAIN_ACTION", { targetSystem: "workforce-activation", action: "ACTIVATE", reason: "go live" });
  assert.deepEqual([activation.decision, activation.result.reason], ["NOT_AUTHORIZED", "WORKFORCE_ACTIVATION_OWNED_BY_WORKFORCE_AUTHORITY"]);
  assert.equal(MOCC_CONTRACT.ownsWorkforceActivation, false);
  assert.ok(!MOCC_CONTROLS.some((item) => /ACTIVATE_PROGRAM|EXECUTE_COMMAND/.test(item.controlId)));
  assert.equal(run(VIEWER, "TOGGLE_OVERLAY", { overlayId: "mobility" }).decision, "EXECUTED", "viewers may change their own presentation");
  const records = auditLog.list();
  assert.equal(records.length, 10, "every attempt is audited, including rejected and unauthorized ones; a mutation adds its intent");
  assert.deepEqual(records.filter((record) => record.phase === "INTENT").map((record) => [record.controlId, record.decision]), [["START_SIMULATION", "AUTHORIZED"]]);
  for (const record of records) for (const key of ["operatorId", "controlId", "decision", "result", "correlationId", "simulationId"]) assert.ok(key in record);
});

test("fail-closed: a mutation never runs unless its audit intent was recorded (sync and durable executors)", async () => {
  const { simulation } = createRegionalSimulation({ simulationId: "sim-fail-closed" });
  const throwing = createMoccAuditLog({ sink: () => { throw new Error("audit store unavailable"); } });
  assert.throws(() => executeMoccOperatorAction({ simulation, operator: OPERATOR, controlId: "START_SIMULATION", auditLog: throwing }));
  assert.equal(simulation.getState().status, "STOPPED");
  const auditLog = createMoccAuditLog();
  const persisted = [];
  const ok = async (record) => { persisted.push(record); };
  const down = async () => { throw new Error("down"); };
  const durable = (controlId, persistAudit, params = {}) => executeMoccOperatorActionDurable({ simulation, operator: OPERATOR, controlId, params, auditLog, persistAudit });
  assert.deepEqual([(await durable("START_SIMULATION", down)).decision, simulation.getState().status], ["AUDIT_FAILED", "STOPPED"]);
  assert.equal((await durable("START_SIMULATION", ok)).decision, "EXECUTED");
  assert.deepEqual(persisted.map((record) => [record.phase, record.decision, record.simulationTime]), [["INTENT", "AUTHORIZED", "2026-01-01T08:00:00.000Z"], ["RESULT", "EXECUTED", "2026-01-01T08:00:00.000Z"]]);
  const before = JSON.stringify(simulation.getState());
  for (const [controlId, params] of [["PAUSE_SIMULATION"], ["ADVANCE_SIMULATION", { advanceMs: 60000 }], ["START_SCENARIO", { regionalScenarioId: "REGIONAL_POWER_DISRUPTION" }], ["RESET_SIMULATION", { confirmed: true, reason: "x" }]]) {
    assert.equal((await durable(controlId, down, params)).decision, "AUDIT_FAILED", controlId);
  }
  assert.equal(JSON.stringify(simulation.getState()), before, "no mutation without a durable intent");
  // If only the RESULT write fails, the mutation stays covered by its durable intent.
  let calls = 0;
  const resultFails = async (record) => { calls += 1; if (record.phase === "RESULT") throw new Error("down"); };
  const paused = await durable("PAUSE_SIMULATION", resultFails);
  assert.deepEqual([paused.decision, paused.resultAuditPersisted, calls, simulation.getState().status], ["EXECUTED", false, 2, "PAUSED"]);
});

test("33/34/35 program impact uses Phase 8 packets; Mission refs stay minimized; dependency view is read-only", () => {
  const packets = [{ programId: "DATA_CENTER_COMMUNITY_WORKFORCE", status: "INTEGRATION_READINESS", executionLevel: "STANDALONE", activeMissionTypes: ["data-center-cooling-failure-response@1"] }];
  const view = buildMoccViewModel({ simulation: powerRun(), auditLog: createMoccAuditLog(), presentation: createMoccPresentationState(), programImpact: packets });
  assert.deepEqual(view.programImpact, { readOnly: true, programs: packets });
  assert.ok(view.programImpact.programs[0].activeMissionTypes.every((ref) => /^[^@]+@\d+$/.test(ref)));
  assert.equal(view.dependencies.readOnly, true);
});

test("37 What-If output remains simulation-only and never touches the source", () => {
  const simulation = powerRun();
  const before = JSON.stringify(simulation.getState());
  const result = runWhatIf(simulation, { regionalScenarioId: "STORM_FLOOD_RESPONSE", advanceMs: 200000 });
  assert.deepEqual([result.ok, result.label, result.writesCanonical, result.realWorld], [true, "WHAT_IF", false, false]);
  assert.ok(result.changedFlags.includes("stormActive"));
  assert.equal(JSON.stringify(simulation.getState()), before);
});

// ---------------------------------------------------------------- World Audio (38–57)

test("38/40/41 the Sound Registry is reused; sources validate against it; unknown sounds are rejected", () => {
  assert.deepEqual(registry.rejected, []);
  assert.ok(SOUND_CATEGORIES.includes("VOICE_PA"));
  const engine = engineFor();
  assert.equal(engine.addSource({ soundId: "world.ambience.river-flow", looping: true }).ok, true);
  assert.equal(engine.addSource({ soundId: "made.up.sound" }).reason, "UNKNOWN_SOUND");
  assert.ok(validateAudioSource({ sourceId: "s", soundId: "world.ambience.river-flow", priorityClass: "AMBIENCE", state: "PLAYING", occlusionClass: "NONE", position: null, audioNode: {} }, registry)
    .some((error) => /audioNode: unsupported field/.test(error)), "no browser audio internals in the contract");
});

test("39/52 World Audio and City Mood create no events and cannot change world state", () => {
  const simulation = powerRun();
  const count = simulation.getEvents().length;
  const engine = engineFor();
  for (const event of simulation.getEvents()) engine.handleWorldEvent(event);
  const mix = engine.getMix();
  assert.deepEqual([mix.createsEvents, mix.affectsWorldState], [false, false]);
  const mood = engine.getCityMood(simulation.getState());
  assert.equal(mood.affectsWorldState, false);
  assert.equal(simulation.getEvents().length, count);
});

test("42/43/44 spatial attenuation is deterministic, max distance is enforced, occlusion is bounded and spaces never cross", () => {
  const sound = registry.sounds.find((item) => item.soundId === "world.vehicle.port-horn");
  const source = { position: { x: 50, y: 50 }, spatialRef: { coordinateSpaceId: "metaverse.quick-map" }, occlusionClass: "PARTIAL", indoor: false };
  const listener = { coordinateSpaceId: "metaverse.quick-map", position: { x: 50 + 35, y: 50 }, indoor: false };
  const near = computeSpatialGain({ source, listener, sound });
  assert.deepEqual([near.distance, near.gain, near.pan], [35, 0.5, -0.5]);
  assert.deepEqual(computeSpatialGain({ source, listener, sound }), near);
  assert.deepEqual(computeSpatialGain({ source, listener: { ...listener, position: { x: 50 + 71, y: 50 } }, sound }).reason, "BEYOND_MAX_DISTANCE");
  const ambience = registry.sounds.find((item) => item.soundId === "world.ambience.river-flow");
  const outdoor = computeSpatialGain({ source: { ...source, occlusionClass: "FULL" }, listener: { ...listener, position: { x: 60, y: 50 } }, sound: ambience });
  const indoor = computeSpatialGain({ source: { ...source, occlusionClass: "FULL" }, listener: { ...listener, position: { x: 60, y: 50 }, indoor: true }, sound: ambience });
  assert.ok(indoor.gain < outdoor.gain && indoor.gain >= outdoor.gain * 0.15 - 0.001);
  assert.equal(computeSpatialGain({ source, listener: { ...listener, coordinateSpaceId: "metaverse.regional-scene" }, sound }).reason, "CROSS_COORDINATE_SPACE");
});

test("45/46 district profiles resolve and environmental events activate ambience/alerts", () => {
  const engine = engineFor();
  for (const profileId of ["environment-audio.city-core", "environment-audio.river", "environment-audio.port", "environment-audio.oil-rig", "environment-audio.main-data-center"]) {
    assert.equal(engine.setDistrict(profileId).ok, true, profileId);
  }
  assert.equal(engine.setDistrict("environment-audio.atlantis").reason, "UNKNOWN_ENVIRONMENT_PROFILE");
  const storm = createMolEvent({ eventId: "storm-1", eventType: "STORM_STARTED", occurredAt: "2026-01-01T08:00:00Z", sourceSystem: "ocean-environment", authority: "OCEAN_ENVIRONMENT", providerMode: "SIMULATED", correlationId: "storm", severity: "MAJOR", payload: { weatherPreset: "THUNDERSTORM" } });
  assert.equal(engine.handleWorldEvent(storm).presented, true);
  assert.ok(engine.getMix().sources.some((source) => source.soundId === "world.alert.storm-warning" && source.worldEventRef === "storm-1"));
  // Landmarks anchor to calibrated Quick Map locations or regional scenes only.
  assert.ok(REGIONAL_AUDIO_LANDMARKS.every((item) => ["marina-harbor", "fire", "hospital"].includes(item.anchor.locationId) || ["river", "oil-rig"].includes(item.anchor.sceneId)));
});

test("47/48/49 operational alerts outrank celebration; critical alerts cannot be suppressed; no-audio keeps captions and visual alerts", () => {
  const engine = engineFor(NONE, { limits: { maxConcurrentSources: 1, maxSources: 64 } });
  engine.setDistrict("environment-audio.city-core");
  engine.addSource({ soundId: "dc.cue.mission-success", looping: false });
  for (const event of powerRun().getEvents()) engine.handleWorldEvent(event);
  const mix = engine.getMix();
  const alarm = mix.sources.find((source) => source.priorityClass === "CRITICAL_ALERT");
  assert.equal(alarm.state, "PLAYING", "a critical alert survives even a concurrency limit of 1");
  assert.ok(mix.sources.filter((source) => source.priorityClass !== "CRITICAL_ALERT").every((source) => source.state !== "PLAYING"));
  const silent = engineFor({ ...NONE, noAudio: true });
  for (const event of powerRun().getEvents()) silent.handleWorldEvent(event);
  const silentMix = silent.getMix();
  assert.ok(silentMix.sources.every((source) => source.gain === 0));
  assert.ok(silentMix.captions.length >= 1 && silentMix.visualAlerts.length >= 1);
});

test("50/56/57 reduced sensory suppresses optional effects; concurrency is bounded; ambience degrades before alerts", () => {
  const reduced = engineFor({ ...NONE, reducedSensory: true });
  reduced.addSource({ soundId: "dc.music.success-restrained" });
  reduced.addSource({ soundId: "dc.cue.mission-success" });
  const reducedMix = reduced.getMix();
  assert.ok(reducedMix.sources.every((source) => source.state === "SUPPRESSED" && source.reason === "REDUCED_SENSORY"));
  assert.deepEqual([reducedMix.effects.particles, reducedMix.effects.cameraShake], [false, true]);
  const busy = engineFor(NONE, { limits: { maxConcurrentSources: 3, maxSources: 64 } });
  for (let index = 0; index < 6; index += 1) busy.addSource({ soundId: "world.ambience.river-flow", looping: true });
  busy.handleWorldEvent(createMolEvent({ eventId: "inc-1", eventType: "INCIDENT_OPENED", occurredAt: "2026-01-01T08:00:00Z", sourceSystem: "incident", authority: "INCIDENT", providerMode: "SIMULATED", correlationId: "i", severity: "MAJOR" }));
  const busyMix = busy.getMix();
  assert.equal(busyMix.sources.filter((source) => source.state === "PLAYING").length, 3);
  assert.equal(busyMix.sources.find((source) => source.priorityClass === "PUBLIC_SAFETY").state, "PLAYING");
  assert.equal(AUDIO_PRIORITY_CLASSES.indexOf("AMBIENCE") > AUDIO_PRIORITY_CLASSES.indexOf("PUBLIC_SAFETY"), true);
});

test("51 City Mood is derived from event state", () => {
  assert.equal(deriveCityMood({ state: powerRun().getState() }).mood, "EMERGENCY");
  const calm = createRegionalSimulation({ simulationId: "calm" }).simulation;
  assert.equal(deriveCityMood({ state: calm.getState() }).mood, "CALM");
  assert.equal(deriveCityMood({ state: calm.getState(), celebrating: true }).mood, "CELEBRATION");
  const emergency = deriveCityMood({ state: powerRun().getState(), celebrating: true });
  assert.equal(emergency.mood, "EMERGENCY", "emergency always wins over celebration");
});

test("53 dynamic signage and storytelling always cite their source event", () => {
  const event = powerRun().getEvents().find((item) => item.eventType === "POWER_FAILURE");
  const sign = signageForEvent(event);
  assert.deepEqual([sign.message, sign.sourceEventId, sign.sourceAuthority], ["POWER_OUTAGE", event.eventId, "POWER_GRID"]);
  assert.deepEqual(validateSign(sign), []);
  assert.ok(validateSign({ ...sign, sourceEventId: null }).some((error) => /cite its source event/.test(error)));
  assert.ok(storytellingForEvent(event).every((cue) => cue.sourceEventId === event.eventId && cue.affectsWorldState === false));
});

test("54/55 dynamic music transitions are deterministic and recovery clears escalation", () => {
  assert.deepEqual([...MUSIC_STATES], ["EXPLORATION", "MISSION_START", "PROBLEM", "ESCALATION", "RECOVERY", "SUCCESS"]);
  assert.equal(nextMusicState("EXPLORATION", "ESCALATED").state, "ESCALATION");
  assert.equal(nextMusicState("ESCALATION", "MISSION_SUCCEEDED").changed, false, "only recovery exits escalation");
  assert.equal(nextMusicState("ESCALATION", "RESOLVED").state, "RECOVERY");
  assert.equal(nextMusicState("RECOVERY", "SETTLED").state, "EXPLORATION");
  assert.deepEqual(nextMusicState("PROBLEM", "ESCALATED"), nextMusicState("PROBLEM", "ESCALATED"));
  const engine = engineFor();
  const simulation = powerRun();
  simulation.advance(1300 * 1000);
  for (const event of simulation.getEvents()) engine.handleWorldEvent(event);
  assert.equal(engine.getMusicState(), "RECOVERY", "power restored clears the escalation");
});

// ---------------------------------------------------------------- cross-system (58–66)

test("58/59/60/61/64/65/66 regional power disruption: propagation, Mission context, sensory response, timeline and replay agree", () => {
  const simulation = powerRun();
  const events = simulation.getEvents();
  const failure = events.find((event) => event.eventType === "POWER_FAILURE");
  const impacts = events.filter((event) => event.eventType === "REGIONAL_IMPACT_PROJECTED");
  assert.ok(impacts.length >= 5 && impacts.every((event) => event.causationId === failure.eventId && event.payload.relationship === "DECLARED"));
  const dataCenter = impacts.find((event) => event.payload.impactedNodeId === "system:data-center");
  assert.deepEqual([dataCenter.payload.participantStatus, dataCenter.authority], ["PROVIDER_UNAVAILABLE", "REGIONAL_SIMULATION"], "Data Center is affected only through declared edges, and only as a modeled impact");
  const context = simulation.getMissionWorldContext();
  assert.deepEqual([context.missionAuthority, context.simulated], [false, true]);
  assert.ok(context.infrastructure.some((item) => item.state === "FAILED"));
  const engine = engineFor();
  assert.equal(engine.handleWorldEvent(failure).plan.presentationPriority, "CRITICAL_ALERT");
  const view = buildMoccViewModel({ simulation, auditLog: createMoccAuditLog(), presentation: createMoccPresentationState() });
  const correlated = view.timeline.entries.filter((entry) => entry.correlationId === failure.correlationId);
  assert.equal(correlated.length, impacts.length + 1);
  const replay = createReplaySession(events, { now: 0 }).session;
  replay.resume();
  assert.equal(replay.compareWith(events).matches, true);
});

// ---------------------------------------------------------------- no duplicate authority (71–80)

test("71-80 no duplicate map, traffic, water, rail, incident, Mission, Arcade, Evidence or sensory-policy authority; no command bypass", () => {
  const ids = listMolSystems().map((system) => system.systemId);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(!ids.some((id) => /rail|sky-bridge|traffic-2|incident-2/.test(id)), "no rail system invented; no duplicated domain system");
  assert.deepEqual(ids.filter((id) => /traffic/.test(id)), ["road-traffic"]);
  assert.deepEqual(ids.filter((id) => /incident/.test(id)), ["incident"]);
  const roots = ["../src/system/metaverse/regional/", "../src/system/metaverse/mocc/", "../src/shared/experience/audio/"];
  for (const root of roots) {
    for (const name of readdirSync(new URL(root, import.meta.url))) {
      // Scan code, not prose: comments legitimately state what the module does NOT do.
      const source = readFileSync(new URL(`${root}${name}`, import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      assert.doesNotMatch(source, /executeCommand\s*\(|eval\(|new Function/, `${name}: no universal command bypass`);
      const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
      assert.ok(imports.every((path) => !/mission-runtime|arcade|verified-evidence|truth-spine|credential|career|workforce|curriculum/.test(path)), `${name}: imports no foreign authority (${imports})`);
      assert.doesNotMatch(source, /missionRuntime\.|startPublishedMission|createActivity\(|SENSORY_PRESENTATION_POLICIES\s*=|localStorage/, `${name}: no foreign authority calls`);
    }
  }
  assert.equal(registry.presentationPolicies.filter((item) => item.policyId === "policy.regional-world").length, 1);
});
