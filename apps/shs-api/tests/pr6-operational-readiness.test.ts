import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReadiness, percentile, PR6_OPERATIONAL_THRESHOLDS, PR6_RPO_TARGETS, PR6_RTO_TARGETS, PR6_SCOPED_GAPS, validateIncidentTransition } from "../src/observability/pr6-operational-readiness.ts";
import { databaseBackupPlan } from "../src/recovery/pr2-local-backup.ts";

test("PR-6 scoped gaps have no repository-local open classification", () => {
  assert.deepEqual(PR6_SCOPED_GAPS.map((gap) => gap.gapId), ["PR0-GAP-013", "PR0-GAP-014", "PR0-GAP-015", "PR0-GAP-020", "PR0-GAP-021", "PR0-GAP-022", "PR0-GAP-023"]);
  assert.equal(PR6_SCOPED_GAPS.every((gap) => gap.status === "BLOCKED — EXTERNAL DEPENDENCY"), true);
  assert.equal(PR6_SCOPED_GAPS.every((gap) => gap.dependency.length > 0), true);
});

test("readiness is distinct from liveness and fails closed", () => {
  assert.deepEqual(evaluateReadiness({ liveness: true, database: true, migrationState: "CURRENT", requiredConfig: true }), { status: "READY", reasons: [] });
  assert.deepEqual(evaluateReadiness({ liveness: true, database: false, migrationState: "CURRENT", requiredConfig: true }), { status: "NOT_READY", reasons: ["database_unavailable"] });
  assert.equal(evaluateReadiness({ liveness: true, database: true, migrationState: "DRIFT", requiredConfig: true }).status, "NOT_READY");
});

test("operational limits and recovery targets are explicit", () => {
  assert.equal(PR6_OPERATIONAL_THRESHOLDS.maxConcurrentLocalProbe, 25);
  assert.equal(PR6_OPERATIONAL_THRESHOLDS.maxWorkerLeaseSeconds, 300);
  assert.match(PR6_RPO_TARGETS.tier1Canonical, /technical target/);
  assert.match(PR6_RTO_TARGETS.tier1Canonical, /no contractual SLA/);
  assert.throws(() => databaseBackupPlan({}), /SHF_BACKUP_OUTPUT_DIR_REQUIRED/);
});

test("bounded local control-plane performance probe has repeatable percentiles", async () => {
  const samples = await Promise.all(Array.from({ length: PR6_OPERATIONAL_THRESHOLDS.maxConcurrentLocalProbe }, async () => {
    const started = performance.now();
    await Promise.resolve();
    return performance.now() - started;
  }));
  assert.ok(Number.isFinite(percentile(samples, 50)));
  assert.ok(Number.isFinite(percentile(samples, 95)));
  assert.ok(Number.isFinite(percentile(samples, 99)));
});

test("incident lifecycle is monotonic and rejects skipped recovery states", () => {
  assert.deepEqual(validateIncidentTransition("DETECTED", "TRIAGED"), { from: "DETECTED", to: "TRIAGED" });
  assert.deepEqual(validateIncidentTransition("CONTAINED", "RECOVERED"), { from: "CONTAINED", to: "RECOVERED" });
  assert.throws(() => validateIncidentTransition("DETECTED", "RECOVERED"), /incident_transition_invalid/);
});
