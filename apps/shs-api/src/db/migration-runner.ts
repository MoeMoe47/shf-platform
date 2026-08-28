import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const MIGRATION_LOCK_KEY = 779421083;
export const MIGRATION_RUNNER_VERSION = "1";

export type QueryResult = { rows: any[]; rowCount?: number };
export type MigrationExecutor = {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
};

export type Migration = {
  id: string;
  filename: string;
  sql: string;
  checksum: string;
};

export type MigrationStatus = {
  applied: Migration[];
  pending: Migration[];
  drift: Array<{ migrationId: string; filename: string; expected: string; actual: string }>;
  unknownApplied: Array<{ migrationId: string; filename: string }>;
};

const MIGRATION_NAME = /^(\d{3,})_([a-z0-9][a-z0-9_-]*)\.sql$/;
const MIGRATIONS_TABLE = "schema_migrations";

function checksum(sql: string) {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

export async function discoverMigrations(migrationsDir: string): Promise<Migration[]> {
  const filenames = (await readdir(migrationsDir)).filter((filename) => filename.endsWith(".sql"));
  const migrations: Migration[] = [];
  const ids = new Set<string>();

  for (const filename of filenames) {
    const match = MIGRATION_NAME.exec(filename);
    if (!match) throw new Error(`malformed migration filename: ${filename}`);
    const id = match[1];
    if (ids.has(id)) throw new Error(`duplicate migration id: ${id}`);
    ids.add(id);
    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    migrations.push({ id, filename, sql, checksum: checksum(sql) });
  }

  migrations.sort((a, b) => Number(a.id) - Number(b.id));
  return migrations;
}

export function migrationTableSql() {
  return `CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
    migration_id TEXT PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    checksum TEXT NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    execution_duration_ms INTEGER NOT NULL DEFAULT 0 CHECK (execution_duration_ms >= 0),
    runner_version TEXT NOT NULL
  )`;
}

async function tableExists(executor: MigrationExecutor) {
  const result = await executor.query("SELECT to_regclass('public.schema_migrations') AS table_name");
  return Boolean(result.rows[0]?.table_name);
}

async function appliedRows(executor: MigrationExecutor) {
  if (!(await tableExists(executor))) return [];
  const result = await executor.query(
    "SELECT migration_id, filename, checksum FROM schema_migrations ORDER BY migration_id",
  );
  return result.rows;
}

export async function inspectMigrations(
  executor: MigrationExecutor,
  migrations: Migration[],
): Promise<MigrationStatus> {
  const known = new Map(migrations.map((migration) => [migration.id, migration]));
  const rows = await appliedRows(executor);
  const applied: Migration[] = [];
  const drift: MigrationStatus["drift"] = [];
  const unknownApplied: MigrationStatus["unknownApplied"] = [];

  for (const row of rows) {
    const migration = known.get(String(row.migration_id));
    if (!migration) {
      unknownApplied.push({ migrationId: String(row.migration_id), filename: String(row.filename) });
      continue;
    }
    applied.push(migration);
    if (row.checksum !== migration.checksum || row.filename !== migration.filename) {
      drift.push({
        migrationId: migration.id,
        filename: migration.filename,
        expected: migration.checksum,
        actual: String(row.checksum),
      });
    }
  }

  const appliedIds = new Set(applied.map((migration) => migration.id));
  return {
    applied,
    pending: migrations.filter((migration) => !appliedIds.has(migration.id)),
    drift,
    unknownApplied,
  };
}

function assertSafeStatus(status: MigrationStatus) {
  if (status.drift.length) throw new Error(`migration drift detected: ${status.drift.map((item) => item.migrationId).join(",")}`);
  if (status.unknownApplied.length) throw new Error(`unknown applied migrations: ${status.unknownApplied.map((item) => item.migrationId).join(",")}`);
}

async function acquireLock(executor: MigrationExecutor) {
  const result = await executor.query("SELECT pg_try_advisory_lock($1) AS acquired", [MIGRATION_LOCK_KEY]);
  if (!result.rows[0]?.acquired) throw new Error("migration lock is held by another runner");
}

async function releaseLock(executor: MigrationExecutor) {
  await executor.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
}

export async function runMigrations(executor: MigrationExecutor, migrations: Migration[]) {
  await acquireLock(executor);
  try {
    await executor.query(migrationTableSql());
    const initial = await inspectMigrations(executor, migrations);
    assertSafeStatus(initial);
    let status = initial;

    for (const migration of status.pending) {
      const startedAt = Date.now();
      await executor.query("BEGIN");
      try {
        await executor.query(migration.sql);
        await executor.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (migration_id, filename, checksum, execution_duration_ms, runner_version)
           VALUES ($1, $2, $3, $4, $5)`,
          [migration.id, migration.filename, migration.checksum, Date.now() - startedAt, MIGRATION_RUNNER_VERSION],
        );
        await executor.query("COMMIT");
      } catch (error) {
        await executor.query("ROLLBACK");
        throw new Error(`migration ${migration.id} failed`, { cause: error });
      }
      status = await inspectMigrations(executor, migrations);
      assertSafeStatus(status);
    }
    return status;
  } finally {
    await releaseLock(executor);
  }
}

export async function checkSchemaReadiness(executor: MigrationExecutor, migrations: Migration[]) {
  if (!(await tableExists(executor))) return { ready: false, reason: "migration_table_missing" };
  const status = await inspectMigrations(executor, migrations);
  if (status.drift.length) return { ready: false, reason: "migration_drift", status };
  if (status.unknownApplied.length) return { ready: false, reason: "unknown_applied_migration", status };
  if (status.pending.length) return { ready: false, reason: "pending_migrations", status };
  return { ready: true, status };
}

export async function baselineMigrations(
  executor: MigrationExecutor,
  migrations: Migration[],
  migrationIds: string[],
) {
  if (!migrationIds.length) throw new Error("baseline requires explicit migration IDs");
  const selected = migrationIds.map((id) => migrations.find((migration) => migration.id === id));
  if (selected.some((migration) => !migration)) throw new Error("baseline contains an unknown migration ID");

  await acquireLock(executor);
  try {
    await executor.query(migrationTableSql());
    const current = await inspectMigrations(executor, migrations);
    assertSafeStatus(current);
    await executor.query("BEGIN");
    try {
      for (const migration of selected as Migration[]) {
        if (current.applied.some((applied) => applied.id === migration.id)) continue;
        await executor.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (migration_id, filename, checksum, runner_version)
           VALUES ($1, $2, $3, $4)`,
          [migration.id, migration.filename, migration.checksum, `baseline-${MIGRATION_RUNNER_VERSION}`],
        );
      }
      await executor.query("COMMIT");
    } catch (error) {
      await executor.query("ROLLBACK");
      throw error;
    }
    return inspectMigrations(executor, migrations);
  } finally {
    await releaseLock(executor);
  }
}
