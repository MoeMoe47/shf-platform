import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import trafficRouteData from "../src/system/metaverse/traffic/metaverseTrafficRoutes.json" with { type: "json" };
import {
  MOL_EVENT_TYPES,
  MOL_EVENT_TYPE_PATTERN,
  MOL_EVENT_TYPE_VALUES,
  MOL_PROHIBITED_TARGETS,
  MOL_SYSTEMS,
  MOL_TWIN_NODE_KINDS,
  buildMolScenarioEvents,
  checkMolEventAuthority,
  createMolActionRequest,
  createMolEvent,
  createMolEventBus,
  getMolEventOwner,
  getMolSystem,
  validateMolEvent,
  validateMolSystemRegistry,
} from "../src/system/metaverse/mol/index.js";

const ROUTES = trafficRouteData.routes;

function roadClosed(overrides = {}) {
  return createMolEvent({
    eventId: "test:road-closed:1",
    eventType: MOL_EVENT_TYPES.ROAD_CLOSED,
    occurredAt: "2026-01-01T08:00:00.000Z",
    sourceSystem: "road-traffic",
    authority: "TRAFFIC",
    providerMode: "SIMULATED",
    location: { coordinateFamily: "METAVERSE", layerId: "metaverse-traffic-corridors", featureId: "route-1-1-mu6436lq" },
    severity: "MAJOR",
    status: "ACTIVE",
    entities: [{ entityType: "TRANSPORT_CORRIDOR", entityRef: "route-1-1-mu6436lq", role: "SUBJECT" }],
    correlationId: "test:corr:1",
    payload: { reason: "collision" },
    ...overrides,
  });
}

// ---------------------------------------------------------------- event contract

test("a valid v1 event is accepted and frozen immutably in the log", () => {
  const bus = createMolEventBus({ now: () => 0 });
  const result = bus.publish(roadClosed());
  assert.equal(result.outcome, "ACCEPTED");
  const [event] = bus.getEvents();
  assert.ok(Object.isFrozen(event) && Object.isFrozen(event.payload) && Object.isFrozen(event.entities[0]));
  assert.throws(() => { event.status = "RESOLVED"; });
});

test("unsupported versions, malformed, unknown-field, executable and oversized events are rejected to dead-letter", () => {
  const bus = createMolEventBus({ now: () => 0 });
  const cases = [
    [roadClosed({ eventId: "v2", eventVersion: 2 }), /eventVersion 2 is not supported/],
    ["not-an-event", /plain object/],
    [roadClosed({ eventId: "bad-type", eventType: "roadClosed" }), /UPPER_SNAKE_CASE/],
    [roadClosed({ eventId: "bad-time", occurredAt: "yesterday" }), /ISO timestamp/],
    [roadClosed({ eventId: "extra", toolCall: { name: "x" } }), /event.toolCall: unsupported field/],
    [roadClosed({ eventId: "loc-extra", location: { coordinateFamily: "METAVERSE", lat: 1 } }), /location.lat: unsupported field/],
    [roadClosed({ eventId: "nested", payload: { nested: { a: 1 } } }), /finite scalar/],
    [roadClosed({ eventId: "script", payload: { note: "<script>alert(1)</script>" } }), /bounded safe text/],
    [roadClosed({ eventId: "arrow", payload: { note: "() => doIt()" } }), /bounded safe text/],
    [roadClosed({ eventId: "big", payload: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`k${i}`, "x".repeat(200)])) }), /size limit/],
    [roadClosed({ eventId: "no-corr", correlationId: "" }), /correlationId is required/],
    [roadClosed({ eventId: "bad-mode", providerMode: "UNAVAILABLE" }), /providerMode is invalid/],
  ];
  for (const [event, expected] of cases) {
    const result = bus.publish(event);
    assert.equal(result.outcome, "REJECTED", String(expected));
    assert.match(result.reasons.join("; "), expected);
  }
  assert.equal(bus.getEvents().length, 0);
  const deadLetters = bus.getDeadLetters();
  assert.equal(deadLetters.length, cases.length);
  assert.ok(deadLetters.every((item) => item.kind === "REJECTED" && item.reasons.length));
  assert.equal(deadLetters[0].unsupportedVersion, true);
});

test("correlation and causation are preserved, and duplicate eventIds are processed once", () => {
  const bus = createMolEventBus({ now: () => 0 });
  const handled = [];
  bus.subscribe({ subscriberId: "probe", handler: (event) => handled.push(event.eventId) });
  const first = roadClosed({ eventId: "chain:1", correlationId: "chain" });
  const second = roadClosed({ eventId: "chain:2", eventType: MOL_EVENT_TYPES.ROAD_REOPENED, correlationId: "chain", causationId: "chain:1", status: "RESOLVED" });
  assert.equal(bus.publish(first).outcome, "ACCEPTED");
  assert.equal(bus.publish(second).outcome, "ACCEPTED");
  assert.equal(bus.publish(structuredClone(first)).outcome, "DUPLICATE");
  assert.deepEqual(handled, ["chain:1", "chain:2"]);
  const [a, b] = bus.getEvents();
  assert.equal(b.correlationId, a.correlationId);
  assert.equal(b.causationId, a.eventId);
  // Same ID with a different body is a conflict, never a silent reinterpretation.
  assert.deepEqual(bus.publish(roadClosed({ eventId: "chain:1", severity: "MINOR", correlationId: "chain" })).reasons, ["EVENT_ID_CONFLICT"]);
  assert.equal(bus.getMetrics().duplicates, 1);
});

test("event naming follows UPPER_SNAKE subject + past-tense convention with exactly one owner per type", () => {
  for (const type of MOL_EVENT_TYPE_VALUES) {
    assert.match(type, MOL_EVENT_TYPE_PATTERN);
    assert.ok(getMolEventOwner(type), `${type} has an owner`);
  }
  assert.deepEqual(validateMolSystemRegistry(), []);
});

// ---------------------------------------------------------------- system registry

test("registered systems resolve, unknown systems fail safe, and simulated providers are explicitly labeled", () => {
  assert.equal(getMolSystem("road-traffic").authorityDomain, "TRAFFIC");
  assert.equal(getMolSystem("unknown-engine"), null);
  const bus = createMolEventBus({ now: () => 0 });
  assert.deepEqual(bus.publish(roadClosed({ eventId: "ghost", sourceSystem: "ghost-engine" })).reasons, ["UNKNOWN_SOURCE_SYSTEM"]);
  for (const id of ["road-traffic", "water-mobility", "ocean-environment", "incident", "power-grid"]) {
    assert.equal(getMolSystem(id).mode, "SIMULATED", id);
  }
  // Simulated facts cannot pose as LIVE.
  assert.deepEqual(bus.publish(roadClosed({ eventId: "liveclaim", providerMode: "LIVE" })).reasons, ["PROVIDER_MODE_MISMATCH"]);
  // Honest maturity: systems without engines are not reported as live or production.
  assert.equal(getMolSystem("water-mobility").maturity, "CONTRACT_DEFINED");
  assert.equal(getMolSystem("incident").maturity, "CONTRACT_DEFINED");
  assert.equal(getMolSystem("data-center").mode, "UNAVAILABLE");
});

test("unavailable systems are reported and cannot publish; planned systems cannot be marked healthy", () => {
  const bus = createMolEventBus({ now: () => 0 });
  assert.equal(bus.getHealth()["data-center"], "UNAVAILABLE");
  assert.deepEqual(bus.setSystemHealth("data-center", "HEALTHY").reasons, ["SYSTEM_HAS_NO_PROVIDER"]);
  assert.equal(bus.setSystemHealth("road-traffic", "UNAVAILABLE", "test outage").outcome, "ACCEPTED");
  assert.equal(bus.getHealth()["road-traffic"], "UNAVAILABLE");
  assert.deepEqual(bus.publish(roadClosed({ eventId: "while-down" })).reasons, ["SOURCE_UNAVAILABLE"]);
  assert.equal(bus.setSystemHealth("road-traffic", "HEALTHY", "restored").outcome, "ACCEPTED");
  assert.equal(bus.publish(roadClosed({ eventId: "after-restore" })).outcome, "ACCEPTED");
});

// ---------------------------------------------------------------- authority

test("each system may emit only its own event types; Traffic cannot take Water authority", () => {
  const water = buildMolScenarioEvents("WATER_RESTRICTION", { trafficRoutes: ROUTES }).events[1];
  assert.equal(checkMolEventAuthority(water).ok, true);
  assert.deepEqual(checkMolEventAuthority({ ...water, sourceSystem: "road-traffic", authority: "TRAFFIC" }), { ok: false, reason: "EVENT_TYPE_OWNED_BY_OTHER_SYSTEM" });
  assert.deepEqual(checkMolEventAuthority({ ...water, authority: "TRAFFIC" }), { ok: false, reason: "AUTHORITY_MISMATCH" });
  const bus = createMolEventBus({ now: () => 0 });
  assert.deepEqual(bus.publish({ ...water, eventId: "traffic-as-water", sourceSystem: "road-traffic", authority: "TRAFFIC" }).reasons, ["EVENT_TYPE_OWNED_BY_OTHER_SYSTEM"]);
  assert.deepEqual(bus.publish(roadClosed({ eventId: "mol-as-traffic", sourceSystem: "mol", authority: "ORCHESTRATION", providerMode: "TEST" })).reasons, ["EVENT_TYPE_OWNED_BY_OTHER_SYSTEM"]);
});

test("MOL cannot write Evidence or Truth Spine: fixed policies, forbidden fields, unrequestable targets", () => {
  const bus = createMolEventBus({ now: () => 0 });
  assert.match(bus.publish(roadClosed({ eventId: "ev", evidencePolicy: "ELIGIBLE" })).reasons.join(), /evidencePolicy must be NOT_EVIDENCE/);
  assert.match(bus.publish(roadClosed({ eventId: "tr", truthPolicy: "VERIFIED" })).reasons.join(), /truthPolicy must be NOT_INSTITUTIONAL_TRUTH/);
  for (const key of ["evidenceId", "truthSpine", "credentialId", "mastery"]) {
    assert.match(bus.publish(roadClosed({ eventId: `f-${key}`, payload: { [key]: "x" } })).reasons.join(), /outside MOL authority/, key);
  }
  for (const target of ["evidence", "truth-spine", "EVIDENCE", "TRUTH_SPINE"]) {
    assert.deepEqual(createMolActionRequest({ targetSystem: target, action: "WRITE", causationEventId: "e", correlationId: "c", subjectRef: "s" }), { ok: false, reason: "TARGET_NOT_REQUESTABLE" });
  }
  assert.ok(MOL_PROHIBITED_TARGETS.includes("EVIDENCE") && MOL_PROHIBITED_TARGETS.includes("TRUTH_SPINE"));
});

test("MOL cannot mutate Identity, Career or Curriculum and creates no identities", () => {
  const bus = createMolEventBus({ now: () => 0 });
  for (const key of ["userId", "email", "role", "permission", "membership", "careerEligibility", "curriculum"]) {
    assert.match(bus.publish(roadClosed({ eventId: `id-${key}`, payload: { [key]: "x" } })).reasons.join(), /outside MOL authority/, key);
  }
  for (const target of ["identity", "career", "curriculum", "agent-fabric", "mission-runtime"]) {
    assert.equal(createMolActionRequest({ targetSystem: target, action: "WRITE", causationEventId: "e", correlationId: "c", subjectRef: "s" }).ok, false, target);
  }
  // Registry refuses to register a prohibited authority as a MOL system.
  assert.match(validateMolSystemRegistry([...MOL_SYSTEMS, { ...MOL_SYSTEMS[0], systemId: "evil", authorityDomain: "IDENTITY", publishes: [], worldStateContributions: [] }]).join(), /prohibited authority/);
  assert.equal(MOL_TWIN_NODE_KINDS.some((kind) => /USER|PERSON|LEARNER|MEMBER/.test(kind)), false);
});

test("MOL source has no network calls, storage writes, or imports from domain clients", () => {
  const dir = new URL("../src/system/metaverse/mol/", import.meta.url);
  for (const file of readdirSync(dir)) {
    const source = readFileSync(new URL(file, dir), "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|\/api\//, file);
    for (const [, specifier] of source.matchAll(/from\s+"([^"]+)"/g)) {
      assert.ok(specifier.startsWith("./") || /^\.\.\/(metaverse[A-Za-z]+|regional|traffic)|^\.\.\/\.\.\/\.\.\/shared\/spatial\//.test(specifier), `${file} imports ${specifier}`);
      assert.doesNotMatch(specifier, /Client\.js$|evidence|truth|identity|curriculum|career|credential|agent-fabric/i, `${file} imports ${specifier}`);
    }
  }
});
