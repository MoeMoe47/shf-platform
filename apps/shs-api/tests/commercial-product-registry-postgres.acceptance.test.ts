import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import pkg from "pg";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

async function assertCheckViolation(action: () => Promise<unknown>) {
  await assert.rejects(action, (error: any) => error?.code === "23514");
}

async function assertUniqueViolation(action: () => Promise<unknown>) {
  await assert.rejects(action, (error: any) => error?.code === "23505");
}

test("Commercial Product Registry 3B persists canonical products and guarded relationships on PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable Product Registry PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { PostgresCommercialProductRegistryRepo } = await import("../src/domain/commercial-product-registry/repo/postgres-commercial-product-registry-repo.ts");
  const { pool: appPool } = await import("../src/db/client.ts");

  const migrationsDir = path.resolve(new URL("../migrations", import.meta.url).pathname);
  const migrationPool = new Pool({ connectionString: testDatabaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    await runMigrations(migrationClient, await discoverMigrations(migrationsDir));
    const cleanStatus = await inspectMigrations(migrationClient, await discoverMigrations(migrationsDir));
    assert.equal(cleanStatus.pending.length, 0);
    assert.equal(cleanStatus.drift.length, 0);
    assert.equal(cleanStatus.unknownApplied.length, 0);
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: testDatabaseUrl });
  const repo = new PostgresCommercialProductRegistryRepo();
  const suffix = `${process.pid}_${Date.now()}`;
  const slugSuffix = suffix.replace(/_/g, "-");
  const actorId = `user_cpr_pg_${suffix}`;
  const productId = `cp_pg_registry_${suffix}`;
  const addOnId = `cp_pg_registry_addon_${suffix}`;
  const sourceRef = `cpr_src_${suffix}`;

  try {
    const emptyCount = await pool.query("SELECT COUNT(*)::int AS count FROM commercial_products");
    assert.equal(emptyCount.rows[0].count, 0);

    await pool.query(
      `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
       VALUES ($1, 'Registry Test Org', 'Registry Test Org', 'SHS', 'active')`,
      [`org_cpr_pg_${suffix}`],
    );
    await pool.query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, 'Registry Actor', 'active', 'test')`,
      [actorId, `org_cpr_pg_${suffix}`, `${actorId}@example.test`],
    );

    const product = await repo.createProduct({
      commercial_product_id: productId,
      canonical_name: `Registry Canonical ${suffix}`,
      display_name: "Registry Canonical",
      slug: `registry-canonical-${slugSuffix}`,
      commercial_family: "DATA_CENTER",
      product_type: "SERVICE",
      lifecycle_state: "DEFINED",
      readiness: "YELLOW",
      readiness_reason: "Persistence acceptance fixture",
      sellability: "DEVELOP",
      sellability_reason: "Not sales-approved",
      selling_entity: "SHS",
      delivery_entity: "PARTNER",
      partner_required: true,
      created_by: actorId,
    }, { query: pool.query.bind(pool) });
    assert.equal(product.commercial_product_id, productId);

    const addOn = await repo.createProduct({
      commercial_product_id: addOnId,
      canonical_name: `Registry Add On ${suffix}`,
      display_name: "Registry Add On",
      slug: `registry-add-on-${slugSuffix}`,
      commercial_family: "DATA_CENTER",
      product_type: "SERVICE",
      lifecycle_state: "DEFINED",
      readiness: "UNKNOWN",
      sellability: "NEEDS_REVIEW",
      created_by: actorId,
    }, { query: pool.query.bind(pool) });
    assert.equal(addOn.commercial_product_id, addOnId);

    const roundTrip = await repo.getProductBySlug(`registry-canonical-${slugSuffix}`, { query: pool.query.bind(pool) });
    assert.equal(roundTrip?.commercial_product_id, productId);
    assert.equal((await repo.listProducts({ commercial_family: "DATA_CENTER" }, { query: pool.query.bind(pool) })).length, 2);

    await assertCheckViolation(() => repo.createProduct({
      commercial_product_id: `cp_bad_family_${suffix}`,
      canonical_name: `Bad Family ${suffix}`,
      display_name: "Bad Family",
      slug: `bad-family-${slugSuffix}`,
      commercial_family: "BAD_FAMILY" as any,
      product_type: "SERVICE",
    }, { query: pool.query.bind(pool) }));
    await assertCheckViolation(() => repo.updateReadiness(productId, "MAGENTA" as any, "invalid", null, { query: pool.query.bind(pool) }));
    await assertCheckViolation(() => repo.updateSellability(productId, "BOOK_NOW" as any, "invalid", null, { query: pool.query.bind(pool) }));
    await assertCheckViolation(() => repo.updateLifecycle(productId, "SIGNED" as any, actorId, { query: pool.query.bind(pool) }));

    const source = await repo.addSourceAuthority({
      source_reference_id: sourceRef,
      commercial_product_id: productId,
      source_authority_type: "SERVICE_CATALOG",
      source_domain: "service-catalog",
      source_record_id: `svc_${suffix}`,
      source_version: "v1",
      source_status: "FOUND",
      source_provenance: ["3B acceptance"],
    }, { query: pool.query.bind(pool) });
    assert.equal(source.source_reference_id, sourceRef);
    await assertUniqueViolation(() => repo.addSourceAuthority({
      source_reference_id: `cpr_src_dup_${suffix}`,
      commercial_product_id: productId,
      source_authority_type: "SERVICE_CATALOG",
      source_domain: "service-catalog",
      source_record_id: `svc_${suffix}`,
      source_version: "v1",
      source_status: "FOUND",
      source_provenance: ["duplicate"],
    }, { query: pool.query.bind(pool) }));
    const replacedSource = await repo.replaceSourceAuthority({
      source_reference_id: `cpr_src_replacement_${suffix}`,
      commercial_product_id: productId,
      source_authority_type: "SERVICE_CATALOG",
      source_domain: "service-catalog",
      source_record_id: `svc_${suffix}`,
      source_version: "v1",
      source_status: "STALE",
      source_provenance: ["replacement provenance"],
    }, { query: pool.query.bind(pool) });
    assert.equal(replacedSource.source_reference_id, sourceRef);
    assert.equal(replacedSource.source_status, "STALE");

    const buyer = await repo.addBuyerCompatibility({
      commercial_product_buyer_id: `cpr_buyer_${suffix}`,
      commercial_product_id: productId,
      buyer_type: "EMPLOYER",
      status: "DOCUMENTED",
      authority_source_reference_id: sourceRef,
      limitations: ["contracting review required"],
    }, { query: pool.query.bind(pool) });
    assert.equal(buyer.buyer_type, "EMPLOYER");
    assert.equal((await repo.listBuyers(productId, { query: pool.query.bind(pool) })).length, 1);

    const form = await repo.addCommercialForm({
      commercial_product_form_id: `cpr_form_${suffix}`,
      commercial_product_id: productId,
      commercial_form: "SUBSCRIPTION",
      status: "POTENTIAL",
      authority_source_reference_id: sourceRef,
      limitations: ["metadata only"],
    }, { query: pool.query.bind(pool) });
    assert.equal(form.commercial_form, "SUBSCRIPTION");
    assert.equal((await repo.listCommercialForms(productId, { query: pool.query.bind(pool) })).length, 1);

    const gate = await repo.addReviewGate({
      commercial_product_gate_id: `cpr_gate_${suffix}`,
      commercial_product_id: productId,
      gate_type: "LEGAL",
      status: "APPROVED",
      authority: "legal-runtime-authority",
      reference: `legal_ref_${suffix}`,
      reason: "Acceptance-approved fixture gate",
    }, { query: pool.query.bind(pool) });
    assert.equal(gate.status, "APPROVED");
    await assertCheckViolation(() => repo.addReviewGate({
      commercial_product_gate_id: `cpr_gate_bad_${suffix}`,
      commercial_product_id: productId,
      gate_type: "LEGAL",
      status: "APPROVED",
    }, { query: pool.query.bind(pool) }));

    const relationship = await repo.addProductRelationship({
      relationship_id: `cpr_rel_${suffix}`,
      source_product_id: productId,
      target_product_id: addOnId,
      relationship_type: "ADD_ON",
      direction: "SOURCE_TO_TARGET",
      status: "ACTIVE",
      provenance: ["3B acceptance"],
    }, { query: pool.query.bind(pool) });
    assert.equal(relationship.relationship_type, "ADD_ON");
    await assertCheckViolation(() => repo.addProductRelationship({
      relationship_id: `cpr_rel_self_bad_${suffix}`,
      source_product_id: productId,
      target_product_id: productId,
      relationship_type: "ADD_ON",
      direction: "SOURCE_TO_TARGET",
      status: "ACTIVE",
    }, { query: pool.query.bind(pool) }));
    await assertUniqueViolation(() => repo.addProductRelationship({
      relationship_id: `cpr_rel_dup_${suffix}`,
      source_product_id: productId,
      target_product_id: addOnId,
      relationship_type: "ADD_ON",
      direction: "SOURCE_TO_TARGET",
      status: "ACTIVE",
    }, { query: pool.query.bind(pool) }));

    await pool.query(
      `INSERT INTO commercial_product_funding_relationships (
        commercial_product_funding_id, commercial_product_id, funding_relationship_status,
        funding_category, authority_source_reference_id, limitations, provenance
      ) VALUES ($1,$2,'POTENTIAL','WORKFORCE_FUNDING',$3,$4::jsonb,$5::jsonb)`,
      [`cpr_funding_${suffix}`, productId, sourceRef, JSON.stringify(["relationship metadata only"]), JSON.stringify(["funding metadata only"])],
    );
    assert.equal((await repo.listFundingRelationships(productId, { query: pool.query.bind(pool) })).length, 1);
    await assertCheckViolation(() => pool.query(
      `INSERT INTO commercial_product_funding_relationships (
        commercial_product_funding_id, commercial_product_id, funding_relationship_status,
        funding_category, limitations
      ) VALUES ($1,$2,'VERIFIED','GRANT',$3::jsonb)`,
      [`cpr_funding_bad_${suffix}`, productId, JSON.stringify(["eligibility approved"])],
    ));

    await assertCheckViolation(() => pool.query(
      `INSERT INTO commercial_product_governance_state (commercial_product_id, revenue_classifications)
       VALUES ($1,$2::jsonb)`,
      [productId, JSON.stringify(["BOOKED_REVENUE"])],
    ));
    await assertCheckViolation(() => pool.query(
      `INSERT INTO commercial_product_governance_state (commercial_product_id, commission_policy_reference)
       VALUES ($1,$2)`,
      [productId, "calculated commission_rate"],
    ));

    const coreColumns = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_name='commercial_products' AND column_name IN ('organization_id', 'tenant_id', 'price', 'unit_price', 'commission_rate', 'commission_amount')
       ORDER BY column_name`,
    );
    assert.deepEqual(coreColumns.rows, []);

    const candidateSeedRows = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM commercial_products
       WHERE canonical_name ILIKE ANY($1::text[])`,
      [["%Data Center%", "%Learning Arcade%", "%CivicSure%", "%Trusted Reporting%"]],
    );
    assert.equal(candidateSeedRows.rows[0].count, product.canonical_name.includes("Data Center") ? 1 : 0);

    const expectedTables = [
      "commercial_products",
      "commercial_product_source_authorities",
      "commercial_product_buyers",
      "commercial_product_forms",
      "commercial_product_review_gates",
      "commercial_product_funding_relationships",
      "commercial_product_entitlements",
      "commercial_product_relationships",
      "commercial_product_regulatory_metadata",
      "commercial_product_implementation_support",
      "commercial_product_renewal_expansion",
      "commercial_product_social_selling",
      "commercial_product_governance_state",
    ];
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])",
      [expectedTables],
    );
    assert.equal(tables.rows.length, expectedTables.length);

    const indexes = await pool.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname='public' AND indexname = ANY($1::text[])",
      [[
        "commercial_products_slug_active_uq",
        "commercial_products_family_idx",
        "commercial_product_source_authorities_lookup_idx",
        "commercial_product_relationships_source_idx",
      ]],
    );
    assert.equal(indexes.rows.length, 4);
  } finally {
    await pool.query("DELETE FROM commercial_product_relationships WHERE source_product_id IN ($1,$2) OR target_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_product_funding_relationships WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_product_review_gates WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_product_forms WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_product_buyers WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_product_source_authorities WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM commercial_products WHERE commercial_product_id IN ($1,$2)", [productId, addOnId]);
    await pool.query("DELETE FROM users WHERE user_id=$1", [actorId]);
    await pool.query("DELETE FROM organizations WHERE organization_id=$1", [`org_cpr_pg_${suffix}`]);
    await pool.end();
    await appPool.end();
  }
});
