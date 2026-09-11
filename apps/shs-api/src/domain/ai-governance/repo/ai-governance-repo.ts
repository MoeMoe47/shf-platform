import { query } from "../../../db/client.js";
import { randomUUID } from "node:crypto";

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

  async createAgentIdentity(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`INSERT INTO ai_agent_identities (agent_identity_id, organization_id, tenant_id, agent_identifier, agent_type, status, allowed_mode, created_by) VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6,$7) ON CONFLICT (organization_id, tenant_id, agent_identifier) DO UPDATE SET updated_at=NOW() RETURNING *`, [input.agent_identity_id, input.organization_id, input.tenant_id, input.agent_identifier, input.agent_type, input.allowed_mode || "LIMITED", input.created_by]);
    return result.rows[0];
  }

  async listAgentIdentities(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_identities WHERE organization_id=$1 AND tenant_id=$2 ORDER BY agent_identifier`, [organizationId, tenantId])).rows;
  }

  async getAgentIdentity(agentIdentityId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_identities WHERE agent_identity_id=$1 AND organization_id=$2 AND tenant_id=$3`, [agentIdentityId, organizationId, tenantId])).rows[0] || null;
  }

  async getAgentIdentityByIdentifier(agentIdentifier: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_identities WHERE agent_identifier=$1 AND organization_id=$2 AND tenant_id=$3`, [agentIdentifier, organizationId, tenantId])).rows[0] || null;
  }

  async setAgentIdentityStatus(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_identities SET status=$4, updated_at=NOW(), disabled_at=CASE WHEN $4='DISABLED' THEN NOW() ELSE disabled_at END, revoked_at=CASE WHEN $4='REVOKED' THEN NOW() ELSE revoked_at END WHERE agent_identity_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`, [input.agent_identity_id, input.organization_id, input.tenant_id, input.status])).rows[0] || null;
  }

  async createTask(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`INSERT INTO ai_agent_tasks (task_id, organization_id, tenant_id, session_id, agent_identity_id, delegation_id, principal_user_id, task_type, purpose, requested_action, resource_scope, tool_scope, input_snapshot, input_hash, action_hash, consequence_class, policy_snapshot, provider_model, status, idempotency_key, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'REQUESTED',$19,$20) ON CONFLICT (organization_id, tenant_id, idempotency_key) DO NOTHING RETURNING *`, [input.task_id,input.organization_id,input.tenant_id,input.session_id,input.agent_identity_id,input.delegation_id,input.principal_user_id,input.task_type,input.purpose,input.requested_action,JSON.stringify(input.resource_scope),JSON.stringify(input.tool_scope),JSON.stringify(input.input_snapshot),input.input_hash,input.action_hash,input.consequence_class,JSON.stringify(input.policy_snapshot),JSON.stringify(input.provider_model),input.idempotency_key,input.created_by])).rows[0] || null;
  }

  async getTask(taskId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_tasks WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3`, [taskId, organizationId, tenantId])).rows[0] || null;
  }

  async listTasks(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_tasks WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC`, [organizationId, tenantId])).rows;
  }

  async transitionTask(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_tasks SET status=$4, updated_at=NOW(), cancelled_at=CASE WHEN $4='CANCELLED' THEN NOW() ELSE cancelled_at END, cancellation_reason=CASE WHEN $4='CANCELLED' THEN $5 ELSE cancellation_reason END, terminal_at=CASE WHEN $4 IN ('CANCELLED','REVOKED','FAILED','COMPLETED') THEN NOW() ELSE terminal_at END WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status=$6 RETURNING *`, [input.task_id,input.organization_id,input.tenant_id,input.status,input.reason || null,input.from_status])).rows[0] || null;
  }

  async createAttempt(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`INSERT INTO ai_agent_task_attempts (attempt_id, task_id, organization_id, tenant_id, sequence, provider_model, status, error_class, result_metadata, started_at, finished_at, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`, [input.attempt_id,input.task_id,input.organization_id,input.tenant_id,input.sequence,JSON.stringify(input.provider_model || {}),input.status,input.error_class || null,JSON.stringify(input.result_metadata || {}),input.started_at || null,input.finished_at || new Date(),input.created_by])).rows[0];
  }

  async listAttempts(taskId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_task_attempts WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY sequence`, [taskId, organizationId, tenantId])).rows;
  }

  async createWorker(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`INSERT INTO ai_agent_workers (worker_id, organization_id, tenant_id, worker_identifier, execution_mode, status, registered_by) VALUES ($1,$2,$3,$4,$5,'ACTIVE',$6) ON CONFLICT (organization_id, tenant_id, worker_identifier) DO UPDATE SET status='ACTIVE', updated_at=NOW() RETURNING *`, [input.worker_id, input.organization_id, input.tenant_id, input.worker_identifier, input.execution_mode || "TEST_SAFE", input.registered_by])).rows[0];
  }

  async getWorker(workerId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_workers WHERE worker_id=$1 AND organization_id=$2 AND tenant_id=$3`, [workerId, organizationId, tenantId])).rows[0] || null;
  }

  async listWorkers(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_workers WHERE organization_id=$1 AND tenant_id=$2 ORDER BY worker_identifier`, [organizationId, tenantId])).rows;
  }

  async setWorkerStatus(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_workers SET status=$4, updated_at=NOW() WHERE worker_id=$1 AND organization_id=$2 AND tenant_id=$3 RETURNING *`, [input.worker_id, input.organization_id, input.tenant_id, input.status])).rows[0] || null;
  }

  async claimTask(input: any, executor: Executor): Promise<any> {
    const taskResult = await executor.query(`SELECT * FROM ai_agent_tasks WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE`, [input.task_id, input.organization_id, input.tenant_id]);
    const task = taskResult.rows[0];
    if (!task || task.status !== "READY") return null;
    const worker = (await executor.query(`SELECT * FROM ai_agent_workers WHERE worker_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='ACTIVE' FOR UPDATE`, [input.worker_id, input.organization_id, input.tenant_id])).rows[0];
    if (!worker) return null;
    const sequence = Number((await executor.query(`SELECT COALESCE(MAX(sequence),0)+1 AS next_sequence FROM ai_agent_task_attempts WHERE task_id=$1`, [input.task_id])).rows[0].next_sequence);
    const attempt = (await executor.query(`INSERT INTO ai_agent_task_attempts (attempt_id, task_id, organization_id, tenant_id, sequence, worker_id, execution_mode, provider_model, status, result_metadata, started_at, lease_acquired_at, lease_expires_at, heartbeat_at, checkpoint, retryable, policy_binding_hash, action_binding_hash, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'CLAIMED','{}'::jsonb,NOW(),NOW(),NOW()+($9 * INTERVAL '1 second'),NOW(),'{}'::jsonb,FALSE,$10,$11,$12) RETURNING *`, [input.attempt_id || `ai_task_attempt_${randomUUID()}`, input.task_id, input.organization_id, input.tenant_id, sequence, input.worker_id, worker.execution_mode, JSON.stringify(input.provider_model || {}), input.lease_seconds || 30, input.policy_binding_hash || null, input.action_binding_hash || null, input.created_by])).rows[0];
    const updatedTask = (await executor.query(`UPDATE ai_agent_tasks SET status='RUNNING', updated_at=NOW() WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='READY' RETURNING *`, [input.task_id, input.organization_id, input.tenant_id])).rows[0];
    if (!updatedTask) return null;
    return { task: updatedTask, attempt };
  }

  async heartbeatAttempt(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_task_attempts SET status='RUNNING', heartbeat_at=NOW(), lease_expires_at=NOW()+($5 * INTERVAL '1 second') WHERE attempt_id=$1 AND task_id=$2 AND organization_id=$3 AND tenant_id=$4 AND worker_id=$6 AND status IN ('CLAIMED','RUNNING') RETURNING *`, [input.attempt_id, input.task_id, input.organization_id, input.tenant_id, input.lease_seconds || 30, input.worker_id])).rows[0] || null;
  }

  async completeAttempt(input: any, executor: Executor): Promise<any> {
    const attempt = (await executor.query(`UPDATE ai_agent_task_attempts SET status='SUCCEEDED', finished_at=NOW(), heartbeat_at=NOW(), lease_expires_at=NULL, checkpoint=$6, result_metadata=$7 WHERE attempt_id=$1 AND task_id=$2 AND organization_id=$3 AND tenant_id=$4 AND worker_id=$5 AND status IN ('CLAIMED','RUNNING') RETURNING *`, [input.attempt_id, input.task_id, input.organization_id, input.tenant_id, input.worker_id, JSON.stringify(input.checkpoint || {}), JSON.stringify(input.result_metadata || {})])).rows[0] || null;
    if (!attempt) return null;
    const task = (await executor.query(`UPDATE ai_agent_tasks SET status='COMPLETED', updated_at=NOW(), terminal_at=NOW() WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='RUNNING' RETURNING *`, [input.task_id, input.organization_id, input.tenant_id])).rows[0];
    return { task, attempt };
  }

  async failAttempt(input: any, executor: Executor): Promise<any> {
    const attempt = (await executor.query(`UPDATE ai_agent_task_attempts SET status=$6, error_class=$7, retryable=$8, finished_at=NOW(), lease_expires_at=NULL, result_metadata=$9 WHERE attempt_id=$1 AND task_id=$2 AND organization_id=$3 AND tenant_id=$4 AND worker_id=$5 AND status IN ('CLAIMED','RUNNING') RETURNING *`, [input.attempt_id, input.task_id, input.organization_id, input.tenant_id, input.worker_id, input.status || "FAILED", input.error_class || "UNKNOWN", input.retryable === true, JSON.stringify(input.result_metadata || {})])).rows[0] || null;
    if (!attempt) return null;
    const task = (await executor.query(`UPDATE ai_agent_tasks SET status='FAILED', updated_at=NOW(), terminal_at=NOW() WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='RUNNING' RETURNING *`, [input.task_id, input.organization_id, input.tenant_id])).rows[0];
    return { task, attempt };
  }

  async expireLeases(now: Date, executor: Executor): Promise<any[]> {
    const expired = (await executor.query(`UPDATE ai_agent_task_attempts SET status='EXPIRED', error_class='LEASE_EXPIRED', finished_at=NOW(), lease_expires_at=NULL WHERE status IN ('CLAIMED','RUNNING') AND lease_expires_at IS NOT NULL AND lease_expires_at <= $1 RETURNING *`, [now])).rows;
    for (const attempt of expired) await executor.query(`UPDATE ai_agent_tasks SET status='READY', updated_at=NOW() WHERE task_id=$1 AND status='RUNNING'`, [attempt.task_id]);
    return expired;
  }

  async retryTask(input: any, executor: Executor): Promise<any> {
    const task = (await executor.query(`SELECT * FROM ai_agent_tasks WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 FOR UPDATE`, [input.task_id, input.organization_id, input.tenant_id])).rows[0];
    if (!task || task.status !== "FAILED") return null;
    const attempts = Number((await executor.query(`SELECT COUNT(*)::int AS count FROM ai_agent_task_attempts WHERE task_id=$1`, [input.task_id])).rows[0].count);
    if (attempts >= (input.max_attempts || 3)) return { exhausted: true, task };
    return (await executor.query(`UPDATE ai_agent_tasks SET status='READY', terminal_at=NULL, updated_at=NOW() WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='FAILED' RETURNING *`, [input.task_id, input.organization_id, input.tenant_id])).rows[0] || null;
  }

  async cancelActiveAttempts(taskId: string, organizationId: string, tenantId: string, reason: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_task_attempts SET status='CANCELLED', error_class=$4, finished_at=NOW(), lease_expires_at=NULL WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status IN ('CLAIMED','RUNNING') RETURNING *`, [taskId, organizationId, tenantId, reason])).rows;
  }

  async revokeActiveExecutionByDelegation(delegationId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    await executor.query(`UPDATE ai_agent_task_attempts SET status='REVOKED', error_class='AUTHORITY_REVOKED', finished_at=NOW(), lease_expires_at=NULL WHERE organization_id=$1 AND tenant_id=$2 AND task_id IN (SELECT task_id FROM ai_agent_tasks WHERE delegation_id=$3 AND organization_id=$1 AND tenant_id=$2) AND status IN ('CLAIMED','RUNNING')`, [organizationId, tenantId, delegationId]);
    await executor.query(`UPDATE ai_agent_tasks SET status='REVOKED', terminal_at=NOW(), updated_at=NOW() WHERE organization_id=$1 AND tenant_id=$2 AND delegation_id=$3 AND status='RUNNING'`, [organizationId, tenantId, delegationId]);
  }

  async revokeActiveExecutionByAgent(agentIdentityId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    await executor.query(`UPDATE ai_agent_task_attempts SET status='REVOKED', error_class='AGENT_DISABLED', finished_at=NOW(), lease_expires_at=NULL WHERE organization_id=$1 AND tenant_id=$2 AND task_id IN (SELECT task_id FROM ai_agent_tasks WHERE agent_identity_id=$3 AND organization_id=$1 AND tenant_id=$2) AND status IN ('CLAIMED','RUNNING')`, [organizationId, tenantId, agentIdentityId]);
    await executor.query(`UPDATE ai_agent_tasks SET status='REVOKED', terminal_at=NOW(), updated_at=NOW() WHERE organization_id=$1 AND tenant_id=$2 AND agent_identity_id=$3 AND status='RUNNING'`, [organizationId, tenantId, agentIdentityId]);
  }

  async getApprovalRequest(approvalRequestId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_task_approval_requests WHERE approval_request_id=$1 AND organization_id=$2 AND tenant_id=$3`, [approvalRequestId, organizationId, tenantId])).rows[0] || null;
  }

  async getApprovalForTask(taskId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT r.*, p.task_action_hash, p.consequence_class, p.owning_domain, p.target_type, p.target_id FROM ai_agent_task_approval_requests r JOIN ai_agent_task_proposed_actions p ON p.proposed_action_id=r.proposed_action_id WHERE r.task_id=$1 AND r.organization_id=$2 AND r.tenant_id=$3 ORDER BY r.created_at DESC LIMIT 1`, [taskId, organizationId, tenantId])).rows[0] || null;
  }

  async listApprovalRequests(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT r.*, p.task_action_hash, p.consequence_class, p.owning_domain, p.target_type, p.target_id FROM ai_agent_task_approval_requests r JOIN ai_agent_task_proposed_actions p ON p.proposed_action_id=r.proposed_action_id WHERE r.organization_id=$1 AND r.tenant_id=$2 ORDER BY r.created_at DESC`, [organizationId, tenantId])).rows;
  }

  async createProposedAction(input: any, executor: Executor) {
    return (await executor.query(`INSERT INTO ai_agent_task_proposed_actions (proposed_action_id,task_id,organization_id,tenant_id,action_type,owning_domain,target_type,target_id,parameter_hash,consequence_class,side_effect_class,action_fingerprint,task_action_hash,policy_version,requested_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (organization_id,tenant_id,task_id) DO NOTHING RETURNING *`, [input.proposed_action_id,input.task_id,input.organization_id,input.tenant_id,input.action_type,input.owning_domain,input.target_type,input.target_id,input.parameter_hash,input.consequence_class,input.side_effect_class,input.action_fingerprint,input.task_action_hash,input.policy_version || null,input.requested_by])).rows[0] || null;
  }

  async createApprovalRequest(input: any, executor: Executor) {
    return (await executor.query(`INSERT INTO ai_agent_task_approval_requests (approval_request_id,task_id,proposed_action_id,organization_id,tenant_id,action_fingerprint,required_permission,status,requested_by,expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',$8,$9) ON CONFLICT (organization_id,tenant_id,task_id,action_fingerprint) DO NOTHING RETURNING *`, [input.approval_request_id,input.task_id,input.proposed_action_id,input.organization_id,input.tenant_id,input.action_fingerprint,input.required_permission,input.requested_by,input.expires_at || null])).rows[0] || null;
  }

  async setApprovalStatus(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_task_approval_requests SET status=$4,updated_at=NOW() WHERE approval_request_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status='PENDING' RETURNING *`, [input.approval_request_id,input.organization_id,input.tenant_id,input.status])).rows[0] || null;
  }

  async createApprovalDecision(input: any, executor: Executor) {
    return (await executor.query(`INSERT INTO ai_agent_task_approval_decisions (approval_decision_id,approval_request_id,organization_id,tenant_id,decision,action_fingerprint,approver_user_id,reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (approval_request_id,action_fingerprint,approver_user_id) DO NOTHING RETURNING *`, [input.approval_decision_id,input.approval_request_id,input.organization_id,input.tenant_id,input.decision,input.action_fingerprint,input.approver_user_id,input.reason || null])).rows[0] || null;
  }

  async listApprovalDecisions(approvalRequestId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_agent_task_approval_decisions WHERE approval_request_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY created_at`, [approvalRequestId, organizationId, tenantId])).rows;
  }

  async invalidateApprovalsForTask(taskId: string, organizationId: string, tenantId: string, status: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`UPDATE ai_agent_task_approval_requests SET status=$4,updated_at=NOW() WHERE task_id=$1 AND organization_id=$2 AND tenant_id=$3 AND status IN ('PENDING','APPROVED') RETURNING *`, [taskId,organizationId,tenantId,status])).rows;
  }

  async createSecurityEvent(input: any, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`INSERT INTO ai_governance_security_events (security_event_id,organization_id,tenant_id,event_type,severity,task_id,session_id,agent_identity_id,actor_user_id,approval_request_id,policy_reference,action_fingerprint,metadata_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [input.security_event_id,input.organization_id,input.tenant_id,input.event_type,input.severity || 'HIGH',input.task_id || null,input.session_id || null,input.agent_identity_id || null,input.actor_user_id || null,input.approval_request_id || null,input.policy_reference || null,input.action_fingerprint || null,JSON.stringify(input.metadata || {})])).rows[0];
  }

  async listSecurityEvents(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    return (await executor.query(`SELECT * FROM ai_governance_security_events WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC`, [organizationId,tenantId])).rows;
  }
}
