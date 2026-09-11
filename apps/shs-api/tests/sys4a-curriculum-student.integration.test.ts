import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { query } from "../src/db/client.ts";

const BASE = process.env.SHS_API_TEST_BASE_URL || "http://127.0.0.1:8093";
const RUN = `sys4a-${Date.now()}`;
const ORG = "org_shf_001";
const TENANT = `tenant:${ORG}`;
const ADMIN = "user_admin_001";
const STUDENT = "user_student_001";

function auth(userId: string) {
  return { Authorization: `Bearer dev-token:${userId}`, "Content-Type": "application/json" };
}

async function api(path: string, options: { userId: string; method?: string; body?: unknown }) {
  const response = await fetch(`${BASE}${path}`, {
    method: options.method || "GET",
    headers: auth(options.userId),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body };
}

async function grantFixturePermissions() {
  await query(
    `INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id, audience)
     VALUES ('sys4a-curriculum-service', 'curriculum', 'Curriculum', 'SYS-4A acceptance curriculum service', 'CURRICULUM', 'ACTIVE', $1, 'NETWORK_ORGANIZATION')
     ON CONFLICT (service_key) DO NOTHING`,
    [ORG],
  );
  await query(
    `INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status, granted_by_user_id, reason)
     VALUES ($1, $2, (SELECT service_id FROM service_catalog WHERE service_key='curriculum'), 'ACTIVE', $3, 'SYS-4A acceptance fixture')
     ON CONFLICT (organization_id, service_id) WHERE status='ACTIVE' DO NOTHING`,
    [`${RUN}-curriculum-entitlement`, ORG, ADMIN],
  );
  const permissions = [
    "cohort.manage", "enrollment.manage", "enrollment.view", "assignment.manage", "assignment.view",
    "curriculum.catalog.manage", "curriculum.catalog.approve", "curriculum.catalog.publish",
    "curriculum.lesson.complete",
  ];
  for (const permission of permissions) {
    await query(
      `INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
       VALUES ($1, 'role_org_admin', $2) ON CONFLICT (role_id, permission_name) DO NOTHING`,
      [`${RUN}-${permission.replace(/[^a-z0-9]+/gi, "-")}`, permission],
    );
  }
  await query(`INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES ($1, $2, 'student', 'organization', true) ON CONFLICT (role_id) DO NOTHING`, [`${RUN}-student-role`, ORG]);
  for (const permission of ["enrollment.view", "assignment.view", "curriculum.lesson.complete"]) {
    await query(
      `INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
       VALUES ($1, $2, $3) ON CONFLICT (role_id, permission_name) DO NOTHING`,
      [`${RUN}-student-${permission.replace(/[^a-z0-9]+/gi, "-")}`, `${RUN}-student-role`, permission],
    );
  }
  await query(
    `INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from)
     VALUES ($1, $2, $3, $4, 'active', NOW()) ON CONFLICT (membership_id) DO NOTHING`,
    [`${RUN}-student-membership`, STUDENT, ORG, `${RUN}-student-role`],
  );
}

before(async () => {
  // The acceptance database is disposable; remove only this fixture learner's
  // prior enrollment so repeated runs exercise the real create path.
  await query("DELETE FROM enrollments WHERE organization_id=$1 AND learner_user_id=$2 AND program_id=$3", [ORG, STUDENT, "program_seed_001"]);
  await grantFixturePermissions();
});

after(async () => {
  await query("DELETE FROM integration_outbox WHERE correlation_id LIKE $1", [`curriculum-completion:${RUN}%`]).catch(() => {});
  await query("DELETE FROM memberships WHERE membership_id=$1", [`${RUN}-student-membership`]).catch(() => {});
  await query("DELETE FROM role_permissions WHERE role_id=$1", [`${RUN}-student-role`]).catch(() => {});
  await query("DELETE FROM roles WHERE role_id=$1", [`${RUN}-student-role`]).catch(() => {});
});

test("SYS-4A continuous catalog -> enrollment -> assignment -> activity -> completion path", async () => {
  const cohort = await api("/cohorts", {
    userId: ADMIN,
    method: "POST",
    body: { name: `${RUN} cohort`, programId: "program_seed_001", startsAt: new Date(Date.now() - 86400000).toISOString(), endsAt: new Date(Date.now() + 86400000 * 30).toISOString() },
  });
  assert.equal(cohort.status, 201);
  const cohortId = cohort.body.data.cohortId;

  const enrollment = await api("/enrollments", {
    userId: ADMIN,
    method: "POST",
    body: { learnerUserId: STUDENT, programId: "program_seed_001", cohortId, status: "ACTIVE" },
  });
  assert.equal(enrollment.status, 201, JSON.stringify(enrollment.body));
  assert.equal((await api("/enrollments/me", { userId: STUDENT })).body.data.items[0].cohortId, cohortId);

  const course = await api("/curriculum/catalog/courses", { userId: ADMIN, method: "POST", body: { title: `${RUN} course`, stableKey: RUN } });
  assert.equal(course.status, 200);
  const courseId = course.body.data.courseId;
  const unit = await api(`/curriculum/catalog/courses/${courseId}/units`, { userId: ADMIN, method: "POST", body: { title: `${RUN} unit`, stableKey: "unit-1" } });
  assert.equal(unit.status, 200);
  const lesson = await api(`/curriculum/catalog/units/${unit.body.data.unitId}/lessons`, { userId: ADMIN, method: "POST", body: { title: `${RUN} lesson`, stableKey: "lesson-1" } });
  assert.equal(lesson.status, 200);
  const lessonId = lesson.body.data.lessonId;
  await query(
    `INSERT INTO curriculum_assessment_definitions (assessment_definition_id, organization_id, lesson_id, items, created_by_user_id)
     VALUES ($1,$2,$3,$4::jsonb,$5)`,
    [`${RUN}-assessment`, ORG, lessonId, JSON.stringify([{ itemId: "q1", type: "mcq", prompt: "One plus one?", choices: ["1", "2"], correctIndex: 1 }]), ADMIN],
  );
  await query(
    `INSERT INTO curriculum_reflection_definitions (reflection_definition_id, organization_id, lesson_id, items, created_by_user_id)
     VALUES ($1,$2,$3,$4::jsonb,$5)`,
    [`${RUN}-reflection`, ORG, lessonId, JSON.stringify([{ itemId: "r1", prompt: "What did you learn?" }]), ADMIN],
  );
  await query(
    `INSERT INTO curriculum_practice_definitions (practice_definition_id, organization_id, lesson_id, title, completion_mode, completion_action_label, created_by_user_id)
     VALUES ($1,$2,$3,$4,'COMPLETION','Submit practice',$5)`,
    [`${RUN}-practice`, ORG, lessonId, `${RUN} practice`, ADMIN],
  );
  const current = await query("SELECT revision FROM curriculum_courses WHERE course_id=$1", [courseId]);
  const submit = await api(`/curriculum/catalog/courses/${courseId}/submit-review`, { userId: ADMIN, method: "POST", body: { revision: current.rows[0].revision } });
  assert.equal(submit.status, 200);
  const approved = await api(`/curriculum/catalog/courses/${courseId}/approve`, { userId: ADMIN, method: "POST", body: { revision: submit.body.data.revision } });
  assert.equal(approved.status, 200);
  const published = await api(`/curriculum/catalog/courses/${courseId}/publish`, { userId: ADMIN, method: "POST", body: { revision: approved.body.data.revision } });
  assert.equal(published.status, 200);
  const release = published.body.data.release;
  const policy = await api("/completion-policies", { userId: ADMIN, method: "POST", body: { curriculumReleaseId: release.releaseId, assignedContentType: "COURSE" } });
  assert.equal(policy.status, 200, JSON.stringify(policy.body));
  const policyId = policy.body.data.policyId;
  const requirement = await api(`/completion-policies/${policyId}/requirements`, { userId: ADMIN, method: "POST", body: { requirementType: "ASSESSMENT", required: true, configuration: { passThresholdPercent: 100 } } });
  assert.equal(requirement.status, 200, JSON.stringify(requirement.body));
  const policyAfterRequirement = await api(`/completion-policies/${policyId}`, { userId: ADMIN });
  assert.equal(policyAfterRequirement.status, 200, JSON.stringify(policyAfterRequirement.body));
  const activatedPolicy = await api(`/completion-policies/${policyId}/activate`, { userId: ADMIN, method: "POST", body: { revision: policyAfterRequirement.body.data.policy.revision } });
  assert.equal(activatedPolicy.status, 200, JSON.stringify(activatedPolicy.body));

  const assignment = await api("/assignments", {
    userId: ADMIN,
    method: "POST",
    body: { title: `${RUN} assignment`, dueAt: new Date(Date.now() + 86400000).toISOString(), targets: [{ targetType: "LEARNER", learnerUserId: STUDENT }], curriculumReleaseId: release.releaseId, assignedContentType: "COURSE", completionPolicyId: policyId },
  });
  assert.equal(assignment.status, 201);
  const assignmentId = assignment.body.data.assignmentId || assignment.body.data.id;
  assert.ok(assignmentId, JSON.stringify(assignment.body));

  const courses = await api("/curriculum/learning/courses", { userId: STUDENT });
  assert.equal(courses.status, 200);
  assert.ok(courses.body.data.items.some((item: any) => item.stableKey === RUN));
  const assigned = await api("/assignments", { userId: STUDENT });
  assert.equal(assigned.status, 200, JSON.stringify(assigned.body));
  assert.ok(assigned.body.data.items.some((item: any) => item.id === assignmentId), JSON.stringify(assigned.body));
  const state = await api(`/activity-domains/assignments/${assignmentId}/lessons/unit-1/lesson-1`, { userId: STUDENT });
  assert.equal(state.status, 200, `${assignmentId} ${JSON.stringify(state.body)}`);
  assert.equal(state.body.data.lesson.stableKey, "lesson-1");
  assert.equal(Object.prototype.hasOwnProperty.call(state.body.data.lesson.assessmentDefinition?.items?.[0] || {}, "correctIndex"), false);
  assert.equal(state.body.data.assessment.items[0].correctIndex, undefined);

  const practice = await api("/activity-domains/practices/submissions", { userId: STUDENT, method: "POST", body: { assignmentId, unitStableKey: "unit-1", lessonStableKey: "lesson-1", actions: [{ action: "completed" }], idempotencyKey: `${RUN}-practice` } });
  assert.equal(practice.status, 201);
  const reflection = await api("/activity-domains/reflections/submissions", { userId: STUDENT, method: "POST", body: { assignmentId, unitStableKey: "unit-1", lessonStableKey: "lesson-1", responses: [{ itemId: "r1", text: "A durable result." }], idempotencyKey: `${RUN}-reflection` } });
  assert.equal(reflection.status, 201);
  const assessment = await api("/activity-domains/assessments/submissions", { userId: STUDENT, method: "POST", body: { assignmentId, unitStableKey: "unit-1", lessonStableKey: "lesson-1", answers: [{ itemId: "q1", choiceIndex: 1 }], idempotencyKey: `${RUN}-assessment` } });
  assert.equal(assessment.status, 201);
  assert.equal(assessment.body.data.passed, true);

  const completion = await api(`/assignments/${assignmentId}/check-completion`, { userId: STUDENT, method: "POST", body: { unitStableKey: "unit-1", lessonStableKey: "lesson-1" } });
  assert.equal(completion.status, 200);
  assert.equal(completion.body.data.complete, true, JSON.stringify(completion.body));
  const next = await api("/assignments/me/next", { userId: STUDENT });
  assert.equal(next.status, 200);
  const completedAssignment = await api("/assignments", { userId: STUDENT });
  assert.equal(completedAssignment.status, 200);
  assert.equal(completedAssignment.body.data.items.find((item: any) => item.id === assignmentId)?.accessState, "COMPLETED");

  const persisted = await query(
    `SELECT (SELECT COUNT(*) FROM enrollments WHERE enrollment_id=$1) AS enrollments,
            (SELECT COUNT(*) FROM assessment_results WHERE assessment_result_id=$2) AS assessments,
            (SELECT COUNT(*) FROM reflection_submissions WHERE reflection_submission_id=$3) AS reflections,
            (SELECT COUNT(*) FROM practice_results WHERE practice_result_id=$4) AS practices,
            (SELECT COUNT(*) FROM curriculum_lesson_completions WHERE completion_id=$5) AS completions`,
    [enrollment.body.data.enrollmentId, assessment.body.data.assessmentResultId, reflection.body.data.reflectionSubmissionId, practice.body.data.practiceResultId, completion.body.data.completion.completion_id],
  );
  assert.deepEqual(persisted.rows[0], { enrollments: "1", assessments: "1", reflections: "1", practices: "1", completions: "1" });
});
