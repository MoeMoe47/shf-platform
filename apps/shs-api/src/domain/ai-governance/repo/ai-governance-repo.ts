import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class AiGovernanceRepo {
  constructor(private dbQuery: typeof query = query) {}

  async createDelegation(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_delegated_authorities (
         delegation_id, principal_user_id, agent_identifier, organization_id, tenant_id,
         purpose, resource_scope, allowed_actions, forbidden_actions, autonomy_profile,
         model_provider_constraint, model_identifier_constraint, restricted_resource_access,
         allow_redelegation, valid_from, expires_at, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        input.delegation_id,
        input.principal_user_id,
        input.agent_identifier,
        input.organization_id,
        input.tenant_id,
        input.purpose,
        JSON.stringify(input.resource_scope),
        input.allowed_actions,
        input.forbidden_actions || [],
        input.autonomy_profile,
        input.model_provider_constraint || null,
        input.model_identifier_constraint || null,
        input.restricted_resource_access === true,
        input.allow_redelegation === true,
        input.valid_from,
        input.expires_at,
        input.created_by,
      ],
    );
    return result.rows[0];
  }

  async getDelegation(delegationId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_delegated_authorities
       WHERE delegation_id=$1 AND organization_id=$2 AND tenant_id=$3`,
      [delegationId, organizationId, tenantId],
    );
    return result.rows[0] || null;
  }

  async listDelegations(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_delegated_authorities
       WHERE organization_id=$1 AND tenant_id=$2
       ORDER BY created_at DESC`,
      [organizationId, tenantId],
    );
    return result.rows;
  }

  async revokeDelegation(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `UPDATE ai_delegated_authorities
       SET revoked_at=NOW(), revoked_by=$4, revocation_reason=$5,
           updated_at=NOW(), metadata_version=metadata_version + 1
       WHERE delegation_id=$1 AND organization_id=$2 AND tenant_id=$3 AND revoked_at IS NULL
       RETURNING *`,
      [input.delegation_id, input.organization_id, input.tenant_id, input.revoked_by, input.revocation_reason || null],
    );
    return result.rows[0] || null;
  }

  async assignClassification(input: any, executor: Executor = { query: this.dbQuery }) {
    await executor.query(
      `UPDATE ai_resource_classifications
       SET superseded_at=NOW(), updated_at=NOW(), metadata_version=metadata_version + 1
       WHERE organization_id=$1 AND tenant_id=$2 AND resource_type=$3 AND resource_id=$4 AND superseded_at IS NULL`,
      [input.organization_id, input.tenant_id, input.resource_type, input.resource_id],
    );
    const result = await executor.query(
      `INSERT INTO ai_resource_classifications (
         classification_id, organization_id, tenant_id, resource_type, resource_id,
         classification, classification_reason, classified_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        input.classification_id,
        input.organization_id,
        input.tenant_id,
        input.resource_type,
        input.resource_id,
        input.classification,
        input.classification_reason || null,
        input.classified_by,
      ],
    );
    return result.rows[0];
  }

  async getClassification(resource: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_resource_classifications
       WHERE organization_id=$1 AND tenant_id=$2 AND resource_type=$3 AND resource_id=$4 AND superseded_at IS NULL
       LIMIT 1`,
      [resource.organization_id, resource.tenant_id, resource.resource_type, resource.resource_id],
    );
    return result.rows[0] || null;
  }

  async upsertModelPolicy(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_approved_models (
         model_policy_id, organization_id, tenant_id, provider_identifier,
         model_identifier, display_name, lifecycle_status, approval_status,
         classification_ceiling, capability_metadata, effective_from, retires_at,
         created_by, updated_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)
       ON CONFLICT (COALESCE(organization_id, 'GLOBAL'), COALESCE(tenant_id, 'GLOBAL'), provider_identifier, model_identifier)
       DO UPDATE SET display_name=EXCLUDED.display_name,
                     lifecycle_status=EXCLUDED.lifecycle_status,
                     approval_status=EXCLUDED.approval_status,
                     classification_ceiling=EXCLUDED.classification_ceiling,
                     capability_metadata=EXCLUDED.capability_metadata,
                     effective_from=EXCLUDED.effective_from,
                     retires_at=EXCLUDED.retires_at,
                     updated_by=EXCLUDED.updated_by,
                     updated_at=NOW(),
                     metadata_version=ai_approved_models.metadata_version + 1
       RETURNING *`,
      [
        input.model_policy_id,
        input.organization_id || null,
        input.tenant_id || null,
        input.provider_identifier,
        input.model_identifier,
        input.display_name,
        input.lifecycle_status,
        input.approval_status,
        input.classification_ceiling,
        JSON.stringify(input.capability_metadata || {}),
        input.effective_from,
        input.retires_at || null,
        input.actor_user_id || null,
      ],
    );
    return result.rows[0];
  }

  async findModelPolicy(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_approved_models
       WHERE provider_identifier=$1 AND model_identifier=$2
         AND (
           (organization_id=$3 AND tenant_id=$4)
           OR (organization_id IS NULL AND tenant_id IS NULL)
         )
       ORDER BY CASE WHEN organization_id=$3 THEN 0 ELSE 1 END, updated_at DESC
       LIMIT 1`,
      [input.provider_identifier, input.model_identifier, input.organization_id, input.tenant_id],
    );
    return result.rows[0] || null;
  }

  async listModelPolicies(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_approved_models
       WHERE (organization_id=$1 AND tenant_id=$2) OR (organization_id IS NULL AND tenant_id IS NULL)
       ORDER BY provider_identifier, model_identifier, organization_id NULLS FIRST`,
      [input.organization_id, input.tenant_id],
    );
    return result.rows;
  }

  async createSession(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_agent_sessions (
         session_id, agent_identifier, acting_for_user_id, organization_id, tenant_id,
         delegation_id, declared_purpose, autonomy_profile, model_provider,
         model_identifier, status, started_at, expires_at, security_metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'ACTIVE',$11,$12,$13)
       RETURNING *`,
      [
        input.session_id,
        input.agent_identifier,
        input.acting_for_user_id,
        input.organization_id,
        input.tenant_id,
        input.delegation_id,
        input.declared_purpose,
        input.autonomy_profile,
        input.model_provider || null,
        input.model_identifier || null,
        input.started_at,
        input.expires_at,
        JSON.stringify(input.security_metadata || {}),
      ],
    );
    return result.rows[0];
  }

  async getSession(sessionId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `SELECT * FROM ai_agent_sessions
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3`,
      [sessionId, organizationId, tenantId],
    );
    return result.rows[0] || null;
  }

  async closeSession(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `UPDATE ai_agent_sessions
       SET status=$4, closed_at=NOW(), close_reason=$5,
           updated_at=NOW(), metadata_version=metadata_version + 1
       WHERE session_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE'
       RETURNING *`,
      [input.session_id, input.organization_id, input.tenant_id, input.status || "CLOSED", input.close_reason || null],
    );
    return result.rows[0] || null;
  }
}
