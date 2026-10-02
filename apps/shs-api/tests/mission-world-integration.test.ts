import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { MISSION_WORLD_REFERENCE_FIXTURE } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { validateMissionDefinition, type MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import type { MissionDirectorExecutorContext, MissionDirectorProposal } from "../src/domain/mission-director/model/mission-director.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import type { MissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import { getMissionAccommodationProjection } from "../src/domain/accessibility-accommodations/service/mission-accommodation-projection.js";
import { describeMissionEvidenceCandidate } from "../src/domain/mission-runtime/service/mission-evidence-candidate.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { molScenarioEvents, MOL_MISSION_CONTEXT_CONTRACT } from "../src/domain/mission-runtime/world/mol-bridge.js";
import { buildMissionWorldContext, createMolWorldContextProvider, MISSION_WORLD_CONTEXT_MAX_BYTES } from "../src/domain/mission-runtime/world/mission-world-context.js";
import { createEvidenceRule, projectAuthoritativeFact } from "../src/domain/verified-evidence/service/verified-evidence-service.js";

const RUN = `mission4g_${Date.now()}`;
const ORG = `org_${RUN}`;
const USER = `user_${RUN}`;
const ADMIN = `admin_${RUN}`;
const OTHER_ORG = `org_other_${RUN}`;
const OTHER_USER = `user_other_${RUN}`;
const actor: MissionRuntimeActor = { user_id: USER, organization_id: ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const otherActor: MissionRuntimeActor = { user_id: OTHER_USER, organization_id: OTHER_ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const T0 = new Date("2026-03-01T09:00:00.000Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);
const noAccommodations = async () => null;
const sessionIds: string[] = [];

function service(minutes = 0, integrations: ConstructorParameters<typeof MissionRuntimeService>[2] = { accommodations: noAccommodations }) {
  return new MissionRuntimeService(undefined, () => at(minutes), integrations);
}

function reference(mutate: (value: MissionDefinition) => void = () => {}): MissionDefinition {
  const value = structuredClone(MISSION_WORLD_REFERENCE_FIXTURE);
  value.status = "PUBLISHED";
  value.missionId = `${RUN}:world`;
  value.slug = `${RUN.replaceAll("_", "-")}-world`;
  mutate(value);
  return value;
}

async function start(suffix: string, definition = reference(), runtime = service(), who = actor) {
  const result = await runtime.start(who, definition, { idempotencyKey: `${RUN}:${suffix}` });
  sessionIds.push(result.session!.id);
  return result.session!;
}

async function sideEffects() {
  const tables = ["prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "arcade_results", "learner_credentials", "memberships", "users"];
  return Promise.all(tables.map(async (table) => Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)));
}

before(async () => {
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$2,$3,'World Learner','active','local'),($4,$2,$5,'Accommodation Admin','active','local'),($6,$7,$8,'Other Learner','active','local')`,
    [USER, ORG, `${USER}@test.invalid`, ADMIN, `${ADMIN}@test.invalid`, OTHER_USER, OTHER_ORG, `${OTHER_USER}@test.invalid`],
  );
});

after(async () => {
  await query("DELETE FROM prepare_prove_evidence WHERE organization_id=$1", [ORG]).catch(() => undefined);
  await query("DELETE FROM curriculum_evidence_rules WHERE organization_id=$1", [ORG]).catch(() => undefined);
  await query("DELETE FROM authorized_accommodations WHERE organization_id=$1", [ORG]);
  if (sessionIds.length) await query("DELETE FROM mission_runtime_sessions WHERE mission_runtime_id = ANY($1::text[])", [sessionIds]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[USER, ADMIN, OTHER_USER]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
});

// ---------------------------------------------------------------- authority / declaration

test("the world declaration is closed and validated; capabilities map only to registered MOL systems", () => {
  assert.deepEqual(validateMissionDefinition(reference()), []);
  const cases: Array<[(value: any) => void, RegExp]> = [
    [(value) => { value.metaverseContext.requiredCapabilities = ["PORT_CONTEXT"]; }, /undeclared capability/],
    [(value) => { value.metaverseContext.liveFeedUrl = "https://x"; }, /metaverseContext.liveFeedUrl: unsupported field/],
    [(value) => { value.metaverseContext.optionalCapabilities = ["POWER_CONTEXT"]; }, /declared twice/],
    [(value) => { value.metaverseContext.allowSimulatedContext = "yes"; }, /allowSimulatedContext must be boolean/],
    [(value) => { value.metaverseContext.requiredUnavailablePolicy = "FABRICATE"; }, /requiredUnavailablePolicy is invalid/],
    [(value) => { value.environmentRefs = [{ system: "simulation", environmentId: "x" }]; }, /requires at least one metaverse environmentRef/],
    [(value) => { value.environmentRefs[0].required = "true"; }, /required must be boolean/],
    [(value) => { value.failureConditions.push({ type: "EVENT_OCCURRED", eventType: "MISSION_WORLD_CONTEXT_CAPTURED" }); }, /reserved for Mission Runtime/],
  ];
  for (const [mutate, expected] of cases) {
    const value = reference();
    mutate(value);
    assert.match(validateMissionDefinition(value).join("; "), expected);
  }
  assert.equal(MOL_MISSION_CONTEXT_CONTRACT.missionAuthority, false);
  assert.equal(MOL_MISSION_CONTEXT_CONTRACT.startsMissions, false);
});

test("MOL cannot start, progress or evaluate Missions and receives no accommodation or learner data", () => {
  const molDir = new URL("../../../src/system/metaverse/mol/", import.meta.url);
  for (const file of readdirSync(molDir)) {
    const source = readFileSync(new URL(file, molDir), "utf8");
    assert.doesNotMatch(source, /mission-runtime\/service|MissionRuntimeService|startPublishedMission|accommodation|authorized_accommodations/i, file);
  }
  const bridge = readFileSync(new URL("../src/domain/mission-runtime/world/mol-bridge.ts", import.meta.url), "utf8");
  assert.doesNotMatch(bridge, /start\(|mutateOwned|INSERT|UPDATE|accommodation/i);
  // Mission code never writes Evidence or Truth directly.
  for (const dir of ["../src/domain/mission-runtime/", "../src/domain/mission-runtime/world/", "../src/domain/mission-director/service/"]) {
    for (const file of readdirSync(new URL(dir, import.meta.url)).filter((name) => name.endsWith(".ts"))) {
      const source = readFileSync(new URL(`${dir}${file}`, import.meta.url), "utf8");
      assert.doesNotMatch(source, /verified-evidence|projectAuthoritativeFact|prepare_prove_evidence|truth_spine|curriculum_truth_facts/, `${dir}${file}`);
    }
  }
});

// ---------------------------------------------------------------- start + frozen context

test("a published Mission starts canonically and freezes bounded, simulated world context in the start transaction", async () => {
  const before = await sideEffects();
  const session = await start("reference");
  const events = await service().listEvents(actor, session.id);
  assert.deepEqual(events.map((event) => [event.sequence, event.eventType]), [[1, "MISSION_WORLD_CONTEXT_CAPTURED"]]);
  assert.equal(session.revision, 1);
  assert.equal(session.status, "ACTIVE");
  const frozen = events[0].payload as any;
  assert.equal(frozen.contextKind, "FROZEN");
  assert.equal(frozen.simulated, true);
  assert.equal(frozen.missionAuthority, false);
  assert.equal(frozen.sourceContractVersion, MOL_MISSION_CONTEXT_CONTRACT.contractVersion);
  assert.ok(Buffer.byteLength(JSON.stringify(frozen)) <= MISSION_WORLD_CONTEXT_MAX_BYTES);
  assert.deepEqual(frozen.environment, [
    { environmentId: "main-data-center", required: true, resolved: true, nodeKind: "FACILITY" },
    { environmentId: "cooling-mechanical-plant", required: false, resolved: true, nodeKind: "FACILITY" },
  ]);
  const caps = Object.fromEntries(frozen.capabilities.map((item: any) => [item.capability, item]));
  assert.deepEqual([caps.POWER_CONTEXT.systemId, caps.POWER_CONTEXT.providerMode, caps.POWER_CONTEXT.status], ["power-grid", "SIMULATED", "AVAILABLE"]);
  assert.deepEqual([caps.DATA_CENTER_CONTEXT.providerMode, caps.DATA_CENTER_CONTEXT.status, caps.DATA_CENTER_CONTEXT.maturity], ["UNAVAILABLE", "UNAVAILABLE", "PLANNED"]);
  assert.ok(frozen.capabilities.every((item: any) => item.providerMode !== "LIVE"), "SIMULATED never presents as LIVE");
  assert.deepEqual(frozen.degradedCapabilities, ["DATA_CENTER_CONTEXT"]);
  // Frozen at start: the power failure (t+0) is captured, the later restore (t+20m) is not.
  assert.deepEqual(frozen.conditions.infrastructure.map((item: any) => [item.key, item.state, item.freshness, item.simulated]), [["power-electrical-facility", "FAILED", "CURRENT", true]]);
  assert.equal(frozen.eventRefs.length, 1);
  assert.deepEqual(Object.keys(frozen.eventRefs[0]).sort(), ["authority", "causationId", "correlationId", "eventType", "molEventId", "occurredAt", "providerMode", "relevance", "sourceSystem"]);
  assert.deepEqual([frozen.eventRefs[0].sourceSystem, frozen.eventRefs[0].authority], ["power-grid", "POWER_GRID"]);
  assert.deepEqual(frozen.eventRefs[0].relevance, ["CAPABILITY", "CORRELATION", "LOCATION"]);
  assert.equal(frozen.scenario.correlationId, `INFRASTRUCTURE_FAILURE:${session.id}`);
  // No data-center state is invented for the provider-less optional capability.
  assert.ok(!JSON.stringify(frozen.conditions).includes("main-data-center"));
  assert.deepEqual(await sideEffects(), before, "starting with world context creates no Evidence, Truth, Result, credential or identity rows");
});

test("draft definitions cannot start, and idempotent re-start does not duplicate frozen context", async () => {
  await assert.rejects(service().start(actor, reference((value) => { value.status = "DRAFT"; }), { idempotencyKey: `${RUN}:draft` }),
    (error: unknown) => error instanceof MissionRuntimeError && error.code === "MISSION_VERSION_NOT_RUNNABLE");
  const first = await start("idem");
  const again = await service(5).start(actor, reference(), { idempotencyKey: `${RUN}:idem` });
  assert.equal(again.reused, true);
  assert.equal(again.session!.id, first.id);
  const events = await service().listEvents(actor, first.id);
  assert.equal(events.filter((event) => event.eventType === "MISSION_WORLD_CONTEXT_CAPTURED").length, 1);
});

// ---------------------------------------------------------------- environment + capability resolution

test("a required environment ref that cannot resolve blocks start safely; an optional one degrades without invention", async () => {
  const blocked = reference((value) => { value.environmentRefs[0].environmentId = "moon-base-data-center"; });
  assert.deepEqual(validateMissionDefinition(blocked), []);
  await assert.rejects(service().start(actor, blocked, { idempotencyKey: `${RUN}:env-blocked` }), (error: any) =>
    error instanceof MissionRuntimeError && error.code === "MISSION_WORLD_CONTEXT_UNAVAILABLE" && error.details.reasons.includes("ENVIRONMENT_UNRESOLVED:moon-base-data-center"));
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND idempotency_key=$2", [ORG, `${RUN}:env-blocked`])).rows[0].count, 0);

  const optional = await start("env-optional", reference((value) => { value.environmentRefs[1].environmentId = "imaginary-annex"; }));
  const frozen = (await service().listEvents(actor, optional.id))[0].payload as any;
  assert.deepEqual(frozen.environment[1], { environmentId: "imaginary-annex", required: false, resolved: false, nodeKind: null });
  assert.equal(frozen.degraded, true);
  assert.ok(!JSON.stringify(frozen.conditions).includes("imaginary-annex"));
});

test("required capability outages follow the declared policy; optional outages never fabricate state", async () => {
  const outage = { world: createMolWorldContextProvider({ health: { "power-grid": "UNAVAILABLE" } }), accommodations: noAccommodations };
  await assert.rejects(service(0, outage).start(actor, reference(), { idempotencyKey: `${RUN}:power-down` }), (error: any) =>
    error.code === "MISSION_WORLD_CONTEXT_UNAVAILABLE" && error.details.reasons.includes("POWER_CONTEXT:UNAVAILABLE"));
  const degraded = await start("power-down-degraded", reference((value) => { value.metaverseContext!.requiredUnavailablePolicy = "START_DEGRADED"; }), service(0, outage));
  const frozen = (await service().listEvents(actor, degraded.id))[0].payload as any;
  assert.equal(frozen.degraded, true);
  assert.deepEqual(frozen.conditions.infrastructure, [], "no power state fabricated while the provider is down");
  assert.deepEqual(frozen.eventRefs, []);
});

test("SIMULATED context is never used silently: without explicit permission it is treated as unavailable", async () => {
  await assert.rejects(service().start(actor, reference((value) => { value.metaverseContext!.allowSimulatedContext = false; }), { idempotencyKey: `${RUN}:no-sim` }),
    (error: any) => error.code === "MISSION_WORLD_CONTEXT_UNAVAILABLE" && error.details.reasons.includes("POWER_CONTEXT:SIMULATION_NOT_PERMITTED"));
  await assert.rejects(service().start(actor, reference((value) => { value.metaverseContext!.scenarioId = "CITYWIDE_BLACKOUT"; }), { idempotencyKey: `${RUN}:unapproved` }),
    (error: any) => error.details.reasons.includes("SCENARIO_NOT_APPROVED:CITYWIDE_BLACKOUT"));
});

// ---------------------------------------------------------------- live, stale, filtering

test("LIVE context evolves separately from FROZEN context, marks staleness, and excludes unrelated events", async () => {
  const session = await start("live");
  const unrelated = molScenarioEvents("BRIDGE_INCIDENT", "someone-else", T0.toISOString()).events;
  const stale = await service(16).getWorldContext(actor, session.id, { ambientEvents: unrelated });
  assert.equal(stale.frozen.contextKind, "FROZEN");
  assert.equal(stale.live!.contextKind, "LIVE");
  assert.deepEqual(stale.live!.conditions.infrastructure.map((item: any) => [item.state, item.freshness]), [["FAILED", "STALE"]], "16 minutes old and not refreshed");
  // Weather is declared, but the bridge storm belongs to another correlation and location: excluded.
  assert.equal(stale.live!.conditions.environment, null);
  assert.ok(stale.live!.eventRefs.every((ref: any) => ref.correlationId === `INFRASTRUCTURE_FAILURE:${session.id}`));
  assert.ok(!JSON.stringify(stale.live).match(/ROAD_CLOSED|WATERWAY|VEHICLE_COLLISION|STORM_STARTED/));

  const restored = await service(21).getWorldContext(actor, session.id);
  assert.deepEqual(restored.live!.conditions.infrastructure.map((item: any) => [item.state, item.freshness]), [["ONLINE", "CURRENT"]]);
  assert.deepEqual(restored.live!.eventRefs.map((ref: any) => ref.eventType), ["POWER_FAILURE", "POWER_RESTORED"]);
  assert.equal(restored.live!.eventRefs[1].causationId, restored.live!.eventRefs[0].molEventId, "correlation/causation chain preserved");
  // The frozen projection never changes after start.
  assert.deepEqual(restored.frozen, (await service().listEvents(actor, session.id))[0].payload);
  assert.deepEqual(restored.frozen.conditions.infrastructure.map((item: any) => item.state), ["FAILED"]);

  const degraded = await new MissionRuntimeService(undefined, () => at(2), { world: createMolWorldContextProvider({ health: { "power-grid": "DEGRADED" } }), accommodations: noAccommodations })
    .getWorldContext(actor, session.id);
  assert.deepEqual(degraded.live!.conditions.infrastructure.map((item: any) => item.freshness), ["STALE"]);
  assert.ok(degraded.live!.degradedCapabilities.includes("POWER_CONTEXT"));
});

test("world context cannot bypass canonical Mission conditions; Mission Runtime remains the progression authority", async () => {
  const session = await start("progression");
  await service(25).getWorldContext(actor, session.id);
  const runtime = service(25);
  let current = await runtime.get(actor, session.id);
  assert.equal(current.status, "ACTIVE", "world events never complete a Mission");
  assert.ok(current.objectiveStates.every((item) => item.status !== "COMPLETED"));
  // CAS is still enforced and learner sequences account for runtime-owned events.
  await assert.rejects(runtime.appendEvent(actor, session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed" }),
    (error: any) => error.code === "MISSION_RUNTIME_SEQUENCE_CONFLICT");
  await assert.rejects(runtime.appendEvent(actor, session.id, { expectedRevision: 9, sequence: 2, eventType: "objective-observed" }),
    (error: any) => error.code === "MISSION_RUNTIME_REVISION_CONFLICT");
  const done = await runtime.appendEvent(actor, session.id, { expectedRevision: 1, sequence: 2, eventType: "objective-observed" });
  assert.equal(done.session.status, "SUCCEEDED");
  current = await runtime.get(actor, session.id);
  assert.equal(current.revision, 2);
});

// ---------------------------------------------------------------- AI boundary

class CapturingExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;
  seen: MissionDirectorExecutorContext | null = null;
  constructor(private readonly proposal: MissionDirectorProposal) {}
  async propose(context: MissionDirectorExecutorContext) { this.seen = context; return structuredClone(this.proposal); }
}

test("the Director executor sees only a minimal LIVE world summary; existing governed actions still apply", async () => {
  const runtime = service(3);
  const session = await start("director", reference(), runtime);
  const executor = new CapturingExecutor({ action: { type: "CHARACTER_SPEAK", characterId: "shift-supervisor", lineId: "check-power" } });
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => { fetchCalls += 1; throw new Error("no external calls"); }) as typeof fetch;
  try {
    const result = await new MissionDirectorService(runtime, executor).direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:director` });
    assert.equal(result.status, "APPLIED");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalls, 0);
  const seen = executor.seen!;
  assert.deepEqual(seen.worldContext, {
    contextKind: "LIVE", simulated: true,
    conditions: [{ category: "infrastructure", key: "power-electrical-facility", state: "FAILED", freshness: "CURRENT" }],
    unavailableCapabilities: ["DATA_CENTER_CONTEXT"], degradedCapabilities: [],
  });
  const serialized = JSON.stringify(seen);
  for (const hidden of ["molEventId", "eventRefs", "correlationId", "INFRASTRUCTURE_FAILURE:", "MISSION_WORLD_CONTEXT_CAPTURED", "timingAdjustment", "breakAccommodation", "accommodat", "definitionSnapshot", USER, ORG]) {
    assert.equal(serialized.includes(hidden), false, hidden);
  }
  assert.deepEqual(Object.keys(seen.characters[0]).sort(), ["allowedBehaviors", "characterId", "characterType", "dialogueMode", "displayName", "interactionCount", "knowledgeScope", "scenarioFactIds", "scriptedLineIds", "simulatedRole"]);
});

// ---------------------------------------------------------------- accommodation

let grantSeq = 0;
async function grant(type: string, value: Record<string, unknown> = {}, options: { status?: string; expiresAt?: string | null; user?: string } = {}) {
  grantSeq += 1;
  const revoked = options.status === "REVOKED";
  await query(
    `INSERT INTO authorized_accommodations (accommodation_id, organization_id, user_id, accommodation_type, value, status, effective_at, expires_at, granted_by_user_id, revoked_by_user_id, revoked_at)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11)`,
    [`acc_${RUN}_${grantSeq}`, ORG, options.user ?? USER, type, JSON.stringify(value), options.status ?? "ACTIVE", "2026-01-01T00:00:00Z", options.expiresAt ?? null, ADMIN,
      revoked ? ADMIN : null, revoked ? "2026-02-01T00:00:00Z" : null],
  );
}

const SENSITIVE = ["diagnosis", "clinical", "reviewerNote", "multiplier", "1.5", "switch-access", "acc_", ADMIN, "supporting"];

test("the accommodation projection carries requirement flags only: active, in-window, org-scoped, no sensitive data", async () => {
  await grant("EXTENDED_ASSESSMENT_TIME", { multiplier: 1.5, diagnosis: "private clinical detail", reviewerNote: "sensitive", supportingDocument: "doc-1" });
  await grant("ADDITIONAL_BREAKS", { minutesPerHour: 10 });
  await grant("ALTERNATE_INPUT_METHOD", { device: "switch-access" });
  await grant("ALTERNATE_PRESENTATION", {}, { status: "REVOKED" });
  await grant("ALTERNATE_PRESENTATION", {}, { expiresAt: "2026-02-01T00:00:00Z" });
  const projection = await getMissionAccommodationProjection({ organizationId: ORG, userId: USER, at: T0.toISOString() });
  assert.deepEqual(projection, {
    projectionVersion: 2, timingAdjustmentRequired: true, breakAccommodationRequired: true,
    alternatePresentationRequired: false, alternateInputRequired: true, timingPolicy: null,
  }, "revoked and expired grants are excluded; extended time and breaks stay distinct requirements");
  for (const hidden of SENSITIVE) assert.equal(JSON.stringify(projection).includes(hidden), false, hidden);
  assert.equal(await getMissionAccommodationProjection({ organizationId: OTHER_ORG, userId: USER, at: T0.toISOString() }), null, "org isolation");
  assert.equal(await getMissionAccommodationProjection({ organizationId: ORG, userId: ADMIN, at: T0.toISOString() }), null, "another learner's grants never apply");
  await query("DELETE FROM authorized_accommodations WHERE organization_id=$1", [ORG]);
});

test("accommodation requirements are frozen at start but execute no timing semantics: extended time and breaks never become unlimited time", async () => {
  await grant("EXTENDED_ASSESSMENT_TIME", { multiplier: 1.5, diagnosis: "private clinical detail" });
  await grant("ADDITIONAL_BREAKS", { minutesPerHour: 10 });
  const timed = reference((value) => { value.stages[0].timeLimitSeconds = 60; value.missionId = `${RUN}:timed`; });
  const real = { accommodations: getMissionAccommodationProjection };

  const expiring = await start("timed-accommodated", timed, service(0, real));
  const events = await service().listEvents(actor, expiring.id);
  assert.deepEqual(events.map((event) => event.eventType), ["MISSION_WORLD_CONTEXT_CAPTURED", "MISSION_ACCOMMODATION_PROJECTED"]);
  const frozenProjection = events[1].payload;
  assert.deepEqual(frozenProjection, {
    projectionVersion: 2, timingAdjustmentRequired: true, breakAccommodationRequired: true,
    alternatePresentationRequired: false, alternateInputRequired: false, timingPolicy: null,
  });
  for (const hidden of SENSITIVE) assert.equal(JSON.stringify(events).includes(hidden), false, hidden);
  assert.equal(JSON.stringify(events[0].payload).includes("accommodat"), false, "MOL/world context carries no accommodation data");

  // Frozen at start: a later revocation does not rewrite the recorded projection.
  await query("UPDATE authorized_accommodations SET status='REVOKED', revoked_by_user_id=$2, revoked_at=NOW() WHERE organization_id=$1", [ORG, ADMIN]);
  assert.equal(await getMissionAccommodationProjection({ organizationId: ORG, userId: USER, at: new Date().toISOString() }), null);
  assert.deepEqual((await service().listEvents(actor, expiring.id))[1].payload, frozenProjection);

  // The Director executor never receives accommodation data.
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  await new MissionDirectorService(service(0.5, real), executor).direct(actor, expiring.id, { expectedRevision: 1, idempotencyKey: `${RUN}:director-accommodation` });
  assert.match(JSON.stringify(executor.seen), /power-electrical-facility/);
  assert.doesNotMatch(JSON.stringify(executor.seen), /accommodat|timingAdjustment|breakAccommodation|timingPolicy|MISSION_ACCOMMODATION_PROJECTED/);

  // EXTENDED_ASSESSMENT_TIME is not unlimited time and ADDITIONAL_BREAKS does not disable expiration:
  // two hours later the 60-second stage limit still expires the runtime, exactly as without accommodation.
  const late = await service(120, real).appendEvent(actor, expiring.id, { expectedRevision: 1, sequence: 3, eventType: "objective-observed" });
  assert.equal(late.session.status, "EXPIRED");
  const expiredCandidate = describeMissionEvidenceCandidate(await service().get(actor, expiring.id), await service().listEvents(actor, expiring.id));
  assert.equal(expiredCandidate.canBecomeEvidenceCandidate, false);
  assert.deepEqual(expiredCandidate.provenance.assessmentConditions, { timingAccommodationPresent: true, timingAdjustmentApplied: false });

  // Unaccommodated behavior is unchanged: same Mission, same limit, same expiry.
  const plain = await start("timed-plain", timed, service(0, real), otherActor);
  assert.deepEqual((await service().listEvents(otherActor, plain.id)).map((event) => event.eventType), ["MISSION_WORLD_CONTEXT_CAPTURED"]);
  const expired = await service(120, real).appendEvent(otherActor, plain.id, { expectedRevision: 1, sequence: 2, eventType: "objective-observed" });
  assert.equal(expired.session.status, "EXPIRED");
  assert.ok(expired.session.expiredAt && late.session.expiredAt, "both runtimes record the same canonical expiry transition");

  // Within the unchanged limit an accommodated learner completes normally; objectives and mastery rules are untouched.
  await grant("EXTENDED_ASSESSMENT_TIME", { multiplier: 2 });
  const onTime = await start("timed-on-time", timed, service(0, real));
  const done = await service(0.5, real).appendEvent(actor, onTime.id, { expectedRevision: 1, sequence: 3, eventType: "objective-observed" });
  assert.equal(done.session.status, "SUCCEEDED");
  assert.deepEqual(onTime.definitionSnapshot.objectives, timed.objectives);
  assert.deepEqual(onTime.definitionSnapshot.successConditions, timed.successConditions);
  assert.deepEqual(onTime.definitionSnapshot.stages.map((stage) => stage.timeLimitSeconds), [60]);
  assert.deepEqual(onTime.definitionSnapshot.accessibility, timed.accessibility);
  const candidate = describeMissionEvidenceCandidate(await service().get(actor, onTime.id), await service().listEvents(actor, onTime.id));
  assert.equal(candidate.canBecomeEvidenceCandidate, true);
  // Provenance states only what is true: the requirement was present; no adjustment was applied.
  assert.deepEqual(candidate.provenance.assessmentConditions, { timingAccommodationPresent: true, timingAdjustmentApplied: false });
  await query("DELETE FROM authorized_accommodations WHERE organization_id=$1", [ORG]);
});

// ---------------------------------------------------------------- evidence

test("presence, context reads and world events alone produce no Evidence; a SUCCEEDED runtime is only a candidate until Evidence authority projects it", async () => {
  const session = await start("evidence");
  await service(21).getWorldContext(actor, session.id);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM prepare_prove_evidence WHERE organization_id=$1", [ORG])).rows[0].count, 0);
  const activeCandidate = describeMissionEvidenceCandidate(await service().get(actor, session.id), await service().listEvents(actor, session.id));
  assert.equal(activeCandidate.canBecomeEvidenceCandidate, false);
  assert.equal(activeCandidate.isVerifiedEvidence, false);

  // The Evidence authority is frozen for 4G and does not accept Mission Runtime results as a source:
  // it, not Mission Runtime, decides. Nothing reaches Evidence or Truth from a Mission directly.
  await assert.rejects(createEvidenceRule({ user_id: ADMIN, organization_id: ORG }, { evidenceRuleId: `${RUN}:mission-rule`, sourceType: "MISSION_RUNTIME_RESULT", evidenceType: "MISSION_PERFORMANCE" }), /invalid_evidence_rule/);
  await assert.rejects(projectAuthoritativeFact({ user_id: USER, organization_id: ORG }, { sourceType: "MISSION_RUNTIME_RESULT", sourceRecordId: session.id, evidenceRuleId: "any" }), /invalid_projection_input/);

  const truthBefore = (await query("SELECT COUNT(*)::int AS count FROM curriculum_truth_facts WHERE organization_id=$1", [ORG])).rows[0].count;
  await service(25).appendEvent(actor, session.id, { expectedRevision: 1, sequence: 2, eventType: "objective-observed" });
  const completed = await service().get(actor, session.id);
  const candidate = describeMissionEvidenceCandidate(completed, await service().listEvents(actor, session.id));
  assert.equal(candidate.canBecomeEvidenceCandidate, true, "a learner action that met canonical conditions");
  assert.equal(candidate.addressableByEvidenceAuthority, false);
  assert.equal(candidate.isVerifiedEvidence, false);
  assert.deepEqual(candidate.provenance.learnerActionRefs.map((ref) => ref.eventType), ["objective-observed"]);
  assert.equal(candidate.provenance.worldContext!.simulated, true);
  assert.equal(candidate.provenance.worldContext!.molEventIds.length, 1);
  assert.deepEqual(candidate.provenance.completedObjectiveIds, ["primary-objective"]);
  // Completion itself writes no Evidence and no Truth.
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM prepare_prove_evidence WHERE organization_id=$1", [ORG])).rows[0].count, 0);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM curriculum_truth_facts WHERE organization_id=$1", [ORG])).rows[0].count, truthBefore);
});

// ---------------------------------------------------------------- identity, isolation, replay

test("existing learner identity is reused; NPCs and MOL create no identities; organizations stay isolated", async () => {
  const session = await start("identity");
  assert.equal(session.userId, USER);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM users WHERE user_id = ANY($1::text[])", [["shift-supervisor", "power-grid", "mol"]])).rows[0].count, 0);
  await assert.rejects(service().getWorldContext(otherActor, session.id), (error: any) => error instanceof MissionRuntimeError && error.statusCode === 404);
});

test("replay resolves the referenced MOL event chain deterministically without side effects", async () => {
  const session = await start("replay");
  const frozen = (await service().listEvents(actor, session.id))[0].payload as any;
  const rederived = molScenarioEvents(frozen.scenario.scenarioId, session.id, session.startedAt);
  const ids = new Set(rederived.events.map((event: any) => event.eventId));
  assert.ok(frozen.eventRefs.every((ref: any) => ids.has(ref.molEventId)), "every frozen reference resolves to the deterministic chain");
  const again = buildMissionWorldContext({ definition: session.definitionSnapshot, runtimeId: session.id, startedAt: session.startedAt, now: session.startedAt, contextKind: "FROZEN", provider: createMolWorldContextProvider() }).context;
  assert.deepEqual(again, frozen, "the frozen context is reproducible from the frozen definition and runtime identity");
  const before = await sideEffects();
  for (let i = 0; i < 3; i += 1) await service(21).getWorldContext(actor, session.id);
  assert.deepEqual(await sideEffects(), before);
  assert.equal((await service().listEvents(actor, session.id)).length, 1, "live reads persist nothing");
});

test("Missions without a world declaration are unchanged by 4G", async () => {
  const plain = structuredClone(MISSION_WORLD_REFERENCE_FIXTURE);
  delete plain.metaverseContext;
  plain.status = "PUBLISHED";
  plain.missionId = `${RUN}:plain`;
  const session = await start("plain", plain);
  assert.deepEqual(await service().listEvents(actor, session.id), []);
  const context = await service().getWorldContext(actor, session.id);
  assert.deepEqual([context.integrated, context.frozen, context.live], [false, null, null]);
});
