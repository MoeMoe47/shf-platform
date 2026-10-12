import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import pkg from "pg";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;
const repoRoot = path.resolve(import.meta.dirname, "../../..");

test("4I production onboarding persists one TEST_ONLY candidate, lineage, audit, and Sales read model on disposable PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable 4I PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const migrationsDir = path.resolve(repoRoot, "apps/shs-api/migrations");
  const migrationPool = new Pool({ connectionString: testDatabaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    const migrations = await discoverMigrations(migrationsDir);
    await runMigrations(migrationClient, migrations);
    const status = await inspectMigrations(migrationClient, migrations);
    assert.deepEqual(status.pending, []);
    assert.deepEqual(status.drift, []);
    assert.deepEqual(status.unknownApplied, []);
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const { CommercialProductProductionOnboardingService, PRODUCTION_ONBOARD_CAPABILITY } = await import("../src/domain/commercial-product-registry/onboarding/commercial-product-production-onboarding-service.ts");
  const { CommercialProductRegistryService } = await import("../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts");
  const { REVIEW_GATE_TYPES } = await import("../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts");
  const pool = new Pool({ connectionString: testDatabaseUrl });
  const suffix = `${process.pid}_${Date.now()}`;
  const organizationId = `org_cpr_4i_${suffix}`;
  const operatorId = `user_cpr_4i_operator_${suffix}`;
  const reviewerId = `user_cpr_4i_reviewer_${suffix}`;
  const actor = { user_id: operatorId, active_organization_id: organizationId, tenant_id: `tenant:${organizationId}`, capabilities: [PRODUCTION_ONBOARD_CAPABILITY, "commercial_product.read"] };
  try {
    await pool.query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,'CPR 4I Disposable','CPR 4I Disposable','SHS','active')", [organizationId]);
    await pool.query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'CPR 4I Operator','active','test'),($4,$2,$5,'CPR 4I Reviewer','active','test')", [operatorId, organizationId, `${operatorId}@example.test`, reviewerId, `${reviewerId}@example.test`]);
    await pool.query(
      `INSERT INTO commercial_product_source_resolutions (
        source_resolution_id,candidate_id,commercial_product_id,resolution_status,authority_domain,
        authority_reference,evidence_reference,resolved_by_actor,resolved_by_org,resolved_at,
        resolution_reason,remaining_requirements,version
      ) VALUES ($1,'cc-002','cp_data_center_employer_validation_package','RESOLVED','CURRICULUM',
        'TEST_ONLY:source-authority','TEST_ONLY:source-evidence',$2,$3,$4,'TEST_ONLY source resolution','[]'::jsonb,1)`,
      [`src_res_4i_${suffix}`, reviewerId, organizationId, "2026-10-05T12:00:00.000Z"],
    );
    for (const [index, gate] of REVIEW_GATE_TYPES.entries()) {
      await pool.query(
        `INSERT INTO commercial_product_review_decisions (
          review_decision_id,candidate_id,commercial_product_id,gate_type,decision_status,decision_reason,
          authority_type,authority_reference,evidence_references,reviewer_actor_id,reviewer_org_id,
          reviewed_at,version
        ) VALUES ($1,'cc-002','cp_data_center_employer_validation_package',$2,'APPROVED','TEST_ONLY governed decision.',
          $3,$4,$5::jsonb,$6,$7,$8,1)`,
        [`rev_dec_4i_${suffix}_${gate}`, gate, gate === "REGULATORY" ? "EXTERNAL_REGULATOR" : "COMMERCIAL_GOVERNANCE_AUTHORITY", `TEST_ONLY:${gate}:authority`, JSON.stringify([`TEST_ONLY:${gate}:evidence`]), reviewerId, organizationId, "2026-10-05T12:00:00.000Z"],
      );
      assert.equal(index >= 0, true);
    }

    const onboarding = await CommercialProductProductionOnboardingService.fromDefaultManifests();
    const dry = await onboarding.dryRun("cc-002", actor);
    assert.equal(dry.eligibility.eligible, true);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);
    const result = await onboarding.execute("cc-002", actor, {
      confirmation: "ONBOARD_CANDIDATE",
      expectedCandidateVersion: dry.expectedVersions.candidateVersion,
      expectedSourceVersion: dry.expectedVersions.sourceVersion,
      expectedDecisionVersions: dry.expectedVersions.decisionVersions,
    });
    assert.equal(result.status, "REGISTERED");
    assert.equal(result.product.lifecycle_state, "REVIEW");
    assert.equal(result.product.readiness, "YELLOW");
    assert.equal(result.product.sellability, "PILOT");
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_production_onboardings")).rows[0].count), 1);
    assert.ok(Number((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE organization_id=$1 AND action_type IN ('commercial_product_registry.production_onboarding_attempted','commercial_product_registry.production_onboarding_succeeded')", [organizationId])).rows[0].count) >= 2);
    const registry = new CommercialProductRegistryService();
    const projection = await registry.projectSalesProductReadModel({ user_id: operatorId, active_organization_id: organizationId, capabilities: ["commercial_product.read"] });
    const product = projection.items.find((item: any) => item.commercialProductId === "cp_data_center_employer_validation_package");
    assert.ok(product);
    assert.equal(product.name, "Data Center Employer Validation Package");
    assert.equal(product.family, "DATA_CENTER");
    assert.equal(product.sellability, "PILOT");
    assert.equal(product.readiness, "YELLOW");
    assert.ok(product.sourceProvenance.length > 0);
    const second = await onboarding.execute("cc-002", actor, { confirmation: "ONBOARD_CANDIDATE" });
    assert.equal(second.status, "ALREADY_ONBOARDED");
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 1);
    const finalStatus = await inspectMigrations(pool, await discoverMigrations(migrationsDir));
    assert.deepEqual(finalStatus.pending, []);
    assert.deepEqual(finalStatus.drift, []);
    assert.deepEqual(finalStatus.unknownApplied, []);
  } finally {
    await pool.end();
  }
});
