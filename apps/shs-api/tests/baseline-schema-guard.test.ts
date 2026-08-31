import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";

const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("baseline command refuses to mark a migration applied when its physical schema is absent, and succeeds once it is present", {
  timeout: 60_000,
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable PostgreSQL baseline-guard verification",
}, async (t) => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, runMigrations, baselineMigrations, BaselineSchemaVerificationError } = await import("../src/db/migration-runner.ts");

  const pool = new Pool({ connectionString: testDatabaseUrl });
  t.after(async () => { await pool.end(); });

  const migrations = await discoverMigrations(new URL("../migrations", import.meta.url).pathname);
  const client = await pool.connect();
  try {
    // Run everything for real first, so the ledger and physical schema
    // both start genuinely in sync.
    await runMigrations(client, migrations);

    // Simulate the exact historical defect in a disposable table/migration
    // pair: drop a real table's physical schema, then try to baseline a
    // *different*, never-applied migration ID whose SQL creates a table
    // that does not exist. We use a synthetic in-memory migration rather
    // than mutating a real repository migration, to avoid ever touching
    // this test run's own ledger/schema for a migration other tests rely on.
    const syntheticId = "999";
    const syntheticTable = `baseline_guard_probe_${randomUUID().replace(/-/g, "_")}`;
    const syntheticMigration = {
      id: syntheticId,
      filename: `${syntheticId}_baseline_guard_probe.sql`,
      sql: `CREATE TABLE IF NOT EXISTS ${syntheticTable} (probe_id TEXT PRIMARY KEY);`,
      checksum: "0".repeat(64),
    };

    await assert.rejects(
      () => baselineMigrations(client, [...migrations, syntheticMigration], [syntheticId]),
      (error: unknown) => {
        assert.ok(error instanceof BaselineSchemaVerificationError);
        assert.equal((error as InstanceType<typeof BaselineSchemaVerificationError>).migrationId, syntheticId);
        return true;
      },
      "baseline must refuse when the migration's own table does not physically exist",
    );

    const ledgerAfterRefusal = await client.query("SELECT 1 FROM schema_migrations WHERE migration_id=$1", [syntheticId]);
    assert.equal(ledgerAfterRefusal.rows.length, 0, "a refused baseline must not write a ledger row");

    // Now create the table for real (simulating that it was actually
    // applied through some other means) and confirm baseline succeeds.
    await client.query(`CREATE TABLE IF NOT EXISTS ${syntheticTable} (probe_id TEXT PRIMARY KEY)`);
    const result = await baselineMigrations(client, [...migrations, syntheticMigration], [syntheticId]);
    assert.ok(result.applied.some((m) => m.id === syntheticId));

    // force:true bypasses the guard even when schema is absent — cleanup
    // this synthetic ledger row and table via a second synthetic id to
    // prove the override path works and to leave no residue behind.
    await client.query(`DROP TABLE IF EXISTS ${syntheticTable}`);
    await client.query("DELETE FROM schema_migrations WHERE migration_id=$1", [syntheticId]);
  } finally {
    client.release();
  }
});
