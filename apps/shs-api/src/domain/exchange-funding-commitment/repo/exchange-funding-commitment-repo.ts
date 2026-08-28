import { query } from "../../../db/client";

function mapRow(row: any) {
  if (!row) return null;
  return {
    commitmentId: row.commitment_id,
    commitment_id: row.commitment_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    createdBy: row.created_by_user_id,
    created_by_user_id: row.created_by_user_id,
    committedBy: row.committed_by_user_id,
    committed_by_user_id: row.committed_by_user_id,
    recipientOrganizationId: row.recipient_organization_id,
    recipient_organization_id: row.recipient_organization_id,
    amountMinor: Number(row.amount_minor),
    amount_minor: Number(row.amount_minor),
    currency: row.currency,
    lifecycleStatus: row.lifecycle_status,
    lifecycle_status: row.lifecycle_status,
    version: row.version,
    createdAt: row.created_at,
    created_at: row.created_at,
    updatedAt: row.updated_at,
    updated_at: row.updated_at,
    committedAt: row.committed_at,
    committed_at: row.committed_at,
    cancelledAt: row.cancelled_at,
    cancelled_at: row.cancelled_at,
  };
}

export class ExchangeFundingCommitmentRepo {
  async createCommitment(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO exchange_funding_commitments (
        commitment_id, tenant_id, organization_id, created_by_user_id,
        recipient_organization_id, amount_minor, currency
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        input.commitment_id,
        input.tenant_id,
        input.organization_id,
        input.actor_id,
        input.recipient_organization_id,
        input.amount_minor,
        input.currency,
      ],
    );
    return mapRow(result.rows[0]);
  }

  async getCommitment(commitmentId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM exchange_funding_commitments
       WHERE commitment_id = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [commitmentId, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async listCommitments(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM exchange_funding_commitments
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY updated_at DESC, commitment_id DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapRow);
  }

  async updateDraft(commitmentId: string, scope: any, input: any, expectedVersion: number, executor: any = { query }) {
    const result = await executor.query(
      `UPDATE exchange_funding_commitments
       SET recipient_organization_id = $4, amount_minor = $5, currency = $6,
           version = version + 1, updated_at = NOW()
       WHERE commitment_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND version = $7 AND lifecycle_status = 'draft'
       RETURNING *`,
      [commitmentId, scope.tenant_id, scope.organization_id, input.recipient_organization_id, input.amount_minor, input.currency, expectedVersion],
    );
    return mapRow(result.rows[0]);
  }

  async transition(commitmentId: string, scope: any, fromStatus: string, toStatus: string, expectedVersion: number, timestampColumn: string, actorId: string, executor: any = { query }) {
    if (!["committed_at", "cancelled_at"].includes(timestampColumn)) throw new Error("Unsupported commitment timestamp");
    const result = await executor.query(
      `UPDATE exchange_funding_commitments
       SET lifecycle_status = $4, ${timestampColumn} = NOW(),
           committed_by_user_id = CASE WHEN $4 = 'committed' THEN $7 ELSE committed_by_user_id END,
           version = version + 1, updated_at = NOW()
       WHERE commitment_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND lifecycle_status = $5 AND version = $6
       RETURNING *`,
      [commitmentId, scope.tenant_id, scope.organization_id, toStatus, fromStatus, expectedVersion, actorId],
    );
    return mapRow(result.rows[0]);
  }
}
