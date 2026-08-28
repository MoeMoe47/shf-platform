import { query } from "../db/client";
import { emitOperationalTelemetry } from "../observability/operational-telemetry";

export type RateLimitClass = "PUBLIC_READ_LIMIT" | "AUTH_LOGIN_LIMIT" | "AUTHENTICATED_USER_LIMIT" | "GOVERNANCE_MUTATION_LIMIT" | "EXPENSIVE_OPERATION_LIMIT" | "INTERNAL_INGESTION_LIMIT";
export type RateLimitDecision = { allowed: boolean; retryAfterSeconds: number; backend: "postgres" | "memory" };

type LimitConfig = { max: number; windowSeconds: number };
const ENV_BY_CLASS: Record<RateLimitClass, string> = {
  PUBLIC_READ_LIMIT: "PUBLIC_READ",
  AUTH_LOGIN_LIMIT: "AUTH_LOGIN",
  AUTHENTICATED_USER_LIMIT: "AUTHENTICATED_USER",
  GOVERNANCE_MUTATION_LIMIT: "GOVERNANCE_MUTATION",
  EXPENSIVE_OPERATION_LIMIT: "EXPENSIVE_OPERATION",
  INTERNAL_INGESTION_LIMIT: "INTERNAL_INGESTION",
};

export function rateLimitConfig(env: NodeJS.ProcessEnv = process.env): Record<RateLimitClass, LimitConfig> {
  const config = {} as Record<RateLimitClass, LimitConfig>;
  for (const limiterClass of Object.keys(ENV_BY_CLASS) as RateLimitClass[]) {
    const prefix = `SHS_RATE_LIMIT_${ENV_BY_CLASS[limiterClass]}`;
    const max = Number(env[`${prefix}_MAX`] || (String(env.SHS_AUTH_ENV || env.NODE_ENV).toLowerCase() === "production" ? NaN : 60));
    const windowSeconds = Number(env[`${prefix}_WINDOW_SECONDS`] || 60);
    if (!Number.isInteger(max) || max <= 0 || !Number.isInteger(windowSeconds) || windowSeconds <= 0) {
      throw new Error(`${prefix.toLowerCase()}_configuration_invalid`);
    }
    config[limiterClass] = { max, windowSeconds };
  }
  return config;
}

export function assertProductionRateLimitConfigured(env: NodeJS.ProcessEnv = process.env) {
  if (String(env.SHS_AUTH_ENV || env.NODE_ENV || "development").toLowerCase() !== "production") return;
  for (const suffix of Object.values(ENV_BY_CLASS)) {
    for (const name of [`SHS_RATE_LIMIT_${suffix}_MAX`, `SHS_RATE_LIMIT_${suffix}_WINDOW_SECONDS`]) {
      if (!String(env[name] || "").trim()) throw new Error(`${name} is required in production`);
    }
  }
  if (!String(env.DATABASE_URL || "").trim()) throw new Error("DATABASE_URL is required for production rate limiting");
}

export function classifyRateLimitRoute(method: string, path: string): { routeClass: string; limiterClass?: RateLimitClass } | null {
  const normalized = path.split("?")[0];
  if (method === "GET" && normalized.startsWith("/health")) return { routeClass: "HEALTH_READINESS" };
  if (method === "GET" && normalized === "/public/impact/curriculum-lesson-completions") return { routeClass: "PUBLIC_READ", limiterClass: "PUBLIC_READ_LIMIT" };
  if (method === "POST" && (normalized === "/auth/login" || normalized === "/auth/session/exchange")) return { routeClass: "AUTHENTICATION", limiterClass: "AUTH_LOGIN_LIMIT" };
  if (/\/public-(eligibility|disclosure)|\/public-snapshots|\/publication(-authorizations)?/.test(normalized) || /\/truth\/public-population/.test(normalized)) {
    return { routeClass: "GOVERNANCE_MUTATION", limiterClass: "GOVERNANCE_MUTATION_LIMIT" };
  }
  if (method !== "GET" && normalized.startsWith("/reporting/")) return { routeClass: "EXPENSIVE_REPORT_OPERATION", limiterClass: "EXPENSIVE_OPERATION_LIMIT" };
  if (normalized.startsWith("/reporting/")) return { routeClass: "AUTHENTICATED_USER", limiterClass: "AUTHENTICATED_USER_LIMIT" };
  if (method !== "GET" && normalized !== "/auth/logout") return { routeClass: "AUTHENTICATED_USER", limiterClass: "AUTHENTICATED_USER_LIMIT" };
  return null;
}

function memoryStore(): Map<string, { count: number; expiresAt: number }> {
  const globalKey = "__shs_rate_limit_memory_store";
  const root = globalThis as typeof globalThis & { [globalKey]?: Map<string, { count: number; expiresAt: number }> };
  return root[globalKey] || (root[globalKey] = new Map());
}

export async function consumeRateLimit(limiterClass: RateLimitClass, identityKey: string, config = rateLimitConfig()): Promise<RateLimitDecision> {
  const limit = config[limiterClass];
  const production = String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development").toLowerCase() === "production";
  if (!production) {
    const now = Date.now();
    const key = `${limiterClass}:${identityKey}`;
    const current = memoryStore().get(key);
    if (!current || current.expiresAt <= now) {
      memoryStore().set(key, { count: 1, expiresAt: now + limit.windowSeconds * 1000 });
      const decision = { allowed: true, retryAfterSeconds: limit.windowSeconds, backend: "memory" as const };
      emitOperationalTelemetry({ event_name: "rate_limit_decision", severity: "INFO", component: "shs_api", category: "RATE_LIMIT", outcome: "SUCCESS", metadata: { limiter_class: limiterClass, backend: "memory" } });
      return decision;
    }
    current.count += 1;
    const decision = { allowed: current.count <= limit.max, retryAfterSeconds: Math.max(1, Math.ceil((current.expiresAt - now) / 1000)), backend: "memory" as const };
    emitOperationalTelemetry({ event_name: "rate_limit_decision", severity: decision.allowed ? "INFO" : "WARNING", component: "shs_api", category: "RATE_LIMIT", outcome: decision.allowed ? "SUCCESS" : "EXPECTED_DOMAIN_REJECTION", metadata: { limiter_class: limiterClass, backend: "memory" } });
    return decision;
  }
  const result = await query(`
    WITH window_state AS (
      SELECT to_timestamp(floor(extract(epoch FROM NOW()) / $2) * $2) AS started_at
    ), upserted AS (
      INSERT INTO rate_limit_windows (limiter_key, window_started_at, window_seconds, request_count, expires_at)
      SELECT $1, started_at, $2, 1, started_at + ($2 * INTERVAL '1 second') FROM window_state
      ON CONFLICT (limiter_key, window_started_at) DO UPDATE
        SET request_count = rate_limit_windows.request_count + 1,
            updated_at = NOW()
      RETURNING request_count, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (expires_at - NOW())))::int) AS retry_after_seconds
    ) SELECT request_count, retry_after_seconds FROM upserted`,
  [`${limiterClass}:${identityKey}`, limit.windowSeconds]);
  const row = result.rows[0];
  if (!row) throw new Error("rate_limit_backend_unavailable");
  const decision = { allowed: Number(row.request_count) <= limit.max, retryAfterSeconds: Number(row.retry_after_seconds), backend: "postgres" as const };
  emitOperationalTelemetry({ event_name: "rate_limit_decision", severity: decision.allowed ? "INFO" : "WARNING", component: "shs_api", category: "RATE_LIMIT", outcome: decision.allowed ? "SUCCESS" : "EXPECTED_DOMAIN_REJECTION", metadata: { limiter_class: limiterClass, backend: "postgres" } });
  return decision;
}

export function rateLimitIdentity(req: any, route: { routeClass: string; limiterClass: RateLimitClass }): string {
  const user = req.user;
  if (route.limiterClass === "PUBLIC_READ_LIMIT" || route.limiterClass === "AUTH_LOGIN_LIMIT") return `ip:${String(req.ip || req.socket?.remoteAddress || "unknown")}`;
  if (route.limiterClass === "INTERNAL_INGESTION_LIMIT") return `service:${String(req.service?.service_id || req.headers?.["x-shf-service-id"] || "unknown")}`;
  const actor = String(user?.user_id || user?.id || "").trim();
  const tenant = String(user?.tenant_id || "").trim();
  const organization = String(user?.organization_id || "").trim();
  return actor ? `actor:${actor}|tenant:${tenant}|org:${organization}` : `ip:${String(req.ip || req.socket?.remoteAddress || "unknown")}`;
}

export function rateLimitMiddleware() {
  const config = rateLimitConfig();
  return async (req: any, res: any, next: any) => {
    const route = classifyRateLimitRoute(req.method, req.path);
    if (!route?.limiterClass) return next();
    try {
      const limiterClass = route.limiterClass;
      const decision = await consumeRateLimit(limiterClass, rateLimitIdentity(req, { routeClass: route.routeClass, limiterClass }), config);
      if (!decision.allowed) {
        res.setHeader("Retry-After", String(decision.retryAfterSeconds));
        return res.status(429).json({ ok: false, error: "rate_limited", retry_after_seconds: decision.retryAfterSeconds });
      }
      return next();
    } catch (error) {
      emitOperationalTelemetry({ event_name: "rate_limit_backend_failure", severity: "ERROR", component: "shs_api", category: "DATABASE", outcome: "SYSTEM_FAILURE", metadata: { limiter_class: route.limiterClass } });
      if (String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development").toLowerCase() === "production") {
        return res.status(503).json({ ok: false, error: "rate_limit_unavailable" });
      }
      return next(error);
    }
  };
}
