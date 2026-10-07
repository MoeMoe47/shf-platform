import assert from "node:assert/strict";
import test from "node:test";

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("UCR Prepare/Prove requires canonical learner assignment scope and preserves institutional lineage", {
  timeout: 60_000,
  skip: testDatabaseUrl
    ? false
    : "SHS_TEST_DATABASE_URL is required for disposable PostgreSQL UCR Prepare/Prove verification",
}, async (t) => {
  process.env.DATABASE_URL = testDatabaseUrl;
  process.env.SHS_AUTH_ENV = "test";

  const { discoverMigrations, runMigrations } =
    await import("../src/db/migration-runner.ts");

  const { pool } =
    await import("../src/db/client.ts");

  const { PrepareProveService } =
    await import("../src/domain/prepare-prove/service/prepare-prove-service.ts");

  const org = "org_ucr_prepare_prove";
  const learner = "user_ucr_learner";
  const otherLearner = "user_ucr_other";
  const staff = "user_ucr_staff";

  const courseId = "course_ucr_prepare_prove";
  const releaseId = "release_ucr_prepare_prove_v1";

  const wrongCourseId = "course_ucr_wrong";
  const wrongReleaseId = "release_ucr_wrong_v1";

  const assignmentId = "assignment_ucr_valid";
  const wrongTargetAssignmentId = "assignment_ucr_wrong_target";
  const wrongCourseAssignmentId = "assignment_ucr_wrong_course";
  const reassignmentId = "assignment_ucr_reassigned";
  const lockedAssignmentId = "assignment_ucr_locked";

  const activityId = "ucr-professional-communication-proof";
  const unitStableKey = "ucr-communication";
  const lessonStableKey = "ucr-13-verbal-written-digital-communication";

  const migrations = await discoverMigrations(
    new URL("../migrations", import.meta.url).pathname,
  );

  const client = await pool.connect();
  try {
    await runMigrations(client, migrations);
  } finally {
    client.release();
  }

  const cleanup = async () => {
    await pool.query(
      "DELETE FROM learner_competency_decisions WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM prepare_prove_evidence WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM prepare_prove_activity_results WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM assignment_targets WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM assignments WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM curriculum_releases WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM curriculum_lessons WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM curriculum_units WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM curriculum_courses WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM users WHERE organization_id=$1",
      [org],
    );
    await pool.query(
      "DELETE FROM organizations WHERE organization_id=$1",
      [org],
    );
  };

  await cleanup();
  t.after(async () => {
    await cleanup();
    await pool.end();
  });

  await pool.query(
    `INSERT INTO organizations
      (organization_id, legal_name, display_name, org_type, status)
     VALUES ($1,$2,$2,'SHF','active')`,
    [org, "UCR Prepare Prove Test"],
  );

  await pool.query(
    `INSERT INTO users
      (user_id, organization_id, email, full_name, status, identity_source)
     VALUES
      ($1,$4,$5,$6,'active','test'),
      ($2,$4,$7,$8,'active','test'),
      ($3,$4,$9,$10,'active','test')`,
    [
      learner,
      otherLearner,
      staff,
      org,
      `${learner}@test.invalid`,
      "UCR Learner",
      `${otherLearner}@test.invalid`,
      "Other Learner",
      `${staff}@test.invalid`,
      "UCR Staff",
    ],
  );

  await pool.query(
    `INSERT INTO curriculum_courses
      (course_id, organization_id, stable_key, title, status,
       created_by_user_id, updated_by_user_id)
     VALUES
      ($1,$2,'shu-universal-career-readiness',
       'SHU Universal Career Readiness','PUBLISHED',$3,$3),
      ($4,$2,'wrong-readiness-course',
       'Wrong Readiness Course','PUBLISHED',$3,$3)`,
    [courseId, org, staff, wrongCourseId],
  );

  const ucrSnapshot = {
    course: {
      stableKey: "shu-universal-career-readiness",
      title: "SHU Universal Career Readiness",
      shortDescription: null,
      fullDescription: null,
      estimatedDurationMinutes: null,
    },
    units: [
      {
        stableKey: unitStableKey,
        title: "Communication",
        description: null,
        sequence: 3,
        lessons: [
          {
            stableKey: lessonStableKey,
            title: "Verbal, Written & Digital Communication",
            summary: null,
            objectives: [],
            content: {},
            estimatedDurationMinutes: null,
            sequence: 3,
            resources: [],
            arcadeLinks: [],
            assessmentDefinition: null,
            reflectionDefinition: null,
            practiceDefinition: null,
          },
        ],
      },
    ],
  };

  const wrongSnapshot = {
    course: {
      stableKey: "wrong-readiness-course",
      title: "Wrong Readiness Course",
      shortDescription: null,
      fullDescription: null,
      estimatedDurationMinutes: null,
    },
    units: [
      {
        stableKey: unitStableKey,
        title: "Communication",
        description: null,
        sequence: 1,
        lessons: [
          {
            stableKey: lessonStableKey,
            title: "Wrong Course Lesson",
            summary: null,
            objectives: [],
            content: {},
            estimatedDurationMinutes: null,
            sequence: 1,
            resources: [],
            arcadeLinks: [],
            assessmentDefinition: null,
            reflectionDefinition: null,
            practiceDefinition: null,
          },
        ],
      },
    ],
  };

  await pool.query(
    `INSERT INTO curriculum_releases
      (release_id, organization_id, course_id, version_number,
       snapshot, content_hash, status, published_by_user_id)
     VALUES
      ($1,$2,$3,1,$4::jsonb,$5,'PUBLISHED',$6),
      ($7,$2,$8,1,$9::jsonb,$10,'PUBLISHED',$6)`,
    [
      releaseId,
      org,
      courseId,
      JSON.stringify(ucrSnapshot),
      "a".repeat(64),
      staff,
      wrongReleaseId,
      wrongCourseId,
      JSON.stringify(wrongSnapshot),
      "b".repeat(64),
    ],
  );

  const insertAssignment = async (
    id: string,
    release: string,
    course: string,
  ) => {
    await pool.query(
      `INSERT INTO assignments
        (assignment_id, organization_id, course_id, title,
         assignment_type, visibility_scope, created_by,
         due_at, status, curriculum_release_id,
         assigned_content_type, assigned_content_id)
       VALUES
        ($1,$2,$3,$4,'assignment','targeted',$5,
         NOW() + INTERVAL '30 days','published',$6,'COURSE',NULL)`,
      [
        id,
        org,
        course,
        `Assignment ${id}`,
        staff,
        release,
      ],
    );
  };

  const addLearnerTarget = async (
    assignment: string,
    user: string,
    suffix: string,
  ) => {
    await pool.query(
      `INSERT INTO assignment_targets
        (assignment_target_id, assignment_id, organization_id,
         target_type, user_id, created_by)
       VALUES ($1,$2,$3,'LEARNER',$4,$5)`,
      [
        `atgt_${suffix}`,
        assignment,
        org,
        user,
        staff,
      ],
    );
  };

  await insertAssignment(assignmentId, releaseId, courseId);
  await insertAssignment(
    wrongTargetAssignmentId,
    releaseId,
    courseId,
  );
  await insertAssignment(
    wrongCourseAssignmentId,
    wrongReleaseId,
    wrongCourseId,
  );
  await insertAssignment(
    reassignmentId,
    releaseId,
    courseId,
  );

  await insertAssignment(
    lockedAssignmentId,
    releaseId,
    courseId,
  );

  await pool.query(
    `UPDATE assignments
        SET available_at = NOW() + INTERVAL '7 days'
      WHERE assignment_id=$1`,
    [lockedAssignmentId],
  );

  await addLearnerTarget(assignmentId, learner, "ucr_valid");
  await addLearnerTarget(
    wrongTargetAssignmentId,
    otherLearner,
    "ucr_wrong_target",
  );
  await addLearnerTarget(
    wrongCourseAssignmentId,
    learner,
    "ucr_wrong_course",
  );
  await addLearnerTarget(
    reassignmentId,
    learner,
    "ucr_reassigned",
  );

  await addLearnerTarget(
    lockedAssignmentId,
    learner,
    "ucr_locked",
  );

  const actor = {
    user_id: learner,
    organization_id: org,
    tenant_id: `tenant:${org}`,
    roles: ["student"],
    permissions: ["curriculum.lesson.complete"],
  };

  const service = new PrepareProveService();

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          unit_stable_key: unitStableKey,
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_assignment_context_required/,
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: "assignment_does_not_exist",
          unit_stable_key: unitStableKey,
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_assignment_required/,
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: wrongTargetAssignmentId,
          unit_stable_key: unitStableKey,
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_assignment_required/,
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: wrongCourseAssignmentId,
          unit_stable_key: unitStableKey,
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_course_scope_required/,
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: assignmentId,
          unit_stable_key: "ucr-wrong-unit",
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_unit_scope_required/,
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: assignmentId,
          unit_stable_key: unitStableKey,
          lesson_stable_key: "ucr-wrong-lesson",
        },
      }),
    /curriculum_lesson_scope_required/,
  );

  const result = await service.submitProofResult({
    actor,
    result: {
      activity_id: activityId,
      assignment_id: assignmentId,
      unit_stable_key: unitStableKey,
      lesson_stable_key: lessonStableKey,
      response: "Clear workplace communication response",
    },
  });

  assert.equal(result.activity_id, activityId);
  assert.equal(
    result.result_json.institutional_lineage.assignment_id,
    assignmentId,
  );
  assert.equal(
    result.result_json.institutional_lineage.curriculum_release_id,
    releaseId,
  );
  assert.equal(
    result.result_json.institutional_lineage.release_version,
    1,
  );
  assert.equal(
    result.result_json.institutional_lineage.course_id,
    courseId,
    "course lineage must come from the canonical curriculum release",
  );
  assert.equal(
    result.result_json.institutional_lineage.course_stable_key,
    "shu-universal-career-readiness",
  );
  assert.equal(
    result.result_json.institutional_lineage.unit_stable_key,
    unitStableKey,
  );
  assert.equal(
    result.result_json.institutional_lineage.lesson_stable_key,
    lessonStableKey,
  );

  const evidence = await service.createEvidence({
    actor,
    sourceResultId: result.result_id,
    criterion: "professional-communication",
  });

  assert.equal(evidence.assignment_id, assignmentId);
  assert.equal(evidence.curriculum_release_id, releaseId);
  assert.equal(evidence.release_version, 1);
  assert.equal(evidence.unit_stable_key, unitStableKey);
  assert.equal(evidence.lesson_stable_key, lessonStableKey);

  const storedEvidence = await pool.query(
    `SELECT assignment_id, curriculum_release_id, release_version,
            unit_stable_key, lesson_stable_key
       FROM prepare_prove_evidence
      WHERE evidence_id=$1`,
    [evidence.evidence_id],
  );

  assert.deepEqual(storedEvidence.rows[0], {
    assignment_id: assignmentId,
    curriculum_release_id: releaseId,
    release_version: 1,
    unit_stable_key: unitStableKey,
    lesson_stable_key: lessonStableKey,
  });

  /*
   * Reassignment safety:
   *
   * A second assignment for the SAME learner and SAME proof activity must
   * never silently inherit the first assignment's institutional lineage.
   *
   * This assertion intentionally expresses the production requirement.
   * If the legacy Prepare/Prove uniqueness model reuses Assignment A's
   * result, this assertion should FAIL and prove the defect before we fix it.
   */
  const reassigned = await service.submitProofResult({
    actor,
    result: {
      activity_id: activityId,
      assignment_id: reassignmentId,
      unit_stable_key: unitStableKey,
      lesson_stable_key: lessonStableKey,
      response: "Second assigned attempt",
    },
  });

  assert.equal(
    reassigned.result_json.institutional_lineage.assignment_id,
    reassignmentId,
    "same proof activity under a new assignment must not reuse old assignment lineage",
  );

  assert.equal(reassigned.assignment_id, reassignmentId);
  assert.notEqual(
    reassigned.result_id,
    result.result_id,
    "different assignments must produce distinct immutable source-result identities",
  );

  const assignmentScopedResults = await pool.query(
    `SELECT result_id, assignment_id,
            result_json->'institutional_lineage'->>'assignment_id' AS lineage_assignment_id
       FROM prepare_prove_activity_results
      WHERE organization_id=$1
        AND user_id=$2
        AND activity_type='WORKPLACE_READINESS_PROOF'
        AND activity_id=$3
      ORDER BY assignment_id`,
    [org, learner, activityId],
  );

  assert.equal(assignmentScopedResults.rows.length, 2);
  assert.deepEqual(
    assignmentScopedResults.rows.map((row) => ({
      assignment_id: row.assignment_id,
      lineage_assignment_id: row.lineage_assignment_id,
    })),
    [
      {
        assignment_id: reassignmentId,
        lineage_assignment_id: reassignmentId,
      },
      {
        assignment_id: assignmentId,
        lineage_assignment_id: assignmentId,
      },
    ],
  );

  await assert.rejects(
    () => service.getProofStatus(actor, activityId),
    /curriculum_assignment_context_required/,
    "UCR proof status must never choose arbitrarily between assignment-scoped results",
  );

  const validStatus = await service.getProofStatus(
    actor,
    activityId,
    assignmentId,
  );

  assert.equal(validStatus.result.result_id, result.result_id);
  assert.equal(validStatus.result.assignment_id, assignmentId);
  assert.equal(
    validStatus.result.result_json.institutional_lineage.assignment_id,
    assignmentId,
  );
  assert.equal(validStatus.evidence.evidence_id, evidence.evidence_id);

  const reassignedStatus = await service.getProofStatus(
    actor,
    activityId,
    reassignmentId,
  );

  assert.equal(reassignedStatus.result.result_id, reassigned.result_id);
  assert.equal(reassignedStatus.result.assignment_id, reassignmentId);
  assert.equal(
    reassignedStatus.result.result_json.institutional_lineage.assignment_id,
    reassignmentId,
  );
  assert.equal(
    reassignedStatus.evidence,
    null,
    "Assignment B must not inherit Assignment A evidence",
  );

  await assert.rejects(
    () =>
      service.getProofStatus(
        actor,
        activityId,
        wrongTargetAssignmentId,
      ),
    /curriculum_assignment_required/,
    "proof status must enforce the same learner entitlement boundary as submission",
  );

  await assert.rejects(
    () =>
      service.submitProofResult({
        actor,
        result: {
          activity_id: activityId,
          assignment_id: lockedAssignmentId,
          unit_stable_key: unitStableKey,
          lesson_stable_key: lessonStableKey,
        },
      }),
    /curriculum_assignment_locked/,
    "future assignments must not accept proof before availableAt",
  );

  await assert.rejects(
    () =>
      service.getProofStatus(
        actor,
        activityId,
        lockedAssignmentId,
      ),
    /curriculum_assignment_locked/,
    "future assignments must not expose assignment-scoped proof status before availableAt",
  );
});
