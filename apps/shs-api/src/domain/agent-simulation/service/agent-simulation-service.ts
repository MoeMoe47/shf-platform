import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { AiGovernanceService } from "../../ai-governance/service/ai-governance-service.js";
import { InputSecurityService } from "../../input-security/service/input-security-service.js";
import { AgentSimulationRepo, type Executor } from "../repo/agent-simulation-repo.js";
import {
  ACTION_TYPES,
  SIMULATION_DECISION_CODES,
  toLedgerResponse,
  toPlanStepResponse,
  toProposedActionResponse,
  toSimulationResponse,
} from "../model/agent-simulation.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };

function actorScope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requireActorPermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new AgentSimulationError("AI_SIMULATION_PERMISSION_REQUIRED", "AI simulation permission is required.", 403);
}

function normalizeModel(input: any) {
  const model = input || {};
  return {
    providerIdentifier: String(model.providerIdentifier || model.provider_identifier || model.provider || "").trim(),
    modelIdentifier: String(model.modelIdentifier || model.model_identifier || model.model || "").trim(),
  };
}

function classifyRisk(action: any, classification: string) {
  const type = String(action.actionType || action.action_type || "").toUpperCase();
  const operation = String(action.proposedOperation || action.proposed_operation || "").toLowerCase();
  if (["PERMISSION_CHANGE", "DELEGATION_CHANGE", "DEPLOYMENT", "RELEASE"].includes(type)) return "CRITICAL";
  if (operation.includes("delete") || operation.includes("publish") || operation.includes("revoke")) return "CRITICAL";
  if (["EXTERNAL_CALL", "MESSAGE_SEND"].includes(type) || classification === "RESTRICTED") return "HIGH";
  if (type === "WRITE" || classification === "SENSITIVE") return "MODERATE";
  return "LOW";
}

function approvalFor(action: any, riskLevel: string, classification: string) {
  const type = String(action.actionType || action.action_type || "").toUpperCase();
  if (["WRITE", "EXTERNAL_CALL", "MESSAGE_SEND", "DEPLOYMENT", "PERMISSION_CHANGE", "DELEGATION_CHANGE", "RELEASE"].includes(type)) {
    return { approvalRequired: true, approvalType: "HUMAN_REVIEW", approvalReason: "Simulated mutating or external action requires approval before any future execution." };
  }
  if (["HIGH", "CRITICAL"].includes(riskLevel) || ["SENSITIVE", "RESTRICTED"].includes(classification)) {
    return { approvalRequired: true, approvalType: "RISK_REVIEW", approvalReason: "Risk or classification requires review before execution." };
  }
  return { approvalRequired: false, approvalType: null, approvalReason: null };
}

function actionType(value: any) {
  const type = String(value || "").trim().toUpperCase();
  if (!(ACTION_TYPES as readonly string[]).includes(type)) throw new AgentSimulationError("SIMULATION_INVALID_PLAN", "Unsupported proposed action type.");
  return type;
}

export class AgentSimulationError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) {
    super(message);
  }
}

export class AgentSimulationService {
  constructor(
    private repo = new AgentSimulationRepo(),
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
    private aiGovernance = new AiGovernanceService(),
    private inputSecurity = new InputSecurityService(),
  ) {}

  private async emit(executor: Executor | null, type: string, subjectType: string, subjectId: string, scope: any, payload: Record<string, unknown> = {}) {
    const event = {
      producer_id: "shs-api.agent-simulation",
      event_type: type,
      subject_type: subjectType,
      subject_id: subjectId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      originating_actor_id: scope.userId,
      originating_actor_type: "user",
      occurred_at: new Date().toISOString(),
      idempotency_key: `${type}:${subjectId}`,
      correlation_id: `agent-simulation:${subjectId}`,
      destination: "shs-agent-fabric",
      payload: { ...payload, activity_kind: "SIMULATED" },
    };
    if (executor) await this.outbox.enqueue(event, executor);
    else await this.outbox.enqueue(event);
  }

  private async evaluateContext(actor: Actor, scope: any, body: any, action: any, model: any) {
    const resourceType = String(action.resourceType || action.resource_type || "").trim();
    const resourceId = String(action.resourceId || action.resource_id || "").trim();
    if (!resourceType || !resourceId) throw new AgentSimulationError("SIMULATION_INVALID_PLAN", "Proposed action requires resource reference.");
    const admission = await this.inputSecurity.evaluateContextAdmission(actor, {
      scanId: action.scanId || action.scan_id,
      sessionId: body.sessionId || body.session_id,
      delegationId: body.delegationId || body.delegation_id,
      agentIdentifier: body.agentIdentifier || body.agent_identifier,
      purpose: body.purpose,
      action: action.requestedAction || action.requested_action || action.proposedOperation || action.proposed_operation,
      resourceType,
      resourceId,
      organizationId: scope.organizationId,
      tenantId: scope.tenantId,
      intendedUse: body.purpose,
      model,
    });
    return admission;
  }

  async createSimulation(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SIMULATION_CREATE);
    const scope = actorScope(actor);
    const agentIdentifier = String(body.agentIdentifier || body.agent_identifier || "").trim();
    const sessionId = String(body.sessionId || body.session_id || "").trim();
    const delegationId = String(body.delegationId || body.delegation_id || "").trim();
    const goal = String(body.goal || "").trim();
    const purpose = String(body.purpose || "").trim();
    const model = normalizeModel(body.model);
    const proposed = Array.isArray(body.proposedActions || body.proposed_actions) ? body.proposedActions || body.proposed_actions : [];
    if (!agentIdentifier || !sessionId || !delegationId || !goal || !purpose) throw new AgentSimulationError("SIMULATION_REQUIRED_FIELDS", "Agent, session, delegation, goal, and purpose are required.");
    if (!proposed.length) throw new AgentSimulationError("SIMULATION_INVALID_PLAN", "At least one proposed action is required.");

    const evaluatedActions = [];
    const contextAdmissionIds = new Set<string>();
    for (const [index, raw] of proposed.entries()) {
      const type = actionType(raw.actionType || raw.action_type);
      const resource = {
        resourceType: String(raw.resourceType || raw.resource_type || "").trim(),
        resourceId: String(raw.resourceId || raw.resource_id || "").trim(),
      };
      const requestedAction = String(raw.requestedAction || raw.requested_action || raw.proposedOperation || raw.proposed_operation || "").trim();
      if (!requestedAction) throw new AgentSimulationError("SIMULATION_INVALID_PLAN", "Proposed action requires requested action.");
      const authority = await this.aiGovernance.evaluateAgentAuthority({
        principalUserId: scope.userId,
        agentIdentifier,
        organizationId: scope.organizationId,
        tenantId: scope.tenantId,
        delegationId,
        sessionId,
        purpose,
        resource,
        action: requestedAction,
        model,
      });
      const context = await this.evaluateContext(actor, scope, body, raw, model);
      if (context.admissionId) contextAdmissionIds.add(context.admissionId);
      const classification = String((authority as any).classificationDecision?.classification || context.resourceClassification || "INTERNAL");
      const riskLevel = classifyRisk(raw, classification);
      const approval = approvalFor(raw, riskLevel, classification);
      const authorityAllowed = authority.allowed === true;
      const securityAllowed = context.admitted === true;
      const policyAllowed = authorityAllowed && securityAllowed;
      const status = !authorityAllowed || !securityAllowed
        ? "DENIED"
        : approval.approvalRequired
          ? "APPROVAL_REQUIRED"
          : type === "READ"
            ? "READY"
            : "WRITE_PREVENTED";
      evaluatedActions.push({
        sequence: Number(raw.sequence || index + 1),
        actionType: type,
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        toolType: String(raw.toolType || raw.tool_type || "SIMULATION_ONLY").trim(),
        toolReference: String(raw.toolReference || raw.tool_reference || "").trim() || null,
        proposedOperation: requestedAction,
        proposedPayload: raw.proposedPayload || raw.proposed_payload || {},
        proposedWrite: raw.proposedWrite || raw.proposed_write || {},
        riskLevel,
        authorityAllowed,
        authorityCode: authorityAllowed ? null : String((authority as any).denialCode || SIMULATION_DECISION_CODES.SIMULATION_AUTHORITY_DENIED),
        policyAllowed,
        policyCode: policyAllowed ? SIMULATION_DECISION_CODES.SIMULATION_READY : (!authorityAllowed ? SIMULATION_DECISION_CODES.SIMULATION_AUTHORITY_DENIED : SIMULATION_DECISION_CODES.SIMULATION_CONTEXT_DENIED),
        securityAllowed,
        securityCode: securityAllowed ? null : String(context.decisionCode || SIMULATION_DECISION_CODES.SIMULATION_CONTEXT_DENIED),
        approvalRequired: approval.approvalRequired,
        approvalType: approval.approvalType,
        approvalReason: approval.approvalReason,
        predictedSideEffect: "SIMULATED_ONLY_NO_PRODUCTION_SIDE_EFFECT",
        status,
        classification,
      });
    }

    const denied = evaluatedActions.some((item) => item.status === "DENIED");
    const approvalRequired = evaluatedActions.some((item) => item.status === "APPROVAL_REQUIRED" || item.approvalRequired);
    const finalStatus = denied ? "DENIED" : approvalRequired ? "APPROVAL_REQUIRED" : "READY";
    const simulationId = `agent_sim_${randomUUID()}`;

    return this.transaction(async (db: Executor) => {
      const simulation = await this.repo.createSimulation({
        simulation_id: simulationId,
        conductor_request_id: body.conductorRequestId || body.conductor_request_id || null,
        agent_identifier: agentIdentifier,
        session_id: sessionId,
        delegation_id: delegationId,
        principal_user_id: scope.userId,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        goal,
        purpose,
        requested_model_provider: model.providerIdentifier || null,
        requested_model_identifier: model.modelIdentifier || null,
        context_admission_ids: Array.from(contextAdmissionIds),
        created_by: scope.userId,
        metadata_json: { executionEnabled: false },
      }, db);
      await this.emit(db, "agent_simulation.created", "ai_agent_simulation", simulation.simulation_id, scope, { agent_identifier: agentIdentifier });
      const steps = [];
      const actions = [];
      for (const action of evaluatedActions) {
        const step = await this.repo.createPlanStep({
          plan_step_id: `agent_sim_step_${randomUUID()}`,
          simulation_id: simulation.simulation_id,
          organization_id: scope.organizationId,
          tenant_id: scope.tenantId,
          sequence: action.sequence,
          step_type: action.actionType === "READ" ? "READ_RESOURCE" : action.actionType === "EXTERNAL_CALL" ? "PROPOSE_EXTERNAL_ACTION" : action.actionType === "MESSAGE_SEND" ? "PROPOSE_MESSAGE" : action.actionType === "DEPLOYMENT" ? "PROPOSE_DEPLOYMENT" : "PROPOSE_WRITE",
          description: `Simulate ${action.proposedOperation} on ${action.resourceType}:${action.resourceId}`,
          resource_type: action.resourceType,
          resource_id: action.resourceId,
          requested_action: action.proposedOperation,
          tool_type: action.toolType,
          tool_reference: action.toolReference,
          model_provider: model.providerIdentifier || null,
          model_identifier: model.modelIdentifier || null,
          required_permission: action.proposedOperation,
          required_delegation_scope: { resources: [{ resourceType: action.resourceType, resourceId: action.resourceId }] },
          classification_requirement: action.classification,
          approval_required: action.approvalRequired,
          expected_output: "Simulation record and proposed action only.",
          status: action.status === "DENIED" ? "DENIED" : action.approvalRequired ? "APPROVAL_REQUIRED" : "READY",
        }, db);
        steps.push(step);
        const proposedAction = await this.repo.createProposedAction({
          action_id: `agent_sim_action_${randomUUID()}`,
          simulation_id: simulation.simulation_id,
          organization_id: scope.organizationId,
          tenant_id: scope.tenantId,
          sequence: action.sequence,
          action_type: action.actionType,
          resource_type: action.resourceType,
          resource_id: action.resourceId,
          tool_type: action.toolType,
          tool_reference: action.toolReference,
          proposed_operation: action.proposedOperation,
          proposed_payload_json: action.proposedPayload,
          proposed_write_json: action.proposedWrite,
          risk_level: action.riskLevel,
          authority_allowed: action.authorityAllowed,
          authority_code: action.authorityCode,
          policy_allowed: action.policyAllowed,
          policy_code: action.policyCode,
          security_allowed: action.securityAllowed,
          security_code: action.securityCode,
          approval_required: action.approvalRequired,
          approval_type: action.approvalType,
          approval_reason: action.approvalReason,
          predicted_side_effect: action.predictedSideEffect,
          status: action.status,
          metadata_json: { simulated: true, productionMutation: false },
        }, db);
        actions.push(proposedAction);
        await this.emit(db, "agent_simulation.action_proposed", "ai_agent_simulation_proposed_action", proposedAction.action_id, scope, { simulation_id: simulation.simulation_id, status: proposedAction.status, risk_level: proposedAction.risk_level });
      }
      const finalized = await this.repo.finalizeSimulation({
        simulation_id: simulation.simulation_id,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        status: finalStatus,
        failure_reason: denied ? "One or more simulated actions were denied by authority or context policy." : null,
      }, db);
      await this.emit(db, denied ? "agent_simulation.policy_denied" : approvalRequired ? "agent_simulation.approval_required" : "agent_simulation.completed", "ai_agent_simulation", simulation.simulation_id, scope, { status: finalStatus });
      return toSimulationResponse(finalized || simulation, steps, actions);
    });
  }

  async getSimulation(actor: Actor, simulationId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ);
    const scope = actorScope(actor);
    const simulation = await this.repo.getSimulation(simulationId, scope.organizationId, scope.tenantId);
    if (!simulation) throw new AgentSimulationError("SIMULATION_NOT_FOUND", "Simulation not found.", 404);
    const steps = await this.repo.listPlanSteps(simulationId, scope.organizationId, scope.tenantId);
    const actions = await this.repo.listProposedActions(simulationId, scope.organizationId, scope.tenantId);
    return toSimulationResponse(simulation, steps, actions);
  }

  async listSimulations(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ);
    const scope = actorScope(actor);
    const rows = await this.repo.listSimulations(scope.organizationId, scope.tenantId);
    return rows.map((row: any) => toSimulationResponse(row));
  }

  async getPlan(actor: Actor, simulationId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ);
    const scope = actorScope(actor);
    const simulation = await this.repo.getSimulation(simulationId, scope.organizationId, scope.tenantId);
    if (!simulation) throw new AgentSimulationError("SIMULATION_NOT_FOUND", "Simulation not found.", 404);
    return (await this.repo.listPlanSteps(simulationId, scope.organizationId, scope.tenantId)).map(toPlanStepResponse);
  }

  async getActions(actor: Actor, simulationId: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_SIMULATION_READ);
    const scope = actorScope(actor);
    const simulation = await this.repo.getSimulation(simulationId, scope.organizationId, scope.tenantId);
    if (!simulation) throw new AgentSimulationError("SIMULATION_NOT_FOUND", "Simulation not found.", 404);
    return (await this.repo.listProposedActions(simulationId, scope.organizationId, scope.tenantId)).map(toProposedActionResponse);
  }

  async listActivity(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_ACTIVITY_READ);
    const scope = actorScope(actor);
    return (await this.repo.listLedger(scope.organizationId, scope.tenantId)).map(toLedgerResponse);
  }

  async appendAfterCompletion() {
    throw new AgentSimulationError("SIMULATION_IMMUTABLE", "Completed simulation history is immutable.", 409);
  }
}
