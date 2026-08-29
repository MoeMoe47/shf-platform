import { query } from "../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    artifact_id: row.artifact_id,
    artifactId: row.artifact_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    created_by_user_id: row.created_by_user_id,
    createdBy: row.created_by_user_id,
    composition_type: row.composition_type,
    composition_version: row.composition_version,
    classification: row.classification,
    canonical_input_manifest: row.canonical_input_manifest,
    generation_idempotency_key: row.generation_idempotency_key,
    artifact_version: row.artifact_version,
    lifecycle_status: row.lifecycle_status,
    content_hash: row.content_hash,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class ReportArtifactRepo {
  async createArtifact(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_artifacts (
        artifact_id, tenant_id, organization_id, created_by_user_id,
        composition_type, composition_version, classification,
        canonical_input_manifest, generation_idempotency_key, artifact_version, lifecycle_status,
        content_hash, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,1,'GENERATED',NULL,1)
      RETURNING *`,
      [
        input.artifact_id,
        input.tenant_id,
        input.organization_id,
        input.actor_id,
        input.composition_type,
        input.composition_version,
        input.classification,
        JSON.stringify(input.canonical_input_manifest),
        input.generation_idempotency_key || null,
      ],
    );
    return mapRow(result.rows[0]);
  }

  async findByGenerationIdempotencyKey(key: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_artifacts
       WHERE generation_idempotency_key = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [key, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async getArtifact(artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_artifacts
       WHERE artifact_id = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [artifactId, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async listArtifacts(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_artifacts
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY created_at DESC, artifact_id DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapRow);
  }
}
