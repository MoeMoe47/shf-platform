import { query } from "../../../db/client.js";

export class ArcadeLeaderboardRepo {
  async listForActivity(organizationId: string, activityId: string, limit: number, offset: number) {
    const result = await query(
      `WITH eligible_results AS (
         SELECT r.arcade_result_id, r.learner_user_id, r.score, r.max_score, r.created_at,
                COALESCE(NULLIF(BTRIM(u.full_name), ''), 'Learner') AS display_name,
                ROW_NUMBER() OVER (
                  PARTITION BY r.learner_user_id
                  ORDER BY r.score DESC, r.created_at ASC, r.arcade_result_id ASC
                ) AS learner_result_number
         FROM arcade_results r
         LEFT JOIN users u
           ON u.user_id = r.learner_user_id
          AND u.organization_id = r.organization_id
         WHERE r.organization_id = $1
           AND r.arcade_activity_id = $2
           AND r.score IS NOT NULL
       ), best_results AS (
         SELECT arcade_result_id, learner_user_id, score, max_score, created_at, display_name
         FROM eligible_results
         WHERE learner_result_number = 1
       ), ranked_results AS (
         SELECT RANK() OVER (ORDER BY score DESC) AS rank,
                arcade_result_id, learner_user_id, score, max_score, created_at, display_name
         FROM best_results
       )
       SELECT rank, arcade_result_id, score, max_score, created_at, display_name
       FROM ranked_results
       ORDER BY score DESC, created_at ASC, learner_user_id ASC
       LIMIT $3 OFFSET $4`,
      [organizationId, activityId, limit + 1, offset],
    );
    const hasMore = result.rows.length > limit;
    return {
      items: result.rows.slice(0, limit).map((row: any) => ({
        rank: Number(row.rank),
        displayName: row.display_name,
        score: Number(row.score),
        maxScore: row.max_score === null ? null : Number(row.max_score),
        resultId: row.arcade_result_id,
        achievedAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      })),
      hasMore,
    };
  }
}
