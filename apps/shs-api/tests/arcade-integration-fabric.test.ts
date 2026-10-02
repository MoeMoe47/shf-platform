// Phase 6 — Arcade Integration Fabric acceptance.
// Learning Arcade and Classic Arcade share platform infrastructure but remain separate product authorities.
// Arcade Integration Fabric coordinates integrations; it does not absorb the authority of connected systems.
// Missions are published through the real review workflow; the Fabric is driven over HTTP and directly,
// and every connected system (Curriculum, Mission, Team, Career, Evidence, MOL) is the real one. Tests run in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { startAttempt, submitResult } from "../src/domain/arcade/service/arcade-service.js";
import { getResultReplay } from "../src/domain/arcade/service/replay-service.js";
import { ArcadeRuntimeSessionService } from "../src/domain/arcade/service/runtime-session-service.js";
import { registerArcadeIntegrationRoutes } from "../src/domain/arcade-integration/api/routes.js";
import { canonicalArcadeExperiences, validateArcadeExperience } from "../src/domain/arcade-integration/arcade-experience-bridge.js";
import { ARCADE_INTEGRATION_CAPABILITIES, ARCADE_INTEGRATION_ERRORS, ARCADE_INTEGRATION_TELEMETRY_SOURCES } from "../src/domain/arcade-integration/model/arcade-integration.js";
import { ArcadeIntegrationService, deriveArcadeCapabilities } from "../src/domain/arcade-integration/service/arcade-integration-service.js";
import { getMissionAccommodationProjection } from "../src/domain/accessibility-accommodations/service/mission-accommodation-projection.js";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { PersistedPublishedMissionResolver } from "../src/domain/mission-content/catalog/published-mission-catalog.js";
import { MISSION_DEFINITION_FIXTURES, MISSION_WORLD_REFERENCE_FIXTURE } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { FixtureMissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { describeMissionEvidenceCandidate } from "../src/domain/mission-runtime/service/mission-evidence-candidate.js";
import { MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";
import { MissionTeamService } from "../src/domain/mission-team/service/mission-team-service.js";

const RUN = `fabric6_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const LEARNER = `learner_${RUN}`;
const TEAMMATE = `teammate_${RUN}`;
const OUTSIDER = `outsider_${RUN}`;
const ADMIN = `acc_admin_${RUN}`;
const ARCADE = `arcade_${RUN}`;
const LESSON = `${RUN}:lesson`;
const FAMILY = `career_family_${RUN}`;
const CAREER = `career_${RUN}`;
const LESSON_BODY = `Instructional lesson body ${RUN} owned by Curriculum.`;
const PRIVATE_DIAGNOSIS = `private clinical detail ${RUN}`;
const PASS = (_req: any, _res: any, next: any) => next();

const profile = (userId: string, org: string, permissions: string[]) =>
  ({ user_id: userId, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, permissions, roles: [] });
const learnerPerms = ["arcade.attempt"];
const users: Record<string, any> = {
  [AUTHOR]: profile(AUTHOR, ORG, ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"]),
  [REVIEWER]: profile(REVIEWER, ORG, ["project.submission.review", "studio.review.queue.view"]),
  [PUBLISHER]: profile(PUBLISHER, ORG, ["curriculum.catalog.publish", "curriculum.catalog.retire"]),
  [LEARNER]: profile(LEARNER, ORG, learnerPerms), [TEAMMATE]: profile(TEAMMATE, ORG, learnerPerms), [OUTSIDER]: profile(OUTSIDER, OTHER_ORG, learnerPerms),
};
const actorOf = (userId: string): MissionRuntimeActor & { roles: string[] } =>
  ({ user_id: userId, organization_id: users[userId].organization_id, permissions: users[userId].permissions, roles: [] });

const missions = { team: `${RUN}:team`, solo: `${RUN}:solo`, unpublished: `${RUN}:unpublished`, unlinked: `${RUN}:unlinked`, noActivity: `${RUN}:no-activity` };
const EXPERIENCE = { learning: `experience.learning.${RUN}`, classic: `experience.classic.${RUN}`, bare: `experience.bare.${RUN}` };

// Reference descriptors on the canonical Arcade experience descriptor (extended, never replaced).
function descriptor(id: string, family: "learning" | "classic", mutate: (value: any) => void = () => {}) {
  const value: any = {
    id, slug: id.replaceAll(".", "-").replaceAll("_", "-"),
    activityReference: { arcadeActivityId: null },
    product: { family, experienceType: family === "learning" ? "mission" : "game" },
    lifecycle: { status: "active", launchable: true, playable: true },
    launch: { route: `/arcade/${family}/${id}`, runtimeType: "internal" },
    presentation: { title: `${family} reference`, shortTitle: null, description: "Phase 6 reference experience.", category: null, difficulty: "intermediate", artwork: null, thumbnail: null },
    capabilities: { leaderboardEligible: false, tournamentEligible: false, multiplayer: false, spectator: false, evidenceResultCapable: false },
    relationships: {
      career: { relationshipType: "none", pathwayReferences: [] },
      metaverse: { relationshipType: "none", experienceReferences: [] },
      agentFabric: { relationshipType: "none", capabilityReferences: [] },
      treasury: { relationshipType: "none", rewardPolicyReference: null },
      studio: { relationshipType: "none", projectReferences: [] },
    },
    accessibility: { profileAware: false, reducedMotionRequired: false, keyboardRequired: false },
    provenance: { classification: "canonical_descriptor", migratedFrom: [] },
  };
  mutate(value);
  return value;
}

const learningDescriptor = descriptor(EXPERIENCE.learning, "learning", (value) => {
  value.activityReference.arcadeActivityId = ARCADE;
  Object.assign(value.capabilities, { leaderboardEligible: true, multiplayer: true, evidenceResultCapable: true, missionLaunch: true, replay: true, achievementEligible: true });
  value.relationships.mission = { relationshipType: "reference", missionReferences: [
    { missionId: missions.team, missionVersion: 1 }, { missionId: missions.solo, missionVersion: 1 }, { missionId: missions.unpublished, missionVersion: 1 },
  ] };
  value.relationships.career = { relationshipType: "reference", pathwayReferences: [CAREER, `missing_${RUN}`] };
  value.relationships.metaverse = { relationshipType: "reference", experienceReferences: ["world.data-center.reference"] };
  value.accessibility.supports = { keyboardSupported: true, reducedMotionSupported: true, captionsSupported: false };
  value.provenance.source = "INSTRUCTOR";
});
const classicDescriptor = descriptor(EXPERIENCE.classic, "classic", (value) => {
  Object.assign(value.capabilities, { leaderboardEligible: true, achievementEligible: true });
  value.provenance.source = "PARTNER";
});
// A descriptor with no Phase 6 fields at all (backward compatibility).
const bareDescriptor = descriptor(EXPERIENCE.bare, "learning");
const REFERENCE_DESCRIPTORS = [learningDescriptor, classicDescriptor, bareDescriptor];

const resolver = new PersistedPublishedMissionResolver();
const runtimeService = new MissionRuntimeService(undefined, () => new Date(), { accommodations: getMissionAccommodationProjection });
const startService = new MissionRuntimeStartService(resolver, runtimeService);
const teamService = new MissionTeamService(runtimeService);
const arcadeRuntime = new ArcadeRuntimeSessionService();
const catalog = canonicalArcadeExperiences(REFERENCE_DESCRIPTORS);
const fabric = new ArcadeIntegrationService({ experiences: () => catalog.descriptors, missions: resolver, missionRuntime: runtimeService, missionStart: startService, arcadeRuntime });

let server: Server;
let base = "";
const state: Record<string, any> = {};

const httpFetch = globalThis.fetch;
async function call(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await httpFetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}
const experiencePath = (id: string, suffix = "") => `/arcade/integration/experiences/${encodeURIComponent(id)}${suffix}`;

function teamDefinition(missionId: string): MissionDefinition {
  const value = structuredClone(MISSION_WORLD_REFERENCE_FIXTURE);
  value.missionId = missionId;
  value.slug = missionId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  value.status = "DRAFT";
  value.arcadeActivityId = ARCADE;
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: true, npcDialogue: true, scenarioVariation: true };
  value.difficultyProfile = { tiers: ["INTRODUCTORY", "INTERMEDIATE"] };
  value.multiplayer = {
    enabled: true, minParticipants: 2, maxParticipants: 2, teamMode: "SINGLE_TEAM", lateJoinPolicy: "NONE",
    roles: [{ roleId: "OPERATOR", label: "Operator", required: true, maxParticipants: 1 }, { roleId: "TECHNICIAN", label: "Technician", required: true, maxParticipants: 1 }],
  };
  value.objectives = [
    { objectiveId: "inspect", title: "Inspect the power system", description: "Operator inspection.", type: "INSPECT", required: true, order: 1,
      completionRule: { type: "ROLE_EVENT_OCCURRED", eventType: "system-inspected", missionRole: "OPERATOR" }, metadata: {} },
    { objectiveId: "respond", title: "Perform the response action", description: "Technician response.", type: "RESPOND", required: true, order: 2,
      completionRule: { type: "ROLE_EVENT_OCCURRED", eventType: "response-performed", missionRole: "TECHNICIAN" }, metadata: {} },
  ];
  value.stages[0].objectiveIds = ["inspect", "respond"];
  value.stages[0].exitConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "inspect" }, { type: "OBJECTIVE_COMPLETE", objectiveId: "respond" }];
  value.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "inspect" }, { type: "OBJECTIVE_COMPLETE", objectiveId: "respond" }];
  return value;
}

function soloDefinition(missionId: string): MissionDefinition {
  const value = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  value.missionId = missionId;
  value.slug = missionId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  value.status = "DRAFT";
  value.arcadeActivityId = ARCADE;
  return value;
}

async function publish(definition: MissionDefinition) {
  const created = await call("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const submitted = await call(`/studio/missions/drafts/${created.body.data.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 6" });
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "ok" })).status, 200);
  const published = await call(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(published.status, 201, JSON.stringify(published.body));
  return published.body.data.release.releaseId as string;
}

const ORGS = [ORG, OTHER_ORG];
const SCOPED_TABLES = ["mission_teams", "mission_team_participants", "mission_team_events", "mission_runtime_sessions", "mission_director_decisions", "mission_definition_drafts",
  "mission_review_submissions", "mission_published_releases", "mission_publication_events", "arcade_runtime_sessions", "arcade_results", "arcade_attempts", "integration_outbox",
  "curriculum_lesson_arcade_activities", "curriculum_lessons", "curriculum_units", "curriculum_courses", "authorized_accommodations", "users", "organizations"];

async function residueCounts() {
  return Object.fromEntries(await Promise.all(SCOPED_TABLES.map(async (table) =>
    [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count)])));
}

async function institutionalCounts() {
  const tables = ["prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "learner_credentials", "curriculum_learner_mastery", "career_events", "memberships"];
  return Object.fromEntries(await Promise.all(tables.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)])));
}

const DISABLED_TRIGGERS: Array<[string, string]> = [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
  ["mission_review_submissions", "mission_review_submission_snapshot_immutable"], ["mission_director_decisions", "mission_director_decisions_append_only"]];

async function cleanup() {
  await withTransaction(async (tx) => {
    for (const [table, trigger] of DISABLED_TRIGGERS) await tx.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    for (const table of ["mission_director_decisions", "mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_runtime_sessions",
      "mission_definition_drafts", "arcade_runtime_sessions", "arcade_results", "arcade_attempts", "integration_outbox", "curriculum_lesson_arcade_activities", "curriculum_lessons",
      "curriculum_units", "curriculum_courses", "authorized_accommodations"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS]);
    }
    await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE]);
    await tx.query("DELETE FROM careers WHERE career_id=$1", [CAREER]);
    await tx.query("DELETE FROM career_families WHERE career_family_id=$1", [FAMILY]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, LEARNER, TEAMMATE, OUTSIDER, ADMIN]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [ORGS]);
    for (const [table, trigger] of DISABLED_TRIGGERS) await tx.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
  });
}

let institutionalBaseline: Record<string, number> = {};
let careerBaseline: any = null;
let lessonBaseline: any = null;

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`, [ORG, RUN, OTHER_ORG, `${RUN} Other`]);
  for (const userId of [AUTHOR, REVIEWER, PUBLISHER, LEARNER, TEAMMATE, ADMIN, OUTSIDER]) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`,
      [userId, userId === OUTSIDER ? OTHER_ORG : ORG, `${userId}@test.invalid`, `Fabric ${userId.split("_")[0]}`]);
  }
  // Global Learning Arcade Activity with a deterministic SCORE_THRESHOLD rule (Arcade owns score and mastery).
  await query(`INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, max_score, pass_threshold_score, created_by_user_id)
    VALUES ($1,$2,'Power Response Practice','SCENARIO','SCORE_THRESHOLD',100,70,$3)`, [ARCADE, `${RUN.replaceAll("_", "-")}-power`, AUTHOR]);
  // Curriculum owns its hierarchy, its lesson content and the lesson ↔ activity link.
  await query(`INSERT INTO curriculum_courses (course_id, organization_id, stable_key, title, created_by_user_id, updated_by_user_id) VALUES ($1,$2,$3,'Data Center Operations',$4,$4)`, [`${RUN}:course`, ORG, `${RUN}-course`, AUTHOR]);
  await query(`INSERT INTO curriculum_units (unit_id, organization_id, course_id, stable_key, title, sequence) VALUES ($1,$2,$3,$4,'Power Systems',1)`, [`${RUN}:unit`, ORG, `${RUN}:course`, `${RUN}-unit`]);
  await query(`INSERT INTO curriculum_lessons (lesson_id, organization_id, unit_id, stable_key, title, sequence, content) VALUES ($1,$2,$3,$4,'Responding to power events',1,$5::jsonb)`,
    [LESSON, ORG, `${RUN}:unit`, `${RUN}-lesson`, JSON.stringify({ body: LESSON_BODY })]);
  await new CurriculumCatalogRepo().createLessonArcadeLink({ id: `${RUN}:link`, organizationId: ORG, curriculumLessonId: LESSON, arcadeActivityId: ARCADE, sequence: 1, sourceReference: null });
  // Career registry owns careers (global reference data).
  await query("INSERT INTO career_families (career_family_id, slug, name) VALUES ($1,$2,'Digital Infrastructure')", [FAMILY, `${RUN.replaceAll("_", "-")}-family`]);
  await query("INSERT INTO careers (career_id, slug, title, description, career_family_id) VALUES ($1,$2,'Data Center Technician','Career registry description.',$3)", [CAREER, `${RUN.replaceAll("_", "-")}-career`, FAMILY]);
  // A sensitive institutional grant that the Fabric must never project.
  await query(`INSERT INTO authorized_accommodations (accommodation_id, organization_id, user_id, accommodation_type, value, status, effective_at, granted_by_user_id)
    VALUES ($1,$2,$3,'EXTENDED_ASSESSMENT_TIME',$4::jsonb,'ACTIVE','2026-01-01T00:00:00Z',$5)`, [`acc_${RUN}`, ORG, LEARNER, JSON.stringify({ diagnosis: PRIVATE_DIAGNOSIS, multiplier: 1.5 }), ADMIN]);

  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  registerArcadeIntegrationRoutes(app, { integrationService: fabric });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  state.teamRelease = await publish(teamDefinition(missions.team));
  state.soloRelease = await publish(soloDefinition(missions.solo));
  await publish(soloDefinition(missions.unlinked));
  // A Mission with no Arcade link at all: Mission Content allows it, and it is not an Arcade runtime.
  const noActivity = soloDefinition(missions.noActivity);
  delete (noActivity as any).arcadeActivityId;
  await publish(noActivity);
  institutionalBaseline = await institutionalCounts();
  careerBaseline = (await query("SELECT * FROM careers WHERE career_id=$1", [CAREER])).rows[0];
  lessonBaseline = (await query("SELECT * FROM curriculum_lessons WHERE lesson_id=$1", [LESSON])).rows[0];
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // 30 — cleanup leaves no residue, and append-only/immutability triggers are enabled again.
  for (const [table, count] of Object.entries(await residueCounts())) assert.equal(count, 0, `${table} residue`);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM arcade_activities WHERE arcade_activity_id=$1", [ARCADE])).rows[0].count), 0);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM careers WHERE career_id=$1", [CAREER])).rows[0].count), 0);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM career_families WHERE career_family_id=$1", [FAMILY])).rows[0].count), 0);
  const triggers = (await query("SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])", [DISABLED_TRIGGERS.map(([, trigger]) => trigger)])).rows;
  assert.equal(triggers.length, 4);
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", trigger.tgname);
});

function fabricSources(dir = "../src/domain/arcade-integration/"): Array<[string, string]> {
  const root = new URL(dir, import.meta.url);
  return readdirSync(root).flatMap((name) => {
    const path = new URL(name, root);
    if (statSync(path).isDirectory()) return fabricSources(`${dir}${name}/`);
    return /\.(ts|js)$/.test(name) ? [[`${dir}${name}`, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

// ---------------------------------------------------------------- resolution and product separation

test("contract: reference descriptors validate on the extended canonical descriptor; the Fabric vocabulary is stable", () => {
  assert.deepEqual(catalog.rejected, []);
  for (const item of REFERENCE_DESCRIPTORS) assert.deepEqual(validateArcadeExperience(item), { valid: true, errors: [] }, item.id);
  assert.equal(catalog.descriptors.length, 12 + 1 + 3, "legacy catalog, the Phase 7 canonical Data Center descriptor, plus three reference descriptors");
  assert.deepEqual([...ARCADE_INTEGRATION_CAPABILITIES].sort(), ["ACHIEVEMENTS", "CAREER_LINK", "CREATOR_AUTHORED", "CURRICULUM_LINK", "EVIDENCE_CANDIDATE", "LEADERBOARD", "METAVERSE_CONTEXT", "MISSION_LAUNCH", "MULTIPLAYER", "REPLAY"]);
  assert.deepEqual(Object.keys(ARCADE_INTEGRATION_ERRORS).sort(), ["ACTIVITY_NOT_FOUND", "ACTIVITY_NOT_LAUNCHABLE", "CAPABILITY_NOT_SUPPORTED", "DEPENDENCY_UNAVAILABLE", "EVIDENCE_NOT_ADDRESSABLE",
    "LAUNCH_INVALID", "MISSION_NOT_PUBLISHED", "MISSION_VERSION_MISMATCH", "MULTIPLAYER_NOT_ALLOWED", "RUNTIME_NOT_FOUND", "TENANT_SCOPE_MISMATCH"]);
  // Invalid Phase 6 extensions are rejected by the shared validator, not silently accepted.
  assert.equal(validateArcadeExperience(descriptor("x.bad.1", "classic", (value) => { value.capabilities.missionLaunch = true; })).valid, false, "Classic cannot launch Missions");
  assert.equal(validateArcadeExperience(descriptor("x.bad.2", "learning", (value) => { value.provenance.source = "PUBLISHER"; })).valid, false);
  assert.equal(validateArcadeExperience(descriptor("x.bad.3", "learning", (value) => { value.accessibility.supports = { diagnosis: true }; })).valid, false);
  assert.equal(validateArcadeExperience(descriptor("x.bad.4", "learning", (value) => { value.relationships.mission = { relationshipType: "reference", missionReferences: [{ missionId: "m", missionVersion: 0 }] }; })).valid, false);
});

test("1 Learning activity resolves with read-only curriculum, mission, career, metaverse and accessibility projections", async () => {
  const resolved = await call(experiencePath(EXPERIENCE.learning), LEARNER);
  assert.equal(resolved.status, 200, JSON.stringify(resolved.body));
  const data = resolved.body.data;
  assert.deepEqual([data.productType, data.arcadeActivityId, data.lifecycle.launchable], ["learning", ARCADE, true]);
  assert.deepEqual([...data.capabilities].sort(), ["ACHIEVEMENTS", "CAREER_LINK", "CREATOR_AUTHORED", "CURRICULUM_LINK", "EVIDENCE_CANDIDATE", "LEADERBOARD", "METAVERSE_CONTEXT", "MISSION_LAUNCH", "MULTIPLAYER", "REPLAY"]);
  assert.deepEqual(data.curriculum, { authority: "curriculum", status: "AVAILABLE", lessons: [{ lessonId: LESSON, lessonTitle: "Responding to power events", unitId: `${RUN}:unit`, courseId: `${RUN}:course` }] });
  assert.deepEqual(data.missions.references, [
    { missionId: missions.team, missionVersion: 1, published: true }, { missionId: missions.solo, missionVersion: 1, published: true },
    { missionId: missions.unpublished, missionVersion: 1, published: false },
  ]);
  assert.deepEqual(data.metaverse.experienceReferences, ["world.data-center.reference"]);
  assert.deepEqual(data.accessibility.supports, { keyboardSupported: true, reducedMotionSupported: true, captionsSupported: false });
  // Identity minimization: resolution is learner-agnostic.
  assert.doesNotMatch(JSON.stringify(data), new RegExp(`${LEARNER}|user_id|userId`));
  const capabilities = await call(experiencePath(EXPERIENCE.learning, "/capabilities"), LEARNER);
  assert.deepEqual(capabilities.body.data.capabilities, data.capabilities);
  assert.deepEqual((await call(experiencePath("experience.missing.nowhere"), LEARNER)).body.error.code, "ACTIVITY_NOT_FOUND");
});

test("2 Classic resolves with distinct semantics: no curriculum, missions, evidence or activity binding", async () => {
  const data = (await call(experiencePath(EXPERIENCE.classic), LEARNER)).body.data;
  assert.deepEqual([data.productType, data.arcadeActivityId], ["classic", null]);
  assert.deepEqual([...data.capabilities].sort(), ["ACHIEVEMENTS", "CREATOR_AUTHORED", "LEADERBOARD"]);
  assert.deepEqual([data.curriculum.status, data.curriculum.lessons, data.missions.references], ["NOT_APPLICABLE", [], []]);
  // Classic never derives evidence/curriculum/mission capabilities even if a descriptor tried to bind an activity.
  const forced = descriptor("x.classic.forced", "classic", (value) => { value.activityReference.arcadeActivityId = ARCADE; value.capabilities.evidenceResultCapable = true; });
  assert.deepEqual(deriveArcadeCapabilities(forced).filter((item) => ["EVIDENCE_CANDIDATE", "CURRICULUM_LINK", "MISSION_LAUNCH"].includes(item)), []);
  // Legacy catalog entries stay preview-only and are not launchable through the Fabric.
  const legacy = catalog.descriptors.find((item: any) => item.provenance.classification === "legacy_adapter" && item.product.family === "classic");
  const blocked = await call(experiencePath(legacy.id, "/launch"), LEARNER, "POST", { idempotencyKey: `${RUN}:legacy` });
  assert.deepEqual([blocked.status, blocked.body.error.code], [409, "ACTIVITY_NOT_LAUNCHABLE"]);
});

// ---------------------------------------------------------------- Learning reference flow

test("3/5 Learning activity links to a published Mission and launches only through the canonical start, exact version", async () => {
  const mismatch = await call(experiencePath(EXPERIENCE.learning, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.team, missionVersion: 2, idempotencyKey: `${RUN}:v2` });
  assert.deepEqual([mismatch.status, mismatch.body.error.code], [409, "MISSION_VERSION_MISMATCH"]);
  const unlinked = await call(experiencePath(EXPERIENCE.learning, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.unlinked, missionVersion: 1, idempotencyKey: `${RUN}:unlinked` });
  assert.deepEqual([unlinked.status, unlinked.body.error.code], [409, "CAPABILITY_NOT_SUPPORTED"], "published but not linked to this experience");
  const unpublished = await call(experiencePath(EXPERIENCE.learning, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.unpublished, missionVersion: 1, idempotencyKey: `${RUN}:unpub` });
  assert.deepEqual([unpublished.status, unpublished.body.error.code], [404, "MISSION_NOT_PUBLISHED"]);
  assert.equal((await call(experiencePath(EXPERIENCE.learning, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.team, missionVersion: 1 })).body.error.code, "LAUNCH_INVALID");

  const launched = await call(experiencePath(EXPERIENCE.learning, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:team` });
  assert.equal(launched.status, 201, JSON.stringify(launched.body));
  const ref = launched.body.data.runtimeRef;
  assert.deepEqual(Object.keys(ref).sort(), ["arcadeActivityId", "experienceId", "productType", "runtimeId", "runtimeKind", "status"]);
  assert.deepEqual([ref.runtimeKind, ref.experienceId, ref.arcadeActivityId, ref.productType, ref.status], ["MISSION_RUNTIME", EXPERIENCE.learning, ARCADE, "learning", "ACTIVE"]);
  state.teamRuntimeId = ref.runtimeId;
  // The runtime is the canonical one: exact published snapshot, owner-scoped, idempotent through the start authority.
  const session = await runtimeService.get(actorOf(LEARNER), ref.runtimeId);
  assert.deepEqual([session.missionId, session.missionVersion, session.userId, session.definitionSnapshot.arcadeActivityId], [missions.team, 1, LEARNER, ARCADE]);
  const reused = await startService.startPublishedMission(actorOf(LEARNER), { missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:team` });
  assert.deepEqual([reused.reused, reused.session.id], [true, ref.runtimeId], "Fabric launch and direct canonical start are the same idempotent operation");
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, missions.team])).rows[0].count), 1);
  const described = await call(`/arcade/integration/runtimes/MISSION_RUNTIME/${ref.runtimeId}`, LEARNER);
  assert.deepEqual(described.body.data, ref);
});

test("6/11 multiplayer runs through Phase 5 team services; MOL world context comes from the existing contract", async () => {
  const runtimeId = state.teamRuntimeId;
  await teamService.createTeam(actorOf(LEARNER), runtimeId, { missionRole: "OPERATOR" });
  await teamService.join(actorOf(TEAMMATE), runtimeId, { missionRole: "TECHNICIAN" });
  await teamService.setReady(actorOf(LEARNER), runtimeId, { ready: true });
  await teamService.setReady(actorOf(TEAMMATE), runtimeId, { ready: true });
  await teamService.activate(actorOf(LEARNER), runtimeId);
  const events = await runtimeService.listEvents(actorOf(LEARNER), runtimeId);
  assert.equal(events[0].eventType, "MISSION_WORLD_CONTEXT_CAPTURED", "world context is captured by Mission Runtime through MOL, not by the Fabric");
  const world = await runtimeService.getWorldContext(actorOf(LEARNER), runtimeId);
  assert.ok(world, "existing MOL world-context contract resolves for the Fabric-launched runtime");
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_teams WHERE mission_runtime_id=$1", [runtimeId])).rows[0].count), 1, "team tables are Phase 5's own");
  assert.deepEqual((await fabric.operationalProjection(actorOf(LEARNER))).teams, { status: "AVAILABLE", forming: 0, active: 1 }, "MOCC observes the live team");
});

test("23 Director-emitted events are never learner evidence or individual actions", async () => {
  const runtimeId = state.teamRuntimeId;
  const session = await runtimeService.get(actorOf(LEARNER), runtimeId);
  await runtimeService.applyDirectorAction(actorOf(LEARNER), runtimeId, session.revision, { type: "EMIT_DECLARED_EVENT", eventType: "system-inspected", payload: {} } as any, {
    idempotencyKey: `${RUN}:director-forced`, capability: "missionDirector", proposal: {}, executorKind: "FIXTURE", providerExecutionRef: null, policyVersion: "test", contextDigest: "0".repeat(64),
  });
  const result = await fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", runtimeId);
  assert.deepEqual(result.individualActions, [], "the Director event is not attributed to any participant");
  assert.equal(result.completion.completed, false, "Director events cannot complete role-attributed objectives");
  // Policy-gated Director emission is rejected outright for undeclared events.
  const current = await runtimeService.get(actorOf(LEARNER), runtimeId);
  const emitted = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({ action: { type: "EMIT_DECLARED_EVENT", eventType: "response-performed" } }))
    .direct(actorOf(LEARNER), runtimeId, { expectedRevision: current.revision, idempotencyKey: `${RUN}:director-emit` });
  assert.ok(emitted.rejectionReason, "Director cannot satisfy a learner role objective");
});

test("7/10/26 team result is TEAM PERFORMANCE with attributed individual actions; no score is invented; candidate is non-verified", async () => {
  const runtimeId = state.teamRuntimeId;
  let session = await runtimeService.get(actorOf(LEARNER), runtimeId);
  await teamService.submitAction(actorOf(LEARNER), runtimeId, { expectedRevision: session.revision, eventType: "system-inspected", idempotencyKey: `${RUN}:inspect` });
  session = await runtimeService.get(actorOf(LEARNER), runtimeId);
  await teamService.submitAction(actorOf(TEAMMATE), runtimeId, { expectedRevision: session.revision, eventType: "response-performed", idempotencyKey: `${RUN}:respond` });
  session = await runtimeService.get(actorOf(LEARNER), runtimeId);
  assert.equal(session.status, "SUCCEEDED", "completion comes from the canonical condition engine");
  const result = (await call(`/arcade/integration/results/MISSION_RUNTIME/${runtimeId}`, LEARNER)).body.data;
  assert.deepEqual(result.completion, { status: "SUCCEEDED", completed: true, terminal: true });
  assert.deepEqual(result.score, { value: null, authoritative: false, reason: "MISSION_HAS_NO_SCORE" });
  assert.deepEqual(result.teamPerformance, { teamStatus: "COMPLETED", teamSize: 2, rolesPresent: ["OPERATOR", "TECHNICIAN"], scope: "TEAM_PERFORMANCE" });
  assert.deepEqual(result.individualActions.map((item: any) => [item.missionRole, item.actionCount]).sort(), [["OPERATOR", 1], ["TECHNICIAN", 1]]);
  assert.deepEqual(result.learningEvidenceCandidate, { eligible: true, isVerifiedEvidence: false, addressableByEvidenceAuthority: false, individualEvidenceInferred: false, authority: "verified-evidence" });
  // The projection reads the existing candidate contract; it does not reinterpret it.
  const candidate = describeMissionEvidenceCandidate(session, await runtimeService.listEvents(actorOf(LEARNER), runtimeId));
  assert.deepEqual(result.individualActions, candidate.provenance.team!.individualDemonstration);
  assert.equal(result.leaderboard.eligible, false);
  assert.equal(result.leaderboard.reason, "NO_AUTHORITATIVE_SCORE");
  state.missionResult = result;
});

// ---------------------------------------------------------------- Mission Runtime classification

const notArcade = (error: any) => error?.code === "RUNTIME_NOT_FOUND" && error?.statusCode === 404;

test("M1/M6 a canonically linked Learning Mission Runtime resolves; its result keeps the bounded, non-verified candidate", async () => {
  const ref = await fabric.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId);
  assert.deepEqual([ref.experienceId, ref.productType, ref.arcadeActivityId], [EXPERIENCE.learning, "learning", ARCADE]);
  const result = await fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId);
  assert.deepEqual(result.learningEvidenceCandidate, { eligible: true, isVerifiedEvidence: false, addressableByEvidenceAuthority: false, individualEvidenceInferred: false, authority: "verified-evidence" });
  assert.equal(result.teamPerformance!.scope, "TEAM_PERFORMANCE");
});

test("M2 a Mission Runtime with no arcadeActivityId is not addressable through Arcade Integration", async () => {
  const started = await startService.startPublishedMission(actorOf(LEARNER), { missionId: missions.noActivity, missionVersion: 1, idempotencyKey: `${RUN}:no-activity` });
  assert.equal((await runtimeService.get(actorOf(LEARNER), started.session.id)).definitionSnapshot.arcadeActivityId, undefined);
  await assert.rejects(fabric.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", started.session.id), notArcade);
  await assert.rejects(fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", started.session.id), notArcade);
  const http = await call(`/arcade/integration/results/MISSION_RUNTIME/${started.session.id}`, LEARNER);
  assert.deepEqual([http.status, http.body.error.code], [404, "RUNTIME_NOT_FOUND"]);
  assert.doesNotMatch(JSON.stringify(http.body), /learningEvidenceCandidate|"learning"/);
  // The Mission authority itself is unchanged: the runtime is still the learner's, through Mission Runtime.
  assert.equal((await runtimeService.get(actorOf(LEARNER), started.session.id)).status, "ACTIVE");
  // A descriptor cannot make the Fabric launch it: the frozen definition does not reference the activity.
  const claims = descriptor(`experience.claims.${RUN}`, "learning", (value) => {
    value.activityReference.arcadeActivityId = ARCADE;
    value.capabilities.missionLaunch = true;
    value.relationships.mission = { relationshipType: "reference", missionReferences: [{ missionId: missions.noActivity, missionVersion: 1 }] };
  });
  const claiming = new ArcadeIntegrationService({ experiences: () => [claims], missions: resolver, missionRuntime: runtimeService, missionStart: startService });
  const before = Number((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, missions.noActivity])).rows[0].count);
  await assert.rejects(claiming.launch(actorOf(LEARNER), claims.id, { mode: "MISSION", missionId: missions.noActivity, missionVersion: 1, idempotencyKey: `${RUN}:claims` }),
    (error: any) => error.code === "MISSION_NOT_PUBLISHED");
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, missions.noActivity])).rows[0].count), before, "no unclassifiable runtime was created");
});

test("M3 a Mission Runtime whose arcadeActivityId has no matching canonical descriptor link is rejected", async () => {
  // Same activity, but no descriptor declares this Mission.
  const unlinked = await startService.startPublishedMission(actorOf(LEARNER), { missionId: missions.unlinked, missionVersion: 1, idempotencyKey: `${RUN}:unlinked-direct` });
  assert.equal((await runtimeService.get(actorOf(LEARNER), unlinked.session.id)).definitionSnapshot.arcadeActivityId, ARCADE);
  await assert.rejects(fabric.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", unlinked.session.id), notArcade);
  // No descriptor for the activity at all (legacy catalog only).
  const legacyOnly = new ArcadeIntegrationService({ experiences: () => canonicalArcadeExperiences().descriptors, missionRuntime: runtimeService });
  await assert.rejects(legacyOnly.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId), notArcade);
  await assert.rejects(legacyOnly.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId), notArcade);
  // Two descriptors claiming the same Mission version: ambiguity is rejected, not guessed.
  const twin = { ...structuredClone(learningDescriptor), id: `experience.twin.${RUN}`, slug: `twin-${RUN.replaceAll("_", "-")}` };
  const ambiguous = new ArcadeIntegrationService({ experiences: () => [learningDescriptor, twin], missions: resolver, missionRuntime: runtimeService, missionStart: startService });
  await assert.rejects(ambiguous.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId), notArcade);
  await assert.rejects(ambiguous.launch(actorOf(LEARNER), EXPERIENCE.learning, { mode: "MISSION", missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:twin` }),
    (error: any) => error.code === "CAPABILITY_NOT_SUPPORTED");
});

test("M4/M5 a Mission Runtime is never projected through a Classic descriptor or silently labeled learning", async () => {
  // A Classic descriptor that (bypassing the shared validator) claims the activity and the Mission.
  const classicClaim = descriptor(`experience.classic-claim.${RUN}`, "classic", (value) => {
    value.activityReference.arcadeActivityId = ARCADE;
    value.capabilities.missionLaunch = true;
    value.relationships.mission = { relationshipType: "reference", missionReferences: [{ missionId: missions.team, missionVersion: 1 }] };
  });
  assert.equal(validateArcadeExperience(classicClaim).valid, false, "the shared validator already refuses it");
  const classicOnly = new ArcadeIntegrationService({ experiences: () => [classicClaim], missionRuntime: runtimeService });
  await assert.rejects(classicOnly.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId), notArcade);
  await assert.rejects(classicOnly.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId), notArcade);
  // Every Mission Runtime the learner owns is either canonically linked or rejected; none is labeled by default.
  const owned = (await query("SELECT mission_runtime_id FROM mission_runtime_sessions WHERE organization_id=$1 AND user_id=$2", [ORG, LEARNER])).rows.map((row: any) => row.mission_runtime_id);
  assert.ok(owned.length >= 3);
  for (const runtimeId of owned) {
    const session = await runtimeService.get(actorOf(LEARNER), runtimeId);
    const linked = [missions.team, missions.solo].includes(session.missionId);
    try {
      const ref = await fabric.describeRuntime(actorOf(LEARNER), "MISSION_RUNTIME", runtimeId);
      assert.ok(linked, `${session.missionId} must not be projected`);
      assert.deepEqual([ref.productType, ref.experienceId], ["learning", EXPERIENCE.learning]);
    } catch (error) {
      assert.ok(!linked && notArcade(error), `${session.missionId}: ${(error as any)?.code}`);
    }
  }
});

test("12/13 Fabric owns no event bus, no map registry, no tables and no writes", () => {
  for (const [file, source] of fabricSources()) {
    assert.doesNotMatch(source, /\b(INSERT INTO|DELETE FROM|CREATE TABLE)\b|\bUPDATE\s+[a-z_]+\s+SET\b/, `${file} writes SQL`);
    assert.doesNotMatch(source, /EventEmitter|createEventBus|\.subscribe\(|\.publish\(|outbox/i, `${file} defines a bus`);
    assert.doesNotMatch(source, /registerMap|mapRegistry|zoneRegistry|createMolWorldContextProvider|system\/metaverse\/mol/i, `${file} defines a map registry or bypasses Mission Runtime → MOL`);
    for (const [, specifier] of source.matchAll(/from\s+"([^"]+)"/g)) {
      assert.doesNotMatch(specifier, /verified-evidence|prepare-prove|truth|credential|treasury|reward|membership|publication|mission-draft|agent-fabric/i, `${file} imports ${specifier}`);
    }
  }
  assert.equal(ARCADE_INTEGRATION_TELEMETRY_SOURCES.notEvidence && ARCADE_INTEGRATION_TELEMETRY_SOURCES.notTruth && ARCADE_INTEGRATION_TELEMETRY_SOURCES.notBilling, true);
  const migrations = readdirSync(new URL("../migrations/", import.meta.url)).filter((name) => /^\d+_/.test(name)).sort();
  assert.match(migrations.at(-1)!, /^156_/, "Phase 6 adds no migration");
});

test("8/9 Curriculum and Career are read-only; projections copy no lesson content and claim no career eligibility", async () => {
  const data = (await fabric.resolve(actorOf(LEARNER), EXPERIENCE.learning)) as any;
  assert.doesNotMatch(JSON.stringify(data), new RegExp(LESSON_BODY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.deepEqual(data.career, {
    status: "AVAILABLE", authority: "career", eligibilityClaims: false,
    careers: [{ careerId: CAREER, slug: `${RUN.replaceAll("_", "-")}-career`, title: "Data Center Technician", status: "active", resolved: true }, { careerId: `missing_${RUN}`, resolved: false }],
  });
  assert.deepEqual((await query("SELECT * FROM careers WHERE career_id=$1", [CAREER])).rows[0], careerBaseline);
  assert.deepEqual((await query("SELECT * FROM curriculum_lessons WHERE lesson_id=$1", [LESSON])).rows[0], lessonBaseline);
});

// ---------------------------------------------------------------- Learning Arcade Result path

test("14/25 canonical Arcade Result: authoritative score, capability-driven leaderboard, stable replay reference", async () => {
  const attempt = await startAttempt(actorOf(LEARNER), ARCADE);
  const arcadeResult = await submitResult(actorOf(LEARNER), attempt.id, { score: 85 });
  state.resultId = arcadeResult.id;
  const first = (await call(`/arcade/integration/results/ARCADE_RESULT/${arcadeResult.id}`, LEARNER)).body.data;
  assert.deepEqual(first.score, { value: 85, maxScore: 100, authoritative: true, reason: null });
  assert.equal(first.masteryAchieved, true);
  assert.deepEqual(first.leaderboard, { eligible: true, reason: null });
  assert.deepEqual(first.learningEvidenceCandidate, { eligible: true, isVerifiedEvidence: false, addressableByEvidenceAuthority: true, possibleSourceType: "ARCADE_RESULT", authority: "verified-evidence" });
  // Leaderboard eligibility is capability-driven: the same Result under a descriptor without LEADERBOARD is not eligible.
  const noBoard = descriptor(`experience.noboard.${RUN}`, "learning", (value) => { value.activityReference.arcadeActivityId = ARCADE; });
  const plain = new ArcadeIntegrationService({ experiences: () => [noBoard] });
  assert.deepEqual((await plain.describeResult(actorOf(LEARNER), "ARCADE_RESULT", arcadeResult.id)).leaderboard, { eligible: false, reason: "CAPABILITY_NOT_DECLARED" });
  // Replay reference is stable and resolves through the existing replay authority.
  const second = (await call(`/arcade/integration/results/ARCADE_RESULT/${arcadeResult.id}`, LEARNER)).body.data;
  assert.deepEqual(second.replayRef, first.replayRef);
  assert.deepEqual(first.replayRef, { kind: "ARCADE_RESULT_REPLAY", resultId: arcadeResult.id });
  assert.ok(await getResultReplay(actorOf(LEARNER), first.replayRef.resultId));
  const missionReplayA = (await fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId)).replayRef;
  const missionReplayB = (await fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", state.teamRuntimeId)).replayRef;
  assert.deepEqual(missionReplayA, missionReplayB);
  assert.equal(missionReplayA!.kind, "MISSION_RUNTIME_EVENT_LOG");
});

test("15 achievement eligibility is Arcade-native and never a credential", async () => {
  const result = state.missionResult;
  assert.deepEqual(result.achievement, { eligible: true, reason: null, ownedBy: "arcade", storeAvailable: false, credential: false });
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM learner_credentials WHERE organization_id=$1", [ORG])).rows[0].count), institutionalBaseline.learner_credentials);
});

// ---------------------------------------------------------------- Classic reference flow

test("4/27 Classic flow: runtime → result projection → eligibility; Classic never becomes Evidence or mastery", async () => {
  const launched = await call(experiencePath(EXPERIENCE.classic, "/launch"), LEARNER, "POST", { idempotencyKey: `${RUN}:classic` });
  assert.equal(launched.status, 201, JSON.stringify(launched.body));
  const ref = launched.body.data.runtimeRef;
  assert.deepEqual([ref.runtimeKind, ref.productType, ref.arcadeActivityId, ref.status], ["ARCADE_RUNTIME", "classic", null, "ACTIVE"]);
  const mission = await call(experiencePath(EXPERIENCE.classic, "/launch"), LEARNER, "POST", { mode: "MISSION", missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:classic-mission` });
  assert.deepEqual([mission.status, mission.body.error.code], [409, "CAPABILITY_NOT_SUPPORTED"]);
  // Arcade Runtime itself refuses to bind a Classic session to a Learning activity.
  await assert.rejects(arcadeRuntime.start(actorOf(LEARNER) as any, { family: "classic", experienceId: EXPERIENCE.classic, activityId: ARCADE, sessionType: "game", idempotencyKey: `${RUN}:classic-bind` }),
    (error: any) => error.code === "CLASSIC_ACTIVITY_BINDING_INVALID");
  await arcadeRuntime.transition(actorOf(LEARNER) as any, ref.runtimeId, "COMPLETE");
  const result = (await call(`/arcade/integration/results/ARCADE_RUNTIME/${ref.runtimeId}`, LEARNER)).body.data;
  assert.deepEqual(result.completion, { status: "COMPLETED", completed: true, terminal: true });
  assert.deepEqual(result.score, { value: null, authoritative: false, reason: "SESSION_HAS_NO_SCORE" }, "26: no score is invented for a session");
  assert.deepEqual(result.learningEvidenceCandidate, { eligible: false, reason: "CLASSIC_ARCADE_IS_NOT_LEARNING_EVIDENCE", isVerifiedEvidence: false });
  assert.equal(result.leaderboard.eligible, false);
  assert.deepEqual(result.achievement, { eligible: true, reason: null, ownedBy: "arcade", storeAvailable: false, credential: false });
  assert.equal(result.masteryAchieved, undefined, "Classic carries no mastery claim");
  assert.equal(result.teamPerformance, null);
  assert.deepEqual(await institutionalCounts(), { ...institutionalBaseline }, "no Evidence, Truth, credential, mastery or career rows were created");
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM arcade_results WHERE organization_id=$1", [ORG])).rows[0].count), 1, "only the Learning attempt produced an Arcade Result");
});

// ---------------------------------------------------------------- compatibility

test("19/20 descriptors without capabilities stay backward compatible; single-player Missions are unchanged", async () => {
  const bare = (await call(experiencePath(EXPERIENCE.bare), LEARNER)).body.data;
  assert.deepEqual([bare.capabilities, bare.provenance.source, bare.accessibility.supports], [[], "SYSTEM", {}]);
  const session = await call(experiencePath(EXPERIENCE.bare, "/launch"), LEARNER, "POST", { mode: "ARCADE_SESSION", idempotencyKey: `${RUN}:bare` });
  assert.equal(session.status, 201, JSON.stringify(session.body));
  assert.deepEqual([session.body.data.runtimeRef.productType, session.body.data.runtimeRef.arcadeActivityId], ["learning", null]);
  for (const legacy of catalog.descriptors.filter((item: any) => item.provenance.classification === "legacy_adapter")) {
    assert.deepEqual(deriveArcadeCapabilities(legacy), [], legacy.id);
  }
  const solo = await fabric.launch(actorOf(LEARNER), EXPERIENCE.learning, { mode: "MISSION", missionId: missions.solo, missionVersion: 1, idempotencyKey: `${RUN}:solo` });
  const events = await runtimeService.listEvents(actorOf(LEARNER), solo.runtimeRef.runtimeId);
  const done = await runtimeService.appendEvent(actorOf(LEARNER), solo.runtimeRef.runtimeId, { expectedRevision: 1, sequence: events.length + 1, eventType: "objective-observed" });
  assert.equal(done.session.status, "SUCCEEDED", "single-player learner path is unchanged");
  const result = await fabric.describeResult(actorOf(LEARNER), "MISSION_RUNTIME", solo.runtimeRef.runtimeId);
  assert.deepEqual([result.teamPerformance, result.individualActions, result.learningEvidenceCandidate.eligible], [null, null, true]);
});

// ---------------------------------------------------------------- degraded handling and isolation

test("16/17 optional dependencies degrade explicitly; required dependencies block with a stable error", async () => {
  const broken = { getById: async () => { throw new Error("career registry down"); } };
  const brokenCurriculum = { listLessonLinksForArcadeActivity: async () => { throw new Error("curriculum down"); } };
  const brokenMissions = { listPublishedMissionsForArcadeActivity: async () => { throw new Error("catalog down"); } } as any;
  const degraded = new ArcadeIntegrationService({ experiences: () => catalog.descriptors, careers: broken, curriculum: brokenCurriculum, missions: brokenMissions, missionStart: startService, missionRuntime: runtimeService });
  const resolved: any = await degraded.resolve(actorOf(LEARNER), EXPERIENCE.learning);
  assert.deepEqual(resolved.career, { status: "UNAVAILABLE", careers: [], authority: "career", eligibilityClaims: false });
  assert.deepEqual([resolved.curriculum.status, resolved.curriculum.lessons], ["UNAVAILABLE", []]);
  assert.equal(resolved.missions.status, "UNAVAILABLE");
  assert.ok(resolved.missions.references.every((ref: any) => ref.published === null), "unknown is not reported as unpublished");
  const blockedStart = { startPublishedMission: async () => { throw new Error("mission store down"); } } as any;
  const required = new ArcadeIntegrationService({ experiences: () => catalog.descriptors, missionStart: blockedStart });
  await assert.rejects(required.launch(actorOf(LEARNER), EXPERIENCE.learning, { mode: "MISSION", missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:down` }),
    (error: any) => error.code === "DEPENDENCY_UNAVAILABLE" && error.statusCode === 503);
});

test("18 cross-organization access is rejected or empty; nothing leaks across tenants", async () => {
  const resolved = (await call(experiencePath(EXPERIENCE.learning), OUTSIDER)).body.data;
  assert.deepEqual(resolved.curriculum.lessons, []);
  assert.ok(resolved.missions.references.every((ref: any) => ref.published === false));
  const launch = await call(experiencePath(EXPERIENCE.learning, "/launch"), OUTSIDER, "POST", { mode: "MISSION", missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:outsider` });
  assert.deepEqual([launch.status, launch.body.error.code], [404, "MISSION_NOT_PUBLISHED"]);
  assert.deepEqual((await call(`/arcade/integration/runtimes/MISSION_RUNTIME/${state.teamRuntimeId}`, OUTSIDER)).status, 404);
  assert.deepEqual((await call(`/arcade/integration/results/MISSION_RUNTIME/${state.teamRuntimeId}`, OUTSIDER)).status, 404);
  assert.deepEqual((await call(`/arcade/integration/results/ARCADE_RESULT/${state.resultId}`, OUTSIDER)).status, 404);
  assert.deepEqual((await call(`/arcade/integration/results/ARCADE_RESULT/${state.resultId}`, TEAMMATE)).status, 404, "owner-scoped even inside the org");
  const operations = (await call("/arcade/integration/operations", OUTSIDER)).body.data;
  assert.deepEqual([operations.teams.forming, operations.teams.active], [0, 0]);
  assert.equal((await call(experiencePath(EXPERIENCE.learning), "nobody")).status >= 401, true, "unauthenticated callers are rejected");
});

test("24 accommodation data stays private; only declared experience support flags are projected", async () => {
  const outputs = [
    await fabric.resolve(actorOf(LEARNER), EXPERIENCE.learning), state.missionResult,
    await fabric.describeResult(actorOf(LEARNER), "ARCADE_RESULT", state.resultId), await fabric.operationalProjection(actorOf(LEARNER)),
  ];
  for (const output of outputs) assert.doesNotMatch(JSON.stringify(output), new RegExp(`${PRIVATE_DIAGNOSIS}|EXTENDED_ASSESSMENT_TIME|multiplier|accommodationId`));
});

test("28 creator provenance grants no publishing authority", async () => {
  const resolved: any = await fabric.resolve(actorOf(LEARNER), EXPERIENCE.learning);
  assert.deepEqual(resolved.provenance, { classification: "canonical_descriptor", source: "INSTRUCTOR", grantsPublishingAuthority: false });
  assert.equal(typeof (fabric as any).publish, "undefined");
  // Declaring a Mission reference does not publish it: the unpublished reference still cannot launch.
  assert.equal(resolved.missions.references.find((ref: any) => ref.missionId === missions.unpublished).published, false);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_published_releases WHERE organization_id=$1 AND mission_id=$2", [ORG, missions.unpublished])).rows[0].count), 0);
});

test("29 MOCC projection is read-only, aggregate and learner-agnostic", async () => {
  const projection = (await call("/arcade/integration/operations", LEARNER)).body.data;
  assert.equal(projection.readOnly, true);
  assert.deepEqual(projection.controls, []);
  assert.deepEqual(projection.experiences.byProduct, { learning: 4 + 1 + 2, classic: 8 + 1 }, "legacy + Phase 7 canonical + reference descriptors");
  assert.deepEqual(projection.teams, { status: "AVAILABLE", forming: 0, active: 0 }, "the completed team is no longer operational");
  assert.doesNotMatch(JSON.stringify(projection), new RegExp(`${LEARNER}|${TEAMMATE}|${state.teamRuntimeId}`));
  assert.equal((await call("/arcade/integration/operations", LEARNER, "POST", {})).status, 404, "no command surface");
});

test("10/21/22 institutional authorities are untouched: no Evidence, Truth, credential, mastery or career writes", async () => {
  assert.deepEqual(await institutionalCounts(), institutionalBaseline);
});
