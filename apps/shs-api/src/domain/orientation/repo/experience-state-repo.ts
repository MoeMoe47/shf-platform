import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import type { ExperienceAction, ExperienceState, ExperienceStateInput, ExperienceStatus } from "../model/experience-state.js";

function fromRow(row: any): ExperienceState {
  return {
    experienceStateId: row.experience_state_id,
    userId: row.user_id,
    organizationId: row.organization_id,
    tenantId: row.tenant_id,
    orientationId: row.orientation_id,
    orientationVersion: Number(row.orientation_version),
    tourId: row.tour_id,
    tourVersion: row.tour_version == null ? null : Number(row.tour_version),
    status: row.status,
    currentStepId: row.current_step_id,
    lastRoute: row.last_route,
    lastDestinationId: row.last_destination_id,
    firstOfferedAt: row.first_offered_at?.toISOString?.() ?? row.first_offered_at ?? null,
    startedAt: row.started_at?.toISOString?.() ?? row.started_at ?? null,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
    completedAt: row.completed_at?.toISOString?.() ?? row.completed_at ?? null,
    skippedAt: row.skipped_at?.toISOString?.() ?? row.skipped_at ?? null,
    dismissedAt: row.dismissed_at?.toISOString?.() ?? row.dismissed_at ?? null,
    whatsChangedSeenAt: row.whats_changed_seen_at?.toISOString?.() ?? row.whats_changed_seen_at ?? null,
    replayCount: Number(row.replay_count || 0),
  };
}

export class ExperienceStateRepo {
  constructor(private readonly dbQuery = query) {}

  async get(scope: { userId: string; organizationId: string; tenantId: string }, input: ExperienceStateInput): Promise<ExperienceState | null> {
    const result = await this.dbQuery(
      `SELECT * FROM ogl_orientation_experience_state
       WHERE user_id = $1 AND organization_id = $2 AND tenant_id = $3
         AND orientation_id = $4 AND orientation_version = $5
         AND tour_id IS NOT DISTINCT FROM $6 AND tour_version IS NOT DISTINCT FROM $7`,
      [scope.userId, scope.organizationId, scope.tenantId, input.orientationId, input.orientationVersion, input.tourId ?? null, input.tourVersion ?? null],
    );
    return result.rows[0] ? fromRow(result.rows[0]) : null;
  }

  async upsert(scope: { userId: string; organizationId: string; tenantId: string }, input: ExperienceStateInput, values: { action: ExperienceAction; status: ExperienceStatus; currentStepId?: string | null; lastRoute?: string | null; lastDestinationId?: string | null; replay?: boolean; markWhatsChanged?: boolean }): Promise<ExperienceState> {
    const result = await this.dbQuery(
      `INSERT INTO ogl_orientation_experience_state (
        experience_state_id, user_id, organization_id, tenant_id, orientation_id, orientation_version,
        tour_id, tour_version, status, current_step_id, last_route, last_destination_id,
        first_offered_at, started_at, updated_at, completed_at, skipped_at, dismissed_at,
        whats_changed_seen_at, replay_count
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,
        CASE WHEN $13 THEN NOW() ELSE NULL END,
        CASE WHEN $14 THEN NOW() ELSE NULL END,
        NOW(), CASE WHEN $15 THEN NOW() ELSE NULL END,
        CASE WHEN $16 THEN NOW() ELSE NULL END,
        CASE WHEN $17 THEN NOW() ELSE NULL END,
        CASE WHEN $18 THEN NOW() ELSE NULL END,
        CASE WHEN $19 THEN 1 ELSE 0 END)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [
        randomUUID(), scope.userId, scope.organizationId, scope.tenantId, input.orientationId, input.orientationVersion,
        input.tourId ?? null, input.tourVersion ?? null, values.status, input.currentStepId ?? null,
        input.lastRoute ?? null, input.lastDestinationId ?? null,
        values.status === "OFFERED", ["STARTED", "PAUSED", "COMPLETED"].includes(values.status),
        values.status === "COMPLETED", values.status === "SKIPPED", values.status === "DISMISSED",
        Boolean(values.markWhatsChanged), Boolean(values.replay),
      ],
    );
    if (result.rows[0]) return fromRow(result.rows[0]);

    const updated = await this.dbQuery(
      `UPDATE ogl_orientation_experience_state
       SET status = CASE WHEN status = 'COMPLETED' AND $10 NOT IN ('RESTART','WHATS_CHANGED_SEEN') THEN status ELSE $1 END,
           current_step_id = COALESCE($2, current_step_id),
           last_route = COALESCE($3, last_route),
           last_destination_id = COALESCE($4, last_destination_id),
           first_offered_at = COALESCE(first_offered_at, CASE WHEN $1 = 'OFFERED' THEN NOW() ELSE NULL END),
           started_at = COALESCE(started_at, CASE WHEN $1 IN ('STARTED','PAUSED','COMPLETED') THEN NOW() ELSE NULL END),
           updated_at = NOW(),
           completed_at = CASE WHEN $10 = 'COMPLETE' THEN NOW() ELSE completed_at END,
           skipped_at = CASE WHEN $10 = 'SKIP' THEN NOW() ELSE skipped_at END,
           dismissed_at = CASE WHEN $10 = 'DISMISS' THEN NOW() ELSE dismissed_at END,
           whats_changed_seen_at = CASE WHEN $5 THEN NOW() ELSE whats_changed_seen_at END,
           replay_count = replay_count + CASE WHEN $6 THEN 1 ELSE 0 END
       WHERE user_id = $7 AND organization_id = $8 AND tenant_id = $9
         AND orientation_id = $11 AND orientation_version = $12
         AND tour_id IS NOT DISTINCT FROM $13 AND tour_version IS NOT DISTINCT FROM $14
       RETURNING *`,
      [values.status, input.currentStepId ?? null, input.lastRoute ?? null, input.lastDestinationId ?? null,
        Boolean(values.markWhatsChanged), Boolean(values.replay), scope.userId, scope.organizationId, scope.tenantId,
        values.action, input.orientationId, input.orientationVersion, input.tourId ?? null, input.tourVersion ?? null],
    );
    if (!updated.rows[0]) throw new Error("EXPERIENCE_STATE_NOT_FOUND");
    return fromRow(updated.rows[0]);
  }
}
