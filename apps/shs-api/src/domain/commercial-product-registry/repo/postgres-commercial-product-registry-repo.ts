import { query } from "../../../db/client.js";
import type {
  BuyerCompatibilityRecord,
  CommercialFormRecord,
  CommercialProductCore,
  CommercialProductMetadataUpdate,
  CommercialProductRegistryRepository,
  ProductRegistryExecutor,
  ProductRegistryListFilters,
  ProductRelationshipRecord,
  ReviewGateRecord,
  SourceAuthorityRecord,
} from "./commercial-product-registry-repository.js";
import type { ProductLifecycleState, ReadinessState, SellabilityStatus } from "../model/commercial-product-registry-contract.js";

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

  async updateReadiness(commercialProductId: string, readiness: ReadinessState, reason: string, authority?: string | null, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET readiness=$2, readiness_reason=$3, readiness_authority=$4,
           readiness_evaluated_at=NOW(), updated_at=NOW(), version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [commercialProductId, readiness, reason, authority || null],
    );
    return res.rows[0] || null;
  }

  async updateSellability(commercialProductId: string, sellability: SellabilityStatus, reason: string, authority?: string | null, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      `UPDATE commercial_products
       SET sellability=$2, sellability_reason=$3, sellability_authority=$4,
           sellability_evaluated_at=NOW(), updated_at=NOW(), version=version+1
       WHERE commercial_product_id=$1 AND archived_at IS NULL
       RETURNING *`,
      [commercialProductId, sellability, reason, authority || null],
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

  async listFundingRelationships(commercialProductId: string, executor?: ProductRegistryExecutor) {
    const res = await db(executor).query(
      "SELECT * FROM commercial_product_funding_relationships WHERE commercial_product_id=$1 ORDER BY funding_category ASC",
      [commercialProductId],
    );
    return res.rows;
  }
}
