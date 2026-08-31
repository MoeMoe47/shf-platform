import test from "node:test";
import assert from "node:assert/strict";
import { checkCriticalSchemaIntegrity, CRITICAL_MIGRATION_OBJECTS } from "../src/db/schema-integrity.ts";

test("critical schema manifest covers repaired migration-owned objects", () => {
  const tables = CRITICAL_MIGRATION_OBJECTS.map((item) => `${item.migrationId}:${item.table}`);
  assert.ok(tables.includes("030:rate_limit_windows"));
  assert.ok(tables.includes("032:organization_relationships"));
  assert.ok(tables.includes("032:programs"));
  assert.ok(tables.includes("033:career_families"));
  assert.ok(tables.includes("033:careers"));
  assert.ok(tables.includes("033:career_curriculum_requirements"));
  assert.ok(tables.includes("031:curriculum_lesson_completions"));
  assert.ok(tables.includes("035:program_specialization_assignments"));
  assert.ok(tables.includes("036:program_specialization_requests"));
  assert.ok(tables.includes("037:program_course_assignments"));
  assert.ok(tables.includes("038:projects"));
  assert.ok(tables.includes("038:project_teams"));
  assert.ok(tables.includes("038:project_team_members"));
  assert.ok(tables.includes("038:project_submissions"));
  assert.ok(tables.includes("041:cohorts"));
  assert.ok(tables.includes("041:enrollments"));
  assert.ok(tables.includes("041:cohort_staff"));
  assert.ok(tables.includes("043:assignment_targets"));
  assert.ok(tables.includes("046:career_events"));
  assert.ok(tables.includes("046:opportunities"));
});

test("integrity checker detects ledger-applied migration with missing physical objects", async () => {
  const executor = {
    async query(sql: string) {
      if (sql.includes("FROM schema_migrations")) {
        return { rows: [{ migration_id: "035" }] };
      }
      if (sql.includes("information_schema.tables")) {
        return { rows: [] };
      }
      return { rows: [] };
    },
  };

  const failures = await checkCriticalSchemaIntegrity(executor as any, [{
    migrationId: "035",
    table: "program_specialization_assignments",
    requiredColumns: ["assignment_id"],
    requiredIndexes: ["program_specialization_active_primary_idx"],
    requiredConstraints: ["program_specialization_assignments_pkey"],
  }]);

  assert.deepEqual(failures, [{
    migrationId: "035",
    table: "program_specialization_assignments",
    missingTable: true,
    missingColumns: ["assignment_id"],
    missingIndexes: ["program_specialization_active_primary_idx"],
    missingConstraints: ["program_specialization_assignments_pkey"],
  }]);
});

test("integrity checker passes when manifest objects are physically present", async () => {
  const executor = {
    async query(sql: string) {
      if (sql.includes("FROM schema_migrations")) {
        return { rows: [{ migration_id: "035" }] };
      }
      if (sql.includes("information_schema.tables")) {
        return { rows: [{ table_name: "program_specialization_assignments" }] };
      }
      if (sql.includes("information_schema.columns")) {
        return { rows: [{ table_name: "program_specialization_assignments", column_name: "assignment_id" }] };
      }
      if (sql.includes("pg_indexes")) {
        return { rows: [{ tablename: "program_specialization_assignments", indexname: "program_specialization_active_primary_idx" }] };
      }
      if (sql.includes("pg_constraint")) {
        return { rows: [{ table_name: "program_specialization_assignments", conname: "program_specialization_assignments_pkey" }] };
      }
      return { rows: [] };
    },
  };

  const failures = await checkCriticalSchemaIntegrity(executor as any, [{
    migrationId: "035",
    table: "program_specialization_assignments",
    requiredColumns: ["assignment_id"],
    requiredIndexes: ["program_specialization_active_primary_idx"],
    requiredConstraints: ["program_specialization_assignments_pkey"],
  }]);

  assert.deepEqual(failures, []);
});
