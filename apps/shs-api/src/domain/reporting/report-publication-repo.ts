import { query } from "../../db/client.js";

function map(row: any) {
  if (!row) return null;
  return { publication_authorization_id: row.publication_authorization_id, public_snapshot_id: row.public_snapshot_id, snapshot_version: row.snapshot_version, snapshot_hash: row.snapshot_hash, report_id: row.report_id, report_version: row.report_version, tenant_id: row.tenant_id, organization_id: row.organization_id, public_eligibility_decision_id: row.public_eligibility_decision_id, public_disclosure_decision_id: row.public_disclosure_decision_id, disclosure_policy_reference: row.disclosure_policy_reference, disclosure_policy_version: row.disclosure_policy_version, institutional_authority_reference: row.institutional_authority_reference, release_approval_reference: row.release_approval_reference, status: row.status, authorized_by_user_id: row.authorized_by_user_id, authorized_at: row.authorized_at, purpose_reference: row.purpose_reference, idempotency_key: row.idempotency_key, created_at: row.created_at, version: row.version };
}

export class ReportPublicationRepo {
  async getAuthority(id: string, scope: any, executor: any = { query }) { const result = await executor.query(`SELECT * FROM report_publication_authorities WHERE authority_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`, [id, scope.tenant_id, scope.organization_id]); return result.rows[0] || null; }
  async getReleaseApproval(id: string, snapshotId: string, scope: any, executor: any = { query }) { const result = await executor.query(`SELECT * FROM report_publication_release_approvals WHERE release_approval_id = $1 AND public_snapshot_id = $2 AND tenant_id = $3 AND organization_id = $4 LIMIT 1`, [id, snapshotId, scope.tenant_id, scope.organization_id]); return result.rows[0] || null; }
  async getByIdempotencyKey(key: string, scope: any, executor: any = { query }) { const result = await executor.query(`SELECT * FROM report_publication_authorizations WHERE tenant_id = $1 AND organization_id = $2 AND idempotency_key = $3 LIMIT 1`, [scope.tenant_id, scope.organization_id, key]); return map(result.rows[0]); }
  async createAuthorization(input: any, executor: any = { query }) {
    const result = await executor.query(`INSERT INTO report_publication_authorizations (publication_authorization_id, public_snapshot_id, snapshot_version, snapshot_hash, report_id, report_version, tenant_id, organization_id, public_eligibility_decision_id, public_disclosure_decision_id, disclosure_policy_reference, disclosure_policy_version, institutional_authority_reference, release_approval_reference, status, authorized_by_user_id, purpose_reference, idempotency_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'PUBLICATION_AUTHORIZED',$15,$16,$17) RETURNING *`, [input.publication_authorization_id, input.public_snapshot_id, input.snapshot_version, input.snapshot_hash, input.report_id, input.report_version, input.tenant_id, input.organization_id, input.public_eligibility_decision_id, input.public_disclosure_decision_id, input.disclosure_policy_reference, input.disclosure_policy_version, input.institutional_authority_reference, input.release_approval_reference, input.authorized_by_user_id, input.purpose_reference || null, input.idempotency_key]);
    return map(result.rows[0]);
  }
  async getAuthorization(id: string, scope: any, executor: any = { query }) { const result = await executor.query(`SELECT * FROM report_publication_authorizations WHERE publication_authorization_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`, [id, scope.tenant_id, scope.organization_id]); return map(result.rows[0]); }
  async listAuthorizations(scope: any, executor: any = { query }) { const result = await executor.query(`SELECT * FROM report_publication_authorizations WHERE tenant_id = $1 AND organization_id = $2 ORDER BY authorized_at DESC, publication_authorization_id DESC`, [scope.tenant_id, scope.organization_id]); return result.rows.map(map); }
  async revokeAuthorization(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_publication_authorizations
       SET status = 'PUBLICATION_REVOKED', version = version + 1
       WHERE publication_authorization_id = $1
         AND tenant_id = $2
         AND organization_id = $3
         AND status = 'PUBLICATION_AUTHORIZED'
       RETURNING *`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return map(result.rows[0]);
  }
}
