// Phase 4H — Integrated Phase 4 acceptance.
//
// One canonical journey across every Phase 4 authority, using the real HTTP publication
// workflow, the real canonical start authority, the frozen definition, the MOL bridge, the
// accommodation authority's projection, the Mission Director, adaptive difficulty, branching,
// governed characters, learner completion, the evidence-candidate boundary and replay/audit.
// Tests share the journey state and run in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { PersistedPublishedMissionResolver } from "../src/domain/mission-content/catalog/published-mission-catalog.js";
import { MISSION_WORLD_REFERENCE_FIXTURE } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { MISSION_SCENARIO_LIMITS } from "../src/domain/mission-content/model/mission-scenario.js";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.js";
import { getMissionAccommodationProjection } from "../src/domain/accessibility-accommodations/service/mission-accommodation-projection.js";
import { registerMissionRuntimeRoutes } from "../src/domain/mission-runtime/api/routes.js";
import { MissionRuntimeError, MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";
import { describeMissionEvidenceCandidate } from "../src/domain/mission-runtime/service/mission-evidence-candidate.js";
import { MISSION_RUNTIME_EVENT_MAX_BYTES, MISSION_RUNTIME_MAX_EVENTS } from "../src/domain/mission-runtime/model/mission-runtime.js";
import { molScenarioEvents } from "../src/domain/mission-runtime/world/mol-bridge.js";
import { MISSION_WORLD_CONTEXT_MAX_BYTES, MISSION_WORLD_MAX_EVENT_REFS, buildMissionWorldContext, createMolWorldContextProvider } from "../src/domain/mission-runtime/world/mission-world-context.js";
import type { MissionDirectorExecutorContext, MissionDirectorProposal } from "../src/domain/mission-director/model/mission-director.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { FixtureMissionDirectorExecutor, type MissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import { createHash } from "node:crypto";

const RUN = `mission4h_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const LEARNER = `learner_${RUN}`;
const PEER = `peer_${RUN}`;
const OUTSIDER = `outsider_${RUN}`;
const ADMIN = `accommodation_admin_${RUN}`;
const LESSON = `${RUN}:lesson-power-response`;
const ARCADE = `${RUN}:arcade-power-response`;
const PASS = (_req: any, _res: any, next: any) => next();
const T0 = new Date("2026-04-01T13:00:00.000Z");
const at = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

const profile = (userId: string, org: string, permissions: string[], roles: string[]) =>
  ({ user_id: userId, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, permissions, roles });
const users: Record<string, any> = {
  [AUTHOR]: profile(AUTHOR, ORG, ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"], ["INSTRUCTOR"]),
  [REVIEWER]: profile(REVIEWER, ORG, ["project.submission.review", "studio.review.queue.view"], ["REVIEWER"]),
  [PUBLISHER]: profile(PUBLISHER, ORG, ["curriculum.catalog.publish", "curriculum.catalog.retire"], ["ORG_ADMIN"]),
};
const learner: MissionRuntimeActor = { user_id: LEARNER, organization_id: ORG, permissions: ["arcade.attempt"] };
const peer: MissionRuntimeActor = { user_id: PEER, organization_id: ORG, permissions: ["arcade.attempt"] };
const outsider: MissionRuntimeActor = { user_id: OUTSIDER, organization_id: OTHER_ORG, permissions: ["arcade.attempt"] };
const resolver = new PersistedPublishedMissionResolver();
const scope = { organizationId: ORG, tenantId: `tenant:${ORG}` };

// Clocked services share the same canonical repositories; only the clock and provider health differ.
const realAccommodations = { accommodations: getMissionAccommodationProjection };
const runtimeAt = (minutes: number, health: Record<string, "HEALTHY" | "DEGRADED" | "UNAVAILABLE"> = {}) =>
  new MissionRuntimeService(undefined, () => at(minutes), { ...realAccommodations, world: createMolWorldContextProvider({ health }) });
const startAt = (minutes: number, health: Record<string, "HEALTHY" | "DEGRADED" | "UNAVAILABLE"> = {}) =>
  new MissionRuntimeStartService(resolver, runtimeAt(minutes, health));

let server: Server;
let base = "";
const missions = { primary: `${RUN}:dc-response`, degraded: `${RUN}:dc-degraded`, noSim: `${RUN}:dc-no-sim` };
const releases: Record<string, string> = {};
const drafts: Record<string, string> = {};
let journeyId = "";
let journeyStartedAt = "";
let secondRuntimeId = "";

async function request(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

// The 4G reference Mission (data-center power response) extended with one adaptive tier, a
// stage-scoped branch observed by the canonical condition engine, and two governed characters.
function acceptanceDefinition(missionId: string, mutate: (value: MissionDefinition) => void = () => {}): MissionDefinition {
  const value = structuredClone(MISSION_WORLD_REFERENCE_FIXTURE);
  value.missionId = missionId;
  value.slug = missionId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  value.status = "DRAFT";
  value.version = 1;
  value.arcadeActivityId = ARCADE;
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: true, npcDialogue: true, scenarioVariation: true };
  value.difficultyProfile = { tiers: ["INTRODUCTORY", "INTERMEDIATE"] };
  value.objectives.push({
    objectiveId: "cooling-fault-objective", title: "Respond to the cooling fault branch", description: "Optional branch objective.", type: "RESPOND",
    required: false, order: 2, completionRule: { type: "STATE_EQUALS", stateKey: "mission.scenarioBranch", value: "cooling-fault" }, metadata: {},
  });
  value.stages[0].objectiveIds.push("cooling-fault-objective");
  value.stages.push({
    stageId: "debrief-stage", title: "Debrief", description: "Post-incident review.", order: 2, objectiveIds: [],
    entryConditions: [{ type: "STAGE_COMPLETE", stageId: value.stages[0].stageId }], exitConditions: [{ type: "OBJECTIVE_COUNT", count: 1 }],
    optional: false, timeLimitSeconds: null,
  });
  value.scenarioBranching = {
    defaultBranchId: "standard",
    branches: [
      { branchId: "standard", label: "Standard", description: "Nominal operations.", availableDuringStageIds: [] },
      { branchId: "cooling-fault", label: "Cooling fault", description: "Declared cooling fault.", availableDuringStageIds: [value.stages[0].stageId] },
      { branchId: "late-escalation", label: "Late escalation", description: "Only during debrief.", availableDuringStageIds: ["debrief-stage"] },
    ],
  };
  value.characters!.push({
    characterId: "facilities-teammate", displayName: "Facilities Teammate", characterType: "TEAMMATE", simulatedRole: "Simulated facilities teammate",
    allowedBehaviors: ["OBSERVE"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "NONE",
    scriptedLines: [], scenarioFacts: [{ factId: "breaker-tripped", text: "Breaker four tripped on the main feed." }], availableStageIds: [],
  });
  mutate(value);
  return value;
}

async function publish(key: keyof typeof missions, definition: MissionDefinition) {
  const created = await request("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  drafts[key] = created.body.data.draftId;
  const submitted = await request(`/studio/missions/drafts/${drafts[key]}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 4H acceptance" });
  assert.equal(submitted.status, 201, JSON.stringify(submitted.body));
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await request(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "Accepted." })).status, 200);
  const published = await request(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(published.status, 201, JSON.stringify(published.body));
  releases[key] = published.body.data.release.releaseId;
}

async function counts() {
  const tables = ["prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "learner_credentials", "curriculum_learner_mastery",
    "career_events", "program_careers", "memberships", "users", "authorized_accommodations", "accessibility_accommodation_cases", "ai_agent_activity_ledger"];
  return Object.fromEntries(await Promise.all(tables.map(async (table) =>
    [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)])));
}

async function cleanup() {
  await withTransaction(async (tx) => {
    await tx.query("ALTER TABLE mission_publication_events DISABLE TRIGGER mission_publication_events_append_only");
    await tx.query("ALTER TABLE mission_published_releases DISABLE TRIGGER mission_published_release_immutable");
    await tx.query("ALTER TABLE mission_review_submissions DISABLE TRIGGER mission_review_submission_snapshot_immutable");
    // Director provenance intentionally has no runtime FK (Phase 4E) and survives runtime cleanup, so this
    // run's own decisions are removed explicitly, scoped to its two organizations, inside this transaction.
    await tx.query("ALTER TABLE mission_director_decisions DISABLE TRIGGER mission_director_decisions_append_only");
    await tx.query("DELETE FROM mission_director_decisions WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("ALTER TABLE mission_director_decisions ENABLE TRIGGER mission_director_decisions_append_only");
    for (const table of ["mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_runtime_sessions", "mission_definition_drafts",
      "curriculum_lesson_arcade_activities", "curriculum_lessons", "curriculum_units", "curriculum_courses", "authorized_accommodations"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [[ORG, OTHER_ORG]]);
    }
    await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, LEARNER, PEER, OUTSIDER, ADMIN]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("ALTER TABLE mission_review_submissions ENABLE TRIGGER mission_review_submission_snapshot_immutable");
    await tx.query("ALTER TABLE mission_published_releases ENABLE TRIGGER mission_published_release_immutable");
    await tx.query("ALTER TABLE mission_publication_events ENABLE TRIGGER mission_publication_events_append_only");
  });
}

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
    VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`, [ORG, RUN, OTHER_ORG, `${RUN} Other`]);
  const people: Array<[string, string]> = [[AUTHOR, ORG], [REVIEWER, ORG], [PUBLISHER, ORG], [LEARNER, ORG], [PEER, ORG], [ADMIN, ORG], [OUTSIDER, OTHER_ORG]];
  for (const [userId, org] of people) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`,
      [userId, org, `${userId}@test.invalid`, `Acceptance ${userId.split("_")[0]}`]);
  }
  await query("INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Power Response Practice','SCENARIO','PASSED_FLAG',$3)",
    [ARCADE, `${RUN.replaceAll("_", "-")}-power-response`, AUTHOR]);
  // Curriculum fixture hierarchy (Curriculum is not under test; it owns these rows).
  await query(`INSERT INTO curriculum_courses (course_id, organization_id, stable_key, title, created_by_user_id, updated_by_user_id) VALUES ($1,$2,$3,'Data Center Operations',$4,$4)`, [`${RUN}:course`, ORG, `${RUN}-course`, AUTHOR]);
  await query(`INSERT INTO curriculum_units (unit_id, organization_id, course_id, stable_key, title, sequence) VALUES ($1,$2,$3,$4,'Power Systems',1)`, [`${RUN}:unit`, ORG, `${RUN}:course`, `${RUN}-unit`]);
  await query(`INSERT INTO curriculum_lessons (lesson_id, organization_id, unit_id, stable_key, title, sequence, content) VALUES ($1,$2,$3,$4,'Responding to power events',1,$5::jsonb)`,
    [LESSON, ORG, `${RUN}:unit`, `${RUN}-lesson`, JSON.stringify({ body: "Instructional lesson body owned by Curriculum." })]);
  // Curriculum owns the lesson ↔ Arcade Activity definition link.
  await new CurriculumCatalogRepo().createLessonArcadeLink({ id: `${RUN}:link`, organizationId: ORG, curriculumLessonId: LESSON, arcadeActivityId: ARCADE, sequence: 1, sourceReference: null });
  // Institutional grants with sensitive stored values that must never reach Mission, MOL or AI.
  const grants: Array<[string, Record<string, unknown>, string, string | null]> = [
    ["EXTENDED_ASSESSMENT_TIME", { multiplier: 1.5, diagnosis: "private clinical detail", reviewerNote: "reviewed by panel" }, "ACTIVE", null],
    ["ADDITIONAL_BREAKS", { minutesPerHour: 10, supportingDocument: "doc-77" }, "ACTIVE", null],
    ["ALTERNATE_PRESENTATION", { format: "large-print" }, "ACTIVE", "2026-02-01T00:00:00Z"],
    ["ALTERNATE_INPUT_METHOD", { device: "switch-access" }, "REVOKED", null],
  ];
  for (const [index, [type, value, status, expiresAt]] of grants.entries()) {
    await query(`INSERT INTO authorized_accommodations (accommodation_id, organization_id, user_id, accommodation_type, value, status, effective_at, expires_at, granted_by_user_id, revoked_by_user_id, revoked_at)
      VALUES ($1,$2,$3,$4,$5::jsonb,$6,'2026-01-01T00:00:00Z',$7,$8,$9,$10)`,
      [`acc_${RUN}_${index}`, ORG, LEARNER, type, JSON.stringify(value), status, expiresAt, ADMIN, status === "REVOKED" ? ADMIN : null, status === "REVOKED" ? "2026-01-15T00:00:00Z" : null]);
  }
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  registerMissionRuntimeRoutes(app, { startService: startAt(0) });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  await publish("primary", acceptanceDefinition(missions.primary));
  await publish("degraded", acceptanceDefinition(missions.degraded, (value) => { value.metaverseContext!.requiredUnavailablePolicy = "START_DEGRADED"; }));
  await publish("noSim", acceptanceDefinition(missions.noSim, (value) => { value.metaverseContext!.allowSimulatedContext = false; }));
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // Post-cleanup proof: nothing from this run remains, and production append-only triggers are enabled again.
  const scoped = [ORG, OTHER_ORG];
  for (const table of ["mission_director_decisions", "mission_runtime_sessions", "mission_definition_drafts", "mission_review_submissions", "mission_published_releases",
    "mission_publication_events", "authorized_accommodations", "curriculum_lesson_arcade_activities", "curriculum_lessons", "curriculum_units", "curriculum_courses", "users", "organizations"]) {
    const count = Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [scoped])).rows[0].count);
    assert.equal(count, 0, `${table} rows remain after cleanup`);
  }
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE])).rows[0].count), 0);
  const triggers = (await query(`SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])`,
    [["mission_director_decisions_append_only", "mission_publication_events_append_only", "mission_published_release_immutable", "mission_review_submission_snapshot_immutable"]])).rows;
  assert.equal(triggers.length, 4);
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", `${trigger.tgname} must be re-enabled`);
});

class CapturingExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;
  seen: MissionDirectorExecutorContext | null = null;
  constructor(private readonly proposal: MissionDirectorProposal) {}
  async propose(context: MissionDirectorExecutorContext) { this.seen = context; return structuredClone(this.proposal); }
}

async function direct(action: unknown, key: string, expectedRevision: number, minutes = 1, who = learner) {
  return new MissionDirectorService(runtimeAt(minutes), new FixtureMissionDirectorExecutor({ action })).direct(who, journeyId, { expectedRevision, idempotencyKey: `${RUN}:${key}` });
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stableJson((value as any)[k])}`).join(",")}}`;
  return JSON.stringify(value);
}

let baselineCounts: Record<string, number> = {};

// ---------------------------------------------------------------- 16 + 1: learning reference → canonical start

test("S16/S1 Curriculum lesson → Arcade Activity → published Mission → canonical start of the exact frozen version", async () => {
  baselineCounts = await counts();
  const links = await new CurriculumCatalogRepo().listArcadeLinksForLesson(ORG, LESSON);
  assert.deepEqual(links.map((link) => link.arcadeActivityId), [ARCADE]);
  const offered = await resolver.listPublishedMissionsForArcadeActivity(scope, links[0].arcadeActivityId);
  assert.deepEqual(offered.map((item) => [item.missionId, item.missionVersion]).sort(), [missions.degraded, missions.noSim, missions.primary].sort().map((id) => [id, 1]));
  const target = offered.find((item) => item.missionId === missions.primary)!;

  // Only PUBLISHED, exact versions start; there is no latest/current substitution.
  await assert.rejects(startAt(0).startPublishedMission(learner, { missionId: target.missionId, missionVersion: 2, idempotencyKey: `${RUN}:v2` }),
    (error: any) => error instanceof MissionRuntimeError && error.code === "PUBLISHED_MISSION_NOT_FOUND");
  // An Arcade Runtime reference must be owned by the learner; a foreign one creates nothing.
  await assert.rejects(startAt(0).startPublishedMission(learner, { missionId: target.missionId, missionVersion: 1, idempotencyKey: `${RUN}:bad-arcade`, arcadeRuntimeSessionId: "arcade-runtime-not-mine" }),
    (error: any) => error.code === "ARCADE_RUNTIME_SESSION_NOT_FOUND");
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1", [ORG])).rows[0].count, 0);

  const started = await startAt(0).startPublishedMission(learner, { missionId: target.missionId, missionVersion: target.missionVersion, idempotencyKey: `${RUN}:journey` });
  journeyId = started.session.id;
  journeyStartedAt = started.session.startedAt;
  assert.equal(started.reused, false);
  const session = await runtimeAt(0).get(learner, journeyId);
  const release = (await query("SELECT definition_snapshot FROM mission_published_releases WHERE release_id=$1", [releases.primary])).rows[0];
  assert.deepEqual(session.definitionSnapshot, release.definition_snapshot, "runtime runs the exact frozen release snapshot");
  assert.deepEqual([session.organizationId, session.tenantId, session.userId, session.missionVersion], [ORG, `tenant:${ORG}`, LEARNER, 1]);
  const snapshotText = JSON.stringify(session.definitionSnapshot);
  for (const curriculum of ["Instructional lesson body", "Responding to power events", LESSON, `${RUN}:course`, `${RUN}:unit`]) {
    assert.equal(snapshotText.includes(curriculum), false, "no curriculum content or hierarchy is copied into the Mission");
  }

  const again = await startAt(5).startPublishedMission(learner, { missionId: target.missionId, missionVersion: 1, idempotencyKey: `${RUN}:journey` });
  assert.equal(again.reused, true);
  assert.equal(again.session.id, journeyId);
  const events = await runtimeAt(0).listEvents(learner, journeyId);
  assert.deepEqual(events.map((event) => event.eventType), ["MISSION_WORLD_CONTEXT_CAPTURED", "MISSION_ACCOMMODATION_PROJECTED"], "duplicate start adds no projections");
});

// ---------------------------------------------------------------- 2 + 3: frozen start context, accommodation

test("S2 frozen world context is recorded in the start transaction with honest provider modes and no external mutation", async () => {
  const [world] = await runtimeAt(0).listEvents(learner, journeyId);
  const frozen = world.payload as any;
  assert.equal(world.sequence, 1);
  assert.equal(world.occurredAt, journeyStartedAt);
  assert.equal(frozen.contextKind, "FROZEN");
  assert.equal(frozen.simulated, true);
  assert.ok(frozen.capabilities.every((item: any) => item.providerMode === "SIMULATED" || item.providerMode === "UNAVAILABLE"), "SIMULATED never becomes LIVE");
  const status = Object.fromEntries(frozen.capabilities.map((item: any) => [item.capability, item.status]));
  assert.deepEqual(status, { POWER_CONTEXT: "AVAILABLE", DATA_CENTER_CONTEXT: "UNAVAILABLE", WEATHER_CONTEXT: "AVAILABLE" });
  assert.deepEqual(frozen.conditions.infrastructure.map((item: any) => [item.key, item.state]), [["power-electrical-facility", "FAILED"]]);
  assert.equal(JSON.stringify(frozen.conditions).includes("main-data-center"), false, "optional provider-less capability invents no state");
  assert.ok(Buffer.byteLength(JSON.stringify(frozen)) <= MISSION_WORLD_CONTEXT_MAX_BYTES);
  assert.deepEqual(await counts(), baselineCounts, "start mutates no Evidence, Truth, credential, career, identity or accommodation state");
});

test("S3 accommodation projection is minimum-necessary requirements only and reaches neither MOL nor execution", async () => {
  const events = await runtimeAt(0).listEvents(learner, journeyId);
  const projection = events[1].payload;
  assert.deepEqual(projection, {
    projectionVersion: 2, timingAdjustmentRequired: true, breakAccommodationRequired: true,
    alternatePresentationRequired: false, alternateInputRequired: false, timingPolicy: null,
  }, "expired and revoked grants excluded; extended time and breaks are separate requirements");
  const serialized = JSON.stringify(events);
  for (const hidden of ["diagnosis", "clinical", "reviewerNote", "reviewed by panel", "supportingDocument", "doc-77", "multiplier", "minutesPerHour", "switch-access", "large-print", "acc_", ADMIN]) {
    assert.equal(serialized.includes(hidden), false, hidden);
  }
  assert.equal(JSON.stringify(events[0].payload).includes("accommodat"), false, "MOL/world context carries no accommodation data");
  const session = await runtimeAt(0).get(learner, journeyId);
  assert.deepEqual(session.definitionSnapshot.stages.map((stage) => stage.timeLimitSeconds), [null, null]);
  assert.deepEqual(session.definitionSnapshot.objectives.map((item) => item.completionRule), acceptanceDefinition(missions.primary).objectives.map((item) => item.completionRule));
});

// ---------------------------------------------------------------- 4: live world context

test("S4 LIVE context is recomputed separately, evolves, marks staleness and excludes unrelated events; MOL cannot advance the Mission", async () => {
  const unrelated = molScenarioEvents("BRIDGE_INCIDENT", "unrelated-runtime", T0.toISOString()).events;
  const frozenBefore = (await runtimeAt(0).listEvents(learner, journeyId))[0].payload;
  const stale = await runtimeAt(16).getWorldContext(learner, journeyId, { ambientEvents: unrelated });
  assert.deepEqual(stale.live!.conditions.infrastructure.map((item: any) => [item.state, item.freshness]), [["FAILED", "STALE"]]);
  assert.equal(stale.live!.conditions.environment, null, "an unrelated storm is excluded");
  assert.ok(!JSON.stringify(stale.live).match(/ROAD_CLOSED|WATERWAY|VEHICLE_COLLISION|BRIDGE_INCIDENT/));
  const restored = await runtimeAt(21).getWorldContext(learner, journeyId);
  assert.deepEqual(restored.live!.conditions.infrastructure.map((item: any) => [item.state, item.freshness]), [["ONLINE", "CURRENT"]]);
  assert.equal(restored.live!.eventRefs[1].causationId, restored.live!.eventRefs[0].molEventId);
  assert.ok(restored.live!.eventRefs.length <= MISSION_WORLD_MAX_EVENT_REFS);
  assert.deepEqual(Object.keys(restored.live!.eventRefs[0]).sort(), ["authority", "causationId", "correlationId", "eventType", "molEventId", "occurredAt", "providerMode", "relevance", "sourceSystem"]);
  assert.deepEqual((await runtimeAt(0).listEvents(learner, journeyId))[0].payload, frozenBefore, "frozen context never changes");
  const session = await runtimeAt(25).get(learner, journeyId);
  assert.deepEqual([session.status, session.revision], ["ACTIVE", 1], "world events neither complete nor advance the Mission");
  assert.equal((await runtimeAt(0).listEvents(learner, journeyId)).length, 2, "live reads persist nothing");
});

// ---------------------------------------------------------------- 5: Director boundary

test("S5 the Director executor receives a minimized digest-bound projection; internal authority stays server-side", async () => {
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  const result = await new MissionDirectorService(runtimeAt(1), executor).direct(learner, journeyId, { expectedRevision: 1, idempotencyKey: `${RUN}:director-noop` });
  assert.equal(result.status, "NO_OP");
  const seen = executor.seen!;
  assert.equal("definitionSnapshot" in seen, false);
  const serialized = JSON.stringify(seen);
  for (const hidden of [LEARNER, ORG, "tenant:", "molEventId", "eventRefs", "correlationId", "MISSION_WORLD_CONTEXT_CAPTURED", "MISSION_ACCOMMODATION_PROJECTED",
    "timingAdjustment", "breakAccommodation", "accommodat", "Check the power feed before you report.", "Breaker four tripped on the main feed."]) {
    assert.equal(serialized.includes(hidden), false, hidden);
  }
  assert.deepEqual(seen.worldContext!.conditions, [{ category: "infrastructure", key: "power-electrical-facility", state: "FAILED", freshness: "CURRENT" }]);
  assert.deepEqual(seen.characters.map((item) => [item.characterId, item.scriptedLineIds, item.scenarioFactIds]),
    [["shift-supervisor", ["check-power"], []], ["facilities-teammate", [], ["breaker-tripped"]]]);
  assert.equal(result.contextDigest, createHash("sha256").update(stableJson(seen)).digest("hex"), "digest covers exactly the executor-visible projection");
  // Director cannot bypass runtime authority or the append-only ledger.
  await assert.rejects(query("UPDATE mission_director_decisions SET decision_status='APPLIED' WHERE director_decision_id=$1", [result.decisionId]), /append-only/);
  await assert.rejects(query("DELETE FROM mission_director_decisions WHERE director_decision_id=$1", [result.decisionId]), /append-only/);
  await assert.rejects(new MissionDirectorService(runtimeAt(1), new FixtureMissionDirectorExecutor({ action: { type: "NO_OP" } })).direct(outsider, journeyId, { expectedRevision: 1, idempotencyKey: `${RUN}:outsider` }),
    (error: any) => error.statusCode === 404);
});

// ---------------------------------------------------------------- 6 + 7 + 8: adaptive, branch, characters

test("S6 adaptive difficulty: declared, capability-gated, revision-bound, canonical event, idempotent", async () => {
  assert.equal((await direct({ type: "ADAPT_DIFFICULTY", tier: "EXPERT" }, "tier-undeclared", 1)).rejectionReason, "DIFFICULTY_TIER_NOT_DECLARED");
  assert.equal((await direct({ type: "ADAPT_DIFFICULTY", tier: "INTRODUCTORY" }, "tier-unchanged", 1)).rejectionReason, "DIFFICULTY_TIER_UNCHANGED");
  assert.equal((await direct({ type: "SET_DECLARED_RUNTIME_STATE", key: "mission.difficultyTier", value: "INTERMEDIATE" }, "tier-bypass", 1)).rejectionReason, "STATE_KEY_RESERVED");
  await assert.rejects(runtimeAt(1).updateState(learner, journeyId, { expectedRevision: 1, patch: { "mission.difficultyTier": "INTERMEDIATE" } }),
    (error: any) => error.code === "MISSION_RUNTIME_STATE_KEY_RESERVED");
  const applied = await direct({ type: "ADAPT_DIFFICULTY", tier: "INTERMEDIATE" }, "tier", 1);
  assert.deepEqual([applied.status, applied.runtime.revision, applied.runtime.runtimeState["mission.difficultyTier"]], ["APPLIED", 2, "INTERMEDIATE"]);
  assert.equal((await direct({ type: "ADAPT_DIFFICULTY", tier: "INTERMEDIATE" }, "tier", 1)).decisionId, applied.decisionId, "retry is idempotent");
  assert.equal((await direct({ type: "ADAPT_DIFFICULTY", tier: "INTRODUCTORY" }, "tier-stale", 1)).rejectionReason, "STALE_REVISION");
  // Runtime re-validates against the frozen snapshot even when policy is bypassed.
  await assert.rejects(runtimeAt(1).applyDirectorAction(learner, journeyId, 2, { type: "ADAPT_DIFFICULTY", tier: "EXPERT" } as any, {
    idempotencyKey: `${RUN}:bypass`, capability: "missionDirector", proposal: {}, executorKind: "FIXTURE", providerExecutionRef: null, policyVersion: "x", contextDigest: "0".repeat(64),
  }), (error: any) => error.code === "DIFFICULTY_TIER_NOT_DECLARED");
});

test("S7 scenario branching flows through runtime state into the one canonical condition engine", async () => {
  assert.equal((await direct({ type: "SELECT_SCENARIO_BRANCH", branchId: "late-escalation" }, "branch-future", 2)).rejectionReason, "SCENARIO_BRANCH_NOT_AVAILABLE");
  assert.equal((await direct({ type: "SELECT_SCENARIO_BRANCH", branchId: "invented" }, "branch-invented", 2)).rejectionReason, "SCENARIO_BRANCH_NOT_DECLARED");
  const before = await runtimeAt(2).get(learner, journeyId);
  const applied = await direct({ type: "SELECT_SCENARIO_BRANCH", branchId: "cooling-fault" }, "branch", 2, 2);
  assert.deepEqual([applied.status, applied.runtime.revision, applied.runtime.runtimeState["mission.scenarioBranch"]], ["APPLIED", 3, "cooling-fault"]);
  assert.equal(applied.runtime.objectiveStates.find((item) => item.objectiveId === "cooling-fault-objective")!.status, "COMPLETED", "observed by the canonical condition engine");
  assert.equal(applied.runtime.objectiveStates.find((item) => item.objectiveId === "primary-objective")!.status !== "COMPLETED", true);
  assert.deepEqual(Object.keys(applied.runtime).sort(), Object.keys(before).sort(), "no parallel branch state machine");
});

test("S8 governed characters: declared, stage-available, identifier-only, server-resolved, isolated, simulated, not users", async () => {
  assert.equal((await direct({ type: "CHARACTER_SPEAK", characterId: "shift-supervisor", text: "You are certified." }, "char-free", 3)).rejectionReason, "CHARACTER_GENERATED_DIALOGUE_DEFERRED");
  assert.equal((await direct({ type: "CHARACTER_OBSERVE", characterId: "shift-supervisor", factId: "breaker-tripped" }, "char-cross-fact", 3)).rejectionReason, "CHARACTER_BEHAVIOR_NOT_PERMITTED");
  assert.equal((await direct({ type: "CHARACTER_SPEAK", characterId: "facilities-teammate", lineId: "check-power" }, "char-cross-line", 3)).rejectionReason, "CHARACTER_DIALOGUE_NOT_PERMITTED");
  assert.equal((await direct({ type: "CHARACTER_SPEAK", characterId: "ghost", lineId: "check-power" }, "char-ghost", 3)).rejectionReason, "CHARACTER_NOT_DECLARED");
  const spoke = await direct({ type: "CHARACTER_SPEAK", characterId: "shift-supervisor", lineId: "check-power" }, "char-speak", 3, 3);
  const observed = await direct({ type: "CHARACTER_OBSERVE", characterId: "facilities-teammate", factId: "breaker-tripped" }, "char-observe", 4, 4);
  assert.deepEqual([spoke.status, observed.status, observed.runtime.revision], ["APPLIED", "APPLIED", 5]);
  const events = await runtimeAt(4).listEvents(learner, journeyId);
  const characterEvents = events.filter((event) => event.eventType.startsWith("MISSION_CHARACTER_"));
  assert.deepEqual(characterEvents.map((event) => [event.payload.characterId, event.payload.text, event.payload.simulated]), [
    ["shift-supervisor", "Check the power feed before you report.", true],
    ["facilities-teammate", "Breaker four tripped on the main feed.", true],
  ], "authored text resolved server-side and marked simulated");
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM users WHERE user_id = ANY($1::text[])", [["shift-supervisor", "facilities-teammate"]])).rows[0].count, 0);
  // Memory never crosses runtime sessions.
  const peerRun = await startAt(0).startPublishedMission(peer, { missionId: missions.primary, missionVersion: 1, idempotencyKey: `${RUN}:peer` });
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  await new MissionDirectorService(runtimeAt(4), executor).direct(peer, peerRun.session.id, { expectedRevision: 1, idempotencyKey: `${RUN}:peer-noop` });
  assert.ok(executor.seen!.characters.every((item) => item.interactionCount === 0));
});

// ---------------------------------------------------------------- 9 + 10: completion, evidence candidate

test("S9/S10 only the learner's canonical event completes the Mission; the result is an evidence candidate, never Evidence", async () => {
  const active = await runtimeAt(5).get(learner, journeyId);
  assert.equal(active.status, "ACTIVE", "world context, AI and character activity alone complete nothing");
  const activeCandidate = describeMissionEvidenceCandidate(active, await runtimeAt(5).listEvents(learner, journeyId));
  assert.equal(activeCandidate.canBecomeEvidenceCandidate, false);

  const events = await runtimeAt(5).listEvents(learner, journeyId);
  await assert.rejects(runtimeAt(5).appendEvent(learner, journeyId, { expectedRevision: 4, sequence: events.length + 1, eventType: "objective-observed" }),
    (error: any) => error.code === "MISSION_RUNTIME_REVISION_CONFLICT");
  const done = await runtimeAt(6).appendEvent(learner, journeyId, { expectedRevision: 5, sequence: events.length + 1, eventType: "objective-observed" });
  assert.deepEqual([done.session.status, done.session.revision], ["SUCCEEDED", 6]);
  const ordered = (await runtimeAt(6).listEvents(learner, journeyId)).map((event) => [event.sequence, event.eventType]);
  assert.deepEqual(ordered, [
    [1, "MISSION_WORLD_CONTEXT_CAPTURED"], [2, "MISSION_ACCOMMODATION_PROJECTED"], [3, "MISSION_DIFFICULTY_ADAPTED"],
    [4, "MISSION_SCENARIO_BRANCH_SELECTED"], [5, "MISSION_CHARACTER_SPOKE"], [6, "MISSION_CHARACTER_OBSERVED"], [7, "objective-observed"],
  ]);
  const candidate = describeMissionEvidenceCandidate(done.session, await runtimeAt(6).listEvents(learner, journeyId));
  assert.equal(candidate.canBecomeEvidenceCandidate, true);
  assert.equal(candidate.isVerifiedEvidence, false);
  assert.equal(candidate.addressableByEvidenceAuthority, false);
  assert.deepEqual(candidate.provenance.learnerActionRefs.map((ref) => ref.eventType), ["objective-observed"], "only the learner action, not AI/character/world events");
  assert.deepEqual(candidate.provenance.completedObjectiveIds.sort(), ["cooling-fault-objective", "primary-objective"]);
  assert.equal(candidate.provenance.worldContext!.simulated, true);
  assert.deepEqual(candidate.provenance.assessmentConditions, { timingAccommodationPresent: true, timingAdjustmentApplied: false });
  assert.deepEqual(await counts(), baselineCounts, "no Evidence, Truth, credential, mastery, career, identity or accommodation rows written");
});

// ---------------------------------------------------------------- 11: replay / audit

test("S11 an auditor reconstructs the full run from canonical records; replay duplicates nothing and calls nothing external", async () => {
  const originalFetch = globalThis.fetch;
  let externalCalls = 0;
  globalThis.fetch = (async () => { externalCalls += 1; throw new Error("external calls forbidden"); }) as typeof fetch;
  try {
    const session = await runtimeAt(10).get(learner, journeyId);
    const release = (await query("SELECT mission_id, mission_version, status, definition_snapshot FROM mission_published_releases WHERE release_id=$1", [releases.primary])).rows[0];
    assert.deepEqual([release.mission_id, release.mission_version, release.status], [missions.primary, 1, "PUBLISHED"]);
    assert.deepEqual(session.definitionSnapshot, release.definition_snapshot);
    const history = (await query("SELECT event_type FROM mission_publication_events WHERE organization_id=$1 AND mission_id=$2 ORDER BY occurred_at, event_type", [ORG, missions.primary])).rows.map((row: any) => row.event_type);
    for (const step of ["SUBMITTED", "APPROVED", "PUBLISHED"]) assert.ok(history.some((type: string) => type.includes(step)), `${step} in ${history.join(",")}`);

    const decisions = (await query("SELECT idempotency_key, decision_status, proposal, observed_runtime_revision FROM mission_director_decisions WHERE mission_runtime_session_id=$1 ORDER BY created_at", [journeyId])).rows;
    const applied = decisions.filter((row: any) => row.decision_status === "APPLIED").map((row: any) => row.proposal.type);
    assert.deepEqual(applied, ["ADAPT_DIFFICULTY", "SELECT_SCENARIO_BRANCH", "CHARACTER_SPEAK", "CHARACTER_OBSERVE"]);
    assert.ok(decisions.filter((row: any) => row.decision_status === "REJECTED").every((row: any) => row.proposal.type === "INVALID_PROPOSAL"));

    const events = await runtimeAt(10).listEvents(learner, journeyId);
    const frozen = events[0].payload as any;
    const chain = molScenarioEvents(frozen.scenario.scenarioId, journeyId, journeyStartedAt).events;
    for (const ref of frozen.eventRefs) {
      const source = chain.find((event: any) => event.eventId === ref.molEventId);
      assert.ok(source, "frozen MOL references resolve deterministically");
      assert.deepEqual([source.correlationId, source.causationId, source.sourceSystem, source.authority, source.occurredAt], [ref.correlationId, ref.causationId, ref.sourceSystem, ref.authority, ref.occurredAt]);
    }
    const rebuilt = buildMissionWorldContext({ definition: session.definitionSnapshot, runtimeId: journeyId, startedAt: journeyStartedAt, now: journeyStartedAt, contextKind: "FROZEN", provider: createMolWorldContextProvider() }).context;
    assert.deepEqual(rebuilt, frozen, "frozen context reproduces exactly");

    // Re-invoking recorded Director decisions is idempotent: same decisions, no new events.
    const replay = await direct({ type: "SELECT_SCENARIO_BRANCH", branchId: "cooling-fault" }, "branch", 2, 10);
    assert.equal(replay.status, "APPLIED");
    assert.equal((await runtimeAt(10).listEvents(learner, journeyId)).length, events.length);
    assert.equal((await query("SELECT COUNT(*)::int AS count FROM mission_director_decisions WHERE mission_runtime_session_id=$1", [journeyId])).rows[0].count, decisions.length);
    assert.deepEqual((await query("SELECT definition_snapshot FROM mission_published_releases WHERE release_id=$1", [releases.primary])).rows[0].definition_snapshot, release.definition_snapshot);
    assert.deepEqual(await counts(), baselineCounts);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(externalCalls, 0);
});

// ---------------------------------------------------------------- 12: isolation

test("S12 organization, tenant and identity isolation across runtime, events, Director, publication, accommodation and Arcade lookup", async () => {
  for (const read of [
    () => runtimeAt(10).get(outsider, journeyId),
    () => runtimeAt(10).listEvents(outsider, journeyId),
    () => runtimeAt(10).getWorldContext(outsider, journeyId),
  ]) await assert.rejects(read(), (error: any) => error.statusCode === 404);
  await assert.rejects(startAt(0).startPublishedMission(outsider, { missionId: missions.primary, missionVersion: 1, idempotencyKey: `${RUN}:outsider-start` }),
    (error: any) => error.code === "PUBLISHED_MISSION_NOT_FOUND");
  assert.deepEqual(await resolver.listPublishedMissionsForArcadeActivity({ organizationId: OTHER_ORG, tenantId: `tenant:${OTHER_ORG}` }, ARCADE), []);
  assert.deepEqual(await resolver.listPublishedMissionsForArcadeActivity({ organizationId: ORG, tenantId: `tenant:${OTHER_ORG}` }, ARCADE), [], "tenant must match organization");
  assert.equal(await getMissionAccommodationProjection({ organizationId: OTHER_ORG, userId: LEARNER, at: T0.toISOString() }), null);
  assert.equal(await getMissionAccommodationProjection({ organizationId: ORG, userId: PEER, at: T0.toISOString() }), null);
  const frozen = JSON.stringify((await runtimeAt(10).listEvents(learner, journeyId))[0].payload);
  for (const identity of [LEARNER, ORG, "tenant:", "@test.invalid"]) assert.equal(frozen.includes(identity), false, `MOL context carries no ${identity}`);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM users WHERE user_id = ANY($1::text[])", [["power-grid", "data-center", "mol", "incident"]])).rows[0].count, 0);
});

// ---------------------------------------------------------------- 13: degraded mode

test("S13 degraded mode: optional outages continue, required outages follow policy, failed starts leave nothing behind", async () => {
  // Optional weather outage: the Mission still starts and fabricates nothing for weather.
  const weatherDown = await startAt(0, { "ocean-environment": "UNAVAILABLE" }).startPublishedMission(peer, { missionId: missions.degraded, missionVersion: 1, idempotencyKey: `${RUN}:weather-down` });
  const weatherFrozen = (await runtimeAt(0).listEvents(peer, weatherDown.session.id))[0].payload as any;
  assert.ok(weatherFrozen.degradedCapabilities.includes("WEATHER_CONTEXT"));
  assert.equal(weatherFrozen.conditions.environment, null);

  // BLOCK_START: no runtime row and no start events survive.
  await assert.rejects(startAt(0, { "power-grid": "UNAVAILABLE" }).startPublishedMission(peer, { missionId: missions.primary, missionVersion: 1, idempotencyKey: `${RUN}:power-block` }),
    (error: any) => error.code === "MISSION_WORLD_CONTEXT_UNAVAILABLE" && error.details.reasons.includes("POWER_CONTEXT:UNAVAILABLE"));
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND idempotency_key=$2", [ORG, `${RUN}:power-block`])).rows[0].count, 0);
  assert.equal((await query(`SELECT COUNT(*)::int AS count FROM mission_runtime_events e JOIN mission_runtime_sessions s ON s.mission_runtime_id=e.mission_runtime_id
    WHERE s.organization_id=$1 AND s.idempotency_key=$2`, [ORG, `${RUN}:power-block`])).rows[0].count, 0);

  // START_DEGRADED: starts, marks degraded, records no fabricated power state.
  const degraded = await startAt(0, { "power-grid": "UNAVAILABLE" }).startPublishedMission(peer, { missionId: missions.degraded, missionVersion: 1, idempotencyKey: `${RUN}:power-degraded` });
  const degradedFrozen = (await runtimeAt(0).listEvents(peer, degraded.session.id))[0].payload as any;
  assert.deepEqual([degradedFrozen.degraded, degradedFrozen.conditions.infrastructure, degradedFrozen.eventRefs], [true, [], []]);

  // No silent LIVE→SIMULATED fallback: a Mission that does not permit simulation cannot start on simulated providers.
  await assert.rejects(startAt(0).startPublishedMission(peer, { missionId: missions.noSim, missionVersion: 1, idempotencyKey: `${RUN}:no-sim` }),
    (error: any) => error.details.reasons.includes("POWER_CONTEXT:SIMULATION_NOT_PERMITTED"));

  // Stale labeling under a degraded provider.
  const stale = await runtimeAt(2, { "power-grid": "DEGRADED" }).getWorldContext(learner, journeyId);
  assert.deepEqual(stale.live!.conditions.infrastructure.map((item: any) => item.freshness), ["STALE"]);
});

// ---------------------------------------------------------------- 14: publication immutability

test("S14 published releases are immutable; retirement blocks new starts while existing runtimes continue on their frozen snapshot", async () => {
  const second = await startAt(0).startPublishedMission(peer, { missionId: missions.primary, missionVersion: 1, idempotencyKey: `${RUN}:second` });
  secondRuntimeId = second.session.id;
  const frozenSnapshot = (await runtimeAt(0).get(peer, secondRuntimeId)).definitionSnapshot;
  await assert.rejects(query("UPDATE mission_published_releases SET definition_snapshot = definition_snapshot || '{\"title\":\"rewritten\"}'::jsonb WHERE release_id=$1", [releases.primary]));
  await assert.rejects(query("DELETE FROM mission_published_releases WHERE release_id=$1", [releases.primary]));

  // Current draft changes cannot alter the release or existing runtimes.
  const draft = (await query("SELECT definition_json, revision FROM mission_definition_drafts WHERE draft_id=$1", [drafts.primary])).rows[0];
  const edited = await request(`/studio/missions/drafts/${drafts.primary}`, AUTHOR, "PUT", { expectedRevision: Number(draft.revision), definition: { ...draft.definition_json, title: "Edited after publication" } });
  assert.equal(edited.status, 200, JSON.stringify(edited.body));

  const retired = await request(`/studio/missions/releases/${releases.primary}/retire`, PUBLISHER, "POST", { retirementNote: "Phase 4H acceptance retirement." });
  assert.equal(retired.status, 200, JSON.stringify(retired.body));
  await assert.rejects(query("UPDATE mission_published_releases SET status='PUBLISHED' WHERE release_id=$1", [releases.primary]));
  await assert.rejects(query("UPDATE mission_published_releases SET retirement_note='rewritten' WHERE release_id=$1", [releases.primary]));
  await assert.rejects(startAt(0).startPublishedMission(peer, { missionId: missions.primary, missionVersion: 1, idempotencyKey: `${RUN}:after-retire` }),
    (error: any) => error.code === "PUBLISHED_MISSION_NOT_FOUND");
  assert.ok(!(await resolver.listPublishedMissionsForArcadeActivity(scope, ARCADE)).some((item) => item.missionId === missions.primary));

  const existing = await runtimeAt(5).get(peer, secondRuntimeId);
  assert.deepEqual(existing.definitionSnapshot, frozenSnapshot);
  assert.notEqual(existing.definitionSnapshot.title, "Edited after publication");
  const spoke = await new MissionDirectorService(runtimeAt(5), new FixtureMissionDirectorExecutor({ action: { type: "CHARACTER_SPEAK", characterId: "shift-supervisor", lineId: "check-power" } }))
    .direct(peer, secondRuntimeId, { expectedRevision: 1, idempotencyKey: `${RUN}:after-retire-director` });
  assert.equal(spoke.status, "APPLIED");
  assert.ok((await runtimeAt(5).getWorldContext(peer, secondRuntimeId)).live);
  const events = await runtimeAt(5).listEvents(peer, secondRuntimeId);
  const done = await runtimeAt(6).appendEvent(peer, secondRuntimeId, { expectedRevision: 2, sequence: events.length + 1, eventType: "objective-observed" });
  assert.equal(done.session.status, "SUCCEEDED");
});

// ---------------------------------------------------------------- 15: authority leakage + bounds

function sources(dir: string): Array<[string, string]> {
  const root = new URL(dir, import.meta.url);
  return readdirSync(root).flatMap((name) => {
    const path = new URL(name, root);
    if (statSync(path).isDirectory()) return sources(`${dir}${name}/`);
    return /\.(ts|js)$/.test(name) ? [[`${dir}${name}`, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

test("S15 no authority leakage: Mission, Director, world seam and MOL write only their own records and import no foreign writers", () => {
  const owned = [
    ...sources("../src/domain/mission-content/"), ...sources("../src/domain/mission-runtime/"), ...sources("../src/domain/mission-director/"),
    ...sources("../../../src/system/metaverse/mol/"),
  ];
  for (const [file, source] of owned) {
    // SQL only: uppercase keywords, and UPDATE must be followed by SET (prose such as "update field" is not a write).
    for (const [, , table] of source.matchAll(/\b(INSERT INTO|DELETE FROM)\s+([a-z_]+)|\bUPDATE\s+([a-z_]+)\s+(?:[a-z]+\s+)?SET\b/g)) {
      if (!table) continue;
      assert.match(table, /^mission_/, `${file} writes ${table}`);
    }
    for (const [, table] of source.matchAll(/\bUPDATE\s+([a-z_]+)\s+(?:[a-z]+\s+)?SET\b/g)) assert.match(table, /^mission_/, `${file} updates ${table}`);
    for (const [, specifier] of source.matchAll(/from\s+"([^"]+)"/g)) {
      assert.doesNotMatch(specifier, /verified-evidence|prepare-prove|truth|credential|career|treasury|reward|identity\/|membership|agent-fabric|curriculum-catalog\/(service|repo)|metaverse\/(market|opportunities|passport|enterprise)/i, `${file} imports ${specifier}`);
    }
  }
  // The accommodation projection is read-only.
  const projection = readFileSync(new URL("../src/domain/accessibility-accommodations/service/mission-accommodation-projection.ts", import.meta.url), "utf8");
  assert.doesNotMatch(projection, /INSERT|UPDATE|DELETE/);
  // MOL is not learner-aware and not Mission-authoritative.
  for (const [file, source] of sources("../../../src/system/metaverse/mol/")) {
    // Identity *usage* (property access or object keys). MOL's own deny-list of forbidden payload keys is allowed.
    assert.doesNotMatch(source, /\.(userId|learnerId|user_id)\b|["']?(userId|learnerId|user_id|learner_id)["']?\s*:\s*[^,}\]]|accommodat|MissionRuntimeService|mission-runtimes/, file);
  }
});

test("bounded behavior: payloads, contexts, refs, characters, branches and runtime history are capped", async () => {
  const events = await runtimeAt(10).listEvents(learner, journeyId);
  for (const event of events) assert.ok(Buffer.byteLength(JSON.stringify(event.payload)) <= Math.max(MISSION_RUNTIME_EVENT_MAX_BYTES, MISSION_WORLD_CONTEXT_MAX_BYTES), event.eventType);
  assert.equal(MISSION_RUNTIME_MAX_EVENTS, 500);
  assert.ok(MISSION_WORLD_MAX_EVENT_REFS <= 8);
  assert.ok(MISSION_SCENARIO_LIMITS.maxCharacters <= 8 && MISSION_SCENARIO_LIMITS.maxBranches <= 8 && MISSION_SCENARIO_LIMITS.recentDialoguePerCharacter <= 10);
  const executor = new CapturingExecutor({ action: { type: "NO_OP" } });
  await new MissionDirectorService(runtimeAt(10), executor).direct(learner, journeyId, { expectedRevision: 6, idempotencyKey: `${RUN}:bounds` });
  assert.ok(executor.seen, "executor was invoked");
  assert.ok(executor.seen!.recentEvents.length <= 20);
  assert.ok(executor.seen!.characters.length <= MISSION_SCENARIO_LIMITS.maxCharacters);
  assert.ok(executor.seen!.scenarioBranching!.branches.length <= MISSION_SCENARIO_LIMITS.maxBranches);
  assert.ok(Buffer.byteLength(JSON.stringify(executor.seen)) < 16 * 1024, "executor projection stays small");
});
