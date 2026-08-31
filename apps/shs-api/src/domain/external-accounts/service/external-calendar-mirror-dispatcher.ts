// SHF Ecosystem Phase 13 — bounded background mirror-sync dispatcher.
//
// Mirrors the shape of trusted-reporting/dispatcher.ts exactly (bounded
// batch, per-item try/catch isolation, structured JSON logging,
// operational telemetry) rather than inventing a new queue/job system —
// phase brief §10's own "prefer reuse" instruction. One bounded pass
// processes the batchSize oldest-synced ACTIVE connections; deployment
// invokes this on its own schedule (see external-calendar-mirror-worker.ts
// and docs/SHF_CALENDAR_PRODUCTION_RUNBOOK.md), the same "the repository's
// managed scheduler or job runner" contract trusted-reporting/worker.ts
// already documents.
import { ExternalAccountConnectionRepo } from "../repo/external-account-connection-repo.js";
import { IdentityRepo } from "../../identity/repo/identity-repo.js";
import { mergeRolePermissions } from "../../../auth/security-permissions.js";
import { tenantIdForOrganization } from "../../../auth/tenant-context.js";
import { syncMirrorForActor, MirrorSyncInProgressError, MirrorNotReadyError } from "./external-calendar-mirror-service.js";
import { cleanupExpiredAuthorizationStates } from "./oauth-state-service.js";
import type { ExternalAccountProvider } from "../model/external-account-connection.js";
import type { CalendarActor } from "../../calendar/service/calendar-adapters.js";

const connectionRepo = new ExternalAccountConnectionRepo();
const identityRepo = new IdentityRepo();

export interface MirrorDispatcherConfig {
  batchSize: number;
}

export function mirrorDispatcherConfig(env: NodeJS.ProcessEnv = process.env): MirrorDispatcherConfig {
  const batchSize = Number(env.SHF_EXTERNAL_CALENDAR_SYNC_BATCH_SIZE || 20);
  if (!Number.isFinite(batchSize) || batchSize <= 0) throw new Error("external_calendar_sync_batch_size_invalid");
  return { batchSize };
}

function operationalLog(event: string, fields: Record<string, unknown>) {
  console.info(JSON.stringify({ component: "external_calendar_mirror_dispatcher", event, ...fields }));
}

async function resolveCalendarActor(organizationId: string, userId: string): Promise<CalendarActor | null> {
  const user = await identityRepo.getUserById(userId);
  if (!user) return null;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const permissions = Array.isArray((user as any).permissions) && (user as any).permissions.length
    ? (user as any).permissions
    : mergeRolePermissions(roles);
  return {
    user_id: userId,
    organization_id: organizationId,
    active_organization_id: organizationId,
    tenant_id: tenantIdForOrganization(organizationId),
    roles,
    permissions,
  };
}

export interface MirrorDispatchSummary {
  attempted: number;
  succeeded: number;
  skippedInProgress: number;
  failed: number;
}

// One bounded pass: cleans up expired OAuth states (cheap, colocated
// maintenance — see oauth-state-service.ts — rather than a second cron
// entry for one small table), then syncs the batchSize oldest-synced
// ACTIVE connections. Every connection's failure is isolated (phase
// brief §15: "not block other users/providers") — one connection's
// provider outage, timeout, or lock contention never aborts the batch.
export async function runMirrorSyncDispatch(config: Partial<MirrorDispatcherConfig> = {}): Promise<MirrorDispatchSummary> {
  const { batchSize } = { ...mirrorDispatcherConfig(), ...config };

  const expiredStatesRemoved = await cleanupExpiredAuthorizationStates();
  operationalLog("oauth_states_cleaned", { count: expiredStatesRemoved });

  const connections = await connectionRepo.listActiveConnectionsForSync(batchSize);
  operationalLog("batch_claimed", { count: connections.length });

  let succeeded = 0;
  let skippedInProgress = 0;
  let failed = 0;

  for (const connection of connections) {
    try {
      const actor = await resolveCalendarActor(connection.organizationId, connection.userId);
      if (!actor) {
        failed++;
        operationalLog("actor_unresolvable", { connection_id: connection.id, provider: connection.provider });
        continue;
      }
      await syncMirrorForActor(actor, connection.provider as ExternalAccountProvider);
      succeeded++;
      operationalLog("sync_succeeded", { connection_id: connection.id, provider: connection.provider });
    } catch (error) {
      if (error instanceof MirrorSyncInProgressError) {
        skippedInProgress++;
        operationalLog("sync_skipped_in_progress", { connection_id: connection.id, provider: connection.provider });
        continue;
      }
      failed++;
      const reason = error instanceof MirrorNotReadyError ? error.reason : "sync_failed";
      // Never logs a token, a title, or any provider-supplied string —
      // only the connection id, provider, and a bounded reason code
      // (phase brief §55/§59).
      operationalLog("sync_failed", { connection_id: connection.id, provider: connection.provider, reason });
    }
  }

  return { attempted: connections.length, succeeded, skippedInProgress, failed };
}
