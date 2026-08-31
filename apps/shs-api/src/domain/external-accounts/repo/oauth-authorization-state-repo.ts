// SHF Ecosystem Phase 12.1 — External Account Security foundation.
import { query } from "../../../db/client.js";

export interface OAuthAuthorizationStateRow {
  id: string;
  stateHash: string;
  organizationId: string;
  userId: string;
  provider: string;
  returnPath: string;
  pkceVerifierCiphertext: string;
  pkceVerifierIv: string;
  pkceVerifierAuthTag: string;
  pkceVerifierKeyVersion: string;
  expiresAt: string;
  consumedAt: string | null;
}

function fromRow(row: any): OAuthAuthorizationStateRow {
  return {
    id: row.id,
    stateHash: row.state_hash,
    organizationId: row.organization_id,
    userId: row.user_id,
    provider: row.provider,
    returnPath: row.return_path,
    pkceVerifierCiphertext: row.pkce_verifier_ciphertext,
    pkceVerifierIv: row.pkce_verifier_iv,
    pkceVerifierAuthTag: row.pkce_verifier_auth_tag,
    pkceVerifierKeyVersion: row.pkce_verifier_key_version,
    expiresAt: row.expires_at,
    consumedAt: row.consumed_at,
  };
}

export interface CreateStateInput {
  id: string;
  stateHash: string;
  organizationId: string;
  userId: string;
  provider: string;
  returnPath: string;
  pkceVerifierCiphertext: string;
  pkceVerifierIv: string;
  pkceVerifierAuthTag: string;
  pkceVerifierKeyVersion: string;
  expiresAt: string;
}

export class OAuthAuthorizationStateRepo {
  async create(input: CreateStateInput): Promise<OAuthAuthorizationStateRow> {
    const res = await query(
      `INSERT INTO oauth_authorization_states (
         id, state_hash, organization_id, user_id, provider, return_path,
         pkce_verifier_ciphertext, pkce_verifier_iv, pkce_verifier_auth_tag, pkce_verifier_key_version,
         expires_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        input.id,
        input.stateHash,
        input.organizationId,
        input.userId,
        input.provider,
        input.returnPath,
        input.pkceVerifierCiphertext,
        input.pkceVerifierIv,
        input.pkceVerifierAuthTag,
        input.pkceVerifierKeyVersion,
        input.expiresAt,
      ],
    );
    return fromRow(res.rows[0]);
  }

  async findByStateHash(stateHash: string): Promise<OAuthAuthorizationStateRow | null> {
    const res = await query(`SELECT * FROM oauth_authorization_states WHERE state_hash = $1`, [stateHash]);
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }

  // Phase 13 — bounded maintenance cleanup (phase brief §40/§46): deletes
  // rows that can never be claimed again (already expired, or already
  // consumed more than an hour ago — kept briefly past consumption only
  // in case a near-simultaneous duplicate request needs the same honest
  // "already consumed" answer, never indefinitely). Prevents unbounded
  // growth of a table that otherwise accumulates one row per connect
  // attempt forever.
  async deleteStale(): Promise<number> {
    const res = await query(
      `DELETE FROM oauth_authorization_states
       WHERE expires_at < NOW() OR consumed_at < NOW() - INTERVAL '1 hour'`,
    );
    return res.rowCount || 0;
  }

  // Atomic claim: only succeeds (returns a row) the first time this state
  // is consumed. A concurrent or repeat callback with the same state
  // hash finds zero unconsumed rows and gets null — replay-safe without a
  // separate read-then-write race window.
  async claimByStateHash(stateHash: string): Promise<OAuthAuthorizationStateRow | null> {
    const res = await query(
      `UPDATE oauth_authorization_states SET consumed_at = NOW()
       WHERE state_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
       RETURNING *`,
      [stateHash],
    );
    return res.rows[0] ? fromRow(res.rows[0]) : null;
  }
}
