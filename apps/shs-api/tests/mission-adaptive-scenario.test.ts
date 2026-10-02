import { createHash } from "node:crypto";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { validateMissionDefinition, type MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { MISSION_BRANCH_STATE_KEY, MISSION_DIFFICULTY_STATE_KEY } from "../src/domain/mission-content/model/mission-scenario.js";
import { MISSION_DIRECTOR_POLICY_VERSION, type MissionDirectorContext, type MissionDirectorExecutorContext, type MissionDirectorProposal } from "../src/domain/mission-director/model/mission-director.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { DeterministicMissionDirectorExecutor, FixtureMissionDirectorExecutor, type MissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import { validateMissionDirectorAction } from "../src/domain/mission-director/service/mission-director-policy.js";
import { characterKnowledgeStageIds } from "../src/domain/mission-director/service/mission-director-scenario-rules.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";

const RUN = `mission4f_${Date.now()}`;
const ORG = `org_${RUN}`;
const USER = `user_${RUN}`;
const OTHER_ORG = `org_other_${RUN}`;
const OTHER_USER = `user_other_${RUN}`;
const actor: MissionRuntimeActor = { user_id: USER, organization_id: ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const otherActor: MissionRuntimeActor = { user_id: OTHER_USER, organization_id: OTHER_ORG, permissions: [SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT] };
const runtimeService = new MissionRuntimeService();
const sessionIds: string[] = [];

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
     VALUES ($1,$2,$3,'Adaptive Learner','active','local'),($4,$5,$6,'Other Learner','active','local')`,
    [USER, ORG, `${USER}@test.invalid`, OTHER_USER, OTHER_ORG, `${OTHER_USER}@test.invalid`],
  );
});
after(cleanup);

type Flags = Partial<MissionDefinition["aiCapabilities"]>;

// One closed scenario envelope: declared tiers, characters, and branches. A second stage exists
// so stage-scoped availability can be proven without adding any new runtime state machine.
function definition(flags: Flags = {}, base = MISSION_DEFINITION_FIXTURES[0]): MissionDefinition {
  const value = structuredClone(base);
  value.status = "PUBLISHED";
  value.missionId = `${RUN}:mission`;
  value.slug = `${RUN.replaceAll("_", "-")}-mission`;
  value.difficulty = "INTERMEDIATE";
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: true, npcDialogue: true, scenarioVariation: true, ...flags };
  value.objectives.push({
    objectiveId: "fault-objective", title: "Handle the equipment fault", description: "Optional branch objective.", type: "RESPOND",
    required: false, order: 2, completionRule: { type: "STATE_EQUALS", stateKey: MISSION_BRANCH_STATE_KEY, value: "equipment-fault" }, metadata: {},
  });
  value.stages[0].objectiveIds.push("fault-objective");
  value.stages.push({
    stageId: "debrief-stage", title: "Debrief", description: "Later stage.", order: 2, objectiveIds: [],
    entryConditions: [{ type: "STAGE_COMPLETE", stageId: value.stages[0].stageId }], exitConditions: [{ type: "OBJECTIVE_COUNT", count: 1 }],
    optional: false, timeLimitSeconds: null,
  });
  value.difficultyProfile = { tiers: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] };
  value.characters = [
    {
      characterId: "supervisor", displayName: "Shift Supervisor", characterType: "SUPERVISOR", simulatedRole: "Simulated shift supervisor",
      allowedBehaviors: ["SPEAK", "OBSERVE", "REQUEST_ACTION"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "BOUNDED",
      scriptedLines: [{ lineId: "greeting", text: "Check the panel before you start." }],
      scenarioFacts: [{ factId: "panel-warm", text: "The panel housing feels warm." }], availableStageIds: [],
    },
    {
      characterId: "trainer", displayName: "Trainer", characterType: "INSTRUCTOR", simulatedRole: "Simulated trainer",
      allowedBehaviors: ["SPEAK"], knowledgeScope: "MISSION_ONLY", dialogueMode: "SCRIPTED_ONLY",
      scriptedLines: [{ lineId: "hint-1", text: "Look at the indicator lights." }], scenarioFacts: [], availableStageIds: [value.stages[0].stageId],
    },
    {
      characterId: "witness", displayName: "Bystander", characterType: "WITNESS", simulatedRole: "Simulated bystander",
      allowedBehaviors: ["OBSERVE"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "NONE",
      scriptedLines: [], scenarioFacts: [{ factId: "saw-spark", text: "I saw a spark near the panel." }], availableStageIds: [],
    },
    {
      characterId: "late-arrival", displayName: "Inspector", characterType: "SUPERVISOR", simulatedRole: "Simulated inspector",
      allowedBehaviors: ["SPEAK"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "SCRIPTED_ONLY",
      scriptedLines: [{ lineId: "arrive", text: "Show me the log." }], scenarioFacts: [], availableStageIds: ["debrief-stage"],
    },
  ];
  value.scenarioBranching = {
    defaultBranchId: "standard",
    branches: [
      { branchId: "standard", label: "Standard", description: "Nominal conditions.", availableDuringStageIds: [] },
      { branchId: "equipment-fault", label: "Equipment fault", description: "A declared equipment issue.", availableDuringStageIds: [value.stages[0].stageId] },
      { branchId: "late-twist", label: "Late twist", description: "Only during debrief.", availableDuringStageIds: ["debrief-stage"] },
    ],
  };
  return value;
}

async function start(suffix: string, input = definition(), who = actor, service = runtimeService) {
  const result = await service.start(who, input, { idempotencyKey: `${RUN}:${suffix}` });
  sessionIds.push(result.session!.id);
  return result.session!;
}

class CapturingExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;
  seen: MissionDirectorExecutorContext | null = null;
  constructor(private readonly proposal: MissionDirectorProposal) {}
  async propose(context: MissionDirectorExecutorContext) {
    this.seen = context;
    return structuredClone(this.proposal);
  }
}

async function invoke(sessionId: string, key: string, action: unknown, expectedRevision = 1, who = actor, service = runtimeService) {
  return new MissionDirectorService(service, new FixtureMissionDirectorExecutor({ action }))
    .direct(who, sessionId, { expectedRevision, idempotencyKey: `${RUN}:${key}` });
}

async function events(sessionId: string) {
  return runtimeService.listEvents(actor, sessionId);
}

async function decisions(sessionId: string) {
  return (await query("SELECT * FROM mission_director_decisions WHERE mission_runtime_session_id=$1 ORDER BY created_at", [sessionId])).rows;
}

async function assertUntouched(sessionId: string, revision = 1) {
  const runtime = await runtimeService.get(actor, sessionId);
  assert.equal(runtime.revision, revision);
  return runtime;
}

const SIDE_EFFECT_TABLES = ["arcade_results", "prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "learner_credentials",
  "curriculum_learner_mastery", "integration_outbox", "market_orders", "ai_agent_activity_ledger", "ai_agent_identities", "memberships", "users",
  "mission_definition_drafts", "mission_review_submissions", "mission_published_releases", "mission_publication_events"];

async function sideEffectCounts() {
  return Promise.all(SIDE_EFFECT_TABLES.map(async (table) =>
    Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)));
}

// ---------------------------------------------------------------- definition envelope

test("the 4F scenario envelope validates and earlier definitions remain valid without it", () => {
  assert.deepEqual(validateMissionDefinition(definition()), []);
  for (const fixture of MISSION_DEFINITION_FIXTURES) assert.deepEqual(validateMissionDefinition(fixture), []);
});

test("difficulty profiles declare closed tiers only and cannot carry timing or accessibility overrides", () => {
  const cases: Array<[(value: any) => void, RegExp]> = [
    [(value) => { value.difficultyProfile.timeLimitSeconds = 5; }, /difficultyProfile\.timeLimitSeconds: unsupported field/],
    [(value) => { value.difficultyProfile.captionsAvailable = false; }, /difficultyProfile\.captionsAvailable: unsupported field/],
    [(value) => { value.difficultyProfile.tiers = ["BEGINNER", "NIGHTMARE"]; }, /undeclared tier/],
    [(value) => { value.difficultyProfile.tiers = ["BEGINNER", "ADVANCED"]; }, /must include the Mission difficulty/],
    [(value) => { value.difficultyProfile.tiers = [1, 2, 3]; }, /undeclared tier/],
  ];
  for (const [mutate, expected] of cases) {
    const value = definition();
    mutate(value);
    assert.match(validateMissionDefinition(value).join("; "), expected);
  }
});

test("characters are closed, Mission-scoped declarations with least-privilege defaults", () => {
  const cases: Array<[(value: any) => void, RegExp]> = [
    [(value) => { value.characters[0].characterType = "EMPLOYER_OF_RECORD"; }, /characterType is invalid/],
    [(value) => { value.characters[0].systemPrompt = "be anyone"; }, /systemPrompt: unsupported field/],
    [(value) => { value.characters[0].knowledgeScope = "ORGANIZATION_ALL_DATA"; }, /knowledgeScope is invalid/],
    [(value) => { value.characters[0].credentialId = "c1"; }, /outside Mission authority/],
    [(value) => { value.characters[0].userId = "real-user"; }, /outside Mission authority/],
    [(value) => { value.characters[0].scriptedLines[0].text = "<script>x</script>"; }, /executable content/],
    [(value) => { value.characters[1].dialogueMode = "NONE"; }, /SPEAK behavior and a dialogue mode/],
    [(value) => { value.characters[2].scenarioFacts = []; }, /OBSERVE behavior requires scenarioFacts/],
    [(value) => { value.characters[0].availableStageIds = ["nowhere"]; }, /unknown stage/],
    [(value) => { value.characters[0].environmentId = "undeclared-env"; }, /declared environmentRef/],
    [(value) => { value.characters.push(structuredClone(value.characters[0])); }, /characterId is duplicated/],
    [(value) => { value.characters[0].displayName = "x".repeat(200); }, /displayName must be bounded/],
  ];
  for (const [mutate, expected] of cases) {
    const value = definition();
    mutate(value);
    assert.match(validateMissionDefinition(value).join("; "), expected);
  }
});

test("healthcare, public safety, and non-GENERAL Missions permit only scripted character dialogue", () => {
  const healthcare = definition({}, MISSION_DEFINITION_FIXTURES.find((item) => item.family === "HEALTHCARE"));
  assert.match(validateMissionDefinition(healthcare).join("; "), /permit only SCRIPTED_ONLY character dialogue/);
  healthcare.characters![0].dialogueMode = "SCRIPTED_ONLY";
  assert.deepEqual(validateMissionDefinition(healthcare), []);
  const supervised = definition();
  supervised.safety.classification = "SUPERVISED";
  assert.match(validateMissionDefinition(supervised).join("; "), /permit only SCRIPTED_ONLY/);
});

test("branches are declared, and conditions cannot reference runtime-owned events or undeclared reserved keys", () => {
  const cases: Array<[(value: any) => void, RegExp]> = [
    [(value) => { value.scenarioBranching.defaultBranchId = "missing"; }, /defaultBranchId must reference a declared branch/],
    [(value) => { value.scenarioBranching.branches = [value.scenarioBranching.branches[0]]; }, /must declare 2-8 branches/],
    [(value) => { value.scenarioBranching.branches[1].entryActions = ["x"]; }, /entryActions: unsupported field/],
    [(value) => { value.failureConditions.push({ type: "EVENT_OCCURRED", eventType: "MISSION_DIRECTOR_ESCALATED" }); }, /reserved for Mission Runtime/],
    [(value) => { value.failureConditions.push({ type: "EVENT_OCCURRED", eventType: "MISSION_CHARACTER_SPOKE" }); }, /reserved for Mission Runtime/],
    [(value) => { value.failureConditions.push({ type: "STATE_EQUALS", stateKey: "mission.anything", value: "x" }); }, /reserved and not declared/],
    [(value) => { value.failureConditions.push({ type: "STATE_EQUALS", stateKey: MISSION_BRANCH_STATE_KEY, value: "invented" }); }, /STATE_EQUALS a declared value/],
    [(value) => { delete value.difficultyProfile; value.failureConditions.push({ type: "STATE_EQUALS", stateKey: MISSION_DIFFICULTY_STATE_KEY, value: "ADVANCED" }); }, /reserved and not declared/],
  ];
  for (const [mutate, expected] of cases) {
    const value = definition();
    mutate(value);
    assert.match(validateMissionDefinition(value).join("; "), expected);
  }
});

// ---------------------------------------------------------------- deterministic fallback

test("runtime start seeds the deterministic default tier and branch; definitions without 4F fields seed nothing", async () => {
  const adaptive = await start("seed");
  assert.deepEqual(adaptive.runtimeState, { [MISSION_DIFFICULTY_STATE_KEY]: "INTERMEDIATE", [MISSION_BRANCH_STATE_KEY]: "standard" });
  const legacyDefinition = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  legacyDefinition.status = "PUBLISHED";
  legacyDefinition.missionId = `${RUN}:legacy`;
  const legacy = await start("seed-legacy", legacyDefinition);
  assert.deepEqual(legacy.runtimeState, {});
});

test("deterministic fallback: executor outage is a FAILED decision and the Mission remains fully playable", async () => {
  const session = await start("fallback");
  const failed = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor(new Error("provider down")))
    .direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:fallback-failed` });
  assert.equal(failed.status, "FAILED");
  const noop = await new MissionDirectorService(runtimeService, new DeterministicMissionDirectorExecutor())
    .direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:fallback-noop` });
  assert.equal(noop.status, "NO_OP");
  const runtime = await assertUntouched(session.id);
  assert.equal(runtime.runtimeState[MISSION_DIFFICULTY_STATE_KEY], "INTERMEDIATE");
  const completed = await runtimeService.appendEvent(actor, session.id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed" });
  assert.equal(completed.session.status, "SUCCEEDED");
});

// ---------------------------------------------------------------- adaptive difficulty

test("adaptiveDifficulty false, a missing profile, undeclared tiers, and invented values are rejected without mutation", async () => {
  const disabled = await start("difficulty-disabled", definition({ adaptiveDifficulty: false }));
  assert.equal((await invoke(disabled.id, "difficulty-disabled", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" })).rejectionReason, "ADAPTIVE_DIFFICULTY_DENIED");
  const noProfileDefinition = definition();
  delete noProfileDefinition.difficultyProfile;
  const noProfile = await start("difficulty-no-profile", noProfileDefinition);
  assert.equal((await invoke(noProfile.id, "difficulty-no-profile", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" })).rejectionReason, "DIFFICULTY_PROFILE_NOT_DECLARED");
  const session = await start("difficulty-undeclared");
  for (const [index, [proposal, reason]] of ([
    [{ type: "ADAPT_DIFFICULTY", tier: "EXPERT" }, "DIFFICULTY_TIER_NOT_DECLARED"],
    [{ type: "ADAPT_DIFFICULTY", tier: 9 }, "DIFFICULTY_TIER_NOT_DECLARED"],
    [{ type: "ADAPT_DIFFICULTY", tier: "ADVANCED", multiplier: 3 }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    [{ type: "ADAPT_DIFFICULTY", tier: "INTERMEDIATE" }, "DIFFICULTY_TIER_UNCHANGED"],
  ] as const).entries()) {
    const result = await invoke(session.id, `difficulty-undeclared-${index}`, proposal);
    assert.equal(result.status, "REJECTED");
    assert.equal(result.rejectionReason, reason);
  }
  for (const id of [disabled.id, noProfile.id, session.id]) {
    await assertUntouched(id);
    assert.equal((await events(id)).length, 0);
  }
});

test("a declared tier is applied once through Mission Runtime with replayable history and APPLIED provenance", async () => {
  const session = await start("difficulty-apply");
  const before = await sideEffectCounts();
  const result = await invoke(session.id, "difficulty-apply", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" });
  assert.equal(result.status, "APPLIED");
  assert.equal(result.runtime.revision, 2);
  assert.equal(result.runtime.runtimeState[MISSION_DIFFICULTY_STATE_KEY], "ADVANCED");
  assert.deepEqual(result.runtime.definitionSnapshot.accessibility, session.definitionSnapshot.accessibility);
  assert.deepEqual(result.runtime.definitionSnapshot.stages.map((stage) => stage.timeLimitSeconds), session.definitionSnapshot.stages.map((stage) => stage.timeLimitSeconds));
  const history = await events(session.id);
  assert.deepEqual(history.map((event) => [event.eventType, event.payload]), [["MISSION_DIFFICULTY_ADAPTED", { fromTier: "INTERMEDIATE", toTier: "ADVANCED" }]]);
  const replay = await invoke(session.id, "difficulty-apply", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" });
  assert.equal(replay.decisionId, result.decisionId);
  assert.equal((await events(session.id)).length, 1);
  const rows = await decisions(session.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].decision_status, "APPLIED");
  assert.equal(rows[0].policy_version, MISSION_DIRECTOR_POLICY_VERSION);
  assert.deepEqual(rows[0].proposal, { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" });
  // Difficulty is not evidence: no mastery, credential, Result, or Evidence row appears.
  assert.deepEqual(await sideEffectCounts(), before);
  const stale = await invoke(session.id, "difficulty-stale", { type: "ADAPT_DIFFICULTY", tier: "BEGINNER" }, 1);
  assert.equal(stale.rejectionReason, "STALE_REVISION");
  assert.equal((await runtimeService.get(actor, session.id)).runtimeState[MISSION_DIFFICULTY_STATE_KEY], "ADVANCED");
});

test("runtime-managed keys cannot be set by learners or by the generic Director state action", async () => {
  const session = await start("reserved-keys");
  await assert.rejects(
    runtimeService.updateState(actor, session.id, { expectedRevision: 1, patch: { [MISSION_DIFFICULTY_STATE_KEY]: "EXPERT" } }),
    (error: unknown) => error instanceof MissionRuntimeError && error.code === "MISSION_RUNTIME_STATE_KEY_RESERVED",
  );
  const viaDirector = await invoke(session.id, "reserved-set", { type: "SET_DECLARED_RUNTIME_STATE", key: MISSION_BRANCH_STATE_KEY, value: "equipment-fault" });
  assert.equal(viaDirector.rejectionReason, "STATE_KEY_RESERVED");
  for (const eventType of ["MISSION_SCENARIO_BRANCH_SELECTED", "MISSION_CHARACTER_SPOKE", "MISSION_DIRECTOR_ESCALATED"]) {
    await assert.rejects(runtimeService.appendEvent(actor, session.id, { expectedRevision: 1, sequence: 1, eventType, payload: { characterId: "supervisor" } }),
      (error: unknown) => error instanceof MissionRuntimeError && error.code === "MISSION_RUNTIME_EVENT_TYPE_INVALID");
  }
  await assertUntouched(session.id);
});

// ---------------------------------------------------------------- characters

test("npcDialogue false, undeclared characters, unpermitted dialogue, and unavailable characters are rejected", async () => {
  const disabled = await start("npc-disabled", definition({ npcDialogue: false }));
  assert.equal((await invoke(disabled.id, "npc-disabled", { type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting" })).rejectionReason, "NPC_DIALOGUE_DENIED");
  const session = await start("npc-rejections");
  const cases: Array<[unknown, string]> = [
    [{ type: "CHARACTER_SPEAK", characterId: "ghost", lineId: "greeting" }, "CHARACTER_NOT_DECLARED"],
    [{ type: "CHARACTER_SPEAK", characterId: "witness", lineId: "greeting" }, "CHARACTER_DIALOGUE_NOT_PERMITTED"],
    [{ type: "CHARACTER_SPEAK", characterId: "trainer", text: "Improvised line" }, "CHARACTER_GENERATED_DIALOGUE_DEFERRED"],
    [{ type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "invented-line" }, "CHARACTER_LINE_NOT_DECLARED"],
    [{ type: "CHARACTER_SPEAK", characterId: "late-arrival", lineId: "arrive" }, "CHARACTER_NOT_AVAILABLE"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting", text: "both" }, "CHARACTER_GENERATED_DIALOGUE_DEFERRED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", text: "Tell me what the gauge reads." }, "CHARACTER_GENERATED_DIALOGUE_DEFERRED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", text: "<script>alert(1)</script>" }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", text: "Visit https://example.invalid" }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", text: "Great work, you are now certified." }, "CHARACTER_GENERATED_DIALOGUE_DEFERRED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor" }, "CHARACTER_LINE_NOT_DECLARED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", text: "Hi", userId: USER }, "PROPOSAL_INVALID_OR_OVERSIZED"],
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting", recipientId: OTHER_USER }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    // A character cannot borrow another character's private declarations by ID.
    [{ type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "hint-1" }, "CHARACTER_LINE_NOT_DECLARED"],
    [{ type: "CHARACTER_OBSERVE", characterId: "supervisor", factId: "saw-spark" }, "CHARACTER_FACT_NOT_DECLARED"],
    [{ type: "CHARACTER_OBSERVE", characterId: "witness", factId: "invented-fact" }, "CHARACTER_FACT_NOT_DECLARED"],
    [{ type: "CHARACTER_OBSERVE", characterId: "trainer", factId: "hint-1" }, "CHARACTER_BEHAVIOR_NOT_PERMITTED"],
    [{ type: "CHARACTER_REQUEST_ACTION", characterId: "supervisor", objectiveId: "invented-objective" }, "OBJECTIVE_NOT_DECLARED"],
    [{ type: "CHARACTER_REQUEST_ACTION", characterId: "witness", objectiveId: "primary-objective" }, "CHARACTER_BEHAVIOR_NOT_PERMITTED"],
    [{ type: "NPC_DIRECTION", characterId: "supervisor", instruction: "anything" }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
    [{ type: "INVOKE_AGENT", agent: "fabric" }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
  ];
  for (const [index, [proposal, reason]] of cases.entries()) {
    const result = await invoke(session.id, `npc-reject-${index}`, proposal);
    assert.equal(result.status, "REJECTED", JSON.stringify(proposal));
    assert.equal(result.rejectionReason, reason, JSON.stringify(proposal));
  }
  await assertUntouched(session.id);
  await assertUntouched(disabled.id);
  assert.equal((await events(session.id)).length, 0);
  assert.ok((await decisions(session.id)).every((row) => row.proposal.type === "INVALID_PROPOSAL"));
});

test("declared characters speak, observe, and request actions as simulated participants through runtime events", async () => {
  const session = await start("npc-apply");
  const before = await sideEffectCounts();
  const scripted = await invoke(session.id, "npc-scripted", { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" }, 1);
  const bounded = await invoke(session.id, "npc-bounded", { type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting" }, 2);
  const observed = await invoke(session.id, "npc-observe", { type: "CHARACTER_OBSERVE", characterId: "witness", factId: "saw-spark" }, 3);
  const requested = await invoke(session.id, "npc-request", { type: "CHARACTER_REQUEST_ACTION", characterId: "supervisor", objectiveId: "primary-objective" }, 4);
  for (const result of [scripted, bounded, observed, requested]) assert.equal(result.status, "APPLIED");
  const history = await events(session.id);
  assert.deepEqual(history.map((event) => event.eventType), ["MISSION_CHARACTER_SPOKE", "MISSION_CHARACTER_SPOKE", "MISSION_CHARACTER_OBSERVED", "MISSION_CHARACTER_REQUESTED_ACTION"]);
  assert.deepEqual(history[0].payload, { characterId: "trainer", characterType: "INSTRUCTOR", simulated: true, lineId: "hint-1", text: "Look at the indicator lights.", scripted: true });
  assert.deepEqual(history[1].payload, { characterId: "supervisor", characterType: "SUPERVISOR", simulated: true, lineId: "greeting", text: "Check the panel before you start.", scripted: true });
  // The fact text is resolved server-side from the frozen snapshot, never supplied by the executor.
  assert.deepEqual(history[2].payload, { characterId: "witness", characterType: "WITNESS", simulated: true, factId: "saw-spark", text: "I saw a spark near the panel." });
  assert.ok(history.every((event) => event.payload.simulated === true));
  // A character request is not completion: the objective stays open until the learner acts.
  const runtime = await runtimeService.get(actor, session.id);
  assert.equal(runtime.revision, 5);
  assert.notEqual(runtime.objectiveStates.find((item) => item.objectiveId === "primary-objective")!.status, "COMPLETED");
  assert.deepEqual(await sideEffectCounts(), before);
  const characterIdentity = await query("SELECT COUNT(*)::int AS count FROM users WHERE user_id = ANY($1::text[])", [["supervisor", "trainer", "witness"]]);
  assert.equal(characterIdentity.rows[0].count, 0);
  assert.equal((await decisions(session.id)).filter((row) => row.decision_status === "APPLIED").length, 4);
  // Retrying a character action never duplicates the line.
  const replay = await invoke(session.id, "npc-scripted", { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" }, 1);
  assert.equal(replay.decisionId, scripted.decisionId);
  assert.equal((await events(session.id)).length, 4);
});

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

async function capture(sessionId: string, key: string, revision: number) {
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  const result = await new MissionDirectorService(runtimeService, executor).direct(actor, sessionId, { expectedRevision: revision, idempotencyKey: `${RUN}:${key}` });
  return { seen: executor.seen!, result };
}

test("executor context is a closed projection without the raw definition, and the digest covers exactly that projection", async () => {
  const session = await start("projection");
  const { seen, result } = await capture(session.id, "projection-capture", 1);
  assert.equal("definitionSnapshot" in seen, false);
  assert.deepEqual(Object.keys(seen).sort(), [
    "activeStages", "aiCapabilities", "characters", "difficulty", "missionId", "missionVersion", "objectives", "recentEvents",
    "runtimeRevision", "runtimeSessionId", "runtimeState", "runtimeStatus", "scenarioBranching", "team", "worldContext",
  ]);
  const serialized = JSON.stringify(seen);
  // Content outside every visible scope never reaches the executor.
  for (const hidden of [
    session.definitionSnapshot.summary, "Only during debrief.", "A declared equipment issue.", "Show me the log.", "late-arrival",
    "Inspector", USER, ORG, "tenant:", "Adaptive Learner",
    // No authored character content of any kind.
    "Check the panel before you start.", "The panel housing feels warm.", "Look at the indicator lights.", "I saw a spark near the panel.",
  ]) assert.equal(serialized.includes(hidden), false, hidden);
  const expectedDigest = createHash("sha256").update(stableJson(seen)).digest("hex");
  assert.equal(result.contextDigest, expectedDigest);
  assert.equal((await decisions(session.id))[0].context_digest, expectedDigest);
});

test("difficulty and branch projections expose only the declared bounded choices", async () => {
  const session = await start("projection-choices");
  const { seen } = await capture(session.id, "projection-choices", 1);
  assert.deepEqual(seen.difficulty, { currentTier: "INTERMEDIATE", allowedTiers: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] });
  assert.deepEqual(seen.scenarioBranching, {
    currentBranchId: "standard",
    branches: [
      { branchId: "standard", label: "Standard", available: true },
      { branchId: "equipment-fault", label: "Equipment fault", available: true },
      { branchId: "late-twist", label: "Late twist", available: false },
    ],
  });
  assert.deepEqual(seen.activeStages.map((stage) => stage.stageId), [session.definitionSnapshot.stages[0].stageId]);
  assert.deepEqual(seen.objectives.map((objective) => Object.keys(objective).sort()), seen.objectives.map(() => ["objectiveId", "required", "status", "title", "type"]));
  // Capabilities that are off project nothing.
  const off = await start("projection-off", definition({ adaptiveDifficulty: false, scenarioVariation: false, npcDialogue: false }));
  const { seen: offSeen } = await capture(off.id, "projection-off", 1);
  assert.equal(offSeen.difficulty, null);
  assert.equal(offSeen.scenarioBranching, null);
  assert.deepEqual(offSeen.characters, []);
});

test("the shared executor sees a character directory only; authored IDs resolve server-side", async () => {
  const session = await start("npc-context");
  await invoke(session.id, "npc-context-speak", { type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting" }, 1);
  await invoke(session.id, "npc-context-trainer", { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" }, 2);
  await invoke(session.id, "npc-context-witness", { type: "CHARACTER_OBSERVE", characterId: "witness", factId: "saw-spark" }, 3);
  const { seen } = await capture(session.id, "npc-context-capture", 4);

  // Directory metadata, opaque declared IDs, and a content-free interaction count only.
  for (const view of seen.characters) {
    assert.deepEqual(Object.keys(view).sort(), [
      "allowedBehaviors", "characterId", "characterType", "dialogueMode", "displayName", "interactionCount", "knowledgeScope",
      "scenarioFactIds", "scriptedLineIds", "simulatedRole",
    ]);
  }
  const views = Object.fromEntries(seen.characters.map((view) => [view.characterId, view]));
  assert.deepEqual(Object.keys(views).sort(), ["supervisor", "trainer", "witness"]);
  assert.deepEqual(views.supervisor.scriptedLineIds, ["greeting"]);
  assert.deepEqual(views.witness.scenarioFactIds, ["saw-spark"]);
  assert.deepEqual(Object.values(views).map((view) => view.interactionCount), [1, 1, 1]);

  // No scripted text, fact text, dialogue payload, or character knowledge-stage content anywhere.
  const serialized = JSON.stringify(seen);
  const definition = session.definitionSnapshot;
  for (const character of definition.characters!) {
    for (const item of [...character.scriptedLines, ...character.scenarioFacts]) assert.equal(serialized.includes(item.text), false, item.text);
  }
  for (const key of ["recentDialogue", "knowledgeStages", "scriptedLines", "scenarioFacts"]) assert.equal(serialized.includes(`"${key}"`), false, key);
  assert.ok(seen.recentEvents.every((event) => !event.eventType.startsWith("MISSION_CHARACTER_")));
  assert.equal(serialized.includes(definition.stages[1].description), false);

  // Text appears only in runtime-owned events, resolved server-side from the frozen snapshot.
  const history = await events(session.id);
  assert.equal(history[0].payload.text, "Check the panel before you start.");
  assert.equal(history[2].payload.text, "I saw a spark near the panel.");

  // A separate runtime for the same learner and Mission carries no character memory.
  const second = await start("npc-context-second");
  const { seen: fresh } = await capture(second.id, "npc-context-second", 1);
  assert.ok(fresh.characters.every((view) => view.interactionCount === 0));
});

test("CURRENT_STAGE knowledge scope remains enforced server-side", async () => {
  const session = await start("npc-scope");
  const [currentStage, futureStage] = session.definitionSnapshot.stages;
  const supervisor = session.definitionSnapshot.characters!.find((item) => item.characterId === "supervisor")!;
  const trainer = session.definitionSnapshot.characters!.find((item) => item.characterId === "trainer")!;
  assert.deepEqual(characterKnowledgeStageIds(session.definitionSnapshot, supervisor, session), [currentStage.stageId]);
  assert.deepEqual(characterKnowledgeStageIds(session.definitionSnapshot, trainer, session), [currentStage.stageId, futureStage.stageId]);
  // Future-stage characters are not available, and requests stay within the active, in-scope stage.
  assert.equal((await invoke(session.id, "npc-scope-future", { type: "CHARACTER_SPEAK", characterId: "late-arrival", lineId: "arrive" })).rejectionReason, "CHARACTER_NOT_AVAILABLE");
  assert.equal((await invoke(session.id, "npc-scope-request", { type: "CHARACTER_REQUEST_ACTION", characterId: "supervisor", objectiveId: "primary-objective" })).status, "APPLIED");
});

test("server-side policy still decides against the full frozen definition the executor cannot see", async () => {
  const session = await start("policy-full-definition");
  // These items exist only in the internal snapshot (unavailable stage content), so precise
  // declaration-aware reasons prove the policy is not limited to the executor projection.
  assert.equal((await invoke(session.id, "policy-late-character", { type: "CHARACTER_SPEAK", characterId: "late-arrival", lineId: "arrive" })).rejectionReason, "CHARACTER_NOT_AVAILABLE");
  assert.equal((await invoke(session.id, "policy-late-branch", { type: "SELECT_SCENARIO_BRANCH", branchId: "late-twist" })).rejectionReason, "SCENARIO_BRANCH_NOT_AVAILABLE");
  assert.equal((await invoke(session.id, "policy-cross-character", { type: "CHARACTER_OBSERVE", characterId: "supervisor", factId: "saw-spark" })).rejectionReason, "CHARACTER_FACT_NOT_DECLARED");
  await assertUntouched(session.id);
});

// ---------------------------------------------------------------- scenario branches

test("scenarioVariation false, undeclared, unavailable, unchanged, and stale branch proposals are rejected without mutation", async () => {
  const disabled = await start("branch-disabled", definition({ scenarioVariation: false }));
  assert.equal((await invoke(disabled.id, "branch-disabled", { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" })).rejectionReason, "SCENARIO_VARIATION_DENIED");
  const session = await start("branch-rejections");
  for (const [index, [proposal, reason]] of ([
    [{ type: "SELECT_SCENARIO_BRANCH", branchId: "invented-branch" }, "SCENARIO_BRANCH_NOT_DECLARED"],
    [{ type: "SELECT_SCENARIO_BRANCH", branchId: "late-twist" }, "SCENARIO_BRANCH_NOT_AVAILABLE"],
    [{ type: "SELECT_SCENARIO_BRANCH", branchId: "standard" }, "SCENARIO_BRANCH_UNCHANGED"],
    [{ type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault", stages: [] }, "ACTION_UNSUPPORTED_OR_FIELDS_INVALID"],
  ] as const).entries()) {
    assert.equal((await invoke(session.id, `branch-reject-${index}`, proposal)).rejectionReason, reason);
  }
  const stale = await invoke(session.id, "branch-stale", { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" }, 99);
  assert.equal(stale.rejectionReason, "STALE_REVISION");
  await assertUntouched(session.id);
  await assertUntouched(disabled.id);
});

test("a declared branch is applied through the existing condition engine, not a parallel state machine", async () => {
  const session = await start("branch-apply");
  const before = await runtimeService.get(actor, session.id);
  const result = await invoke(session.id, "branch-apply", { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" });
  assert.equal(result.status, "APPLIED");
  const after = result.runtime;
  assert.equal(after.runtimeState[MISSION_BRANCH_STATE_KEY], "equipment-fault");
  // The optional branch objective completes through the canonical STATE_EQUALS condition path.
  assert.equal(after.objectiveStates.find((item) => item.objectiveId === "fault-objective")!.status, "COMPLETED");
  assert.deepEqual(Object.keys(after).sort(), Object.keys(before).sort());
  assert.deepEqual(after.stageStates.map((stage) => stage.stageId), before.stageStates.map((stage) => stage.stageId));
  assert.deepEqual((await events(session.id)).map((event) => [event.eventType, event.payload]), [["MISSION_SCENARIO_BRANCH_SELECTED", { fromBranchId: "standard", toBranchId: "equipment-fault" }]]);
  assert.deepEqual(after.definitionSnapshot, session.definitionSnapshot);
});

// ---------------------------------------------------------------- general guarantees

test("4F actions stay atomic with APPLIED provenance", async () => {
  const session = await start("atomic");
  const write = {
    idempotencyKey: `${RUN}:atomic`, capability: "missionDirector" as const, proposal: { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" },
    executorKind: "FIXTURE" as const, providerExecutionRef: null, policyVersion: MISSION_DIRECTOR_POLICY_VERSION, contextDigest: "not-a-digest",
  };
  for (const action of [
    { type: "ADAPT_DIFFICULTY" as const, tier: "ADVANCED" as const },
    { type: "SELECT_SCENARIO_BRANCH" as const, branchId: "equipment-fault" },
    { type: "CHARACTER_SPEAK" as const, characterId: "trainer", lineId: "hint-1" },
  ]) {
    await assert.rejects(runtimeService.applyDirectorAction(actor, session.id, 1, action, write));
    const runtime = await assertUntouched(session.id);
    assert.equal(runtime.runtimeState[MISSION_DIFFICULTY_STATE_KEY], "INTERMEDIATE");
    assert.equal(runtime.runtimeState[MISSION_BRANCH_STATE_KEY], "standard");
    assert.equal((await events(session.id)).length, 0);
    assert.equal((await decisions(session.id)).length, 0);
  }
  // Runtime re-validates against the locked frozen snapshot even if the policy is bypassed.
  await assert.rejects(
    runtimeService.applyDirectorAction(actor, session.id, 1, { type: "SELECT_SCENARIO_BRANCH", branchId: "invented" }, { ...write, contextDigest: "0".repeat(64) }),
    (error: unknown) => error instanceof MissionRuntimeError && error.code === "SCENARIO_BRANCH_NOT_DECLARED",
  );
  await assertUntouched(session.id);
});

test("a time limit elapsing during apply rejects the Director action instead of recording APPLIED", async () => {
  const timed = definition();
  timed.stages[0].timeLimitSeconds = 60;
  const t0 = new Date("2026-01-01T00:00:00.000Z");
  const startService = new MissionRuntimeService(undefined, () => t0);
  const session = await start("expired", timed, actor, startService);
  const lateService = new MissionRuntimeService(undefined, () => new Date(t0.getTime() + 3_600_000));
  const result = await invoke(session.id, "expired", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" }, 1, actor, lateService);
  assert.equal(result.status, "REJECTED");
  assert.equal(result.rejectionReason, "MISSION_RUNTIME_EXPIRED");
  assert.deepEqual((await decisions(session.id)).map((row) => row.decision_status), ["REJECTED"]);
  await assertUntouched(session.id);
});

test("idempotency keys are not reinterpreted across runtimes or revisions for 4F actions", async () => {
  const first = await start("idem-a");
  const second = await start("idem-b");
  const action = { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" };
  assert.equal((await invoke(first.id, "idem-shared", action)).status, "APPLIED");
  const reused = (error: unknown) => error instanceof MissionRuntimeError && error.code === "MISSION_DIRECTOR_IDEMPOTENCY_KEY_REUSED" && error.statusCode === 409;
  await assert.rejects(invoke(second.id, "idem-shared", action), reused);
  await assert.rejects(invoke(first.id, "idem-shared", action, 2), reused);
  assert.equal((await events(first.id)).length, 1);
  assert.equal((await events(second.id)).length, 0);
});

test("organization and tenant isolation hold for 4F actions", async () => {
  const session = await start("isolation");
  await assert.rejects(
    invoke(session.id, "isolation-cross-org", { type: "ADAPT_DIFFICULTY", tier: "ADVANCED" }, 1, otherActor),
    (error: unknown) => error instanceof MissionRuntimeError && error.statusCode === 404,
  );
  await assertUntouched(session.id);
  assert.equal((await decisions(session.id)).length, 0);
  const runtime = await runtimeService.get(actor, session.id);
  const context = {
    runtimeSessionId: runtime.id, organizationId: ORG, tenantId: `tenant:${ORG}`, missionId: runtime.missionId, missionVersion: runtime.missionVersion,
    runtimeRevision: 1, runtimeStatus: runtime.status, definitionSnapshot: runtime.definitionSnapshot, objectiveStates: runtime.objectiveStates,
    stageStates: runtime.stageStates, runtimeState: runtime.runtimeState, recentEvents: [], aiCapabilities: runtime.definitionSnapshot.aiCapabilities,
  } satisfies MissionDirectorContext;
  const proposal = { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" };
  assert.equal(validateMissionDirectorAction(context, 1, proposal, { organizationId: ORG, tenantId: `tenant:${ORG}` }).ok, true);
  assert.deepEqual(validateMissionDirectorAction(context, 1, proposal, { organizationId: ORG, tenantId: `tenant:${OTHER_ORG}` }), { ok: false, reason: "TENANT_MISMATCH" });
  assert.deepEqual(validateMissionDirectorAction(context, 1, proposal, { organizationId: OTHER_ORG, tenantId: `tenant:${ORG}` }), { ok: false, reason: "ORGANIZATION_MISMATCH" });
});

test("the frozen runtime snapshot governs characters, tiers, and branches after the source definition changes", async () => {
  const source = definition();
  const session = await start("frozen", source);
  source.characters = [];
  source.difficultyProfile = { tiers: ["INTERMEDIATE", "EXPERT"] };
  source.scenarioBranching!.branches[1].branchId = "renamed";
  const executor = new CapturingExecutor({ action: { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" } });
  const result = await new MissionDirectorService(runtimeService, executor).direct(actor, session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:frozen` });
  assert.equal(result.status, "APPLIED");
  assert.equal(executor.seen!.characters.length, 3);
  assert.equal((await invoke(session.id, "frozen-expert", { type: "ADAPT_DIFFICULTY", tier: "EXPERT" }, 2)).rejectionReason, "DIFFICULTY_TIER_NOT_DECLARED");
  assert.equal((await invoke(session.id, "frozen-branch", { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" }, 2)).status, "APPLIED");
  assert.deepEqual((await runtimeService.get(actor, session.id)).definitionSnapshot, session.definitionSnapshot);
});

test("4F actions make no external HTTP calls and create no Result, Evidence, Truth, credential, identity, reward, or publication rows", async () => {
  const session = await start("side-effects");
  const before = await sideEffectCounts();
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = (async () => { fetchCalls += 1; throw new Error("external HTTP is forbidden"); }) as typeof fetch;
  try {
    const actions: unknown[] = [
      { type: "ADAPT_DIFFICULTY", tier: "BEGINNER" },
      { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" },
      { type: "CHARACTER_SPEAK", characterId: "supervisor", lineId: "greeting" },
      { type: "CHARACTER_OBSERVE", characterId: "supervisor", factId: "panel-warm" },
      { type: "CHARACTER_REQUEST_ACTION", characterId: "supervisor", objectiveId: "primary-objective" },
      { type: "CHARACTER_SPEAK", characterId: "supervisor", text: "You are certified now." },
    ];
    for (const [index, action] of actions.entries()) {
      await invoke(session.id, `side-effects-${index}`, action, (await runtimeService.get(actor, session.id)).revision);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(fetchCalls, 0);
  assert.deepEqual(await sideEffectCounts(), before);
  assert.equal((await runtimeService.get(actor, session.id)).revision, 6);
});
