// Phase 4F.5 — deterministic MOL scenario runner and replay.
//
// Scenarios are approved, seeded, frozen event chains used for repeatable
// tests, classroom scenarios and developer inspection. Every step is emitted
// by its registered (explicitly SIMULATED) provider and references real
// registry IDs; references that do not resolve stop the scenario before any
// event is published. This is not a regional campaign engine.

import { COORDINATE_FAMILIES } from "../../../shared/spatial/contracts/constants.js";
import { isCanonicalDestinationId } from "../metaverseCanonicalDestinationRegistry.js";
import { METAVERSE_WEATHER_PRESETS } from "../metaverseEnvironmentRuntime.js";
import { METAVERSE_WATER_ZONES } from "../metaverseRiverFlowRegistry.js";
import { MOL_EVENT_TYPES as T, createMolEvent } from "./molEventContract.js";
import { createMolEventBus } from "./molEventBus.js";
import { getMolSystem } from "./molSystemRegistry.js";
import { projectMolWorldState } from "./molWorldState.js";

export const MOL_SCENARIO_STATES = Object.freeze(["READY", "RUNNING", "PAUSED", "COMPLETED"]);
export const MOL_SCENARIO_DEFAULT_START = "2026-01-01T08:00:00.000Z";
export const MOL_TRAFFIC_LAYER_ID = "metaverse-traffic-corridors";
export const MOL_WATER_LAYER_ID = "metaverse-water-zones";

const s = (step, offsetSeconds, systemId, eventType, extra = {}) => Object.freeze({ step, offsetSeconds, systemId, eventType, severity: "MODERATE", status: "ACTIVE", ...extra });

export const MOL_APPROVED_SCENARIOS = Object.freeze({
  TRAFFIC_COLLISION: Object.freeze({
    scenarioId: "TRAFFIC_COLLISION", title: "Traffic collision on an approved corridor",
    steps: Object.freeze([
      s(1, 0, "road-traffic", T.VEHICLE_COLLISION, { location: { kind: "corridor", id: "route-1-1-mu6436lq" }, severity: "MAJOR", status: "REPORTED" }),
      s(2, 60, "road-traffic", T.ROAD_CLOSED, { location: { kind: "corridor", id: "route-1-1-mu6436lq" }, causeStep: 1 }),
      s(3, 900, "road-traffic", T.ROAD_REOPENED, { location: { kind: "corridor", id: "route-1-1-mu6436lq" }, causeStep: 2, severity: "INFO", status: "RESOLVED" }),
    ]),
  }),
  WATER_RESTRICTION: Object.freeze({
    scenarioId: "WATER_RESTRICTION", title: "Storm restricts a declared water zone",
    steps: Object.freeze([
      s(1, 0, "ocean-environment", T.STORM_STARTED, { weatherPreset: "THUNDERSTORM", severity: "MAJOR" }),
      s(2, 120, "water-mobility", T.WATERWAY_RESTRICTED, { location: { kind: "waterway", id: "RAPIDS_ZONE_01" }, causeStep: 1 }),
      s(3, 1800, "ocean-environment", T.STORM_ENDED, { causeStep: 1, severity: "INFO", status: "RESOLVED" }),
      s(4, 1860, "water-mobility", T.WATERWAY_RESTRICTION_LIFTED, { location: { kind: "waterway", id: "RAPIDS_ZONE_01" }, causeStep: 3, severity: "INFO", status: "RESOLVED" }),
    ]),
  }),
  INFRASTRUCTURE_FAILURE: Object.freeze({
    scenarioId: "INFRASTRUCTURE_FAILURE", title: "Power failure with downstream dependency impact",
    steps: Object.freeze([
      s(1, 0, "power-grid", T.POWER_FAILURE, { location: { kind: "destination", id: "power-electrical-facility" }, severity: "CRITICAL" }),
      s(2, 1200, "power-grid", T.POWER_RESTORED, { location: { kind: "destination", id: "power-electrical-facility" }, causeStep: 1, severity: "INFO", status: "RESOLVED" }),
    ]),
  }),
  BRIDGE_INCIDENT: Object.freeze({
    scenarioId: "BRIDGE_INCIDENT", title: "Correlated storm, collision and incident across road and water",
    steps: Object.freeze([
      s(1, 0, "ocean-environment", T.STORM_STARTED, { weatherPreset: "HEAVY_RAIN", severity: "MAJOR" }),
      s(2, 300, "road-traffic", T.VEHICLE_COLLISION, { location: { kind: "corridor", id: "bridge1w-2-mu64aurl" }, causeStep: 1, severity: "MAJOR", status: "REPORTED" }),
      s(3, 360, "incident", T.INCIDENT_OPENED, {
        location: { kind: "corridor", id: "bridge1w-2-mu64aurl" }, causeStep: 2, severity: "MAJOR",
        incidentRef: "sim-incident-bridge-1", affects: [{ kind: "corridor", id: "bridge1w-2-mu64aurl" }, { kind: "waterway", id: "BRIDGE_DISTURBANCE_BRIDGE_01" }],
      }),
      s(4, 420, "road-traffic", T.ROAD_CLOSED, { location: { kind: "corridor", id: "bridge1w-2-mu64aurl" }, causeStep: 3, severity: "MAJOR" }),
      s(5, 480, "water-mobility", T.WATERWAY_RESTRICTED, { location: { kind: "waterway", id: "BRIDGE_DISTURBANCE_BRIDGE_01" }, causeStep: 3 }),
    ]),
  }),
});

export function listMolScenarios() {
  return Object.values(MOL_APPROVED_SCENARIOS);
}

// Resolves a step reference against the real registry that owns it. Nothing is invented.
export function resolveMolLocation(reference, { trafficRoutes = [] } = {}) {
  if (!reference) return { ok: true, location: null };
  if (reference.kind === "corridor") {
    return trafficRoutes.some((route) => route?.id === reference.id && route.status === "APPROVED")
      ? { ok: true, location: { coordinateFamily: COORDINATE_FAMILIES.METAVERSE, layerId: MOL_TRAFFIC_LAYER_ID, featureId: reference.id }, entityType: "TRANSPORT_CORRIDOR" }
      : { ok: false, reason: `UNKNOWN_CORRIDOR:${reference.id}` };
  }
  if (reference.kind === "waterway") {
    return METAVERSE_WATER_ZONES.some((zone) => zone.id === reference.id)
      ? { ok: true, location: { coordinateFamily: COORDINATE_FAMILIES.METAVERSE, layerId: MOL_WATER_LAYER_ID, featureId: reference.id }, entityType: "WATERWAY" }
      : { ok: false, reason: `UNKNOWN_WATERWAY:${reference.id}` };
  }
  if (reference.kind === "destination") {
    return isCanonicalDestinationId(reference.id)
      ? { ok: true, location: { coordinateFamily: COORDINATE_FAMILIES.METAVERSE, destinationId: reference.id }, entityType: "FACILITY" }
      : { ok: false, reason: `UNKNOWN_DESTINATION:${reference.id}` };
  }
  return { ok: false, reason: `UNKNOWN_REFERENCE_KIND:${reference.kind}` };
}

export function buildMolScenarioEvents(scenarioId, { seed = "seed-1", startAt = MOL_SCENARIO_DEFAULT_START, trafficRoutes = [] } = {}) {
  const scenario = MOL_APPROVED_SCENARIOS[scenarioId];
  if (!scenario) return { ok: false, errors: [`UNAPPROVED_SCENARIO:${scenarioId}`], events: [] };
  const correlationId = `${scenarioId}:${seed}`;
  const idFor = (step) => `${correlationId}:${step}`;
  const errors = [];
  const events = scenario.steps.map((step) => {
    const system = getMolSystem(step.systemId);
    if (!system) errors.push(`UNKNOWN_SYSTEM:${step.systemId}`);
    if (step.weatherPreset && !METAVERSE_WEATHER_PRESETS[step.weatherPreset]) errors.push(`UNKNOWN_WEATHER_PRESET:${step.weatherPreset}`);
    const where = resolveMolLocation(step.location, { trafficRoutes });
    if (!where.ok) errors.push(where.reason);
    const entities = [];
    if (step.incidentRef) entities.push({ entityType: "INCIDENT", entityRef: step.incidentRef, role: "SUBJECT" });
    else if (where.ok && step.location) entities.push({ entityType: where.entityType, entityRef: step.location.id, role: "SUBJECT" });
    for (const affected of step.affects || []) {
      const resolved = resolveMolLocation(affected, { trafficRoutes });
      if (!resolved.ok) errors.push(resolved.reason);
      else entities.push({ entityType: resolved.entityType, entityRef: affected.id, role: "AFFECTED" });
    }
    return createMolEvent({
      eventId: idFor(step.step),
      eventType: step.eventType,
      occurredAt: new Date(Date.parse(startAt) + step.offsetSeconds * 1000).toISOString(),
      sourceSystem: step.systemId,
      authority: system?.authorityDomain ?? "UNKNOWN",
      providerMode: system?.mode ?? "TEST",
      location: where.ok ? where.location : null,
      severity: step.severity,
      status: step.status,
      entities,
      correlationId,
      causationId: step.causeStep ? idFor(step.causeStep) : null,
      payload: { scenarioId, scenarioStep: step.step, simulated: true, ...(step.weatherPreset ? { weatherPreset: step.weatherPreset } : {}) },
    });
  });
  return errors.length ? { ok: false, errors, events: [] } : { ok: true, errors: [], events, correlationId };
}

// Step-able, pausable runner. Synchronous and deterministic: same scenario + seed → same chain.
export function createMolScenarioRun({ bus, scenarioId, seed, startAt, trafficRoutes }) {
  const built = buildMolScenarioEvents(scenarioId, { seed, startAt, trafficRoutes });
  let cursor = 0;
  let state = built.ok ? "READY" : "COMPLETED";
  const timeline = [];
  const rejected = new Set();

  function step() {
    if (!built.ok || cursor >= built.events.length) { state = "COMPLETED"; return null; }
    const event = built.events[cursor];
    cursor += 1;
    // Do not continue a causal chain whose cause was not accepted; unrelated steps still run.
    const result = event.causationId && rejected.has(event.causationId)
      ? { outcome: "SKIPPED", eventId: event.eventId, reasons: ["CAUSE_NOT_ACCEPTED"] }
      : bus.publish(event);
    if (result.outcome !== "ACCEPTED" && result.outcome !== "DUPLICATE") rejected.add(event.eventId);
    timeline.push({ step: cursor, eventId: event.eventId, eventType: event.eventType, sourceSystem: event.sourceSystem, outcome: result.outcome, reasons: result.reasons ? [...result.reasons] : [] });
    if (cursor >= built.events.length) state = "COMPLETED";
    else if (state === "READY") state = "PAUSED";
    return result;
  }

  function pause() {
    if (state === "RUNNING") state = "PAUSED";
    return state;
  }

  function resume() {
    if (state !== "PAUSED" && state !== "READY") return state;
    state = "RUNNING";
    while (state === "RUNNING" && cursor < built.events.length) {
      step();
      if (state !== "COMPLETED") state = "RUNNING";
    }
    if (cursor >= built.events.length) state = "COMPLETED";
    return state;
  }

  return Object.freeze({
    scenarioId,
    errors: built.errors,
    events: built.events,
    getState: () => state,
    getTimeline: () => timeline.map((item) => ({ ...item })),
    step,
    pause,
    resume,
    run: resume,
  });
}

// Replays an accepted event chain into a fresh replay-mode bus. Side-effecting subscribers do
// not run, original IDs/correlation/causation/timestamps are preserved, and the projection is
// rebuilt from the replayed log alone.
export function replayMolEvents(events, { now } = {}) {
  const bus = createMolEventBus({ replay: true, ...(now ? { now: () => now } : {}) });
  const outcomes = events.map((event) => bus.publish(structuredClone(event)));
  const replayed = bus.getEvents();
  return {
    bus,
    outcomes,
    timeline: replayed.map((event, index) => ({
      sequence: index + 1, eventId: event.eventId, eventType: event.eventType, sourceSystem: event.sourceSystem, authority: event.authority,
      occurredAt: event.occurredAt, correlationId: event.correlationId, causationId: event.causationId, outcome: outcomes[index]?.outcome,
    })),
    worldState: projectMolWorldState(replayed, now ? { now } : {}),
  };
}
