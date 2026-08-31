// SHF Ecosystem Phase 12.1 — External Account Security foundation.
//
// Secure, provider-neutral OAuth state + PKCE lifecycle. Nothing here
// knows about Google or Microsoft specifically — a future Phase 12.2
// provider adapter calls createAuthorizationState() before redirecting
// the browser to the provider, then consumeAuthorizationState() when the
// provider redirects back, exactly as any OAuth 2.0 + PKCE (RFC 7636)
// consumer would.
//
// The raw state value follows the same idiom as calendar feed tokens
// (calendar-feed-token-service.ts): high-entropy, generated once, shown
// to the caller exactly once (embedded in the provider authorize URL),
// and only its SHA-256 hash is ever persisted — this app both issues and
// verifies its own state, so hashing is sufficient. The PKCE verifier is
// different: the provider's token endpoint needs the original value back
// after the callback, so it is stored via the reversible AES-256-GCM
// envelope (external-secret-cipher.ts), never in plaintext.
import { randomBytes, createHash } from "node:crypto";
import { encryptSecret, decryptSecret } from "../../../security/external-secret-cipher.js";
import { OAuthAuthorizationStateRepo } from "../repo/oauth-authorization-state-repo.js";
import { isSafeInternalReturnPath } from "./return-path-guard.js";
import type { ExternalAccountConnectionActor } from "../model/external-account-connection.js";
import { isExternalAccountProvider, type ExternalAccountProvider } from "../model/external-account-connection.js";

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes — long enough for a real provider consent flow, short enough to bound replay risk

const repo = new OAuthAuthorizationStateRepo();

function hashState(rawState: string): string {
  return createHash("sha256").update(rawState).digest("hex");
}

function base64UrlSha256(input: string): string {
  return createHash("sha256").update(input).digest("base64url");
}

export interface AuthorizationStateInput {
  actor: ExternalAccountConnectionActor;
  provider: ExternalAccountProvider;
  returnPath: string;
}

export interface AuthorizationStateResult {
  state: string;
  codeChallenge: string;
  codeChallengeMethod: "S256";
}

export class UnsafeReturnPathError extends Error {
  constructor() {
    super("unsafe_return_path");
  }
}

export class UnknownProviderError extends Error {
  constructor() {
    super("unknown_external_account_provider");
  }
}

// Issues a new one-time state + PKCE pair. The verifier is encrypted and
// stored server-side only — it is never included in this function's
// return value, so it can never reach the browser via the authorize
// redirect (phase brief §13: "Do not send verifier to browser storage").
export async function createAuthorizationState(input: AuthorizationStateInput): Promise<AuthorizationStateResult> {
  if (!isExternalAccountProvider(input.provider)) throw new UnknownProviderError();
  if (!isSafeInternalReturnPath(input.returnPath)) throw new UnsafeReturnPathError();

  const rawState = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const codeChallenge = base64UrlSha256(verifier);
  const envelope = encryptSecret(verifier);

  await repo.create({
    id: `oastate_${randomBytes(16).toString("hex")}`,
    stateHash: hashState(rawState),
    organizationId: input.actor.organization_id,
    userId: input.actor.user_id,
    provider: input.provider,
    returnPath: input.returnPath,
    pkceVerifierCiphertext: envelope.ciphertext,
    pkceVerifierIv: envelope.iv,
    pkceVerifierAuthTag: envelope.authTag,
    pkceVerifierKeyVersion: envelope.keyVersion,
    expiresAt: new Date(Date.now() + STATE_TTL_MS).toISOString(),
  });

  return { state: rawState, codeChallenge, codeChallengeMethod: "S256" };
}

export interface ConsumeAuthorizationStateInput {
  actor: ExternalAccountConnectionActor;
  provider: ExternalAccountProvider;
  rawState: string;
}

export interface ConsumedAuthorizationState {
  returnPath: string;
  codeVerifier: string;
}

// Every failure mode below (unknown state, wrong actor, wrong provider,
// expired, already consumed) returns null — never a different error per
// case — so a callback cannot be used as an oracle to distinguish "this
// state doesn't exist" from "this state belongs to someone else" (same
// no-information-leak convention as resolveActorForFeedToken()).
export async function consumeAuthorizationState(input: ConsumeAuthorizationStateInput): Promise<ConsumedAuthorizationState | null> {
  if (!input.rawState || typeof input.rawState !== "string") return null;
  const claimed = await repo.claimByStateHash(hashState(input.rawState));
  if (!claimed) return null; // covers: unknown, expired, or already-consumed (replay)
  if (claimed.organizationId !== input.actor.organization_id || claimed.userId !== input.actor.user_id) return null;
  if (claimed.provider !== input.provider) return null;

  const codeVerifier = decryptSecret({
    ciphertext: claimed.pkceVerifierCiphertext,
    iv: claimed.pkceVerifierIv,
    authTag: claimed.pkceVerifierAuthTag,
    keyVersion: claimed.pkceVerifierKeyVersion,
  });

  return { returnPath: claimed.returnPath, codeVerifier };
}

// Phase 13 — see oauth-authorization-state-repo.ts's deleteStale() for
// the exact retention rule. Called opportunistically at the start of
// each background mirror-sync dispatch pass rather than needing its own
// separate cron entry.
export async function cleanupExpiredAuthorizationStates(): Promise<number> {
  return repo.deleteStale();
}
