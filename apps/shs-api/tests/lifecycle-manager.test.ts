import assert from "node:assert/strict";
import test from "node:test";
import { forbiddenLifecycleTargets, lifecycleCleanup, lifecyclePlan, retentionPolicy } from "../src/db/lifecycle-manager.ts";

function fakeExecutor(rows: any[] = []) {
  const calls: string[] = [];
  return { calls, query: async (sql: string) => { calls.push(sql); return { rows, rowCount: 0 }; } };
}

test("retention policy has no automatic deletion when policy values are absent", async () => {
  const executor = fakeExecutor();
  const result = await lifecyclePlan(executor, retentionPolicy({ NODE_ENV: "production" }));
  assert.equal(result.every((item) => !item.cleanupEnabled), true);
  assert.equal(result[0].reason, "production_policy_value_required_no_delete");
});

test("lifecycle targets are an allowlist and immutable stores are not accepted", () => {
  assert.deepEqual(forbiddenLifecycleTargets(["TRUTH_HISTORY", "rate_limit_windows"]), ["TRUTH_HISTORY", "rate_limit_windows"]);
  assert.deepEqual(forbiddenLifecycleTargets(["RATE_LIMIT_WINDOWS", "EXPIRED_SESSIONS"]), []);
});

test("cleanup is bounded, transactional, and uses only approved tables", async () => {
  const executor = fakeExecutor([{ eligible_count: 1, oldest_eligible_at: new Date("2020-01-01T00:00:00.000Z") }]);
  const results = await lifecycleCleanup(executor, {
    rateLimitWindowSeconds: 60,
    deliveredOutboxSeconds: 60,
    expiredSessionSeconds: 60,
    revokedSessionSeconds: 60,
    batchSize: 7,
  });
  assert.equal(results.length, 4);
  assert.equal(executor.calls.filter((sql) => sql === "BEGIN").length, 4);
  assert.ok(executor.calls.some((sql) => sql.includes("rate_limit_windows") && sql.includes("LIMIT $2")));
  assert.ok(executor.calls.some((sql) => sql.includes("integration_outbox") && sql.includes("delivery_status = 'DELIVERED'")));
  assert.ok(executor.calls.some((sql) => sql.includes("lease_owner IS NULL") && sql.includes("lease_expires_at IS NULL")));
  assert.ok(executor.calls.every((sql) => !/truth|evidence|audit|snapshot|publication/i.test(sql)));
});

test("dry-run only observes and never mutates", async () => {
  const executor = fakeExecutor([{ eligible_count: 0, oldest_eligible_at: null }]);
  await lifecyclePlan(executor, { rateLimitWindowSeconds: 60, deliveredOutboxSeconds: 60, expiredSessionSeconds: 60, revokedSessionSeconds: 60, batchSize: 10 });
  assert.equal(executor.calls.some((sql) => /BEGIN|DELETE|UPDATE|INSERT/i.test(sql)), false);
});
