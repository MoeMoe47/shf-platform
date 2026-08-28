import { query } from "../../db/client";

function mapRow(row: any) {
  if (!row) return null;
  return {
    public_disclosure_decision_id: row.public_disclosure_decision_id,
    report_id: row.report_id,
    report_version: row.report_version,
    public_eligibility_decision_id: row.public_eligibility_decision_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    decision: row.decision,
    privacy_policy_reference: row.privacy_policy_reference,
    privacy_policy_version: row.privacy_policy_version,
    reason_code: row.reason_code,
    review_context: row.review_context,
    reviewed_by_user_id: row.reviewed_by_user_id,
    reviewed_at: row.reviewed_at,
    supersedes_decision_id: row.supersedes_decision_id,
    version: row.version,
    created_at: row.created_at,
  };
}

export class ReportPublicDisclosureRepo {
  async createDecision(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_public_disclosure_decisions (
        public_disclosure_decision_id, report_id, report_version,
        public_eligibility_decision_id, tenant_id, organization_id, decision,
        privacy_policy_reference, privacy_policy_version, reason_code,
        review_context, reviewed_by_user_id, supersedes_decision_id, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,1)
      RETURNING *`,
      [input.public_disclosure_decision_id, input.report_id, input.report_version,
        input.public_eligibility_decision_id, input.tenant_id, input.organization_id,
        input.decision, input.privacy_policy_reference, input.privacy_policy_version,
        input.reason_code, JSON.stringify(input.review_context || null), input.reviewed_by_user_id, input.supersedes_decision_id || null],
    );
    return mapRow(result.rows[0]);
  }

  async listDecisions(scope: any, reportId?: string, reportVersion?: number, executor: any = { query }) {
    const params: any[] = [scope.tenant_id, scope.organization_id];
    let filter = "";
    if (reportId) { params.push(reportId); filter += ` AND report_id = $${params.length}`; }
    if (Number.isInteger(reportVersion)) { params.push(reportVersion); filter += ` AND report_version = $${params.length}`; }
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_decisions
       WHERE tenant_id = $1 AND organization_id = $2${filter}
       ORDER BY reviewed_at DESC, public_disclosure_decision_id DESC`, params);
    return result.rows.map(mapRow);
  }

  async getDecision(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_decisions
       WHERE public_disclosure_decision_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }
}
