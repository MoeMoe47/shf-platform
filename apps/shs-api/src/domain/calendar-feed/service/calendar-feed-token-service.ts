// SHF Ecosystem Phase 12 — private ICS feed token lifecycle.
//
// Same secure-token idiom already used for session tokens
// (production-identity-repo.ts): a high-entropy opaque token is generated
// once, shown to the caller exactly once, and only its SHA-256 hash is
// ever persisted. This is a self-issued bearer credential this app both
// creates and verifies — never a third-party OAuth secret — so hashing
// (one-way) is sufficient; no reversible encryption is needed or claimed.
import { randomBytes, createHash } from "node:crypto";
import { CalendarFeedTokenRepo } from "../repo/calendar-feed-token-repo.js";

const repo = new CalendarFeedTokenRepo();

function hash(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export interface FeedTokenActor {
  organization_id: string;
  user_id: string;
}

// Generates (or regenerates) this learner's one feed token. Regenerating
// immediately invalidates any previously issued URL — the old token's
// hash no longer matches any active row (see repo's upsert, which
// replaces the row in place).
export async function rotateFeedToken(actor: FeedTokenActor): Promise<{ token: string }> {
  const rawToken = randomBytes(32).toString("base64url");
  await repo.upsert(actor.organization_id, actor.user_id, hash(rawToken));
  return { token: rawToken };
}

export async function revokeFeedToken(actor: FeedTokenActor): Promise<void> {
  await repo.revoke(actor.organization_id, actor.user_id);
}

export interface FeedTokenStatus {
  active: boolean;
  createdAt: string | null;
}

// Never returns the raw token or its hash — status only (phase brief §42:
// "expose safe fields only").
export async function getFeedTokenStatus(actor: FeedTokenActor): Promise<FeedTokenStatus> {
  const row = await repo.findForLearner(actor.organization_id, actor.user_id);
  if (!row || row.revokedAt) return { active: false, createdAt: null };
  return { active: true, createdAt: row.createdAt };
}

// Resolves a raw token presented on the public feed URL back to the
// owning actor. Returns null for any invalid/revoked/unknown token —
// never throws, never reveals which case it was (constant response shape
// regardless of failure reason, matching this app's existing "honest
// empty result, no information leak" convention).
export async function resolveActorForFeedToken(rawToken: string): Promise<FeedTokenActor | null> {
  if (!rawToken || rawToken.length < 16) return null;
  const row = await repo.findActiveByTokenHash(hash(rawToken));
  if (!row) return null;
  return { organization_id: row.organizationId, user_id: row.userId };
}
