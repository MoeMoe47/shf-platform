// MET-7 — City Mission integration tests. Real running dev server and
// Postgres — same convention as tests/assignments.security.test.ts and
// tests/curriculum-assignment-binding.test.ts. Proves the mission
// projection reuses real canonical Assignment/Curriculum/Completion
// Policy/Arcade/Enrollment authority end to end, never a second one.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase7_${Date.now()}`;
const IDS = { programA: `program_${RUN}_a`, cohortA: `cohort_${RUN}_a` };

const ADMIN = "user_admin_001"; // org_shf_001, admin-tier
const LEARNER_DIRECT = "user_assignment_technical_001"; // org_shf_001
const LEARNER_COHORT = "user_assignment_networking_001"; // org_shf_001
const LEARNER_NONE = "user_no_assignment_001"; // org_shf_001, no entitlement
const PARTNER_STUDENT = "user_partner_student_001"; // org_partner_001 — cross-org

function authHeader(userId?: string) {
  return userId ? { Authorization: `Bearer dev-token:${userId}` } : {};
}
async function api(path: string, opts: { method?: string; userId?: string; body?: unknown } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: { "Content-Type": "application/json", ...authHeader(opts.userId) },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const createdCourseIds = new Set<string>();
const createdAssignmentIds = new Set<string>();
const createdArcadeActivityIds = new Set<string>();
const createdPolicyIds = new Set<string>();

async function cleanup() {
  const asmtIds = [...createdAssignmentIds];
  if (asmtIds.length) {
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [asmtIds]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [asmtIds]);
  }
  const arcadeIds = [...createdArcadeActivityIds];
  if (arcadeIds.length) {
    await query("DELETE FROM arcade_results WHERE arcade_activity_id = ANY($1::text[])", [arcadeIds]);
    await query("DELETE FROM arcade_attempts WHERE arcade_activity_id = ANY($1::text[])", [arcadeIds]);
    await query("DELETE FROM curriculum_lesson_arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [arcadeIds]);
  }
  const policyIds = [...createdPolicyIds];
  if (policyIds.length) {
    await query("DELETE FROM completion_policy_requirements WHERE policy_id = ANY($1::text[])", [policyIds]);
    await query("DELETE FROM completion_policies WHERE policy_id = ANY($1::text[])", [policyIds]);
  }
  if (arcadeIds.length) {
    await query("DELETE FROM arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [arcadeIds]);
  }
  const courseIds = [...createdCourseIds];
  if (courseIds.length) {
    await query("DELETE FROM curriculum_lesson_completions WHERE curriculum_id IN (SELECT stable_key FROM curriculum_courses WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [courseIds]);
  }
  await query("DELETE FROM enrollments WHERE enrollment_id LIKE $1", [`enr_${RUN}_%`]);
  await query("DELETE FROM cohorts WHERE cohort_id = $1", [IDS.cohortA]);
  await query("DELETE FROM programs WHERE program_id = $1", [IDS.programA]);
}

let dataCenter: { courseId: string; unitId: string; lessonId: string; release: any };
let arcadeActivity: any;
let policyId: string;
let missionAssignment: any;

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status) VALUES ($1, 'org_shf_001', 'MET-7 Program A', 'education', 'active') ON CONFLICT (program_id) DO NOTHING`,
    [IDS.programA],
  );
  await query(
    `INSERT INTO cohorts (cohort_id, organization_id, tenant_id, program_id, name, status, starts_at, ends_at, created_by_user_id)
     VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, 'MET-7 Cohort A', 'ACTIVE', NOW() - INTERVAL '1 day', NOW() + INTERVAL '20 days', $3)
     ON CONFLICT (cohort_id) DO NOTHING`,
    [IDS.cohortA, IDS.programA, ADMIN],
  );
  await withSeedRetry(() =>
    query(
      `INSERT INTO enrollments (enrollment_id, organization_id, tenant_id, learner_user_id, program_id, cohort_id, status, created_by_user_id)
       VALUES ($1, 'org_shf_001', 'tenant:org_shf_001', $2, $3, $4, 'ACTIVE', $5)
       ON CONFLICT (enrollment_id) DO NOTHING`,
      [`enr_${RUN}_cohort`, LEARNER_COHORT, IDS.programA, IDS.cohortA, ADMIN],
    ),
  );

  dataCenter = await publishDataCenterCourse();
  arcadeActivity = await createArcadeActivity("cabling_basics");
  await linkArcadeToLesson(dataCenter.lessonId, arcadeActivity.id);
  policyId = await createArcadePolicy(dataCenter.release, arcadeActivity.id);
  missionAssignment = await createLessonAssignment(dataCenter.release, [{ targetType: "LEARNER", learnerUserId: LEARNER_DIRECT }], policyId);
});

after(async () => {
  await cleanup();
});

async function publishDataCenterCourse(titleSuffix = "") {
  const course = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} Data Center Foundations${titleSuffix}` } });
  assert.equal(course.status, 200, JSON.stringify(course.json));
  const courseId = course.json.data.courseId;
  createdCourseIds.add(courseId);

  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { method: "POST", userId: ADMIN, body: { title: "Unit One", stableKey: "unit-one" } });
  const unitId = unit.json.data.unitId;
  const lesson = await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "What Is a Data Center?", stableKey: "data-center-foundations-introduction" } });
  const lessonId = lesson.json.data.lessonId;

  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 2 } });
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 3 } });
  assert.equal(published.status, 200);
  return { courseId, unitId, lessonId, release: published.json.data.release };
}

async function createArcadeActivity(slug: string) {
  const created = await api("/arcade/activities", {
    method: "POST",
    userId: ADMIN,
    body: { slug: `${RUN}_${slug}`, title: `${RUN} ${slug}`, activityType: "RETRIEVAL", masteryRule: "PASSED_FLAG" },
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));
  createdArcadeActivityIds.add(created.json.data.id);
  return created.json.data;
}

async function linkArcadeToLesson(lessonId: string, arcadeActivityId: string) {
  // No simple public write API exists for curriculum_lesson_arcade_activities
  // outside the curriculum importer flow — direct fixture insert, same
  // convention this suite already uses for programs/cohorts/enrollments.
  await query(
    `INSERT INTO curriculum_lesson_arcade_activities (curriculum_lesson_arcade_activity_id, organization_id, curriculum_lesson_id, arcade_activity_id, sequence)
     VALUES ($1, 'org_shf_001', $2, $3, 1) ON CONFLICT DO NOTHING`,
    [`cla_${RUN}`, lessonId, arcadeActivityId],
  );
}

async function createArcadePolicy(release: any, arcadeActivityId: string) {
  const policy = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "data-center-foundations-introduction" } });
  assert.equal(policy.status, 200, JSON.stringify(policy.json));
  const policyId = policy.json.data.policyId;
  createdPolicyIds.add(policyId);
  const req = await api(`/completion-policies/${policyId}/requirements`, { method: "POST", userId: ADMIN, body: { requirementType: "ARCADE", targetReference: arcadeActivityId, required: true } });
  assert.equal(req.status, 200, JSON.stringify(req.json));
  // addRequirement bumps revision (touchUpdatedAt) — re-read the current
  // revision rather than assuming it's still the creation-time value.
  const current = await api(`/completion-policies/${policyId}`, { userId: ADMIN });
  assert.equal(current.status, 200, JSON.stringify(current.json));
  const activated = await api(`/completion-policies/${policyId}/activate`, { method: "POST", userId: ADMIN, body: { revision: current.json.data.policy.revision } });
  assert.equal(activated.status, 200, JSON.stringify(activated.json));
  return policyId;
}

async function createLessonAssignment(release: any, targets: unknown[], completionPolicyId?: string) {
  const res = await api("/assignments", {
    method: "POST",
    userId: ADMIN,
    body: {
      title: `${RUN} What Is a Data Center?`,
      dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      targets,
      curriculumReleaseId: release.releaseId,
      assignedContentType: "LESSON",
      assignedContentUnitKey: "unit-one",
      assignedContentLessonKey: "data-center-foundations-introduction",
      ...(completionPolicyId ? { completionPolicyId } : {}),
    },
  });
  assert.equal(res.status, 201, JSON.stringify(res.json));
  createdAssignmentIds.add(res.json.data.id);
  return res.json.data;
}

async function missionFor(userId: string, assignmentTitle: string) {
  const list = await api("/metaverse/missions", { userId });
  assert.equal(list.status, 200, JSON.stringify(list.json));
  return list.json.data.items.find((m: any) => m.missionTitle === assignmentTitle);
}

test("MET-7: 1/2. mission list requires authentication (an unresolvable identity is rejected, same as every other protected route)", async () => {
  const noAuth = await api("/metaverse/missions", { userId: "totally_fake_user_id_does_not_exist" });
  assert.equal(noAuth.status, 401);
  assert.equal(noAuth.json.error.code, "AUTH_REQUIRED");
});

test("MET-7: 3/4. a real, targeted assignment appears as a mission for the entitled learner only", async () => {
  const mission = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  assert.ok(mission, "entitled learner must see the mission");
  const other = await missionFor(LEARNER_NONE, missionAssignment.title);
  assert.equal(other, undefined, "non-entitled learner must not see the mission");
});

test("MET-7: 5/6. cross-org access is denied and cannot be forged via a guessed mission id", async () => {
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const cross = await api(`/metaverse/missions/${mine.missionProjectionId}`, { userId: PARTNER_STUDENT });
  assert.equal(cross.status, 404);

  const forged = await api(`/metaverse/missions/miss_${"a".repeat(32)}`, { userId: LEARNER_DIRECT });
  assert.equal(forged.status, 404);
});

test("MET-7: 7. district/facility mapping and the registry activity match come from the canonical MET-2 resolver, not a fabricated location", async () => {
  const mission = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  assert.equal(mission.location.districtId, "data-center-district");
  assert.equal(mission.location.facilityId, "data-center-training-lab");
  assert.equal(mission.location.metaverseActivityId, "data-center-foundations-introduction");
});

test("MET-7: 9/11. a REQUIRED Arcade prerequisite from the real Completion Policy blocks the mission's next action until mastered", async () => {
  const mission = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const arcadeReq = mission.prerequisites.find((p: any) => p.requirementType === "ARCADE");
  assert.ok(arcadeReq, "ARCADE requirement must be surfaced");
  assert.equal(arcadeReq.required, true);
  assert.equal(arcadeReq.satisfied, false);
  assert.equal(mission.nextAction.kind, "PLAY_ARCADE_CHALLENGE");
  assert.equal(mission.nextAction.blockingRequirementType, "ARCADE");
  const relation = mission.arcadeRelations.find((r: any) => r.arcadeActivityId === arcadeActivity.id);
  assert.ok(relation);
  assert.equal(relation.requiredOrRecommended, "REQUIRED");
  assert.equal(relation.masteryAchieved, false);
});

test("MET-7: 10/12. real Arcade mastery (not a client flag) satisfies the prerequisite and unblocks the mission", async () => {
  const attempt = await api("/arcade/attempts", { method: "POST", userId: LEARNER_DIRECT, body: { activityId: arcadeActivity.id } });
  assert.equal(attempt.status, 201, JSON.stringify(attempt.json));
  const result = await api(`/arcade/attempts/${attempt.json.data.id}/result`, { method: "POST", userId: LEARNER_DIRECT, body: { passed: true } });
  assert.equal(result.status, 201, JSON.stringify(result.json));
  assert.equal(result.json.data.masteryAchieved, true);

  const mission = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const arcadeReq = mission.prerequisites.find((p: any) => p.requirementType === "ARCADE");
  assert.equal(arcadeReq.satisfied, true);
  assert.notEqual(mission.nextAction.blockingRequirementType, "ARCADE");
  const relation = mission.arcadeRelations.find((r: any) => r.arcadeActivityId === arcadeActivity.id);
  assert.equal(relation.masteryAchieved, true);
});

test("MET-7: 13/14/15. protected entry independently re-derives BOTH mission eligibility and the MET-3 district/facility unlock — a mission being AVAILABLE never bypasses MET-3's own gate, and a non-entitled learner gets 404 either way", async () => {
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const entered = await api(`/metaverse/missions/${mine.missionProjectionId}/enter`, { method: "POST", userId: LEARNER_DIRECT, body: {} });
  assert.equal(entered.status, 403, JSON.stringify(entered.json));
  assert.equal(entered.json.data.mission.missionStatus, "AVAILABLE", "the mission's own assignment-derived status is available");
  assert.equal(entered.json.data.can_enter, false, "MET-3's independent district/facility enrollment gate still denies entry — mission eligibility never overrides it");
  assert.equal(entered.json.data.entry.decision.reason_code, "NOT_ENROLLED");
  assert.equal(entered.json.data.entry.resource.district_id, "data-center-district");

  const bypass = await api(`/metaverse/missions/${mine.missionProjectionId}/enter`, { method: "POST", userId: LEARNER_NONE, body: {} });
  assert.equal(bypass.status, 404);

  const progressBefore = await api(`/assignments/${missionAssignment.id}`, { userId: LEARNER_DIRECT });
  assert.equal(progressBefore.json.data.progress.completed, 0, "entering a mission must never itself mark curriculum progress complete");
});

test("MET-7: 16. an activity_completed mission event is an operational fact only — it never marks assessment/lesson completion", async () => {
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const before = (await query("SELECT COUNT(*)::int AS n FROM curriculum_lesson_completions WHERE user_id=$1 AND curriculum_id=$2", [LEARNER_DIRECT, "data-center-foundations"])).rows[0].n;
  const evt = await api(`/metaverse/missions/${mine.missionProjectionId}/events`, { method: "POST", userId: LEARNER_DIRECT, body: { event: "activity_completed" } });
  assert.equal(evt.status, 200, JSON.stringify(evt.json));
  const after = (await query("SELECT COUNT(*)::int AS n FROM curriculum_lesson_completions WHERE user_id=$1 AND curriculum_id=$2", [LEARNER_DIRECT, "data-center-foundations"])).rows[0].n;
  assert.equal(after, before);
});

test("MET-7: 17. a lesson-scoped mission has no canonical submission authority — submit is honestly refused, not silently accepted", async () => {
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const submitted = await api(`/metaverse/missions/${mine.missionProjectionId}/submit`, { method: "POST", userId: LEARNER_DIRECT, body: {} });
  assert.equal(submitted.status, 409);
  assert.equal(submitted.json.error.code, "MISSION_SUBMISSION_NOT_SUPPORTED");
});

test("MET-7: 23. an archived (removed) assignment invalidates its mission projection", async () => {
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const archived = await api(`/assignments/${missionAssignment.id}`, { method: "PATCH", userId: ADMIN, body: { status: "archived" } });
  assert.equal(archived.status, 200, JSON.stringify(archived.json));
  const gone = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  assert.equal(gone, undefined);
  const direct = await api(`/metaverse/missions/${mine.missionProjectionId}`, { userId: LEARNER_DIRECT });
  assert.equal(direct.status, 404);
  // restore for any later test in this file
  await api(`/assignments/${missionAssignment.id}`, { method: "PATCH", userId: ADMIN, body: { status: "published" } });
});

test("MET-7: 21. revoked/withdrawn enrollment blocks a cohort-targeted mission", async () => {
  const { release } = await publishDataCenterCourse(" Cohort Variant");
  const cohortAssignment = await createLessonAssignment(release, [{ targetType: "COHORT", cohortId: IDS.cohortA }]);
  const before = await missionFor(LEARNER_COHORT, cohortAssignment.title);
  assert.ok(before, "actively enrolled cohort member must see the mission");

  await query("UPDATE enrollments SET status='WITHDRAWN' WHERE enrollment_id=$1", [`enr_${RUN}_cohort`]);
  const after = await missionFor(LEARNER_COHORT, cohortAssignment.title);
  assert.equal(after, undefined, "withdrawn enrollment must remove mission visibility");

  await query("UPDATE enrollments SET status='ACTIVE' WHERE enrollment_id=$1", [`enr_${RUN}_cohort`]);
  const restored = await missionFor(LEARNER_COHORT, cohortAssignment.title);
  assert.ok(restored, "reactivated enrollment must restore mission visibility");
});

test("MET-7: 6. client cannot forge assignment/student/org ownership via request body or query — the server always derives identity from req.user", async () => {
  const forgedBody = {
    student_id: "user_admin_001",
    user_id: "user_admin_001",
    userId: "user_admin_001",
    organization_id: "org_other",
    organizationId: "org_other",
    assignment_id: "asmt_does_not_exist",
    assignmentId: "asmt_does_not_exist",
  };
  const mine = await missionFor(LEARNER_DIRECT, missionAssignment.title);

  const listForged = await api("/metaverse/missions?student_id=user_admin_001&organization_id=org_other", { userId: LEARNER_DIRECT });
  assert.equal(listForged.status, 200);
  const stillMine = listForged.json.data.items.find((m) => m.missionProjectionId === mine.missionProjectionId);
  assert.ok(stillMine, "listing must still be scoped to the authenticated caller regardless of query string claims");
  assert.equal(stillMine.studentId, LEARNER_DIRECT);
  assert.equal(stillMine.organizationId, "org_shf_001");

  // organization_id/user_id in the body are recognized CLIENT_AUTHORITY_FIELDS
  // (metaverse-entry-service.ts) — the server refuses the whole request
  // outright (same MET-5 "client_cannot_grant_unlock" guard every other
  // metaverse entry path already has) rather than silently ignoring them.
  const entered = await api(`/metaverse/missions/${mine.missionProjectionId}/enter`, { method: "POST", userId: LEARNER_DIRECT, body: forgedBody });
  assert.equal(entered.status, 403);
  assert.equal(entered.json.ok, false);
  assert.match(entered.json.error.message, /client_cannot_grant_unlock/);

  // A clean (non-authority-claiming) enter for the SAME mission still
  // resolves to the caller's own real assignment/student identity.
  const cleanEntered = await api(`/metaverse/missions/${mine.missionProjectionId}/enter`, { method: "POST", userId: LEARNER_DIRECT, body: {} });
  assert.equal(cleanEntered.json.data.mission.studentId, LEARNER_DIRECT, "a forged student_id/user_id must never change whose mission this is");
  assert.equal(cleanEntered.json.data.mission.assignmentId, missionAssignment.id, "a forged assignment_id must never redirect entry to a different assignment");

  // /events does not consult client-authority-claim fields at all — a
  // forged assignment_id/student_id in the body is simply not read.
  const events = await api(`/metaverse/missions/${mine.missionProjectionId}/events`, { method: "POST", userId: LEARNER_DIRECT, body: { event: "viewed", ...forgedBody } });
  assert.equal(events.status, 200, JSON.stringify(events.json));
  assert.equal(events.json.data.mission.studentId, LEARNER_DIRECT);
});

test("MET-7: 10. Arcade mastery does not become verified evidence — evidenceExpectations.isVerifiedEvidence stays false even after real mastery", async () => {
  const mission = await missionFor(LEARNER_DIRECT, missionAssignment.title);
  const relation = mission.arcadeRelations.find((r) => r.arcadeActivityId === arcadeActivity.id);
  assert.equal(relation.masteryAchieved, true, "precondition: mastery was already achieved by an earlier test in this file");
  assert.equal(mission.evidenceExpectations.isVerifiedEvidence, false);
  assert.equal(mission.evidenceExpectations.possibleSourceType, "LESSON_COMPLETION");
});

test("MET-7: 29/30. no duplicate assignment/Arcade/evidence/portfolio/career authority — mission-projection-service only reads other domains, never writes into their tables", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../src/domain/metaverse/missions/mission-projection-service.ts", import.meta.url), "utf8");
  // No raw SQL at all in the orchestrator — every fact comes through an
  // existing domain's own service/repo layer, never a second INSERT/UPDATE
  // path into assignments/arcade_results/completion_policies/evidence/
  // portfolio/career tables.
  assert.doesNotMatch(source, /INSERT INTO|UPDATE\s+\w+\s+SET|DELETE FROM/i);
  assert.doesNotMatch(source, /createAssignment|updateAssignment/);
  assert.doesNotMatch(source, /submitResult|createActivity\(/);
  assert.doesNotMatch(source, /projectAuthoritativeFact|projectAuthoritativeOutboxEvent/);
  assert.doesNotMatch(source, /PortfolioService|portfolio-service/i);
  assert.doesNotMatch(source, /linkProgramCareer|unlinkProgramCareer/);
});

test("MET-7: MET-6 room/presence authority is not yet reused for mission-context rooms (documented gap, not fabricated)", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../src/domain/metaverse/missions/mission-projection-service.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /MetaverseRoomService|MetaversePresenceService/, "MET-7 does not yet create/join a mission-scoped room — see the P1 gap in the MET-7 doc rather than a fabricated integration");
});
