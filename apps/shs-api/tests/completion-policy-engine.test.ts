// SHF Lesson + Assignment + Curriculum — Phase 4 tests. Completion Policy
// authoring, activation validation, server-side evaluation against real
// authoritative domain records (Arcade/Live Learning/Prepare-Prove/
// Project), policy version stability, idempotency, and tenant isolation.
// Integration tests against the real running dev server and Postgres —
// same convention as tests/curriculum-assignment-binding.test.ts.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://localhost:8091";
const RUN = `phase4_${Date.now()}`;

const ADMIN = "user_admin_001"; // org_shf_001, admin-tier
const LEARNER = "user_assignment_technical_001"; // org_shf_001, real fixture
const LEARNER_B = "user_assignment_networking_001"; // org_shf_001, real fixture, no mastery
const PARTNER_ADMIN = "user_other_admin_001"; // org_other, program_manager

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
const createdPolicyIds = new Set<string>();

const FIX = {
  arcadeActivityId: `arcade_activity_${RUN}`,
  arcadeAttemptPassId: `arcade_attempt_${RUN}_pass`,
  arcadeResultPassId: `arcade_result_${RUN}_pass`,
  liveSessionId: `live_session_${RUN}`,
  joinEventId: `join_event_${RUN}`,
  competencyId: `competency_${RUN}`,
  ppResultId: `pp_result_${RUN}`,
  ppEvidenceId: `pp_evidence_${RUN}`,
  ppDecisionId: `pp_decision_${RUN}`,
  projectId: `project_${RUN}`,
  projectTeamId: `project_team_${RUN}`,
  projectMembershipId: `project_membership_${RUN}`,
  projectSubmissionId: `project_submission_${RUN}`,
};

async function cleanup() {
  const asmtIds = [...createdAssignmentIds];
  if (asmtIds.length) {
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [asmtIds]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [asmtIds]);
  }
  const policyIds = [...createdPolicyIds];
  if (policyIds.length) {
    await query("DELETE FROM completion_policy_requirements WHERE policy_id = ANY($1::text[])", [policyIds]);
    await query("DELETE FROM completion_policies WHERE policy_id = ANY($1::text[])", [policyIds]);
  }
  const courseIds = [...createdCourseIds];
  if (courseIds.length) {
    await query("DELETE FROM curriculum_lesson_completions WHERE curriculum_id IN (SELECT stable_key FROM curriculum_courses WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [courseIds]);
  }
  await query("DELETE FROM arcade_results WHERE arcade_result_id = $1", [FIX.arcadeResultPassId]);
  await query("DELETE FROM arcade_attempts WHERE arcade_attempt_id = $1", [FIX.arcadeAttemptPassId]);
  await query("DELETE FROM arcade_activities WHERE arcade_activity_id = $1", [FIX.arcadeActivityId]);
  await query("DELETE FROM live_session_join_events WHERE join_event_id = $1", [FIX.joinEventId]);
  await query("DELETE FROM live_sessions WHERE live_session_id = $1", [FIX.liveSessionId]);
  await query("DELETE FROM learner_competency_decisions WHERE decision_id = $1", [FIX.ppDecisionId]);
  await query("DELETE FROM prepare_prove_evidence WHERE evidence_id = $1", [FIX.ppEvidenceId]);
  await query("DELETE FROM prepare_prove_activity_results WHERE result_id = $1", [FIX.ppResultId]);
  await query("DELETE FROM competency_definitions WHERE competency_id = $1", [FIX.competencyId]);
  await query("DELETE FROM project_submissions WHERE submission_id = $1", [FIX.projectSubmissionId]);
  await query("DELETE FROM project_team_members WHERE membership_id = $1", [FIX.projectMembershipId]);
  await query("DELETE FROM project_teams WHERE team_id = $1", [FIX.projectTeamId]);
  await query("DELETE FROM projects WHERE project_id = $1", [FIX.projectId]);
}

before(async () => {
  await cleanup();
  await withSeedRetry(() => query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,'org_shf_001',$2,'Phase 4 Test User','active','local') ON CONFLICT (user_id) DO NOTHING`, [`user_ppreviewer_${RUN}`, `user_ppreviewer_${RUN}@test.invalid`]));

  // Arcade fixtures: one activity, one attempt+result mastering it for LEARNER only.
  await query(`INSERT INTO arcade_activities (arcade_activity_id, slug, title, activity_type, mastery_rule, max_score, pass_threshold_score, created_by_user_id) VALUES ($1,$2,'Phase 4 Activity','RETRIEVAL','SCORE_THRESHOLD',100,80,$3)`, [FIX.arcadeActivityId, `phase4-activity-${RUN}`, ADMIN]);
  await query(`INSERT INTO arcade_attempts (arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id, tenant_id, status, completed_at) VALUES ($1,$2,$3,'org_shf_001','tenant:org_shf_001','COMPLETED',NOW())`, [FIX.arcadeAttemptPassId, FIX.arcadeActivityId, LEARNER]);
  await query(`INSERT INTO arcade_results (arcade_result_id, arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id, tenant_id, passed, score, max_score, mastery_achieved) VALUES ($1,$2,$3,$4,'org_shf_001','tenant:org_shf_001',true,90,100,true)`, [FIX.arcadeResultPassId, FIX.arcadeAttemptPassId, FIX.arcadeActivityId, LEARNER]);

  // Live Learning fixtures: one session, LEARNER attended.
  await query(`INSERT INTO live_sessions (live_session_id, organization_id, title, instructor_id, starts_at, ends_at, status) VALUES ($1,'org_shf_001','Phase 4 Session',$2, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours','completed')`, [FIX.liveSessionId, ADMIN]);
  await query(`INSERT INTO live_session_join_events (join_event_id, live_session_id, user_id, decision, attendance_status) VALUES ($1,$2,$3,'allow','attended')`, [FIX.joinEventId, FIX.liveSessionId, LEARNER]);

  // Prepare/Prove fixtures: SUCCEEDED result -> REVIEWED evidence -> DEMONSTRATED decision for LEARNER.
  await query(`INSERT INTO competency_definitions (competency_id, slug, title, description, domain, version, criteria_json, evidence_requirements_json, status) VALUES ($1,$2,'Phase 4 Competency','desc','general',1,'{}','{}','ACTIVE')`, [FIX.competencyId, `phase4-competency-${RUN}`]);
  await query(`INSERT INTO prepare_prove_activity_results (result_id, activity_type, activity_id, user_id, organization_id, tenant_id, result_status, result_json) VALUES ($1,'phase4','activity',$2,'org_shf_001','tenant:org_shf_001','SUCCEEDED','{}')`, [FIX.ppResultId, LEARNER]);
  await query(`INSERT INTO prepare_prove_evidence (evidence_id, source_domain, source_record_id, user_id, organization_id, tenant_id, activity_id, criterion, status, provenance_json) VALUES ($1,'phase4',$2,$3,'org_shf_001','tenant:org_shf_001','activity','criterion-1','REVIEWED','{}')`, [FIX.ppEvidenceId, FIX.ppResultId, LEARNER]);
  await query(`INSERT INTO learner_competency_decisions (decision_id, competency_id, evidence_id, user_id, organization_id, tenant_id, decision, criteria_version, reviewer_user_id, reviewer_authority, provenance_json) VALUES ($1,$2,$3,$4,'org_shf_001','tenant:org_shf_001','DEMONSTRATED',1,$5,'reviewer_verifier','{}')`, [FIX.ppDecisionId, FIX.competencyId, FIX.ppEvidenceId, LEARNER, ADMIN]);

  // Project fixtures: LEARNER on a team with an ACCEPTED submission.
  await query(`INSERT INTO projects (project_id, organization_id, tenant_id, title, project_type, status, created_by_user_id) VALUES ($1,'org_shf_001','tenant:org_shf_001','Phase 4 Project','capstone','ACTIVE',$2)`, [FIX.projectId, ADMIN]);
  await query(`INSERT INTO project_teams (team_id, project_id, organization_id, tenant_id, mode, status) VALUES ($1,$2,'org_shf_001','tenant:org_shf_001','INDIVIDUAL_INTEGRATED_MODE','ACTIVE')`, [FIX.projectTeamId, FIX.projectId]);
  await query(`INSERT INTO project_team_members (membership_id, team_id, learner_id, organization_id, tenant_id, specialization_id, role_id) VALUES ($1,$2,$3,'org_shf_001','tenant:org_shf_001','general','member')`, [FIX.projectMembershipId, FIX.projectTeamId, LEARNER]);
  await query(`INSERT INTO project_submissions (submission_id, project_id, team_id, organization_id, tenant_id, submitted_by_user_id, version, status) VALUES ($1,$2,$3,'org_shf_001','tenant:org_shf_001',$4,1,'ACCEPTED')`, [FIX.projectSubmissionId, FIX.projectId, FIX.projectTeamId, LEARNER]);
});

after(async () => {
  await cleanup();
});

async function publishTestCourse(titleSuffix: string) {
  const course = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} ${titleSuffix}` } });
  const courseId = course.json.data.courseId;
  createdCourseIds.add(courseId);
  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { method: "POST", userId: ADMIN, body: { title: "Unit One", stableKey: "unit-one" } });
  const unitId = unit.json.data.unitId;
  const lesson = await api(`/curriculum/catalog/units/${unitId}/lessons`, { method: "POST", userId: ADMIN, body: { title: "Lesson One", stableKey: "lesson-one" } });
  await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  await api(`/curriculum/catalog/courses/${courseId}/approve`, { method: "POST", userId: ADMIN, body: { revision: 2 } });
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { method: "POST", userId: ADMIN, body: { revision: 3 } });
  return { courseId, unitId, lessonId: lesson.json.data.lessonId, release: published.json.data.release };
}

async function createAndActivatePolicy(releaseId: string, requirements: Array<{ requirementType: string; targetReference?: string; required?: boolean }>) {
  const created = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one" } });
  assert.equal(created.status, 200);
  const policyId = created.json.data.policyId;
  createdPolicyIds.add(policyId);
  for (const req of requirements) {
    const added = await api(`/completion-policies/${policyId}/requirements`, { method: "POST", userId: ADMIN, body: req });
    assert.equal(added.status, 200, JSON.stringify(added.json));
  }
  // Each addRequirement() call increments the policy's revision (see
  // completion-policy-repo.ts's touchUpdatedAt) — activation must target
  // the resulting revision, not the row's initial value of 1.
  const activated = await api(`/completion-policies/${policyId}/activate`, { method: "POST", userId: ADMIN, body: { revision: 1 + requirements.length } });
  assert.equal(activated.status, 200, JSON.stringify(activated.json));
  return policyId;
}

async function createBoundAssignment(release: any, policyId: string | null, userId: string) {
  const res = await api("/assignments", {
    method: "POST", userId: ADMIN,
    body: {
      title: `${RUN} Bound Assignment ${policyId || "none"}`, dueAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
      targets: [{ targetType: "LEARNER", learnerUserId: userId }],
      curriculumReleaseId: release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one",
      ...(policyId ? { completionPolicyId: policyId } : {}),
    },
  });
  if (res.status === 201) createdAssignmentIds.add(res.json.data.id);
  return res;
}

// ---------------- Policy authoring / validation ----------------
test("1. a student cannot author a completion policy", async () => {
  const { release } = await publishTestCourse("AuthZ");
  const res = await api("/completion-policies", { method: "POST", userId: LEARNER, body: { curriculumReleaseId: release.releaseId, assignedContentType: "COURSE" } });
  assert.equal(res.status, 403);
});

test("2. a policy cannot bind to an unpublished release", async () => {
  const draft = await api("/curriculum/catalog/courses", { method: "POST", userId: ADMIN, body: { title: `${RUN} DraftForPolicy` } });
  createdCourseIds.add(draft.json.data.courseId);
  const res = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: "release_does_not_exist", assignedContentType: "COURSE" } });
  assert.equal(res.status, 422);
});

test("3. activation is rejected when a REQUIRED ASSESSMENT has no configured pass threshold", async () => {
  const { release } = await publishTestCourse("RejectAssessment");
  const created = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one" } });
  const policyId = created.json.data.policyId;
  createdPolicyIds.add(policyId);
  await api(`/completion-policies/${policyId}/requirements`, { method: "POST", userId: ADMIN, body: { requirementType: "ASSESSMENT", required: true } });
  const activated = await api(`/completion-policies/${policyId}/activate`, { method: "POST", userId: ADMIN, body: { revision: 1 } });
  assert.equal(activated.status, 422);
  assert.equal(activated.json.error.code, "ACTIVATION_REJECTED");
});

test("4. an OPTIONAL unavailable REFLECTION definition does not block activation, and never satisfies completion when absent from the release", async () => {
  const { release } = await publishTestCourse("OptionalReflection");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "CONTENT" },
    { requirementType: "REFLECTION", required: false },
  ]);
  const assignmentRes = await createBoundAssignment(release, policyId, LEARNER);
  assert.equal(assignmentRes.status, 201);
  const check = await api(`/assignments/${assignmentRes.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(check.status, 200);
  assert.equal(check.json.data.complete, true, "an optional unavailable requirement must never block completion");
  const reflection = check.json.data.requirements.find((r: any) => r.type === "REFLECTION");
  assert.equal(reflection.status, "NOT_AVAILABLE");
  assert.equal(reflection.satisfied, false);
});

// ---------------- Real authoritative adapters ----------------
test("5. ARCADE requirement is satisfied only for the learner with a real mastered Arcade result", async () => {
  const { release } = await publishTestCourse("ArcadeReal");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "CONTENT" },
    { requirementType: "ARCADE", targetReference: FIX.arcadeActivityId, required: true },
  ]);
  const assignedA = await createBoundAssignment(release, policyId, LEARNER);
  const assignedB = await createBoundAssignment(release, policyId, LEARNER_B);

  const checkA = await api(`/assignments/${assignedA.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(checkA.json.data.complete, true);
  const arcadeResultA = checkA.json.data.requirements.find((r: any) => r.type === "ARCADE");
  assert.equal(arcadeResultA.status, "SATISFIED");
  assert.equal(arcadeResultA.sourceRecordId, FIX.arcadeResultPassId);

  const checkB = await api(`/assignments/${assignedB.json.data.id}/check-completion`, { method: "POST", userId: LEARNER_B, body: {} });
  assert.equal(checkB.json.data.complete, false, "a learner with no mastered Arcade result must not complete");
});

test("6. LIVE_ATTENDANCE requirement reads only canonical Live Learning join events", async () => {
  const { release } = await publishTestCourse("AttendanceReal");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "LIVE_ATTENDANCE", targetReference: FIX.liveSessionId, required: true },
  ]);
  const assignedA = await createBoundAssignment(release, policyId, LEARNER);
  const check = await api(`/assignments/${assignedA.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(check.json.data.complete, true);

  const assignedB = await createBoundAssignment(release, policyId, LEARNER_B);
  const checkB = await api(`/assignments/${assignedB.json.data.id}/check-completion`, { method: "POST", userId: LEARNER_B, body: {} });
  assert.equal(checkB.json.data.complete, false, "a learner with no attendance record must not complete");
});

test("7. INSTRUCTOR_VERIFICATION / EVIDENCE requirements read only Prepare/Prove's reviewer-approved DEMONSTRATED decision", async () => {
  const { release } = await publishTestCourse("EvidenceReal");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "EVIDENCE", targetReference: FIX.competencyId, required: true },
  ]);
  const assignedA = await createBoundAssignment(release, policyId, LEARNER);
  const check = await api(`/assignments/${assignedA.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(check.json.data.complete, true);
  const evidence = check.json.data.requirements.find((r: any) => r.type === "EVIDENCE");
  assert.equal(evidence.sourceRecordId, FIX.ppDecisionId);
});

test("8. PROJECT requirement reads only the canonical ACCEPTED submission for the learner's own team", async () => {
  const { release } = await publishTestCourse("ProjectReal");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "PROJECT", targetReference: FIX.projectId, required: true },
  ]);
  const assignedA = await createBoundAssignment(release, policyId, LEARNER);
  const check = await api(`/assignments/${assignedA.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(check.json.data.complete, true);

  const assignedB = await createBoundAssignment(release, policyId, LEARNER_B);
  const checkB = await api(`/assignments/${assignedB.json.data.id}/check-completion`, { method: "POST", userId: LEARNER_B, body: {} });
  assert.equal(checkB.json.data.complete, false, "a learner not on the team must not complete");
});

// ---------------- Negative / security ----------------
test("9. missing a required result leaves the assignment NOT complete with an honest breakdown", async () => {
  const { release } = await publishTestCourse("MissingRequired");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "ARCADE", targetReference: FIX.arcadeActivityId, required: true },
  ]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER_B);
  const check = await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: LEARNER_B, body: {} });
  assert.equal(check.json.data.complete, false);
  assert.equal(check.json.data.requirements[0].status, "UNSATISFIED");
});

test("10. cross-tenant requirement target rejected at policy authoring time (LIVE_ATTENDANCE session from another org)", async () => {
  const otherOrgSession = `live_session_${RUN}_other_org`;
  await query(`INSERT INTO live_sessions (live_session_id, organization_id, title, instructor_id, starts_at, ends_at, status) VALUES ($1,'org_partner_001','Other Org Session',$2, NOW(), NOW() + INTERVAL '1 hour','scheduled')`, [otherOrgSession, "user_partner_student_001"]).catch(() => {});
  const { release } = await publishTestCourse("CrossOrgTarget");
  const created = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one" } });
  const policyId = created.json.data.policyId;
  createdPolicyIds.add(policyId);
  const res = await api(`/completion-policies/${policyId}/requirements`, { method: "POST", userId: ADMIN, body: { requirementType: "LIVE_ATTENDANCE", targetReference: otherOrgSession, required: true } });
  assert.equal(res.status, 422);
  await query("DELETE FROM live_sessions WHERE live_session_id = $1", [otherOrgSession]);
});

test("11. a different organization's admin cannot read or manage this organization's policy", async () => {
  const { release } = await publishTestCourse("CrossOrgPolicyRead");
  const policyId = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const res = await api(`/completion-policies/${policyId}`, { userId: PARTNER_ADMIN });
  assert.equal(res.status, 404);
});

test("12. a student cannot check-completion for another organization's assignment (IDOR)", async () => {
  const { release } = await publishTestCourse("IDORCheck");
  const policyId = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER);
  const res = await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: "user_partner_student_001", body: {} });
  assert.equal(res.status, 404);
});

// ---------------- Idempotency ----------------
test("13. repeated completion checks are idempotent — no duplicate completion row", async () => {
  const { release, courseId } = await publishTestCourse("Idempotent");
  const policyId = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER);

  const first = await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(first.json.data.complete, true);
  const second = await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  assert.equal(second.json.data.complete, true);
  assert.equal(first.json.data.completion.completion_id, second.json.data.completion.completion_id);

  const courseRow = await query("SELECT stable_key FROM curriculum_courses WHERE course_id = $1", [courseId]);
  const rows = await query("SELECT count(*)::int AS n FROM curriculum_lesson_completions WHERE organization_id='org_shf_001' AND user_id=$1 AND curriculum_id=$2 AND lesson_id='lesson-one'", [LEARNER, courseRow.rows[0].stable_key]);
  assert.equal(rows.rows[0].n, 1);
});

// ---------------- Historical lineage ----------------
test("14. verified completion preserves assignment/release/policy lineage on the canonical completion row", async () => {
  const { release, courseId } = await publishTestCourse("Lineage");
  const policyId = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER);
  await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });

  const courseRow = await query("SELECT stable_key FROM curriculum_courses WHERE course_id = $1", [courseId]);
  const row = await query(
    "SELECT assignment_id, curriculum_release_id, release_version, completion_policy_id, completion_policy_version FROM curriculum_lesson_completions WHERE organization_id='org_shf_001' AND user_id=$1 AND curriculum_id=$2 AND lesson_id='lesson-one'",
    [LEARNER, courseRow.rows[0].stable_key],
  );
  assert.equal(row.rows[0].assignment_id, assigned.json.data.id);
  assert.equal(row.rows[0].curriculum_release_id, release.releaseId);
  assert.equal(row.rows[0].release_version, 1);
  assert.equal(row.rows[0].completion_policy_id, policyId);
  assert.equal(row.rows[0].completion_policy_version, 1);
});

// ---------------- Policy version stability (Step 41, mandatory) ----------------
test("15. an assignment remains bound to policy v1 after policy v2 is created for the same scope", async () => {
  const { release } = await publishTestCourse("PolicyVersionStability");
  const policyV1 = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const assignedA = await createBoundAssignment(release, policyV1, LEARNER);
  assert.equal(assignedA.json.data.completionPolicyId, policyV1);

  // Create and activate policy v2 for the exact same scope.
  const v2Created = await api("/completion-policies", { method: "POST", userId: ADMIN, body: { curriculumReleaseId: release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one" } });
  assert.equal(v2Created.status, 200);
  const policyV2 = v2Created.json.data.policyId;
  createdPolicyIds.add(policyV2);
  assert.equal(v2Created.json.data.version, 2, "the second policy for the same scope must be version 2");
  await api(`/completion-policies/${policyV2}/requirements`, { method: "POST", userId: ADMIN, body: { requirementType: "ARCADE", targetReference: FIX.arcadeActivityId, required: true } });
  await api(`/completion-policies/${policyV2}/activate`, { method: "POST", userId: ADMIN, body: { revision: 2 } });

  // Assignment A must still reference v1 — verified via a fresh read.
  const reread = await api(`/assignments/${assignedA.json.data.id}`, { userId: ADMIN });
  assert.equal(reread.json.data.completionPolicyId, policyV1);

  // New Assignment B may explicitly use v2.
  const assignedB = await createBoundAssignment(release, policyV2, LEARNER);
  assert.equal(assignedB.status, 201);
  assert.equal(assignedB.json.data.completionPolicyId, policyV2);
});

test("16. PATCH cannot change an assignment's completion policy binding", async () => {
  const { release } = await publishTestCourse("PolicyPatchImmutable");
  const policyId = await createAndActivatePolicy(release.releaseId, [{ requirementType: "CONTENT" }]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER);
  const patched = await api(`/assignments/${assigned.json.data.id}`, { method: "PATCH", userId: ADMIN, body: { title: "renamed", completionPolicyId: "some_other_policy" } });
  assert.equal(patched.status, 200);
  assert.equal(patched.json.data.completionPolicyId, policyId);
});

// ---------------- No manufactured Truth ----------------
test("17. verified completion never writes to arcade_results/live_session_join_events/learner_competency_decisions/project_submissions (read-only adapters)", async () => {
  // Scoped to this run's own fixture ids rather than a global table
  // count — other test files (arcade/live-learning/prepare-prove/
  // project security suites) may legitimately write to these same
  // tables concurrently during a full `npm test` run.
  const before = await Promise.all([
    query("SELECT count(*)::int AS n FROM arcade_results WHERE arcade_activity_id = $1", [FIX.arcadeActivityId]),
    query("SELECT count(*)::int AS n FROM live_session_join_events WHERE live_session_id = $1", [FIX.liveSessionId]),
    query("SELECT count(*)::int AS n FROM learner_competency_decisions WHERE competency_id = $1", [FIX.competencyId]),
    query("SELECT count(*)::int AS n FROM project_submissions WHERE project_id = $1", [FIX.projectId]),
  ]);
  const { release } = await publishTestCourse("ReadOnlyAdapters");
  const policyId = await createAndActivatePolicy(release.releaseId, [
    { requirementType: "ARCADE", targetReference: FIX.arcadeActivityId, required: true },
    { requirementType: "LIVE_ATTENDANCE", targetReference: FIX.liveSessionId, required: true },
    { requirementType: "EVIDENCE", targetReference: FIX.competencyId, required: true },
    { requirementType: "PROJECT", targetReference: FIX.projectId, required: true },
  ]);
  const assigned = await createBoundAssignment(release, policyId, LEARNER);
  await api(`/assignments/${assigned.json.data.id}/check-completion`, { method: "POST", userId: LEARNER, body: {} });
  const after = await Promise.all([
    query("SELECT count(*)::int AS n FROM arcade_results WHERE arcade_activity_id = $1", [FIX.arcadeActivityId]),
    query("SELECT count(*)::int AS n FROM live_session_join_events WHERE live_session_id = $1", [FIX.liveSessionId]),
    query("SELECT count(*)::int AS n FROM learner_competency_decisions WHERE competency_id = $1", [FIX.competencyId]),
    query("SELECT count(*)::int AS n FROM project_submissions WHERE project_id = $1", [FIX.projectId]),
  ]);
  for (let i = 0; i < before.length; i++) assert.equal(after[i].rows[0].n, before[i].rows[0].n);
});

// ---------------- Legacy compatibility ----------------
test("18. a lesson with no applicable institutional policy is unaffected — legacy Mark Complete still succeeds", async () => {
  const res = await api("/curriculum/lessons/legacy-lesson-phase4/complete", { method: "POST", userId: LEARNER, body: { curriculum: `legacy-curriculum-${RUN}` } });
  assert.equal(res.status, 200);
});
