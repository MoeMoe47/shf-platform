// SHF Database Phase 4.2 — exhaustive migration ↔ physical schema
// integrity verification.
//
// The curated CRITICAL_MIGRATION_OBJECTS manifest (schema-integrity.ts)
// has successfully caught every incident this project has hit so far
// (031, 035-038, 030, 032, 033) — but only because each was added to the
// manifest *after* being discovered by a regression-suite failure. This
// module removes that blind spot: it censuses every migration file
// (001 through current HEAD) via migration-expectation-parser.ts,
// filters to whichever are actually recorded applied in
// `schema_migrations`, and verifies every table/column/index/constraint/
// extension any of them established — not just the ones someone
// previously noticed were broken.
//
// This does not replace the curated manifest (kept for fast, richer
// per-object index/constraint checks) — see `db:schema:integrity` vs
// `db:schema:integrity:strict` in schema-integrity-check.ts.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { MigrationExecutor } from "./migration-runner.js";
import { parseMigrationExpectations, MigrationExpectation } from "./migration-expectation-parser.js";

const DEFAULT_MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../migrations");

export interface LedgerRow {
  migrationId: string;
  runnerVersion: string;
  executionDurationMs: number;
}

export interface ExhaustiveIntegrityFailure {
  objectType: MigrationExpectation["objectType"];
  table: string;
  name: string;
  contributingMigrations: Array<{ migrationId: string; appliedViaBaseline: boolean }>;
}

export interface ExhaustiveIntegrityResult {
  ok: boolean;
  checkedMigrations: number;
  checkedObjects: number;
  failures: ExhaustiveIntegrityFailure[];
  baselineAppliedMigrations: string[];
}

/** Reads and parses every migration file in `migrationsDir` (default: the
 * repository's own `migrations/` directory) into a flat expectation list. */
export async function censusMigrationExpectations(migrationsDir: string = DEFAULT_MIGRATIONS_DIR): Promise<MigrationExpectation[]> {
  const files = (await readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();
  const all: MigrationExpectation[] = [];
  for (const file of files) {
    const migrationId = file.slice(0, 3);
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    all.push(...parseMigrationExpectations(migrationId, sql));
  }
  return all;
}

/** Batches the five catalog queries once and returns a function that
 * answers "does this expectation physically exist?" — shared by the
 * exhaustive checker and by the baseline-command physical-schema guard
 * (migration-runner.ts's `baselineMigrations`), so both use one source of
 * truth for what "exists" means. */
export async function buildPhysicalObjectExistenceCheck(executor: MigrationExecutor): Promise<(e: MigrationExpectation) => boolean> {
  // Sequential, not Promise.all: `executor` is sometimes a single pg
  // Client/PoolClient (baselineMigrations holds one for its whole
  // transaction), and a single connection cannot run concurrent queries —
  // node-postgres only queues them with a deprecation warning today, and
  // that isn't guaranteed to keep working. Five sequential queries is
  // still O(1) regardless of object count, which is the property that
  // actually matters for performance here.
  const tableRows = await executor.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  const columnRows = await executor.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'");
  const indexRows = await executor.query("SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public'");
  const constraintRows = await executor.query("SELECT conrelid::regclass::text AS table_name, conname FROM pg_constraint");
  const extensionRows = await executor.query("SELECT extname FROM pg_extension");

  const existingTables = new Set(tableRows.rows.map((r: any) => String(r.table_name)));
  const existingColumns = new Set(columnRows.rows.map((r: any) => `${r.table_name}.${r.column_name}`));
  const existingIndexes = new Set(indexRows.rows.map((r: any) => String(r.indexname)));
  const existingConstraints = new Set(constraintRows.rows.map((r: any) => String(r.conname)));
  const existingExtensions = new Set(extensionRows.rows.map((r: any) => String(r.extname)));

  return function objectExists(e: MigrationExpectation): boolean {
    switch (e.objectType) {
      case "table": return existingTables.has(e.table);
      case "column": return existingColumns.has(`${e.table}.${e.name}`);
      case "index": return existingIndexes.has(e.name);
      case "constraint": return existingConstraints.has(e.name);
      case "primary_key": return existingConstraints.has(e.name);
      case "extension": return existingExtensions.has(e.name);
    }
  };
}

/** Returns whichever of `expectations` are NOT physically present right
 * now — independent of ledger state. Used by the baseline-command guard,
 * which must check *before* a migration is marked applied (so the
 * ledger-aware filtering in `checkExhaustiveSchemaIntegrity` doesn't
 * apply here — that check only enforces expectations for migrations
 * already recorded applied). */
export async function findMissingPhysicalObjects(executor: MigrationExecutor, expectations: MigrationExpectation[]): Promise<MigrationExpectation[]> {
  if (!expectations.length) return [];
  const objectExists = await buildPhysicalObjectExistenceCheck(executor);
  return expectations.filter((e) => !objectExists(e));
}

/** Runs the exhaustive check. `expectations` defaults to a fresh census of
 * the repository's migrations directory; pass an explicit array (e.g. in
 * tests) to check against a fixed, known expectation set instead. */
export async function checkExhaustiveSchemaIntegrity(
  executor: MigrationExecutor,
  expectations?: MigrationExpectation[],
): Promise<ExhaustiveIntegrityResult> {
  const allExpectations = expectations ?? (await censusMigrationExpectations());

  const ledgerRes = await executor.query("SELECT migration_id, runner_version, execution_duration_ms FROM schema_migrations");
  const ledger = new Map<string, LedgerRow>(
    ledgerRes.rows.map((row: any) => [
      String(row.migration_id),
      { migrationId: String(row.migration_id), runnerVersion: String(row.runner_version), executionDurationMs: Number(row.execution_duration_ms) },
    ]),
  );

  const applicable = allExpectations.filter((e) => ledger.has(e.migrationId));
  if (!applicable.length) {
    return { ok: true, checkedMigrations: 0, checkedObjects: 0, failures: [], baselineAppliedMigrations: [] };
  }

  const objectExists = await buildPhysicalObjectExistenceCheck(executor);

  const failureKey = (e: MigrationExpectation) => `${e.objectType}|${e.table}|${e.name}`;
  const failuresByKey = new Map<string, ExhaustiveIntegrityFailure>();
  const baselineAppliedMigrations = new Set<string>();

  for (const e of applicable) {
    const ledgerRow = ledger.get(e.migrationId)!;
    const appliedViaBaseline = ledgerRow.runnerVersion.startsWith("baseline") && ledgerRow.executionDurationMs === 0;
    if (appliedViaBaseline) baselineAppliedMigrations.add(e.migrationId);

    if (objectExists(e)) continue;

    const key = failureKey(e);
    const existing = failuresByKey.get(key);
    if (existing) {
      if (!existing.contributingMigrations.some((m) => m.migrationId === e.migrationId)) {
        existing.contributingMigrations.push({ migrationId: e.migrationId, appliedViaBaseline });
      }
    } else {
      failuresByKey.set(key, {
        objectType: e.objectType,
        table: e.table,
        name: e.name,
        contributingMigrations: [{ migrationId: e.migrationId, appliedViaBaseline }],
      });
    }
  }

  return {
    ok: failuresByKey.size === 0,
    checkedMigrations: new Set(applicable.map((e) => e.migrationId)).size,
    checkedObjects: applicable.length,
    failures: [...failuresByKey.values()],
    baselineAppliedMigrations: [...baselineAppliedMigrations].sort(),
  };
}
