import { query } from "../../../db/client.js";
import type {
  BuyerCompatibilityRecord,
  CommercialFormRecord,
  CommercialProductCore,
  CommercialProductMetadataUpdate,
  CommercialProductRegistryRepository,
  EntitlementRecord,
  FundingRelationshipRecord,
  GovernanceStateRecord,
  ImplementationSupportRecord,
  ProductRegistryExecutor,
  ProductRegistryListFilters,
  ProductRelationshipRecord,
  RegulatedProgramRecord,
  RenewalExpansionRecord,
  ReviewGateRecord,
  SocialSellingRecord,
  SourceAuthorityRecord,
} from "./commercial-product-registry-repository.js";
import type { CommercialForm, ProductLifecycleState, ReadinessState, SellabilityStatus, SourceAuthorityStatus } from "../model/commercial-product-registry-contract.js";

function db(executor?: ProductRegistryExecutor): ProductRegistryExecutor {
  return executor || { query };
}

function json(value: unknown) {
  return JSON.stringify(value ?? []);
}

export class PostgresCommercialProductRegistryRepo implements CommercialProductRegistryRepository {
  async createProduct(input: CommercialProductCore, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_products (
        commercial_product_id, canonical_name, display_name, slug, commercial_family,
        subfamily, product_type, description, short_description, version, status,
        lifecycle_state, readiness, readiness_reason, readiness_authority,
        sellability, sellability_reason, sellability_authority,
        selling_entity, delivery_entity, partner_required, partner_type,
        joint_structure_required, pricing_status, margin_status,
        commission_eligible_status, renewal_model, last_verified_at,
        created_by, updated_by
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,1),COALESCE($11,'ACTIVE'),
        COALESCE($12,'DISCOVERED'),COALESCE($13,'UNKNOWN'),$14,$15,
        COALESCE($16,'NEEDS_REVIEW'),$17,$18,
        COALESCE($19,'UNKNOWN'),COALESCE($20,'UNKNOWN'),COALESCE($21,false),$22,
        COALESCE($23,false),COALESCE($24,'NOT_DEFINED'),COALESCE($25,'NOT_DEFINED'),
        COALESCE($26,'UNKNOWN'),COALESCE($27,'UNKNOWN'),$28,$29,$30
      )
      RETURNING *`,
      [
        input.commercial_product_id, input.canonical_name, input.display_name, input.slug,
        input.commercial_family, input.subfamily || null, input.product_type,
        input.description || null, input.short_description || null, input.version || null,
        input.status || null, input.lifecycle_state || null, input.readiness || null,
        input.readiness_reason || null, input.readiness_authority || null,
        input.sellability || null, input.sellability_reason || null,
        input.sellability_authority || null, input.selling_entity || null,
        input.delivery_entity || null, input.partner_required ?? null, input.partner_type || null,
        input.joint_structure_required ?? null, input.pricing_status || null,
        input.margin_status || null, input.commission_eligible_status || null,
        input.renewal_model || null, input.last_verified_at || null, input.created_by || null,
        input.updated_by || input.created_by || null,
      ],
    );
    return res.rows[0];
  }

  async getProductById(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_products WHERE commercial_product_id=$1 AND archived_at IS NULL LIMIT 1",
      [commercialProductId],
    );
    return res.rows[0] || null;
  }

  async getProductBySlug(slug: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_products WHERE slug=$1 AND archived_at IS NULL LIMIT 1",
      [slug],
    );
    return res.rows[0] || null;
  }

  async listProducts(filters: ProductRegistryListFilters = {}, executor?: ProductRegistryExecutor) {
    const clauses = ["archived_at IS NULL"];
    const params: unknown[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      params.push(value);
      clauses.push(`${key}=$${params.length}`);
    }
    const res = await db(executor).query(
      `SELECT * FROM commercial_products WHERE ${clauses.join(" AND ")} ORDER BY updated_at DESC, created_at DESC`,
      params,
    );
    return res.rows;
  }

  async updateDescriptiveMetadata(commercialProductId: string, input: CommercialProductMetadataUpdate, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET canonical_name=COALESCE($2, canonical_name),
           display_name=COALESCE($3, display_name),
           slug=COALESCE($4, slug),
           subfamily=COALESCE($5, subfamily),
           description=COALESCE($6, description),
           short_description=COALESCE($7, short_description),
           updated_by=COALESCE($8, updated_by),
           updated_at=NOW(),
           version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [
        commercialProductId, input.canonical_name || null, input.display_name || null,
        input.slug || null, input.subfamily || null, input.description || null,
        input.short_description || null, input.updated_by || null,
      ],
    );
    return res.rows[0] || null;
  }

  async updateLifecycle(commercialProductId: string, lifecycleState: ProductLifecycleState, actorId?: string | null, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET lifecycle_state=$2, updated_by=COALESCE($3, updated_by), updated_at=NOW(), version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [commercialProductId, lifecycleState, actorId || null],
    );
    return res.rows[0] || null;
  }

  async updateReadiness(commercialProductId: string, readiness: ReadinessState, reason: string, authority?: string | null, evidenceReferences: unknown = [], staleAfter?: Date | string | null, executor?: ProductRegistryExecutor) {
    if (evidenceReferences && typeof evidenceReferences === "object" && "query" in (evidenceReferences as any) && executor === undefined) {
      executor = evidenceReferences as ProductRegistryExecutor;
      evidenceReferences = [];
      staleAfter = null;
    }
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET readiness=$2, readiness_reason=$3, readiness_authority=$4,
           readiness_evidence_references=$5::jsonb, readiness_evaluated_at=NOW(),
           readiness_stale_after=$6, updated_at=NOW(), version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [commercialProductId, readiness, reason, authority || null, json(evidenceReferences), staleAfter || null],
    );
    return res.rows[0] || null;
  }

  async updateSellability(commercialProductId: string, sellability: SellabilityStatus, reason: string, authority?: string | null, blockers: readonly string[] = [], restrictions: readonly string[] = [], effectiveFrom?: Date | string | null, effectiveTo?: Date | string | null, staleAfter?: Date | string | null, sourceAuthorityReferenceId?: string | null, executor?: ProductRegistryExecutor) {
    if (blockers && typeof blockers === "object" && "query" in (blockers as any) && executor === undefined) {
      executor = blockers as unknown as ProductRegistryExecutor;
      blockers = [];
      restrictions = [];
      effectiveFrom = null;
      effectiveTo = null;
      staleAfter = null;
      sourceAuthorityReferenceId = null;
    }
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET sellability=$2, sellability_reason=$3, sellability_authority=$4,
           sellability_blockers=$5::jsonb, sellability_restrictions=$6::jsonb,
           sellability_effective_from=$7, sellability_effective_to=$8,
           sellability_stale_after=$9, sellability_source_authority_id=$10,
           sellability_evaluated_at=NOW(), updated_at=NOW(), version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [commercialProductId, sellability, reason, authority || null, json(blockers), json(restrictions), effectiveFrom || null, effectiveTo || null, staleAfter || null, sourceAuthorityReferenceId || null],
    );
    return res.rows[0] || null;
  }

  async listSourceAuthorities(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_source_authorities WHERE commercial_product_id=$1 ORDER BY created_at ASC",
      [commercialProductId],
    );
    return res.rows;
  }

  async addSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_source_authorities (
        source_reference_id, commercial_product_id, source_authority_type, source_authority_id,
        source_domain, source_record_id, source_version, source_status,
        source_last_verified_at, source_provenance
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      RETURNING *`,
      [
        input.source_reference_id, input.commercial_product_id, input.source_authority_type,
        input.source_authority_id || null, input.source_domain || null, input.source_record_id,
        input.source_version || null, input.source_status, input.source_last_verified_at || null,
        json(input.source_provenance),
      ],
    );
    return res.rows[0];
  }

  async replaceSourceAuthority(input: SourceAuthorityRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_source_authorities (
        source_reference_id, commercial_product_id, source_authority_type, source_authority_id,
        source_domain, source_record_id, source_version, source_status,
        source_last_verified_at, source_provenance
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
      ON CONFLICT (commercial_product_id, source_authority_type, COALESCE(source_domain, ''), source_record_id, COALESCE(source_version, ''))
      DO UPDATE SET
        source_authority_id=EXCLUDED.source_authority_id,
        source_status=EXCLUDED.source_status,
        source_last_verified_at=EXCLUDED.source_last_verified_at,
        source_provenance=EXCLUDED.source_provenance,
        updated_at=NOW()
      RETURNING *`,
      [
        input.source_reference_id, input.commercial_product_id, input.source_authority_type,
        input.source_authority_id || null, input.source_domain || null, input.source_record_id,
        input.source_version || null, input.source_status, input.source_last_verified_at || null,
        json(input.source_provenance),
      ],
    );
    return res.rows[0];
  }

  async deactivateSourceAuthority(sourceReferenceId: string, status: SourceAuthorityStatus, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_product_source_authorities
       SET source_status=$2, updated_at=NOW()
       WHERE source_reference_id=$1
       RETURNING *`,
      [sourceReferenceId, status],
    );
    return res.rows[0] || null;
  }

  async listBuyers(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_buyers WHERE commercial_product_id=$1 ORDER BY buyer_type ASC",
      [commercialProductId],
    );
    return res.rows;
  }

  async addBuyerCompatibility(input: BuyerCompatibilityRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_buyers (
        commercial_product_buyer_id, commercial_product_id, buyer_type, status,
        authority_source_reference_id, limitations
      ) VALUES ($1,$2,$3,COALESCE($4,'UNKNOWN'),$5,$6::jsonb)
      RETURNING *`,
      [
        input.commercial_product_buyer_id, input.commercial_product_id, input.buyer_type,
        input.status || null, input.authority_source_reference_id || null, json(input.limitations),
      ],
    );
    return res.rows[0];
  }

  async removeBuyerCompatibility(commercialProductId: string, buyerType: any, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `DELETE FROM commercial_product_buyers
       WHERE commercial_product_id=$1 AND buyer_type=$2
       RETURNING *`,
      [commercialProductId, buyerType],
    );
    return res.rows[0] || null;
  }

  async listCommercialForms(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_forms WHERE commercial_product_id=$1 ORDER BY commercial_form ASC",
      [commercialProductId],
    );
    return res.rows;
  }

  async addCommercialForm(input: CommercialFormRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_forms (
        commercial_product_form_id, commercial_product_id, commercial_form, status,
        authority_source_reference_id, limitations
      ) VALUES ($1,$2,$3,COALESCE($4,'UNKNOWN'),$5,$6::jsonb)
      RETURNING *`,
      [
        input.commercial_product_form_id, input.commercial_product_id, input.commercial_form,
        input.status || null, input.authority_source_reference_id || null, json(input.limitations),
      ],
    );
    return res.rows[0];
  }

  async removeCommercialForm(commercialProductId: string, commercialForm: CommercialForm, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `DELETE FROM commercial_product_forms
       WHERE commercial_product_id=$1 AND commercial_form=$2
       RETURNING *`,
      [commercialProductId, commercialForm],
    );
    return res.rows[0] || null;
  }

  async listGates(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_review_gates WHERE commercial_product_id=$1 ORDER BY gate_type ASC",
      [commercialProductId],
    );
    return res.rows;
  }

  async addReviewGate(input: ReviewGateRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_review_gates (
        commercial_product_gate_id, commercial_product_id, gate_type, status,
        authority, reference, reason, reviewed_at, expires_at, stale_after
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (commercial_product_id, gate_type)
      DO UPDATE SET status=EXCLUDED.status, authority=EXCLUDED.authority,
        reference=EXCLUDED.reference, reason=EXCLUDED.reason,
        reviewed_at=EXCLUDED.reviewed_at, expires_at=EXCLUDED.expires_at,
        stale_after=EXCLUDED.stale_after, updated_at=NOW()
      RETURNING *`,
      [
        input.commercial_product_gate_id, input.commercial_product_id, input.gate_type,
        input.status, input.authority || null, input.reference || null, input.reason || null,
        input.reviewed_at || null, input.expires_at || null, input.stale_after || null,
      ],
    );
    return res.rows[0];
  }

  async listRelationships(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `SELECT * FROM commercial_product_relationships
       WHERE source_product_id=$1 OR target_product_id=$1
       ORDER BY created_at ASC`,
      [commercialProductId],
    );
    return res.rows;
  }

  async addProductRelationship(input: ProductRelationshipRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_relationships (
        relationship_id, source_product_id, target_product_id, relationship_type,
        direction, status, effective_from, effective_to, source_authority_reference_id, provenance
      ) VALUES ($1,$2,$3,$4,$5,COALESCE($6,'UNKNOWN'),$7,$8,$9,$10::jsonb)
      RETURNING *`,
      [
        input.relationship_id, input.source_product_id, input.target_product_id,
        input.relationship_type, input.direction, input.status || null, input.effective_from || null,
        input.effective_to || null, input.source_authority_reference_id || null, json(input.provenance),
      ],
    );
    return res.rows[0];
  }

  async deactivateProductRelationship(relationshipId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_product_relationships
       SET status='RETIRED', updated_at=NOW()
       WHERE relationship_id=$1
       RETURNING *`,
      [relationshipId],
    );
    return res.rows[0] || null;
  }

  async listFundingRelationships(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_funding_relationships WHERE commercial_product_id=$1 ORDER BY funding_category ASC",
      [commercialProductId],
    );
    return res.rows;
  }

  async addFundingRelationship(input: FundingRelationshipRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_funding_relationships (
        commercial_product_funding_id, commercial_product_id, funding_relationship_status,
        funding_category, authority_source_reference_id, limitations, provenance
      ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)
      ON CONFLICT (commercial_product_id, funding_category)
      DO UPDATE SET funding_relationship_status=EXCLUDED.funding_relationship_status,
        authority_source_reference_id=EXCLUDED.authority_source_reference_id,
        limitations=EXCLUDED.limitations, provenance=EXCLUDED.provenance, updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_funding_id, input.commercial_product_id, input.funding_relationship_status, input.funding_category, input.authority_source_reference_id || null, json(input.limitations), json(input.provenance)],
    );
    return res.rows[0];
  }

  async listEntitlements(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_entitlements WHERE commercial_product_id=$1 ORDER BY entitlement_requirement, entitlement_id",
      [commercialProductId],
    );
    return res.rows;
  }

  async addEntitlementReference(input: EntitlementRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_entitlements (
        commercial_product_entitlement_id, commercial_product_id, entitlement_id,
        entitlement_requirement, entitlement_authority, entitlement_status_reference
      ) VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (commercial_product_id, entitlement_requirement, entitlement_id)
      DO UPDATE SET entitlement_authority=EXCLUDED.entitlement_authority,
        entitlement_status_reference=EXCLUDED.entitlement_status_reference, updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_entitlement_id, input.commercial_product_id, input.entitlement_id, input.entitlement_requirement, input.entitlement_authority || null, input.entitlement_status_reference || null],
    );
    return res.rows[0];
  }

  async removeEntitlementReference(commercialProductId: string, entitlementId: string, requirement: "REQUIRED" | "OPTIONAL", executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `DELETE FROM commercial_product_entitlements
       WHERE commercial_product_id=$1 AND entitlement_id=$2 AND entitlement_requirement=$3
       RETURNING *`,
      [commercialProductId, entitlementId, requirement],
    );
    return res.rows[0] || null;
  }

  async getRegulatedProgramMetadata(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query("SELECT * FROM commercial_product_regulatory_metadata WHERE commercial_product_id=$1", [commercialProductId]);
    return res.rows[0] || null;
  }

  async upsertRegulatedProgramMetadata(input: RegulatedProgramRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_regulatory_metadata (
        commercial_product_id, program_types, regulatory_authority,
        external_training_authority_required, credential_authority, partner_required,
        scope_limitations, sales_language_restrictions
      ) VALUES ($1,$2::jsonb,$3,COALESCE($4,'UNKNOWN'),$5,COALESCE($6,false),$7::jsonb,$8::jsonb)
      ON CONFLICT (commercial_product_id) DO UPDATE SET
        program_types=EXCLUDED.program_types, regulatory_authority=EXCLUDED.regulatory_authority,
        external_training_authority_required=EXCLUDED.external_training_authority_required,
        credential_authority=EXCLUDED.credential_authority, partner_required=EXCLUDED.partner_required,
        scope_limitations=EXCLUDED.scope_limitations,
        sales_language_restrictions=EXCLUDED.sales_language_restrictions, updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_id, json(input.program_types), input.regulatory_authority || null, input.external_training_authority_required || null, input.credential_authority || null, input.partner_required ?? null, json(input.scope_limitations), json(input.sales_language_restrictions)],
    );
    return res.rows[0];
  }

  async getImplementationSupport(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query("SELECT * FROM commercial_product_implementation_support WHERE commercial_product_id=$1", [commercialProductId]);
    return res.rows[0] || null;
  }

  async upsertImplementationSupport(input: ImplementationSupportRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_implementation_support (
        commercial_product_id, implementation_required, implementation_tier,
        implementation_owner, support_required, support_tier, managed_service_available,
        sla_status, training_required, professional_development_available
      ) VALUES ($1,COALESCE($2,'UNKNOWN'),COALESCE($3,'UNKNOWN'),$4,COALESCE($5,'UNKNOWN'),COALESCE($6,'UNKNOWN'),COALESCE($7,'UNKNOWN'),COALESCE($8,'UNKNOWN'),COALESCE($9,'UNKNOWN'),COALESCE($10,'UNKNOWN'))
      ON CONFLICT (commercial_product_id) DO UPDATE SET
        implementation_required=EXCLUDED.implementation_required,
        implementation_tier=EXCLUDED.implementation_tier,
        implementation_owner=EXCLUDED.implementation_owner,
        support_required=EXCLUDED.support_required, support_tier=EXCLUDED.support_tier,
        managed_service_available=EXCLUDED.managed_service_available,
        sla_status=EXCLUDED.sla_status, training_required=EXCLUDED.training_required,
        professional_development_available=EXCLUDED.professional_development_available,
        updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_id, input.implementation_required || null, input.implementation_tier || null, input.implementation_owner || null, input.support_required || null, input.support_tier || null, input.managed_service_available || null, input.sla_status || null, input.training_required || null, input.professional_development_available || null],
    );
    return res.rows[0];
  }

  async getRenewalExpansion(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query("SELECT * FROM commercial_product_renewal_expansion WHERE commercial_product_id=$1", [commercialProductId]);
    return res.rows[0] || null;
  }

  async upsertRenewalExpansion(input: RenewalExpansionRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_renewal_expansion (
        commercial_product_id, renewal_model, renewal_term, renewal_window,
        expansion_paths, upsell_paths, cross_sell_paths
      ) VALUES ($1,COALESCE($2,'UNKNOWN'),$3,$4,$5::jsonb,$6::jsonb,$7::jsonb)
      ON CONFLICT (commercial_product_id) DO UPDATE SET
        renewal_model=EXCLUDED.renewal_model, renewal_term=EXCLUDED.renewal_term,
        renewal_window=EXCLUDED.renewal_window, expansion_paths=EXCLUDED.expansion_paths,
        upsell_paths=EXCLUDED.upsell_paths, cross_sell_paths=EXCLUDED.cross_sell_paths,
        updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_id, input.renewal_model || null, input.renewal_term || null, input.renewal_window || null, json(input.expansion_paths), json(input.upsell_paths), json(input.cross_sell_paths)],
    );
    return res.rows[0];
  }

  async getSocialSelling(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query("SELECT * FROM commercial_product_social_selling WHERE commercial_product_id=$1", [commercialProductId]);
    return res.rows[0] || null;
  }

  async upsertSocialSelling(input: SocialSellingRecord, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `INSERT INTO commercial_product_social_selling (
        commercial_product_id, approved_public_marketing, approved_social_sharing,
        social_campaign_tags, approved_talking_points_reference, sales_language_status,
        brand_restrictions
      ) VALUES ($1,COALESCE($2,'UNKNOWN'),COALESCE($3,'UNKNOWN'),$4::jsonb,$5,COALESCE($6,'UNKNOWN'),$7::jsonb)
      ON CONFLICT (commercial_product_id) DO UPDATE SET
        approved_public_marketing=EXCLUDED.approved_public_marketing,
        approved_social_sharing=EXCLUDED.approved_social_sharing,
        social_campaign_tags=EXCLUDED.social_campaign_tags,
        approved_talking_points_reference=EXCLUDED.approved_talking_points_reference,
        sales_language_status=EXCLUDED.sales_language_status,
        brand_restrictions=EXCLUDED.brand_restrictions,
        updated_at=NOW()
      RETURNING *`,
      [input.commercial_product_id, input.approved_public_marketing || null, input.approved_social_sharing || null, json(input.social_campaign_tags), input.approved_talking_points_reference || null, input.sales_language_status || null, json(input.brand_restrictions)],
    );
    return res.rows[0];
  }

  async getGovernanceState(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query("SELECT * FROM commercial_product_governance_state WHERE commercial_product_id=$1", [commercialProductId]);
    return res.rows[0] || null;
  }

  async upsertGovernanceState(input: GovernanceStateRecord, executor?: ProductRegistryExecutor) {
    if (input.pricing_status || input.margin_status || input.commission_eligible_status) {
      await db(executor).query(
        `UPDATE commercial_products
         SET pricing_status=COALESCE($2, pricing_status),
             margin_status=COALESCE($3, margin_status),
             commission_eligible_status=COALESCE($4, commission_eligible_status),
             updated_at=NOW(), version=version+1
         WHERE commercial_product_id=$1 AND archived_at IS NULL`,
        [input.commercial_product_id, input.pricing_status || null, input.margin_status || null, input.commission_eligible_status || null],
      );
    }
    const res = await db(executor).query(
      `INSERT INTO commercial_product_governance_state (
        commercial_product_id, pricing_model, pricing_authority, pricing_reference,
        price_effective_from, price_effective_to, currency, discount_policy_reference,
        cost_model_reference, gross_margin_class, minimum_margin_policy,
        commercial_viability_status, commission_policy_reference,
        leadership_override_eligible, renewal_commission_eligible,
        expansion_commission_eligible, revenue_classifications
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,'UNKNOWN'),$13,COALESCE($14,'UNKNOWN'),COALESCE($15,'UNKNOWN'),COALESCE($16,'UNKNOWN'),$17::jsonb)
      ON CONFLICT (commercial_product_id) DO UPDATE SET
        pricing_model=EXCLUDED.pricing_model, pricing_authority=EXCLUDED.pricing_authority,
        pricing_reference=EXCLUDED.pricing_reference, price_effective_from=EXCLUDED.price_effective_from,
        price_effective_to=EXCLUDED.price_effective_to, currency=EXCLUDED.currency,
        discount_policy_reference=EXCLUDED.discount_policy_reference,
        cost_model_reference=EXCLUDED.cost_model_reference,
        gross_margin_class=EXCLUDED.gross_margin_class,
        minimum_margin_policy=EXCLUDED.minimum_margin_policy,
        commercial_viability_status=EXCLUDED.commercial_viability_status,
        commission_policy_reference=EXCLUDED.commission_policy_reference,
        leadership_override_eligible=EXCLUDED.leadership_override_eligible,
        renewal_commission_eligible=EXCLUDED.renewal_commission_eligible,
        expansion_commission_eligible=EXCLUDED.expansion_commission_eligible,
        revenue_classifications=EXCLUDED.revenue_classifications, updated_at=NOW()
      RETURNING *`,
      [
        input.commercial_product_id, input.pricing_model || null, input.pricing_authority || null,
        input.pricing_reference || null, input.price_effective_from || null, input.price_effective_to || null,
        input.currency || null, input.discount_policy_reference || null, input.cost_model_reference || null,
        input.gross_margin_class || null, input.minimum_margin_policy || null,
        input.commercial_viability_status || null, input.commission_policy_reference || null,
        input.leadership_override_eligible || null, input.renewal_commission_eligible || null,
        input.expansion_commission_eligible || null, json(input.revenue_classifications),
      ],
    );
    return res.rows[0];
  }
}
