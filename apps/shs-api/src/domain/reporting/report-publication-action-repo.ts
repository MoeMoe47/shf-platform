import { query } from "../../db/client";

function mapPublication(row: any) {
  if (!row) return null;
  return {
    publication_id: row.publication_id,
    publication_authorization_id: row.publication_authorization_id,
    public_snapshot_id: row.public_snapshot_id,
    snapshot_version: row.snapshot_version,
    snapshot_hash: row.snapshot_hash,
    report_id: row.report_id,
    report_version: row.report_version,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    publication_status: row.publication_status,
    published_by_user_id: row.published_by_user_id,
    published_at: row.published_at,
    projection_reference: row.projection_reference,
    idempotency_key: row.idempotency_key,
    created_at: row.created_at,
    version: row.version,
  };
}

function mapProjection(row: any) {
  if (!row) return null;
  return {
    projection_id: row.projection_id,
    publication_id: row.publication_id,
    public_snapshot_id: row.public_snapshot_id,
    snapshot_version: row.snapshot_version,
    snapshot_hash: row.snapshot_hash,
    report_id: row.report_id,
    report_version: row.report_version,
    metric_label: row.metric_label,
    reporting_period_start: row.reporting_period_start,
    reporting_period_end: row.reporting_period_end,
    reporting_period: row.reporting_period,
    reporting_period_label: row.reporting_period_label,
    data_as_of: row.data_as_of,
    geography_level: row.geography_level,
    program_granularity: row.program_granularity,
    public_representation_type: row.public_representation_type,
    public_display_value: row.public_display_value,
    suppression_state: row.suppression_state,
    source_type: row.source_type,
    projection_status: row.projection_status,
    published_at: row.published_at,
    created_at: row.created_at,
    version: row.version,
  };
}

function mapPublicProjection(row: any) {
  if (!row) return null;
  return {
    report_id: row.report_id,
    report_version: row.report_version,
    metric_label: row.metric_label,
    reporting_period_start: row.reporting_period_start,
    reporting_period_end: row.reporting_period_end,
    reporting_period: row.reporting_period,
    reporting_period_label: row.reporting_period_label,
    data_as_of: row.data_as_of,
    geography_level: row.geography_level,
    program_granularity: row.program_granularity,
    public_representation_type: row.public_representation_type,
    public_display_value: row.public_display_value,
    suppression_state: row.suppression_state,
    published_at: row.published_at,
  };
}

export class ReportPublicationActionRepo {
  async getPublicationByIdempotencyKey(key: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_publications WHERE tenant_id = $1 AND organization_id = $2 AND idempotency_key = $3 LIMIT 1`,
      [scope.tenant_id, scope.organization_id, key],
    );
    return mapPublication(result.rows[0]);
  }

  async getPublication(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_publications WHERE publication_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return mapPublication(result.rows[0]);
  }

  async createPublication(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_publications (
        publication_id, publication_authorization_id, public_snapshot_id,
        snapshot_version, snapshot_hash, report_id, report_version, tenant_id,
        organization_id, publication_status, published_by_user_id, published_at,
        projection_reference, idempotency_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'PUBLISHED',$10,NOW(),$11,$12)
      RETURNING *`,
      [
        input.publication_id, input.publication_authorization_id, input.public_snapshot_id,
        input.snapshot_version, input.snapshot_hash, input.report_id, input.report_version,
        input.tenant_id, input.organization_id, input.published_by_user_id,
        input.projection_reference, input.idempotency_key,
      ],
    );
    return mapPublication(result.rows[0]);
  }

  async createProjection(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO shf_public_impact_projections (
        projection_id, publication_id, public_snapshot_id, snapshot_version,
        snapshot_hash, report_id, report_version, tenant_id, organization_id,
        metric_label, reporting_period_start, reporting_period_end,
        reporting_period, reporting_period_label, data_as_of, geography_level,
        program_granularity, public_representation_type, public_display_value,
        suppression_state, published_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
      RETURNING *`,
      [
        input.projection_id, input.publication_id, input.public_snapshot_id,
        input.snapshot_version, input.snapshot_hash, input.report_id, input.report_version,
        input.tenant_id, input.organization_id, input.metric_label,
        input.reporting_period_start, input.reporting_period_end, input.reporting_period,
        input.reporting_period_label, input.data_as_of, input.geography_level,
        input.program_granularity, input.public_representation_type,
        input.public_display_value, input.suppression_state,
      ],
    );
    return mapProjection(result.rows[0]);
  }

  async getProjectionForPublication(publicationId: string, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM shf_public_impact_projections WHERE publication_id = $1 LIMIT 1`,
      [publicationId],
    );
    return mapProjection(result.rows[0]);
  }

  async listPublications(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_publications
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY published_at DESC, publication_id DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapPublication);
  }

  async listPublicProjections(reportId: string, reportVersion: number, executor: any = { query }) {
    const result = await executor.query(
      `SELECT projection_id, publication_id, public_snapshot_id, snapshot_version,
        snapshot_hash, report_id, report_version, metric_label,
        reporting_period_start, reporting_period_end, reporting_period,
        reporting_period_label, data_as_of, geography_level, program_granularity,
        public_representation_type, public_display_value, suppression_state,
        source_type, projection_status, published_at, created_at, version
       FROM shf_public_impact_projections
       WHERE report_id = $1
         AND report_version = $2
         AND source_type = 'CANONICAL_PUBLICATION'
         AND projection_status = 'PUBLISHED'
       ORDER BY published_at DESC, projection_id DESC`,
      [reportId, reportVersion],
    );
    return result.rows.map(mapPublicProjection);
  }
}
