// SHF Ecosystem Phase 12.2 — SHF -> provider one-way Calendar mirroring.
//
// NON-NEGOTIABLE (phase brief §16): mirroring is one-way only. Nothing in
// this file ever writes to a source domain, nor reads a provider event's
// own edits back into SHF — see external-calendar-event-link-repo.ts's
// own header for why its schema has no path for that.
import { randomBytes } from "node:crypto";
import { pool } from "../../../db/client.js";
import { getCalendarProjectionForActor } from "../../calendar/service/calendar-projection-service.js";
import type { CalendarActor } from "../../calendar/service/calendar-adapters.js";
import { getConnectionForActor, getValidAccessTokenForActor } from "./external-account-connection-service.js";
import { getExternalCalendarProvider } from "../providers/provider-registry.js";
import { ExternalCalendarEventLinkRepo } from "../repo/external-calendar-event-link-repo.js";
import type { ExternalCalendarProvider } from "../providers/external-calendar-provider.js";
import type { ExternalAccountProvider } from "../model/external-account-connection.js";

const linkRepo = new ExternalCalendarEventLinkRepo();

// Bounded horizon (matches calendar-projection-service.ts's own MAX_RANGE_DAYS
// discipline) — mirroring is a rolling near-term window, never a
// full-history backfill.
const MIRROR_WINDOW_DAYS = 60;

// SHF Ecosystem Phase 13 — job locking (phase brief §13). Reuses the
// same Postgres advisory-lock primitive already established for the
// migration runner (src/db/migration-runner.ts's own MIGRATION_LOCK_KEY)
// rather than inventing a new locking mechanism or queue system. A
// distinct namespace constant (arbitrary, but must never collide with
// MIGRATION_LOCK_KEY=779421083 or any other advisory-lock user) scopes
// this lock to one connection at a time — two workers (an on-demand HTTP
// request and a background dispatcher pass, or two dispatcher replicas)
// can never sync the same connection concurrently and race event
// creation.
const MIRROR_SYNC_LOCK_NAMESPACE = 913485501;

export class MirrorSyncInProgressError extends Error {
  constructor(public connectionId: string) {
    super(`A sync is already in progress for connection ${connectionId}.`);
    this.name = "MirrorSyncInProgressError";
  }
}

// A session-level advisory lock is tied to the specific backend
// connection that acquired it — using the pool's own auto-checkout-and-
// release query() helper here would silently break the lock (the acquire
// and release calls could each land on a different pooled connection,
// exactly the bug this comment exists to prevent). A single dedicated
// client, held for the acquire-work-release lifetime and always
// released back to the pool in `finally`, is the same pattern
// migrate.ts already uses for its own migration lock.
async function withConnectionLock<T>(connectionId: string, fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    const acquired = await client.query(
      "SELECT pg_try_advisory_lock($1, hashtext($2)) AS acquired",
      [MIRROR_SYNC_LOCK_NAMESPACE, connectionId],
    );
    if (!acquired.rows[0].acquired) throw new MirrorSyncInProgressError(connectionId);
    try {
      return await fn();
    } finally {
      await client.query("SELECT pg_advisory_unlock($1, hashtext($2))", [MIRROR_SYNC_LOCK_NAMESPACE, connectionId]);
    }
  } finally {
    client.release();
  }
}

export class MirrorNotReadyError extends Error {
  constructor(public reason: "no_active_connection" | "no_valid_token") {
    super(reason);
    this.name = "MirrorNotReadyError";
  }
}

export interface MirrorSyncResult {
  created: number;
  updated: number;
  removed: number;
  skipped: number;
}

// Idempotent: calling this twice in a row with no SHF change produces
// `updated` (an update-in-place PUT/PATCH against the same stable
// providerEventId) rather than a second duplicate event, satisfying phase
// brief §21's exact "sync #1 creates, sync #2 updates/no-op, never
// creates a second" requirement — the stable id used as the update key is
// always the previous sync's own recorded providerEventId, never a fresh
// lookup by title/date.
export async function syncMirrorForActor(
  actor: CalendarActor,
  provider: ExternalAccountProvider,
  providerOverride?: ExternalCalendarProvider,
): Promise<MirrorSyncResult> {
  const connection = await getConnectionForActor(actor, provider);
  if (!connection || connection.status !== "ACTIVE") throw new MirrorNotReadyError("no_active_connection");

  const tokenResult = await getValidAccessTokenForActor(actor, provider, providerOverride);
  if (!tokenResult) throw new MirrorNotReadyError("no_valid_token");

  // Everything from here on mutates provider-side and local mirror state
  // for this one connection — locked so a concurrent on-demand request
  // and/or background dispatcher pass can never race event creation for
  // the same connection (phase brief §13).
  return withConnectionLock(tokenResult.connectionId, () => performMirrorSync(actor, provider, tokenResult, providerOverride));
}

async function performMirrorSync(
  actor: CalendarActor,
  provider: ExternalAccountProvider,
  tokenResult: { connectionId: string; accessToken: string },
  providerOverride?: ExternalCalendarProvider,
): Promise<MirrorSyncResult> {
  const from = new Date();
  const to = new Date(from.getTime() + MIRROR_WINDOW_DAYS * 86_400_000);
  const projection = await getCalendarProjectionForActor(actor, { from, to });

  const adapter = providerOverride || getExternalCalendarProvider(provider);
  const existingLinks = await linkRepo.listForConnection(tokenResult.connectionId);
  const linkByProjectionId = new Map(existingLinks.map((link) => [link.shfProjectionId, link]));

  let created = 0;
  let updated = 0;
  let removed = 0;
  let skipped = 0;

  const currentProjectionIds = new Set<string>();
  for (const item of projection.items) {
    currentProjectionIds.add(item.id);
    const existingLink = linkByProjectionId.get(item.id);
    // User-level suppression (phase brief §25): the learner deleted this
    // mirror on the provider side and this app chose not to recreate it —
    // presentation state only, never touched again until the user
    // reconnects/un-suppresses.
    if (existingLink?.suppressedAt) {
      skipped++;
      continue;
    }
    try {
      const result = await adapter.upsertMirroredEvent(tokenResult.accessToken, {
        providerEventId: existingLink?.providerEventId || null,
        title: item.title,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        allDay: item.allDay,
        shfProjectionId: item.id,
      });
      await linkRepo.upsert(
        existingLink?.id || `evtlink_${randomBytes(16).toString("hex")}`,
        tokenResult.connectionId,
        item.id,
        result.providerEventId,
        "primary",
      );
      if (existingLink) updated++; else created++;
    } catch {
      // One event's provider-side failure never aborts the whole sync
      // pass (phase brief §33's isolation principle applied at event
      // granularity, not just provider granularity).
      skipped++;
    }
  }

  // Source removal (phase brief §23): a previously-mirrored SHF event
  // that has fallen out of the current entitled/windowed projection gets
  // its provider mirror removed too — and only that one; every other
  // provider event (including ones this app never created) is untouched,
  // since only rows in THIS connection's own link table are ever
  // considered.
  for (const link of existingLinks) {
    if (currentProjectionIds.has(link.shfProjectionId)) continue;
    if (!link.suppressedAt) {
      try {
        await adapter.deleteMirroredEvent(tokenResult.accessToken, link.providerEventId);
      } catch {
        // Best-effort — still drop our own mapping row below so a future
        // sync does not retry forever against a mirror that may already
        // be gone provider-side.
      }
      removed++;
    }
    await linkRepo.delete(tokenResult.connectionId, link.shfProjectionId);
  }

  return { created, updated, removed, skipped };
}

// Marks a provider-side deletion as a user preference (phase brief §25):
// called by a future webhook/manual-report path, not by the sync loop
// itself. Kept minimal this phase — no webhook receiver exists yet (out
// of scope; see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md Phase 13
// boundary), but the suppression column and this setter are real and
// tested so a later phase can wire a real trigger to it without a schema
// change.
export async function suppressMirrorForActor(connectionId: string, shfProjectionId: string): Promise<void> {
  await linkRepo.suppress(connectionId, shfProjectionId);
}
