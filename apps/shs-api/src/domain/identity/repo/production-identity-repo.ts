import { createHash, randomBytes, randomUUID } from "node:crypto";
import { query } from "../../../db/client";
import type { VerifiedExternalIdentity } from "../../../auth/production-identity";

export class ProductionIdentityRepo {
  async findLink(external: VerifiedExternalIdentity) {
    const result = await query(
      `SELECT identity_link_id, internal_identity_id, provider, provider_subject, status
       FROM identity_provider_links WHERE provider = $1 AND provider_subject = $2 LIMIT 1`,
      [external.provider, external.subject],
    );
    return result.rows[0] || null;
  }

  async getActiveIdentity(internalIdentityId: string) {
    const result = await query(
      `SELECT u.user_id, u.email, u.full_name, u.status, u.organization_id,
              m.membership_id, m.organization_id AS membership_organization_id,
              m.status AS membership_status, m.effective_from, m.effective_to,
              o.status AS organization_status,
              r.role_id, r.role_name, r.role_scope_type,
              COALESCE(array_agg(rp.permission_name) FILTER (WHERE rp.permission_name IS NOT NULL), '{}') AS permissions
       FROM users u
       JOIN memberships m ON m.user_id = u.user_id
       JOIN organizations o ON o.organization_id = m.organization_id
       JOIN roles r ON r.role_id = m.role_id
       LEFT JOIN role_permissions rp ON rp.role_id = r.role_id
       WHERE u.user_id = $1 AND u.status = 'active' AND m.status = 'active'
         AND o.status = 'active'
         AND m.effective_from <= NOW() AND (m.effective_to IS NULL OR m.effective_to > NOW())
       GROUP BY u.user_id, u.email, u.full_name, u.status, u.organization_id,
                m.membership_id, m.organization_id, m.status, m.effective_from, m.effective_to,
                o.status, r.role_id, r.role_name, r.role_scope_type
       ORDER BY m.membership_id`,
      [internalIdentityId],
    );
    if (!result.rows.length) return null;
    const first = result.rows[0];
    return {
      user_id: first.user_id,
      email: first.email,
      full_name: first.full_name,
      organization_id: first.organization_id,
      memberships: result.rows.map((row) => ({
        membership_id: row.membership_id,
        organization_id: row.membership_organization_id,
        tenant_id: `tenant:${row.membership_organization_id}`,
        role_id: row.role_id,
        role: row.role_name,
        role_scope_type: row.role_scope_type,
        status: row.membership_status,
        organization_status: row.organization_status,
        permissions: row.permissions || [],
      })),
    };
  }

  async createSession(internalIdentityId: string, ttlMinutes = 60) {
    const rawToken = randomBytes(32).toString("base64url");
    const session = await query(
      `INSERT INTO shs_identity_sessions
       (session_id, session_token_hash, internal_identity_id, expires_at)
       VALUES ($1, $2, $3, NOW() + ($4 || ' minutes')::interval) RETURNING session_id, expires_at`,
      [randomUUID(), createHash("sha256").update(rawToken).digest("hex"), internalIdentityId, ttlMinutes],
    );
    return { token: rawToken, ...session.rows[0] };
  }

  async getSession(rawToken: string) {
    const result = await query(
      `SELECT s.session_id, s.internal_identity_id, s.expires_at, u.status
       FROM shs_identity_sessions s JOIN users u ON u.user_id = s.internal_identity_id
       WHERE s.session_token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()
         AND u.status = 'active' LIMIT 1`,
      [createHash("sha256").update(rawToken).digest("hex")],
    );
    return result.rows[0] || null;
  }

  async revokeSession(rawToken: string) {
    await query(`UPDATE shs_identity_sessions SET revoked_at = NOW(), version = version + 1 WHERE session_token_hash = $1 AND revoked_at IS NULL`, [createHash("sha256").update(rawToken).digest("hex")]);
  }
}
