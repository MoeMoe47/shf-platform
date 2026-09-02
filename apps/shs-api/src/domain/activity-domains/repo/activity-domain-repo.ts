import { query } from "../../../db/client.js";
import type { AssessmentResult, PracticeResult, ReflectionSubmission } from "../model/activity-domain.js";

function iso(value: any): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function assessmentResultFromRow(row: any): AssessmentResult {
  return {
    assessmentResultId: row.assessment_result_id,
    assessmentAttemptId: row.assessment_attempt_id,
    organizationId: row.organization_id,
    learnerUserId: row.learner_user_id,
    assignmentId: row.assignment_id,
    curriculumReleaseId: row.curriculum_release_id,
    releaseVersion: Number(row.release_version),
    unitStableKey: row.unit_stable_key,
    lessonStableKey: row.lesson_stable_key,
    assessmentDefinitionId: row.assessment_definition_id,
    answers: Array.isArray(row.answers) ? row.answers : [],
    score: row.score == null ? null : Number(row.score),
    maxScore: row.max_score == null ? null : Number(row.max_score),
    percent: row.percent == null ? null : Number(row.percent),
    passThresholdPercent: row.pass_threshold_percent == null ? null : Number(row.pass_threshold_percent),
    passed: row.passed,
    needsReview: row.needs_review,
    createdAt: iso(row.created_at),
  };
}

function reflectionSubmissionFromRow(row: any): ReflectionSubmission {
  return {
    reflectionSubmissionId: row.reflection_submission_id,
    organizationId: row.organization_id,
    learnerUserId: row.learner_user_id,
    assignmentId: row.assignment_id,
    curriculumReleaseId: row.curriculum_release_id,
    releaseVersion: Number(row.release_version),
    unitStableKey: row.unit_stable_key,
    lessonStableKey: row.lesson_stable_key,
    reflectionDefinitionId: row.reflection_definition_id,
    version: Number(row.version),
    responses: Array.isArray(row.responses) ? row.responses : [],
    status: row.status,
    reviewStatus: row.review_status,
    submittedAt: iso(row.submitted_at),
  };
}

function practiceResultFromRow(row: any): PracticeResult {
  return {
    practiceResultId: row.practice_result_id,
    practiceAttemptId: row.practice_attempt_id,
    organizationId: row.organization_id,
    learnerUserId: row.learner_user_id,
    assignmentId: row.assignment_id,
    curriculumReleaseId: row.curriculum_release_id,
    releaseVersion: Number(row.release_version),
    unitStableKey: row.unit_stable_key,
    lessonStableKey: row.lesson_stable_key,
    practiceDefinitionId: row.practice_definition_id,
    actions: Array.isArray(row.actions) ? row.actions : [],
    score: row.score == null ? null : Number(row.score),
    maxScore: row.max_score == null ? null : Number(row.max_score),
    completed: row.completed,
    createdAt: iso(row.created_at),
  };
}

export class ActivityDomainRepo {
  constructor(private dbQuery = query) {}

  async getAssessmentResultByIdempotency(organizationId: string, learnerUserId: string, idempotencyKey: string): Promise<AssessmentResult | null> {
    const res = await this.dbQuery(
      `SELECT r.* FROM assessment_results r
       JOIN assessment_attempts a ON a.assessment_attempt_id = r.assessment_attempt_id
       WHERE a.organization_id = $1 AND a.learner_user_id = $2 AND a.idempotency_key = $3`,
      [organizationId, learnerUserId, idempotencyKey],
    );
    return res.rows[0] ? assessmentResultFromRow(res.rows[0]) : null;
  }

  async createAssessmentAttemptAndResult(input: {
    assessmentAttemptId: string; assessmentResultId: string; organizationId: string; learnerUserId: string;
    assignmentId: string; curriculumReleaseId: string; releaseVersion: number; unitStableKey: string;
    lessonStableKey: string; assessmentDefinitionId: string; attemptNumber: number; idempotencyKey: string;
    answers: unknown[]; score: number | null; maxScore: number | null; percent: number | null;
    passThresholdPercent: number | null; passed: boolean; needsReview: boolean;
  }): Promise<AssessmentResult> {
    const res = await this.dbQuery(
      `WITH attempt AS (
         INSERT INTO assessment_attempts (
           assessment_attempt_id, organization_id, learner_user_id, assignment_id, curriculum_release_id,
           release_version, unit_stable_key, lesson_stable_key, assessment_definition_id, attempt_number,
           status, idempotency_key, submitted_at
         ) VALUES ($1,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SUBMITTED',$12,NOW())
         RETURNING *
       )
       INSERT INTO assessment_results (
         assessment_result_id, assessment_attempt_id, organization_id, learner_user_id, assignment_id,
         curriculum_release_id, release_version, unit_stable_key, lesson_stable_key, assessment_definition_id,
         answers, score, max_score, percent, pass_threshold_percent, passed, needs_review
       )
       SELECT $2, assessment_attempt_id, organization_id, learner_user_id, assignment_id, curriculum_release_id,
              release_version, unit_stable_key, lesson_stable_key, assessment_definition_id,
              $13::jsonb, $14, $15, $16, $17, $18, $19
       FROM attempt
       RETURNING *`,
      [
        input.assessmentAttemptId, input.assessmentResultId, input.organizationId, input.learnerUserId,
        input.assignmentId, input.curriculumReleaseId, input.releaseVersion, input.unitStableKey,
        input.lessonStableKey, input.assessmentDefinitionId, input.attemptNumber, input.idempotencyKey,
        JSON.stringify(input.answers), input.score, input.maxScore, input.percent, input.passThresholdPercent,
        input.passed, input.needsReview,
      ],
    );
    return assessmentResultFromRow(res.rows[0]);
  }

  async nextAssessmentAttemptNumber(organizationId: string, learnerUserId: string, assignmentId: string, lessonStableKey: string): Promise<number> {
    const res = await this.dbQuery(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next FROM assessment_attempts
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3 AND lesson_stable_key = $4`,
      [organizationId, learnerUserId, assignmentId, lessonStableKey],
    );
    return Number(res.rows[0].next);
  }

  async latestPassedAssessment(organizationId: string, learnerUserId: string, assignmentId: string, curriculumReleaseId: string, lessonStableKey: string, assessmentDefinitionId: string): Promise<AssessmentResult | null> {
    const res = await this.dbQuery(
      `SELECT * FROM assessment_results
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
         AND curriculum_release_id = $4 AND lesson_stable_key = $5 AND assessment_definition_id = $6
         AND passed = true AND needs_review = false
       ORDER BY created_at ASC LIMIT 1`,
      [organizationId, learnerUserId, assignmentId, curriculumReleaseId, lessonStableKey, assessmentDefinitionId],
    );
    return res.rows[0] ? assessmentResultFromRow(res.rows[0]) : null;
  }

  async getReflectionByIdempotency(organizationId: string, learnerUserId: string, idempotencyKey: string): Promise<ReflectionSubmission | null> {
    const res = await this.dbQuery(`SELECT * FROM reflection_submissions WHERE organization_id = $1 AND learner_user_id = $2 AND idempotency_key = $3`, [organizationId, learnerUserId, idempotencyKey]);
    return res.rows[0] ? reflectionSubmissionFromRow(res.rows[0]) : null;
  }

  async nextReflectionVersion(organizationId: string, learnerUserId: string, assignmentId: string, lessonStableKey: string): Promise<number> {
    const res = await this.dbQuery(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next FROM reflection_submissions
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3 AND lesson_stable_key = $4`,
      [organizationId, learnerUserId, assignmentId, lessonStableKey],
    );
    return Number(res.rows[0].next);
  }

  async createReflectionSubmission(input: {
    reflectionSubmissionId: string; organizationId: string; learnerUserId: string; assignmentId: string;
    curriculumReleaseId: string; releaseVersion: number; unitStableKey: string; lessonStableKey: string;
    reflectionDefinitionId: string; version: number; responses: unknown[]; idempotencyKey: string;
  }): Promise<ReflectionSubmission> {
    const res = await this.dbQuery(
      `INSERT INTO reflection_submissions (
        reflection_submission_id, organization_id, learner_user_id, assignment_id, curriculum_release_id,
        release_version, unit_stable_key, lesson_stable_key, reflection_definition_id, version,
        responses, idempotency_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12)
      RETURNING *`,
      [
        input.reflectionSubmissionId, input.organizationId, input.learnerUserId, input.assignmentId,
        input.curriculumReleaseId, input.releaseVersion, input.unitStableKey, input.lessonStableKey,
        input.reflectionDefinitionId, input.version, JSON.stringify(input.responses), input.idempotencyKey,
      ],
    );
    return reflectionSubmissionFromRow(res.rows[0]);
  }

  async latestReflectionSubmission(organizationId: string, learnerUserId: string, assignmentId: string, curriculumReleaseId: string, lessonStableKey: string, reflectionDefinitionId: string): Promise<ReflectionSubmission | null> {
    const res = await this.dbQuery(
      `SELECT * FROM reflection_submissions
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
         AND curriculum_release_id = $4 AND lesson_stable_key = $5 AND reflection_definition_id = $6
       ORDER BY version DESC LIMIT 1`,
      [organizationId, learnerUserId, assignmentId, curriculumReleaseId, lessonStableKey, reflectionDefinitionId],
    );
    return res.rows[0] ? reflectionSubmissionFromRow(res.rows[0]) : null;
  }

  async getPracticeResultByIdempotency(organizationId: string, learnerUserId: string, idempotencyKey: string): Promise<PracticeResult | null> {
    const res = await this.dbQuery(
      `SELECT r.* FROM practice_results r
       JOIN practice_attempts a ON a.practice_attempt_id = r.practice_attempt_id
       WHERE a.organization_id = $1 AND a.learner_user_id = $2 AND a.idempotency_key = $3`,
      [organizationId, learnerUserId, idempotencyKey],
    );
    return res.rows[0] ? practiceResultFromRow(res.rows[0]) : null;
  }

  async nextPracticeAttemptNumber(organizationId: string, learnerUserId: string, assignmentId: string, lessonStableKey: string): Promise<number> {
    const res = await this.dbQuery(
      `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next FROM practice_attempts
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3 AND lesson_stable_key = $4`,
      [organizationId, learnerUserId, assignmentId, lessonStableKey],
    );
    return Number(res.rows[0].next);
  }

  async createPracticeAttemptAndResult(input: {
    practiceAttemptId: string; practiceResultId: string; organizationId: string; learnerUserId: string;
    assignmentId: string; curriculumReleaseId: string; releaseVersion: number; unitStableKey: string;
    lessonStableKey: string; practiceDefinitionId: string; attemptNumber: number; idempotencyKey: string;
    actions: unknown[]; score: number | null; maxScore: number | null; completed: boolean;
  }): Promise<PracticeResult> {
    const res = await this.dbQuery(
      `WITH attempt AS (
         INSERT INTO practice_attempts (
           practice_attempt_id, organization_id, learner_user_id, assignment_id, curriculum_release_id,
           release_version, unit_stable_key, lesson_stable_key, practice_definition_id, attempt_number,
           status, idempotency_key, submitted_at
         ) VALUES ($1,$3,$4,$5,$6,$7,$8,$9,$10,$11,'SUBMITTED',$12,NOW())
         RETURNING *
       )
       INSERT INTO practice_results (
         practice_result_id, practice_attempt_id, organization_id, learner_user_id, assignment_id,
         curriculum_release_id, release_version, unit_stable_key, lesson_stable_key, practice_definition_id,
         actions, score, max_score, completed
       )
       SELECT $2, practice_attempt_id, organization_id, learner_user_id, assignment_id, curriculum_release_id,
              release_version, unit_stable_key, lesson_stable_key, practice_definition_id,
              $13::jsonb, $14, $15, $16
       FROM attempt
       RETURNING *`,
      [
        input.practiceAttemptId, input.practiceResultId, input.organizationId, input.learnerUserId,
        input.assignmentId, input.curriculumReleaseId, input.releaseVersion, input.unitStableKey,
        input.lessonStableKey, input.practiceDefinitionId, input.attemptNumber, input.idempotencyKey,
        JSON.stringify(input.actions), input.score, input.maxScore, input.completed,
      ],
    );
    return practiceResultFromRow(res.rows[0]);
  }

  async latestCompletedPractice(organizationId: string, learnerUserId: string, assignmentId: string, curriculumReleaseId: string, lessonStableKey: string, practiceDefinitionId: string): Promise<PracticeResult | null> {
    const res = await this.dbQuery(
      `SELECT * FROM practice_results
       WHERE organization_id = $1 AND learner_user_id = $2 AND assignment_id = $3
         AND curriculum_release_id = $4 AND lesson_stable_key = $5 AND practice_definition_id = $6
         AND completed = true
       ORDER BY created_at ASC LIMIT 1`,
      [organizationId, learnerUserId, assignmentId, curriculumReleaseId, lessonStableKey, practiceDefinitionId],
    );
    return res.rows[0] ? practiceResultFromRow(res.rows[0]) : null;
  }
}
