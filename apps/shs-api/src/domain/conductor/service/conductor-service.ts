import { randomUUID } from "node:crypto";
import { withTransaction } from "../../../db/transaction.js";
import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IntegrationOutboxRepo } from "../../trusted-reporting/outbox-repo.js";
import { AgentSimulationService } from "../../agent-simulation/service/agent-simulation-service.js";
import { McpService } from "../../mcp/service/mcp-service.js";
import { ConductorRepo, type Executor } from "../repo/conductor-repo.js";
import {
  CONDUCTOR_CAPABILITIES,
  CONDUCTOR_DECISION_CODES,
  explainDecision,
  toConductorRequestResponse,
  toConductorTaskResponse,
} from "../model/conductor.js";

type Actor = { user_id?: string; id?: string; active_organization_id?: string; organization_id?: string; tenant_id?: string; permissions?: string[] };

function actorScope(actor: Actor) {
  const userId = String(actor.user_id || actor.id || "");
  const organizationId = String(actor.active_organization_id || actor.organization_id || "");
  const tenantId = String(actor.tenant_id || `tenant:${organizationId}`);
  if (!userId || !organizationId || tenantId !== `tenant:${organizationId}`) throw new Error("ORG_CONTEXT_REQUIRED");
  return { userId, organizationId, tenantId };
}

function requireActorPermission(actor: Actor, permission: string) {
  if (!hasPermission(actor.permissions || [], permission)) throw new ConductorError("CONDUCTOR_PERMISSION_DENIED", "Conductor permission is required.", 403);
}

function normalizeModel(input: any) {
  const model = input || {};
  return {
    providerIdentifier: String(model.providerIdentifier || model.provider_identifier || model.provider || "").trim(),
    modelIdentifier: String(model.modelIdentifier || model.model_identifier || model.model || "").trim(),
  };
}

function normalizeResources(input: any[]) {
  return (Array.isArray(input) ? input : [])
    .map((item) => ({
      resourceType: String(item.resourceType || item.resource_type || "").trim(),
      resourceId: String(item.resourceId || item.resource_id || "").trim(),
      scanId: String(item.scanId || item.scan_id || "").trim() || null,
    }))
    .filter((item) => item.resourceType && item.resourceId);
}

function hasCycle(tasks: any[]) {
  const ids = new Set(tasks.map((task) => task.taskId));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const graph = new Map(tasks.map((task) => [task.taskId, (task.dependencyTaskIds || []).filter((id: string) => ids.has(id))]));
  function visit(id: string): boolean {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dep of graph.get(id) || []) if (visit(dep)) return true;
    visiting.delete(id);
    visited.add(id);
    return false;
  }
  return tasks.some((task) => visit(task.taskId));
}

function interpretGoal(goal: string, resources: any[]) {
  const text = goal.toLowerCase();
  const capabilities = new Set<string>([CONDUCTOR_CAPABILITIES.READ_RESOURCE, CONDUCTOR_CAPABILITIES.SUMMARIZE]);
  let intent = "coordinate_operation";
  let operationDomain = "general_operations";
  let desiredOutput = "Human-readable simulated plan and recommended next step.";
  if (text.includes("report") || text.includes("performance review")) {
    intent = "prepare_report";
    operationDomain = "reporting";
    desiredOutput = "Report draft preparation plan with simulated proposed actions.";
    capabilities.add(CONDUCTOR_CAPABILITIES.GENERATE_REPORT_DRAFT);
    capabilities.add(CONDUCTOR_CAPABILITIES.QUERY_VERIFIED_OUTCOMES);
  }
  if (text.includes("release")) {
    intent = "prepare_release_plan";
    operationDomain = "release";
    desiredOutput = "Release plan with simulated deployment/release actions.";
    capabilities.add(CONDUCTOR_CAPABILITIES.SIMULATE_RELEASE);
    capabilities.add(CONDUCTOR_CAPABILITIES.PROPOSE_DEPLOYMENT);
  }
  if (text.includes("student") || text.includes("progress")) {
    intent = "diagnose_progress";
    operationDomain = "program_operations";
    desiredOutput = "Progress risk analysis plan and proposed next actions.";
    capabilities.add(CONDUCTOR_CAPABILITIES.PROPOSE_WORKFLOW_ACTION);
  }
  const unresolvedQuestions = [];
  if (!resources.length) unresolvedQuestions.push({ code: "RESOURCE_REQUIRED", question: "Which resources should BOS analyze or plan against?" });
  if ((text.includes("monthly") || text.includes("report")) && !/\b(20\d{2}|january|february|march|april|may|june|july|august|september|october|november|december|q[1-4])\b/i.test(goal)) {
    unresolvedQuestions.push({ code: "REPORTING_PERIOD_REQUIRED", question: "Which reporting period should BOS use?" });
  }
  return {
    intent,
    objective: goal,
    operationDomain,
    desiredOutput,
    candidateCapabilities: Array.from(capabilities),
    candidateAgents: ["bos-governed-planner"],
    candidateActors: ["requesting_principal", "approved_reviewer"],
    potentialRisks: ["SIMULATION_ONLY", "APPROVAL_REQUIRED_FOR_MUTATION", "CONTEXT_MUST_BE_ADMITTED"],
    requiredDecisions: ["Review simulated blocked actions and approvals before any future execution phase."],
    unresolvedQuestions,
  };
}

function buildTasks(body: any, interpretation: any, resources: any[], model: any, agentIdentifier: string) {
  if (Array.isArray(body.tasks) && body.tasks.length) {
    return body.tasks.map((task: any, index: number) => ({
      taskId: String(task.taskId || task.task_id || `task-${index + 1}`),
      sequence: Number(task.sequence || index + 1),
      dependencyTaskIds: Array.isArray(task.dependencyTaskIds || task.dependency_task_ids) ? task.dependencyTaskIds || task.dependency_task_ids : [],
      description: String(task.description || `Simulate ${interpretation.intent}`).trim(),
      capability: String(task.capability || CONDUCTOR_CAPABILITIES.SUMMARIZE).trim().toUpperCase(),
      resources: normalizeResources(task.resources || resources),
      proposedActions: task.proposedActions || task.proposed_actions || body.proposedActions || body.proposed_actions || [],
      expectedOutput: String(task.expectedOutput || task.expected_output || interpretation.desiredOutput).trim(),
    }));
  }
  return [{
    taskId: "task-1",
    sequence: 1,
    dependencyTaskIds: [],
    description: `Plan and simulate: ${interpretation.objective}`,
    capability: interpretation.candidateCapabilities.includes(CONDUCTOR_CAPABILITIES.SIMULATE_RELEASE) ? CONDUCTOR_CAPABILITIES.SIMULATE_RELEASE : CONDUCTOR_CAPABILITIES.GENERATE_REPORT_DRAFT,
    resources,
    proposedActions: body.proposedActions || body.proposed_actions || resources.map((resource: any) => ({
      actionType: "READ",
      resourceType: resource.resourceType,
      resourceId: resource.resourceId,
      scanId: resource.scanId,
      requestedAction: body.requestedAction || body.requested_action || "reports.view",
      proposedOperation: body.requestedAction || body.requested_action || "reports.view",
      toolType: "READ_ONLY_RESOURCE",
      toolReference: "canonical-resource-read",
    })),
    expectedOutput: interpretation.desiredOutput,
  }];
}

function summarize(simulations: any[], tasks: any[], unresolvedQuestions: any[], mcpInvocations: any[] = []) {
  const actions = simulations.flatMap((simulation) => simulation.proposedActions || []);
  const blocked = actions.filter((action) => action.status === "DENIED");
  const approvals = actions.filter((action) => action.approvalRequired);
  const ready = actions.filter((action) => action.status === "READY");
  return {
    label: "SIMULATED / PROPOSED",
    plan: tasks.map((task) => ({ sequence: task.sequence, description: task.description, capability: task.capability })),
    simulationsCompleted: simulations.map((simulation) => simulation.simulationId),
    mcpInvocations: mcpInvocations.map((invocation) => ({ invocationId: invocation.invocationId, serverId: invocation.serverId, toolId: invocation.toolId, status: invocation.status, simulated: true, approvalRequired: invocation.approvalRequired, securityCode: invocation.securityCode, authorityCode: invocation.authorityCode })),
    readyActions: ready.map((action) => ({ actionId: action.actionId, operation: action.proposedOperation, resource: `${action.resourceType}:${action.resourceId}` })),
    actionsRequiringApproval: approvals.map((action) => ({ actionId: action.actionId, reason: action.approvalReason, riskLevel: action.riskLevel })),
    blockedActions: blocked.map((action) => ({ actionId: action.actionId, code: action.authorityCode || action.securityCode || action.policyCode, explanation: explainDecision(action.authorityCode || action.securityCode || action.policyCode) })),
    securityIssues: Array.from(new Set(actions.map((action) => action.securityCode).filter(Boolean))),
    policyIssues: Array.from(new Set(actions.map((action) => action.authorityCode || action.policyCode).filter(Boolean))),
    missingInformation: unresolvedQuestions,
    recommendedNextStep: unresolvedQuestions.length ? "Answer the missing questions, then rerun the Conductor plan." : blocked.length ? "Resolve the blocked governance or security issue before any future execution phase." : approvals.length ? "Review the proposed approvals. Phase 4 cannot execute them." : "Review the simulated plan. Execution remains disabled in Phase 4.",
  };
}

export class ConductorError extends Error {
  constructor(public code: string, message = code, public statusCode = 400) {
    super(message);
  }
}

export class ConductorService {
  constructor(
    private repo = new ConductorRepo(),
    private transaction: typeof withTransaction = withTransaction,
    private outbox = new IntegrationOutboxRepo(),
    private simulations = new AgentSimulationService(),
    private mcp = new McpService(),
  ) {}

  private async emit(executor: Executor | null, type: string, subjectType: string, subjectId: string, scope: any, payload: Record<string, unknown> = {}) {
    const event = {
      producer_id: "shs-api.conductor",
      event_type: type,
      subject_type: subjectType,
      subject_id: subjectId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      originating_actor_id: scope.userId,
      originating_actor_type: "user",
      occurred_at: new Date().toISOString(),
      idempotency_key: `${type}:${subjectId}`,
      correlation_id: `conductor:${subjectId}`,
      destination: "shs-conductor",
      payload: { ...payload, execution_enabled: false },
    };
    if (executor) await this.outbox.enqueue(event, executor);
    else await this.outbox.enqueue(event);
  }

  async createRequest(actor: Actor, body: any) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_USE);
    const scope = actorScope(actor);
    if (body.execute === true || body.executionRequested === true || body.execution_requested === true) {
      throw new ConductorError(CONDUCTOR_DECISION_CODES.CONDUCTOR_EXECUTION_DISABLED, "BOS Conductor produces simulations only in Phase 4.", 403);
    }
    const goal = String(body.goal || "").trim();
    const purpose = String(body.purpose || goal).trim();
    const agentIdentifier = String(body.agentIdentifier || body.agent_identifier || "bos-governed-planner").trim();
    const sessionId = String(body.sessionId || body.session_id || "").trim();
    const delegationId = String(body.delegationId || body.delegation_id || "").trim();
    const model = normalizeModel(body.model);
    if (!goal || !purpose || !sessionId || !delegationId) throw new ConductorError("CONDUCTOR_REQUIRED_FIELDS", "Goal, purpose, session, and delegation are required.");
    const resources = normalizeResources(body.resources || body.resourceRefs || body.resource_refs || []);
    const interpretation = interpretGoal(goal, resources);
    const tasks = buildTasks(body, interpretation, resources, model, agentIdentifier);
    if (hasCycle(tasks)) throw new ConductorError(CONDUCTOR_DECISION_CODES.CONDUCTOR_INVALID_DEPENDENCY_GRAPH, "Conductor task dependencies cannot contain cycles.");
    const requestId = `conductor_req_${randomUUID()}`;
    const unresolved = interpretation.unresolvedQuestions;
    const simulations: any[] = [];
    const mcpInvocations: any[] = [];

    let request = await this.repo.createRequest({
      conductor_request_id: requestId,
      principal_user_id: scope.userId,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      goal,
      purpose,
      source_session_id: sessionId,
      requested_operation_ref: body.requestedOperationRef || body.requested_operation_ref || null,
      interpretation_json: interpretation,
      unresolved_questions_json: unresolved,
      created_by: scope.userId,
      metadata_json: { executionEnabled: false, conductorVersion: "controlled-orchestration-v1" },
    });
    await this.emit(null, "conductor.request.created", "bos_conductor_request", request.conductor_request_id, scope, { goal });

    const storedTasks = [];
    if (unresolved.length) {
      for (const task of tasks) {
        storedTasks.push(await this.repo.createTask({
          conductor_task_id: `conductor_task_${randomUUID()}`,
          conductor_request_id: request.conductor_request_id,
          organization_id: scope.organizationId,
          tenant_id: scope.tenantId,
          sequence: task.sequence,
          dependency_task_ids: task.dependencyTaskIds,
          description: task.description,
          capability: task.capability,
          candidate_agent_identifier: agentIdentifier,
          resource_refs_json: task.resources,
          model_provider: model.providerIdentifier || null,
          model_identifier: model.modelIdentifier || null,
          status: "BLOCKED",
          decision_code: CONDUCTOR_DECISION_CODES.CONDUCTOR_BLOCKED_MISSING_INFORMATION,
          explanation: "BOS needs missing information before it can request simulations.",
          expected_output: task.expectedOutput,
        }));
      }
      request = await this.repo.finalizeRequest({
        conductor_request_id: request.conductor_request_id,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        status: "BLOCKED",
        failure_reason: "Missing information prevents simulation.",
        result_json: summarize([], tasks, unresolved, mcpInvocations),
        risk_summary_json: { highestRisk: "UNKNOWN", approvalRequired: false },
      }) || request;
      await this.emit(null, "conductor.task.blocked", "bos_conductor_request", request.conductor_request_id, scope, { decision_code: CONDUCTOR_DECISION_CODES.CONDUCTOR_BLOCKED_MISSING_INFORMATION });
      return toConductorRequestResponse(request, storedTasks);
    }

    for (const task of tasks) {
      await this.emit(null, "conductor.task.simulation_requested", "bos_conductor_request", request.conductor_request_id, scope, { sequence: task.sequence, capability: task.capability });
      const simulation = await this.simulations.createSimulation(actor, {
        agentIdentifier,
        sessionId,
        delegationId,
        goal: task.description,
        purpose,
        model,
        conductorRequestId: request.conductor_request_id,
        proposedActions: task.proposedActions,
      });
      simulations.push(simulation);
      const denied = simulation.status === "DENIED";
      const approvalRequired = simulation.status === "APPROVAL_REQUIRED" || (simulation.proposedActions || []).some((action: any) => action.approvalRequired);
      const code = denied ? CONDUCTOR_DECISION_CODES.CONDUCTOR_SIMULATION_DENIED : approvalRequired ? CONDUCTOR_DECISION_CODES.CONDUCTOR_APPROVAL_REQUIRED : CONDUCTOR_DECISION_CODES.CONDUCTOR_READY;
      storedTasks.push(await this.repo.createTask({
        conductor_task_id: `conductor_task_${randomUUID()}`,
        conductor_request_id: request.conductor_request_id,
        organization_id: scope.organizationId,
        tenant_id: scope.tenantId,
        sequence: task.sequence,
        dependency_task_ids: task.dependencyTaskIds,
        description: task.description,
        capability: task.capability,
        candidate_agent_identifier: agentIdentifier,
        resource_refs_json: task.resources,
        model_provider: model.providerIdentifier || null,
        model_identifier: model.modelIdentifier || null,
        simulation_id: simulation.simulationId,
        approval_required: approvalRequired,
        approval_reason: approvalRequired ? "One or more simulated actions require approval before any future execution phase." : null,
        status: denied ? "DENIED" : approvalRequired ? "APPROVAL_REQUIRED" : "READY",
        decision_code: code,
        explanation: denied ? "One or more simulated actions were denied by governance or security policy." : approvalRequired ? "One or more simulated actions require human approval. Phase 4 cannot execute them." : "Simulation is ready for review. No execution occurred.",
        expected_output: task.expectedOutput,
      }));
    }

    if (body.mcpRequest || body.mcp_request) {
      const invocation = await this.mcp.simulateInvocation(actor, { ...(body.mcpRequest || body.mcp_request), conductorRequestId: request.conductor_request_id });
      mcpInvocations.push(invocation);
    }
    const result = summarize(simulations, tasks, unresolved, mcpInvocations);
    const finalStatus = result.blockedActions.length ? "BLOCKED" : result.actionsRequiringApproval.length ? "APPROVAL_REQUIRED" : "READY";
    request = await this.repo.finalizeRequest({
      conductor_request_id: request.conductor_request_id,
      organization_id: scope.organizationId,
      tenant_id: scope.tenantId,
      status: finalStatus,
      failure_reason: finalStatus === "BLOCKED" ? "One or more simulations were denied." : null,
      result_json: result,
      risk_summary_json: { approvalRequired: result.actionsRequiringApproval.length > 0, blockedCount: result.blockedActions.length },
    }) || request;
    await this.emit(null, finalStatus === "APPROVAL_REQUIRED" ? "conductor.approval_required" : finalStatus === "BLOCKED" ? "conductor.task.blocked" : "conductor.completed", "bos_conductor_request", request.conductor_request_id, scope, { status: finalStatus });
    return toConductorRequestResponse(request, storedTasks);
  }

  async getRequest(actor: Actor, id: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ);
    const scope = actorScope(actor);
    const request = await this.repo.getRequest(id, scope.organizationId, scope.tenantId);
    if (!request) throw new ConductorError("CONDUCTOR_REQUEST_NOT_FOUND", "Conductor request not found.", 404);
    const tasks = await this.repo.listTasks(id, scope.organizationId, scope.tenantId);
    return toConductorRequestResponse(request, tasks);
  }

  async listRequests(actor: Actor) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ);
    const scope = actorScope(actor);
    const rows = await this.repo.listRequests(scope.organizationId, scope.tenantId);
    return rows.map((row: any) => toConductorRequestResponse(row));
  }

  async getTasks(actor: Actor, id: string) {
    requireActorPermission(actor, SHS_SECURITY_PERMISSIONS.AI_CONDUCTOR_READ);
    const scope = actorScope(actor);
    const request = await this.repo.getRequest(id, scope.organizationId, scope.tenantId);
    if (!request) throw new ConductorError("CONDUCTOR_REQUEST_NOT_FOUND", "Conductor request not found.", 404);
    return (await this.repo.listTasks(id, scope.organizationId, scope.tenantId)).map(toConductorTaskResponse);
  }

  async getResult(actor: Actor, id: string) {
    return (await this.getRequest(actor, id)).result;
  }
}
