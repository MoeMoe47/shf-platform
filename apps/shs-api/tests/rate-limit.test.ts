import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionRateLimitConfigured, classifyRateLimitRoute, consumeRateLimit, rateLimitConfig, rateLimitIdentity } from "../src/security/rate-limit.ts";
import { readFileSync } from "node:fs";

test("route classes preserve public reads and exempt health checks", () => {
  assert.deepEqual(classifyRateLimitRoute("GET", "/public/impact/curriculum-lesson-completions"), { routeClass: "PUBLIC_READ", limiterClass: "PUBLIC_READ_LIMIT" });
  assert.deepEqual(classifyRateLimitRoute("POST", "/auth/login"), { routeClass: "AUTHENTICATION", limiterClass: "AUTH_LOGIN_LIMIT" });
  assert.deepEqual(classifyRateLimitRoute("POST", "/reporting/publication-authorizations"), { routeClass: "GOVERNANCE_MUTATION", limiterClass: "GOVERNANCE_MUTATION_LIMIT" });
  assert.deepEqual(classifyRateLimitRoute("GET", "/health/ready"), { routeClass: "HEALTH_READINESS" });
});

test("development limiter is bounded and actor identity is server-derived", async () => {
  const previous = process.env.SHS_AUTH_ENV;
  process.env.SHS_AUTH_ENV = "test";
  try {
    const config = rateLimitConfig({ SHS_AUTH_ENV: "test", NODE_ENV: "test" });
    const first = await consumeRateLimit("GOVERNANCE_MUTATION_LIMIT", "actor:a|tenant:t|org:o", { ...config, GOVERNANCE_MUTATION_LIMIT: { max: 1, windowSeconds: 60 } });
    const second = await consumeRateLimit("GOVERNANCE_MUTATION_LIMIT", "actor:a|tenant:t|org:o", { ...config, GOVERNANCE_MUTATION_LIMIT: { max: 1, windowSeconds: 60 } });
    assert.equal(first.allowed, true);
    assert.equal(second.allowed, false);
    assert.equal(rateLimitIdentity({ user: { id: "server-user", tenant_id: "tenant-a", organization_id: "org-a" }, ip: "127.0.0.1" }, { routeClass: "GOVERNANCE_MUTATION", limiterClass: "GOVERNANCE_MUTATION_LIMIT" }), "actor:server-user|tenant:tenant-a|org:org-a");
  } finally {
    if (previous === undefined) delete process.env.SHS_AUTH_ENV; else process.env.SHS_AUTH_ENV = previous;
  }
});

test("production requires explicit policy values and database state", () => {
  assert.throws(() => assertProductionRateLimitConfigured({ SHS_AUTH_ENV: "production" }), /SHS_RATE_LIMIT_PUBLIC_READ_MAX/);
});

test("shared limiter schema is operational and concurrency-oriented", () => {
  const sql = readFileSync(new URL("../migrations/030_rate_limit_windows.sql", import.meta.url), "utf8");
  assert.match(sql, /PRIMARY KEY \(limiter_key, window_started_at\)/);
  assert.match(sql, /rate_limit_windows_expiry_idx/);
  const source = readFileSync(new URL("../src/security/rate-limit.ts", import.meta.url), "utf8");
  assert.match(source, /ON CONFLICT \(limiter_key, window_started_at\)/);
  assert.match(source, /rate_limit_backend_unavailable/);
});
