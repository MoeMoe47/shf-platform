// SHF Ecosystem Phase 12 — private ICS/webcal feed token storage.
// Stores only a SHA-256 hash of the token (see 053_calendar_feed_tokens.sql
// for the full security rationale) — never the raw token itself.
import { query } from "../../../db/client.js";

export interface CalendarFeedTokenRow {
  organizationId: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  revokedAt: string | null;
}

function fromRow(row: any): CalendarFeedTokenRow {
  return {
    organizationId: row.organization_id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
  };
}

export class CalendarFeedTokenRepo {
  // Regenerating replaces this learner's one row in place — never a second
  // simultaneously-valid token for the same learner (see migration).
  async upsert(organizationId: string, userId: string, tokenHash: string): Promise<CalendarFeedTokenRow> {
    const res = await query(
      `INSERT INTO calendar_feed_tokens (organization_id, user_id, token_hash, created_at, revoked_at)
       VALUES ($1, $2, $3, NOW(), NULL)
       ON CONFLICT (organization_id, user_id)
       DO UPDATE SET token_hash = EXCLUDED.token_hash, created_at = NOW(), revoked_at = NULL
       RETURNING *`,
      [organizationId, userId, tokenHash],
    );
    return fromRow(res.rows[0]);
  }

  async findActiveByTokenHash(tokenHash: string): Promise<CalendarFeedTokenRow | null> {
    const res = await query(
      `SELECT * FROM calendar_feed_tokens WHERE token_hash = $1 AND revoked_at IS NULL`,
      [tokenHash],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  async findForLearner(organizationId: string, userId: string): Promise<CalendarFeedTokenRow | null> {
    const res = await query(
      `SELECT * FROM calendar_feed_tokens WHERE organization_id = $1 AND user_id = $2`,
      [organizationId, userId],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  async revoke(organizationId: string, userId: string): Promise<void> {
    await query(
      `UPDATE calendar_feed_tokens SET revoked_at = NOW() WHERE organization_id = $1 AND user_id = $2 AND revoked_at IS NULL`,
      [organizationId, userId],
    );
  }
}
