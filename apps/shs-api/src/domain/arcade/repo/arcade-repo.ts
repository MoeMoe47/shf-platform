import { query } from "../../../db/client.js";
import { ArcadeActivity, ArcadeAttempt, ArcadeResult } from "../model/arcade.js";

const ACTIVITY_COLUMNS = `
  arcade_activity_id, slug, title, activity_type, lesson_id, mastery_rule,
  max_score, pass_threshold_score, status, created_by_user_id, created_at, updated_at
`;
function rowToActivity(row: any): ArcadeActivity {
  return {
    id: row.arcade_activity_id,
    slug: row.slug,
    title: row.title,
    activityType: row.activity_type,
    lessonId: row.lesson_id,
    masteryRule: row.mastery_rule,
    maxScore: row.max_score === null ? null : Number(row.max_score),
    passThresholdScore: row.pass_threshold_score === null ? null : Number(row.pass_threshold_score),
    status: row.status,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

const ATTEMPT_COLUMNS = `arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id, status, started_at, completed_at`;
function rowToAttempt(row: any): ArcadeAttempt {
  return {
    id: row.arcade_attempt_id,
    arcadeActivityId: row.arcade_activity_id,
    learnerUserId: row.learner_user_id,
    organizationId: row.organization_id,
    status: row.status,
    startedAt: row.started_at instanceof Date ? row.started_at.toISOString() : row.started_at,
    completedAt: row.completed_at instanceof Date ? row.completed_at.toISOString() : row.completed_at,
  };
}

const RESULT_COLUMNS = `
  arcade_result_id, arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id,
  passed, score, max_score, mastery_achieved, created_at
`;
function rowToResult(row: any): ArcadeResult {
  return {
    id: row.arcade_result_id,
    arcadeAttemptId: row.arcade_attempt_id,
    arcadeActivityId: row.arcade_activity_id,
    learnerUserId: row.learner_user_id,
    organizationId: row.organization_id,
    passed: row.passed,
    score: row.score === null ? null : Number(row.score),
    maxScore: row.max_score === null ? null : Number(row.max_score),
    masteryAchieved: row.mastery_achieved,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function rowToHistoryItem(row: any) {
  const completedAt = row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at;
  const attemptStartedAt = row.attempt_started_at instanceof Date ? row.attempt_started_at.toISOString() : row.attempt_started_at;
  return {
    resultId: row.arcade_result_id,
    attemptId: row.arcade_attempt_id,
    activityId: row.arcade_activity_id,
    activitySlug: row.activity_slug,
    activityTitle: row.activity_title,
    learnerId: row.learner_user_id,
    organizationId: row.organization_id,
    attemptStartedAt,
    completedAt,
    score: row.score === null ? null : Number(row.score),
    maxScore: row.max_score === null ? null : Number(row.max_score),
    passed: row.passed,
    masteryAchieved: row.mastery_achieved,
    // Preserve the established /arcade/results Result field names for API callers.
    id: row.arcade_result_id,
    arcadeAttemptId: row.arcade_attempt_id,
    arcadeActivityId: row.arcade_activity_id,
    learnerUserId: row.learner_user_id,
    createdAt: completedAt,
  };
}

export class ArcadeRepo {
  async createActivity(input: {
    id: string; slug: string; title: string; activityType: string; lessonId: string | null;
    masteryRule: string; maxScore: number | null; passThresholdScore: number | null; createdByUserId: string;
  }): Promise<ArcadeActivity> {
    const res = await query(
      `INSERT INTO arcade_activities (
        arcade_activity_id, slug, title, activity_type, lesson_id, mastery_rule,
        max_score, pass_threshold_score, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${ACTIVITY_COLUMNS}`,
      [input.id, input.slug, input.title, input.activityType, input.lessonId, input.masteryRule, input.maxScore, input.passThresholdScore, input.createdByUserId],
    );
    return rowToActivity(res.rows[0]);
  }

  async getActivityById(id: string): Promise<ArcadeActivity | null> {
    const res = await query(`SELECT ${ACTIVITY_COLUMNS} FROM arcade_activities WHERE arcade_activity_id=$1`, [id]);
    return res.rows[0] ? rowToActivity(res.rows[0]) : null;
  }

  async getActivityBySlug(slug: string): Promise<ArcadeActivity | null> {
    const res = await query(`SELECT ${ACTIVITY_COLUMNS} FROM arcade_activities WHERE slug=$1`, [slug]);
    return res.rows[0] ? rowToActivity(res.rows[0]) : null;
  }

  async listActiveActivities(): Promise<ArcadeActivity[]> {
    const res = await query(`SELECT ${ACTIVITY_COLUMNS} FROM arcade_activities WHERE status='active' ORDER BY title ASC`);
    return res.rows.map(rowToActivity);
  }

  async createAttempt(input: { id: string; arcadeActivityId: string; learnerUserId: string; organizationId: string; tenantId: string }): Promise<ArcadeAttempt> {
    const res = await query(
      `INSERT INTO arcade_attempts (arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id, tenant_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING ${ATTEMPT_COLUMNS}`,
      [input.id, input.arcadeActivityId, input.learnerUserId, input.organizationId, input.tenantId],
    );
    return rowToAttempt(res.rows[0]);
  }

  async getAttemptForUpdate(dbQuery: typeof query, id: string): Promise<ArcadeAttempt | null> {
    const res = await dbQuery(`SELECT ${ATTEMPT_COLUMNS} FROM arcade_attempts WHERE arcade_attempt_id=$1 FOR UPDATE`, [id]);
    return res.rows[0] ? rowToAttempt(res.rows[0]) : null;
  }

  async getAttemptById(id: string): Promise<ArcadeAttempt | null> {
    const res = await query(`SELECT ${ATTEMPT_COLUMNS} FROM arcade_attempts WHERE arcade_attempt_id=$1`, [id]);
    return res.rows[0] ? rowToAttempt(res.rows[0]) : null;
  }

  async completeAttempt(dbQuery: typeof query, id: string): Promise<void> {
    await dbQuery(`UPDATE arcade_attempts SET status='COMPLETED', completed_at=NOW() WHERE arcade_attempt_id=$1`, [id]);
  }

  async abandonAttempt(id: string, organizationId: string, learnerUserId: string): Promise<ArcadeAttempt | null> {
    const res = await query(
      `UPDATE arcade_attempts SET status='ABANDONED' WHERE arcade_attempt_id=$1 AND organization_id=$2 AND learner_user_id=$3 AND status='STARTED' RETURNING ${ATTEMPT_COLUMNS}`,
      [id, organizationId, learnerUserId],
    );
    return res.rows[0] ? rowToAttempt(res.rows[0]) : null;
  }

  async createResult(dbQuery: typeof query, input: {
    id: string; arcadeAttemptId: string; arcadeActivityId: string; learnerUserId: string; organizationId: string; tenantId: string;
    passed: boolean | null; score: number | null; maxScore: number | null; masteryAchieved: boolean;
  }): Promise<ArcadeResult> {
    const res = await dbQuery(
      `INSERT INTO arcade_results (
        arcade_result_id, arcade_attempt_id, arcade_activity_id, learner_user_id, organization_id, tenant_id,
        passed, score, max_score, mastery_achieved
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${RESULT_COLUMNS}`,
      [input.id, input.arcadeAttemptId, input.arcadeActivityId, input.learnerUserId, input.organizationId, input.tenantId, input.passed, input.score, input.maxScore, input.masteryAchieved],
    );
    return rowToResult(res.rows[0]);
  }

  async getResultByAttemptId(attemptId: string): Promise<ArcadeResult | null> {
    const res = await query(`SELECT ${RESULT_COLUMNS} FROM arcade_results WHERE arcade_attempt_id=$1`, [attemptId]);
    return res.rows[0] ? rowToResult(res.rows[0]) : null;
  }

  async listResultsForLearner(organizationId: string, learnerUserId: string): Promise<ArcadeResult[]> {
    const res = await query(`SELECT ${RESULT_COLUMNS} FROM arcade_results WHERE organization_id=$1 AND learner_user_id=$2 ORDER BY created_at DESC`, [organizationId, learnerUserId]);
    return res.rows.map(rowToResult);
  }

  async listResultsForOrganization(organizationId: string): Promise<ArcadeResult[]> {
    const res = await query(`SELECT ${RESULT_COLUMNS} FROM arcade_results WHERE organization_id=$1 ORDER BY created_at DESC`, [organizationId]);
    return res.rows.map(rowToResult);
  }

  async listHistoryForLearner(organizationId: string, learnerUserId: string, limit: number, offset: number) {
    const res = await query(
      `SELECT r.arcade_result_id, r.arcade_attempt_id, r.arcade_activity_id,
              r.learner_user_id, r.organization_id, r.passed, r.score,
              r.max_score, r.mastery_achieved, r.created_at,
              a.slug AS activity_slug, a.title AS activity_title,
              t.started_at AS attempt_started_at
       FROM arcade_results r
       JOIN arcade_activities a ON a.arcade_activity_id = r.arcade_activity_id
       JOIN arcade_attempts t ON t.arcade_attempt_id = r.arcade_attempt_id
       WHERE r.organization_id=$1 AND r.learner_user_id=$2
       ORDER BY r.created_at DESC, r.arcade_result_id DESC
       LIMIT $3 OFFSET $4`,
      [organizationId, learnerUserId, limit + 1, offset],
    );
    const hasMore = res.rows.length > limit;
    const items = res.rows.slice(0, limit).map(rowToHistoryItem);
    return { items, hasMore };
  }

  async listHistoryForOrganization(organizationId: string, limit: number, offset: number) {
    const res = await query(
      `SELECT r.arcade_result_id, r.arcade_attempt_id, r.arcade_activity_id,
              r.learner_user_id, r.organization_id, r.passed, r.score,
              r.max_score, r.mastery_achieved, r.created_at,
              a.slug AS activity_slug, a.title AS activity_title,
              t.started_at AS attempt_started_at
       FROM arcade_results r
       JOIN arcade_activities a ON a.arcade_activity_id = r.arcade_activity_id
       JOIN arcade_attempts t ON t.arcade_attempt_id = r.arcade_attempt_id
       WHERE r.organization_id=$1
       ORDER BY r.created_at DESC, r.arcade_result_id DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit + 1, offset],
    );
    const hasMore = res.rows.length > limit;
    const items = res.rows.slice(0, limit).map(rowToHistoryItem);
    return { items, hasMore };
  }

  // The one real, deterministic Journey/Celebration signal: has this
  // learner ever achieved mastery on this specific Activity? Mirrors the
  // exact pattern already proven for Project/Capstone completion truth.
  async hasMasteryForActivity(organizationId: string, learnerUserId: string, arcadeActivityId: string): Promise<ArcadeResult | null> {
    const res = await query(
      `SELECT ${RESULT_COLUMNS} FROM arcade_results
       WHERE organization_id=$1 AND learner_user_id=$2 AND arcade_activity_id=$3 AND mastery_achieved=true
       ORDER BY created_at ASC LIMIT 1`,
      [organizationId, learnerUserId, arcadeActivityId],
    );
    return res.rows[0] ? rowToResult(res.rows[0]) : null;
  }

  async listMasteredActivitiesForLearner(organizationId: string, learnerUserId: string): Promise<Array<{ arcadeActivityId: string; achievedAt: string }>> {
    const res = await query(
      `SELECT DISTINCT ON (arcade_activity_id) arcade_activity_id, created_at
       FROM arcade_results
       WHERE organization_id=$1 AND learner_user_id=$2 AND mastery_achieved=true
       ORDER BY arcade_activity_id, created_at ASC`,
      [organizationId, learnerUserId],
    );
    return res.rows.map((row: any) => ({ arcadeActivityId: row.arcade_activity_id, achievedAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at }));
  }
}
