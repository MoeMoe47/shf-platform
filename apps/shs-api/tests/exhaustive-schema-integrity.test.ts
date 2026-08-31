import test from "node:test";
import assert from "node:assert/strict";
import { checkExhaustiveSchemaIntegrity } from "../src/db/exhaustive-schema-integrity.ts";
import type { MigrationExpectation } from "../src/db/migration-expectation-parser.ts";

function fakeExecutor(overrides: { ledger?: any[]; tables?: any[]; columns?: any[]; indexes?: any[]; constraints?: any[]; extensions?: any[] } = {}) {
  return {
    async query(sql: string) {
      if (sql.includes("FROM schema_migrations")) return { rows: overrides.ledger ?? [] };
      if (sql.includes("information_schema.tables")) return { rows: overrides.tables ?? [] };
      if (sql.includes("information_schema.columns")) return { rows: overrides.columns ?? [] };
      if (sql.includes("pg_indexes")) return { rows: overrides.indexes ?? [] };
      if (sql.includes("pg_constraint")) return { rows: overrides.constraints ?? [] };
      if (sql.includes("pg_extension")) return { rows: overrides.extensions ?? [] };
      return { rows: [] };
    },
  };
}

const widgetTableExp: MigrationExpectation[] = [
  { migrationId: "100", objectType: "table", table: "widgets", name: "widgets" },
  { migrationId: "100", objectType: "column", table: "widgets", name: "widget_id" },
  { migrationId: "100", objectType: "primary_key", table: "widgets", name: "widgets_pkey" },
];

test("only enforces expectations for migrations actually recorded applied", async () => {
  const executor = fakeExecutor({ ledger: [] }); // migration 100 is NOT applied
  const result = await checkExhaustiveSchemaIntegrity(executor as any, widgetTableExp);
  assert.equal(result.ok, true);
  assert.equal(result.checkedMigrations, 0);
  assert.equal(result.checkedObjects, 0);
});

test("detects a missing table for an applied migration and identifies it", async () => {
  const executor = fakeExecutor({
    ledger: [{ migration_id: "100", runner_version: "1", execution_duration_ms: 42 }],
    tables: [], // widgets table absent
  });
  const result = await checkExhaustiveSchemaIntegrity(executor as any, widgetTableExp);
  assert.equal(result.ok, false);
  assert.equal(result.checkedMigrations, 1);
  const tableFailure = result.failures.find((f) => f.objectType === "table" && f.table === "widgets");
  assert.ok(tableFailure);
  assert.deepEqual(tableFailure!.contributingMigrations, [{ migrationId: "100", appliedViaBaseline: false }]);
});

test("passes when all expected objects are physically present", async () => {
  const executor = fakeExecutor({
    ledger: [{ migration_id: "100", runner_version: "1", execution_duration_ms: 42 }],
    tables: [{ table_name: "widgets" }],
    columns: [{ table_name: "widgets", column_name: "widget_id" }],
    constraints: [{ table_name: "widgets", conname: "widgets_pkey" }],
  });
  const result = await checkExhaustiveSchemaIntegrity(executor as any, widgetTableExp);
  assert.equal(result.ok, true);
  assert.equal(result.failures.length, 0);
});

test("flags a baseline-applied migration for diagnostics without treating baseline metadata alone as a failure", async () => {
  const executor = fakeExecutor({
    ledger: [{ migration_id: "100", runner_version: "baseline-1", execution_duration_ms: 0 }],
    tables: [{ table_name: "widgets" }],
    columns: [{ table_name: "widgets", column_name: "widget_id" }],
    constraints: [{ table_name: "widgets", conname: "widgets_pkey" }],
  });
  const result = await checkExhaustiveSchemaIntegrity(executor as any, widgetTableExp);
  assert.equal(result.ok, true, "physical objects present — baseline metadata alone must not fail the check");
  assert.deepEqual(result.baselineAppliedMigrations, ["100"]);
});

test("groups a failure once with all contributing migrations when an original and a reconciliation migration both expect the same missing object", async () => {
  const expectations: MigrationExpectation[] = [
    { migrationId: "033", objectType: "table", table: "careers", name: "careers" },
    { migrationId: "047", objectType: "table", table: "careers", name: "careers" },
  ];
  const executor = fakeExecutor({
    ledger: [
      { migration_id: "033", runner_version: "baseline-1", execution_duration_ms: 0 },
      { migration_id: "047", runner_version: "1", execution_duration_ms: 10 },
    ],
    tables: [], // careers absent despite both migrations claiming to create it
  });
  const result = await checkExhaustiveSchemaIntegrity(executor as any, expectations);
  assert.equal(result.ok, false);
  assert.equal(result.failures.length, 1, "one physical object must produce exactly one grouped failure, not one per contributing migration");
  const ids = result.failures[0].contributingMigrations.map((m) => m.migrationId).sort();
  assert.deepEqual(ids, ["033", "047"]);
});

test("checks column/index/constraint/extension object types independently", async () => {
  const expectations: MigrationExpectation[] = [
    { migrationId: "100", objectType: "column", table: "widgets", name: "missing_col" },
    { migrationId: "100", objectType: "index", table: "widgets", name: "missing_idx" },
    { migrationId: "100", objectType: "constraint", table: "widgets", name: "missing_check" },
    { migrationId: "100", objectType: "extension", table: "", name: "missing_ext" },
  ];
  const executor = fakeExecutor({
    ledger: [{ migration_id: "100", runner_version: "1", execution_duration_ms: 5 }],
  });
  const result = await checkExhaustiveSchemaIntegrity(executor as any, expectations);
  assert.equal(result.failures.length, 4);
  const types = result.failures.map((f) => f.objectType).sort();
  assert.deepEqual(types, ["column", "constraint", "extension", "index"]);
});
