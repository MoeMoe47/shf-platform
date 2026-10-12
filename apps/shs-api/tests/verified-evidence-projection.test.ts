import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const service = fs.readFileSync(new URL("../src/domain/verified-evidence/service/verified-evidence-service.ts", import.meta.url), "utf8");
const routes = fs.readFileSync(new URL("../src/domain/verified-evidence/api/routes.ts", import.meta.url), "utf8");
const migration = fs.readFileSync(new URL("../migrations/067_verified_evidence_truth_projection.sql", import.meta.url), "utf8");
const hardeningMigration = fs.readFileSync(new URL("../migrations/068_phase6_projection_hardening.sql", import.meta.url), "utf8");
const ruleIdentityMigration = fs.readFileSync(new URL("../migrations/158_curriculum_evidence_rule_org_scoped_identity.sql", import.meta.url), "utf8");
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
  assert.match(ruleIdentityMigration, /DROP CONSTRAINT IF EXISTS curriculum_evidence_rules_pkey/);
  assert.match(ruleIdentityMigration, /UNIQUE \(organization_id, evidence_rule_id, rule_version\)/);
  assert.match(adapter, /toTruthSpineFact/);
  assert.match(adapter, /curriculum_release_id/);
});

test("Phase 6 does not accept browser-authored evidence or truth payloads", () => {
  assert.equal(routes.includes("req.body.evidence"), false);
  assert.equal(routes.includes("req.body.truth"), false);
  assert.equal(service.includes("INSERT INTO curriculum_truth_facts"), true);
  assert.equal(service.includes("INSERT INTO prepare_prove_evidence"), true);
});

test("manual projection keeps projector actor distinct from learner subject", () => {
  assert.match(service, /const sourceResult = await loadSourceRow\(sourceType, source, sourceRecordId, actor\.organization_id\);/);
  assert.doesNotMatch(service, /loadSourceRow\(sourceType, source, sourceRecordId, actor\.organization_id, actor\.user_id\)/);
  assert.match(service, /const subjectUserId = String\(row\[source\.learner\]/);
  assert.match(service, /subjectUserId, actor\.organization_id, tenantId/);
  assert.match(service, /actor\.organization_id, subjectUserId, configured\.truth_fact_type/);
});

test("manual projection provenance preserves actor, subject, source, org, tenant, and rule", () => {
  for (const field of [
    "source_type",
    "source_record_id",
    "rule_id",
    "rule_version",
    "organization_id",
    "tenant_id",
    "learner_user_id",
    "projector_user_id",
  ]) {
    assert.match(service, new RegExp(`${field}:`));
  }
  assert.match(service, /projector_user_id: actor\.user_id/);
  assert.match(service, /learner_user_id: subjectUserId/);
});

test("manual projection remains org scoped and source-type scoped", () => {
  assert.match(service, /WHERE evidence_rule_id=\$1 AND organization_id=\$2 AND source_type=\$3 AND status='ACTIVE' ORDER BY rule_version DESC LIMIT 1/);
  assert.match(service, /WHERE \${source\.id}=\$1 AND organization_id=\$2/);
  assert.match(service, /tenant:\$\{actor\.organization_id\}/);
});

test("outbox projection uses one latest active version per org-local logical rule", () => {
  assert.match(service, /SELECT DISTINCT ON \(evidence_rule_id\) evidence_rule_id FROM curriculum_evidence_rules/);
  assert.match(service, /ORDER BY evidence_rule_id, rule_version DESC/);
});

test("projection route enforces existing truth override permission boundary", () => {
  assert.match(routes, /\/verified-evidence\/projections", requirePermission\(SHS_SECURITY_PERMISSIONS\.TRUTH_OVERRIDE\)/);
  assert.equal(routes.includes("req.body.learner"), false);
  assert.equal(routes.includes("req.body.learnerId"), false);
  assert.equal(routes.includes("req.body.learner_id"), false);
});
