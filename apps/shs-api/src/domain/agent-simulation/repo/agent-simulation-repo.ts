import { query } from "../../../db/client.js";

export type Executor = { query: (sql: string, params?: unknown[]) => Promise<any> };

export class AgentSimulationRepo {
  constructor(private dbQuery: typeof query = query) {}

  async createSimulation(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_agent_simulations (
         simulation_id, conductor_request_id, agent_identifier, session_id, delegation_id, principal_user_id,
         organization_id, tenant_id, goal, purpose, status, requested_model_provider,
         requested_model_identifier, context_admission_ids, created_by, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'CREATED',$11,$12,$13,$14,$15)
       RETURNING *`,
      [input.simulation_id, input.conductor_request_id || null, input.agent_identifier, input.session_id, input.delegation_id, input.principal_user_id, input.organization_id, input.tenant_id, input.goal, input.purpose, input.requested_model_provider || null, input.requested_model_identifier || null, input.context_admission_ids || [], input.created_by, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async finalizeSimulation(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `UPDATE ai_agent_simulations
       SET status=$4, completed_at=NOW(), failure_reason=$5, updated_at=NOW()
       WHERE simulation_id=$1 AND organization_id=$2 AND tenant_id=$3
         AND status IN ('CREATED','PLANNING','POLICY_EVALUATION')
       RETURNING *`,
      [input.simulation_id, input.organization_id, input.tenant_id, input.status, input.failure_reason || null],
    );
    return result.rows[0] || null;
  }

  async createPlanStep(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_agent_simulation_plan_steps (
         plan_step_id, simulation_id, organization_id, tenant_id, sequence, step_type,
         description, resource_type, resource_id, requested_action, tool_type,
         tool_reference, model_provider, model_identifier, required_permission,
         required_delegation_scope, classification_requirement, approval_required,
         expected_output, status, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [input.plan_step_id, input.simulation_id, input.organization_id, input.tenant_id, input.sequence, input.step_type, input.description, input.resource_type || null, input.resource_id || null, input.requested_action || null, input.tool_type || null, input.tool_reference || null, input.model_provider || null, input.model_identifier || null, input.required_permission || null, JSON.stringify(input.required_delegation_scope || {}), input.classification_requirement || null, input.approval_required === true, input.expected_output || null, input.status, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async createProposedAction(input: any, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(
      `INSERT INTO ai_agent_simulation_proposed_actions (
         action_id, simulation_id, organization_id, tenant_id, sequence, action_type,
         resource_type, resource_id, tool_type, tool_reference, proposed_operation,
         proposed_payload_json, proposed_write_json, risk_level, authority_allowed,
         authority_code, policy_allowed, policy_code, security_allowed, security_code,
         approval_required, approval_type, approval_reason, predicted_side_effect,
         status, metadata_json
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING *`,
      [input.action_id, input.simulation_id, input.organization_id, input.tenant_id, input.sequence, input.action_type, input.resource_type, input.resource_id, input.tool_type || null, input.tool_reference || null, input.proposed_operation, JSON.stringify(input.proposed_payload_json || {}), JSON.stringify(input.proposed_write_json || {}), input.risk_level, input.authority_allowed === true, input.authority_code || null, input.policy_allowed === true, input.policy_code || null, input.security_allowed === true, input.security_code || null, input.approval_required === true, input.approval_type || null, input.approval_reason || null, input.predicted_side_effect, input.status, JSON.stringify(input.metadata_json || {})],
    );
    return result.rows[0];
  }

  async getSimulation(simulationId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_agent_simulations WHERE simulation_id=$1 AND organization_id=$2 AND tenant_id=$3`, [simulationId, organizationId, tenantId]);
    return result.rows[0] || null;
  }

  async listSimulations(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_agent_simulations WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC`, [organizationId, tenantId]);
    return result.rows;
  }

  async listPlanSteps(simulationId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_agent_simulation_plan_steps WHERE simulation_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY sequence`, [simulationId, organizationId, tenantId]);
    return result.rows;
  }

  async listProposedActions(simulationId: string, organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_agent_simulation_proposed_actions WHERE simulation_id=$1 AND organization_id=$2 AND tenant_id=$3 ORDER BY sequence`, [simulationId, organizationId, tenantId]);
    return result.rows;
  }

  async listLedger(organizationId: string, tenantId: string, executor: Executor = { query: this.dbQuery }) {
    const result = await executor.query(`SELECT * FROM ai_agent_activity_ledger WHERE organization_id=$1 AND tenant_id=$2 ORDER BY created_at DESC`, [organizationId, tenantId]);
    return result.rows;
  }
}
