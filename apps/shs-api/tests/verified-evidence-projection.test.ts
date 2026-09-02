import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const service = fs.readFileSync(new URL("../src/domain/verified-evidence/service/verified-evidence-service.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/domain/verified-evidence/api/routes.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/067_verified_evidence_truth_projection.sql", import.meta.url), "utf8");
const hardeningMigration = fs.readFileSync(new URL("../migrations/068_phase6_projection_hardening.sql", import.meta.url), "utf8");
const adapter = fs.readFileSync(new URL("../src/domain/verified-evidence/truth-spine-adapter.ts", import.meta.url), "utf8");

test("Phase 6 uses one server-side projection path with explicit source rules", () => {
  assert.match(service, /export async function projectAuthoritativeFact/);
  assert.match(service, /curriculum_evidence_rules/);
  assert.match(service, /SOURCE_TABLES/);
  assert.match(routes, /TRUTH_OVERRIDE/);
  assert.match(routes, /CURRICULUM_CATALOG_MANAGE/);
});

test("Phase 6 persistence preserves release/assignment/source lineage and replay uniqueness", () => {
  for (const field of ["assignment_id", "curriculum_release_id", "release_version", "source_type", "source_record_id", "evidence_rule_id", "competency_id"]) {
    assert.match(migration, new RegExp(field));
  }
  assert.match(migration, /curriculum_truth_facts/);
  assert.match(migration, /UNIQUE \(organization_id, source_type, source_record_id, fact_type, evidence_rule_id\)/);
  assert.match(migration, /prepare_prove_evidence_phase6_source_idx/);
  assert.match(hardeningMigration, /SUPERSEDED/);
  assert.match(hardeningMigration, /supersedes_fkey/);
  assert.match(adapter, /toTruthSpineFact/);
  assert.match(adapter, /curriculum_release_id/);
});

test("Phase 6 does not accept browser-authored evidence or truth payloads", () => {
  assert.equal(routes.includes("req.body.evidence"), false);
  assert.equal(routes.includes("req.body.truth"), false);
  assert.equal(service.includes("INSERT INTO curriculum_truth_facts"), true);
  assert.equal(service.includes("INSERT INTO prepare_prove_evidence"), true);
});
