import { query } from "../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    public_eligibility_decision_id: row.public_eligibility_decision_id,
    report_id: row.report_id,
    report_version: row.report_version,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    decision: row.decision,
    reason_code: row.reason_code,
    policy_reference: row.policy_reference,
    decided_by_user_id: row.decided_by_user_id,
    decided_at: row.decided_at,
    supersedes_decision_id: row.supersedes_decision_id,
    version: row.version,
    created_at: row.created_at,
  };
}

export class ReportPublicEligibilityRepo {
  async createDecision(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_public_eligibility_decisions (
        public_eligibility_decision_id, report_id, report_version,
        tenant_id, organization_id, decision, reason_code, policy_reference,
        decided_by_user_id, supersedes_decision_id, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1)
      RETURNING *`,
      [
        input.public_eligibility_decision_id,
        input.report_id,
        input.report_version,
        input.tenant_id,
        input.organization_id,
        input.decision,
        input.reason_code,
        input.policy_reference,
        input.decided_by_user_id,
        input.supersedes_decision_id || null,
      ],
    );
    return mapRow(result.rows[0]);
  }

  async listDecisions(scope: any, reportId?: string, reportVersion?: number, executor: any = { query }) {
    const params: any[] = [scope.tenant_id, scope.organization_id];
    let filter = "";
    if (reportId) {
      params.push(reportId);
      filter += ` AND report_id = $${params.length}`;
    }
    if (Number.isInteger(reportVersion)) {
      params.push(reportVersion);
      filter += ` AND report_version = $${params.length}`;
    }
    const result = await executor.query(
      `SELECT * FROM report_public_eligibility_decisions
       WHERE tenant_id = $1 AND organization_id = $2${filter}
       ORDER BY decided_at DESC, public_eligibility_decision_id DESC`,
      params,
    );
    return result.rows.map(mapRow);
  }

  async getDecision(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_eligibility_decisions
       WHERE public_eligibility_decision_id = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async getLatestEligible(reportId: string, reportVersion: number, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_eligibility_decisions
       WHERE report_id = $1 AND report_version = $2
         AND tenant_id = $3 AND organization_id = $4
       ORDER BY decided_at DESC, public_eligibility_decision_id DESC
       LIMIT 1`,
      [reportId, reportVersion, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }
}
