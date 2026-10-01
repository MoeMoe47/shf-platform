import { query } from "../../../db/client.js";

export class ArcadeReplayRepo {
  async getResultReplaySource(input: {
    resultId: string;
    organizationId: string;
    tenantId: string;
    learnerUserId?: string;
  }) {
    const result = await query(
      `SELECT
         r.arcade_result_id, r.arcade_attempt_id, r.arcade_activity_id,
         r.learner_user_id, r.organization_id, r.tenant_id,
         r.passed, r.score, r.max_score, r.mastery_achieved, r.created_at AS result_created_at,
         t.status AS attempt_status, t.started_at AS attempt_started_at,
         t.completed_at AS attempt_completed_at,
         a.slug AS activity_slug, a.title AS activity_title
       FROM arcade_results r
       JOIN arcade_attempts t
         ON t.arcade_attempt_id = r.arcade_attempt_id
        AND t.arcade_activity_id = r.arcade_activity_id
        AND t.learner_user_id = r.learner_user_id
        AND t.organization_id = r.organization_id
       JOIN arcade_activities a ON a.arcade_activity_id = r.arcade_activity_id
       WHERE r.arcade_result_id = $1
         AND r.organization_id = $2
         AND r.tenant_id = $3
         AND ($4::text IS NULL OR r.learner_user_id = $4)
       LIMIT 1`,
      [input.resultId, input.organizationId, input.tenantId, input.learnerUserId ?? null],
    );
    const row = result.rows[0];
    if (!row) return null;
    const iso = (value: any) => value instanceof Date ? value.toISOString() : value;
    return {
      result: {
        id: row.arcade_result_id,
        attemptId: row.arcade_attempt_id,
        activityId: row.arcade_activity_id,
        score: row.score === null ? null : Number(row.score),
        maxScore: row.max_score === null ? null : Number(row.max_score),
        passed: row.passed,
        masteryAchieved: row.mastery_achieved,
        createdAt: iso(row.result_created_at),
      },
      attempt: {
        id: row.arcade_attempt_id,
        status: row.attempt_status,
        startedAt: iso(row.attempt_started_at),
        completedAt: iso(row.attempt_completed_at),
      },
      activity: {
        id: row.arcade_activity_id,
        slug: row.activity_slug,
        title: row.activity_title,
      },
    };
  }
}
