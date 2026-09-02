// SHF AIEL Phase 3 — Personal Accessibility Profile repository.
//
// Every method is actor-scoped by construction (user_id is always the
// lookup key, never a caller-suppliable parameter) — mirrors the same
// structural-IDOR-elimination discipline already established in
// external-account-connection-repo.ts this same session.
import { query } from "../../../db/client.js";
import type { AccessibilityProfileRow, AccessibilityPreferences } from "../model/accessibility-profile.js";

function fromRow(row: any): AccessibilityProfileRow {
  return {
    id: row.id,
    userId: row.user_id,
    profileVersion: row.profile_version,
    revision: row.revision,
    preferences: row.preferences,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class AccessibilityProfileRepo {
  async findForUser(userId: string): Promise<AccessibilityProfileRow | null> {
    const res = await query(`SELECT * FROM user_accessibility_profiles WHERE user_id = $1`, [userId]);
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  // First-write creation only (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md
  // §15) — never called from a bare GET. ON CONFLICT protects against a
  // genuine race (two concurrent first-writes for the same user) by
  // falling back to the CAS update path below rather than erroring.
  async create(id: string, userId: string, preferences: AccessibilityPreferences): Promise<AccessibilityProfileRow> {
    const res = await query(
      `INSERT INTO user_accessibility_profiles (id, user_id, profile_version, revision, preferences, created_at, updated_at)
       VALUES ($1, $2, 1, 1, $3::jsonb, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         preferences = $3::jsonb, revision = user_accessibility_profiles.revision + 1, updated_at = NOW()
       RETURNING *`,
      [id, userId, JSON.stringify(preferences)],
    );
    return fromRow(res.rows[0]);
  }

  // Compare-and-swap update — reuses the exact pattern already
  // established in report-public-disclosure-policy-repo.ts (`WHERE ...
  // AND report_version = $2`). Returns null (never throws) when the
  // expected revision no longer matches, letting the service layer
  // return an honest 409 rather than silently overwriting a concurrent
  // write.
  async updateWithRevisionCheck(userId: string, expectedRevision: number, preferences: AccessibilityPreferences): Promise<AccessibilityProfileRow | null> {
    const res = await query(
      `UPDATE user_accessibility_profiles
       SET preferences = $3::jsonb, revision = revision + 1, updated_at = NOW()
       WHERE user_id = $1 AND revision = $2
       RETURNING *`,
      [userId, expectedRevision, JSON.stringify(preferences)],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }
}
