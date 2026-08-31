// SHF Ecosystem Phase 12.1 — External Account Security foundation.
//
// Every method here is actor-scoped by construction (organization_id +
// user_id are always part of the WHERE clause) — there is no method that
// accepts a bare connection id from a caller, so a cross-user IDOR read
// via a guessed/enumerated id is structurally impossible, not just
// permission-checked (phase brief §21: "direct connection ID cross-user
// returns 404 or project-standard non-leaking denial" — here there is no
// direct-ID lookup path at all).
import { query } from "../../../db/client.js";
import type {
  ExternalAccountConnectionActor,
  ExternalAccountConnectionRow,
  ExternalAccountProvider,
} from "../model/external-account-connection.js";

function fromRow(row: any): ExternalAccountConnectionRow {
  return {
    id: row.id,
    organizationId: row.organization_id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    status: row.status,
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    accessTokenCiphertext: row.access_token_ciphertext,
    accessTokenIv: row.access_token_iv,
    accessTokenAuthTag: row.access_token_auth_tag,
    refreshTokenCiphertext: row.refresh_token_ciphertext,
    refreshTokenIv: row.refresh_token_iv,
    refreshTokenAuthTag: row.refresh_token_auth_tag,
    tokenKeyVersion: row.token_key_version,
    accessTokenExpiresAt: row.access_token_expires_at,
    connectedAt: row.connected_at,
    lastRefreshedAt: row.last_refreshed_at,
    reauthRequiredAt: row.reauth_required_at,
    revokedAt: row.revoked_at,
  };
}

export interface UpsertConnectionTokens {
  providerAccountId: string;
  scopes: string[];
  accessToken: { ciphertext: string; iv: string; authTag: string } | null;
  refreshToken: { ciphertext: string; iv: string; authTag: string };
  tokenKeyVersion: string;
  accessTokenExpiresAt: string | null;
}

export class ExternalAccountConnectionRepo {
  // Phase 13 — bounded batch across ALL actors, oldest-synced-first
  // (never-synced connections, `last_refreshed_at IS NULL`, come first),
  // for the background mirror-sync dispatcher (phase brief §11/§14). Not
  // actor-scoped like every other method here — this one deliberately
  // operates system-wide, which is why it is only ever called from the
  // trusted worker entrypoint, never from an HTTP route.
  async listActiveConnectionsForSync(limit: number): Promise<ExternalAccountConnectionRow[]> {
    const res = await query(
      `SELECT * FROM external_account_connections
       WHERE status = 'ACTIVE'
       ORDER BY last_refreshed_at ASC NULLS FIRST, connected_at ASC
       LIMIT $1`,
      [limit],
    );
    return res.rows.map(fromRow);
  }

  async listForActor(actor: ExternalAccountConnectionActor): Promise<ExternalAccountConnectionRow[]> {
    const res = await query(
      `SELECT * FROM external_account_connections
       WHERE organization_id = $1 AND user_id = $2 AND status != 'REVOKED'
       ORDER BY connected_at DESC`,
      [actor.organization_id, actor.user_id],
    );
    return res.rows.map(fromRow);
  }

  async findForActorAndProvider(
    actor: ExternalAccountConnectionActor,
    provider: ExternalAccountProvider,
  ): Promise<ExternalAccountConnectionRow | null> {
    const res = await query(
      `SELECT * FROM external_account_connections
       WHERE organization_id = $1 AND user_id = $2 AND provider = $3`,
      [actor.organization_id, actor.user_id, provider],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  // Creates the connection, or replaces an existing (including previously
  // revoked) row for the same actor/provider — one row per actor/provider
  // is a structural guarantee (migration's UNIQUE constraint), matching
  // the calendar_feed_tokens "exactly one row, ever" precedent.
  async createOrReplaceConnection(
    id: string,
    actor: ExternalAccountConnectionActor,
    provider: ExternalAccountProvider,
    tokens: UpsertConnectionTokens,
  ): Promise<ExternalAccountConnectionRow> {
    const res = await query(
      `INSERT INTO external_account_connections (
         id, organization_id, user_id, provider, provider_account_id, status, scopes,
         access_token_ciphertext, access_token_iv, access_token_auth_tag,
         refresh_token_ciphertext, refresh_token_iv, refresh_token_auth_tag,
         token_key_version, access_token_expires_at,
         connected_at, last_refreshed_at, reauth_required_at, revoked_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, 'ACTIVE', $6::jsonb,
         $7, $8, $9, $10, $11, $12, $13, $14,
         NOW(), NOW(), NULL, NULL, NOW()
       )
       ON CONFLICT (organization_id, user_id, provider) DO UPDATE SET
         -- id is deliberately NEVER reassigned here (phase brief §17/§18
         -- via migration 055): external_calendar_event_links.connection_id
         -- is a foreign key into this table's id, so a reconnect must
         -- preserve the existing row's id — reassigning it would orphan
         -- every mirror link created before the reconnect via a foreign
         -- key violation, discovered by this phase's own test suite.
         provider_account_id = EXCLUDED.provider_account_id,
         status = 'ACTIVE',
         scopes = EXCLUDED.scopes,
         access_token_ciphertext = EXCLUDED.access_token_ciphertext,
         access_token_iv = EXCLUDED.access_token_iv,
         access_token_auth_tag = EXCLUDED.access_token_auth_tag,
         refresh_token_ciphertext = EXCLUDED.refresh_token_ciphertext,
         refresh_token_iv = EXCLUDED.refresh_token_iv,
         refresh_token_auth_tag = EXCLUDED.refresh_token_auth_tag,
         token_key_version = EXCLUDED.token_key_version,
         access_token_expires_at = EXCLUDED.access_token_expires_at,
         connected_at = NOW(),
         last_refreshed_at = NOW(),
         reauth_required_at = NULL,
         revoked_at = NULL,
         updated_at = NOW()
       RETURNING *`,
      [
        id,
        actor.organization_id,
        actor.user_id,
        provider,
        tokens.providerAccountId,
        JSON.stringify(tokens.scopes),
        tokens.accessToken?.ciphertext ?? null,
        tokens.accessToken?.iv ?? null,
        tokens.accessToken?.authTag ?? null,
        tokens.refreshToken.ciphertext,
        tokens.refreshToken.iv,
        tokens.refreshToken.authTag,
        tokens.tokenKeyVersion,
        tokens.accessTokenExpiresAt,
      ],
    );
    return fromRow(res.rows[0]);
  }

  // Token-only update (phase brief §12/§13): distinct from
  // createOrReplaceConnection() because a routine access-token refresh
  // must never reset `connected_at` (the original connection time) the
  // way a fresh connect/reconnect legitimately does. Also clears any
  // REAUTH_REQUIRED status — a successful refresh proves the connection
  // is healthy again.
  async refreshTokens(
    actor: ExternalAccountConnectionActor,
    provider: ExternalAccountProvider,
    tokens: UpsertConnectionTokens,
  ): Promise<ExternalAccountConnectionRow | null> {
    const res = await query(
      `UPDATE external_account_connections SET
         status = 'ACTIVE', reauth_required_at = NULL,
         provider_account_id = COALESCE($4, provider_account_id),
         scopes = COALESCE($5::jsonb, scopes),
         access_token_ciphertext = $6, access_token_iv = $7, access_token_auth_tag = $8,
         refresh_token_ciphertext = $9, refresh_token_iv = $10, refresh_token_auth_tag = $11,
         token_key_version = $12, access_token_expires_at = $13,
         last_refreshed_at = NOW(), updated_at = NOW()
       WHERE organization_id = $1 AND user_id = $2 AND provider = $3 AND status != 'REVOKED'
       RETURNING *`,
      [
        actor.organization_id,
        actor.user_id,
        provider,
        tokens.providerAccountId || null,
        tokens.scopes.length ? JSON.stringify(tokens.scopes) : null,
        tokens.accessToken?.ciphertext ?? null,
        tokens.accessToken?.iv ?? null,
        tokens.accessToken?.authTag ?? null,
        tokens.refreshToken.ciphertext,
        tokens.refreshToken.iv,
        tokens.refreshToken.authTag,
        tokens.tokenKeyVersion,
        tokens.accessTokenExpiresAt,
      ],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  async markReauthRequired(actor: ExternalAccountConnectionActor, provider: ExternalAccountProvider): Promise<void> {
    await query(
      `UPDATE external_account_connections
       SET status = 'REAUTH_REQUIRED', reauth_required_at = NOW(), updated_at = NOW()
       WHERE organization_id = $1 AND user_id = $2 AND provider = $3 AND status != 'REVOKED'`,
      [actor.organization_id, actor.user_id, provider],
    );
  }

  // Destroys the encrypted token material in place rather than deleting
  // the row — keeps connectedAt/history visible in the safe DTO while
  // making the ciphertext columns unrecoverable (phase brief §20:
  // "destroy encrypted token material").
  async revoke(actor: ExternalAccountConnectionActor, provider: ExternalAccountProvider): Promise<boolean> {
    const res = await query(
      `UPDATE external_account_connections
       SET status = 'REVOKED', revoked_at = NOW(), updated_at = NOW(),
           access_token_ciphertext = NULL, access_token_iv = NULL, access_token_auth_tag = NULL,
           refresh_token_ciphertext = NULL, refresh_token_iv = NULL, refresh_token_auth_tag = NULL
       WHERE organization_id = $1 AND user_id = $2 AND provider = $3 AND status != 'REVOKED'`,
      [actor.organization_id, actor.user_id, provider],
    );
    return (res.rowCount || 0) > 0;
  }
}
