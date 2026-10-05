import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import pkg from "pg";
import {
  COMMERCIAL_PRODUCT_REGISTRY_SCOPE,
  CommercialProductRegistryService,
} from "../src/domain/commercial-product-registry/service/commercial-product-registry-service.ts";
import { GOVERNANCE_CAPABILITIES } from "../src/domain/commercial-product-registry/model/commercial-product-registry-contract.ts";

const { Pool } = pkg;
const testDatabaseUrl = process.env.SHS_TEST_DATABASE_URL;

test("Commercial Product Registry 3C service persists governed state and audit events on PostgreSQL", {
  skip: testDatabaseUrl ? false : "SHS_TEST_DATABASE_URL is required for disposable Product Registry 3C PostgreSQL acceptance",
}, async () => {
  process.env.DATABASE_URL = testDatabaseUrl;
  const { discoverMigrations, inspectMigrations, runMigrations } = await import("../src/db/migration-runner.ts");
  const { pool: appPool } = await import("../src/db/client.ts");

  const migrationsDir = path.resolve(new URL("../migrations", import.meta.url).pathname);
  const migrationPool = new Pool({ connectionString: testDatabaseUrl });
  const migrationClient = await migrationPool.connect();
  try {
    const migrations = await discoverMigrations(migrationsDir);
    await runMigrations(migrationClient, migrations);
    const status = await inspectMigrations(migrationClient, migrations);
    assert.equal(status.pending.length, 0);
    assert.equal(status.drift.length, 0);
    assert.equal(status.unknownApplied.length, 0);
  } finally {
    migrationClient.release();
    await migrationPool.end();
  }

  const pool = new Pool({ connectionString: testDatabaseUrl });
  const service = new CommercialProductRegistryService();
  const suffix = `${process.pid}_${Date.now()}`;
  const slugSuffix = suffix.replace(/_/g, "-");
  const orgId = `org_cpr_3c_pg_${suffix}`;
  const actorId = `user_cpr_3c_pg_${suffix}`;
  const productId = `cp_cpr_3c_pg_${suffix}`;
  const relatedProductId = `cp_cpr_3c_pg_related_${suffix}`;
  const actor = {
    user_id: actorId,
    active_organization_id: orgId,
    capabilities: GOVERNANCE_CAPABILITIES,
  };
  const sourceAuthority = {
    sourceAuthorityType: "SERVICE_CATALOG",
    sourceDomain: "service-catalog",
    sourceRecordId: `svc_cpr_3c_${suffix}`,
    sourceVersion: "v1",
    sourceStatus: "FOUND",
    sourceProvenance: ["3C PostgreSQL service acceptance"],
  };

  try {
    assert.equal((await service.projectSalesProductReadModel(actor)).status.status, "CONNECTED_EMPTY");

    await pool.query(
      `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status)
       VALUES ($1, 'CPR 3C PostgreSQL Org', 'CPR 3C PostgreSQL Org', 'SHS', 'active')`,
      [orgId],
    );
    await pool.query(
      `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
       VALUES ($1, $2, $3, 'CPR 3C Actor', 'active', 'test')`,
      [actorId, orgId, `${actorId}@example.test`],
    );

    const created = await service.createProduct({
      commercialProductId: productId,
      canonicalName: `CPR 3C Canonical ${suffix}`,
      displayName: "CPR 3C Canonical",
      slug: `cpr-3c-canonical-${slugSuffix}`,
      commercialFamily: "DATA_CENTER",
      productType: "SERVICE",
      description: "Initial durable service product.",
      shortDescription: "Initial service product.",
      sellingEntity: "SHS",
      deliveryEntity: "PARTNER",
      sourceAuthorities: [sourceAuthority],
      buyerCompatibility: ["EMPLOYER"],
      commercialForms: ["SUBSCRIPTION"],
    }, actor);
    assert.equal(created.commercial_product_id, productId);

    const related = await service.createProduct({
      commercialProductId: relatedProductId,
      canonicalName: `CPR 3C Related ${suffix}`,
      displayName: "CPR 3C Related",
      slug: `cpr-3c-related-${slugSuffix}`,
      commercialFamily: "DATA_CENTER",
      productType: "SERVICE",
    }, actor);
    assert.equal(related.commercial_product_id, relatedProductId);

    const roundTrip = await pool.query(
      `SELECT commercial_product_id, canonical_name, display_name, slug, description,
              lifecycle_state, readiness, sellability, pricing_status, margin_status,
              commission_eligible_status
       FROM commercial_products
       WHERE commercial_product_id=$1`,
      [productId],
    );
    assert.deepEqual(roundTrip.rows[0], {
      commercial_product_id: productId,
      canonical_name: `CPR 3C Canonical ${suffix}`,
      display_name: "CPR 3C Canonical",
      slug: `cpr-3c-canonical-${slugSuffix}`,
      description: "Initial durable service product.",
      lifecycle_state: "DISCOVERED",
      readiness: "UNKNOWN",
      sellability: "NEEDS_REVIEW",
      pricing_status: "NOT_DEFINED",
      margin_status: "NOT_DEFINED",
      commission_eligible_status: "UNKNOWN",
    });

    await service.updateDescriptiveMetadata(productId, {
      displayName: "CPR 3C Canonical Updated",
      description: "Durable descriptive update.",
      shortDescription: "Updated service product.",
    }, actor);
    await service.transitionLifecycle(productId, "DEFINED", { reason: "definition approved" }, actor);
    await assert.rejects(
      () => service.transitionLifecycle(productId, "ACTIVE", { reason: "skip required states" }, actor),
      /COMMERCIAL_PRODUCT_LIFECYCLE_TRANSITION_REJECTED/,
    );
    await service.reviewReadiness(productId, {
      readiness: "YELLOW",
      reason: "pilot evidence review",
      evaluatedByAuthority: "commercial-readiness-board",
      evidenceReferences: [sourceAuthority],
    }, actor);
    await service.reviewSellability(productId, {
      sellability: "PILOT",
      reason: "controlled pilot only",
      blockers: ["pricing"],
      restrictions: ["named pilots"],
      sourceAuthority,
    }, actor);
    await assert.rejects(
      () => service.manageReviewGate(productId, { gateType: "LEGAL", status: "APPROVED" }, actor),
      /REVIEW_GATE_APPROVAL_AUTHORITY_REQUIRED/,
    );
    await service.manageReviewGate(productId, {
      gateType: "LEGAL",
      status: "APPROVED",
      authority: "legal-runtime-authority",
      reference: `legal_ref_${suffix}`,
      reason: "approved by legal authority",
    }, actor);

    const source = await service.addSourceAuthority(productId, {
      sourceAuthorityType: "CURRICULUM",
      sourceDomain: "curriculum",
      sourceRecordId: `curriculum_cpr_3c_${suffix}`,
      sourceStatus: "FOUND",
      sourceProvenance: ["curriculum source proof"],
    }, actor);
    await service.addBuyerCompatibility(productId, "K12_SCHOOL", {
      status: "DOCUMENTED",
      limitations: ["district procurement review"],
      authoritySourceReferenceId: source.source_reference_id,
    }, actor);
    await service.addCommercialForm(productId, "TRAINING", {
      status: "POTENTIAL",
      limitations: ["metadata only"],
      authoritySourceReferenceId: source.source_reference_id,
    }, actor);
    await service.manageFundingRelationship(productId, {
      status: "POTENTIAL",
      category: "WORKFORCE_FUNDING",
      limitations: ["relationship metadata only"],
      provenance: ["no applicant qualification decision"],
      authoritySourceReferenceId: source.source_reference_id,
    }, actor);
    await assert.rejects(
      () => service.manageFundingRelationship(productId, { status: "VERIFIED", category: "GRANT", eligibilityStatus: "ELIGIBLE" }, actor),
      /FUNDING_ELIGIBILITY/,
    );
    await service.addEntitlementReference(productId, {
      entitlementId: `svc:studio:${suffix}`,
      requirement: "REQUIRED",
      entitlementAuthority: "ENTITLEMENTS",
      entitlementStatusReference: `entitlement-status:${suffix}`,
    }, actor);
    await service.addProductRelationship({
      relationshipId: `cpr_rel_3c_${suffix}`,
      sourceProductId: productId,
      targetProductId: relatedProductId,
      relationshipType: "ADD_ON",
      direction: "SOURCE_TO_TARGET",
      status: "ACTIVE",
      provenance: ["3C service acceptance"],
    }, actor);
    await assert.rejects(
      () => service.addProductRelationship({
        sourceProductId: productId,
        targetProductId: productId,
        relationshipType: "ADD_ON",
        direction: "SOURCE_TO_TARGET",
        status: "ACTIVE",
      }, actor),
      /PRODUCT_RELATIONSHIP_SELF_RELATION_INVALID/,
    );
    await service.updateRegulatedProgramMetadata(productId, {
      programTypes: ["HEALTHCARE"],
      regulatoryAuthority: "state board",
      externalTrainingAuthorityRequired: "PENDING",
      credentialAuthority: "external credential authority",
      partnerRequired: true,
      scopeLimitations: ["no licensure claim"],
      salesLanguageRestrictions: ["simulation only"],
    }, actor);
    await service.updateImplementationSupportMetadata(productId, {
      implementationRequired: "PENDING",
      implementationTier: "STANDARD",
      supportRequired: "APPROVED",
      supportTier: "ENHANCED",
      slaStatus: "UNKNOWN",
    }, actor);
    await service.updateRenewalExpansionMetadata(productId, {
      renewalModel: "ANNUAL",
      renewalTerm: "12 months",
      expansionPaths: [relatedProductId],
      upsellPaths: ["advanced-support"],
      crossSellPaths: ["reporting"],
    }, actor);
    await service.updateSocialSellingMetadata(productId, {
      approvedPublicMarketing: "PENDING",
      approvedSocialSharing: "BLOCKED",
      socialCampaignTags: ["pilot"],
      approvedTalkingPointsReference: `talking-points:${suffix}`,
      salesLanguageStatus: "RESTRICTED",
      brandRestrictions: ["no public guarantee"],
    }, actor);
    await service.updateGovernanceState(productId, {
      pricingStatus: "APPROVED",
      pricingModel: "reference only",
      pricingAuthority: "pricing-board",
      pricingReference: `pricing-ref:${suffix}`,
      marginStatus: "UNDER_REVIEW",
      costModelReference: `cost-ref:${suffix}`,
      commissionEligibleStatus: "UNDER_REVIEW",
      commissionPolicyReference: `commission-policy:${suffix}`,
      revenueClassifications: ["LICENSE"],
    }, actor);
    await assert.rejects(
      () => service.updateGovernanceState(productId, { priceAmount: 100 }, actor),
      /FINANCIAL_CALCULATION/,
    );
    await assert.rejects(
      () => service.updateGovernanceState(productId, { commissionRate: 0.2 }, actor),
      /COMMISSION_CALCULATION|FINANCIAL_CALCULATION/,
    );

    const persisted = await pool.query(
      `SELECT display_name, description, short_description, lifecycle_state, readiness,
              readiness_reason, readiness_authority, readiness_evidence_references,
              sellability, sellability_reason, sellability_blockers,
              sellability_restrictions, pricing_status, margin_status,
              commission_eligible_status
       FROM commercial_products
       WHERE commercial_product_id=$1`,
      [productId],
    );
    assert.equal(persisted.rows[0].display_name, "CPR 3C Canonical Updated");
    assert.equal(persisted.rows[0].description, "Durable descriptive update.");
    assert.equal(persisted.rows[0].short_description, "Updated service product.");
    assert.equal(persisted.rows[0].lifecycle_state, "DEFINED");
    assert.equal(persisted.rows[0].readiness, "YELLOW");
    assert.equal(persisted.rows[0].readiness_reason, "pilot evidence review");
    assert.equal(persisted.rows[0].readiness_authority, "commercial-readiness-board");
    assert.equal(persisted.rows[0].readiness_evidence_references[0].sourceAuthorityType, "SERVICE_CATALOG");
    assert.equal(persisted.rows[0].sellability, "PILOT");
    assert.equal(persisted.rows[0].sellability_reason, "controlled pilot only");
    assert.deepEqual(persisted.rows[0].sellability_blockers, ["pricing"]);
    assert.deepEqual(persisted.rows[0].sellability_restrictions, ["named pilots"]);
    assert.equal(persisted.rows[0].pricing_status, "APPROVED");
    assert.equal(persisted.rows[0].margin_status, "UNDER_REVIEW");
    assert.equal(persisted.rows[0].commission_eligible_status, "UNDER_REVIEW");

    const persistenceRows = await pool.query(
      `SELECT
        (SELECT COUNT(*)::int FROM commercial_product_source_authorities WHERE commercial_product_id=$1 AND source_status='FOUND') AS sources,
        (SELECT COUNT(*)::int FROM commercial_product_buyers WHERE commercial_product_id=$1 AND buyer_type IN ('EMPLOYER','K12_SCHOOL')) AS buyers,
        (SELECT COUNT(*)::int FROM commercial_product_forms WHERE commercial_product_id=$1 AND commercial_form IN ('SUBSCRIPTION','TRAINING')) AS forms,
        (SELECT COUNT(*)::int FROM commercial_product_review_gates WHERE commercial_product_id=$1 AND gate_type='LEGAL' AND status='APPROVED' AND authority='legal-runtime-authority') AS gates,
        (SELECT COUNT(*)::int FROM commercial_product_funding_relationships WHERE commercial_product_id=$1 AND funding_relationship_status='POTENTIAL' AND funding_category='WORKFORCE_FUNDING') AS funding,
        (SELECT COUNT(*)::int FROM commercial_product_entitlements WHERE commercial_product_id=$1 AND entitlement_authority='ENTITLEMENTS') AS entitlements,
        (SELECT COUNT(*)::int FROM commercial_product_relationships WHERE source_product_id=$1 AND target_product_id=$2 AND status='ACTIVE') AS relationships,
        (SELECT COUNT(*)::int FROM commercial_product_regulatory_metadata WHERE commercial_product_id=$1 AND regulatory_authority='state board' AND external_training_authority_required='PENDING') AS regulated,
        (SELECT COUNT(*)::int FROM commercial_product_implementation_support WHERE commercial_product_id=$1 AND implementation_required='PENDING' AND support_required='APPROVED') AS implementation,
        (SELECT COUNT(*)::int FROM commercial_product_renewal_expansion WHERE commercial_product_id=$1 AND renewal_model='ANNUAL') AS renewal,
        (SELECT COUNT(*)::int FROM commercial_product_social_selling WHERE commercial_product_id=$1 AND approved_social_sharing='BLOCKED' AND sales_language_status='RESTRICTED') AS social,
        (SELECT COUNT(*)::int FROM commercial_product_governance_state WHERE commercial_product_id=$1 AND pricing_model='reference only' AND commission_policy_reference=$3) AS governance`,
      [productId, relatedProductId, `commission-policy:${suffix}`],
    );
    assert.deepEqual(persistenceRows.rows[0], {
      sources: 2,
      buyers: 2,
      forms: 2,
      gates: 1,
      funding: 1,
      entitlements: 1,
      relationships: 1,
      regulated: 1,
      implementation: 1,
      renewal: 1,
      social: 1,
      governance: 1,
    });

    const boundaryColumns = await pool.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_name IN ('commercial_products', 'commercial_product_entitlements', 'commercial_product_funding_relationships', 'commercial_product_governance_state')
         AND column_name IN ('tenant_id', 'organization_id', 'eligibility_status', 'eligible', 'price_amount', 'unit_price', 'commission_rate', 'commission_amount')
       ORDER BY table_name, column_name`,
    );
    assert.deepEqual(boundaryColumns.rows, []);
    assert.equal(COMMERCIAL_PRODUCT_REGISTRY_SCOPE.identityScope, "GLOBAL_CANONICAL");

    const readModel = await service.projectSalesProductReadModel(actor);
    assert.equal(readModel.status.status, "CONNECTED");
    assert.ok(readModel.items.some((item: any) => item.commercialProductId === productId));

    const auditRows = await pool.query(
      `SELECT action_type, target_object_type, organization_id, actor_user_id, source_channel
       FROM audit_events
       WHERE organization_id=$1
         AND (target_object_id=$2 OR target_object_id IN (
           SELECT commercial_product_buyer_id FROM commercial_product_buyers WHERE commercial_product_id=$2
           UNION SELECT commercial_product_form_id FROM commercial_product_forms WHERE commercial_product_id=$2
           UNION SELECT relationship_id FROM commercial_product_relationships WHERE source_product_id=$2 OR target_product_id=$2
         ))
       ORDER BY event_timestamp ASC, created_at ASC`,
      [orgId, productId],
    );
    const actionTypes = auditRows.rows.map((row: any) => row.action_type);
    for (const action of [
      "commercial_product_registry.product_created",
      "commercial_product_registry.descriptive_updated",
      "commercial_product_registry.lifecycle_transitioned",
      "commercial_product_registry.readiness_reviewed",
      "commercial_product_registry.sellability_reviewed",
      "commercial_product_registry.review_gate_changed",
      "commercial_product_registry.source_authority_changed",
      "commercial_product_registry.buyer_form_changed",
      "commercial_product_registry.funding_relationship_changed",
      "commercial_product_registry.entitlement_reference_changed",
      "commercial_product_registry.relationship_changed",
      "commercial_product_registry.regulated_metadata_changed",
      "commercial_product_registry.implementation_support_changed",
      "commercial_product_registry.renewal_expansion_changed",
      "commercial_product_registry.social_selling_changed",
      "commercial_product_registry.governance_state_changed",
    ]) {
      assert.ok(actionTypes.includes(action), `missing audit action ${action}`);
    }
    assert.ok(auditRows.rows.every((row: any) => row.organization_id === orgId));
    assert.ok(auditRows.rows.every((row: any) => row.actor_user_id === actorId));
    assert.ok(auditRows.rows.every((row: any) => row.source_channel === "commercial-product-registry-service"));

    const candidateSeedRows = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM commercial_products
       WHERE commercial_product_id ~ '^cp_cc_0'
          OR canonical_name ILIKE ANY($1::text[])`,
      [["%Data Center & AI Infrastructure Curriculum Pathway%", "%Learning Arcade%", "%CivicSure%", "%Trusted Reporting%"]],
    );
    assert.equal(candidateSeedRows.rows[0].count, 0);
  } finally {
    await pool.query("DELETE FROM audit_events WHERE organization_id=$1", [orgId]);
    await pool.query("DELETE FROM commercial_product_relationships WHERE source_product_id = ANY($1::text[]) OR target_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_governance_state WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_social_selling WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_renewal_expansion WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_implementation_support WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_regulatory_metadata WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_entitlements WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_funding_relationships WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_review_gates WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_forms WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_buyers WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_product_source_authorities WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM commercial_products WHERE commercial_product_id = ANY($1::text[])", [[productId, relatedProductId]]);
    await pool.query("DELETE FROM users WHERE user_id=$1", [actorId]);
    await pool.query("DELETE FROM organizations WHERE organization_id=$1", [orgId]);
    await pool.end();
    await appPool.end();
  }
});
