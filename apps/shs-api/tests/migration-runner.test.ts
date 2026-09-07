import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { discoverMigrations, migrationTableSql, MIGRATION_LOCK_KEY, runMigrations, inspectMigrations } from "../src/db/migration-runner.ts";

test("migration discovery is numeric, deterministic, and checksums source content", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "shs-migrations-"));
  await writeFile(path.join(dir, "002_second.sql"), "select 2;");
  await writeFile(path.join(dir, "001_first.sql"), "select 1;");
  const migrations = await discoverMigrations(dir);
  assert.deepEqual(migrations.map((migration) => migration.id), ["001", "002"]);
  assert.match(migrations[0].checksum, /^[0-9a-f]{64}$/);
});

test("all current SHS migrations are discoverable through the canonical chain", async () => {
  const migrationsDir = path.resolve(new URL("../migrations", import.meta.url).pathname);
  const migrations = await discoverMigrations(migrationsDir);
  assert.equal(migrations.length, 109);
  assert.equal(migrations[0].filename, "001_identity_base.sql");
  assert.equal(migrations.at(-1)?.filename, "109_program_completion_authority.sql");
});

test("migration 032 does not require seeded roles before it can apply", async () => {
  const sql = await readFile(new URL("../migrations/032_organization_relationships_program_stewardship.sql", import.meta.url), "utf8");
  assert.match(sql, /WHERE EXISTS \(SELECT 1 FROM roles WHERE roles\.role_id = requested\.role_id\)/);
  assert.match(sql, /'role_org_admin'/);
  assert.doesNotMatch(sql, /INSERT INTO roles/);
});

test("migration 032 protects active relationship duplicates and preserves historical records", async () => {
  const sql = await readFile(new URL("../migrations/032_organization_relationships_program_stewardship.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE EXTENSION IF NOT EXISTS btree_gist/);
  assert.match(sql, /organization_relationship_no_active_overlap/);
  assert.match(sql, /WHERE \(status = 'ACTIVE'\)/);
  assert.match(sql, /JOIN organization_relationships b/);
  assert.match(sql, /tsrange\(a\.effective_from/);
  assert.match(sql, /tsrange\(b\.effective_from/);
  assert.doesNotMatch(sql, /WHERE \(status IN \('ACTIVE', 'ENDED'\)\)/);
});

test("migration 032 keeps existing program rows valid", async () => {
  const sql = await readFile(new URL("../migrations/032_organization_relationships_program_stewardship.sql", import.meta.url), "utf8");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS program_classification TEXT/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS owner_organization_id TEXT REFERENCES organizations/);
  assert.match(sql, /program_classification IS NULL OR program_classification IN/);
});

test("malformed and duplicate migration identities fail closed", async () => {
  const malformed = await mkdtemp(path.join(os.tmpdir(), "shs-migrations-"));
  await writeFile(path.join(malformed, "bad.sql"), "select 1;");
  await assert.rejects(discoverMigrations(malformed), /malformed/);

  const duplicate = await mkdtemp(path.join(os.tmpdir(), "shs-migrations-"));
  await writeFile(path.join(duplicate, "001_first.sql"), "select 1;");
  await writeFile(path.join(duplicate, "001_second.sql"), "select 2;");
  await assert.rejects(discoverMigrations(duplicate), /duplicate/);
});

test("migration runner locks, commits each migration, and records checksums", async () => {
  const calls: Array<{ sql: string; params?: unknown[] }> = [];
  const applied = new Map<string, any>();
  const executor = {
    async query(sql: string, params: unknown[] = []) {
      calls.push({ sql, params });
      if (sql.includes("pg_try_advisory_lock")) return { rows: [{ acquired: true }] };
      if (sql.includes("to_regclass")) return { rows: [{ table_name: "schema_migrations" }] };
      if (sql.includes("SELECT migration_id")) return { rows: [...applied.values()] };
      if (sql.startsWith("INSERT INTO schema_migrations")) {
        applied.set(String(params[0]), { migration_id: params[0], filename: params[1], checksum: params[2] });
      }
      return { rows: [] };
    },
  };
  const migrations = [
    { id: "001", filename: "001_first.sql", sql: "select 1;", checksum: "a".repeat(64) },
    { id: "002", filename: "002_second.sql", sql: "select 2;", checksum: "b".repeat(64) },
  ];
  const status = await runMigrations(executor, migrations);
  assert.equal(status.pending.length, 0);
  assert.equal(applied.size, 2);
  assert.ok(calls.some((call) => call.params?.[0] === MIGRATION_LOCK_KEY));
  assert.equal(calls.filter((call) => call.sql === "BEGIN").length, 2);
  assert.equal(calls.filter((call) => call.sql === "COMMIT").length, 2);
});

test("status inspection rejects unknown applied migrations and detects drift", async () => {
  const executor = {
    async query(sql: string) {
      if (sql.includes("to_regclass")) return { rows: [{ table_name: "schema_migrations" }] };
      if (sql.includes("SELECT migration_id")) return { rows: [{ migration_id: "999", filename: "999_unknown.sql", checksum: "x" }] };
      return { rows: [] };
    },
  };
  const status = await inspectMigrations(executor, [{ id: "001", filename: "001_first.sql", sql: "", checksum: "a".repeat(64) }]);
  assert.equal(status.unknownApplied.length, 1);
  assert.equal(migrationTableSql().includes("checksum"), true);
});

test("a failed migration rolls back and prevents later migrations", async () => {
  const calls: string[] = [];
  const executor = {
    async query(sql: string) {
      calls.push(sql);
      if (sql.includes("pg_try_advisory_lock")) return { rows: [{ acquired: true }] };
      if (sql.includes("to_regclass")) return { rows: [{ table_name: "schema_migrations" }] };
      if (sql.includes("SELECT migration_id")) return { rows: [] };
      if (sql === "select failure;") throw new Error("synthetic failure");
      return { rows: [] };
    },
  };
  const migrations = [
    { id: "001", filename: "001_failure.sql", sql: "select failure;", checksum: "a".repeat(64) },
    { id: "002", filename: "002_never-runs.sql", sql: "select 2;", checksum: "b".repeat(64) },
  ];
  await assert.rejects(runMigrations(executor, migrations), /migration 001 failed/);
  assert.ok(calls.includes("ROLLBACK"));
  assert.equal(calls.includes("select 2;"), false);
  assert.equal(calls.includes("COMMIT"), false);
});
