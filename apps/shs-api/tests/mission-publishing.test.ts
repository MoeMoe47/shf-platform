import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import express from "express";
import type { Server } from "node:http";
import { query } from "../src/db/client.js";
import { withTransaction } from "../src/db/transaction.js";
import { registerMissionDraftRoutes } from "../src/domain/mission-content/api/mission-draft-routes.js";
import { registerMissionPublicationRoutes } from "../src/domain/mission-content/api/mission-publication-routes.js";
import { PersistedPublishedMissionResolver } from "../src/domain/mission-content/catalog/published-mission-catalog.js";
import { MISSION_DEFINITION_FIXTURES } from "../src/domain/mission-content/fixtures/mission-definition-fixtures.js";
import { registerMissionRuntimeRoutes } from "../src/domain/mission-runtime/api/routes.js";
import { MissionRuntimeService } from "../src/domain/mission-runtime/service/mission-runtime-service.js";
import { MissionRuntimeStartService } from "../src/domain/mission-runtime/service/mission-runtime-start-service.js";
import { MissionDirectorService } from "../src/domain/mission-director/service/mission-director-service.js";
import { FixtureMissionDirectorExecutor } from "../src/domain/mission-director/service/mission-director-executor.js";

const RUN = `mission_pub_${Date.now()}`;
const ORG = `org_${RUN}`;
const OTHER_ORG = `other_org_${RUN}`;
const AUTHOR = `author_${RUN}`;
const REVIEWER = `reviewer_${RUN}`;
const PUBLISHER = `publisher_${RUN}`;
const LEARNER = `learner_${RUN}`;
const PASS = (_req: any, _res: any, next: any) => next();
const users: Record<string, any> = {
  [AUTHOR]: { user_id: AUTHOR, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["studio.project.create", "studio.project.view", "studio.project.update", "project.submission.review", "studio.review.queue.view"], roles: ["INSTRUCTOR"] },
  [REVIEWER]: { user_id: REVIEWER, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["project.submission.review", "studio.review.queue.view"], roles: ["REVIEWER"] },
  [PUBLISHER]: { user_id: PUBLISHER, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["curriculum.catalog.publish", "curriculum.catalog.retire"], roles: ["ORG_ADMIN"] },
  [LEARNER]: { user_id: LEARNER, organization_id: ORG, active_organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["arcade.attempt"], roles: ["STUDENT"] },
};
const runtimeService = new MissionRuntimeService();
const publishedResolver = new PersistedPublishedMissionResolver();
const startService = new MissionRuntimeStartService(publishedResolver, runtimeService);
let server: Server;
let base = "";
let draftId = "";
let submissionId = "";
let releaseId = "";
let missionId = `${RUN}:learning`;
let runtimeId = "";

async function cleanup() {
  await withTransaction(async (tx) => {
    await tx.query("ALTER TABLE mission_publication_events DISABLE TRIGGER mission_publication_events_append_only");
    await tx.query("ALTER TABLE mission_published_releases DISABLE TRIGGER mission_published_release_immutable");
    await tx.query("ALTER TABLE mission_review_submissions DISABLE TRIGGER mission_review_submission_snapshot_immutable");
    await tx.query("DELETE FROM mission_publication_events WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("DELETE FROM mission_published_releases WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("DELETE FROM mission_review_submissions WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("DELETE FROM mission_runtime_sessions WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("DELETE FROM mission_definition_drafts WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("DELETE FROM arcade_activities WHERE arcade_activity_id=$1", [`${RUN}:arcade`]);
    await tx.query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[AUTHOR, REVIEWER, PUBLISHER, LEARNER]]);
    await tx.query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[ORG, OTHER_ORG]]);
    await tx.query("ALTER TABLE mission_review_submissions ENABLE TRIGGER mission_review_submission_snapshot_immutable");
    await tx.query("ALTER TABLE mission_published_releases ENABLE TRIGGER mission_published_release_immutable");
    await tx.query("ALTER TABLE mission_publication_events ENABLE TRIGGER mission_publication_events_append_only");
  });
}

async function request(path: string, userId: string, method = "GET", body?: unknown) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { "Content-Type": "application/json", "x-test-user": userId },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}

async function assertDbMutationRejected(operation: () => Promise<unknown>, label: string) {
  await assert.rejects(operation, (error: any) => {
    assert.match(String(error?.message || error), /immutable|retained|cannot be deleted|violates check constraint/i, label);
    return true;
  });
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'nonprofit','active'),($3,$4,$4,'partner','active') ON CONFLICT (organization_id) DO NOTHING`,
    [ORG, RUN, OTHER_ORG, `${RUN} Other`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES ($1,$5,$6,'Mission Author','active','local'),($2,$5,$7,'Mission Reviewer','active','local'),
            ($3,$5,$8,'Mission Publisher','active','local'),($4,$5,$9,'Mission Learner','active','local')
     ON CONFLICT (user_id) DO NOTHING`,
    [AUTHOR, REVIEWER, PUBLISHER, LEARNER, ORG, `${AUTHOR}@test.invalid`, `${REVIEWER}@test.invalid`, `${PUBLISHER}@test.invalid`, `${LEARNER}@test.invalid`],
  );
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => { req.user = users[req.headers["x-test-user"]] || null; next(); });
  registerMissionDraftRoutes(app, { entitlement: PASS });
  registerMissionPublicationRoutes(app, { entitlement: PASS });
  registerMissionRuntimeRoutes(app, { startService });
  server = await new Promise((resolve) => { const listening = app.listen(0, "127.0.0.1", () => resolve(listening)); });
  base = `http://127.0.0.1:${(server.address() as any).port}`;
});

after(async () => {
  server?.closeAllConnections?.();
  if (server) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await cleanup();
});

test("publish lifecycle freezes revision, separates author/reviewer/publisher, resolves exact release, and retirement blocks only new starts", async () => {
  const definition = structuredClone(MISSION_DEFINITION_FIXTURES[0]);
  definition.missionId = missionId;
  definition.slug = `mission-${RUN.replaceAll("_", "-")}-learning`;
  definition.version = 1;
  definition.status = "DRAFT";
  definition.title = "Governed publication acceptance";
  // Phase 4G: the Mission serves an existing canonical Arcade Activity (the Curriculum lesson ↔ Arcade link target).
  await query(
    "INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, created_by_user_id) VALUES ($1,$2,'Mission Arcade Activity','SCENARIO','PASSED_FLAG',$3)",
    [`${RUN}:arcade`, `${RUN.replaceAll("_", "-")}-arcade`, AUTHOR],
  );
  definition.arcadeActivityId = `${RUN}:arcade`;
  definition.aiCapabilities = { missionDirector: true, adaptiveDifficulty: true, npcDialogue: true, scenarioVariation: true };
  // Phase 4F declarative scenario envelope travels draft → review → release → runtime snapshot unchanged.
  definition.difficultyProfile = { tiers: [definition.difficulty, definition.difficulty === "ADVANCED" ? "EXPERT" : "ADVANCED"] };
  definition.characters = [{
    characterId: "trainer", displayName: "Trainer", characterType: "INSTRUCTOR", simulatedRole: "Simulated trainer",
    allowedBehaviors: ["SPEAK"], knowledgeScope: "CURRENT_STAGE", dialogueMode: "SCRIPTED_ONLY",
    scriptedLines: [{ lineId: "hint-1", text: "Look at the indicator lights." }], scenarioFacts: [], availableStageIds: [],
  }];
  definition.scenarioBranching = {
    defaultBranchId: "standard",
    branches: [
      { branchId: "standard", label: "Standard", description: "Nominal conditions.", availableDuringStageIds: [] },
      { branchId: "equipment-fault", label: "Equipment fault", description: "A declared equipment issue.", availableDuringStageIds: [] },
    ],
  };

  const created = await request("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  draftId = created.body.data.draftId;
  const submitted = await request(`/studio/missions/drafts/${draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1, submissionNote: "Frozen review copy" });
  assert.equal(submitted.status, 201);
  submissionId = submitted.body.data.submission.submissionId;
  assert.equal(submitted.body.data.submission.draftRevision, 1);
  assert.equal(submitted.body.data.submission.definition.title, "Governed publication acceptance");
  const repeatedSubmit = await request(`/studio/missions/drafts/${draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1 });
  assert.equal(repeatedSubmit.status, 200);
  assert.equal(repeatedSubmit.body.data.submission.submissionId, submissionId);
  const submittedStart = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId, missionVersion: 1, idempotencyKey: `${RUN}:submitted-only` });
  assert.equal(submittedStart.status, 404);

  const authorQueue = await request("/studio/missions/review/submissions", AUTHOR);
  assert.equal(authorQueue.status, 200, "author fixture has review scope to prove service self-review denial");
  const selfDecision = await request(`/studio/missions/review/submissions/${submissionId}/approve`, AUTHOR, "POST", {});
  assert.equal(selfDecision.status, 403);
  assert.equal(selfDecision.body.error.code, "MISSION_SELF_APPROVAL_FORBIDDEN");
  const wrongOrg = { ...users[REVIEWER], organization_id: OTHER_ORG, active_organization_id: OTHER_ORG, tenant_id: `tenant:${OTHER_ORG}` };
  users[`${REVIEWER}_other`] = wrongOrg;
  users[`${PUBLISHER}_other`] = { ...users[PUBLISHER], organization_id: OTHER_ORG, active_organization_id: OTHER_ORG, tenant_id: `tenant:${OTHER_ORG}` };
  const crossOrg = await request(`/studio/missions/review/submissions/${submissionId}`, `${REVIEWER}_other`);
  assert.equal(crossOrg.status, 404);
  const crossOrgPublish = await request(`/studio/missions/review/submissions/${submissionId}/publish`, `${PUBLISHER}_other`, "POST", {});
  assert.equal(crossOrgPublish.status, 404);
  const queue = await request("/studio/missions/review/submissions", REVIEWER);
  assert.equal(queue.status, 200);
  assert.equal(queue.body.data.items.some((item: any) => item.submissionId === submissionId), true);
  const detail = await request(`/studio/missions/review/submissions/${submissionId}`, REVIEWER);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.validation.valid, true);
  assert.equal("email" in detail.body.data, false);

  const learnerDraftStart = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId, missionVersion: 1, idempotencyKey: `${RUN}:pre-publish` });
  assert.equal(learnerDraftStart.status, 404);
  const approved = await request(`/studio/missions/review/submissions/${submissionId}/approve`, REVIEWER, "POST", { decisionNote: "Validated against the frozen definition." });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.data.submission.status, "APPROVED");
  const approvedNoPublish = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId, missionVersion: 1, idempotencyKey: `${RUN}:approved-only` });
  assert.equal(approvedNoPublish.status, 404);

  const published = await request(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(published.status, 201);
  releaseId = published.body.data.release.releaseId;
  // Learning Arcade → canonical Mission: the activity resolves to this published release by reference only.
  assert.deepEqual(await publishedResolver.listPublishedMissionsForArcadeActivity({ organizationId: ORG, tenantId: `tenant:${ORG}` }, `${RUN}:arcade`),
    [{ missionId, missionVersion: 1, title: "Governed publication acceptance" }]);
  assert.deepEqual(await publishedResolver.listPublishedMissionsForArcadeActivity({ organizationId: OTHER_ORG, tenantId: `tenant:${OTHER_ORG}` }, `${RUN}:arcade`), []);
  assert.equal(published.body.data.release.status, "PUBLISHED");
  assert.equal(published.body.data.release.definition.status, "PUBLISHED");
  assert.equal(await publishedResolver.resolvePublishedMission({ missionId, version: 1 }, { organizationId: OTHER_ORG, tenantId: `tenant:${OTHER_ORG}` }), null);
  const retryPublish = await request(`/studio/missions/review/submissions/${submissionId}/publish`, PUBLISHER, "POST", {});
  assert.equal(retryPublish.status, 200);
  assert.equal(retryPublish.body.data.release.releaseId, releaseId);

  const started = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId, missionVersion: 1, idempotencyKey: `${RUN}:published` });
  assert.equal(started.status, 201);
  runtimeId = started.body.data.session.id;
  assert.equal(started.body.data.session.missionId, missionId);
  assert.equal(started.body.data.session.missionVersion, 1);
  const learnerActor = { user_id: LEARNER, organization_id: ORG, permissions: ["arcade.attempt"] };
  const startedRuntime = await runtimeService.get(learnerActor, runtimeId);
  assert.deepEqual(startedRuntime.definitionSnapshot.characters, definition.characters);
  assert.deepEqual(startedRuntime.definitionSnapshot.difficultyProfile, definition.difficultyProfile);
  assert.deepEqual(startedRuntime.definitionSnapshot.scenarioBranching, definition.scenarioBranching);
  const adapt = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({
    action: { type: "ADAPT_DIFFICULTY", tier: definition.difficultyProfile.tiers[1] },
  })).direct(learnerActor, runtimeId, { expectedRevision: startedRuntime.revision, idempotencyKey: `${RUN}:adapt-published` });
  assert.equal(adapt.status, "APPLIED");
  const invalidCharacter = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({
    action: { type: "CHARACTER_SPEAK", characterId: "trainer", text: "Improvised and unscripted" },
  })).direct(learnerActor, runtimeId, { expectedRevision: adapt.runtime.revision, idempotencyKey: `${RUN}:invalid-character` });
  assert.equal(invalidCharacter.status, "REJECTED");
  assert.equal(invalidCharacter.runtime.revision, adapt.runtime.revision);
  assert.deepEqual(invalidCharacter.runtime.runtimeState, adapt.runtime.runtimeState);

  const draft = await query("SELECT definition_json FROM mission_definition_drafts WHERE draft_id=$1", [draftId]);
  const publishedBeforeEdit = await query("SELECT definition_snapshot FROM mission_published_releases WHERE release_id=$1", [releaseId]);
  const updatedDefinition = { ...draft.rows[0].definition_json, title: "Newer draft revision" };
  const updateDraft = await request(`/studio/missions/drafts/${draftId}`, AUTHOR, "PUT", { expectedRevision: 1, definition: updatedDefinition });
  assert.equal(updateDraft.status, 200);
  const staleResubmit = await request(`/studio/missions/drafts/${draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1 });
  assert.equal(staleResubmit.status, 409);
  assert.equal(staleResubmit.body.error.currentRevision, 2);
  const frozenSubmission = await query("SELECT definition_snapshot FROM mission_review_submissions WHERE submission_id=$1", [submissionId]);
  assert.equal(frozenSubmission.rows[0].definition_snapshot.title, "Governed publication acceptance");
  assert.equal(publishedBeforeEdit.rows[0].definition_snapshot.title, "Governed publication acceptance");
  await assert.rejects(() => query("UPDATE mission_published_releases SET definition_snapshot=$2::jsonb WHERE release_id=$1", [releaseId, JSON.stringify({ ...publishedBeforeEdit.rows[0].definition_snapshot, title: "mutation" })]));
  await query("UPDATE mission_published_releases SET status=status WHERE release_id=$1", [releaseId]);
  await assertDbMutationRejected(
    () => query(
      "UPDATE mission_published_releases SET retired_by_user_id=$2, retired_at=NOW(), retirement_note='premature metadata' WHERE release_id=$1",
      [releaseId, PUBLISHER],
    ),
    "published releases cannot gain retirement metadata without retiring",
  );

  const retirementWithoutNote = await request(`/studio/missions/releases/${releaseId}/retire`, PUBLISHER, "POST", {});
  assert.equal(retirementWithoutNote.status, 400);
  const retired = await request(`/studio/missions/releases/${releaseId}/retire`, PUBLISHER, "POST", { retirementNote: "New Mission version replaces this release." });
  assert.equal(retired.status, 200);
  assert.deepEqual(await publishedResolver.listPublishedMissionsForArcadeActivity({ organizationId: ORG, tenantId: `tenant:${ORG}` }, `${RUN}:arcade`), [], "retired releases are not offered for new starts");
  assert.equal(retired.body.data.release.status, "RETIRED");
  const retiredRelease = await query(
    "SELECT retired_by_user_id, retired_at, retirement_note FROM mission_published_releases WHERE release_id=$1",
    [releaseId],
  );
  assert.equal(retiredRelease.rows[0].retired_by_user_id, PUBLISHER);
  assert.equal(retiredRelease.rows[0].retirement_note, "New Mission version replaces this release.");
  await assertDbMutationRejected(
    () => query("UPDATE mission_published_releases SET status='PUBLISHED' WHERE release_id=$1", [releaseId]),
    "retired releases cannot become published again",
  );
  await assertDbMutationRejected(
    () => query("UPDATE mission_published_releases SET retirement_note='rewritten note' WHERE release_id=$1", [releaseId]),
    "retirement_note cannot be rewritten after retirement",
  );
  await assertDbMutationRejected(
    () => query("UPDATE mission_published_releases SET retired_at=retired_at + INTERVAL '1 minute' WHERE release_id=$1", [releaseId]),
    "retired_at cannot be rewritten after retirement",
  );
  await assertDbMutationRejected(
    () => query("UPDATE mission_published_releases SET retired_by_user_id=$2 WHERE release_id=$1", [releaseId, AUTHOR]),
    "retired_by_user_id cannot be rewritten after retirement",
  );
  await assertDbMutationRejected(
    () => query("DELETE FROM mission_published_releases WHERE release_id=$1", [releaseId]),
    "release rows cannot be deleted",
  );
  const repeatedRetirement = await request(`/studio/missions/releases/${releaseId}/retire`, PUBLISHER, "POST", { retirementNote: "Retry request." });
  assert.equal(repeatedRetirement.status, 200);
  assert.equal(repeatedRetirement.body.data.kind, "IDEMPOTENT");
  const afterRejectedMutations = await query(
    "SELECT retired_by_user_id, retired_at, retirement_note FROM mission_published_releases WHERE release_id=$1",
    [releaseId],
  );
  assert.equal(afterRejectedMutations.rows[0].retired_by_user_id, retiredRelease.rows[0].retired_by_user_id);
  assert.equal(afterRejectedMutations.rows[0].retired_at.toISOString(), retiredRelease.rows[0].retired_at.toISOString());
  assert.equal(afterRejectedMutations.rows[0].retirement_note, retiredRelease.rows[0].retirement_note);
  assert.equal(await publishedResolver.resolvePublishedMission({ missionId, version: 1 }, { organizationId: ORG, tenantId: `tenant:${ORG}` }), null);
  const futureStart = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId, missionVersion: 1, idempotencyKey: `${RUN}:after-retire` });
  assert.equal(futureStart.status, 404);
  const existing = await runtimeService.get({ user_id: LEARNER, organization_id: ORG, permissions: ["arcade.attempt"] }, runtimeId);
  assert.equal(existing.missionId, missionId);
  assert.equal(existing.status, started.body.data.session.status);
  const frozenTitle = existing.definitionSnapshot.title;
  const characterAfterRetirement = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({
    action: { type: "CHARACTER_SPEAK", characterId: "trainer", lineId: "hint-1" },
  })).direct(learnerActor, runtimeId, { expectedRevision: existing.revision, idempotencyKey: `${RUN}:character-after-retirement` });
  assert.equal(characterAfterRetirement.status, "APPLIED");
  const branchAfterRetirement = await new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({
    action: { type: "SELECT_SCENARIO_BRANCH", branchId: "equipment-fault" },
  })).direct(learnerActor, runtimeId, { expectedRevision: characterAfterRetirement.runtime.revision, idempotencyKey: `${RUN}:branch-after-retirement` });
  assert.equal(branchAfterRetirement.status, "APPLIED");
  const replayable = await runtimeService.listEvents(learnerActor, runtimeId);
  assert.deepEqual(replayable.map((event) => event.eventType), ["MISSION_DIFFICULTY_ADAPTED", "MISSION_CHARACTER_SPOKE", "MISSION_SCENARIO_BRANCH_SELECTED"]);
  const director = new MissionDirectorService(runtimeService, new FixtureMissionDirectorExecutor({
    action: { type: "EMIT_DECLARED_EVENT", eventType: "objective-observed", payload: { afterRetirement: true } },
  }));
  const directed = await director.direct({ user_id: LEARNER, organization_id: ORG, permissions: ["arcade.attempt"] }, runtimeId, {
    expectedRevision: branchAfterRetirement.runtime.revision, idempotencyKey: `${RUN}:director-after-retirement`,
  });
  assert.equal(directed.status, "APPLIED");
  assert.equal(directed.runtime.definitionSnapshot.title, frozenTitle);
  assert.equal((await query("SELECT status FROM mission_published_releases WHERE release_id=$1", [releaseId])).rows[0].status, "RETIRED");
  assert.equal(await publishedResolver.resolvePublishedMission({ missionId, version: 1 }, { organizationId: ORG, tenantId: `tenant:${ORG}` }), null);

  const counts = await query(
    `SELECT
      (SELECT COUNT(*)::int FROM mission_publication_events WHERE organization_id=$1 AND mission_id=$2) AS events,
      (SELECT COUNT(*)::int FROM mission_published_releases WHERE release_id=$3) AS releases,
      (SELECT COUNT(*)::int FROM mission_runtime_sessions WHERE organization_id=$1 AND mission_id=$2) AS runtimes`,
    [ORG, missionId, releaseId],
  );
  assert.equal(Number(counts.rows[0].events), 4);
  assert.equal(Number(counts.rows[0].releases), 1);
  assert.equal(Number(counts.rows[0].runtimes), 1);
});

test("rejection requires a note, leaves the draft available, and cannot be published", async () => {
  const definition = structuredClone(MISSION_DEFINITION_FIXTURES[1]);
  definition.missionId = `${RUN}:rejected`;
  definition.slug = `mission-${RUN.replaceAll("_", "-")}-rejected`;
  definition.version = 1;
  definition.status = "DRAFT";
  const created = await request("/studio/missions/drafts", AUTHOR, "POST", { definition });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const draft = created.body.data;
  const submitted = await request(`/studio/missions/drafts/${draft.draftId}/submit`, AUTHOR, "POST", { expectedRevision: 1 });
  assert.equal(submitted.status, 201);
  const id = submitted.body.data.submission.submissionId;
  const noNote = await request(`/studio/missions/review/submissions/${id}/reject`, REVIEWER, "POST", {});
  assert.equal(noNote.status, 400);
  const rejected = await request(`/studio/missions/review/submissions/${id}/reject`, REVIEWER, "POST", { decisionNote: "Please clarify the stage objective mapping." });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.data.submission.status, "REJECTED");
  const publish = await request(`/studio/missions/review/submissions/${id}/publish`, PUBLISHER, "POST", {});
  assert.equal(publish.status, 409);
  const rejectedStart = await request("/arcade/mission-runtimes", LEARNER, "POST", { missionId: definition.missionId, missionVersion: 1, idempotencyKey: `${RUN}:rejected` });
  assert.equal(rejectedStart.status, 404);
  const stillEditable = await request(`/studio/missions/drafts/${draft.draftId}`, AUTHOR);
  assert.equal(stillEditable.status, 200);
  assert.equal(stillEditable.body.data.status, "DRAFT");
});

test("publication lifecycle routes deny learners and cross-organization release access", async () => {
  const learner = await request("/studio/missions/review/submissions", LEARNER);
  assert.equal(learner.status, 403);
  const otherOrgPublisher = { ...users[PUBLISHER], organization_id: OTHER_ORG, active_organization_id: OTHER_ORG, tenant_id: `tenant:${OTHER_ORG}` };
  users[`${PUBLISHER}_other`] = otherOrgPublisher;
  const crossOrgRetire = await request(`/studio/missions/releases/${releaseId}/retire`, `${PUBLISHER}_other`, "POST", { retirementNote: "no access" });
  assert.equal(crossOrgRetire.status, 404);
});
