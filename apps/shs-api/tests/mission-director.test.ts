import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { MISSION_DIRECTOR_POLICY_VERSION, type MissionDirectorContext, type MissionDirectorExecutorContext, type MissionDirectorProposal } from "../src/domain/mission-director/model/mission-director.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { DeterministicMissionDirectorExecutor, FixtureMissionDirectorExecutor, type MissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import { validateMissionDirectorAction } from "../src/domain/mission-director/service/mission-director-policy.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";

const RUN = `mission4e_${Date.now()}`;
const ORG = `org_${RUN}`;
const USER = `user_${RUN}`;
const OTHER_ORG = `org_other_${RUN}`;
const OTHER_USER = `user_other_${RUN}`;
const actor: MissionRuntimeActor = { user_id: USER, organization_id: ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const otherActor: MissionRuntimeActor = { user_id: OTHER_USER, organization_id: OTHER_ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const runtimeService = new MissionRuntimeService();
const sessionIds: string[] = [];

// Decision rows are append-only operational provenance and intentionally outlive runtime cleanup.
async function cleanup() {
  if (sessionIds.length) await query("DELETE FROM mission_runtime_sessions WHERE mission_runtime_id = ANY($1::text[])", [sessionIds]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[USER, OTHER_USER]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
}

before(async () => {
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$2,$3,'Mission Director Learner','active','local'),($4,$5,$6,'Other Learner','active','local')`,
    [USER, ORG, `${USER}@test.invalid`, OTHER_USER, OTHER_ORG, `${OTHER_USER}@test.invalid`],
  );
});
after(cleanup);

function definition(flags: Partial<MissionDefinition["aiCapabilities"]> = {}): MissionDefinition {
  const value = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  value.status = "PUBLISHED";
  value.missionId = `${RUN}:mission`;
  value.slug = `${RUN.replaceAll("_", "-")}-mission`;
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: false, npcDialogue: false, scenarioVariation: false, ...flags };
  value.failureConditions = [{ type: "STATE_EQUALS", stateKey: "mode", value: "closed" }];
  return value;
}

async function start(suffix: string, input = definition(), who = actor) {
  const result = await runtimeService.start(who, input, { idempotencyKey: `${RUN}:${suffix}` });
  sessionIds.push(result.session.id);
  return result.session;
}

function director(action: unknown, error?: Error) {
  const executor = error ? new FixtureMissionDirectorExecutor(error) : new FixtureMissionDirectorExecutor({ action });
  return new MissionDirectorService(runtimeService, executor);
}

async function invoke(sessionId: string, key: string, action: unknown, expectedRevision = 1, failure?: Error) {
  return director(action, failure).direct(actor, sessionId, { expectedRevision, idempotencyKey: `${RUN}:${key}` });
}

async function decisionRows(sessionId: string) {
  return (await query("SELECT * FROM mission_director_decisions WHERE mission_runtime_session_id=$1 ORDER BY created_at", [sessionId])).rows;
}

async function eventCount(sessionId: string) {
  return (await runtimeService.listEvents(actor, sessionId)).length;
}

function isReused(error: unknown) {
  return error instanceof MissionRuntimeError && error.code === "MISSION_DIRECTOR_IDEMPOTENCY_KEY_REUSED" && error.statusCode === 409;
}

class CapturingExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;
  seen: MissionDirectorExecutorContext | null = null;
  constructor(private readonly proposal: MissionDirectorProposal, private readonly during?: () => Promise<void>) {}
  async propose(context: MissionDirectorExecutorContext) {
    this.seen = context;
    if (this.during) await this.during();
    return structuredClone(this.proposal);
  }
}

test("deterministic executor returns a valid no-op and records one no-op decision without runtime activity", async () => {
  const session = await start("noop");
  const service = new MissionDirectorService(runtimeService, new DeterministicMissionDirectorExecutor());
  const result = await service.direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:noop-decision` });
  assert.equal(result.status, "NO_OP");
  assert.equal(result.rejectionReason, null);
  assert.equal(result.runtime.revision, 1);
  assert.equal(await eventCount(session.id), 0);
  const retry = await service.direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:noop-decision` });
  assert.equal(retry.decisionId, result.decisionId);
  const rows = await decisionRows(session.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision_status, "NO_OP");
  assert.equal(rows[0].executor_kind, "DETERMINISTIC");
  assert.equal(rows[0].policy_version, MISSION_DIRECTOR_POLICY_VERSION);
  assert.equal(rows[0].expected_runtime_revision, 1);
  assert.equal(rows[0].observed_runtime_revision, 1);
});

test("missionDirector false is denied before the executor runs and no runtime mutation occurs", async () => {
  const session = await start("no-capability", definition({ missionDirector: false }));
  const executor = new CapturingExecutor({ action: { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "ready" } });
  const result = await new MissionDirectorService(runtimeService, executor).direct(actor, session.id, {
    expectedRevision: 1, idempotencyKey: `${RUN}:no-capability-decision`,
  });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejectionReason, "CAPABILITY_DENIED");
  assert.equal(executor.seen, null);
  assert.equal((await runtimeService.get(actor, session.id)).revision, 1);
});

test("declared event applies once, retries return the prior decision, and provenance is append-only", async () => {
  const session = await start("event", definition({ scenarioVariation: true }));
  const action = { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: { source: "director" } };
  const result = await invoke(session.id, "event-decision", action);
  assert.equal(result.status, "APPLIED");
  assert.equal(result.runtime.revision, 2);
  const retry = await invoke(session.id, "event-decision", action);
  assert.equal(retry.decisionId, result.decisionId);
  assert.equal(retry.status, "APPLIED");
  assert.equal(retry.runtime.revision, 2);
  const events = await runtimeService.listEvents(actor, session.id);
  assert.equal(events.length, 1);
  assert.equal(events[0].eventType, "objective-observed");
  const rows = await decisionRows(session.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision_status, "APPLIED");
  assert.equal(rows[0].expected_runtime_revision, 1);
  assert.equal(rows[0].observed_runtime_revision, 1);
  await assert.rejects(query("UPDATE mission_director_decisions SET rejection_reason='rewritten' WHERE director_decision_id=$1", [result.decisionId]), /append-only/);
  await assert.rejects(query("DELETE FROM mission_director_decisions WHERE director_decision_id=$1", [result.decisionId]), /append-only/);
  assert.equal((await decisionRows(session.id)).length, 1);
});

test("event injection additionally requires scenarioVariation", async () => {
  const session = await start("event-no-variation");
  const result = await invoke(session.id, "event-no-variation-decision", { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejectionReason, "SCENARIO_VARIATION_DENIED");
  assert.equal(await eventCount(session.id), 0);
});

test("declared scalar state is applied exactly once through Mission Runtime and undeclared or invalid values fail closed", async () => {
  const session = await start("state");
  const allowed = await invoke(session.id, "state-good", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "ready" });
  assert.equal(allowed.status, "APPLIED");
  assert.deepEqual((await runtimeService.get(actor, session.id)).runtimeState, { mode: "ready" });
  const replay = await invoke(session.id, "state-good", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "ready" });
  assert.equal(replay.decisionId, allowed.decisionId);
  assert.equal((await runtimeService.get(actor, session.id)).revision, 2);
  const undeclared = await invoke(session.id, "state-unknown", { type: "SET_DECLARED_RUNTIME_STATE", key: "wallet", value: 3 }, 2);
  assert.equal(undeclared.status, "REJECTED");
  assert.equal(undeclared.rejectionReason, "STATE_KEY_NOT_DECLARED");
  const invalid = await invoke(session.id, "state-invalid", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: { unsafe: true } }, 2);
  assert.equal(invalid.status, "REJECTED");
  const wrongType = await invoke(session.id, "state-wrong-type", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: 7 }, 2);
  assert.equal(wrongType.rejectionReason, "STATE_VALUE_TYPE_INVALID");
  const runtime = await runtimeService.get(actor, session.id);
  assert.equal(runtime.revision, 2);
  assert.deepEqual(runtime.runtimeState, { mode: "ready" });
});

test("policy rejects undeclared events, unsupported actions, unknown fields, unsafe, nested, authority-bearing, and oversized proposals", async () => {
  const session = await start("rejections", definition({ scenarioVariation: true }));
  let deep: Record<string, unknown> = { leaf: true };
  for (let index = 0; index < 6; index += 1) deep = { nested: deep };
  const proposals: Array<[unknown, string]> = [
    [{ type: "EMIT_DECLARED_EVENT", eventType: "not-declared" }, "EVENT_NOT_DECLARED"],
    [{ type: "ADAPT_DIFFICULTY", value: "EXPERT" }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    [{ type: "REQUEST_STAGE_TRANSITION", stageId: "stage-1" }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    [{ type: "NO_OP", execute: "later" }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    [{ type: "NO_OP", note: "DROP TABLE users" }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "ESCALATE", reasonCode: "OTHER", message: "https://example.invalid" }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "ESCALATE", reasonCode: "PAGE_ONCALL_HUMAN" }, "ESCALATION_REASON_INVALID"],
    [{ type: "ESCALATE", reasonCode: "OTHER", message: "m".repeat(600) }, "ESCALATION_MESSAGE_INVALID"],
    [{ type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: { note: "<script>alert(1)</script>" } }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: deep }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: { evidence: "verified" } }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: { organizationId: OTHER_ORG } }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "x".repeat(9000) }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`k${i}`, "v".repeat(200)])) }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    ["NO_OP", "PROPOSAL_INVALID_OR_OVERSIZED"],
  ];
  for (const [index, [proposal, reason]] of proposals.entries()) {
    const result = await invoke(session.id, `reject-${index}`, proposal);
    assert.equal(result.status, "REJECTED", JSON.stringify(proposal).slice(0, 120));
    assert.equal(result.rejectionReason, reason, JSON.stringify(proposal).slice(0, 120));
    assert.equal(result.action, null);
  }
  assert.equal((await runtimeService.get(actor, session.id)).revision, 1);
  assert.deepEqual(await runtimeService.listEvents(actor, session.id), []);
  const rows = await decisionRows(session.id);
  assert.equal(rows.length, proposals.length);
  // Rejected proposals are not stored verbatim: provenance is minimized.
  assert.ok(rows.every((row) => row.proposal.type === "INVALID_PROPOSAL" && row.rejection_reason));
});

test("malformed executor response and executor failure are recorded safely without runtime changes", async () => {
  const malformedSession = await start("malformed");
  const malformed = await invoke(malformedSession.id, "malformed-decision", { type: "NO_OP", extra: true });
  assert.equal(malformed.status, "REJECTED");
  const missingSession = await start("missing-action");
  const missing = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({} as MissionDirectorProposal))
    .direct(actor, missingSession.id, { expectedRevision: 1, idempotencyKey: `${RUN}:missing-action-decision` });
  assert.equal(missing.status, "REJECTED");
  const failedSession = await start("executor-failure");
  const failed = await invoke(failedSession.id, "executor-failure-decision", null, 1, new Error("provider details are not stored"));
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.rejectionReason, "EXECUTOR_UNAVAILABLE");
  const failedRows = await decisionRows(failedSession.id);
  assert.equal(failedRows.length, 1);
  assert.doesNotMatch(JSON.stringify(failedRows[0]), /provider details/);
  for (const id of [malformedSession.id, missingSession.id, failedSession.id]) {
    assert.equal((await runtimeService.get(actor, id)).revision, 1);
    assert.equal(await eventCount(id), 0);
  }
});

test("stale revisions are rejected without mutation and replay deterministically", async () => {
  const original = definition({ scenarioVariation: true });
  const session = await start("stale", original);
  await runtimeService.updateState(actor, session.id, { expectedRevision: 1, patch: { mode: "ready" } });
  const stale = await invoke(session.id, "stale", { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" }, 1);
  assert.equal(stale.status, "REJECTED");
  assert.equal(stale.rejectionReason, "STALE_REVISION");
  assert.equal((await runtimeService.get(actor, session.id)).revision, 2);
  assert.equal(await eventCount(session.id), 0);
  const replay = await invoke(session.id, "stale", { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" }, 1);
  assert.equal(replay.decisionId, stale.decisionId);
  assert.equal(replay.rejectionReason, "STALE_REVISION");
  const rows = await decisionRows(session.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].expected_runtime_revision, 1);
  assert.equal(rows[0].observed_runtime_revision, 2);
});

test("a proposal made stale during execution is rejected by Mission Runtime with no APPLIED provenance", async () => {
  const session = await start("stale-during", definition({ scenarioVariation: true }));
  const executor = new CapturingExecutor(
    { action: { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" } },
    async () => { await runtimeService.updateState(actor, session.id, { expectedRevision: 1, patch: { mode: "ready" } }); },
  );
  const result = await new MissionDirectorService(runtimeService, executor).direct(actor, session.id, {
    expectedRevision: 1, idempotencyKey: `${RUN}:stale-during-decision`,
  });
  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejectionReason, "MISSION_RUNTIME_REVISION_CONFLICT");
  assert.equal(result.runtime.revision, 2);
  assert.equal(await eventCount(session.id), 0);
  const rows = await decisionRows(session.id);
  assert.deepEqual(rows.map((row) => row.decision_status), ["REJECTED"]);
});

test("idempotency keys cannot be reinterpreted across revisions or runtimes", async () => {
  const first = await start("idem-a");
  const second = await start("idem-b");
  const key = "idem-shared";
  const original = await invoke(first.id, key, { type: "NO_OP" }, 1);
  assert.equal(original.status, "NO_OP");
  await assert.rejects(invoke(first.id, key, { type: "NO_OP" }, 2), isReused);
  await assert.rejects(invoke(second.id, key, { type: "NO_OP" }, 1), isReused);
  assert.equal((await decisionRows(first.id)).length, 1);
  assert.equal((await decisionRows(second.id)).length, 0);
  await assert.rejects(
    director({ type: "NO_OP" }).direct(actor, first.id, { expectedRevision: 1, idempotencyKey: "x".repeat(200) }),
    (error: unknown) => error instanceof MissionRuntimeError && error.code === "MISSION_DIRECTOR_IDEMPOTENCY_KEY_INVALID",
  );
});

test("concurrent retries with one key apply the runtime change and provenance exactly once", async () => {
  const session = await start("concurrent", definition({ scenarioVariation: true }));
  const action = { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" };
  const results = await Promise.all([1, 2, 3].map(() => invoke(session.id, "concurrent-decision", action)));
  assert.equal(new Set(results.map((result) => result.decisionId)).size, 1);
  assert.ok(results.every((result) => result.status === "APPLIED"));
  assert.equal(await eventCount(session.id), 1);
  assert.equal((await runtimeService.get(actor, session.id)).revision, 2);
  assert.equal((await decisionRows(session.id)).length, 1);
});

test("runtime mutation and APPLIED provenance commit atomically", async () => {
  const session = await start("atomic", definition({ scenarioVariation: true }));
  const action = { type: "EMIT_DECLARED_EVENT" as const, eventType: "objective-observed", payload: {} };
  const write = {
    idempotencyKey: `${RUN}:atomic-key`, capability: "missionDirector" as const, proposal: action,
    executorKind: "FIXTURE" as const, providerExecutionRef: null, policyVersion: MISSION_DIRECTOR_POLICY_VERSION,
    contextDigest: "0".repeat(64),
  };
  // Provenance insert violates its schema → runtime event and revision roll back.
  await assert.rejects(runtimeService.applyDirectorAction(actor, session.id, 1, action, { ...write, contextDigest: "not-a-digest" }));
  assert.equal((await runtimeService.get(actor, session.id)).revision, 1);
  assert.equal(await eventCount(session.id), 0);
  assert.equal((await decisionRows(session.id)).length, 0);
  // Provenance insert collides with an existing key → runtime change rolls back too.
  const holder = await start("atomic-holder");
  await invoke(holder.id, "atomic-key", { type: "NO_OP" });
  await assert.rejects(runtimeService.applyDirectorAction(actor, session.id, 1, action, write), (error: any) => error?.code === "23505");
  assert.equal((await runtimeService.get(actor, session.id)).revision, 1);
  assert.equal(await eventCount(session.id), 0);
  // Success path writes both together.
  await runtimeService.applyDirectorAction(actor, session.id, 1, action, { ...write, idempotencyKey: `${RUN}:atomic-ok` });
  assert.equal((await runtimeService.get(actor, session.id)).revision, 2);
  assert.equal(await eventCount(session.id), 1);
  assert.deepEqual((await decisionRows(session.id)).map((row) => row.decision_status), ["APPLIED"]);
});

test("organization isolation: another organization cannot direct, read, or collide with this runtime", async () => {
  const session = await start("org-isolation");
  await assert.rejects(
    new MissionDirectorService(runtimeService, new DeterministicMissionDirectorExecutor())
      .direct(otherActor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:org-isolation` }),
    (error: unknown) => error instanceof MissionRuntimeError && error.statusCode === 404,
  );
  assert.equal((await decisionRows(session.id)).length, 0);
  // The same idempotency key is independent in another organization's own scope.
  const mine = await invoke(session.id, "org-shared-key", { type: "NO_OP" });
  const otherSession = await start("org-isolation-other", definition(), otherActor);
  const theirs = await new MissionDirectorService(runtimeService, new DeterministicMissionDirectorExecutor())
    .direct(otherActor, otherSession.id, { expectedRevision: 1, idempotencyKey: `${RUN}:org-shared-key` });
  assert.notEqual(theirs.decisionId, mine.decisionId);
  assert.equal(theirs.status, "NO_OP");
  assert.equal((await decisionRows(otherSession.id))[0].organization_id, OTHER_ORG);
});

test("tenant isolation: policy rejects mismatched scope and the ledger rejects cross-tenant rows", async () => {
  const session = await start("tenant-isolation");
  const runtime = await runtimeService.get(actor, session.id);
  const context = {
    runtimeSessionId: runtime.id, organizationId: ORG, tenantId: `tenant:${ORG}`, missionId: runtime.missionId,
    missionVersion: runtime.missionVersion, runtimeRevision: 1, runtimeStatus: runtime.status, definitionSnapshot: runtime.definitionSnapshot,
    objectiveStates: runtime.objectiveStates, stageStates: runtime.stageStates, runtimeState: runtime.runtimeState, recentEvents: [],
    aiCapabilities: runtime.definitionSnapshot.aiCapabilities,
  } satisfies MissionDirectorContext;
  assert.deepEqual(validateMissionDirectorAction(context, 1, { type: "NO_OP" }, { organizationId: ORG, tenantId: `tenant:${ORG}` }), { ok: true, action: { type: "NO_OP" } });
  assert.deepEqual(validateMissionDirectorAction(context, 1, { type: "NO_OP" }, { organizationId: ORG, tenantId: `tenant:${OTHER_ORG}` }), { ok: false, reason: "TENANT_MISMATCH" });
  assert.deepEqual(validateMissionDirectorAction(context, 1, { type: "NO_OP" }, { organizationId: OTHER_ORG, tenantId: `tenant:${ORG}` }), { ok: false, reason: "ORGANIZATION_MISMATCH" });
  await assert.rejects(query(
    `INSERT INTO mission_director_decisions
     (director_decision_id, organization_id, tenant_id, mission_runtime_session_id, mission_id, mission_version,
      expected_runtime_revision, observed_runtime_revision, capability, idempotency_key, proposal, decision_status,
      executor_kind, policy_version, context_digest)
     VALUES (gen_random_uuid(), $1, $2, $3, 'm', 1, 1, 1, 'missionDirector', $4, '{"type":"NO_OP"}', 'NO_OP', 'FIXTURE', 'v1', $5)`,
    [ORG, `tenant:${OTHER_ORG}`, session.id, `${RUN}:cross-tenant`, "0".repeat(64)],
  ), /mission_director_tenant_matches_org/);
});

test("the executor receives a minimized projection of the frozen runtime snapshot, never the raw definition", async () => {
  const original = definition({ scenarioVariation: true });
  const session = await start("frozen", original);
  original.stages[0].title = "mutated after start";
  original.aiCapabilities.missionDirector = false;
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  const result = await new MissionDirectorService(runtimeService, executor).direct(actor, session.id, {
    expectedRevision: 1, idempotencyKey: `${RUN}:frozen-decision`,
  });
  assert.equal(result.status, "NO_OP");
  const seen = executor.seen!;
  assert.deepEqual(Object.keys(seen).sort(), [
    "activeStages", "aiCapabilities", "characters", "difficulty", "missionId", "missionVersion", "objectives", "recentEvents",
    "runtimeRevision", "runtimeSessionId", "runtimeState", "runtimeStatus", "scenarioBranching", "team", "worldContext",
  ]);
  assert.equal("definitionSnapshot" in seen, false);
  assert.equal(seen.activeStages[0].title, session.definitionSnapshot.stages[0].title);
  assert.notEqual(seen.activeStages[0].title, "mutated after start");
  assert.equal(seen.aiCapabilities.missionDirector, true);
  const serialized = JSON.stringify(seen);
  for (const forbidden of [USER, ORG, "tenant:", session.definitionSnapshot.summary]) assert.equal(serialized.includes(forbidden), false, forbidden);
  // Executor mutation of its context cannot reach the runtime snapshot.
  seen.activeStages[0].title = "executor tampering";
  assert.deepEqual((await runtimeService.get(actor, session.id)).definitionSnapshot, session.definitionSnapshot);
});

test("escalation is an operational runtime event and no institutional or external side effects occur", async () => {
  const session = await start("escalate", definition({ scenarioVariation: true }));
  const tables = ["arcade_results", "prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "learner_credentials",
    "curriculum_learner_mastery", "integration_outbox", "market_orders", "ai_agent_activity_ledger", "mission_definition_drafts",
    "mission_published_releases", "mission_publication_events", "mission_review_submissions"];
  const counts = async () => Promise.all(tables.map(async (table) =>
    Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)));
  const beforeCounts = await counts();
  const frozenBefore = (await runtimeService.get(actor, session.id)).definitionSnapshot;
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => { fetchCalls += 1; throw new Error("external HTTP is forbidden"); }) as typeof fetch;
  try {
    const escalated = await invoke(session.id, "escalate-decision", { type: "ESCALATE", reasonCode: "OPERATOR_REVIEW", message: "Review scenario pacing" });
    assert.equal(escalated.status, "APPLIED");
    const stated = await invoke(session.id, "escalate-state", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "ready" }, 2);
    assert.equal(stated.status, "APPLIED");
    // Completing the only objective drives the runtime to SUCCEEDED; that still creates no Result or Evidence.
    const evented = await invoke(session.id, "escalate-event", { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" }, 3);
    assert.equal(evented.status, "APPLIED");
    assert.equal(evented.runtime.status, "SUCCEEDED");
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalls, 0);
  const events = await runtimeService.listEvents(actor, session.id);
  assert.equal(events[0].eventType, "MISSION_DIRECTOR_ESCALATED");
  assert.deepEqual(events[0].payload, { reasonCode: "OPERATOR_REVIEW", message: "Review scenario pacing" });
  assert.deepEqual(await counts(), beforeCounts);
  assert.deepEqual((await runtimeService.get(actor, session.id)).definitionSnapshot, frozenBefore);
});

test("a Mission Runtime session uses its frozen snapshot without resolving publication state", async () => {
  const session = await start("retirement-snapshot", definition({ scenarioVariation: true }));
  const result = await invoke(session.id, "retirement-snapshot-decision", { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" });
  assert.equal(result.status, "APPLIED");
  assert.equal(result.runtime.definitionSnapshot.missionId, session.definitionSnapshot.missionId);
});

test("non-ACTIVE runtimes are rejected without mutation", async () => {
  const session = await start("abandoned");
  const abandoned = await runtimeService.transition(actor, session.id, "ABANDON", 1);
  const result = await invoke(session.id, "abandoned-decision", { type: "SET_DECLARED_RUNTIME_STATE", key: "mode", value: "ready" }, abandoned.revision);
  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejectionReason, "RUNTIME_NOT_ACTIVE");
  assert.equal((await runtimeService.get(actor, session.id)).revision, abandoned.revision);
});
