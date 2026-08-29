import { query } from "../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    public_snapshot_id: row.public_snapshot_id,
    report_id: row.report_id,
    report_version: row.report_version,
    source_result_reference: row.source_result_reference,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    public_eligibility_decision_id: row.public_eligibility_decision_id,
    public_disclosure_decision_id: row.public_disclosure_decision_id,
    disclosure_policy_reference: row.disclosure_policy_reference,
    disclosure_policy_version: row.disclosure_policy_version,
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
    snapshot_hash: row.snapshot_hash,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
    version: row.version,
    idempotency_key: row.idempotency_key,
    public_population_eligible: row.public_population_eligible,
  };
}

export class ReportPublicSnapshotRepo {
  async createSnapshot(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_public_snapshots (
        public_snapshot_id, report_id, report_version, source_result_reference,
        tenant_id, organization_id, public_eligibility_decision_id,
        public_disclosure_decision_id, disclosure_policy_reference,
        disclosure_policy_version, reporting_period_start, reporting_period_end,
        reporting_period, reporting_period_label, data_as_of, geography_level,
        program_granularity, public_representation_type, public_display_value,
        suppression_state, snapshot_hash, created_by_user_id, idempotency_key
        , public_population_eligible
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *`, [
        input.public_snapshot_id, input.report_id, input.report_version,
        input.source_result_reference, input.tenant_id, input.organization_id,
        input.public_eligibility_decision_id, input.public_disclosure_decision_id,
        input.disclosure_policy_reference, input.disclosure_policy_version,
        input.reporting_period_start, input.reporting_period_end,
        input.reporting_period, input.reporting_period_label, input.data_as_of,
        input.geography_level, input.program_granularity,
        input.public_representation_type, input.public_display_value,
        input.suppression_state, input.snapshot_hash, input.created_by_user_id,
        input.idempotency_key, input.public_population_eligible,
      ],
    );
    return mapRow(result.rows[0]);
  }

  async getByIdempotencyKey(key: string, scope: any, executor: any = { query }) {
    const result = await executor.query(`SELECT * FROM report_public_snapshots WHERE tenant_id = $1 AND organization_id = $2 AND idempotency_key = $3 LIMIT 1`, [scope.tenant_id, scope.organization_id, key]);
    return mapRow(result.rows[0]);
  }

  async getSnapshot(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(`SELECT * FROM report_public_snapshots WHERE public_snapshot_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`, [id, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }

  async listSnapshots(scope: any, reportId?: string, reportVersion?: number, executor: any = { query }) {
    const params: any[] = [scope.tenant_id, scope.organization_id];
    let filter = "";
    if (reportId) { params.push(reportId); filter += ` AND report_id = $${params.length}`; }
    if (Number.isInteger(reportVersion)) { params.push(reportVersion); filter += ` AND report_version = $${params.length}`; }
    const result = await executor.query(`SELECT * FROM report_public_snapshots WHERE tenant_id = $1 AND organization_id = $2${filter} ORDER BY created_at DESC, public_snapshot_id DESC`, params);
    return result.rows.map(mapRow);
  }
}
