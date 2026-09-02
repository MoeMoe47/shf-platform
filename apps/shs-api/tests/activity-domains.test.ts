import { after, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { CurriculumCatalogRepo } from "../src/domain/curriculum-catalog/repo/curriculum-catalog-repo.ts";
import * as catalog from "../src/domain/curriculum-catalog/service/curriculum-catalog-service.ts";
import * as assignments from "../src/domain/assignments/service/assignment-service.ts";
import * as policies from "../src/domain/completion-policy/service/completion-policy-service.ts";
import { evaluateAssignmentCompletion } from "../src/domain/completion-policy/service/completion-evaluator.ts";
import * as activities from "../src/domain/activity-domains/service/activity-domain-service.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";
import { createEvidenceRule, projectAuthoritativeOutboxEvent } from "../src/domain/verified-evidence/service/verified-evidence-service.ts";

const RUN = `phase5_${Date.now()}`;
const ADMIN = "user_admin_001";
const LEARNER = "user_assignment_technical_001";
const LEARNER_B = "user_assignment_networking_001";
const PARTNER = "user_partner_student_001";
const ORG = "org_shf_001";

const adminActor = { userId: ADMIN, organizationId: ORG };
const learnerActor = { user_id: LEARNER, organization_id: ORG, roles: ["student"], permissions: ["assignment.view"] };
const learnerBActor = { user_id: LEARNER_B, organization_id: ORG, roles: ["student"], permissions: ["assignment.view"] };
const partnerActor = { user_id: PARTNER, organization_id: "org_partner_001", roles: ["student"], permissions: ["assignment.view"] };
const createdCourseIds = new Set<string>();
const createdAssignmentIds = new Set<string>();
const createdPolicyIds = new Set<string>();

async function cleanup() {
  await query("DELETE FROM curriculum_truth_facts WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM prepare_prove_evidence WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM curriculum_evidence_rules WHERE evidence_rule_id LIKE $1", [`${RUN}%`]);
  await query("DELETE FROM integration_outbox WHERE idempotency_key LIKE $1", [`%${RUN}%`]);
  const assignmentIds = [...createdAssignmentIds];
  if (assignmentIds.length) {
    await query("DELETE FROM practice_results WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM practice_attempts WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM reflection_submissions WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM assessment_results WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM assessment_attempts WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM curriculum_lesson_completions WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM assignment_targets WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
    await query("DELETE FROM assignments WHERE assignment_id = ANY($1::text[])", [assignmentIds]);
  }
  const policyIds = [...createdPolicyIds];
  if (policyIds.length) {
    await query("DELETE FROM completion_policy_requirements WHERE policy_id = ANY($1::text[])", [policyIds]);
    await query("DELETE FROM completion_policies WHERE policy_id = ANY($1::text[])", [policyIds]);
  }
  const courseIds = [...createdCourseIds];
  if (courseIds.length) {
    await query("DELETE FROM curriculum_releases WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_assessment_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))", [courseIds]);
    await query("DELETE FROM curriculum_reflection_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))", [courseIds]);
    await query("DELETE FROM curriculum_practice_definitions WHERE lesson_id IN (SELECT lesson_id FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[])))", [courseIds]);
    await query("DELETE FROM curriculum_lessons WHERE unit_id IN (SELECT unit_id FROM curriculum_units WHERE course_id = ANY($1::text[]))", [courseIds]);
    await query("DELETE FROM curriculum_units WHERE course_id = ANY($1::text[])", [courseIds]);
    await query("DELETE FROM curriculum_courses WHERE course_id = ANY($1::text[])", [courseIds]);
  }
}

after(cleanup);

async function publishCourseWithDefinitions(suffix: string) {
  await withSeedRetry(cleanup);
  const repo = new CurriculumCatalogRepo();
  const course = await catalog.createCourse(adminActor, { title: `${RUN} ${suffix}`, stableKey: `${RUN}-${suffix}` });
  createdCourseIds.add(course.courseId);
  const unit = await catalog.createUnit(adminActor, course.courseId, { title: "Unit One", stableKey: "unit-one" });
  const lesson = await catalog.createLesson(adminActor, unit.unitId, { title: "Lesson One", stableKey: "lesson-one" });
  await repo.upsertAssessmentDefinition({
    assessmentDefinitionId: `assessment_definition_${RUN}_${suffix}`,
    organizationId: ORG,
    lessonId: lesson.lessonId,
    items: [{ itemId: "q1", type: "mcq", prompt: "Pick A", choices: ["A", "B"], correctIndex: 0 }],
    sourceReference: null,
    sourceHash: null,
    actorUserId: ADMIN,
  });
  await repo.upsertReflectionDefinition({
    reflectionDefinitionId: `reflection_definition_${RUN}_${suffix}`,
    organizationId: ORG,
    lessonId: lesson.lessonId,
    items: [{ itemId: "r1", prompt: "Reflect" }],
    sourceReference: null,
    sourceHash: null,
    actorUserId: ADMIN,
  });
  await repo.upsertPracticeDefinition({
    practiceDefinitionId: `practice_definition_${RUN}_${suffix}`,
    organizationId: ORG,
    lessonId: lesson.lessonId,
    title: "Practice",
    instructions: "Do the action",
    completionMode: "COMPLETION",
    completionActionLabel: "submitted",
    items: [{ itemId: "p1", type: "guided", prompt: "Practice" }],
    sourceReference: null,
    sourceHash: null,
    actorUserId: ADMIN,
  });
  await catalog.submitForReview(adminActor, course.courseId, 1);
  await catalog.approveCourse(adminActor, course.courseId, 2);
  const published = await catalog.publishCourse(adminActor, course.courseId, 3);
  return { course, unit, lesson, release: published.release };
}

async function createCompositePolicy(releaseId: string) {
  const policy = await policies.createPolicy(adminActor, { curriculumReleaseId: releaseId, assignedContentType: "LESSON", assignedContentUnitKey: "unit-one", assignedContentLessonKey: "lesson-one" });
  createdPolicyIds.add(policy.policyId);
  await policies.addRequirement(adminActor, policy.policyId, { requirementType: "CONTENT" });
  await policies.addRequirement(adminActor, policy.policyId, { requirementType: "ASSESSMENT", configuration: { passThresholdPercent: 80 } });
  await policies.addRequirement(adminActor, policy.policyId, { requirementType: "REFLECTION" });
  await policies.addRequirement(adminActor, policy.policyId, { requirementType: "PRACTICE" });
  await policies.activatePolicy(adminActor, policy.policyId, 5);
  return policy.policyId;
}

async function createAssignment(releaseId: string, policyId: string, learnerUserId = LEARNER) {
  const assignment = await assignments.createAssignment(
    { user_id: ADMIN, organization_id: ORG, roles: ["org_admin"] },
    {
      title: `${RUN} Assignment`,
      dueAt: new Date(Date.now() + 86_400_000).toISOString(),
      visibilityScope: "targeted",
      targets: [{ targetType: "LEARNER", learnerUserId }],
      curriculumReleaseId: releaseId,
      assignedContentType: "LESSON",
      assignedContentUnitKey: "unit-one",
      assignedContentLessonKey: "lesson-one",
      completionPolicyId: policyId,
    },
  );
  createdAssignmentIds.add(assignment.id);
  return assignment;
}

test("Assessment, Reflection, and Practice results are canonical and drive composite completion", async () => {
  const { release } = await publishCourseWithDefinitions("composite");
  const policyId = await createCompositePolicy(release.releaseId);
  const assignment = await createAssignment(release.releaseId, policyId);

  let evaluation = await evaluateAssignmentCompletion(learnerActor as any, assignment.id, "unit-one", "lesson-one");
  assert.equal(evaluation.eligible, false);

  const assessment = await activities.submitAssessment(learnerActor as any, {
    assignmentId: assignment.id,
    unitStableKey: "unit-one",
    lessonStableKey: "lesson-one",
    answers: [{ itemId: "q1", choiceIndex: 0, score: 999, completed: true }],
    idempotencyKey: `${RUN}:assessment`,
  });
  assert.equal(assessment.score, 1);
  assert.equal(assessment.percent, 100);
  assert.equal(assessment.passed, true);
  await createEvidenceRule({ user_id: ADMIN, organization_id: ORG }, {
    evidenceRuleId: `${RUN}:assessment-evidence`, sourceType: "ASSESSMENT_RESULT",
    evidenceType: "ASSESSMENT_RESULT", truthFactType: "ASSESSMENT_PASSED", ruleVersion: 1,
  });
  const assessmentProjection = await projectAuthoritativeOutboxEvent({
    event_type: "assessment.submitted", subject_id: assessment.assessmentResultId,
    organization_id: ORG, payload: { source_record_id: assessment.assessmentResultId },
  });
  assert.equal(assessmentProjection.projected, 1);
  const assessmentReplay = await projectAuthoritativeOutboxEvent({
    event_type: "assessment.submitted", subject_id: assessment.assessmentResultId,
    organization_id: ORG, payload: { source_record_id: assessment.assessmentResultId },
  });
  assert.equal(assessmentReplay.projected, 1);
  const projected = await query("SELECT COUNT(*)::int AS evidence_count FROM prepare_prove_evidence WHERE source_record_id=$1 AND evidence_rule_id=$2", [assessment.assessmentResultId, `${RUN}:assessment-evidence`]);
  const truth = await query("SELECT COUNT(*)::int AS truth_count, MAX(curriculum_release_id) AS release_id, MAX(assignment_id) AS assignment_id FROM curriculum_truth_facts WHERE source_record_id=$1 AND evidence_rule_id=$2", [assessment.assessmentResultId, `${RUN}:assessment-evidence`]);
  assert.equal(projected.rows[0].evidence_count, 1);
  assert.equal(truth.rows[0].truth_count, 1);
  assert.equal(truth.rows[0].release_id, release.releaseId);
  assert.equal(truth.rows[0].assignment_id, assignment.id);
  const assessmentRetry = await activities.submitAssessment(learnerActor as any, {
    assignmentId: assignment.id,
    unitStableKey: "unit-one",
    lessonStableKey: "lesson-one",
    answers: [{ itemId: "q1", choiceIndex: 1 }],
    idempotencyKey: `${RUN}:assessment`,
  });
  assert.equal(assessmentRetry.assessmentResultId, assessment.assessmentResultId);

  evaluation = await evaluateAssignmentCompletion(learnerActor as any, assignment.id, "unit-one", "lesson-one");
  assert.equal(evaluation.eligible, false);

  await activities.submitReflection(learnerActor as any, {
    assignmentId: assignment.id,
    unitStableKey: "unit-one",
    lessonStableKey: "lesson-one",
    responses: [{ itemId: "r1", text: "Canonical response" }],
    idempotencyKey: `${RUN}:reflection`,
  });
  evaluation = await evaluateAssignmentCompletion(learnerActor as any, assignment.id, "unit-one", "lesson-one");
  assert.equal(evaluation.eligible, false);

  await activities.submitPractice(learnerActor as any, {
    assignmentId: assignment.id,
    unitStableKey: "unit-one",
    lessonStableKey: "lesson-one",
    actions: [{ itemId: "p1", text: "I performed the required practice action", completed: false }],
    idempotencyKey: `${RUN}:practice`,
  });
  evaluation = await evaluateAssignmentCompletion(learnerActor as any, assignment.id, "unit-one", "lesson-one");
  assert.equal(evaluation.eligible, true);
  assert.deepEqual(evaluation.requirements.filter((r) => r.required).map((r) => r.status), ["SATISFIED", "SATISFIED", "SATISFIED", "SATISFIED"]);
});

test("Activity result lineage remains bound to Release 1 after Release 2 changes definitions", async () => {
  const { course, lesson, release } = await publishCourseWithDefinitions("stability");
  const policyId = await createCompositePolicy(release.releaseId);
  const assignment = await createAssignment(release.releaseId, policyId);
  const result = await activities.submitAssessment(learnerActor as any, {
    assignmentId: assignment.id,
    unitStableKey: "unit-one",
    lessonStableKey: "lesson-one",
    answers: [{ itemId: "q1", choiceIndex: 0 }],
    idempotencyKey: `${RUN}:release-stability`,
  });
  assert.equal(result.curriculumReleaseId, release.releaseId);
  assert.equal(result.releaseVersion, 1);

  const repo = new CurriculumCatalogRepo();
  await catalog.reopenCourse(adminActor, course.courseId, 4);
  await repo.upsertAssessmentDefinition({
    assessmentDefinitionId: `assessment_definition_${RUN}_changed`,
    organizationId: ORG,
    lessonId: lesson.lessonId,
    items: [{ itemId: "q1", type: "mcq", prompt: "Pick B", choices: ["A", "B"], correctIndex: 1 }],
    sourceReference: null,
    sourceHash: null,
    actorUserId: ADMIN,
  });
  await catalog.submitForReview(adminActor, course.courseId, 5);
  await catalog.approveCourse(adminActor, course.courseId, 6);
  const v2 = await catalog.publishCourse(adminActor, course.courseId, 7);
  assert.notEqual(v2.release.releaseId, release.releaseId);

  const reread = await assignments.getAssignmentForActor(assignment.id, { user_id: ADMIN, organization_id: ORG, roles: ["org_admin"] });
  assert.equal(reread?.curriculumReleaseId, release.releaseId);
  const evaluation = await evaluateAssignmentCompletion(learnerActor as any, assignment.id, "unit-one", "lesson-one");
  assert.equal(evaluation.curriculumReleaseId, release.releaseId);
  assert.equal(evaluation.releaseVersion, 1);
});

test("Activity APIs fail closed across org and learner boundaries", async () => {
  const { release } = await publishCourseWithDefinitions("idor");
  const policyId = await createCompositePolicy(release.releaseId);
  const assignment = await createAssignment(release.releaseId, policyId);

  await assert.rejects(
    activities.submitAssessment(partnerActor as any, {
      assignmentId: assignment.id,
      unitStableKey: "unit-one",
      lessonStableKey: "lesson-one",
      answers: [{ itemId: "q1", choiceIndex: 0 }],
      idempotencyKey: `${RUN}:partner`,
    }),
    /Assignment not found/,
  );
  await assert.rejects(
    evaluateAssignmentCompletion(learnerBActor as any, assignment.id, "unit-one", "lesson-one"),
    /assignment_not_found/,
  );
  await assert.rejects(
    activities.submitReflection(learnerBActor as any, {
      assignmentId: assignment.id,
      unitStableKey: "unit-one",
      lessonStableKey: "lesson-one",
      responses: [{ itemId: "r1", text: "probe" }],
      idempotencyKey: `${RUN}:partner`,
    }),
    /Assignment not found/,
  );
});
