// Phase 5 — Multiplayer / Team Missions acceptance.
// Separate authenticated users drive the real HTTP team commands around a Mission published through
// the real review workflow and started through the canonical start authority. Tests run in order.
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
import { MISSION_DEFINITION_FIXTURES, MISSION_WORLD_REFERENCE_FIXTURE } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { validateMissionDefinition, type MissionDefinition } from "../src/domain/mission-content/model/mission-definition.js";
import { getMissionAccommodationProjection } from "../src/domain/accessibility-accommodations/service/mission-accommodation-projection.js";
import { registerMissionRuntimeRoutes } from "../src/domain/mission-runtime/api/routes.js";
import { MissionRuntimeService, type MissionRuntimeActor } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";
import { describeMissionEvidenceCandidate } from "../src/domain/mission-runtime/service/mission-evidence-candidate.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { FixtureMissionDirectorExecutor, type MissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";
import type { MissionDirectorExecutorContext, MissionDirectorProposal } from "../src/domain/mission-director/model/mission-director.js";
import { registerMissionTeamRoutes } from "../src/domain/mission-team/api/routes.js";
import { MISSION_PRESENCE_EXPIRY_MS, MISSION_TEAM_OPERATIONAL_CONTRACT, MissionTeamService } from "../src/domain/mission-team/service/mission-team-service.js";

const RUN = `mission5_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const HOST = `host_${RUN}`;
const BRAVO = `bravo_${RUN}`;
const CHARLIE = `charlie_${RUN}`;
const DELTA = `delta_${RUN}`;
const OUTSIDER = `outsider_${RUN}`;
const ADMIN = `acc_admin_${RUN}`;
const PASS = (_req: any, _res: any, next: any) => next();
const T0 = new Date("2026-05-01T15:00:00.000Z");
let clockMs = T0.getTime();
const clock = () => new Date(clockMs);

const profile = (userId: string, org: string, permissions: string[]) =>
  ({ user_id: userId, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`, permissions, roles: [] });
const learnerPerms = ["arcade.attempt"];
const users: Record<string, any> = {
  [AUTHOR]: profile(AUTHOR, ORG, ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"]),
  [REVIEWER]: profile(REVIEWER, ORG, ["project.submission.review", "studio.review.queue.view"]),
  [PUBLISHER]: profile(PUBLISHER, ORG, ["curriculum.catalog.publish", "curriculum.catalog.retire"]),
  [HOST]: profile(HOST, ORG, learnerPerms), [BRAVO]: profile(BRAVO, ORG, learnerPerms), [CHARLIE]: profile(CHARLIE, ORG, learnerPerms),
  [DELTA]: profile(DELTA, ORG, learnerPerms), [OUTSIDER]: profile(OUTSIDER, OTHER_ORG, learnerPerms),
};
const actorOf = (userId: string): MissionRuntimeActor => ({ user_id: userId, organization_id: users[userId].organization_id, permissions: users[userId].permissions });
const resolver = new PersistedPublishedMissionResolver();
const runtimeService = new MissionRuntimeService(undefined, clock, { accommodations: getMissionAccommodationProjection });
const teamService = new MissionTeamService(runtimeService, undefined, clock);

let server: Server;
let base = "";
const missions = { team: `${RUN}:team`, solo: `${RUN}:solo`, spare: `${RUN}:spare` };
const releases: Record<string, string> = {};
let runtimeId = "";
let spareRuntimeId = "";
const participant: Record<string, string> = {};

// The test's own HTTP client keeps a private fetch reference, so the external-call stub counts only system code.
const httpFetch = globalThis.fetch;
async function call(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await httpFetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", "x-test-user": userId }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() };
}
const team = (id: string, suffix = "") => `/arcade/mission-runtimes/${id}/team${suffix}`;

// Generic team Mission composed on the 4G reference fixture: role A inspects, role B responds,
// an optional observer confirms. Completion still comes from the canonical condition engine.
function teamDefinition(missionId: string, mutate: (value: MissionDefinition) => void = () => {}): MissionDefinition {
  const value = structuredClone(MISSION_WORLD_REFERENCE_FIXTURE);
  value.missionId = missionId;
  value.slug = missionId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  value.status = "DRAFT";
  value.aiCapabilities = { missionDirector: true, adaptiveDifficulty: true, npcDialogue: true, scenarioVariation: true };
  value.difficultyProfile = { tiers: ["INTRODUCTORY", "INTERMEDIATE"] };
  value.multiplayer = {
    enabled: true, minParticipants: 2, maxParticipants: 3, teamMode: "SINGLE_TEAM", lateJoinPolicy: "NONE",
    roles: [
      { roleId: "OPERATOR", label: "Operator", required: true, maxParticipants: 1 },
      { roleId: "TECHNICIAN", label: "Technician", required: true, maxParticipants: 1 },
      { roleId: "OBSERVER", label: "Observer", required: false, maxParticipants: 1 },
    ],
  };
  value.objectives = [
    { objectiveId: "inspect", title: "Inspect the power system", description: "Operator inspection.", type: "INSPECT", required: true, order: 1,
      completionRule: { type: "ROLE_EVENT_OCCURRED", eventType: "system-inspected", missionRole: "OPERATOR" }, metadata: {} },
    { objectiveId: "respond", title: "Perform the response action", description: "Technician response.", type: "RESPOND", required: true, order: 2,
      completionRule: { type: "ROLE_EVENT_OCCURRED", eventType: "response-performed", missionRole: "TECHNICIAN" }, metadata: {} },
    { objectiveId: "fault-branch", title: "Handle the fault branch", description: "Optional branch objective.", type: "RESPOND", required: false, order: 3,
      completionRule: { type: "STATE_EQUALS", stateKey: "mission.scenarioBranch", value: "cooling-fault" }, metadata: {} },
  ];
  value.stages[0].objectiveIds = ["inspect", "respond", "fault-branch"];
  value.stages[0].exitConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "inspect" }, { type: "OBJECTIVE_COMPLETE", objectiveId: "respond" }];
  value.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "inspect" }, { type: "OBJECTIVE_COMPLETE", objectiveId: "respond" }];
  value.scenarioBranching = {
    defaultBranchId: "standard",
    branches: [
      { branchId: "standard", label: "Standard", description: "Nominal.", availableDuringStageIds: [] },
      { branchId: "cooling-fault", label: "Cooling fault", description: "Declared fault.", availableDuringStageIds: [] },
    ],
  };
  mutate(value);
  return value;
}

async function publish(key: keyof typeof missions, definition: MissionDefinition) {
  const created = await call("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const submitted = await call(`/studio/missions/drafts/${created.body.data.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Phase 5" });
  const submissionId = submitted.body.data.submission.submissionId;
  assert.equal((await call(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "ok" })).status, 200);
  const published = await call(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(published.status, 201, JSON.stringify(published.body));
  releases[key] = published.body.data.release.releaseId;
}

async function residueCounts(orgs: string[]) {
  const tables = ["mission_teams", "mission_team_participants", "mission_team_events", "mission_runtime_sessions", "mission_director_decisions", "mission_definition_drafts",
    "mission_review_submissions", "mission_published_releases", "mission_publication_events", "authorized_accommodations", "users", "organizations"];
  return Object.fromEntries(await Promise.all(tables.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id = ANY($1::text[])`, [orgs])).rows[0].count)])));
}

async function institutionalCounts() {
  const tables = ["prepare_prove_evidence", "curriculum_truth_facts", "truth_spine_records", "learner_credentials", "curriculum_learner_mastery", "career_events", "memberships", "users"];
  return Object.fromEntries(await Promise.all(tables.map(async (table) => [table, Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE organization_id=$1`, [ORG])).rows[0].count)])));
}

async function cleanup() {
  await withTransaction(async (tx) => {
    for (const [table, trigger] of [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
      ["mission_review_submissions", "mission_review_submission_snapshot_immutable"], ["mission_director_decisions", "mission_director_decisions_append_only"]]) {
      await tx.query(`ALTER TABLE ${table} DISABLE TRIGGER ${trigger}`);
    }
    for (const table of ["mission_director_decisions", "mission_publication_events", "mission_published_releases", "mission_review_submissions", "mission_runtime_sessions",
      "mission_definition_drafts", "authorized_accommodations"]) {
      await tx.query(`DELETE FROM ${table} WHERE organization_id = ANY($1::text[])`, [[ORG, OTHER_ORG]]);
    }
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, HOST, BRAVO, CHARLIE, DELTA, OUTSIDER, ADMIN]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    for (const [table, trigger] of [["mission_publication_events", "mission_publication_events_append_only"], ["mission_published_releases", "mission_published_release_immutable"],
      ["mission_review_submissions", "mission_review_submission_snapshot_immutable"], ["mission_director_decisions", "mission_director_decisions_append_only"]]) {
      await tx.query(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    }
  });
}

before(async () => {
  await cleanup();
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active')`, [ORG, RUN, OTHER_ORG, `${RUN} Other`]);
  for (const userId of [AUTHOR, REVIEWER, PUBLISHER, HOST, BRAVO, CHARLIE, DELTA, ADMIN, OUTSIDER]) {
    const org = userId === OUTSIDER ? OTHER_ORG : ORG;
    await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'active','local')`, [userId, org, `${userId}@test.invalid`, `Person ${userId.split("_")[0]}`]);
  }
  // The host holds a sensitive accommodation grant that teammates, MOL and AI must never see.
  await query(`INSERT INTO authorized_accommodations (accommodation_id, organization_id, user_id, accommodation_type, value, status, effective_at, granted_by_user_id)
    VALUES ($1,$2,$3,'EXTENDED_ASSESSMENT_TIME',$4::jsonb,'ACTIVE','2026-01-01T00:00:00Z',$5)`, [`acc_${RUN}`, ORG, HOST, JSON.stringify({ diagnosis: "private clinical detail", multiplier: 1.5 }), ADMIN]);
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  registerMissionRuntimeRoutes(app, { startService: new MissionRuntimeStartService(resolver, runtimeService) });
  registerMissionTeamRoutes(app, { teamService });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  assert.deepEqual(validateMissionDefinition({ ...teamDefinition(missions.team), status: "PUBLISHED" }), []);
  await publish("team", teamDefinition(missions.team));
  await publish("spare", teamDefinition(missions.spare));
  const solo = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  solo.missionId = missions.solo; solo.slug = `${RUN.replaceAll("_", "-")}-solo`; solo.status = "DRAFT";
  await publish("solo", solo);
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await cleanup();
  // Cleanup proof: zero residue, and append-only/immutability triggers remain enabled.
  const remaining = await residueCounts([ORG, OTHER_ORG]);
  for (const [table, count] of Object.entries(remaining)) assert.equal(count, 0, `${table} residue`);
  const triggers = (await query("SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = ANY($1::text[])",
    [["mission_director_decisions_append_only", "mission_publication_events_append_only", "mission_published_release_immutable", "mission_review_submission_snapshot_immutable"]])).rows;
  assert.equal(triggers.length, 4);
  for (const trigger of triggers) assert.equal(trigger.tgenabled, "O", trigger.tgname);
});

class CapturingExecutor implements MissionDirectorExecutor {
  readonly kind = "FIXTURE" as const;
  seen: MissionDirectorExecutorContext | null = null;
  constructor(private readonly proposal: MissionDirectorProposal) {}
  async propose(context: MissionDirectorExecutorContext) { this.seen = context; return structuredClone(this.proposal); }
}

let institutionalBaseline: Record<string, number> = {};

// ---------------------------------------------------------------- single-player + start

test("1/2 single-player Missions are unchanged and reject team formation", async () => {
  institutionalBaseline = await institutionalCounts();
  const solo = await call("/arcade/mission-runtimes", HOST, "POST", { missionId: missions.solo, missionVersion: 1, idempotencyKey: `${RUN}:solo` });
  assert.equal(solo.status, 201);
  const soloId = solo.body.data.session.id;
  const formed = await call(team(soloId), HOST, "POST", { missionRole: "OPERATOR" });
  assert.deepEqual([formed.status, formed.body.error.code], [409, "MISSION_NOT_MULTIPLAYER"]);
  const events = await runtimeService.listEvents(actorOf(HOST), soloId);
  const done = await runtimeService.appendEvent(actorOf(HOST), soloId, { expectedRevision: 1, sequence: events.length + 1, eventType: "objective-observed" });
  assert.equal(done.session.status, "SUCCEEDED", "single-player learner path is unchanged");
});

test("3 published team Mission starts canonically; the owner forms the single org/runtime-scoped team", async () => {
  const started = await call("/arcade/mission-runtimes", HOST, "POST", { missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:team` });
  assert.equal(started.status, 201, JSON.stringify(started.body));
  runtimeId = started.body.data.session.id;
  const notOwner = await call(team(runtimeId), BRAVO, "POST", { missionRole: "TECHNICIAN" });
  assert.equal(notOwner.status, 404, "only the runtime owner can form its team");
  const formed = await call(team(runtimeId), HOST, "POST", { missionRole: "OPERATOR" });
  assert.equal(formed.status, 201, JSON.stringify(formed.body));
  participant[HOST] = formed.body.data.self.participantId;
  assert.deepEqual([formed.body.data.team.status, formed.body.data.self.missionRole, formed.body.data.self.isHost], ["FORMING", "OPERATOR", true]);
  const again = await call(team(runtimeId), HOST, "POST", { missionRole: "OPERATOR" });
  assert.equal(again.body.data.team.teamId, formed.body.data.team.teamId, "team creation is idempotent per runtime");
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_teams WHERE mission_runtime_id=$1", [runtimeId])).rows[0].count), 1);
});

// ---------------------------------------------------------------- membership, roles, capacity

test("4/5/6/7 membership is unique, capacity and declared roles are enforced, and mission roles grant no platform permission", async () => {
  const undeclared = await call(team(runtimeId, "/join"), BRAVO, "POST", { missionRole: "INCIDENT_COMMANDER" });
  assert.deepEqual([undeclared.status, undeclared.body.error.code], [400, "MISSION_ROLE_NOT_DECLARED"]);
  const bravo = await call(team(runtimeId, "/join"), BRAVO, "POST", { missionRole: "TECHNICIAN" });
  assert.equal(bravo.status, 200, JSON.stringify(bravo.body));
  participant[BRAVO] = bravo.body.data.self.participantId;
  const duplicate = await call(team(runtimeId, "/join"), BRAVO, "POST", { missionRole: "TECHNICIAN" });
  assert.equal(duplicate.body.data.self.participantId, participant[BRAVO], "rejoin is idempotent");
  assert.equal((await call(team(runtimeId, "/join"), BRAVO, "POST", { missionRole: "OBSERVER" })).body.error.code, "MISSION_PARTICIPANT_ALREADY_JOINED");
  // Concurrent joins race for the single OBSERVER seat and the last team seat: exactly one wins.
  const [charlie, delta] = await Promise.all([
    call(team(runtimeId, "/join"), CHARLIE, "POST", { missionRole: "OBSERVER" }),
    call(team(runtimeId, "/join"), DELTA, "POST", { missionRole: "OBSERVER" }),
  ]);
  const winners = [charlie, delta].filter((result) => result.status === 200);
  assert.equal(winners.length, 1);
  assert.ok(["MISSION_ROLE_FULL", "MISSION_TEAM_FULL"].includes([charlie, delta].find((result) => result.status !== 200)!.body.error.code));
  const observer = charlie.status === 200 ? CHARLIE : DELTA;
  const loser = observer === CHARLIE ? DELTA : CHARLIE;
  participant[observer] = winners[0].body.data.self.participantId;
  const full = await call(team(runtimeId, "/join"), loser, "POST", { missionRole: "OBSERVER" });
  assert.equal(full.status, 409, "team capacity is enforced");
  const roster = await query("SELECT user_id, mission_role FROM mission_team_participants WHERE mission_runtime_id=$1 AND status='JOINED'", [runtimeId]);
  assert.equal(roster.rows.length, 3);
  // Mission role ≠ platform role: no membership/RBAC rows, no host powers, no publication authority.
  assert.equal((await call(team(runtimeId, "/activate"), BRAVO, "POST", {})).body.error.code, "MISSION_TEAM_HOST_REQUIRED");
  assert.equal((await call("/studio/missions/review/submissions", BRAVO)).status, 403);
  assert.deepEqual(await institutionalCounts(), institutionalBaseline);
  // Leave and authorized removal.
  assert.equal((await call(team(runtimeId, "/leave"), observer, "POST", {})).status, 200);
  assert.equal((await call(team(runtimeId, "/leave"), observer, "POST", {})).status, 200, "leave is idempotent");
  const rejoined = await call(team(runtimeId, "/join"), observer, "POST", { missionRole: "OBSERVER" });
  assert.equal(rejoined.body.data.self.participantId, participant[observer], "rejoin reuses the membership row");
  const removed = await call(team(runtimeId, `/participants/${participant[observer]}/remove`), HOST, "POST", {});
  assert.equal(removed.status, 200);
  assert.equal((await call(team(runtimeId, "/join"), observer, "POST", { missionRole: "OBSERVER" })).body.error.code, "MISSION_PARTICIPANT_REMOVED");
});

// ---------------------------------------------------------------- readiness, presence, activation

test("10/11/12 readiness is distinct from presence; disconnect keeps membership; reconnect is idempotent", async () => {
  assert.equal((await call(team(runtimeId, "/presence"), BRAVO, "POST", { state: "ONLINE" })).body.data.presence, "ONLINE");
  let view = (await call(team(runtimeId), HOST)).body.data;
  assert.equal(view.participants.find((item: any) => item.participantId === participant[BRAVO]).ready, false, "presence does not imply readiness");
  assert.equal((await call(team(runtimeId, "/activate"), HOST, "POST", {})).body.error.code, "MISSION_TEAM_NOT_READY");
  assert.equal((await call(team(runtimeId, "/ready"), HOST, "POST", { ready: true })).status, 200);
  assert.equal((await call(team(runtimeId, "/ready"), BRAVO, "POST", { ready: true })).status, 200);
  assert.equal((await call(team(runtimeId, "/ready"), BRAVO, "POST", { ready: true })).status, 200, "ready is idempotent");
  // Disconnect: membership, role and readiness survive.
  await call(team(runtimeId, "/presence"), BRAVO, "POST", { state: "DISCONNECTED" });
  view = (await call(team(runtimeId), HOST)).body.data;
  const bravo = view.participants.find((item: any) => item.participantId === participant[BRAVO]);
  assert.deepEqual([bravo.presence, bravo.missionRole, bravo.ready], ["DISCONNECTED", "TECHNICIAN", true]);
  const eventsBefore = (await call(team(runtimeId, "/history"), HOST)).body.data.length;
  const reconnect = await call(team(runtimeId, "/join"), BRAVO, "POST", {});
  assert.equal(reconnect.body.data.self.participantId, participant[BRAVO]);
  assert.equal((await call(team(runtimeId, "/history"), HOST)).body.data.length, eventsBefore, "reconnect adds no membership events");
  await call(team(runtimeId, "/presence"), BRAVO, "POST", { state: "ONLINE" });
  clockMs += MISSION_PRESENCE_EXPIRY_MS + 1_000;
  view = (await call(team(runtimeId), HOST)).body.data;
  assert.equal(view.participants.find((item: any) => item.participantId === participant[BRAVO]).presence, "DISCONNECTED", "presence expires");
  clockMs = T0.getTime() + 60_000;
  const activated = await call(team(runtimeId, "/activate"), HOST, "POST", {});
  assert.equal(activated.status, 200, JSON.stringify(activated.body));
  assert.equal(activated.body.data.team.status, "ACTIVE");
  assert.equal((await call(team(runtimeId, "/join"), DELTA, "POST", { missionRole: "OBSERVER" })).body.error.code, "MISSION_TEAM_NOT_JOINABLE", "no late join under NONE");
});

// ---------------------------------------------------------------- isolation

test("9 other organizations cannot read, join, act, set presence or replay", async () => {
  for (const [path, method, body] of [["", "GET", undefined], ["/join", "POST", { missionRole: "OBSERVER" }], ["/actions", "POST", { expectedRevision: 1, eventType: "system-inspected", idempotencyKey: "x" }],
    ["/presence", "POST", { state: "ONLINE" }], ["/history", "GET", undefined], ["/ready", "POST", { ready: true }]] as const) {
    const result = await call(team(runtimeId, path), OUTSIDER, method, body);
    assert.equal(result.status, 404, `${method} ${path}`);
  }
  await assert.rejects(runtimeService.get(actorOf(OUTSIDER), runtimeId), (error: any) => error.statusCode === 404);
  const projection = await teamService.operationalProjection({ organizationId: OTHER_ORG, tenantId: `tenant:${OTHER_ORG}` });
  assert.deepEqual(projection.teams, []);
});

// ---------------------------------------------------------------- actions, attribution, concurrency

test("8/13/14/15/16 attributed actions: no impersonation, safe concurrency, stale revisions fail, retries are idempotent", async () => {
  let view = (await call(team(runtimeId), HOST)).body.data;
  const revision = view.runtime.revision;
  // A participant cannot forge attribution or claim another role: role comes from server state.
  const forged = await call(team(runtimeId, "/actions"), HOST, "POST", { expectedRevision: revision, eventType: "response-performed", payload: { participant: { missionRole: "TECHNICIAN" } }, idempotencyKey: `${RUN}:forge` });
  assert.equal(forged.body.error.code, "MISSION_RUNTIME_EVENT_PAYLOAD_INVALID");
  const wrongRole = await call(team(runtimeId, "/actions"), HOST, "POST", { expectedRevision: revision, eventType: "response-performed", missionRole: "TECHNICIAN", idempotencyKey: `${RUN}:host-response` });
  assert.equal(wrongRole.status, 200);
  view = (await call(team(runtimeId), HOST)).body.data;
  assert.deepEqual(view.recentActions.at(-1), { sequence: view.recentActions.at(-1).sequence, eventType: "response-performed", participantId: participant[HOST], missionRole: "OPERATOR" });
  assert.equal(view.runtime.objectiveStates.find((item: any) => item.objectiveId === "respond").status !== "COMPLETED", true, "the Operator's response does not satisfy the Technician objective");

  // Two participants act simultaneously against the same revision: exactly one canonical event lands.
  const current = view.runtime.revision;
  const [inspect, respond] = await Promise.all([
    call(team(runtimeId, "/actions"), HOST, "POST", { expectedRevision: current, eventType: "system-inspected", idempotencyKey: `${RUN}:inspect` }),
    call(team(runtimeId, "/actions"), BRAVO, "POST", { expectedRevision: current, eventType: "response-performed", idempotencyKey: `${RUN}:respond` }),
  ]);
  const statuses = [inspect.status, respond.status].sort();
  assert.deepEqual(statuses, [200, 409], "no lost update: the loser fails safely on the stale revision");
  const loser = inspect.status === 409 ? { user: HOST, body: { eventType: "system-inspected", idempotencyKey: `${RUN}:inspect` } } : { user: BRAVO, body: { eventType: "response-performed", idempotencyKey: `${RUN}:respond` } };
  assert.equal((inspect.status === 409 ? inspect : respond).body.error.code, "MISSION_RUNTIME_REVISION_CONFLICT");
  view = (await call(team(runtimeId), HOST)).body.data;
  assert.equal(view.runtime.status, "ACTIVE", "one role's action alone does not complete the coordinated Mission");
  const winner = inspect.status === 200 ? { user: HOST, body: { eventType: "system-inspected", idempotencyKey: `${RUN}:inspect` }, revision: current } : { user: BRAVO, body: { eventType: "response-performed", idempotencyKey: `${RUN}:respond` }, revision: current };
  const eventsBefore = (await runtimeService.listEvents(actorOf(HOST), runtimeId)).length;
  const retry = await call(team(runtimeId, "/actions"), winner.user, "POST", { expectedRevision: winner.revision, ...winner.body });
  assert.deepEqual([retry.status, retry.body.data.replayed], [200, true], "a retry of a successful action replays, even with its original (now stale) revision");
  assert.equal((await runtimeService.listEvents(actorOf(HOST), runtimeId)).length, eventsBefore, "no duplicate canonical event");
  const conflicting = await call(team(runtimeId, "/actions"), winner.user, "POST", { expectedRevision: view.runtime.revision, eventType: winner.body.eventType, payload: { different: true }, idempotencyKey: winner.body.idempotencyKey });
  assert.equal(conflicting.body.error.code, "MISSION_TEAM_ACTION_KEY_REUSED");
  // Stash the loser's action for the acceptance flow below.
  (globalThis as any).__phase5Pending = loser;
});

// ---------------------------------------------------------------- non-learner sources cannot satisfy team objectives

test("17/18/19 world context, Director events and NPC actions cannot satisfy role-attributed team objectives", async () => {
  const events = await runtimeService.listEvents(actorOf(HOST), runtimeId);
  assert.equal(events[0].eventType, "MISSION_WORLD_CONTEXT_CAPTURED", "MOL context is present but never progression");
  const before = await runtimeService.get(actorOf(HOST), runtimeId);
  const pendingRole = (globalThis as any).__phase5Pending.body.eventType === "system-inspected" ? "inspect" : "respond";
  // Director cannot emit role events through policy…
  const emitted = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({ action: { type: "EMIT_DECLARED_EVENT", eventType: (globalThis as any).__phase5Pending.body.eventType } }))
    .direct(actorOf(HOST), runtimeId, { expectedRevision: before.revision, idempotencyKey: `${RUN}:director-emit` });
  assert.equal(emitted.rejectionReason, "EVENT_NOT_DECLARED");
  // …and even an event forced past policy carries no participant attribution, so the objective stays open.
  const forced = await runtimeService.applyDirectorAction(actorOf(HOST), runtimeId, before.revision, { type: "EMIT_DECLARED_EVENT", eventType: (globalThis as any).__phase5Pending.body.eventType, payload: {} } as any, {
    idempotencyKey: `${RUN}:director-forced`, capability: "missionDirector", proposal: {}, executorKind: "FIXTURE", providerExecutionRef: null, policyVersion: "test", contextDigest: "0".repeat(64),
  });
  assert.notEqual(forced.objectiveStates.find((item) => item.objectiveId === pendingRole)!.status, "COMPLETED");
  const npc = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({ action: { type: "CHARACTER_SPEAK", characterId: "shift-supervisor", lineId: "check-power" } }))
    .direct(actorOf(HOST), runtimeId, { expectedRevision: forced.revision, idempotencyKey: `${RUN}:npc` });
  assert.equal(npc.status, "APPLIED");
  assert.notEqual(npc.runtime.objectiveStates.find((item) => item.objectiveId === pendingRole)!.status, "COMPLETED");
  assert.equal(npc.runtime.status, "ACTIVE");
  // Learner single-player path is closed for team Missions.
  await assert.rejects(runtimeService.appendEvent(actorOf(HOST), runtimeId, { expectedRevision: npc.runtime.revision, sequence: 99, eventType: "system-inspected" }),
    (error: any) => error.code === "MISSION_RUNTIME_TEAM_ACTION_REQUIRED");
});

// ---------------------------------------------------------------- Director boundary

test("Director receives a bounded team summary and no participant identities or accommodations", async () => {
  const session = await runtimeService.get(actorOf(HOST), runtimeId);
  const executor = new CapturingExecutor({ action: { type: "ADAPT_DIFFICULTY", tier: "INTERMEDIATE" } });
  const result = await new MissionDirectorService(runtimeService, executor).direct(actorOf(HOST), runtimeId, { expectedRevision: session.revision, idempotencyKey: `${RUN}:director-team` });
  assert.equal(result.status, "APPLIED", "adaptive difficulty still works in team Missions");
  assert.deepEqual(executor.seen!.team, { teamStatus: "ACTIVE", teamSize: 2, rolesPresent: ["OPERATOR", "TECHNICIAN"], readyCount: 2 });
  const serialized = JSON.stringify(executor.seen);
  for (const hidden of [HOST, BRAVO, ORG, "@test.invalid", participant[HOST], participant[BRAVO], "actionKey", "accommodat", "diagnosis", "timingAdjustment"]) {
    assert.equal(serialized.includes(hidden), false, hidden);
  }
  assert.ok(executor.seen!.recentEvents.some((event) => (event.payload as any).participant?.missionRole), "team actions keep only their mission role");
  const branch = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({ action: { type: "SELECT_SCENARIO_BRANCH", branchId: "cooling-fault" } }))
    .direct(actorOf(HOST), runtimeId, { expectedRevision: result.runtime.revision, idempotencyKey: `${RUN}:branch` });
  assert.equal(branch.status, "APPLIED", "branching still works in team Missions");
  assert.equal(branch.runtime.objectiveStates.find((item) => item.objectiveId === "fault-branch")!.status, "COMPLETED");
});

// ---------------------------------------------------------------- accommodation, MOL/MOCC projection

test("25/26/27 accommodations stay private; MOL/MOCC projections are bounded, read-only and learner-minimized", async () => {
  const bravoView = JSON.stringify((await call(team(runtimeId), BRAVO)).body.data);
  for (const hidden of ["accommodat", "diagnosis", "timingAdjustment", "MISSION_ACCOMMODATION_PROJECTED", "MISSION_WORLD_CONTEXT_CAPTURED", HOST, BRAVO, "@test.invalid"]) {
    assert.equal(bravoView.includes(hidden), false, `teammate view leaks ${hidden}`);
  }
  const projection = await teamService.operationalProjection({ organizationId: ORG, tenantId: `tenant:${ORG}` });
  assert.deepEqual([projection.missionAuthority, projection.membershipAuthority, projection.containsLearnerIdentity, projection.containsAccommodationData], [false, false, false, false]);
  assert.equal(MISSION_TEAM_OPERATIONAL_CONTRACT.missionAuthority, false);
  const row = projection.teams.find((item: any) => item.missionId === missions.team)!;
  assert.deepEqual([row.teamStatus, row.missionStatus, row.participantCount, row.roleDistribution], ["ACTIVE", "ACTIVE", 2, { OPERATOR: 1, TECHNICIAN: 1 }]);
  assert.deepEqual(row.environmentRefs.map((ref: any) => ref.environmentId), ["main-data-center", "cooling-mechanical-plant"], "canonical destination references, no new location registry");
  const serialized = JSON.stringify(projection);
  for (const hidden of [HOST, BRAVO, participant[HOST], participant[BRAVO], "@test.invalid", "accommodat", "user"]) assert.equal(serialized.includes(hidden), false, hidden);
});

// ---------------------------------------------------------------- publication retirement + completion + evidence

test("23/24/20/21 runtime continues after retirement; coordinated completion; team result is not individual Evidence", async () => {
  const frozen = (await runtimeService.get(actorOf(HOST), runtimeId)).definitionSnapshot;
  assert.equal((await call(`/studio/missions/releases/${releases.team}/retire`, PUBLISHER, "POST", { retirementNote: "Phase 5 retirement" })).status, 200);
  assert.equal((await call("/arcade/mission-runtimes", BRAVO, "POST", { missionId: missions.team, missionVersion: 1, idempotencyKey: `${RUN}:after-retire` })).status, 404);
  await assert.rejects(query("UPDATE mission_published_releases SET definition_snapshot = definition_snapshot || '{\"title\":\"x\"}'::jsonb WHERE release_id=$1", [releases.team]));

  const pending = (globalThis as any).__phase5Pending;
  const session = await runtimeService.get(actorOf(HOST), runtimeId);
  const done = await call(team(runtimeId, "/actions"), pending.user, "POST", { expectedRevision: session.revision, ...pending.body });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(done.body.data.runtime.status, "SUCCEEDED", "the coordinated condition completes through the canonical engine");
  const view = (await call(team(runtimeId), HOST)).body.data;
  assert.equal(view.team.status, "COMPLETED");
  assert.deepEqual((await runtimeService.get(actorOf(HOST), runtimeId)).definitionSnapshot, frozen, "frozen definition unchanged");

  const completed = await runtimeService.get(actorOf(HOST), runtimeId);
  const candidate = describeMissionEvidenceCandidate(completed, await runtimeService.listEvents(actorOf(HOST), runtimeId));
  assert.equal(candidate.canBecomeEvidenceCandidate, true);
  assert.equal(candidate.isVerifiedEvidence, false);
  assert.deepEqual([candidate.provenance.team!.scope, candidate.provenance.team!.individualEvidenceInferred], ["TEAM_PERFORMANCE", false]);
  const demonstration = Object.fromEntries(candidate.provenance.team!.individualDemonstration.map((item) => [item.missionRole, item.actionCount]));
  assert.deepEqual(demonstration, { OPERATOR: 2, TECHNICIAN: 1 }, "each participant's own attributed actions only");
  assert.ok(candidate.provenance.learnerActionRefs.every((ref: any) => ref.participantId && ref.missionRole));
  assert.deepEqual(await institutionalCounts(), institutionalBaseline, "no Evidence, Truth, credential, mastery, career, membership or identity writes");
  assert.equal((await call(team(runtimeId, "/actions"), HOST, "POST", { expectedRevision: completed.revision, eventType: "system-inspected", idempotencyKey: `${RUN}:late` })).body.error.code, "MISSION_TEAM_NOT_ACTIVE");
});

// ---------------------------------------------------------------- replay / audit

test("22 replay reconstructs the multiplayer sequence from canonical records without side effects", async () => {
  const originalFetch = globalThis.fetch;
  let external = 0;
  const history = (await call(team(runtimeId, "/history"), HOST)).body.data;
  globalThis.fetch = (async () => { external += 1; throw new Error("no network during replay"); }) as typeof fetch;
  try {
    const types = history.map((event: any) => event.eventType);
    assert.equal(types[0], "TEAM_CREATED");
    for (const required of ["PARTICIPANT_JOINED", "PARTICIPANT_LEFT", "PARTICIPANT_REJOINED", "PARTICIPANT_REMOVED", "PARTICIPANT_READY", "TEAM_ACTIVATED", "TEAM_COMPLETED"]) assert.ok(types.includes(required), required);
    assert.deepEqual(history.map((event: any) => event.sequence), history.map((_: any, index: number) => index + 1), "ordered, gap-free team history");
    const revisions = history.map((event: any) => event.observedRuntimeRevision);
    assert.deepEqual(revisions, [...revisions].sort((a: number, b: number) => a - b), "team history is ordered against runtime revisions");
    const events = await runtimeService.listEvents(actorOf(HOST), runtimeId);
    const attributed = events.filter((event) => (event.payload as any).participant?.attributedBy === "MISSION_TEAM");
    assert.equal(attributed.length, 3, "every learner action is a participant-attributed canonical event");
    assert.ok(events.filter((event) => (event.payload as any).emittedBy === "MISSION_DIRECTOR").length >= 1, "Director-emitted events are marked and distinguishable");
    const roles = new Set(attributed.map((event) => (event.payload as any).participant.missionRole));
    assert.deepEqual([...roles].sort(), ["OPERATOR", "TECHNICIAN"]);
    const decisions = (await query("SELECT decision_status FROM mission_director_decisions WHERE mission_runtime_session_id=$1", [runtimeId])).rows;
    assert.ok(decisions.some((row: any) => row.decision_status === "APPLIED"));
    // Re-reading the record changes nothing.
    const counts = await residueCounts([ORG]);
    await call(team(runtimeId), HOST);
    await call(team(runtimeId, "/history"), BRAVO);
    assert.deepEqual(await residueCounts([ORG]), counts);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(external, 0);
});

test("disband: a forming team can be disbanded by its host only", async () => {
  const spare = await call("/arcade/mission-runtimes", BRAVO, "POST", { missionId: missions.spare, missionVersion: 1, idempotencyKey: `${RUN}:spare` });
  spareRuntimeId = spare.body.data.session.id;
  await call(team(spareRuntimeId), BRAVO, "POST", { missionRole: "TECHNICIAN" });
  await call(team(spareRuntimeId, "/join"), CHARLIE, "POST", { missionRole: "OPERATOR" });
  assert.equal((await call(team(spareRuntimeId, "/disband"), CHARLIE, "POST", {})).body.error.code, "MISSION_TEAM_HOST_REQUIRED");
  const disbanded = await call(team(spareRuntimeId, "/disband"), BRAVO, "POST", {});
  assert.equal(disbanded.body.data.team.status, "DISBANDED");
  assert.equal((await call(team(spareRuntimeId, "/join"), DELTA, "POST", { missionRole: "OBSERVER" })).body.error.code, "MISSION_TEAM_NOT_JOINABLE");
});

// ---------------------------------------------------------------- architecture guards

function sources(dir: string): Array<[string, string]> {
  const root = new URL(dir, import.meta.url);
  return readdirSync(root).flatMap((name) => {
    const path = new URL(name, root);
    if (statSync(path).isDirectory()) return sources(`${dir}${name}/`);
    return /\.ts$/.test(name) ? [[`${dir}${name}`, readFileSync(path, "utf8")] as [string, string]] : [];
  });
}

test("28/29 no second Mission state machine, no second map/spatial registry, no foreign writes from multiplayer", () => {
  for (const [file, source] of sources("../src/domain/mission-team/")) {
    for (const [, table] of source.matchAll(/\b(?:INSERT INTO|DELETE FROM)\s+([a-z_]+)|\bUPDATE\s+([a-z_]+)\s+SET\b/g)) {
      if (table) assert.match(table, /^mission_team/, `${file} writes ${table}`);
    }
    for (const [, , table] of source.matchAll(/\b(INSERT INTO|DELETE FROM)\s+([a-z_]+)/g)) assert.match(table, /^mission_team/, `${file} writes ${table}`);
    for (const [, table] of source.matchAll(/\bUPDATE\s+([a-z_]+)\s+SET\b/g)) assert.match(table, /^mission_team/, `${file} updates ${table}`);
    assert.doesNotMatch(source, /evaluateMissionCondition|advance\(|objectiveStates\s*=|mission_runtime_sessions|mission_runtime_events/, `${file} must not progress Missions`);
    assert.doesNotMatch(source, /CoordinateSpaceRegistry|CANONICAL_DESTINATION_IDS\s*=|MiniMap|QuickMap|verified-evidence|truth|credential|accommodation_cases|authorized_accommodations/i, file);
  }
});

test("blocker regression: a Director-emitted declared event is never counted as a learner action in evidence provenance", async () => {
  const definition = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  definition.status = "PUBLISHED";
  definition.missionId = `${RUN}:director-emit`;
  definition.aiCapabilities = { missionDirector: true, adaptiveDifficulty: false, npcDialogue: false, scenarioVariation: true };
  const started = await runtimeService.start(actorOf(DELTA), definition, { idempotencyKey: `${RUN}:director-emit` });
  const id = started.session!.id;
  await assert.rejects(runtimeService.appendEvent(actorOf(DELTA), id, { expectedRevision: 1, sequence: 1, eventType: "objective-observed", payload: { emittedBy: "MISSION_DIRECTOR" } }),
    (error: any) => error.code === "MISSION_RUNTIME_EVENT_PAYLOAD_INVALID", "learners cannot forge the Director origin");
  const emitted = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({ action: { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed" } }))
    .direct(actorOf(DELTA), id, { expectedRevision: 1, idempotencyKey: `${RUN}:director-emit-decision` });
  assert.deepEqual([emitted.status, emitted.runtime.status], ["APPLIED", "SUCCEEDED"]);
  const events = await runtimeService.listEvents(actorOf(DELTA), id);
  assert.equal((events.at(-1)!.payload as any).emittedBy, "MISSION_DIRECTOR");
  const candidate = describeMissionEvidenceCandidate(await runtimeService.get(actorOf(DELTA), id), events);
  assert.deepEqual(candidate.provenance.learnerActionRefs, []);
  assert.equal(candidate.canBecomeEvidenceCandidate, false, "a Director-completed run is not a learner evidence candidate");
});

// ---------------------------------------------------------------- schema / declaration correctness

test("PostgreSQL itself rejects team, participant and event rows whose scope contradicts their owner", async () => {
  // A fresh runtime (owner DELTA) with no team, plus the existing teams as references.
  const fresh = await runtimeService.start(actorOf(DELTA), (() => { const d = structuredClone(MISSION_DEFINITION_FIXTURES[0]); d.status = "PUBLISHED"; d.missionId = `${RUN}:sql`; return d; })(), { idempotencyKey: `${RUN}:sql` });
  const freshId = fresh.session!.id;
  const teamA = (await query("SELECT * FROM mission_teams WHERE mission_runtime_id=$1", [runtimeId])).rows[0];
  const teamB = (await query("SELECT * FROM mission_teams WHERE mission_runtime_id=$1", [spareRuntimeId])).rows[0];
  const participantB = (await query("SELECT participant_id FROM mission_team_participants WHERE mission_team_id=$1 LIMIT 1", [teamB.mission_team_id])).rows[0].participant_id;
  const reject = async (sql: string, params: unknown[], pattern: RegExp, label: string) => {
    await assert.rejects(query(sql, params), (error: any) => { assert.match(String(error.message), pattern, label); return true; }, label);
  };
  const insertTeam = "INSERT INTO mission_teams (mission_team_id, organization_id, tenant_id, mission_runtime_id, host_user_id) VALUES ($1,$2,$3,$4,$5)";

  // Team ↔ runtime: organization/tenant/owner must match the runtime.
  await reject(insertTeam, [`${RUN}:t1`, OTHER_ORG, `tenant:${OTHER_ORG}`, freshId, OUTSIDER], /must match its Mission Runtime/, "cross-org team");
  await reject(insertTeam, [`${RUN}:t2`, ORG, `tenant:${ORG}`, freshId, BRAVO], /must match its Mission Runtime/, "host is not the runtime owner");
  await reject(insertTeam, [`${RUN}:t3`, ORG, `tenant:${ORG}`, "mission_runtime_missing", DELTA], /must match its Mission Runtime|violates foreign key/, "unknown runtime");
  await reject("UPDATE mission_teams SET mission_runtime_id=$2 WHERE mission_team_id=$1", [teamA.mission_team_id, freshId], /immutable/, "team scope cannot be rewritten");
  await reject("UPDATE mission_teams SET host_user_id=$2 WHERE mission_team_id=$1", [teamA.mission_team_id, BRAVO], /immutable/, "team host cannot be rewritten");

  // Participant ↔ team: copied organization/tenant/runtime must equal the owning team's.
  const insertParticipant = `INSERT INTO mission_team_participants (participant_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, user_id, mission_role)
    VALUES ($1,$2,$3,$4,$5,$6,'OBSERVER')`;
  await reject(insertParticipant, [`${RUN}:p1`, teamA.mission_team_id, OTHER_ORG, `tenant:${OTHER_ORG}`, runtimeId, OUTSIDER], /mission_team_participants_team_scope_fk/, "cross-org participant");
  await reject(insertParticipant, [`${RUN}:p2`, teamA.mission_team_id, ORG, `tenant:${ORG}`, spareRuntimeId, DELTA], /mission_team_participants_team_scope_fk/, "cross-runtime participant");
  await reject(insertParticipant, [`${RUN}:p3`, teamA.mission_team_id, ORG, `tenant:${OTHER_ORG}`, runtimeId, DELTA], /violates check constraint|team_scope_fk/, "cross-tenant participant");
  await reject(insertParticipant, [`${RUN}:p4`, "mission_team_missing", ORG, `tenant:${ORG}`, runtimeId, DELTA], /mission_team_participants_team_scope_fk/, "unknown team");

  // Event ↔ team and event ↔ participant.
  const insertEvent = `INSERT INTO mission_team_events (mission_team_event_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, sequence, event_type, participant_id, observed_runtime_revision)
    VALUES ($1,$2,$3,$4,$5,999,'PARTICIPANT_READY',$6,1)`;
  await reject(insertEvent, [`${RUN}:e1`, teamA.mission_team_id, OTHER_ORG, `tenant:${OTHER_ORG}`, runtimeId, null], /mission_team_events_team_scope_fk/, "cross-org event");
  await reject(insertEvent, [`${RUN}:e2`, teamA.mission_team_id, ORG, `tenant:${ORG}`, spareRuntimeId, null], /mission_team_events_team_scope_fk/, "cross-runtime event");
  await reject(insertEvent, [`${RUN}:e3`, teamA.mission_team_id, ORG, `tenant:${OTHER_ORG}`, runtimeId, null], /violates check constraint|team_scope_fk/, "cross-tenant event");
  await reject(insertEvent, [`${RUN}:e4`, teamA.mission_team_id, ORG, `tenant:${ORG}`, runtimeId, participantB], /mission_team_events_participant_same_team_fk/, "participant from another team");
  // A consistent row is accepted by the same statements (the constraints are precise, not blanket).
  await query(insertEvent, [`${RUN}:e5`, teamA.mission_team_id, ORG, `tenant:${ORG}`, runtimeId, participant[HOST]]);
});

test("role capacity must be able to seat minParticipants; maxParticipants stays an upper bound", () => {
  const withRoles = (min: number, max: number, capacities: unknown[]) => {
    const value = teamDefinition(`${RUN}:capacity`);
    value.status = "PUBLISHED";
    value.objectives = value.objectives.filter((objective) => objective.objectiveId === "fault-branch").map((objective) => ({ ...objective, order: 1, required: true }));
    value.stages[0].objectiveIds = ["fault-branch"];
    value.stages[0].exitConditions = [];
    value.successConditions = [{ type: "OBJECTIVE_COMPLETE", objectiveId: "fault-branch" }];
    value.multiplayer!.minParticipants = min;
    value.multiplayer!.maxParticipants = max;
    value.multiplayer!.roles = capacities.map((capacity, index) => ({ roleId: `ROLE_${String.fromCharCode(65 + index)}`, label: `Role ${index}`, required: false, maxParticipants: capacity as number }));
    return validateMissionDefinition(value).join("; ");
  };
  assert.match(withRoles(4, 4, [1, 1]), /declared role capacity \(2\) cannot seat minParticipants \(4\)/, "capacity below min");
  assert.equal(withRoles(2, 4, [1, 1]), "", "capacity exactly min");
  assert.equal(withRoles(2, 4, [2, 2]), "", "capacity above min within bounds");
  assert.equal(withRoles(3, 3, [8, 1]), "", "role capacity may exceed maxParticipants, which stays the team bound");
  assert.match(withRoles(2, 4, [0, 1]), /maxParticipants is invalid/, "zero capacity rejected");
  assert.match(withRoles(2, 4, [9, 1]), /maxParticipants is invalid/, "capacity above system max rejected");
  assert.match(withRoles(2, 4, ["2", 1]), /maxParticipants is invalid/, "non-integer capacity rejected");
  const fractional = withRoles(2, 4, [1.5, 1]);
  assert.match(fractional, /maxParticipants is invalid/, "fractional capacity rejected");
  assert.match(fractional, /declared role capacity \(1\) cannot seat minParticipants \(2\)/, "a malformed capacity is never counted as seats");
});

test("team-event history: participants cannot be deleted out from under history; runtime/team deletion still cleans up everything", async () => {
  // 1. Real team + participant + events through the service.
  const started = await call("/arcade/mission-runtimes", DELTA, "POST", { missionId: missions.spare, missionVersion: 1, idempotencyKey: `${RUN}:fk-history` });
  assert.equal(started.status, 201, JSON.stringify(started.body));
  const historyRuntime = started.body.data.session.id;
  const formed = await call(team(historyRuntime), DELTA, "POST", { missionRole: "OPERATOR" });
  const teamId = formed.body.data.team.teamId;
  const joined = await call(team(historyRuntime, "/join"), CHARLIE, "POST", { missionRole: "TECHNICIAN" });
  const charlieParticipant = joined.body.data.self.participantId;
  const referencing = Number((await query("SELECT COUNT(*)::int AS count FROM mission_team_events WHERE participant_id=$1", [charlieParticipant])).rows[0].count);
  assert.ok(referencing >= 1, "the participant is referenced by retained history");

  // 2. Direct deletion of a participant referenced by history is rejected by PostgreSQL.
  await assert.rejects(query("DELETE FROM mission_team_participants WHERE participant_id=$1", [charlieParticipant]),
    (error: any) => { assert.match(String(error.message), /mission_team_events_participant_same_team_fk/); return true; });
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_team_events WHERE participant_id=$1", [charlieParticipant])).rows[0].count), referencing, "history intact");

  // 3. Normal LEFT / REMOVED status transitions still work (no physical delete).
  assert.equal((await call(team(historyRuntime, "/leave"), CHARLIE, "POST", {})).status, 200);
  assert.equal((await query("SELECT status FROM mission_team_participants WHERE participant_id=$1", [charlieParticipant])).rows[0].status, "LEFT");
  await call(team(historyRuntime, "/join"), CHARLIE, "POST", { missionRole: "TECHNICIAN" });
  assert.equal((await call(team(historyRuntime, `/participants/${charlieParticipant}/remove`), DELTA, "POST", {})).status, 200);
  assert.equal((await query("SELECT status FROM mission_team_participants WHERE participant_id=$1", [charlieParticipant])).rows[0].status, "REMOVED");

  // 5. Cross-team participant references remain rejected.
  const otherParticipant = (await query("SELECT participant_id FROM mission_team_participants WHERE mission_runtime_id=$1 LIMIT 1", [runtimeId])).rows[0].participant_id;
  await assert.rejects(query(`INSERT INTO mission_team_events (mission_team_event_id, mission_team_id, organization_id, tenant_id, mission_runtime_id, sequence, event_type, participant_id, observed_runtime_revision)
    VALUES ($1,$2,$3,$4,$5,998,'PARTICIPANT_READY',$6,1)`, [`${RUN}:cross`, teamId, ORG, `tenant:${ORG}`, historyRuntime, otherParticipant]), /mission_team_events_participant_same_team_fk/);

  // 4/6. Deleting the owning Mission Runtime cascades team, participants and all team events; no orphans remain.
  await query("DELETE FROM mission_runtime_sessions WHERE mission_runtime_id=$1", [historyRuntime]);
  for (const [table, column, value] of [["mission_teams", "mission_team_id", teamId], ["mission_team_participants", "mission_team_id", teamId], ["mission_team_events", "mission_team_id", teamId]] as const) {
    assert.equal(Number((await query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${column}=$1`, [value])).rows[0].count), 0, `${table} cleaned`);
  }
  const orphans = await query(`SELECT
    (SELECT COUNT(*)::int FROM mission_team_events e WHERE NOT EXISTS (SELECT 1 FROM mission_teams t WHERE t.mission_team_id=e.mission_team_id)) AS events_without_team,
    (SELECT COUNT(*)::int FROM mission_team_events e WHERE e.participant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mission_team_participants p WHERE p.participant_id=e.participant_id)) AS events_without_participant,
    (SELECT COUNT(*)::int FROM mission_team_participants p WHERE NOT EXISTS (SELECT 1 FROM mission_teams t WHERE t.mission_team_id=p.mission_team_id)) AS participants_without_team`);
  assert.deepEqual(orphans.rows[0], { events_without_team: 0, events_without_participant: 0, participants_without_team: 0 });

  // Deleting a team directly (team lifecycle) also cascades its whole history in one statement.
  const teamRow = (await query("SELECT mission_team_id FROM mission_teams WHERE mission_runtime_id=$1", [spareRuntimeId])).rows[0];
  await query("DELETE FROM mission_teams WHERE mission_team_id=$1", [teamRow.mission_team_id]);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_team_events WHERE mission_team_id=$1", [teamRow.mission_team_id])).rows[0].count), 0);
  assert.equal(Number((await query("SELECT COUNT(*)::int AS count FROM mission_team_participants WHERE mission_team_id=$1", [teamRow.mission_team_id])).rows[0].count), 0);
});
