import { query } from "../../../db/client.js";
import type { ProductRegistryExecutor } from "../repo/commercial-product-registry-repository.js";

function db(executor?: ProductRegistryExecutor): ProductRegistryExecutor {
  return executor || { query };
}

export class PostgresCommercialProductReviewRepo {
  async lockStream(candidateId: string, stream: string, executor: ProductRegistryExecutor) {
    await executor.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`cpr-review:${candidateId}:${stream}`]);
  }

  async getDecisionById(id: string, executor?: ProductRegistryExecutor) {
    const result = await db(executor).query("SELECT * FROM commercial_product_review_decisions WHERE review_decision_id=$1", [id]);
    return result.rows[0] || null;
  }

  async getLatestDecision(candidateId: string, gateType: string, executor?: ProductRegistryExecutor, lock = false) {
    const result = await db(executor).query(`SELECT * FROM commercial_product_review_decisions WHERE candidate_id=$1 AND gate_type=$2 ORDER BY version DESC LIMIT 1${lock ? " FOR UPDATE" : ""}`, [candidateId, gateType]);
    return result.rows[0] || null;
  }

  async listDecisionHistory(candidateId: string, gateType?: string, executor?: ProductRegistryExecutor) {
    const result = await db(executor).query(`SELECT * FROM commercial_product_review_decisions WHERE candidate_id=$1${gateType ? " AND gate_type=$2" : ""} ORDER BY gate_type, version`, gateType ? [candidateId, gateType] : [candidateId]);
    return result.rows;
  }

  async listDecisionHistoryPage(candidateId: string, options: { gateType?: string; limit: number; offset: number }, executor?: ProductRegistryExecutor) {
    const client = db(executor);
    const values = options.gateType ? [candidateId, options.gateType, options.limit, options.offset] : [candidateId, options.limit, options.offset];
    const filter = options.gateType ? " AND gate_type=$2" : "";
    const limitParam = options.gateType ? "$3" : "$2";
    const offsetParam = options.gateType ? "$4" : "$3";
    const [items, count] = await Promise.all([
      client.query(`SELECT * FROM commercial_product_review_decisions WHERE candidate_id=$1${filter} ORDER BY gate_type, version DESC LIMIT ${limitParam} OFFSET ${offsetParam}`, values),
      client.query(`SELECT count(*)::int AS total FROM commercial_product_review_decisions WHERE candidate_id=$1${options.gateType ? " AND gate_type=$2" : ""}`, options.gateType ? [candidateId, options.gateType] : [candidateId]),
    ]);
    return { items: items.rows, total: count.rows[0]?.total || 0 };
  }

  async insertDecision(input: any, executor: ProductRegistryExecutor) {
    const result = await executor.query(
      `INSERT INTO commercial_product_review_decisions (
        review_decision_id,candidate_id,commercial_product_id,gate_type,decision_status,decision_reason,
        authority_type,authority_reference,evidence_references,reviewer_actor_id,reviewer_org_id,
        effective_at,reviewed_at,expires_at,stale_at,supersedes_decision_id,version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [input.review_decision_id,input.candidate_id,input.commercial_product_id,input.gate_type,input.decision_status,input.decision_reason,input.authority_type,input.authority_reference,JSON.stringify(input.evidence_references),input.reviewer_actor_id,input.reviewer_org_id,input.effective_at,input.reviewed_at,input.expires_at,input.stale_at,input.supersedes_decision_id,input.version],
    );
    return result.rows[0];
  }

  async getSourceResolutionById(id: string, executor?: ProductRegistryExecutor) {
    const result = await db(executor).query("SELECT * FROM commercial_product_source_resolutions WHERE source_resolution_id=$1", [id]);
    return result.rows[0] || null;
  }

  async getLatestSourceResolution(candidateId: string, executor?: ProductRegistryExecutor, lock = false) {
    const result = await db(executor).query(`SELECT * FROM commercial_product_source_resolutions WHERE candidate_id=$1 ORDER BY version DESC LIMIT 1${lock ? " FOR UPDATE" : ""}`, [candidateId]);
    return result.rows[0] || null;
  }

  async listSourceResolutionHistory(candidateId: string, executor?: ProductRegistryExecutor) {
    const result = await db(executor).query("SELECT * FROM commercial_product_source_resolutions WHERE candidate_id=$1 ORDER BY version", [candidateId]);
    return result.rows;
  }

  async listSourceResolutionHistoryPage(candidateId: string, options: { limit: number; offset: number }, executor?: ProductRegistryExecutor) {
    const client = db(executor);
    const [items, count] = await Promise.all([
      client.query("SELECT * FROM commercial_product_source_resolutions WHERE candidate_id=$1 ORDER BY version DESC LIMIT $2 OFFSET $3", [candidateId, options.limit, options.offset]),
      client.query("SELECT count(*)::int AS total FROM commercial_product_source_resolutions WHERE candidate_id=$1", [candidateId]),
    ]);
    return { items: items.rows, total: count.rows[0]?.total || 0 };
  }

  async insertSourceResolution(input: any, executor: ProductRegistryExecutor) {
    const result = await executor.query(
      `INSERT INTO commercial_product_source_resolutions (
        source_resolution_id,candidate_id,commercial_product_id,resolution_status,authority_domain,
        authority_reference,authority_version,evidence_reference,resolved_by_actor,resolved_by_org,
        resolved_at,resolution_reason,remaining_requirements,supersedes_resolution_id,version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15) RETURNING *`,
      [input.source_resolution_id,input.candidate_id,input.commercial_product_id,input.resolution_status,input.authority_domain,input.authority_reference,input.authority_version,input.evidence_reference,input.resolved_by_actor,input.resolved_by_org,input.resolved_at,input.resolution_reason,JSON.stringify(input.remaining_requirements),input.supersedes_resolution_id,input.version],
    );
    return result.rows[0];
  }
}
