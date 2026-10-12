import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!api || !database) throw new Error("Curriculum evidence acceptance requires the isolated Phase 8 environment.");

const auth = (id) => ({ Authorization: `Bearer dev-token:${id}`, "Content-Type": "application/json" });

async function call(request, actor, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, {
    ...options,
    headers: { ...auth(actor), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

function sql(statement) {
  return execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-A", "-t", "-c", statement], { encoding: "utf8" }).trim();
}

function scalar(statement) {
  return sql(statement).split("\n").at(-1);
}

function assertIsolatedDatabase() {
  const url = new URL(database);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  expect(url.hostname).toBe("127.0.0.1");
  expect(Number(url.port)).not.toBe(5432);
  expect(["shs_dev", "shf_dev"].includes(databaseName)).toBe(false);
  expect(databaseName).toMatch(/^shs_phase8_acceptance_/);
  return { databaseName, port: Number(url.port) };
}

test.describe.configure({ mode: "serial" });

test("Curriculum completion, assessment evidence, review, and isolation use canonical records", async ({ request }) => {
  const isolated = assertIsolatedDatabase();
  console.log(`Verified disposable DB ${isolated.databaseName} on loopback port ${isolated.port}; demo auth is disabled by the harness invocation.`);

  // This fixture-only grant enables the existing admin evidence-rule and
  // projection routes in this disposable database; it does not touch app roles.
  sql(`
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('curriculum_evidence_acceptance_catalog_manage','phase8_role_admin','curriculum.catalog.manage'),
      ('curriculum_evidence_acceptance_truth_override','phase8_role_admin','truth.override')
    ON CONFLICT (role_permission_id) DO NOTHING;
  `);
  sql(`
    INSERT INTO curriculum_courses (course_id,organization_id,stable_key,title,status,created_by_user_id,updated_by_user_id)
    VALUES ('phase9_course_a','phase8_org_a','phase9-course-a','Course A','PUBLISHED','admin_A','admin_A') ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_units (unit_id,organization_id,course_id,stable_key,title,sequence)
    VALUES ('phase9_unit_a','phase8_org_a','phase9_course_a','unit-a','Unit A',1) ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_lessons (lesson_id,organization_id,unit_id,stable_key,title,summary,objectives,sequence,status)
    VALUES ('phase9_lesson_a','phase8_org_a','phase9_unit_a','lesson-a','Lesson A','Prepare, practice, and demonstrate a safe finding.','["Complete the canonical learning activities."]',1,'ACTIVE')
    ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_assessment_definitions (assessment_definition_id,organization_id,lesson_id,items,source_reference,created_by_user_id)
    VALUES ('phase9_assessment_a','phase8_org_a','phase9_lesson_a','[{"itemId":"assessment-item-a","type":"mcq","prompt":"Which response is safest?","choices":["Record evidence and escalate","Make an unapproved change"],"correctIndex":0}]','curriculum-evidence-acceptance','admin_A') ON CONFLICT DO NOTHING;
    INSERT INTO curriculum_releases (release_id,organization_id,course_id,version_number,snapshot,content_hash,status,published_by_user_id)
    VALUES ('phase9_release_1','phase8_org_a','phase9_course_a',1,
    '{"course":{"stableKey":"phase9-course-a","title":"Course A","shortDescription":"A canonical evidence acceptance course."},"units":[{"stableKey":"unit-a","title":"Unit A","sequence":1,"lessons":[{"stableKey":"lesson-a","title":"Lesson A","summary":"Prepare, practice, and demonstrate a safe finding.","objectives":["Complete the canonical learning activities."],"estimatedDurationMinutes":45,"sequence":1,"resources":[],"arcadeLinks":[],"assessmentDefinition":{"assessmentDefinitionId":"phase9_assessment_a","items":[{"itemId":"assessment-item-a","type":"mcq","prompt":"Which response is safest?","choices":["Record evidence and escalate","Make an unapproved change"],"correctIndex":0}]}}]}]}',
    'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','PUBLISHED','admin_A') ON CONFLICT DO NOTHING;
    INSERT INTO completion_policies (policy_id,organization_id,curriculum_release_id,assigned_content_type,assigned_content_id,status,version,created_by_user_id)
    VALUES ('phase9_policy_a','phase8_org_a','phase9_release_1','LESSON','unit-a:lesson-a','DRAFT',1,'admin_A') ON CONFLICT DO NOTHING;
    INSERT INTO completion_policy_requirements (requirement_id,policy_id,organization_id,requirement_type,target_reference,configuration,required,sequence)
    VALUES ('phase9_req_assessment','phase9_policy_a','phase8_org_a','ASSESSMENT',NULL,'{"passThresholdPercent":100}',true,1)
    ON CONFLICT DO NOTHING;
    UPDATE completion_policies SET status='ACTIVE',activated_by_user_id='admin_A',activated_at=NOW() WHERE policy_id='phase9_policy_a' AND status='DRAFT';
    INSERT INTO assignments (assignment_id,organization_id,cohort_id,course_id,lesson_id,title,assignment_type,created_by,due_at,status,curriculum_release_id,assigned_content_type,assigned_content_id,visibility_scope,completion_policy_id)
    VALUES ('phase9_assignment_a','phase8_org_a','phase8_cohort_a','phase9_course_a','phase9_lesson_a','Assignment A','assignment','admin_A',NOW()+INTERVAL '14 days','published','phase9_release_1','LESSON','unit-a:lesson-a','targeted','phase9_policy_a') ON CONFLICT DO NOTHING;
    INSERT INTO assignment_targets (assignment_target_id,assignment_id,organization_id,target_type,user_id,created_by)
    VALUES ('phase9_target_a1','phase9_assignment_a','phase8_org_a','LEARNER','learner_A1','admin_A') ON CONFLICT DO NOTHING;
  `);

  const instructorAssignment = await call(request, "instructor_A_authorized", "/assignments/phase8_assignment_a");
  expect(instructorAssignment.response.status()).toBe(200);
  expect(instructorAssignment.data.id).toBe("phase8_assignment_a");

  const learnerAssignment = await call(request, "learner_A1", "/assignments/phase9_assignment_a");
  expect(learnerAssignment.response.status()).toBe(200);
  expect(learnerAssignment.data.curriculumReleaseId).toBe("phase9_release_1");

  const lesson = await call(request, "learner_A1", "/activity-domains/assignments/phase9_assignment_a/lessons/unit-a/lesson-a");
  expect(lesson.response.status()).toBe(200);
  expect(lesson.data.lesson.stableKey).toBe("lesson-a");
  expect(lesson.data.assessment.assessmentDefinitionId).toBe("phase9_assessment_a");

  const completion = await call(request, "learner_A1", "/curriculum/lessons/lesson-a/complete", {
    method: "POST",
    data: { curriculum: "phase8-course-a" },
  });
  expect(completion.response.status()).toBe(200);
  const completionRow = JSON.parse(sql(`
    SELECT row_to_json(c) FROM curriculum_lesson_completions c
    WHERE c.completion_id='${completion.data.completion.completion_id}'
      AND c.user_id='learner_A1' AND c.organization_id='phase8_org_a'
  `));
  expect(completionRow.completion_id).toBe(completion.data.completion.completion_id);
  expect(completionRow.assignment_id).toBe("phase8_assignment_a");
  expect(completionRow.curriculum_release_id).toBe("phase8_release_1");

  const unmetPolicy = await call(request, "learner_A1", "/assignments/phase9_assignment_a/check-completion", {
    method: "POST",
    data: { unitStableKey: "unit-a", lessonStableKey: "lesson-a" },
  });
  expect(unmetPolicy.response.status()).toBe(200);
  expect(unmetPolicy.data.complete).toBe(false);
  expect(unmetPolicy.data.requirements.some((item) => item.status !== "SATISFIED")).toBe(true);

  const assessment = await call(request, "learner_A1", "/activity-domains/assessments/submissions", {
    method: "POST",
    data: {
      assignmentId: "phase9_assignment_a",
      unitStableKey: "unit-a",
      lessonStableKey: "lesson-a",
      answers: [{ itemId: "assessment-item-a", choiceIndex: 0 }],
      idempotencyKey: "curriculum-evidence-acceptance-assessment-a1",
    },
  });
  expect(assessment.response.status()).toBe(201);
  expect(assessment.data.passed).toBe(true);
  expect(assessment.data.assignmentId).toBe("phase9_assignment_a");
  const assessmentId = assessment.data.assessmentResultId;
  expect(scalar(`SELECT COUNT(*) FROM assessment_results WHERE assessment_result_id='${assessmentId}' AND learner_user_id='learner_A1' AND organization_id='phase8_org_a' AND passed=true`)).toBe("1");

  const ruleId = "curriculum-evidence-acceptance-assessment-rule";
  const projectionInput = { sourceType: "ASSESSMENT_RESULT", sourceRecordId: assessmentId, evidenceRuleId: ruleId };
  const noRuleProjection = await call(request, "admin_A", "/verified-evidence/projections", { method: "POST", data: projectionInput });
  expect(noRuleProjection.response.ok()).toBe(false);
  expect(scalar(`SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_record_id='${assessmentId}' AND organization_id='phase8_org_a'`)).toBe("0");

  const rule = await call(request, "admin_A", "/verified-evidence/rules", {
    method: "POST",
    data: {
      evidenceRuleId: ruleId,
      sourceType: "ASSESSMENT_RESULT",
      evidenceType: "ASSESSMENT_RESULT",
      truthFactType: "ASSESSMENT_PASSED",
      competencyId: "competency_prepare_prove_monitoring_finding",
      ruleVersion: 1,
      reviewRequired: true,
    },
  });
  expect(rule.response.ok()).toBeTruthy();

  const unauthorizedProjection = await call(request, "learner_A2", "/verified-evidence/projections", { method: "POST", data: projectionInput });
  expect(unauthorizedProjection.response.status()).toBe(403);
  const missingSourceProjection = await call(request, "admin_A", "/verified-evidence/projections", {
    method: "POST",
    data: { ...projectionInput, sourceRecordId: "missing_assessment_result" },
  });
  expect(missingSourceProjection.response.status()).toBe(400);
  const unsupportedProjection = await call(request, "admin_A", "/verified-evidence/projections", {
    method: "POST",
    data: { ...projectionInput, sourceType: "UNSUPPORTED_SOURCE" },
  });
  expect(unsupportedProjection.response.status()).toBe(400);
  const orgBRule = await call(request, "admin_B", "/verified-evidence/rules", {
    method: "POST",
    data: {
      evidenceRuleId: ruleId,
      sourceType: "ASSESSMENT_RESULT",
      evidenceType: "ASSESSMENT_RESULT",
      truthFactType: "ASSESSMENT_PASSED",
      competencyId: "competency_prepare_prove_monitoring_finding",
      ruleVersion: 1,
      reviewRequired: true,
    },
  });
  expect(orgBRule.response.ok()).toBeTruthy();
  const duplicateRule = await call(request, "admin_A", "/verified-evidence/rules", {
    method: "POST",
    data: {
      evidenceRuleId: ruleId,
      sourceType: "ASSESSMENT_RESULT",
      evidenceType: "ASSESSMENT_RESULT",
      truthFactType: "ASSESSMENT_PASSED",
      competencyId: "competency_prepare_prove_monitoring_finding",
      ruleVersion: 1,
      reviewRequired: true,
    },
  });
  expect(duplicateRule.response.ok()).toBeTruthy();
  expect(scalar(`SELECT COUNT(*) FROM curriculum_evidence_rules WHERE organization_id='phase8_org_a' AND evidence_rule_id='${ruleId}' AND rule_version=1`)).toBe("1");
  const versionedRule = await call(request, "admin_A", "/verified-evidence/rules", {
    method: "POST",
    data: {
      evidenceRuleId: ruleId,
      sourceType: "ASSESSMENT_RESULT",
      evidenceType: "ASSESSMENT_RESULT",
      truthFactType: "ASSESSMENT_PASSED",
      competencyId: "competency_prepare_prove_monitoring_finding",
      ruleVersion: 2,
      reviewRequired: true,
    },
  });
  expect(versionedRule.response.ok()).toBeTruthy();
  expect(scalar(`SELECT COUNT(*) FROM curriculum_evidence_rules WHERE evidence_rule_id='${ruleId}'`)).toBe("3");
  const sourceTypeMismatchProjection = await call(request, "admin_A", "/verified-evidence/projections", {
    method: "POST",
    data: { ...projectionInput, sourceType: "PRACTICE_RESULT" },
  });
  expect(sourceTypeMismatchProjection.response.status()).toBe(400);
  const crossOrgProjection = await call(request, "admin_B", "/verified-evidence/projections", { method: "POST", data: projectionInput });
  expect(crossOrgProjection.response.status()).toBe(400);

  const projected = await call(request, "admin_A", "/verified-evidence/projections", { method: "POST", data: projectionInput });
  expect(projected.response.status()).toBe(200);
  const evidenceId = projected.data.evidence.evidence_id;
  expect(projected.data.evidence.status).toBe("REVIEWABLE");
  expect(projected.data.evidence.user_id).toBe("learner_A1");
  expect(projected.data.evidence.provenance_json.learner_user_id).toBe("learner_A1");
  expect(projected.data.evidence.provenance_json.projector_user_id).toBe("admin_A");
  expect(projected.data.evidence.evidence_rule_version).toBe(2);
  expect(projected.data.truthFact.source_record_id).toBe(assessmentId);
  expect(projected.data.truthFact.learner_user_id).toBe("learner_A1");
  expect(projected.data.truthFact.provenance_json.learner_user_id).toBe("learner_A1");
  expect(projected.data.truthFact.provenance_json.projector_user_id).toBe("admin_A");
  expect(projected.data.truthFact.evidence_rule_version).toBe(2);
  const injectedProjection = await call(request, "admin_A", "/verified-evidence/projections", {
    method: "POST",
    data: { ...projectionInput, learnerUserId: "learner_A2", learner_id: "learner_A2", user_id: "learner_A2" },
  });
  expect(injectedProjection.response.status()).toBe(200);
  expect(injectedProjection.data.evidence.user_id).toBe("learner_A1");
  expect(scalar(`SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_record_id='${assessmentId}' AND user_id='learner_A2' AND organization_id='phase8_org_a'`)).toBe("0");
  expect(scalar(`SELECT COUNT(*) FROM prepare_prove_evidence WHERE source_record_id='${assessmentId}' AND user_id='learner_A1' AND organization_id='phase8_org_a' AND status <> 'SUPERSEDED'`)).toBe("1");
  const persistedEvidence = JSON.parse(sql(`
    SELECT row_to_json(e) FROM prepare_prove_evidence e
    WHERE e.evidence_id='${evidenceId}' AND e.user_id='learner_A1'
      AND e.organization_id='phase8_org_a' AND e.tenant_id='tenant:phase8_org_a'
  `));
  expect(persistedEvidence.source_record_id).toBe(assessmentId);
  expect(persistedEvidence.assignment_id).toBe("phase9_assignment_a");
  expect(persistedEvidence.curriculum_release_id).toBe("phase9_release_1");
  expect(scalar(`SELECT COUNT(*) FROM curriculum_truth_facts WHERE source_record_id='${assessmentId}' AND evidence_id='${evidenceId}' AND organization_id='phase8_org_a'`)).toBe("1");

  const learnerCannotReview = await call(request, "learner_A2", `/prepare-prove/evidence/${evidenceId}/review`, { method: "POST", data: { decision: "DEMONSTRATED" } });
  expect(learnerCannotReview.response.status()).toBe(403);
  const unscopedInstructorCannotReview = await call(request, "instructor_A_unauthorized", `/prepare-prove/evidence/${evidenceId}/review`, { method: "POST", data: { decision: "DEMONSTRATED" } });
  expect(unscopedInstructorCannotReview.response.status()).toBe(403);
  const otherOrganizationCannotReview = await call(request, "instructor_B", `/prepare-prove/evidence/${evidenceId}/review`, { method: "POST", data: { decision: "DEMONSTRATED" } });
  expect(otherOrganizationCannotReview.response.status()).toBe(404);

  const review = await call(request, "instructor_A_authorized", `/prepare-prove/evidence/${evidenceId}/review`, {
    method: "POST",
    data: { decision: "DEMONSTRATED" },
  });
  expect(review.response.status()).toBe(200);
  expect(review.data.user_id).toBe("learner_A1");
  expect(review.data.reviewer_user_id).toBe("instructor_A_authorized");
  expect(review.data.evidence_id).toBe(evidenceId);
  expect(scalar(`SELECT COUNT(*) FROM learner_competency_decisions WHERE decision_id='${review.data.decision_id}' AND evidence_id='${evidenceId}' AND user_id='learner_A1' AND reviewer_user_id='instructor_A_authorized' AND organization_id='phase8_org_a' AND tenant_id='tenant:phase8_org_a' AND decision='DEMONSTRATED'`)).toBe("1");

  const updatedEvidence = JSON.parse(sql(`SELECT row_to_json(e) FROM prepare_prove_evidence e WHERE e.evidence_id='${evidenceId}'`));
  expect(updatedEvidence.status).toBe("REVIEWED");
  expect(updatedEvidence.source_record_id).toBe(assessmentId);
  expect(scalar(`SELECT COUNT(*) FROM curriculum_learner_mastery WHERE organization_id='phase8_org_a' AND tenant_id='tenant:phase8_org_a' AND learner_user_id='learner_A1' AND competency_id='competency_prepare_prove_monitoring_finding'`)).toBe("0");
  expect(scalar(`SELECT COUNT(*) FROM portfolio_learner_result_entries WHERE organization_id='phase8_org_a' AND tenant_id='tenant:phase8_org_a' AND learner_id='learner_A1' AND outcome_id IN (SELECT outcome_id FROM curriculum_learner_outcomes WHERE source_id='${assessmentId}')`)).toBe("0");
});
