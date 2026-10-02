// Phase 7 — Silicon Heartland Data Center Community & Workforce Initiative: reference acceptance.
// The Data Center reference implementation proves the shared workforce platform. It does not create a Data
// Center-specific software authority. Simulation completion does not establish credential attainment,
// employment eligibility, or verified mastery.
//
// Real canonical content is exercised end to end: the registered ProgramPackage, the canonical Learning descriptor,
// the canonical Arcade Activity (provisioned through the Arcade authority), the canonical Mission source (published
// through the real Studio review workflow), the seeded career and competency, MOL's registered systems, the existing
// report profile and the registered Data Center sensory profile. Only the owning organization is substituted with an
// isolated test organization so resolution can run without touching real organization data. Tests run in order.
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { CANONICAL_ARCADE_ACTIVITIES } from "../src/domain/arcade/catalog/canonical-arcade-activities.js";
import { provisionCanonicalArcadeActivity } from "../src/domain/arcade/service/arcade-service.js";
import { registerArcadeIntegrationRoutes } from "../src/domain/arcade-integration/api/routes.js";
import { canonicalArcadeExperiences, validateArcadeExperience } from "../src/domain/arcade-integration/arcade-experience-bridge.js";
import { ArcadeIntegrationService } from "../src/domain/arcade-integration/service/arcade-integration-service.js";
import { getMissionAccommodationProjection } from "../src/domain/accessibility-accommodations/service/mission-accommodation-projection.js";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { DATA_CENTER_COOLING_FAILURE_RESPONSE_V1 } from "../src/domain/mission-content/catalog/canonical-mission-sources.js";
import { PersistedPublishedMissionResolver } from "../src/domain/mission-content/catalog/published-mission-catalog.js";
import type { MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";
import { MissionTeamService } from "../src/domain/mission-team/service/mission-team-service.js";
import { validateProgramPackage, type ProgramPackage } from "../src/domain/workforce-foundation/model/workforce-foundation.js";
import { evaluateFundabilityGate, evaluateLifecycleTransition } from "../src/domain/workforce-foundation/model/readiness-and-fundability.js";
import { DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE, DATA_CENTER_FUNDABILITY_ASSESSMENT, DATA_CENTER_PROGRAM_ID } from "../src/domain/workforce-foundation/registry/programs/data-center-community-workforce.js";
import { WORKFORCE_PROGRAM_PACKAGES, buildWorkforceRegistry } from "../src/domain/workforce-foundation/registry/workforce-program-registry.js";
import { WorkforceFoundationService } from "../src/domain/workforce-foundation/service/workforce-foundation-service.js";
import * as sensory from "../../../src/shared/experience/sensory/index.js";

const RUN = `dc7_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const ADMIN = `admin_${RUN}`;
const FACILITY = `facility_${RUN}`;
const ELECTRICAL = `electrical_${RUN}`;
const COORDINATOR = `coordinator_${RUN}`;
const OUTSIDER = `outsider_${RUN}`;
const MISSION = DATA_CENTER_COOLING_FAILURE_RESPONSE_V1.missionId;
const BLOCKING_MISSION = `${MISSION}-dc-required-${RUN.replaceAll("_", "-")}`;
const ACTIVITY = CANONICAL_ARCADE_ACTIVITIES[0].id;
const EXPERIENCE = "experience.learning.data-center-cooling-incident";
const COURSE = `${RUN}:course-data-center`;
const COURSE_BODY = `Imported Data Center course description ${RUN}.`;
const PASS = (_req: any, _res: any, next: any) => next();

const profile = (userId: string, org: string, permissions: string[]) =>
  ({ user_id: userId, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, permissions, roles: [] });
const learner = ["arcade.attempt"];
const users: Record<string, any> = {
  [AUTHOR]: profile(AUTHOR, ORG, ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"]),
  [REVIEWER]: profile(REVIEWER, ORG, ["project.submission.review", "studio.review.queue.view"]),
  [PUBLISHER]: profile(PUBLISHER, ORG, ["curriculum.catalog.publish", "curriculum.catalog.retire"]),
  [ADMIN]: profile(ADMIN, ORG, ["arcade.activity.manage"]),
  [FACILITY]: profile(FACILITY, ORG, learner), [ELECTRICAL]: profile(ELECTRICAL, ORG, learner), [COORDINATOR]: profile(COORDINATOR, ORG, learner),
  [OUTSIDER]: profile(OUTSIDER, OTHER_ORG, learner),
};
const actorOf = (userId: string): MissionRuntimeActor & { roles: string[] } =>
  ({ user_id: userId, organization_id: users[userId].organization_id, permissions: users[userId].permissions, roles: [] });
const staff = { user_id: ADMIN, organization_id: ORG };

// The real registered package; only its owning organization is substituted for the isolated test organization.
const reowned = (org: string, change: (value: any) => void = () => {}): ProgramPackage => {
  const value: any = structuredClone(DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE);
  value.program.owningOrganizationId = org;
  change(value);
  return value;
};

let nowMs = Date.now();
const clock = () => new Date(nowMs);
const resolver = new PersistedPublishedMissionResolver();
const runtimeService = new MissionRuntimeService(undefined, clock, { accommodations: getMissionAccommodationProjection });
const startService = new MissionRuntimeStartService(resolver, runtimeService);
const teamService = new MissionTeamService(runtimeService, undefined, clock);
// The production Arcade catalog (legacy + the canonical Data Center descriptor); nothing injected.
const fabric = new ArcadeIntegrationService({ missions: resolver, missionRuntime: runtimeService, missionStart: startService });
const workforceFor = (packages: ProgramPackage[], fundingSources: any[] = []) =>
  new WorkforceFoundationService({ registry: () => buildWorkforceRegistry({ packages, fundingSources }), arcade: fabric });
const workforce = workforceFor([reowned(ORG)]);
const productionSensory = sensory.buildSensoryRegistry();

let server: Server;
let base = "";
const state: Record<string, any> = {};
let activityPreexisted = false;

async function call(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json().catch(() => null) };
}

async function publish(definition: MissionDefinition) {
  const created = await call("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const submitted = await call(`/studio/missions/drafts/${created.body.data.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 7 reference" });
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "Reviewed: simulation-only content." })).status, 200);
  const published = await call(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(published.status, 201, JSON.stringify(published.body));
}

const ORGS = [ORG, OTHER_ORG];
const SCOPED = ["mission_teams", "mission_team_participants", "mission_team_events", "mission_runtime_sessions", "mission_director_decisions", "mission_definition_drafts",
  "mission_review_submissions", "mission_published_releases", "mission_publication_events", "arcade_runtime_sessions", "arcade_results", "arcade_attempts", "integration_outbox",
  "curriculum_courses", "users", "organizations"];
const TRIGGERS: Array<[string, string]> = [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
  ["mission_review_submissions", "mission_review_submission_snapshot_immutable"], ["mission_director_decisions", "mission_director_decisions_append_only"]];

async function cleanup() {
  await withTransaction(async (tx) => {
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    for (const table of ["mission_director_decisions", "mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_runtime_sessions",
      "mission_definition_drafts", "arcade_runtime_sessions", "arcade_results", "arcade_attempts", "integration_outbox", "curriculum_courses"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS]);
    }
    // The canonical activity is global reference data: removed only if this run provisioned it.
    if (!activityPreexisted) await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1 AND created_by_user_id=$2", [ACTIVITY, ADMIN]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, ADMIN, FACILITY, ELECTRICAL, COORDINATOR, OUTSIDER]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [ORGS]);
    for (const [table, trigger] of TRIGGERS) await tx.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
  });
}

const INSTITUTIONAL = ["prepare_prove_evidence", "learner_competency_decisions", "learner_credentials", "curriculum_truth_facts", "truth_spine_records", "career_events", "memberships"];
async function institutionalCounts() {
  return Object.fromEntries(await Promise.all(INSTITUTIONAL.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count)])));
}
const GLOBAL = ["careers", "career_families", "competency_definitions", "credential_definitions", "funding_grants", "gpa_funding_references"];
async function globalCounts() {
  return Object.fromEntries(await Promise.all(GLOBAL.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table}`)).rows[0].count)])));
}
let institutionalBaseline: Record<string, number> = {};
let globalBaseline: Record<string, number> = {};

before(async () => {
  await cleanup();
  activityPreexisted = Boolean((await query("SELECT 1 FROM arcade_activities WHERE arcade_activity_id=$1", [ACTIVITY])).rows[0]);
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`, [ORG, RUN, OTHER_ORG, `${RUN} Other`]);
  for (const userId of Object.keys(users)) {
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`,
      [userId, users[userId].organization_id, `${userId}@test.invalid`, `Person ${userId.split("_")[0]}`]);
  }
  // Curriculum owns the imported course; the package references only its deterministic stable key "data-center".
  await new CurriculumCatalogRepo().createCourse({ courseId: COURSE, organizationId: ORG, stableKey: "data-center", title: "Data Center Pathway",
    shortDescription: null, fullDescription: COURSE_BODY, estimatedDurationMinutes: null, actorUserId: AUTHOR });
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  registerArcadeIntegrationRoutes(app, { integrationService: fabric });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  institutionalBaseline = await institutionalCounts();
  globalBaseline = await globalCounts();
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // 39 — zero residue; append-only/immutability triggers enabled; canonical seeds untouched.
  for (const table of SCOPED) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [ORGS])).rows[0].count), 0, `${table} residue`);
  }
  if (!activityPreexisted) assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM arcade_activities WHERE arcade_activity_id=$1", [ACTIVITY])).rows[0].count), 0);
  const triggers = (await query("SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])", [TRIGGERS.map(([, name]) => name)])).rows;
  assert.equal(triggers.length, 4);
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", trigger.tgname);
  assert.deepEqual(await globalCounts(), globalBaseline, "seeded career, competency, credential and funding records are unchanged");
});

// ---------------------------------------------------------------- program package

test("1/2 the real Data Center ProgramPackage validates and its lifecycle is honest", async () => {
  const registry = buildWorkforceRegistry();
  assert.deepEqual(registry.rejected, []);
  assert.deepEqual(validateProgramPackage(DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE), []);
  assert.deepEqual(WORKFORCE_PROGRAM_PACKAGES.map((pkg) => pkg.program.programId), [DATA_CENTER_PROGRAM_ID]);
  assert.equal(DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE.program.owningOrganizationId, "org_shf_001", "owned by the seeded Silicon Heartland Foundation");
  assert.equal(DATA_CENTER_COMMUNITY_WORKFORCE_PACKAGE.program.lifecycle, "INTEGRATION_READINESS");
  const readiness = await workforce.describeProgramReadiness(staff, DATA_CENTER_PROGRAM_ID);
  assert.equal(readiness.status, "BLOCKED");
  assert.deepEqual([...readiness.gaps].sort(), ["ARCADE", "EXTERNAL_CREDENTIAL_AUTHORITY", "FUNDING_LANES", "MISSIONS", "PARTNERS"], "before provisioning, Arcade and Missions are honest gaps too");
  assert.deepEqual([...readiness.blockingDependencies].sort(), ["dep.client-mission-player", "dep.employer-validation"]);
  for (const target of ["PARTNER_VALIDATION"] as const) assert.equal((await workforce.evaluateLifecycle(staff, DATA_CENTER_PROGRAM_ID, target)).allowed, false);
  assert.deepEqual(evaluateLifecycleTransition("PARTNER_VALIDATION", "PILOT_READY", readiness).reasons, ["INTEGRATION_READINESS_GAPS", "REQUIRED_DEPENDENCIES_BLOCKING"]);
});

test("3/4/5 curriculum and career references resolve to canonical records without copying them; unknown careers degrade", async () => {
  const resolved = await workforce.resolveProgram(staff, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual(resolved.curriculum, { status: "AVAILABLE", items: [{ courseStableKey: "data-center", courseId: COURSE, title: "Data Center Pathway", status: "DRAFT", resolved: true }] });
  assert.doesNotMatch(JSON.stringify(resolved), new RegExp(COURSE_BODY));
  assert.deepEqual(resolved.careers.items, [{ careerId: "career_data_center_technician", title: "Data Center Technician", status: "active", resolved: true, jobEligibilityInferred: false }]);
  assert.deepEqual(resolved.competencies.items.map((item: any) => [item.competencyId, item.resolved]), [["competency_prepare_prove_monitoring_finding", true]]);
  assert.deepEqual(resolved.operationalProgram.items, [{ programId: "data-center-specialization-11", resolved: false }], "the existing operational id is referenced, not invented, and no row exists yet");
  const unknown = await workforceFor([reowned(ORG, (value) => { value.careerRefs = [{ careerId: "career_not_in_registry" }]; })]).resolveProgram(staff, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual(unknown.careers.items, [{ careerId: "career_not_in_registry", resolved: false, jobEligibilityInferred: false }]);
});

// ---------------------------------------------------------------- Arcade + Mission

test("6/7/8 the canonical Learning descriptor, its real Arcade Activity and its exact Mission version", async () => {
  const catalog = canonicalArcadeExperiences();
  assert.deepEqual(catalog.rejected, []);
  const descriptor = catalog.descriptors.find((item: any) => item.id === EXPERIENCE);
  assert.deepEqual(validateArcadeExperience(descriptor), { valid: true, errors: [] });
  assert.deepEqual([descriptor.product.family, descriptor.provenance.classification, descriptor.activityReference.arcadeActivityId, descriptor.lifecycle.launchable, descriptor.lifecycle.playable],
    ["learning", "canonical_descriptor", ACTIVITY, true, false]);
  assert.deepEqual(descriptor.relationships.mission.missionReferences, [{ missionId: MISSION, missionVersion: 1 }]);
  assert.deepEqual([...fabric.describeCapabilities(EXPERIENCE).capabilities].sort(), ["CAREER_LINK", "CURRICULUM_LINK", "EVIDENCE_CANDIDATE", "METAVERSE_CONTEXT", "MISSION_LAUNCH", "MULTIPLAYER", "REPLAY"]);
  // Provisioned through the Arcade authority with its fixed canonical id; idempotent; permission-guarded.
  await assert.rejects(provisionCanonicalArcadeActivity({ ...actorOf(FACILITY) }, ACTIVITY), (error: any) => error.code === "FORBIDDEN");
  await assert.rejects(provisionCanonicalArcadeActivity(actorOf(ADMIN), "arcade_activity_not_canonical"), (error: any) => error.code === "CANONICAL_ACTIVITY_NOT_FOUND");
  const first = await provisionCanonicalArcadeActivity(actorOf(ADMIN), ACTIVITY);
  assert.equal(first.provisioned, !activityPreexisted);
  const again = await provisionCanonicalArcadeActivity(actorOf(ADMIN), ACTIVITY);
  assert.deepEqual([again.provisioned, again.activity.id, again.activity.masteryRule, again.activity.maxScore], [false, ACTIVITY, "PASSED_FLAG", null]);
});

test("9/16 the canonical Mission source publishes through Mission Content; a required unavailable capability blocks start", async () => {
  await publish(structuredClone(DATA_CENTER_COOLING_FAILURE_RESPONSE_V1));
  assert.equal((await resolver.resolvePublishedMission({ missionId: MISSION, version: 1 }, { organizationId: ORG, tenantId: `tenant:${ORG}` }))?.title, "Data Center Cooling Failure Response");
  assert.equal(await resolver.resolvePublishedMission({ missionId: MISSION, version: 2 }, { organizationId: ORG, tenantId: `tenant:${ORG}` }), null);
  // Policy BLOCK_START: requiring the PLANNED data-center system refuses to start rather than fabricating context.
  const blocking = structuredClone(DATA_CENTER_COOLING_FAILURE_RESPONSE_V1);
  blocking.missionId = BLOCKING_MISSION; blocking.slug = BLOCKING_MISSION;
  blocking.metaverseContext = { ...blocking.metaverseContext!, requiredCapabilities: ["POWER_CONTEXT", "DATA_CENTER_CONTEXT"], optionalCapabilities: [] };
  await publish(blocking);
  await assert.rejects(startService.startPublishedMission(actorOf(FACILITY), { missionId: BLOCKING_MISSION, missionVersion: 1, idempotencyKey: `${RUN}:blocked` }),
    (error: any) => /WORLD|CONTEXT|UNAVAILABLE/i.test(`${error.code} ${error.message}`));
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2", [ORG, BLOCKING_MISSION])).rows[0].count), 0);
});

test("10/11/12 launch goes through the Fabric to the canonical start and classifies through the exact Learning descriptor", async () => {
  const undeclared = await call(`/arcade/integration/experiences/${EXPERIENCE}/launch`, FACILITY, "POST", { mode: "MISSION", missionId: MISSION, missionVersion: 2, idempotencyKey: `${RUN}:v2` });
  assert.deepEqual([undeclared.status, undeclared.body.error.code], [409, "MISSION_VERSION_MISMATCH"]);
  const launched = await call(`/arcade/integration/experiences/${EXPERIENCE}/launch`, FACILITY, "POST", { mode: "MISSION", missionId: MISSION, missionVersion: 1, idempotencyKey: `${RUN}:launch` });
  assert.equal(launched.status, 201, JSON.stringify(launched.body));
  const ref = launched.body.data.runtimeRef;
  assert.deepEqual([ref.runtimeKind, ref.experienceId, ref.arcadeActivityId, ref.productType, ref.status], ["MISSION_RUNTIME", EXPERIENCE, ACTIVITY, "learning", "ACTIVE"]);
  state.runtimeId = ref.runtimeId;
  // The Fabric adds no start path: the same idempotency key through the canonical start returns the same runtime.
  const direct = await startService.startPublishedMission(actorOf(FACILITY), { missionId: MISSION, missionVersion: 1, idempotencyKey: `${RUN}:launch` });
  assert.deepEqual([direct.reused, direct.session.id], [true, ref.runtimeId]);
  const fabricSource = readFileSync(new URL("../src/domain/arcade-integration/service/arcade-integration-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(fabricSource, /createSession|INSERT INTO mission_runtime/);
  assert.deepEqual(await fabric.describeRuntime(actorOf(FACILITY), "MISSION_RUNTIME", ref.runtimeId), ref);
});

test("14/15/17 MOL world context is honest: power is SIMULATED, the Data Center system is UNAVAILABLE and only optional", async () => {
  const context: any = await runtimeService.getWorldContext(actorOf(FACILITY), state.runtimeId);
  assert.deepEqual([context.integrated, context.missionAuthority], [true, "MISSION_RUNTIME"]);
  const world = context.frozen;
  const byCapability = Object.fromEntries(world.capabilities.map((item: any) => [item.capability, item]));
  assert.deepEqual([byCapability.POWER_CONTEXT.providerMode, byCapability.POWER_CONTEXT.maturity, byCapability.POWER_CONTEXT.status, byCapability.POWER_CONTEXT.required], ["SIMULATED", "CONTRACT_DEFINED", "AVAILABLE", true]);
  assert.deepEqual([byCapability.DATA_CENTER_CONTEXT.providerMode, byCapability.DATA_CENTER_CONTEXT.maturity, byCapability.DATA_CENTER_CONTEXT.status, byCapability.DATA_CENTER_CONTEXT.required], ["UNAVAILABLE", "PLANNED", "UNAVAILABLE", false]);
  assert.equal(world.simulated, true);
  assert.equal(world.degraded, true, "the optional unavailable system degrades context; it does not block");
  assert.deepEqual(world.degradedCapabilities, ["DATA_CENTER_CONTEXT"]);
  assert.equal(world.missionAuthority, false);
  state.powerFailure = world.eventRefs.find((item: any) => item.eventType === "POWER_FAILURE");
  assert.ok(state.powerFailure?.molEventId, "MOL's own simulated power event is the incident source");
  const capabilities = await workforce.resolveCapabilities(staff, DATA_CENTER_PROGRAM_ID);
  const metaverse = capabilities.find((cap) => cap.capability === "METAVERSE_ENVIRONMENT")!;
  assert.deepEqual([metaverse.maturity, metaverse.issues], ["PLANNED", []]);
  assert.deepEqual(metaverse.molSystems.map((system: any) => [system.systemId, system.mode, system.maturity]), [["power-grid", "SIMULATED", "CONTRACT_DEFINED"], ["data-center", "UNAVAILABLE", "PLANNED"]]);
  const overstated = await workforceFor([reowned(ORG, (value) => { value.capabilityRefs.find((cap: any) => cap.capability === "METAVERSE_ENVIRONMENT").maturity = "LIVE"; })])
    .resolveCapabilities(staff, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual([...overstated.find((cap) => cap.capability === "METAVERSE_ENVIRONMENT")!.issues].sort(),
    ["MATURITY_EXCEEDS_SYSTEM:data-center", "MATURITY_EXCEEDS_SYSTEM:power-grid", "SIMULATED_SYSTEM_CANNOT_BE_LIVE:data-center", "SIMULATED_SYSTEM_CANNOT_BE_LIVE:power-grid"]);
});

test("13 team roles: required simulation roles, server-set attribution, and role events only from the holding role", async () => {
  const runtimeId = state.runtimeId;
  await teamService.createTeam(actorOf(FACILITY), runtimeId, { missionRole: "FACILITY_TECHNICIAN" });
  await assert.rejects(teamService.join(actorOf(ELECTRICAL), runtimeId, { missionRole: "NETWORK_TECHNICIAN" }), (error: any) => error.code === "MISSION_ROLE_NOT_DECLARED");
  await teamService.join(actorOf(ELECTRICAL), runtimeId, { missionRole: "ELECTRICAL_TECHNICIAN" });
  await teamService.join(actorOf(COORDINATOR), runtimeId, { missionRole: "INCIDENT_COORDINATOR" });
  for (const user of [FACILITY, ELECTRICAL, COORDINATOR]) await teamService.setReady(actorOf(user), runtimeId, { ready: true });
  await teamService.activate(actorOf(FACILITY), runtimeId);
  const act = async (user: string, eventType: string) => {
    const session = await runtimeService.get(actorOf(FACILITY), runtimeId);
    return teamService.submitAction(actorOf(user), runtimeId, { expectedRevision: session.revision, eventType, idempotencyKey: `${RUN}:${user}:${eventType}` });
  };
  // A role event from the wrong role does not satisfy the objective.
  await act(ELECTRICAL, "cooling-alarm-acknowledged");
  let session = await runtimeService.get(actorOf(FACILITY), runtimeId);
  assert.notEqual(session.objectiveStates.find((item) => item.objectiveId === "acknowledge-cooling-alarm")!.status, "COMPLETED");
  for (const [user, eventType] of [[FACILITY, "cooling-alarm-acknowledged"], [FACILITY, "cooling-fault-diagnosed"], [ELECTRICAL, "power-path-verified"],
    [COORDINATOR, "incident-escalated"], [ELECTRICAL, "backup-power-confirmed"], [COORDINATOR, "incident-status-reported"], [FACILITY, "simulated-redundant-cooling-engaged"]]) {
    await act(user, eventType);
  }
  session = await runtimeService.get(actorOf(FACILITY), runtimeId);
  assert.equal(session.status, "SUCCEEDED", "11/12: the team completes the required objectives and the Mission succeeds");
  const events = await runtimeService.listEvents(actorOf(FACILITY), runtimeId);
  state.escalation = events.find((event) => event.eventType === "incident-escalated");
  state.backupPower = events.find((event) => event.eventType === "backup-power-confirmed");
  assert.equal((state.escalation.payload as any).participant.missionRole, "INCIDENT_COORDINATOR");
  assert.equal((state.escalation.payload as any).participant.attributedBy, "MISSION_TEAM");
});

test("18/19/20/21 result: non-verified candidate, team ≠ individual mastery, no job eligibility, no credential", async () => {
  const result = (await call(`/arcade/integration/results/MISSION_RUNTIME/${state.runtimeId}`, FACILITY)).body.data;
  assert.deepEqual(result.completion, { status: "SUCCEEDED", completed: true, terminal: true });
  assert.deepEqual(result.score, { value: null, authoritative: false, reason: "MISSION_HAS_NO_SCORE" });
  assert.deepEqual(result.learningEvidenceCandidate, { eligible: true, isVerifiedEvidence: false, addressableByEvidenceAuthority: false, individualEvidenceInferred: false, authority: "verified-evidence" });
  assert.equal(result.teamPerformance.scope, "TEAM_PERFORMANCE");
  assert.deepEqual(result.teamPerformance.rolesPresent, ["ELECTRICAL_TECHNICIAN", "FACILITY_TECHNICIAN", "INCIDENT_COORDINATOR"]);
  assert.equal(result.masteryAchieved, undefined, "no mastery claim from a Mission");
  assert.deepEqual(result.replayRef.kind, "MISSION_RUNTIME_EVENT_LOG", "16: replay reference exists");
  assert.ok(result.replayRef.eventCount > 8);
  assert.deepEqual([result.leaderboard.eligible, result.achievement.credential], [false, false]);
  const resolved: any = await fabric.resolve(actorOf(FACILITY), EXPERIENCE);
  assert.deepEqual(resolved.career.careers, [{ careerId: "career_data_center_technician", slug: "data-center-technician", title: "Data Center Technician", status: "active", resolved: true }]);
  assert.equal(resolved.career.eligibilityClaims, false);
  const authority = await workforce.describeAuthority(staff, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual([authority.credentialIssuerStatus, authority.credentialIssuers, authority.owningOrganizationIsIssuer], ["NOT_DECLARED", [], false]);
  assert.deepEqual(await institutionalCounts(), institutionalBaseline, "38: no Evidence, competency decision, credential, Truth, career-event or membership writes");
});

// ---------------------------------------------------------------- funding, fundability, reporting, BOS, MOCC

test("22/23/24 funding is honest and the Phase 6.5 gate returns a deterministic HOLD", async () => {
  assert.deepEqual(await workforce.listFundingRelationships(staff, DATA_CENTER_PROGRAM_ID), [], "no funding source exists in canonical data; none is invented");
  const category = { fundingSourceId: "category.workforce", name: "Workforce funding (category)", sourceType: "WORKFORCE", jurisdiction: "Not determined", eligibleProgramTypes: ["workforce"],
    eligibleCostCategories: ["instruction"], matchRequired: "UNKNOWN", reportingRequirements: ["participation"], authority: "Not identified", status: "UNKNOWN", evidenceRequirements: [] };
  const potential = workforceFor([reowned(ORG, (value) => { value.fundingRefs = [{ fundingSourceId: "category.workforce", alignment: "POTENTIAL", verification: null, capabilityRefs: ["CURRICULUM_DELIVERY"] }]; })], [category]);
  assert.deepEqual((await potential.listFundingRelationships(staff, DATA_CENTER_PROGRAM_ID)).map((item) => [item.alignment, item.verificationResolved, item.eligibilityEstablished]), [["POTENTIAL", null, false]]);
  assert.ok(validateProgramPackage(reowned(ORG, (value) => { value.fundingRefs = [{ fundingSourceId: "category.workforce", alignment: "VERIFIED", verification: null, capabilityRefs: [] }]; }))
    .some((error) => /VERIFIED requires a verification reference/.test(error)));
  const fake = workforceFor([reowned(ORG, (value) => { value.fundingRefs = [{ fundingSourceId: "category.workforce", alignment: "VERIFIED", verification: { source: "FUNDING_GRANT", recordId: `grant_missing_${RUN}` }, capabilityRefs: [] }]; })], [category]);
  assert.equal((await fake.listFundingRelationships(staff, DATA_CENTER_PROGRAM_ID))[0].verificationResolved, false, "VERIFIED without a real award does not resolve");
  const evaluated = await workforce.evaluateFundability(staff, DATA_CENTER_PROGRAM_ID, DATA_CENTER_FUNDABILITY_ASSESSMENT.component);
  assert.deepEqual([evaluated.decision, evaluated.reasons, evaluated.fundingLanes, evaluated.eligibilityEstablished], ["HOLD",
    ["WORKFORCERELEVANCE_PARTIAL", "EMPLOYERRELEVANCE_PARTIAL", "AUTHORITYCLARITY_PARTIAL", "INSUFFICIENT_FUNDING_LANES", "DEPENDENCIES_NOT_MATURE", "INTEGRATION_NOT_READY"], [], false]);
  const derived = { fundingLaneCount: 0, blockingDependencyCount: 2, readinessStatus: "BLOCKED" as const };
  for (let i = 0; i < 3; i += 1) assert.deepEqual(evaluateFundabilityGate(DATA_CENTER_FUNDABILITY_ASSESSMENT.component, derived), evaluateFundabilityGate(DATA_CENTER_FUNDABILITY_ASSESSMENT.component, derived));
});

test("31/32 reporting profile resolves; BOS reads readiness, fundability, maturity, dependency risk, partners and authority read-only", async () => {
  const resolved = await workforce.resolveProgram(staff, DATA_CENTER_PROGRAM_ID);
  assert.ok(resolved.reportProfiles.items.every((item) => item.reportProfileKey === "foundation.data-center-ai-infrastructure-pathway" && item.resolved));
  assert.ok(resolved.reportProfiles.items.filter((item) => item.kind === "VERIFIED_INSTITUTIONAL_TRUTH").every((item) => item.truthAuthority === "truth-spine" && item.verifiedByThisRegistry === false));
  const bos = await workforce.bosProgramProjection(staff, DATA_CENTER_PROGRAM_ID, DATA_CENTER_FUNDABILITY_ASSESSMENT.component);
  assert.deepEqual([bos.readOnly, bos.controls, bos.lifecycle, bos.readiness.status, bos.fundability.decision], [true, [], "INTEGRATION_READINESS", "BLOCKED", "HOLD"]);
  assert.deepEqual([...bos.readiness.gaps].sort(), ["EXTERNAL_CREDENTIAL_AUTHORITY", "FUNDING_LANES", "PARTNERS"], "after provisioning and publication only the real gaps remain");
  assert.deepEqual([...bos.dependencyRisk.blocking].sort(), ["dep.client-mission-player", "dep.employer-validation"]);
  assert.deepEqual(bos.partnerReadiness, { declared: 0, confirmed: 0, status: "NONE" });
  assert.equal(bos.authorityClarity.credentialIssuerStatus, "NOT_DECLARED");
  assert.equal(bos.capabilityMaturity.find((cap) => cap.capability === "METAVERSE_ENVIRONMENT")!.maturity, "PLANNED");
});

test("30 MOCC projection is read-only, names the program, systems, Missions and sensory refs, and no learner identity", () => {
  for (const systemId of ["power-grid", "data-center"]) {
    const impact = workforce.moccSystemImpact(staff, systemId);
    assert.deepEqual([impact.readOnly, impact.controls], [true, []]);
    const program = impact.programs.find((item) => item.programId === DATA_CENTER_PROGRAM_ID)!;
    assert.deepEqual([program.affectedCapabilities, program.affectedMissions, program.fundingBuckets], [["METAVERSE_ENVIRONMENT"], [{ missionId: MISSION, missionVersion: 1 }], ["DESTINATION_PROGRAM"]]);
    assert.equal(program.sensoryRefs!.sensoryPolicyRef, "policy.data-center-training");
    assert.doesNotMatch(JSON.stringify(impact), new RegExp(`${FACILITY}|${ELECTRICAL}|${COORDINATOR}|user_id|userId|${state.runtimeId}`));
  }
});

// ---------------------------------------------------------------- sensory

const T = sensory.DATA_CENTER_SENSORY_TRIGGERS;
const NONE = Object.fromEntries(sensory.ACCESSIBILITY_SENSORY_KEYS.map((key: string) => [key, false]));
const plan = (trigger: any, sourceRecordId: string, accessibility = NONE) => {
  const result = sensory.planSensoryPresentation(sensory.buildSensoryEvent(trigger, { sensoryEventId: `sensory.${RUN}.${trigger.triggerEvent}`.replace(/[^A-Za-z0-9._:-]/g, "-"), sourceRecordId, correlationId: state.runtimeId }),
    { registry: productionSensory, policyId: "policy.data-center-training", accessibility });
  assert.equal(result.status, "PRESENT", JSON.stringify(result.reasons));
  return result.plan;
};

test("25/26/27/28 sensory plans come from authoritative events; the incident alert outranks Mission success; no-audio keeps a visual alert", async () => {
  assert.deepEqual(productionSensory.rejected, []);
  // Registered sounds are not audio files.
  assert.ok(productionSensory.sounds.every((item: any) => sensory.soundAssetStatus(item) === "PENDING_ASSET"));
  const incident = plan(T.INCIDENT, state.powerFailure.molEventId);
  const escalation = plan(T.ESCALATION, `${state.runtimeId}:${state.escalation.sequence}`);
  const backup = plan(T.BACKUP_POWER, `${state.runtimeId}:${state.backupPower.sequence}`);
  const success = plan(T.MISSION_SUCCESS, state.runtimeId);
  assert.deepEqual([incident.sourceAuthority, incident.presentationPriority, escalation.presentationPriority, success.tier, success.presentationPriority],
    ["mol", "CRITICAL_ALERT", "ALERT", "TIER_3_MISSION_SUCCESS", "CELEBRATION"]);
  assert.deepEqual([success.channels.CAMERA, success.channels.PARTICLES, success.flashingAllowed], [null, null, false], "restrained success under the training policy");
  assert.equal(backup.channels.AUDIO, "dc.event.generator-startup");
  // 26: the alert keeps its interruptive channels; the celebration keeps nothing interruptive.
  const arbitration = sensory.arbitrateSensoryPlans([success, incident, backup]);
  assert.equal(arbitration.foreground.dedupeKey, incident.dedupeKey);
  const successRole = arbitration.assignments.find((item: any) => item.dedupeKey === success.dedupeKey);
  assert.deepEqual([successRole.channels.AUDIO, successRole.channels.MUSIC], [null, null]);
  // 27: no audio, no flashing, haptics off — the alert is still shown and captioned.
  const silent = plan(T.INCIDENT, state.powerFailure.molEventId, { ...NONE, noAudio: true, hapticsOff: true, noFlashing: true, visualSoundIndicators: true });
  const silentRole = sensory.arbitrateSensoryPlans([silent, success]).assignments.find((item: any) => item.dedupeKey === silent.dedupeKey);
  assert.deepEqual([silentRole.channels.AUDIO, silentRole.channels.HAPTICS, silentRole.channels.SIGNAGE, silentRole.visualAlert, Boolean(silentRole.captionKey)], [null, null, "signage.dc.power-event", true, true]);
  // Recovery from MOL's restoration event, once it has occurred.
  nowMs += 21 * 60 * 1000;
  const live: any = (await runtimeService.getWorldContext(actorOf(FACILITY), state.runtimeId)).live;
  const restored = live?.eventRefs?.find((item: any) => item.eventType === "POWER_RESTORED");
  assert.ok(restored?.molEventId, "MOL's own restoration event is the recovery source");
  assert.equal(plan(T.RECOVERY, restored.molEventId).channels.AUDIO, "dc.cue.recovery");
  // Reduced motion and reduced sensory variants for the success celebration.
  const reduced = plan(T.MISSION_SUCCESS, state.runtimeId, { ...NONE, reducedSensory: true });
  assert.deepEqual([reduced.variant, reduced.channels.MUSIC], ["reducedSensoryVariant", null]);
});

test("29 TIER_4 cannot be fabricated from an ordinary Mission completion", () => {
  const event = sensory.buildSensoryEvent(T.MISSION_SUCCESS, { sensoryEventId: "sensory.tier4", sourceRecordId: state.runtimeId, correlationId: state.runtimeId });
  assert.ok(sensory.validateSensoryEvent({ ...event, celebrationTier: "TIER_4_MAJOR_MILESTONE" }).includes("mission-runtime cannot present TIER_4_MAJOR_MILESTONE"));
  assert.deepEqual(sensory.planSensoryPresentation({ ...event, celebrationTier: "TIER_3_MISSION_SUCCESS" }, { registry: productionSensory, policyId: "policy.data-center-training", accessibility: NONE }).status, "PRESENT");
  assert.ok(!productionSensory.celebrations.some((item: any) => item.tier === "TIER_4_MAJOR_MILESTONE"), "no authoritative TIER_4 source is registered");
  const fabricated = sensory.buildSensoryRegistry({ ...productionSensory, celebrations: [...productionSensory.celebrations.map((item: any) => item.celebrationId === "dc.celebration.mission-success" ? { ...item, tier: "TIER_4_MAJOR_MILESTONE" } : item)] });
  assert.ok(fabricated.rejected.some((item: any) => item.errors.includes("mission-runtime cannot present TIER_4_MAJOR_MILESTONE")));
  assert.equal(sensory.validateSensoryEvent({ ...event, createsMastery: true }).includes("sensoryEvent.createsMastery must be false"), true);
});

// ---------------------------------------------------------------- isolation and no duplicate authorities

test("33 organization isolation", async () => {
  await assert.rejects(workforce.resolveProgram({ user_id: OUTSIDER, organization_id: OTHER_ORG }, DATA_CENTER_PROGRAM_ID), (error: any) => error.code === "PROGRAM_NOT_FOUND");
  const foreign = await workforceFor([reowned(OTHER_ORG)]).resolveProgram({ user_id: OUTSIDER, organization_id: OTHER_ORG }, DATA_CENTER_PROGRAM_ID);
  assert.deepEqual([foreign.curriculum.items[0].resolved, foreign.missions.items[0].resolved], [false, false], "another organization sees none of this organization's course or publication");
  const launch = await call(`/arcade/integration/experiences/${EXPERIENCE}/launch`, OUTSIDER, "POST", { mode: "MISSION", missionId: MISSION, missionVersion: 1, idempotencyKey: `${RUN}:outsider` });
  assert.deepEqual([launch.status, launch.body.error.code], [404, "MISSION_NOT_PUBLISHED"]);
  assert.equal((await call(`/arcade/integration/results/MISSION_RUNTIME/${state.runtimeId}`, OUTSIDER)).status, 404);
});

function sources(dir: URL): Array<[string, string]> {
  return readdirSync(dir).flatMap((name) => {
    const path = new URL(name, dir);
    if (statSync(path).isDirectory()) return sources(new URL(`${name}/`, dir));
    return /\.(ts|js)$/.test(name) ? [[path.pathname, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

test("34/35/36/37 no duplicate Career, Curriculum, Arcade or MOL registry; no Data Center software authority", () => {
  const phase7 = [
    ...sources(new URL("../src/domain/workforce-foundation/", import.meta.url)),
    [new URL("../src/domain/arcade/catalog/canonical-arcade-activities.ts", import.meta.url).pathname, readFileSync(new URL("../src/domain/arcade/catalog/canonical-arcade-activities.ts", import.meta.url), "utf8")],
    [new URL("../src/domain/mission-content/catalog/canonical-mission-sources.ts", import.meta.url).pathname, readFileSync(new URL("../src/domain/mission-content/catalog/canonical-mission-sources.ts", import.meta.url), "utf8")],
    ...sources(new URL("../../../src/shared/experience/sensory/", import.meta.url)),
  ] as Array<[string, string]>;
  for (const [file, source] of phase7) {
    assert.doesNotMatch(source, /\b(INSERT INTO|DELETE FROM|CREATE TABLE|ALTER TABLE)\b|\bUPDATE\s+[a-z_]+\s+SET\b/, `${file} writes SQL`);
    assert.doesNotMatch(source, /career_family_id\s*:|systemId:\s*"|stable_key\s*:|DataCenterProgramEngine|DataCenterEngine/, `${file} duplicates a registry or adds a Data Center engine`);
  }
  // Exactly one canonical descriptor and one canonical activity; the MOL registry is untouched.
  assert.equal(canonicalArcadeExperiences().descriptors.filter((item: any) => item.provenance.classification === "canonical_descriptor").length, 1);
  assert.equal(CANONICAL_ARCADE_ACTIVITIES.length, 1);
  const migrations = readdirSync(new URL("../migrations/", import.meta.url)).filter((name) => /^\d+_/.test(name)).sort();
  assert.match(migrations.at(-1)!, /^156_/, "Phase 7 adds no migration");
});
