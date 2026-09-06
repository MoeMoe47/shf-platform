import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class ConductorRepo {
  constructor(private dbQuery: typeof query = query) {}

  async createRequest(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO bos_conductor_requests (
         conductor_request_id, principal_user_id, organization_id, tenant_id,
         goal, purpose, status, source_session_id, requested_operation_ref,
         interpretation_json, unresolved_questions_json, risk_summary_json,
         result_json, failure_reason, created_by, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,'CREATED',$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [input.conductor_request_id, input.principal_user_id, input.organization_id, input.tenant_id, input.goal, input.purpose, input.source_session_id || null, input.requested_operation_ref || null, JSON.stringify(input.interpretation_json || {}), JSON.stringify(input.unresolved_questions_json || []), JSON.stringify(input.risk_summary_json || {}), JSON.stringify(input.result_json || {}), input.failure_reason || null, input.created_by, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async finalizeRequest(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `UPDATE bos_conductor_requests
       SET status=$4, completed_at=NOW(), failure_reason=$5,
           result_json=$6, risk_summary_json=$7, updated_at=NOW()
       WHERE conductor_request_id=$1 AND organization_id=$2 AND tenant_id=$3
         AND status IN ('CREATED','ANALYZING','PLANNING','SIMULATING')
       RETURNING *`,
      [input.conductor_request_id, input.organization_id, input.tenant_id, input.status, input.failure_reason || null, JSON.stringify(input.result_json || {}), JSON.stringify(input.risk_summary_json || {})],
    );
    return result.rows[0] || null;
  }

  async createTask(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO bos_conductor_tasks (
         conductor_task_id, conductor_request_id, organization_id, tenant_id,
         sequence, dependency_task_ids, description, capability,
         candidate_agent_identifier, resource_refs_json, model_provider,
         model_identifier, simulation_required, simulation_id, approval_required,
         approval_reason, status, decision_code, explanation, expected_output,
         metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [input.conductor_task_id, input.conductor_request_id, input.organization_id, input.tenant_id, input.sequence, input.dependency_task_ids || [], input.description, input.capability, input.candidate_agent_identifier || null, JSON.stringify(input.resource_refs_json || []), input.model_provider || null, input.model_identifier || null, input.simulation_required !== false, input.simulation_id || null, input.approval_required === true, input.approval_reason || null, input.status, input.decision_code || null, input.explanation || null, input.expected_output || null, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async getRequest(id: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM bos_conductor_requests WHERE conductor_request_id=$1 AND organization_id=$2 AND tenant_id=$3`, [id, organizationId, tenantId]);
    return result.rows[0] || null;
  }

  async listRequests(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM bos_conductor_requests WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC`, [organizationId, tenantId]);
    return result.rows;
  }

  async listTasks(id: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM bos_conductor_tasks WHERE conductor_request_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY sequence`, [id, organizationId, tenantId]);
    return result.rows;
  }
}
