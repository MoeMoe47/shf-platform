import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import pkg from "pg";
import { readFile } from "node:fs/promises";
import { CommercialProductRegistryService } from "../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts";
import { GOVERNANCE_CAPABILITIES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";
import { runOnboarding } from "../src/domain/commercial-product-registry/onboarding/commercial-product-onboarding.ts";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;
const repoRoot = path.resolve(import.meta.dirname, "../../..");
const manifestPath = path.join(repoRoot, "docs/sales/commercial-product-registry-onboarding/commercial-product-onboarding-manifest.json");

test("4A onboarding applies eligible candidates through the governed service on disposable PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable Product Registry 4A acceptance",
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

  const pool = new Pool({ connectionString: testDatabaseUrl });
  const service = new CommercialProductRegistryService();
  const suffix = `${process.pid}_${Date.now()}`;
  const organizationId = `org_cpr_4a_${suffix}`;
  const userId = `user_cpr_4a_${suffix}`;
  const actor = { user_id: userId, active_organization_id: organizationId, capabilities: GOVERNANCE_CAPABILITIES };
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  try {
    await pool.query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,'CPR 4A Disposable','CPR 4A Disposable','SHS','active')`, [organizationId]);
    await pool.query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,'CPR 4A Operator','active','test')`, [userId, organizationId, `${userId}@example.test`]);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);

    const dryRun = await runOnboarding({ manifest, service, actor });
    assert.equal(dryRun.results.filter((item) => item.disposition === "REVIEW_REQUIRED").length, 24);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 0);

    const applied = await runOnboarding({ manifest, service, actor, mode: "APPLY" });
    const registered = applied.results.filter((item) => item.disposition === "REGISTERED");
    assert.equal(registered.length, 24);
    assert.ok(applied.results.filter((item) => item.disposition === "SOURCE_AUTHORITY_MISSING").length === 8);
    const expected = manifest.candidates.filter((candidate: any) => candidate.registration_allowed);
    const expectedCounts = (key: string) => Object.fromEntries([...new Set(expected.map((candidate: any) => candidate[key]))].map((value) => [value, expected.filter((candidate: any) => candidate[key] === value).length]));
    const actualReadiness = Object.fromEntries((await pool.query("SELECT readiness, count(*)::int AS count FROM commercial_products GROUP BY readiness")).rows.map((row: any) => [row.readiness, row.count]));
    const actualSellability = Object.fromEntries((await pool.query("SELECT sellability, count(*)::int AS count FROM commercial_products GROUP BY sellability")).rows.map((row: any) => [row.sellability, row.count]));
    assert.deepEqual(actualReadiness, expectedCounts("readiness"));
    assert.deepEqual(actualSellability, expectedCounts("sellability"));
    assert.equal(actualReadiness.GREEN || 0, 0);
    assert.equal(actualSellability.SELL_NOW || 0, 0);

    const sources = Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_source_authorities")).rows[0].count);
    const buyers = Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_buyers")).rows[0].count);
    const forms = Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_forms")).rows[0].count);
    const gates = Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_review_gates")).rows[0].count);
    const funding = Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_funding_relationships")).rows[0].count);
    assert.ok(sources > 0 && buyers > 0 && forms > 0 && gates > 0 && funding > 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_review_gates WHERE reviewed_at IS NOT NULL")).rows[0].count), 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_entitlements")).rows[0].count), 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_relationships")).rows[0].count), 0);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_product_funding_relationships WHERE limitations::text ILIKE '%eligib%' OR provenance::text ILIKE '%eligib%'")).rows[0].count), 0);
    assert.ok(Number((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.%'", [organizationId])).rows[0].count) > 0);
    assert.ok(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products WHERE readiness_evidence_references <> '[]'::jsonb AND readiness_authority IS NOT NULL AND sellability_authority IS NOT NULL")).rows[0].count) > 0);

    const auditCount = Number((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.%'", [organizationId])).rows[0].count);
    const rerun = await runOnboarding({ manifest, service, actor, mode: "APPLY" });
    assert.equal(rerun.results.filter((item) => item.disposition === "RECONCILED_EXISTING").length, 24);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM commercial_products")).rows[0].count), 24);
    assert.equal(Number((await pool.query("SELECT count(*)::int AS count FROM audit_events WHERE organization_id=$1 AND action_type LIKE 'commercial_product_registry.%'", [organizationId])).rows[0].count), auditCount);

    const latest = await discoverMigrations(migrationsDir);
    const finalStatus = await inspectMigrations(pool, latest);
    assert.deepEqual(finalStatus.pending, []);
    assert.deepEqual(finalStatus.drift, []);
    assert.deepEqual(finalStatus.unknownApplied, []);
  } finally {
    await pool.end();
  }
});
