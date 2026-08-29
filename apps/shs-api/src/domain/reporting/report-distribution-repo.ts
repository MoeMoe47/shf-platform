import { query } from "../../db/client.js";

function mapRecipient(row: any) {
  if (!row) return null;
  return {
    recipient_authorization_id: row.recipient_authorization_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    recipient_organization_ref: row.recipient_organization_ref,
    recipient_contact_ref: row.recipient_contact_ref,
    audience_type: row.audience_type,
    purpose_scope: row.purpose_scope,
    status: row.status,
    authorized_by_user_id: row.authorized_by_user_id,
    authorized_at: row.authorized_at,
    revoked_at: row.revoked_at,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDecision(row: any) {
  if (!row) return null;
  return {
    disclosure_decision_id: row.disclosure_decision_id,
    artifact_id: row.artifact_id,
    artifact_version: row.artifact_version,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    classification: row.classification,
    decision: row.decision,
    decision_scope: row.decision_scope,
    reviewed_by_user_id: row.reviewed_by_user_id,
    reviewed_at: row.reviewed_at,
    rationale_code: row.rationale_code,
    policy_reference: row.policy_reference,
    version: row.version,
    created_at: row.created_at,
  };
}

export class ReportDistributionRepo {
  async createRecipient(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_distribution_recipients (
        recipient_authorization_id, tenant_id, organization_id,
        recipient_organization_ref, recipient_contact_ref, audience_type,
        purpose_scope, status, authorized_by_user_id, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'AUTHORIZED',$8,1)
      RETURNING *`,
      [input.recipient_authorization_id, input.tenant_id, input.organization_id,
        input.recipient_organization_ref, input.recipient_contact_ref || null,
        input.audience_type, input.purpose_scope || null, input.authorized_by_user_id],
    );
    return mapRecipient(result.rows[0]);
  }

  async getRecipient(id: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_distribution_recipients
       WHERE recipient_authorization_id = $1 AND tenant_id = $2 AND organization_id = $3`,
      [id, scope.tenant_id, scope.organization_id],
    );
    return mapRecipient(result.rows[0]);
  }

  async listRecipients(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_distribution_recipients
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY created_at DESC, recipient_authorization_id DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapRecipient);
  }

  async revokeRecipient(id: string, scope: any, expectedVersion: number, revokedAt: string, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE report_distribution_recipients
       SET status = 'REVOKED', revoked_at = $4, updated_at = NOW(), version = version + 1
       WHERE recipient_authorization_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND status = 'AUTHORIZED' AND version = $5
       RETURNING *`,
      [id, scope.tenant_id, scope.organization_id, revokedAt, expectedVersion],
    );
    return mapRecipient(result.rows[0]);
  }

  async createDisclosureDecision(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_disclosure_decisions (
        disclosure_decision_id, artifact_id, artifact_version, tenant_id,
        organization_id, classification, decision, decision_scope,
        reviewed_by_user_id, rationale_code, policy_reference, version
      ) VALUES ($1,$2,$3,$4,$5,'RESTRICTED_EXTERNAL',$6,$7::jsonb,$8,$9,$10,1)
      RETURNING *`,
      [input.disclosure_decision_id, input.artifact_id, input.artifact_version,
        input.tenant_id, input.organization_id, input.decision,
        JSON.stringify(input.decision_scope), input.reviewed_by_user_id,
        input.rationale_code || null, input.policy_reference || null],
    );
    return mapDecision(result.rows[0]);
  }

  async listDisclosureDecisions(artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_disclosure_decisions
       WHERE artifact_id = $1 AND tenant_id = $2 AND organization_id = $3
       ORDER BY reviewed_at DESC, disclosure_decision_id DESC`,
      [artifactId, scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapDecision);
  }

  async getDisclosureDecision(id: string, artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_disclosure_decisions
       WHERE disclosure_decision_id = $1 AND artifact_id = $2
         AND tenant_id = $3 AND organization_id = $4`,
      [id, artifactId, scope.tenant_id, scope.organization_id],
    );
    return mapDecision(result.rows[0]);
  }

  async getDistributionByIdempotencyKey(key: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_distributions
       WHERE tenant_id = $1 AND organization_id = $2 AND idempotency_key = $3`,
      [scope.tenant_id, scope.organization_id, key],
    );
    return result.rows[0] || null;
  }

  async createDistribution(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO report_distributions (
        distribution_id, artifact_id, artifact_version,
        recipient_authorization_id, disclosure_decision_id, tenant_id,
        organization_id, authorized_by_user_id, distribution_purpose,
        idempotency_key, status, version
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'AUTHORIZED_FOR_DISTRIBUTION',1)
      RETURNING *`,
      [input.distribution_id, input.artifact_id, input.artifact_version,
        input.recipient_authorization_id, input.disclosure_decision_id,
        input.tenant_id, input.organization_id, input.authorized_by_user_id,
        input.distribution_purpose || null, input.idempotency_key],
    );
    return result.rows[0];
  }

  async listDistributions(artifactId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM report_distributions
       WHERE artifact_id = $1 AND tenant_id = $2 AND organization_id = $3
       ORDER BY authorized_at DESC, distribution_id DESC`,
      [artifactId, scope.tenant_id, scope.organization_id],
    );
    return result.rows;
  }
}
