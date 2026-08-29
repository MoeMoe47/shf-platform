import { query } from "../../../db/client.js";

function mapRow(row: any) {
  if (!row) return null;
  return {
    binderId: row.binder_id,
    binder_id: row.binder_id,
    tenant_id: row.tenant_id,
    organization_id: row.organization_id,
    createdBy: row.created_by_user_id,
    created_by: row.created_by_user_id,
    title: row.title,
    lifecycleStatus: row.lifecycle_status,
    lifecycle_status: row.lifecycle_status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class GrantBinderRepo {
  async createBinder(input: any, executor: any = { query }) {
    const result = await executor.query(
      `INSERT INTO grant_binders (
        binder_id, tenant_id, organization_id, created_by_user_id, title,
        lifecycle_status, version
      ) VALUES ($1,$2,$3,$4,$5,'draft',1)
      RETURNING *`,
      [input.binder_id, input.tenant_id, input.organization_id, input.actor_id, input.title],
    );
    return mapRow(result.rows[0]);
  }

  async getBinder(binderId: string, scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM grant_binders
       WHERE binder_id = $1 AND tenant_id = $2 AND organization_id = $3
       LIMIT 1`,
      [binderId, scope.tenant_id, scope.organization_id],
    );
    return mapRow(result.rows[0]);
  }

  async listBinders(scope: any, executor: any = { query }) {
    const result = await executor.query(
      `SELECT * FROM grant_binders
       WHERE tenant_id = $1 AND organization_id = $2
       ORDER BY updated_at DESC`,
      [scope.tenant_id, scope.organization_id],
    );
    return result.rows.map(mapRow);
  }

  async updateBinder(
    binderId: string,
    scope: any,
    title: string,
    expectedVersion: number,
    executor: any = { query },
  ) {
    const result = await executor.query(
      `UPDATE grant_binders
       SET title = $4, version = version + 1, updated_at = NOW()
       WHERE binder_id = $1 AND tenant_id = $2 AND organization_id = $3
         AND version = $5 AND lifecycle_status = 'draft'
       RETURNING *`,
      [binderId, scope.tenant_id, scope.organization_id, title, expectedVersion],
    );
    return mapRow(result.rows[0]);
  }
}
