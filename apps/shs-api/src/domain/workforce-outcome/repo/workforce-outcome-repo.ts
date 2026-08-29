import { query } from "../../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    outcomeId: row.outcome_id,
    outcome_id: row.outcome_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    participant_ref: row.participant_ref,
    program_id: row.program_id,
    outcome_type: row.outcome_type,
    employment_started_at: row.employment_started_at,
    lifecycle_status: row.lifecycle_status,
    verification_status: row.verification_status,
    verification_source_type: row.verification_source_type,
    verification_reference: row.verification_reference,
    evidence_hash: row.evidence_hash,
    verified_at: row.verified_at,
    created_by: row.created_by_user_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    version: row.version,
  };
}

export class WorkforceOutcomeRepo {
  async create(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO workforce_employment_outcomes (
        outcome_id, tenant_id, organization_id, participant_ref, program_id,
        outcome_type, employment_started_at, lifecycle_status, verification_status,
        verification_source_type, verification_reference, evidence_hash, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,'EMPLOYMENT_STARTED',$6,'verification_pending','pending',$7,$8,$9,$10)
      RETURNING *`,
      [input.outcome_id, input.tenant_id, input.organization_id, input.participant_ref,
        input.program_id, input.employment_started_at, input.verification_source_type,
        input.verification_reference, input.evidence_hash, input.actor_id],
    );
    return mapRow(result.rows[0]);
  }

  async get(outcomeId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM workforce_employment_outcomes
       WHERE outcome_id = $1 AND tenant_id = $2 AND organization_id = $3 LIMIT 1`,
      [outcomeId, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async list(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM workforce_employment_outcomes
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY employment_started_at DESC, outcome_id DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapRow);
  }

  async transition(outcomeId: string, scope: any, fromStatus: string, toStatus: string,
    expectedVersion: number, verificationStatus: string, sourceType: string | null,
    reference: string | null, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE workforce_employment_outcomes
       SET lifecycle_status = $4, verification_status = $5,
           verification_source_type = COALESCE($6, verification_source_type),
           verification_reference = COALESCE($7, verification_reference),
           verified_at = CASE WHEN $4 = 'verified' THEN NOW() ELSE verified_at END,
           updated_at = NOW(), version = version + 1
       WHERE outcome_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND lifecycle_status = $8 AND version = $9
       RETURNING *`,
      [outcomeId, scope.tenant_id, scope.organization_id, toStatus, verificationStatus,
        sourceType, reference, fromStatus, expectedVersion],
    );
    return mapRow(result.rows[0]);
  }
}
