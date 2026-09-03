import { query } from "../../../db/client.js";
import { LearnerCredential } from "../model/credential.js";

const COLUMNS = `
  learner_credential_id, credential_definition_id, learner_user_id, organization_id,
  status, issued_at, expires_at, revoked_at, issued_by_user_id, revoked_by_user_id,
  verification_id, credential_version, issuance_key, provenance_json, verification_hash,
  created_at, updated_at
`;

function rowToLearnerCredential(row: any): LearnerCredential {
  return {
    id: row.learner_credential_id,
    credentialDefinitionId: row.credential_definition_id,
    learnerUserId: row.learner_user_id,
    organizationId: row.organization_id,
    status: row.status,
    issuedAt: row.issued_at instanceof Date ? row.issued_at.toISOString() : row.issued_at,
    expiresAt: row.expires_at instanceof Date ? row.expires_at.toISOString() : row.expires_at,
    revokedAt: row.revoked_at instanceof Date ? row.revoked_at.toISOString() : row.revoked_at,
    issuedByUserId: row.issued_by_user_id,
    revokedByUserId: row.revoked_by_user_id,
    verificationId: row.verification_id,
    credentialVersion: Number(row.credential_version || 1),
    issuanceKey: row.issuance_key || null,
    provenance: row.provenance_json || {},
    verificationHash: row.verification_hash || null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export class LearnerCredentialRepo {
  async create(input: {
    id: string; credentialDefinitionId: string; learnerUserId: string; organizationId: string;
    tenantId: string; expiresAt: string | null; issuedByUserId: string; verificationId: string;
    issuanceKey: string; provenance: Record<string, unknown>; verificationHash: string;
  }, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }): Promise<LearnerCredential> {
    const res = await executor.query(
      `INSERT INTO learner_credentials (
        learner_credential_id, credential_definition_id, learner_user_id, organization_id, tenant_id,
        status, expires_at, issued_by_user_id, verification_id, credential_version,
        issuance_key, provenance_json, verification_hash
      ) VALUES ($1,$2,$3,$4,$5,'ISSUED',$6,$7,$8,1,$9,$10,$11)
      RETURNING ${COLUMNS}`,
      [input.id, input.credentialDefinitionId, input.learnerUserId, input.organizationId, input.tenantId, input.expiresAt, input.issuedByUserId, input.verificationId, input.issuanceKey, JSON.stringify(input.provenance), input.verificationHash],
    );
    return rowToLearnerCredential(res.rows[0]);
  }

  async getById(id: string): Promise<LearnerCredential | null> {
    const res = await query(`SELECT ${COLUMNS} FROM learner_credentials WHERE learner_credential_id=$1`, [id]);
    return res.rows[0] ? rowToLearnerCredential(res.rows[0]) : null;
  }

  async hasActiveIssuance(credentialDefinitionId: string, learnerUserId: string, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }): Promise<boolean> {
    const res = await executor.query(
      "SELECT 1 FROM learner_credentials WHERE credential_definition_id=$1 AND learner_user_id=$2 AND status='ISSUED' LIMIT 1",
      [credentialDefinitionId, learnerUserId],
    );
    return res.rows.length > 0;
  }

  async listForLearner(organizationId: string, learnerUserId: string): Promise<LearnerCredential[]> {
    const res = await query(
      `SELECT ${COLUMNS} FROM learner_credentials WHERE organization_id=$1 AND learner_user_id=$2 ORDER BY issued_at DESC`,
      [organizationId, learnerUserId],
    );
    return res.rows.map(rowToLearnerCredential);
  }

  async listForOrganization(organizationId: string): Promise<LearnerCredential[]> {
    const res = await query(`SELECT ${COLUMNS} FROM learner_credentials WHERE organization_id=$1 ORDER BY issued_at DESC`, [organizationId]);
    return res.rows.map(rowToLearnerCredential);
  }

  async revoke(id: string, organizationId: string, revokedByUserId: string, executor: { query: (sql: string, params?: unknown[]) => Promise<any> } = { query }): Promise<LearnerCredential | null> {
    const res = await executor.query(
      `UPDATE learner_credentials SET status='REVOKED', revoked_at=NOW(), revoked_by_user_id=$3, updated_at=NOW()
       WHERE learner_credential_id=$1 AND organization_id=$2 AND status='ISSUED'
       RETURNING ${COLUMNS}`,
      [id, organizationId, revokedByUserId],
    );
    return res.rows[0] ? rowToLearnerCredential(res.rows[0]) : null;
  }

  async getByVerificationId(verificationId: string): Promise<LearnerCredential | null> {
    const res = await query(`SELECT ${COLUMNS} FROM learner_credentials WHERE verification_id=$1`, [verificationId]);
    return res.rows[0] ? rowToLearnerCredential(res.rows[0]) : null;
  }

  // The one real, deterministic eligibility rule this phase implements —
  // an ACCEPTED submission on any of the learner's own teams for any
  // CAPSTONE-typed Project in this organization. Mirrors exactly the
  // completion-truth check already proven in
  // journey-milestone-service.ts's projectMilestones().
  async hasAcceptedCapstone(organizationId: string, learnerUserId: string): Promise<boolean> {
    return Boolean(await this.getAcceptedCapstone(organizationId, learnerUserId));
  }

  async getAcceptedCapstone(organizationId: string, learnerUserId: string): Promise<{ submissionId: string; projectId: string } | null> {
    const res = await query(
      `SELECT s.submission_id, s.project_id FROM project_submissions s
       JOIN projects p ON p.project_id = s.project_id
       JOIN project_team_members m ON m.team_id = s.team_id
       WHERE p.organization_id=$1 AND p.project_type='CAPSTONE' AND s.status='ACCEPTED'
         AND m.learner_id=$2 AND m.left_at IS NULL
       LIMIT 1`,
      [organizationId, learnerUserId],
    );
    if (!res.rows[0]) return null;
    return { submissionId: res.rows[0].submission_id, projectId: res.rows[0].project_id };
  }
}
