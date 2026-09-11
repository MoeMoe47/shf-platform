import { query } from "../../../db/client.js";

const GRANT_COLUMNS = `
  g.grant_id, g.grant_number, g.external_reference, g.title,
  g.funder_organization_id, g.recipient_organization_id, g.reporting_organization_id,
  g.status, g.award_amount::text AS award_amount, g.currency, g.start_date, g.end_date,
  g.purpose, g.restriction_type, g.restricted_program_id, g.created_by_user_id,
  g.created_at, g.updated_at, g.metadata_version,
  COALESCE(SUM(a.allocated_amount), 0)::text AS allocated_amount,
  (g.award_amount - COALESCE(SUM(a.allocated_amount), 0))::text AS remaining_amount
`;

function mapRows(rows: any[]) {
  return rows.map((row) => ({
    ...row,
    allocations: row.allocations || undefined,
  }));
}

export class FundingGrantRepo {
  async organizationExists(organizationId: string, executor: any = { query }) {
    const res = await executor.query("SELECT 1 FROM organizations WHERE organization_id = $1 LIMIT 1", [organizationId]);
    return Boolean(res.rows[0]);
  }

  async getProgram(programId: string, executor: any = { query }) {
    const res = await executor.query(
      `SELECT program_id, name, organization_id,
              COALESCE(owner_organization_id, organization_id) AS owner_organization_id,
              COALESCE(operator_organization_id, organization_id) AS operator_organization_id,
              COALESCE(accountable_organization_id, organization_id) AS accountable_organization_id,
              status
       FROM programs
       WHERE program_id = $1
       LIMIT 1`,
      [programId],
    );
    return res.rows[0] || null;
  }

  async createGrant(input: any, executor: any = { query }) {
    const res = await executor.query(
      `INSERT INTO funding_grants (
        grant_id, grant_number, external_reference, title,
        funder_organization_id, recipient_organization_id, reporting_organization_id,
        status, award_amount, currency, start_date, end_date, purpose,
        restriction_type, restricted_program_id, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'AWARDED',$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        input.grant_id,
        input.grant_number,
        input.external_reference,
        input.title,
        input.funder_organization_id,
        input.recipient_organization_id,
        input.reporting_organization_id,
        input.award_amount,
        input.currency,
        input.start_date,
        input.end_date,
        input.purpose,
        input.restriction_type,
        input.restricted_program_id,
        input.created_by_user_id,
      ],
    );
    return this.getGrantForAuthority(res.rows[0].grant_id, executor);
  }

  async listGrants(scope: any, executor: any = { query }) {
    const values = scope.platform_global ? [] : [scope.organization_id];
    const where = scope.platform_global ? "" : `
      WHERE g.funder_organization_id = $1
         OR g.recipient_organization_id = $1
         OR g.reporting_organization_id = $1
         OR EXISTS (
           SELECT 1
           FROM grant_program_allocations ga
           JOIN programs p ON p.program_id = ga.program_id
           WHERE ga.grant_id = g.grant_id
             AND $1 IN (
               p.organization_id,
               COALESCE(p.owner_organization_id, p.organization_id),
               COALESCE(p.operator_organization_id, p.organization_id),
               COALESCE(p.accountable_organization_id, p.organization_id)
             )
         )
    `;
    const res = await executor.query(
      `SELECT ${GRANT_COLUMNS}
       FROM funding_grants g
       LEFT JOIN grant_program_allocations a ON a.grant_id = g.grant_id
       ${where}
       GROUP BY g.grant_id
       ORDER BY g.updated_at DESC, g.grant_id DESC`,
      values,
    );
    return mapRows(res.rows);
  }

  async getGrant(grantId: string, scope: any, executor: any = { query }) {
    const rows = await this.listGrants(scope, executor);
    const grant = rows.find((row) => row.grant_id === grantId);
    if (!grant) return null;
    return { ...grant, allocations: await this.listAllocations(grantId, executor, scope) };
  }

  async getGrantForAuthority(grantId: string, executor: any = { query }) {
    const res = await executor.query(
      `SELECT ${GRANT_COLUMNS}
       FROM funding_grants g
       LEFT JOIN grant_program_allocations a ON a.grant_id = g.grant_id
       WHERE g.grant_id = $1
       GROUP BY g.grant_id
       LIMIT 1`,
      [grantId],
    );
    const row = res.rows[0];
    if (!row) return null;
    return { ...row, allocations: await this.listAllocations(grantId, executor) };
  }

  async getGrantForUpdate(grantId: string, scope: any = {}, executor: any = { query }) {
    const filter = scope.platform_global ? "" : `
      AND ($2 IN (g.funder_organization_id, g.recipient_organization_id, g.reporting_organization_id)
        OR EXISTS (SELECT 1 FROM grant_program_allocations ga JOIN programs p ON p.program_id=ga.program_id
                  WHERE ga.grant_id=g.grant_id AND $2 IN (p.organization_id, COALESCE(p.owner_organization_id,p.organization_id), COALESCE(p.operator_organization_id,p.organization_id), COALESCE(p.accountable_organization_id,p.organization_id))))`;
    const params = scope.platform_global ? [grantId] : [grantId, scope.organization_id];
    const res = await executor.query(`SELECT g.* FROM funding_grants g WHERE g.grant_id = $1${filter} FOR UPDATE`, params);
    return res.rows[0] || null;
  }

  async sumAllocations(grantId: string, executor: any = { query }) {
    const res = await executor.query(
      "SELECT COALESCE(SUM(allocated_amount), 0)::text AS allocated_amount FROM grant_program_allocations WHERE grant_id = $1",
      [grantId],
    );
    return res.rows[0]?.allocated_amount || "0.00";
  }

  async createAllocation(input: any, executor: any = { query }) {
    const res = await executor.query(
      `INSERT INTO grant_program_allocations (
        allocation_id, grant_id, program_id, allocated_amount, purpose, created_by_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *`,
      [input.allocation_id, input.grant_id, input.program_id, input.allocated_amount, input.purpose, input.created_by_user_id],
    );
    return res.rows[0];
  }

  async listAllocations(grantId: string, executor: any = { query }, scope?: any) {
    const scopeFilter = scope?.platform_global ? "" : scope?.organization_id ? `
       AND $2 IN (
         p.organization_id,
         COALESCE(p.owner_organization_id, p.organization_id),
         COALESCE(p.operator_organization_id, p.organization_id),
         COALESCE(p.accountable_organization_id, p.organization_id)
       )
    ` : "";
    const params = scope?.platform_global || !scope?.organization_id ? [grantId] : [grantId, scope.organization_id];
    const res = await executor.query(
      `SELECT a.allocation_id, a.grant_id, a.program_id, p.name AS program_name,
              a.allocated_amount::text AS allocated_amount, a.purpose, a.created_by_user_id,
              a.created_at, a.updated_at, a.metadata_version,
              COALESCE(p.owner_organization_id, p.organization_id) AS owner_organization_id,
              COALESCE(p.operator_organization_id, p.organization_id) AS operator_organization_id,
              COALESCE(p.accountable_organization_id, p.organization_id) AS accountable_organization_id
       FROM grant_program_allocations a
       JOIN programs p ON p.program_id = a.program_id
       WHERE a.grant_id = $1
       ${scopeFilter}
       ORDER BY a.created_at ASC, a.allocation_id ASC`,
      params,
    );
    return res.rows;
  }

  async transitionGrant(grantId: string, status: string, executor: any = { query }) {
    const res = await executor.query(
      `UPDATE funding_grants
       SET status = $2, updated_at = NOW(), metadata_version = metadata_version + 1
       WHERE grant_id = $1
       RETURNING *`,
      [grantId, status],
    );
    return res.rows[0] || null;
  }
}
