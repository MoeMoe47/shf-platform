import assert from "node:assert/strict";
import { after, beforeEach, test as nodeTest } from "node:test";
import { query } from "../src/db/client.ts";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.ts";
import * as catalog from "../src/domain/curriculum-catalog/service/curriculum-catalog-service.ts";
import * as assignments from "../src/domain/assignments/service/assignment-service.ts";
import * as policies from "../src/domain/completion-policy/service/completion-policy-service.ts";
import * as activities from "../src/domain/activity-domains/service/activity-domain-service.ts";
import { createEvidenceRule, projectAuthoritativeOutboxEvent, getEvidenceForActor, getTruthFactForActor } from "../src/domain/verified-evidence/service/verified-evidence-service.ts";
import * as arcade from "../src/domain/arcade/service/arcade-service.ts";
import { ProjectService } from "../src/domain/projects/project-service.ts";
import { confirmAttendance } from "../src/domain/live-learning/service/live-learning-service.ts";
import { LiveSessionRepo } from "../src/domain/live-learning/repo/live-session-repo.ts";
import { toTruthSpineFact } from "../src/domain/verified-evidence/truth-spine-adapter.ts";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.ts";

const RUN = `phase6_live_${Date.now()}`;
const ORG = "org_shf_001";
const ADMIN = "user_admin_001";
const LEARNER = "user_assignment_technical_001";
const admin = { userId: ADMIN, organizationId: ORG };
const learner = { user_id: LEARNER, organization_id: ORG, roles: ["student"], permissions: ["assignment.view"] };
const created = { courses: [] as string[], assignments: [] as string[], policies: [] as string[], rules: [] as string[], sourceIds: [] as string[], arcadeAttempts: [] as string[], arcadeActivities: [] as string[], projectIds: [] as string[], liveSessionIds: [] as string[] };
let fixtureCount = 0;
const test = (name: string, fn: () => Promise<void>) => nodeTest(name, { concurrency: false }, fn);

async function cleanup() {
  await query("DELETE FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM prepare_prove_evidence WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM curriculum_evidence_rules WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM integration_outbox WHERE idempotency_key LIKE $1", [`%${RUN}%`]);
  if (created.sourceIds.length) {
    await query("DELETE FROM curriculum_lesson_completions WHERE completion_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM arcade_results WHERE arcade_result_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM arcade_attempts WHERE arcade_attempt_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM live_session_join_events WHERE join_event_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM live_sessions WHERE live_session_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM learner_competency_decisions WHERE decision_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM prepare_prove_evidence WHERE evidence_id = ANY($1::text[])", [created.sourceIds]);
    await query("DELETE FROM prepare_prove_activity_results WHERE result_id = ANY($1::text[])", [created.sourceIds]);
  }
  if (created.arcadeAttempts.length) { await query("DELETE FROM arcade_results WHERE arcade_attempt_id = ANY($1::text[])", [created.arcadeAttempts]); await query("DELETE FROM arcade_attempts WHERE arcade_attempt_id = ANY($1::text[])", [created.arcadeAttempts]); }
  if (created.arcadeActivities.length) await query("DELETE FROM arcade_activities WHERE arcade_activity_id = ANY($1::text[])", [created.arcadeActivities]);
  if (created.projectIds.length) { await query("DELETE FROM project_submissions WHERE project_id = ANY($1::text[])", [created.projectIds]); await query("DELETE FROM project_teams WHERE project_id = ANY($1::text[])", [created.projectIds]); await query("DELETE FROM projects WHERE project_id = ANY($1::text[])", [created.projectIds]); }
  if (created.liveSessionIds.length) { await query("DELETE FROM live_session_join_events WHERE live_session_id = ANY($1::text[])", [created.liveSessionIds]); await query("DELETE FROM live_sessions WHERE live_session_id = ANY($1::text[])", [created.liveSessionIds]); }
  if (created.assignments.length) {
    await query("DELETE FROM assessment_results WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM assessment_attempts WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM reflection_submissions WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM practice_results WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM practice_attempts WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [created.assignments]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [created.assignments]);
  }
  if (created.policies.length) { await query("DELETE FROM completion_policy_requirements WHERE policy_id = ANY($1::text[])", [created.policies]); await query("DELETE FROM completion_policies WHERE policy_id = ANY($1::text[])", [created.policies]); }
  if (created.courses.length) {
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [created.courses]);
    await query("DELETE FROM curriculum_assessment_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id=ANY($1::text[])))", [created.courses]);
    await query("DELETE FROM curriculum_reflection_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id=ANY($1::text[])))", [created.courses]);
    await query("DELETE FROM curriculum_practice_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id=ANY($1::text[])))", [created.courses]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id=ANY($1::text[]))", [created.courses]);
    await query("DELETE FROM curriculum_units WHERE course_id=ANY($1::text[])", [created.courses]);
    await query("DELETE FROM curriculum_courses WHERE course_id=ANY($1::text[])", [created.courses]);
  }
}

async function ensureBaseFixture() {
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
    VALUES ($1, 'SHF Phase 6 Test Organization', 'SHF Phase 6 Test Organization', 'nonprofit', 'active')
    ON CONFLICT (organization_id) DO NOTHING`, [ORG]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1, $2, $3, $4, 'active', 'test'), ($5, $2, $6, $7, 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING`, [ADMIN, ORG, `${ADMIN}@test.invalid`, 'Phase 6 Test Admin', LEARNER, `${LEARNER}@test.invalid`, 'Phase 6 Test Learner']);
}

async function fixture() {
  fixtureCount += 1;
  const repo = new CurriculumCatalogRepo();
  const course = await catalog.createCourse(admin, { title: `${RUN} Course ${fixtureCount}`, stableKey: `${RUN}-course-${fixtureCount}` }); created.courses.push(course.courseId);
  const unit = await catalog.createUnit(admin, course.courseId, { title: "Unit", stableKey: "unit" });
  const lesson = await catalog.createLesson(admin, unit.unitId, { title: "Lesson", stableKey: "lesson" });
  await repo.upsertAssessmentDefinition({ assessmentDefinitionId: `${RUN}-${fixtureCount}-assessment-def`, organizationId: ORG, lessonId: lesson.lessonId, items: [{ itemId: "q", type: "mcq", prompt: "q", choices: ["a"], correctIndex: 0 }], sourceReference: null, sourceHash: null, actorUserId: ADMIN });
  await repo.upsertReflectionDefinition({ reflectionDefinitionId: `${RUN}-${fixtureCount}-reflection-def`, organizationId: ORG, lessonId: lesson.lessonId, items: [{ itemId: "r", prompt: "r" }], sourceReference: null, sourceHash: null, actorUserId: ADMIN });
  await repo.upsertPracticeDefinition({ practiceDefinitionId: `${RUN}-${fixtureCount}-practice-def`, organizationId: ORG, lessonId: lesson.lessonId, title: "Practice", instructions: "Do it", completionMode: "COMPLETION", completionActionLabel: "done", items: [{ itemId: "p", type: "guided", prompt: "p" }], sourceReference: null, sourceHash: null, actorUserId: ADMIN });
  await catalog.submitForReview(admin, course.courseId, 1); await catalog.approveCourse(admin, course.courseId, 2); const published = await catalog.publishCourse(admin, course.courseId, 3);
  const policy = await policies.createPolicy(admin, { curriculumReleaseId: published.release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit", assignedContentLessonKey: "lesson" }); created.policies.push(policy.policyId);
  await policies.addRequirement(admin, policy.policyId, { requirementType: "ASSESSMENT", configuration: { passThresholdPercent: 80 } }); await policies.activatePolicy(admin, policy.policyId, 2);
  const assignment = await assignments.createAssignment({ user_id: ADMIN, organization_id: ORG, roles: ["org_admin"] }, { title: `${RUN} Assignment`, dueAt: new Date(Date.now()+86400000).toISOString(), visibilityScope: "targeted", targets: [{ targetType: "LEARNER", learnerUserId: LEARNER }], curriculumReleaseId: published.release.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit", assignedContentLessonKey: "lesson", completionPolicyId: policy.policyId }); created.assignments.push(assignment.id);
  return { course, lesson, release: published.release, assignment };
}

async function rule(sourceType: string, evidenceType: string | null, truthFactType: string | null, reviewRequired = false) {
  const id = `${RUN}:${sourceType}:${created.rules.length}`; created.rules.push(id);
  await createEvidenceRule({ user_id: ADMIN, organization_id: ORG }, { evidenceRuleId: id, sourceType, evidenceType, truthFactType, reviewRequired });
  return id;
}

async function projectTwice(event_type: string, source_record_id: string) {
  const event = { event_type, subject_id: source_record_id, organization_id: ORG, payload: { source_record_id } };
  await projectAuthoritativeOutboxEvent(event); await projectAuthoritativeOutboxEvent(event);
}

test("real Reflection, Practice, and Lesson Completion sources replay without duplicates", async () => {
  const { release, lesson, assignment } = await fixture();
  const assessment = await activities.submitAssessment(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", answers: [{ itemId: "q", choiceIndex: 0 }], idempotencyKey: `${RUN}:assessment` });
  const assessmentRule = await rule("ASSESSMENT_RESULT", "ASSESSMENT", "ASSESSMENT_PASSED");
  const outbox = await query("SELECT * FROM integration_outbox WHERE idempotency_key=$1", [`assessment.submitted:${RUN}:assessment`]);
  assert.equal(outbox.rows.length, 1);
  const beforeDispatch = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE source_record_id=$1 AND evidence_rule_id=$2", [assessment.assessmentResultId, assessmentRule]);
  assert.equal(beforeDispatch.rows[0].n, 0);
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://phase6-test.local";
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "phase6-test";
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "phase6-test": "phase6-test-secret" });
  const event = outbox.rows[0];
  const workerId = `${RUN}:dispatcher`;
  const isolatedRepo: any = {
    async claimPending() {
      const claimed = await query("UPDATE integration_outbox SET delivery_status='DELIVERING', lease_owner=$2, lease_expires_at=NOW()+INTERVAL '60 seconds', attempt_count=attempt_count+1, last_attempt_at=NOW(), updated_at=NOW() WHERE outbox_event_id=$1 AND delivery_status='PENDING' RETURNING *", [event.outbox_event_id, workerId]);
      return claimed.rows;
    },
    async markDelivered(id: string, owner: string) {
      return query("UPDATE integration_outbox SET delivery_status='DELIVERED', delivered_at=NOW(), updated_at=NOW(), lease_owner=NULL, lease_expires_at=NULL WHERE outbox_event_id=$1 AND delivery_status='DELIVERING' AND lease_owner=$2", [id, owner]);
    },
    async markRetryable() { throw new Error("unexpected_retry"); },
    async markFailedFinal() { throw new Error("unexpected_failure"); },
  };
  const firstDispatch = await dispatchPendingIntegrationEvents({ repo: isolatedRepo, limit: 1, workerId, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }) });
  assert.equal(firstDispatch[0].status, "DELIVERED");
  const afterDispatch = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE source_record_id=$1 AND evidence_rule_id=$2", [assessment.assessmentResultId, assessmentRule]);
  assert.equal(afterDispatch.rows[0].n, 1);
  const acknowledged = await query("SELECT delivery_status FROM integration_outbox WHERE outbox_event_id=$1", [event.outbox_event_id]);
  assert.equal(acknowledged.rows[0].delivery_status, "DELIVERED");
  await projectTwice("assessment.submitted", assessment.assessmentResultId);
  const reflection = await activities.submitReflection(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", responses: [{ itemId: "r", text: "private" }], idempotencyKey: `${RUN}:reflection` });
  const reflectionRule = await rule("REFLECTION_SUBMISSION", "REFLECTION", "REFLECTION_REVIEWED", true);
  await assert.rejects(() => projectAuthoritativeOutboxEvent({ event_type: "reflection.submitted", subject_id: reflection.reflectionSubmissionId, organization_id: ORG, payload: { source_record_id: reflection.reflectionSubmissionId } }), /not_evidence_eligible/);
  await query("UPDATE reflection_submissions SET status='REVIEWED', reviewed_by_user_id=$2, reviewed_at=NOW(), review_status='APPROVED' WHERE reflection_submission_id=$1", [reflection.reflectionSubmissionId, ADMIN]); await projectTwice("reflection.submitted", reflection.reflectionSubmissionId);
  const practice = await activities.submitPractice(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", actions: [{ itemId: "p", text: "done" }], idempotencyKey: `${RUN}:practice` });
  await rule("PRACTICE_RESULT", null, "PRACTICE_COMPLETED"); await projectTwice("practice.submitted", practice.practiceResultId);
  const completionId = `${RUN}:completion`; created.sourceIds.push(completionId); await query("INSERT INTO curriculum_lesson_completions (completion_id,user_id,organization_id,curriculum_id,lesson_id,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6)", [completionId, LEARNER, ORG, release.courseId, lesson.lessonId, `${RUN}:completion-key`]); await rule("LESSON_COMPLETION", null, "LESSON_COMPLETED"); await projectTwice("lesson.completed", completionId);
  const rows = await query("SELECT source_type, COUNT(*)::int AS n FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1 GROUP BY source_type ORDER BY source_type", [`${RUN}%`]); assert.deepEqual(rows.rows.map((r: any) => [r.source_type, r.n]), [["ASSESSMENT_RESULT", 1], ["LESSON_COMPLETION", 1], ["PRACTICE_RESULT", 1], ["REFLECTION_SUBMISSION", 1]]);
  assert.equal(reflectionRule.startsWith(RUN), true);
});

test("projection boundaries fail closed for a mismatched organization", async () => {
  const { release, lesson, assignment } = await fixture();
  const result = await activities.submitAssessment(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", answers: [{ itemId: "q", choiceIndex: 0 }], idempotencyKey: `${RUN}:idor` });
  created.sourceIds.push(result.assessmentResultId);
  const reflection = await activities.submitReflection(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", responses: [{ itemId: "r", text: "private" }], idempotencyKey: `${RUN}:idor-reflection` });
  created.sourceIds.push(reflection.reflectionSubmissionId);
  const completionId = `${RUN}:idor-completion`; created.sourceIds.push(completionId);
  await query("INSERT INTO curriculum_lesson_completions (completion_id,user_id,organization_id,curriculum_id,lesson_id,idempotency_key) VALUES ($1,$2,$3,$4,$5,$6)", [completionId, LEARNER, ORG, release.courseId, lesson.lessonId, `${RUN}:idor-completion-key`]);
  const projectId = `${RUN}-idor-project`; const teamId = `${RUN}-idor-team`; const submissionId = `${RUN}-idor-submission`; created.projectIds.push(projectId); created.sourceIds.push(submissionId);
  await query("INSERT INTO projects (project_id,organization_id,tenant_id,title,project_type,status,created_by_user_id) VALUES ($1,$2,$3,$4,'EDUCATIONAL_PROJECT','ACTIVE',$5)", [projectId, ORG, `tenant:${ORG}`, "IDOR Project", ADMIN]);
  await query("INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status) VALUES ($1,$2,$3,$4,'INDIVIDUAL_INTEGRATED_MODE','ACTIVE')", [teamId, projectId, ORG, `tenant:${ORG}`]);
  await query("INSERT INTO project_submissions (submission_id,project_id,team_id,organization_id,tenant_id,submitted_by_user_id,version,payload_json,artifact_refs_json,status) VALUES ($1,$2,$3,$4,$5,$6,1,'{}','[]','ACCEPTED')", [submissionId, projectId, teamId, ORG, `tenant:${ORG}`, LEARNER]);
  const mismatched = [
    ["assessment.submitted", result.assessmentResultId],
    ["reflection.submitted", reflection.reflectionSubmissionId],
    ["project.submission.reviewed", submissionId],
    ["lesson.completed", completionId],
  ];
  for (const [event_type, source_record_id] of mismatched) {
    await assert.rejects(() => (projectAuthoritativeOutboxEvent as any)({ event_type, subject_id: source_record_id, organization_id: "org_partner_001", payload: { source_record_id } }), /not_found/);
  }
  const count = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1", [`${RUN}%`]); assert.equal(count.rows[0].n, 0);
});

test("Release 1 Evidence and Truth remain stable when Release 2 is published", async () => {
  const { course, lesson, release, assignment } = await fixture();
  const ruleId = await rule("ASSESSMENT_RESULT", "ASSESSMENT", "ASSESSMENT_PASSED");
  const result = await activities.submitAssessment(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", answers: [{ itemId: "q", choiceIndex: 0 }], idempotencyKey: `${RUN}:release-one` });
  await projectTwice("assessment.submitted", result.assessmentResultId);
  const before = await query("SELECT e.evidence_id, e.curriculum_release_id AS evidence_release, e.competency_id AS evidence_competency, t.truth_fact_id, t.curriculum_release_id AS truth_release, t.competency_id AS truth_competency, e.evidence_rule_version FROM prepare_prove_evidence e JOIN curriculum_truth_facts t ON t.evidence_id=e.evidence_id WHERE e.source_record_id=$1 AND e.evidence_rule_id=$2", [result.assessmentResultId, ruleId]);
  assert.equal(before.rows.length, 1);
  await catalog.reopenCourse(admin, course.courseId, 4);
  const repo = new CurriculumCatalogRepo(); await repo.upsertAssessmentDefinition({ assessmentDefinitionId: `${RUN}-changed-assessment`, organizationId: ORG, lessonId: lesson.lessonId, items: [{ itemId: "q", type: "mcq", prompt: "changed", choices: ["b"], correctIndex: 0 }], sourceReference: null, sourceHash: null, actorUserId: ADMIN });
  await catalog.submitForReview(admin, course.courseId, 5); await catalog.approveCourse(admin, course.courseId, 6); const release2 = (await catalog.publishCourse(admin, course.courseId, 7)).release;
  const after = await query("SELECT e.evidence_id, e.curriculum_release_id AS evidence_release, e.competency_id AS evidence_competency, t.truth_fact_id, t.curriculum_release_id AS truth_release, t.competency_id AS truth_competency, e.evidence_rule_version FROM prepare_prove_evidence e JOIN curriculum_truth_facts t ON t.evidence_id=e.evidence_id WHERE e.source_record_id=$1 AND e.evidence_rule_id=$2", [result.assessmentResultId, ruleId]);
  assert.deepEqual(after.rows[0], before.rows[0]); assert.equal(assignment.curriculumReleaseId, release.releaseId); assert.notEqual(release2.releaseId, release.releaseId);
  const policy2 = await policies.createPolicy(admin, { curriculumReleaseId: release2.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit", assignedContentLessonKey: "lesson" }); created.policies.push(policy2.policyId); await policies.addRequirement(admin, policy2.policyId, { requirementType: "ASSESSMENT", configuration: { passThresholdPercent: 80 } }); await policies.activatePolicy(admin, policy2.policyId, 2);
  const assignment2 = await assignments.createAssignment({ user_id: ADMIN, organization_id: ORG, roles: ["org_admin"] }, { title: `${RUN} Assignment 2`, dueAt: new Date(Date.now()+86400000).toISOString(), visibilityScope: "targeted", targets: [{ targetType: "LEARNER", learnerUserId: LEARNER }], curriculumReleaseId: release2.releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit", assignedContentLessonKey: "lesson", completionPolicyId: policy2.policyId }); created.assignments.push(assignment2.id);
  const result2 = await activities.submitAssessment(learner as any, { assignmentId: assignment2.id, unitStableKey: "unit", lessonStableKey: "lesson", answers: [{ itemId: "q", choiceIndex: 0 }], idempotencyKey: `${RUN}:release-two` }); await projectTwice("assessment.submitted", result2.assessmentResultId);
  const separate = await query("SELECT COUNT(*)::int AS n FROM curriculum_truth_facts WHERE source_record_id=$1 AND curriculum_release_id=$2", [result2.assessmentResultId, release2.releaseId]); assert.equal(separate.rows[0].n, 1);
});

test("private Evidence and Truth reads are organization and learner scoped", async () => {
  const { assignment } = await fixture(); const result = await activities.submitAssessment(learner as any, { assignmentId: assignment.id, unitStableKey: "unit", lessonStableKey: "lesson", answers: [{ itemId: "q", choiceIndex: 0 }], idempotencyKey: `${RUN}:private-read` }); const ruleId = await rule("ASSESSMENT_RESULT", "ASSESSMENT", "ASSESSMENT_PASSED"); await projectAuthoritativeOutboxEvent({ event_type: "assessment.submitted", subject_id: result.assessmentResultId, organization_id: ORG, payload: { source_record_id: result.assessmentResultId } });
  const ids = await query("SELECT e.evidence_id, t.truth_fact_id FROM prepare_prove_evidence e JOIN curriculum_truth_facts t ON t.evidence_id=e.evidence_id WHERE e.source_record_id=$1 AND e.evidence_rule_id=$2", [result.assessmentResultId, ruleId]); assert.ok(ids.rows[0]);
  assert.ok(await getEvidenceForActor({ user_id: LEARNER, organization_id: ORG }, ids.rows[0].evidence_id)); assert.ok(await getTruthFactForActor({ user_id: LEARNER, organization_id: ORG }, ids.rows[0].truth_fact_id));
  assert.equal(await getEvidenceForActor({ user_id: "user_assignment_networking_001", organization_id: ORG }, ids.rows[0].evidence_id), null);
  assert.equal(await getTruthFactForActor({ user_id: "user_assignment_networking_001", organization_id: ORG }, ids.rows[0].truth_fact_id), null);
  assert.equal(await getEvidenceForActor({ user_id: ADMIN, organization_id: ORG }, ids.rows[0].evidence_id), null);
  assert.equal(await getTruthFactForActor({ user_id: ADMIN, organization_id: ORG }, ids.rows[0].truth_fact_id), null);
  assert.equal(await getEvidenceForActor({ user_id: "user_assignment_networking_001", organization_id: ORG }, "unknown-evidence-id"), null);
  assert.equal(await getTruthFactForActor({ user_id: "user_assignment_networking_001", organization_id: ORG }, "unknown-truth-id"), null);
  assert.equal(await getEvidenceForActor({ user_id: "user_partner_student_001", organization_id: "org_partner_001" }, ids.rows[0].evidence_id), null); assert.equal(await getTruthFactForActor({ user_id: "user_partner_student_001", organization_id: "org_partner_001" }, ids.rows[0].truth_fact_id), null);
});

test("Arcade, Project, Attendance, and Instructor Verification project from canonical source rows", async () => {
  const { assignment } = await fixture();
  const arcadeAdmin = { user_id: ADMIN, organization_id: ORG, roles: ["org_admin"], permissions: ["arcade.activity.manage", "arcade.attempt"] };
  const activity = await arcade.createActivity(arcadeAdmin as any, { slug: `${RUN}-arcade`, title: "Phase 6 Arcade", activityType: "SCENARIO", masteryRule: "PASSED_FLAG" }); created.arcadeActivities.push(activity.id);
  const arcadeLearner = { user_id: LEARNER, organization_id: ORG, roles: ["student"], permissions: ["arcade.attempt"] };
  const attempt = await arcade.startAttempt(arcadeLearner as any, activity.id); created.arcadeAttempts.push(attempt.id);
  const result = await arcade.submitResult(arcadeLearner as any, attempt.id, { passed: true }); created.sourceIds.push(result.id);
  await rule("ARCADE_RESULT", "ARCADE_MASTERY", "ARCADE_MASTERY_ACHIEVED"); await projectTwice("arcade.resulted", result.id);

  const projectId = `${RUN}-project`; const teamId = `${RUN}-team`; const submissionId = `${RUN}-submission`; created.projectIds.push(projectId);
  await query("INSERT INTO projects (project_id,organization_id,tenant_id,title,project_type,status,created_by_user_id) VALUES ($1,$2,$3,$4,'EDUCATIONAL_PROJECT','ACTIVE',$5)", [projectId, ORG, `tenant:${ORG}`, "Phase 6 Project", ADMIN]);
  await query("INSERT INTO project_teams (team_id,project_id,organization_id,tenant_id,mode,status) VALUES ($1,$2,$3,$4,'INDIVIDUAL_INTEGRATED_MODE','ACTIVE')", [teamId, projectId, ORG, `tenant:${ORG}`]);
  await query("INSERT INTO project_submissions (submission_id,project_id,team_id,organization_id,tenant_id,submitted_by_user_id,version,payload_json,artifact_refs_json,status) VALUES ($1,$2,$3,$4,$5,$6,1,'{}','[]','SUBMITTED')", [submissionId, projectId, teamId, ORG, `tenant:${ORG}`, LEARNER]);
  const projectService = new ProjectService(); await projectService.review({ user_id: ADMIN, organization_id: ORG, permissions: ["project.submission.review"] }, submissionId, "ACCEPTED"); created.sourceIds.push(submissionId);
  await rule("PROJECT_SUBMISSION", "PROJECT_ACCEPTED", "PROJECT_ACCEPTED"); await projectTwice("project.submission.reviewed", submissionId);

  const session = await new LiveSessionRepo().create({ id: `${RUN}-session`, organizationId: ORG, provider: "mock", providerSessionId: "phase6", title: "Phase 6 Session", description: null, courseId: null, moduleId: null, lessonId: null, instructorId: ADMIN, cohortId: null, audienceScope: "ORGANIZATION", startsAt: new Date(Date.now()-60000).toISOString(), endsAt: new Date(Date.now()+60000).toISOString(), timezone: "UTC", status: "ACTIVE", accessPolicy: {}, recordingPolicy: {} }); created.liveSessionIds.push(session.id);
  const joinId = `${RUN}-join`; await query("INSERT INTO live_session_join_events (join_event_id,live_session_id,user_id,decision,attendance_status) VALUES ($1,$2,$3,'allow','authorized')", [joinId, session.id, LEARNER]); created.sourceIds.push(joinId);
  await confirmAttendance({ user_id: ADMIN, organization_id: ORG, tenant_id: `tenant:${ORG}`, permissions: ["liveLearning.join.authorize"] }, joinId);
  await rule("ATTENDANCE", null, "ATTENDANCE_CONFIRMED"); await projectTwice("attendance.confirmed", joinId);

  const activityResultId = `${RUN}-prepare-result`; const evidenceId = `${RUN}-prepare-evidence`; const decisionId = `${RUN}-decision`; created.sourceIds.push(activityResultId, evidenceId, decisionId);
  await query("INSERT INTO prepare_prove_activity_results (result_id,activity_type,activity_id,user_id,organization_id,tenant_id,result_status,result_json) VALUES ($1,'PHASE6',$2,$3,$4,$5,'SUCCEEDED','{}')", [activityResultId, `${RUN}-activity`, LEARNER, ORG, `tenant:${ORG}`]);
  await query("INSERT INTO prepare_prove_evidence (evidence_id,source_domain,source_record_id,user_id,organization_id,tenant_id,activity_id,criterion,status,provenance_json) VALUES ($1,'prepare_prove_activity',$2,$3,$4,$5,$6,'proof','REVIEWED','{}')", [evidenceId, activityResultId, LEARNER, ORG, `tenant:${ORG}`, `${RUN}-activity`]);
  const competency = await query("SELECT competency_id FROM competency_definitions ORDER BY competency_id LIMIT 1"); assert.ok(competency.rows[0]);
  await query("INSERT INTO learner_competency_decisions (decision_id,competency_id,evidence_id,user_id,organization_id,tenant_id,decision,criteria_version,reviewer_user_id,reviewer_authority,provenance_json) VALUES ($1,$2,$3,$4,$5,$6,'DEMONSTRATED',1,$7,'phase6-test','{}')", [decisionId, competency.rows[0].competency_id, evidenceId, LEARNER, ORG, `tenant:${ORG}`, ADMIN]);
  await rule("INSTRUCTOR_VERIFICATION", "INSTRUCTOR_VERIFICATION", "COMPETENCY_VERIFIED"); await projectTwice("competency.reviewed", decisionId);

  const counts = await query("SELECT source_type, COUNT(*)::int AS n FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1 GROUP BY source_type ORDER BY source_type", [`${RUN}%`]);
  assert.deepEqual(counts.rows.map((r: any) => [r.source_type, r.n]), [["ARCADE_RESULT", 1], ["ATTENDANCE", 1], ["INSTRUCTOR_VERIFICATION", 1], ["PROJECT_SUBMISSION", 1]]);
  const truth = await query("SELECT * FROM curriculum_truth_facts WHERE source_type='ARCADE_RESULT' AND evidence_rule_id LIKE $1", [`${RUN}%`]);
  const spineFact = toTruthSpineFact(truth.rows[0]);
  assert.equal(spineFact.fact_id, truth.rows[0].truth_fact_id);
  assert.equal(spineFact.organization_id, ORG);
  assert.equal(spineFact.subject_id, LEARNER);
  assert.equal(spineFact.source_record_id, truth.rows[0].source_record_id);
  assert.equal(spineFact.evidence_rule_version, truth.rows[0].evidence_rule_version);
  assert.equal(assignment.curriculumReleaseId.length > 0, true);
});

beforeEach(async () => { await cleanup(); await ensureBaseFixture(); });
after(cleanup);
