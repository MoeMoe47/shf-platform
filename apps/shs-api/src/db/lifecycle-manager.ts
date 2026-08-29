import { emitOperationalTelemetry } from "../observability/operational-telemetry.js";

export type LifecycleExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount?: number }>;
};

export type RetentionPolicy = {
  rateLimitWindowSeconds?: number;
  deliveredOutboxSeconds?: number;
  expiredSessionSeconds?: number;
  revokedSessionSeconds?: number;
  batchSize: number;
};

export type LifecycleTarget = "RATE_LIMIT_WINDOWS" | "EXPIRED_SESSIONS" | "REVOKED_SESSIONS" | "DELIVERED_OUTBOX";

export type LifecycleObservation = {
  target: LifecycleTarget;
  retentionClass: "BOUNDED_OPERATIONAL_STATE" | "SHORT_LIVED_SECURITY_STATE";
  eligibleCount: number;
  oldestEligibleAt: string | null;
  cleanupEnabled: boolean;
  reason?: string;
};

export type LifecycleCleanupResult = LifecycleObservation & { removedCount: number };

const DEFAULT_BATCH_SIZE = 100;
const TARGETS: LifecycleTarget[] = ["RATE_LIMIT_WINDOWS", "EXPIRED_SESSIONS", "REVOKED_SESSIONS", "DELIVERED_OUTBOX"];

function positiveInteger(value: string | undefined) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error("retention_configuration_invalid");
  return parsed;
}

export function retentionPolicy(env: NodeJS.ProcessEnv = process.env): RetentionPolicy {
  const batchSize = positiveInteger(env.SHS_RETENTION_CLEANUP_BATCH_SIZE) ?? DEFAULT_BATCH_SIZE;
  return {
    rateLimitWindowSeconds: positiveInteger(env.SHS_RETENTION_RATE_LIMIT_WINDOW_SECONDS),
    deliveredOutboxSeconds: positiveInteger(env.SHS_RETENTION_DELIVERED_OUTBOX_SECONDS),
    expiredSessionSeconds: positiveInteger(env.SHS_RETENTION_EXPIRED_SESSION_SECONDS),
    revokedSessionSeconds: positiveInteger(env.SHS_RETENTION_REVOKED_SESSION_SECONDS),
    batchSize,
  };
}

function configured(policy: RetentionPolicy, target: LifecycleTarget) {
  if (target === "RATE_LIMIT_WINDOWS") return policy.rateLimitWindowSeconds;
  if (target === "DELIVERED_OUTBOX") return policy.deliveredOutboxSeconds;
  if (target === "EXPIRED_SESSIONS") return policy.expiredSessionSeconds;
  return policy.revokedSessionSeconds;
}

function targetDefinition(target: LifecycleTarget, policy: RetentionPolicy) {
  const seconds = configured(policy, target);
  if (!seconds) return { seconds: undefined, class: target === "RATE_LIMIT_WINDOWS" || target === "DELIVERED_OUTBOX" ? "BOUNDED_OPERATIONAL_STATE" as const : "SHORT_LIVED_SECURITY_STATE" as const };
  if (target === "RATE_LIMIT_WINDOWS") return { seconds, class: "BOUNDED_OPERATIONAL_STATE" as const, where: "expires_at <= NOW() AND expires_at <= NOW() - ($1 * INTERVAL '1 second')", order: "expires_at ASC" };
  if (target === "DELIVERED_OUTBOX") return { seconds, class: "BOUNDED_OPERATIONAL_STATE" as const, where: "delivery_status = 'DELIVERED' AND delivered_at IS NOT NULL AND lease_owner IS NULL AND lease_expires_at IS NULL AND delivered_at <= NOW() - ($1 * INTERVAL '1 second')", order: "delivered_at ASC" };
  if (target === "EXPIRED_SESSIONS") return { seconds, class: "SHORT_LIVED_SECURITY_STATE" as const, where: "revoked_at IS NULL AND expires_at <= NOW() - ($1 * INTERVAL '1 second')", order: "expires_at ASC" };
  return { seconds, class: "SHORT_LIVED_SECURITY_STATE" as const, where: "revoked_at IS NOT NULL AND revoked_at <= NOW() - ($1 * INTERVAL '1 second')", order: "revoked_at ASC" };
}

function tableFor(target: LifecycleTarget) {
  if (target === "RATE_LIMIT_WINDOWS") return "rate_limit_windows";
  if (target === "DELIVERED_OUTBOX") return "integration_outbox";
  return "shs_identity_sessions";
}

async function observeTarget(executor: LifecycleExecutor, target: LifecycleTarget, policy: RetentionPolicy): Promise<LifecycleObservation> {
  const definition = targetDefinition(target, policy);
  if (!definition.seconds) {
    return { target, retentionClass: definition.class, eligibleCount: 0, oldestEligibleAt: null, cleanupEnabled: false, reason: "production_policy_value_required_no_delete" };
  }
  const result = await executor.query(
    `SELECT COUNT(*)::int AS eligible_count, MIN(${target === "RATE_LIMIT_WINDOWS" ? "expires_at" : target === "DELIVERED_OUTBOX" ? "delivered_at" : target === "EXPIRED_SESSIONS" ? "expires_at" : "revoked_at"}) AS oldest_eligible_at FROM ${tableFor(target)} WHERE ${definition.where}`,
    [definition.seconds],
  );
  return { target, retentionClass: definition.class, eligibleCount: Number(result.rows[0]?.eligible_count || 0), oldestEligibleAt: result.rows[0]?.oldest_eligible_at?.toISOString?.() || result.rows[0]?.oldest_eligible_at || null, cleanupEnabled: true };
}

export async function lifecycleStatus(executor: LifecycleExecutor, policy = retentionPolicy()): Promise<LifecycleObservation[]> {
  return Promise.all(TARGETS.map((target) => observeTarget(executor, target, policy)));
}

export const lifecyclePlan = lifecycleStatus;

async function cleanupTarget(executor: LifecycleExecutor, target: LifecycleTarget, policy: RetentionPolicy): Promise<LifecycleCleanupResult> {
  const observation = await observeTarget(executor, target, policy);
  if (!observation.cleanupEnabled || observation.eligibleCount === 0) return { ...observation, removedCount: 0 };
  const definition = targetDefinition(target, policy);
  const table = tableFor(target);
  await executor.query("BEGIN");
  try {
    let result;
    if (target === "RATE_LIMIT_WINDOWS") {
      result = await executor.query(
        `WITH candidates AS (SELECT limiter_key, window_started_at FROM ${table} WHERE ${definition.where} ORDER BY ${definition.order} FOR UPDATE SKIP LOCKED LIMIT $2) DELETE FROM ${table} r USING candidates c WHERE r.limiter_key = c.limiter_key AND r.window_started_at = c.window_started_at`,
        [definition.seconds, policy.batchSize],
      );
    } else {
      const idColumn = target === "DELIVERED_OUTBOX" ? "outbox_event_id" : "session_id";
      result = await executor.query(
        `WITH candidates AS (SELECT ${idColumn} FROM ${table} WHERE ${definition.where} ORDER BY ${definition.order} FOR UPDATE SKIP LOCKED LIMIT $2) DELETE FROM ${table} r USING candidates c WHERE r.${idColumn} = c.${idColumn}`,
        [definition.seconds, policy.batchSize],
      );
    }
    await executor.query("COMMIT");
    const removedCount = Number(result.rowCount || 0);
    emitOperationalTelemetry({ event_name: "lifecycle_cleanup", severity: "INFO", component: "shs_api", category: "DATABASE", outcome: "SUCCESS", metadata: { component: "lifecycle", reason: target, count: removedCount } });
    return { ...observation, removedCount };
  } catch (error) {
    await executor.query("ROLLBACK");
    emitOperationalTelemetry({ event_name: "lifecycle_cleanup_failure", severity: "ERROR", component: "shs_api", category: "DATABASE", outcome: "SYSTEM_FAILURE", metadata: { component: "lifecycle", reason: target } });
    throw error;
  }
}

export async function lifecycleCleanup(executor: LifecycleExecutor, policy = retentionPolicy()): Promise<LifecycleCleanupResult[]> {
  return TARGETS.reduce(async (resultsPromise, target) => [...await resultsPromise, await cleanupTarget(executor, target, policy)], Promise.resolve([] as LifecycleCleanupResult[]));
}

export function forbiddenLifecycleTargets(targets: string[]) {
  return targets.filter((target) => !TARGETS.includes(target as LifecycleTarget));
}
