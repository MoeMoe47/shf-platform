import { query } from "../../db/client";

function mapRow(row: any) {
  if (!row) return null;
  return {
    policy_id: row.policy_id,
    policy_key: row.policy_key,
    policy_version: row.policy_version,
    report_id: row.report_id,
    report_version: row.report_version,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    status: row.status,
    policy_type: row.policy_type,
    policy_definition: row.policy_definition,
    effective_at: row.effective_at,
    retired_at: row.retired_at,
    approved_by_user_id: row.approved_by_user_id,
    approved_at: row.approved_at,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
    version: row.version,
    institutional_signoff_required: row.institutional_signoff_required,
  };
}

export class ReportPublicDisclosurePolicyRepo {
  async createPolicy(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_public_disclosure_policies (
        policy_id, policy_key, policy_version, report_id, report_version,
        tenant_id, organization_id, status, policy_type, policy_definition,
        effective_at, created_by_user_id, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8,$9::jsonb,$10,$11,1)
      RETURNING *`,
      [input.policy_id, input.policy_key, input.policy_version, input.report_id,
        input.report_version, input.tenant_id, input.organization_id,
        input.policy_type, JSON.stringify(input.policy_definition), input.effective_at || null,
        input.created_by_user_id],
    );
    return mapRow(result.rows[0]);
  }

  async listPolicies(scope: any, reportId?: string, reportVersion?: number, executor: any = { query }) {
    const params: any[] = [scope.tenant_id, scope.organization_id];
    let filter = "";
    if (reportId) { params.push(reportId); filter += ` AND report_id = $${params.length}`; }
    if (Number.isInteger(reportVersion)) { params.push(reportVersion); filter += ` AND report_version = $${params.length}`; }
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_policies
       WHERE tenant_id = $1 AND organization_id = $2${filter}
       ORDER BY policy_key, policy_version DESC`, params);
    return result.rows.map(mapRow);
  }

  async getPolicy(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_policies
       WHERE policy_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`,
      [id, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }

  async getApprovedPolicy(reportId: string, reportVersion: number, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_policies
       WHERE report_id = $1 AND report_version = $2 AND tenant_id = $3
         AND organization_id = $4 AND status = 'APPROVED'
       ORDER BY policy_version DESC LIMIT 1`,
      [reportId, reportVersion, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }

  async approvePolicy(id: string, scope: any, actorId: string, effectiveAt: string, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_public_disclosure_policies
       SET status = 'APPROVED', approved_by_user_id = $1, approved_at = NOW(),
           effective_at = $2, version = version + 1
       WHERE policy_id = $3 AND tenant_id = $4 AND organization_id = $5
         AND status = 'DRAFT'
       RETURNING *`, [actorId, effectiveAt, id, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }

  async retirePolicy(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_public_disclosure_policies
       SET status = 'RETIRED', retired_at = NOW(), version = version + 1
       WHERE policy_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND status = 'APPROVED'
       RETURNING *`, [id, scope.tenant_id, scope.organization_id]);
    return mapRow(result.rows[0]);
  }

  async createSignoff(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_public_disclosure_policy_signoffs (
        signoff_record_id, policy_id, tenant_id, organization_id,
        signoff_type, authority_reference, status, recorded_by_user_id, version
      ) VALUES ($1,$2,$3,$4,$5,'PENDING',$6,1)
      RETURNING *`,
      [input.signoff_record_id, input.policy_id, input.tenant_id, input.organization_id, input.signoff_type, input.authority_reference, input.recorded_by_user_id],
    );
    return result.rows[0];
  }

  async listSignoffs(policyId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_public_disclosure_policy_signoffs
       WHERE policy_id = $1 AND tenant_id = $2 AND organization_id = $3
       ORDER BY recorded_at DESC, signoff_record_id DESC`,
      [policyId, scope.tenant_id, scope.organization_id],
    );
    return result.rows;
  }

  async hasApprovedSignoff(policyId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT 1 FROM report_public_disclosure_policy_signoffs
       WHERE policy_id = $1 AND tenant_id = $2 AND organization_id = $3 AND status = 'APPROVED'
       LIMIT 1`,
      [policyId, scope.tenant_id, scope.organization_id],
    );
    return result.rows.length > 0;
  }

  async approveSignoff(signoffId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_public_disclosure_policy_signoffs
       SET status = 'APPROVED', decided_at = NOW(), version = version + 1
       WHERE signoff_record_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND status = 'PENDING'
       RETURNING *`, [signoffId, scope.tenant_id, scope.organization_id]);
    return result.rows[0] || null;
  }
}
