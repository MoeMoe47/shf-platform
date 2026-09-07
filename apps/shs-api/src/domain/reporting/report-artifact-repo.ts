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
    product_key: row.product_key,
    report_family: row.report_family,
    classification: row.classification,
    canonical_input_manifest: row.canonical_input_manifest,
    generation_idempotency_key: row.generation_idempotency_key,
    artifact_version: row.artifact_version,
    lifecycle_status: row.lifecycle_status,
    content_hash: row.content_hash,
    report_type: row.report_type,
    report_version: row.report_version,
    jurisdiction: row.jurisdiction,
    subject_reference: row.subject_reference,
    reporting_period_start: row.reporting_period_start,
    reporting_period_end: row.reporting_period_end,
    reporting_period_label: row.reporting_period_label,
    ai_involvement: row.ai_involvement,
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
        content_hash, version, product_key, report_family
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,1,'GENERATED',NULL,1,$10,$11)
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
        input.product_key,
        input.report_family,
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

  async listArtifacts(scope: any, filters: any = {}, executor: any = { query }) {
    const params = [scope.tenant_id, scope.organization_id];
    const conditions = ["tenant_id = $1", "organization_id = $2"];
    if (filters.productKey) { params.push(filters.productKey); conditions.push(`product_key = $${params.length}`); }
    if (filters.reportFamily) { params.push(filters.reportFamily); conditions.push(`report_family = $${params.length}`); }
    const result = await executor.query(
      `SELECT * FROM report_artifacts
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC, artifact_id DESC`,
      params,
    );
    return result.rows.map(mapRow);
  }

  async updateR1Metadata(artifactId: string, metadata: any, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_artifacts SET
        report_type=$1, report_version=$2, jurisdiction=$3, subject_reference=$4,
        reporting_period_start=$5, reporting_period_end=$6, reporting_period_label=$7,
        ai_involvement=$8::jsonb, content_hash=$9, updated_at=NOW(), product_key=COALESCE($11, product_key), report_family=COALESCE($12, report_family)
       WHERE artifact_id=$10 RETURNING *`,
      [metadata.report_type, metadata.report_version, metadata.jurisdiction || null, metadata.subject_reference || null,
        metadata.reporting_period_start || null, metadata.reporting_period_end || null, metadata.reporting_period_label || null,
        JSON.stringify(metadata.ai_involvement || null), metadata.content_hash || null, artifactId, metadata.product_key || null, metadata.report_family || null],
    );
    return mapRow(result.rows[0]);
  }

  async createPayloadSnapshot(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_payload_snapshots (
        snapshot_id, artifact_id, tenant_id, organization_id, report_type, report_version, product_key, report_family,
        jurisdiction, subject_reference, reporting_period_start, reporting_period_end,
        reporting_period_label, generated_at, generated_by_user_id, classification,
        payload, payload_hash, canonical_reference_manifest, metric_definition_versions,
        verification_summary, ai_involvement
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,$18,$19::jsonb,$20::jsonb,$21::jsonb,$22::jsonb)
      RETURNING *`,
      [input.snapshot_id, input.artifact_id, input.tenant_id, input.organization_id, input.report_type, input.report_version, input.product_key, input.report_family,
        input.jurisdiction || null, input.subject_reference || null, input.reporting_period_start || null, input.reporting_period_end || null,
        input.reporting_period_label || null, input.generated_at, input.generated_by_user_id, input.classification,
        JSON.stringify(input.payload), input.payload_hash, JSON.stringify(input.canonical_reference_manifest),
        JSON.stringify(input.metric_definition_versions || []), JSON.stringify(input.verification_summary || {}), JSON.stringify(input.ai_involvement || null)],
    );
    return result.rows[0];
  }

  async createRenderedFile(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_rendered_files (
        rendered_file_id, artifact_id, snapshot_id, tenant_id, organization_id, format,
        mime_type, byte_length, content_hash, template_id, template_version,
        renderer_version, filename, storage_reference, classification, created_by_user_id, product_key, report_family
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *`,
      [input.rendered_file_id, input.artifact_id, input.snapshot_id, input.tenant_id, input.organization_id, input.format,
        input.mime_type, input.byte_length, input.content_hash, input.template_id, input.template_version,
        input.renderer_version, input.filename, input.storage_reference, input.classification, input.created_by_user_id, input.product_key, input.report_family],
    );
    return result.rows[0];
  }

  async getPayloadSnapshot(artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_payload_snapshots WHERE artifact_id=$1 AND tenant_id=$2 AND organization_id=$3 LIMIT 1`,
      [artifactId, scope.tenant_id, scope.organization_id],
    );
    return result.rows[0] || null;
  }

  async listRenderedFiles(artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_rendered_files WHERE artifact_id=$1 AND tenant_id=$2 AND organization_id=$3 ORDER BY created_at DESC`,
      [artifactId, scope.tenant_id, scope.organization_id],
    );
    return result.rows;
  }

  async getRenderedFile(fileId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT f.*, s.report_type, s.report_version, s.jurisdiction, s.reporting_period_label
       FROM report_rendered_files f JOIN report_payload_snapshots s ON s.snapshot_id=f.snapshot_id
       WHERE f.rendered_file_id=$1 AND f.tenant_id=$2 AND f.organization_id=$3 LIMIT 1`,
      [fileId, scope.tenant_id, scope.organization_id],
    );
    return result.rows[0] || null;
  }
}
