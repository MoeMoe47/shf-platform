// SHF Ecosystem Phase 12.1 — External Account Security foundation.
//
// Provider-neutral connection lifecycle. No method here calls a real
// Google/Microsoft API — createOrReplaceConnection() takes already-
// obtained tokens as plain input, so it can be fully exercised today with
// synthetic test values and later reused unmodified by a Phase 12.2
// provider adapter once a real token-exchange call feeds it real tokens.
import { randomBytes } from "node:crypto";
import { encryptSecret, decryptSecret } from "../../../security/external-secret-cipher.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";
import { ExternalAccountConnectionRepo } from "../repo/external-account-connection-repo.js";
import { ExternalCalendarEventLinkRepo } from "../repo/external-calendar-event-link-repo.js";
import { getExternalCalendarProvider } from "../providers/provider-registry.js";
import type { ExternalCalendarProvider } from "../providers/external-calendar-provider.js";
import type {
  ExternalAccountConnectionActor,
  ExternalAccountConnectionRow,
  ExternalAccountProvider,
  SafeExternalAccountConnectionDto,
} from "../model/external-account-connection.js";

const repo = new ExternalAccountConnectionRepo();
const eventLinkRepo = new ExternalCalendarEventLinkRepo();

function decryptRow(row: ExternalAccountConnectionRow, field: "access" | "refresh"): string | null {
  const ciphertext = field === "access" ? row.accessTokenCiphertext : row.refreshTokenCiphertext;
  const iv = field === "access" ? row.accessTokenIv : row.refreshTokenIv;
  const authTag = field === "access" ? row.accessTokenAuthTag : row.refreshTokenAuthTag;
  if (!ciphertext || !iv || !authTag || !row.tokenKeyVersion) return null;
  return decryptSecret({ ciphertext, iv, authTag, keyVersion: row.tokenKeyVersion });
}

export function toSafeConnectionDto(row: ExternalAccountConnectionRow): SafeExternalAccountConnectionDto {
  return {
    id: row.id,
    provider: row.provider,
    status: row.status,
    connectedAt: row.connectedAt,
    reauthRequired: row.status === "REAUTH_REQUIRED",
  };
}

export async function listConnectionsForActor(actor: ExternalAccountConnectionActor): Promise<SafeExternalAccountConnectionDto[]> {
  const rows = await repo.listForActor(actor);
  return rows.map(toSafeConnectionDto);
}

export async function getConnectionForActor(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
): Promise<SafeExternalAccountConnectionDto | null> {
  const row = await repo.findForActorAndProvider(actor, provider);
  if (!row || row.status === "REVOKED") return null;
  return toSafeConnectionDto(row);
}

export interface ConnectTokensInput {
  providerAccountId: string;
  scopes: string[];
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshToken: string;
}

// Encrypts and persists a new/replacement connection. Never logged, never
// echoed back — the caller (a future provider adapter) gets only the safe
// DTO in return.
export async function createOrReplaceConnection(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
  tokens: ConnectTokensInput,
): Promise<SafeExternalAccountConnectionDto> {
  const refreshEnvelope = encryptSecret(tokens.refreshToken);
  const accessEnvelope = tokens.accessToken ? encryptSecret(tokens.accessToken) : null;

  const row = await repo.createOrReplaceConnection(
    `extconn_${randomBytes(16).toString("hex")}`,
    actor,
    provider,
    {
      providerAccountId: tokens.providerAccountId,
      scopes: tokens.scopes,
      accessToken: accessEnvelope
        ? { ciphertext: accessEnvelope.ciphertext, iv: accessEnvelope.iv, authTag: accessEnvelope.authTag }
        : null,
      refreshToken: { ciphertext: refreshEnvelope.ciphertext, iv: refreshEnvelope.iv, authTag: refreshEnvelope.authTag },
      tokenKeyVersion: refreshEnvelope.keyVersion,
      accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    },
  );

  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "external_account_connection",
    target_object_id: row.id,
    action_type: "external_account.connected",
    new_state_json: { provider, status: row.status },
    correlation_id: `corr_${row.id}`,
    source_channel: "api",
  });

  return toSafeConnectionDto(row);
}

export interface ValidAccessTokenResult {
  connectionId: string;
  accessToken: string;
}

// Returns a usable, non-expired access token for the actor's connection —
// transparently refreshing it first if missing/expiring within 60s (phase
// brief §12: "regenerate from refresh token as needed"). Never returns a
// stale token for the caller to fail on; on a refresh failure (revoked/
// invalid refresh token) marks REAUTH_REQUIRED and returns null rather
// than throwing, so a caller iterating multiple providers (Free/Busy,
// mirror sync) can isolate this one failure (phase brief §33).
export async function getValidAccessTokenForActor(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
  providerOverride?: ExternalCalendarProvider,
): Promise<ValidAccessTokenResult | null> {
  const row = await repo.findForActorAndProvider(actor, provider);
  if (!row || row.status !== "ACTIVE" || !row.refreshTokenCiphertext) return null;

  const expiresAtMs = row.accessTokenExpiresAt ? new Date(row.accessTokenExpiresAt).getTime() : 0;
  const needsRefresh = !row.accessTokenCiphertext || expiresAtMs <= Date.now() + 60_000;

  if (!needsRefresh) {
    const accessToken = decryptRow(row, "access");
    if (accessToken) return { connectionId: row.id, accessToken };
  }

  const refreshToken = decryptRow(row, "refresh");
  if (!refreshToken) return null;

  const adapter = providerOverride || getExternalCalendarProvider(provider);
  let refreshed;
  try {
    refreshed = await adapter.refreshAccessToken(refreshToken);
  } catch {
    await markReauthRequired(actor, provider);
    return null;
  }
  if (!refreshed.accessToken) {
    await markReauthRequired(actor, provider);
    return null;
  }

  const accessEnvelope = encryptSecret(refreshed.accessToken);
  // Never erase a valid existing refresh token just because the provider
  // didn't re-issue one on this refresh call (phase brief §11) —
  // Google routinely omits it; only replace when a new one is present.
  const refreshEnvelope = refreshed.refreshToken ? encryptSecret(refreshed.refreshToken) : encryptSecret(refreshToken);

  await repo.refreshTokens(actor, provider, {
    providerAccountId: row.providerAccountId || "",
    scopes: refreshed.scope.length ? refreshed.scope : row.scopes,
    accessToken: { ciphertext: accessEnvelope.ciphertext, iv: accessEnvelope.iv, authTag: accessEnvelope.authTag },
    refreshToken: { ciphertext: refreshEnvelope.ciphertext, iv: refreshEnvelope.iv, authTag: refreshEnvelope.authTag },
    tokenKeyVersion: accessEnvelope.keyVersion,
    accessTokenExpiresAt: refreshed.accessTokenExpiresAt,
  });

  return { connectionId: row.id, accessToken: refreshed.accessToken };
}

export async function markReauthRequired(actor: ExternalAccountConnectionActor, provider: ExternalAccountProvider): Promise<void> {
  await repo.markReauthRequired(actor, provider);
  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "external_account_connection",
    target_object_id: `${actor.user_id}:${provider}`,
    action_type: "external_account.reauth_required",
    correlation_id: `corr_${randomBytes(8).toString("hex")}`,
    source_channel: "api",
  });
}

export interface RevokeConnectionResult {
  revoked: boolean;
  providerRevocationSucceeded: boolean | null; // null when there was nothing to revoke provider-side
}

// Disconnect (phase brief §38-39): best-effort revoke the token with the
// provider first, but local secret destruction proceeds regardless of
// whether that call succeeds — a provider-side outage must never block a
// learner from disconnecting locally. Also stops mirror sync by deleting
// this connection's event links (§38: "stop native mirror sync"); already
// -created provider-side mirror events are deliberately left in place
// (documented, not silently orphaned — see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md).
export async function revokeConnection(
  actor: ExternalAccountConnectionActor,
  provider: ExternalAccountProvider,
  providerOverride?: ExternalCalendarProvider,
): Promise<RevokeConnectionResult> {
  const row = await repo.findForActorAndProvider(actor, provider);
  if (!row || row.status === "REVOKED") return { revoked: false, providerRevocationSucceeded: null };

  let providerRevocationSucceeded: boolean | null = null;
  const refreshToken = decryptRow(row, "refresh");
  if (refreshToken) {
    const adapter = providerOverride || getExternalCalendarProvider(provider);
    try {
      await adapter.revokeConnection(refreshToken);
      providerRevocationSucceeded = true;
    } catch {
      providerRevocationSucceeded = false; // reported honestly, never hidden — but does not block local cleanup below
    }
  }

  const revoked = await repo.revoke(actor, provider);
  if (!revoked) return { revoked: false, providerRevocationSucceeded };
  await eventLinkRepo.deleteAllForConnection(row.id);

  await writeAuditEvent({
    audit_event_id: `audit_${randomBytes(16).toString("hex")}`,
    organization_id: actor.organization_id,
    actor_user_id: actor.user_id,
    target_object_type: "external_account_connection",
    target_object_id: `${actor.user_id}:${provider}`,
    action_type: "external_account.disconnected",
    new_state_json: { providerRevocationSucceeded },
    correlation_id: `corr_${randomBytes(8).toString("hex")}`,
    source_channel: "api",
  });
  return { revoked: true, providerRevocationSucceeded };
}
