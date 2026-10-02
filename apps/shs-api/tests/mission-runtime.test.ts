import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { ArcadeRuntimeSessionService } from "../src/domain/arcade/service/runtime-session-service.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition, MissionCondition } from "../src/domain/mission-content/model/mission-definition.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { evaluateMissionCondition } from "../src/domain/mission-runtime/service/condition-evaluator.js";
import type { MissionConditionContext } from "../src/domain/mission-runtime/service/condition-evaluator.js";

const RUN = `mission4b_${Date.now()}`;
const USER = `user_${RUN}`;
const OTHER_USER = `user_other_${RUN}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `org_other_${RUN}`;
const actor: MissionRuntimeActor = { user_id: USER, organization_id: ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const otherActor: MissionRuntimeActor = { user_id: OTHER_USER, organization_id: OTHER_ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const FIXED_TIME = "2026-10-01T12:00:00.000Z";
let clockValue = Date.parse(FIXED_TIME);
const service = new MissionRuntimeService(undefined, () => new Date(clockValue));
const published = (index = 0): MissionDefinition => ({ ...structuredClone(MISSION_DEFINITION_FIXTURES[index]), status: "PUBLISHED" });
const key = (suffix: string) => `${RUN}:${suffix}`;

async function cleanup() {
  await query("DELETE FROM mission_runtime_sessions WHERE organization_id=$1 AND (idempotency_key LIKE $2 OR idempotency_key IS NULL)", [ORG, `${RUN}:%`]);
  await query("DELETE FROM arcade_runtime_sessions WHERE experience_id LIKE $1", [`${RUN}:%`]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[USER, OTHER_USER]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
}

async function countRows(table: string) {
  const result = await query(`SELECT COUNT(*)::int AS count FROM ${table}`);
  return Number(result.rows[0].count);
}

async function createActorRows() {
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')
     ON CONFLICT (organization_id) DO NOTHING`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$2,$3,'Mission Runtime Learner','active','local'),($4,$5,$6,'Other Mission Learner','active','local')
     ON CONFLICT (user_id) DO NOTHING`,
    [USER, ORG, `${USER}@test.invalid`, OTHER_USER, OTHER_ORG, `${OTHER_USER}@test.invalid`],
  );
}

before(async () => {
  await cleanup();
  await createActorRows();
});
after(cleanup);

function context(overrides: Partial<MissionConditionContext> = {}): MissionConditionContext {
  return {
    objectiveStates: [{ objectiveId: "o1", status: "COMPLETED", completedAt: FIXED_TIME }],
    stageStates: [{ stageId: "s1", status: "COMPLETED", startedAt: FIXED_TIME, completedAt: FIXED_TIME, optional: false }],
    runtimeState: { score: 7, mode: "ready" },
    events: [{ eventType: "alarm-observed" }],
    startedAt: FIXED_TIME,
    now: "2026-10-01T12:00:20.000Z",
    ...overrides,
  };
}

test("condition evaluator handles all seven declarative condition types deterministically", () => {
  const cases: Array<[MissionCondition, MissionConditionContext, boolean]> = [
    [{ type: "OBJECTIVE_COMPLETE", objectiveId: "o1" }, context(), true],
    [{ type: "OBJECTIVE_COUNT", count: 2 }, context(), false],
    [{ type: "STAGE_COMPLETE", stageId: "s1" }, context(), true],
    [{ type: "TIME_ELAPSED", seconds: 10 }, context(), true],
    [{ type: "STATE_EQUALS", stateKey: "mode", value: "ready" }, context(), true],
    [{ type: "STATE_THRESHOLD", stateKey: "score", operator: "GTE", value: 7 }, context(), true],
    [{ type: "EVENT_OCCURRED", eventType: "alarm-observed" }, context(), true],
  ];
  for (const [condition, state, expected] of cases) {
    assert.equal(evaluateMissionCondition(condition, state), expected);
    assert.equal(evaluateMissionCondition(condition, state), expected);
  }
});

test("condition evaluator fails closed for missing references, wrong state types, absent events, and elapsed time", () => {
  assert.equal(evaluateMissionCondition({ type: "OBJECTIVE_COMPLETE", objectiveId: "missing" }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "STAGE_COMPLETE", stageId: "missing" }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "STATE_EQUALS", stateKey: "missing", value: 0 }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "STATE_THRESHOLD", stateKey: "mode", operator: "GTE", value: 2 }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "EVENT_OCCURRED", eventType: "missing" }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "TIME_ELAPSED", seconds: 30 }, context()), false);
  assert.equal(evaluateMissionCondition({ type: "TIME_ELAPSED", seconds: 5 }, context({ now: "invalid" })), false);
});

test("STATE_THRESHOLD supports EQ, GTE, and LTE", () => {
  const state = context();
  assert.equal(evaluateMissionCondition({ type: "STATE_THRESHOLD", stateKey: "score", operator: "EQ", value: 7 }, state), true);
  assert.equal(evaluateMissionCondition({ type: "STATE_THRESHOLD", stateKey: "score", operator: "GTE", value: 8 }, state), false);
  assert.equal(evaluateMissionCondition({ type: "STATE_THRESHOLD", stateKey: "score", operator: "LTE", value: 8 }, state), true);
});

test("published server-supplied snapshot starts with exact identity/version and fixture families remain independent", async () => {
  clockValue = Date.parse(FIXED_TIME);
  for (let index = 0; index < MISSION_DEFINITION_FIXTURES.length; index += 1) {
    const definition = published(index);
    const started = await service.start(actor, definition, { idempotencyKey: key(`family-${index}`) });
    assert.equal(started.session.missionId, definition.missionId);
    assert.equal(started.session.missionVersion, definition.version);
    assert.deepEqual(started.session.definitionSnapshot, definition);
    assert.equal(started.session.startedAt, FIXED_TIME);
    assert.equal(started.session.status, "ACTIVE");
    assert.equal(started.session.arcadeRuntimeSessionId, null);
    const completed = await service.appendEvent(actor, started.session.id, {
      expectedRevision: 1,
      sequence: 1,
      eventType: "objective-observed",
      payload: { fixtureFamily: definition.family },
    });
    assert.equal(completed.session.status, "SUCCEEDED", `${definition.family} runtime should use the shared progression contract`);
  }
});

test("draft definition cannot start and client permission is mandatory", async () => {
  await assert.rejects(service.start(actor, structuredClone(MISSION_DEFINITION_FIXTURES[0]), { idempotencyKey: key("draft") }), (error: any) => error.code === "MISSION_VERSION_NOT_RUNNABLE");
  await assert.rejects(service.start({ ...actor, permissions: [] }, published(), { idempotencyKey: key("no-permission") }), (error: any) => error.code === "FORBIDDEN");
});

test("stage with only optional objectives requires a declared exit condition", async () => {
  const definition = published();
  definition.objectives[0].required = false;
  definition.stages[0].exitConditions = [];
  await assert.rejects(service.start(actor, definition, { idempotencyKey: key("optional-stage-stalled") }), (error: any) => error.code === "MISSION_STAGE_NOT_RUNNABLE");
  definition.stages[0].exitConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("optional-stage-exit") });
  assert.equal(started.session.status, "ACTIVE");
});

test("mission start idempotency reuses exact version snapshot and rejects key reuse for changed content", async () => {
  const definition = published();
  const first = await service.start(actor, definition, { idempotencyKey: key("start-idempotent") });
  const repeated = await service.start(actor, structuredClone(definition), { idempotencyKey: key("start-idempotent") });
  assert.equal(repeated.reused, true);
  assert.equal(repeated.session.id, first.session.id);
  const modifiedSameVersion = { ...structuredClone(definition), title: "Changed without a version" };
  await assert.rejects(service.start(actor, modifiedSameVersion, { idempotencyKey: key("start-idempotent") }), (error: any) => error.code === "MISSION_RUNTIME_IDEMPOTENCY_KEY_REUSED");
});

test("runtime reads enforce owner and organization scope", async () => {
  const started = await service.start(actor, published(), { idempotencyKey: key("scope") });
  assert.equal((await service.get(actor, started.session.id)).id, started.session.id);
  await assert.rejects(service.get({ ...actor, user_id: OTHER_USER }, started.session.id), (error: any) => error.code === "MISSION_RUNTIME_NOT_FOUND");
  await assert.rejects(service.get(otherActor, started.session.id), (error: any) => error.code === "MISSION_RUNTIME_NOT_FOUND");
  assert.ok((await service.list(actor)).some((row) => row.id === started.session.id));
});

test("optional Arcade Runtime reference is explicit, owner-scoped, and never inferred", async () => {
  const classic = await service.start(actor, published(1), { idempotencyKey: key("no-arcade-ref") });
  assert.equal(classic.session.arcadeRuntimeSessionId, null);

  const arcadeService = new ArcadeRuntimeSessionService();
  const arcadeSession = await arcadeService.start({ user_id: USER, organization_id: ORG, roles: [], permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] }, {
    family: "classic", experienceId: `${RUN}:explicit-arcade-runtime`, sessionType: "mission",
  });
  const linked = await service.start(actor, published(1), { idempotencyKey: key("explicit-link"), arcadeRuntimeSessionId: arcadeSession.session.id });
  assert.equal(linked.session.arcadeRuntimeSessionId, arcadeSession.session.id);
  await assert.rejects(service.start(actor, published(1), { idempotencyKey: key("wrong-link"), arcadeRuntimeSessionId: `${RUN}:not-real` }), (error: any) => error.code === "ARCADE_RUNTIME_SESSION_NOT_FOUND");
});

test("mission events complete objectives and derive stage and runtime success server-side", async () => {
  const definition = published();
  definition.successConditions = [{ type: "STAGE_COMPLETE", stageId: "scenario-stage" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("success") });
  assert.equal(started.session.objectiveStates[0].status, "ACTIVE");
  assert.equal(started.session.stageStates[0].status, "ACTIVE");
  const response = await service.appendEvent(actor, started.session.id, {
    expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: { observation: "bounded" },
  });
  assert.equal(response.session.status, "SUCCEEDED");
  assert.equal(response.session.objectiveStates[0].status, "COMPLETED");
  assert.equal(response.session.stageStates[0].status, "COMPLETED");
  assert.equal(response.event.sequence, 1);
  assert.equal((await service.listEvents(actor, started.session.id)).length, 1);
});

test("stage advancement is derived from required objective and declared exit condition", async () => {
  const definition = published();
  definition.objectives.push({ ...structuredClone(definition.objectives[0]), objectiveId: "second-objective", order: 2, title: "Second", completionRule: { type: "EVENT_OCCURRED", eventType: "second-observed" } });
  definition.stages = [
    { ...definition.stages[0], stageId: "first-stage", order: 1, objectiveIds: ["primary-objective"], exitConditions: [] },
    { ...definition.stages[0], stageId: "second-stage", order: 2, title: "Second stage", objectiveIds: ["second-objective"], entryConditions: [{ type: "STAGE_COMPLETE", stageId: "first-stage" }], exitConditions: [{ type: "OBJECTIVE_COMPLETE", objectiveId: "second-objective" }] },
  ];
  definition.successConditions = [{ type: "STAGE_COMPLETE", stageId: "second-stage" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("stage-advance") });
  assert.deepEqual(started.session.stageStates.map((state) => state.status), ["ACTIVE", "LOCKED"]);
  const first = await service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: {} });
  assert.deepEqual(first.session.stageStates.map((state) => state.status), ["COMPLETED", "ACTIVE"]);
  const second = await service.appendEvent(actor, started.session.id, { expectedRevision: 2, sequence: 2, eventType: "second-observed", payload: {} });
  assert.deepEqual(second.session.stageStates.map((state) => state.status), ["COMPLETED", "COMPLETED"]);
  assert.equal(second.session.status, "SUCCEEDED");
});

test("repeated objective observation does not rewrite completion timestamp or create mastery", async () => {
  const definition = published();
  definition.successConditions = [{ type: "STATE_EQUALS", stateKey: "finish", value: true }];
  const started = await service.start(actor, definition, { idempotencyKey: key("objective-idempotent") });
  const first = await service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: {} });
  const completedAt = first.session.objectiveStates[0].completedAt;
  clockValue += 1000;
  const repeated = await service.appendEvent(actor, started.session.id, { expectedRevision: 2, sequence: 2, eventType: "objective-observed", payload: {} });
  assert.equal(repeated.session.objectiveStates[0].completedAt, completedAt);
  assert.equal("masteryAchieved" in repeated.session, false);
  assert.equal(repeated.session.status, "ACTIVE");
});

test("failure takes precedence when failure and success become true together", async () => {
  const definition = published();
  definition.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }];
  definition.failureConditions = [{ type: "TIME_ELAPSED", seconds: 5 }];
  const started = await service.start(actor, definition, { idempotencyKey: key("failure-precedence") });
  clockValue += 5000;
  const result = await service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: {} });
  assert.equal(result.session.status, "FAILED");
  assert.equal(result.session.failedAt, new Date(clockValue).toISOString());
});

test("optimistic revision conflict exposes currentRevision and leaves state unchanged", async () => {
  const definition = published();
  definition.objectives[0].completionRule = { type: "STATE_EQUALS", stateKey: "switch", value: true };
  definition.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("revision") });
  const updated = await service.updateState(actor, started.session.id, { expectedRevision: 1, patch: { switch: true } });
  assert.equal(updated.revision, 2);
  await assert.rejects(service.updateState(actor, started.session.id, { expectedRevision: 1, patch: { switch: false } }), (error: any) => error.code === "MISSION_RUNTIME_REVISION_CONFLICT" && error.details.currentRevision === 2);
  assert.deepEqual((await service.get(actor, started.session.id)).runtimeState, { switch: true });
});

test("runtime state accepts only declared scalar fields and rejects unsafe, oversized, deep, or sensitive state", async () => {
  const definition = published();
  definition.objectives[0].completionRule = { type: "STATE_EQUALS", stateKey: "mode", value: "ready" };
  definition.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("state-validation") });
  for (const patch of [{ undeclared: true }, { mode: { nested: true } }, { mode: "ready", password: "secret" }, { mode: "x".repeat(17 * 1024) }, { mode: [[[[[1]]]]] }]) {
    await assert.rejects(service.updateState(actor, started.session.id, { expectedRevision: 1, patch }), MissionRuntimeError);
  }
  const updated = await service.updateState(actor, started.session.id, { expectedRevision: 1, patch: { mode: "ready" } });
  assert.equal(updated.objectiveStates[0].status, "COMPLETED");
  assert.equal(updated.status, "SUCCEEDED");
});

test("unknown, undeclared, duplicate, skipped, and terminal-session events fail closed", async () => {
  const definition = published();
  definition.successConditions = [{ type: "STATE_EQUALS", stateKey: "never-set", value: true }];
  definition.stages[0].exitConditions = [{ type: "STATE_EQUALS", stateKey: "never-set", value: true }];
  const started = await service.start(actor, definition, { idempotencyKey: key("event-contract") });
  await assert.rejects(service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "arbitrary", payload: {} }), (error: any) => error.code === "MISSION_RUNTIME_EVENT_TYPE_INVALID");
  const first = await service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: {} });
  assert.equal(first.session.status, "ACTIVE");
  await assert.rejects(service.appendEvent(actor, started.session.id, { expectedRevision: 2, sequence: 1, eventType: "objective-observed", payload: {} }), (error: any) => error.code === "MISSION_RUNTIME_SEQUENCE_CONFLICT");
  await assert.rejects(service.appendEvent(actor, started.session.id, { expectedRevision: 2, sequence: 3, eventType: "objective-observed", payload: {} }), (error: any) => error.code === "MISSION_RUNTIME_SEQUENCE_CONFLICT");
  assert.equal(first.event.sequence, 1);
});

test("event sequence and expected revision are atomic under concurrent writes", async () => {
  const definition = published();
  definition.successConditions = [{ type: "STATE_EQUALS", stateKey: "done", value: true }];
  definition.objectives[0].completionRule = { type: "STATE_EQUALS", stateKey: "done", value: true };
  definition.stages[0].entryConditions = [{ type: "EVENT_OCCURRED", eventType: "objective-observed" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("race") });
  const outcomes = await Promise.allSettled([
    service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: { writer: "a" } }),
    service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: { writer: "b" } }),
  ]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected" && (outcome.reason as any).code === "MISSION_RUNTIME_REVISION_CONFLICT").length, 1);
  assert.equal((await service.listEvents(actor, started.session.id)).length, 1);
});

test("pause/resume/abandon transitions are bounded; terminal actions are idempotent", async () => {
  const started = await service.start(actor, published(), { idempotencyKey: key("lifecycle") });
  const paused = await service.transition(actor, started.session.id, "PAUSE", 1);
  assert.equal(paused.status, "PAUSED");
  assert.equal(paused.revision, 2);
  const resumed = await service.transition(actor, started.session.id, "RESUME", 2);
  assert.equal(resumed.status, "ACTIVE");
  const abandoned = await service.transition(actor, started.session.id, "ABANDON", 3);
  assert.equal(abandoned.status, "ABANDONED");
  const repeated = await service.transition(actor, started.session.id, "ABANDON", 3);
  assert.equal(repeated.revision, abandoned.revision);
  await assert.rejects(service.transition(actor, started.session.id, "RESUME", abandoned.revision), (error: any) => error.code === "MISSION_RUNTIME_TRANSITION_INVALID");
});

test("server stage time limit expires on a request and terminal runtime rejects later writes", async () => {
  const definition = published();
  definition.stages[0].timeLimitSeconds = 2;
  const started = await service.start(actor, definition, { idempotencyKey: key("stage-expiry") });
  clockValue += 2000;
  const updated = await service.updateState(actor, started.session.id, { expectedRevision: 1, patch: {} });
  assert.equal(updated.status, "EXPIRED");
  assert.ok(updated.expiredAt);
  await assert.rejects(service.appendEvent(actor, started.session.id, { expectedRevision: updated.revision, sequence: 1, eventType: "objective-observed", payload: {} }), (error: any) => error.code === "MISSION_RUNTIME_NOT_ACTIVE");
});

test("runtime completion creates no Arcade Result, Evidence, Truth fact, or outbox event", async () => {
  const before = await Promise.all(["arcade_results", "prepare_prove_evidence", "curriculum_truth_facts", "integration_outbox"].map(countRows));
  const definition = published();
  definition.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "primary-objective" }];
  const started = await service.start(actor, definition, { idempotencyKey: key("no-authority-effects") });
  const completed = await service.appendEvent(actor, started.session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: {} });
  assert.equal(completed.session.status, "SUCCEEDED");
  assert.equal("masteryAchieved" in completed.session, false);
  const afterCounts = await Promise.all(["arcade_results", "prepare_prove_evidence", "curriculum_truth_facts", "integration_outbox"].map(countRows));
  assert.deepEqual(afterCounts, before);
});

test("runtime domain has no Metaverse-domain, Agent Fabric, Evidence, Truth, Treasury, Curriculum, or Career adapter imports", async () => {
  const { readFile, readdir } = await import("node:fs/promises");
  const source = await readFile(new URL("../src/domain/mission-runtime/service/mission-runtime-service.ts", import.meta.url), "utf8");
  const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map((match) => match[1]);
  for (const specifier of imports) {
    assert.doesNotMatch(specifier, /domain\/metaverse|metaverse\/|agent-fabric|verified-evidence|truth-spine|treasury|curriculum|career/i, specifier);
  }
  // Phase 4G: Metaverse context enters only through the sanctioned world-context seam.
  assert.ok(imports.includes("../world/mission-world-context.js"));
  for (const file of await readdir(new URL("../src/domain/mission-runtime/world/", import.meta.url))) {
    const seam = await readFile(new URL(`../src/domain/mission-runtime/world/${file}`, import.meta.url), "utf8");
    for (const [, specifier] of seam.matchAll(/from\s+"([^"]+)"/g)) {
      assert.match(specifier, /^(node:|\.\/mol-bridge\.js$|\.\.\/\.\.\/mission-content\/model\/|(\.\.\/){6}src\/system\/metaverse\/mol\/index\.js$)/, `${file} imports ${specifier}`);
    }
  }
});
