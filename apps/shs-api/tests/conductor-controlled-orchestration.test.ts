import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { ConductorService } from "../src/domain/conductor/service/conductor-service.ts";
import { CONDUCTOR_DECISION_CODES } from "../src/domain/conductor/model/conductor.ts";

const actor = {
  user_id: "user-a",
  active_organization_id: "org-a",
  organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions: ["ai.conductor.use", "ai.conductor.read", "ai.simulation.create", "ai.simulation.read"],
};

class MemoryRepo {
  requests: any[] = [];
  tasks: any[] = [];
  async createRequest(input: any) {
    const row = { ...input, status: "CREATED", started_at: new Date(), created_at: new Date(), updated_at: new Date(), completed_at: null };
    this.requests.push(row);
    return row;
  }
  async finalizeRequest(input: any) {
    const row = this.requests.find((item) => item.conductor_request_id === input.conductor_request_id && item.organization_id === input.organization_id && item.tenant_id === input.tenant_id);
    if (!row) return null;
    Object.assign(row, { status: input.status, failure_reason: input.failure_reason || null, result_json: input.result_json || {}, risk_summary_json: input.risk_summary_json || {}, completed_at: new Date(), updated_at: new Date() });
    return row;
  }
  async createTask(input: any) {
    const row = { ...input, created_at: new Date(), updated_at: new Date() };
    this.tasks.push(row);
    return row;
  }
  async getRequest(id: string, organizationId: string, tenantId: string) {
    return this.requests.find((row) => row.conductor_request_id === id && row.organization_id === organizationId && row.tenant_id === tenantId) || null;
  }
  async listRequests(organizationId: string, tenantId: string) {
    return this.requests.filter((row) => row.organization_id === organizationId && row.tenant_id === tenantId);
  }
  async listTasks(id: string, organizationId: string, tenantId: string) {
    return this.tasks.filter((row) => row.conductor_request_id === id && row.organization_id === organizationId && row.tenant_id === tenantId).sort((a, b) => a.sequence - b.sequence);
  }
}

function makeService(options: any = {}) {
  const repo = options.repo || new MemoryRepo();
  const events: any[] = [];
  const simulationCalls: any[] = [];
  const simulations = options.simulations || {
    createSimulation: async (_actor: any, body: any) => {
      simulationCalls.push(body);
      return {
        simulationId: `agent_sim_${simulationCalls.length}`,
        status: options.simulationStatus || "APPROVAL_REQUIRED",
        proposedActions: options.proposedActions || [{
          actionId: "action-a",
          actionType: "WRITE",
          resourceType: "report",
          resourceId: "report-a",
          proposedOperation: "reports.update",
          status: options.actionStatus || "APPROVAL_REQUIRED",
          approvalRequired: true,
          approvalReason: "Simulated mutating or external action requires approval before any future execution.",
          riskLevel: "MODERATE",
          authorityCode: null,
          securityCode: null,
          policyCode: "SIMULATION_READY",
        }],
      };
    },
  };
  const svc = new ConductorService(
    repo as any,
    async (fn: any) => fn({ query: async () => ({ rows: [] }) }) as any,
    { enqueue: async (event: any) => { events.push(event); return event; } } as any,
    simulations as any,
  );
  return { svc, repo, events, simulationCalls };
}

function requestBody(overrides: any = {}) {
  return {
    goal: "Prepare the workforce program September 2026 monthly performance review.",
    purpose: "prepare report",
    sessionId: "ai_session_a",
    delegationId: "ai_delegation_a",
    agentIdentifier: "agent-a",
    model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" },
    resources: [{ resourceType: "report", resourceId: "report-a", scanId: "scan-a" }],
    proposedActions: [{
      actionType: "WRITE",
      resourceType: "report",
      resourceId: "report-a",
      scanId: "scan-a",
      requestedAction: "reports.update",
      proposedOperation: "reports.update",
      proposedWrite: { field: "summary", proposedValue: "draft" },
      toolType: "PROPOSED_WRITE",
    }],
    ...overrides,
  };
}

test("Conductor interprets a goal, creates tasks, requests simulation, and returns understandable simulated status", async () => {
  const { svc, events, simulationCalls } = makeService();
  const result = await svc.createRequest(actor, requestBody());
  assert.equal(result.status, "APPROVAL_REQUIRED");
  assert.equal(result.interpretation.intent, "prepare_report");
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].simulationId, "agent_sim_1");
  assert.equal(result.result.label, "SIMULATED / PROPOSED");
  assert.equal(result.result.actionsRequiringApproval.length, 1);
  assert.equal(simulationCalls[0].conductorRequestId, result.conductorRequestId);
  assert.equal(events.some((event) => event.event_type === "conductor.task.simulation_requested"), true);
});

test("Conductor blocks for missing information instead of fabricating resources or reporting period", async () => {
  const { svc, simulationCalls } = makeService();
  const result = await svc.createRequest(actor, requestBody({ goal: "Prepare the county report.", resources: [], proposedActions: [] }));
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.unresolvedQuestions.some((question: any) => question.code === "RESOURCE_REQUIRED"), true);
  assert.equal(result.unresolvedQuestions.some((question: any) => question.code === "REPORTING_PERIOD_REQUIRED"), true);
  assert.equal(simulationCalls.length, 0);
  assert.equal(result.tasks[0].decisionCode, CONDUCTOR_DECISION_CODES.CONDUCTOR_BLOCKED_MISSING_INFORMATION);
});

test("Conductor rejects execution requests and invalid dependency cycles", async () => {
  const { svc } = makeService();
  await assert.rejects(() => svc.createRequest(actor, requestBody({ execute: true })), /produces simulations only/);
  await assert.rejects(() => svc.createRequest(actor, requestBody({
    tasks: [
      { taskId: "a", dependencyTaskIds: ["b"], description: "A", capability: "SUMMARIZE", resources: [{ resourceType: "report", resourceId: "report-a" }], proposedActions: [{ actionType: "READ", resourceType: "report", resourceId: "report-a", requestedAction: "reports.view" }] },
      { taskId: "b", dependencyTaskIds: ["a"], description: "B", capability: "SUMMARIZE", resources: [{ resourceType: "report", resourceId: "report-a" }], proposedActions: [{ actionType: "READ", resourceType: "report", resourceId: "report-a", requestedAction: "reports.view" }] },
    ],
  })), /dependencies cannot contain cycles/);
});

test("Conductor surfaces backend denial codes as readable explanations", async () => {
  const { svc } = makeService({
    simulationStatus: "DENIED",
    proposedActions: [{
      actionId: "action-denied",
      actionType: "READ",
      resourceType: "source_document_version",
      resourceId: "source-a",
      proposedOperation: "curriculum.source.view",
      status: "DENIED",
      approvalRequired: false,
      riskLevel: "LOW",
      authorityCode: "RESOURCE_OUT_OF_SCOPE",
      securityCode: null,
      policyCode: "SIMULATION_AUTHORITY_DENIED",
    }],
  });
  const result = await svc.createRequest(actor, requestBody());
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.result.blockedActions[0].code, "RESOURCE_OUT_OF_SCOPE");
  assert.match(result.result.blockedActions[0].explanation, /outside the agent's delegated scope/);
});

test("Conductor reads are org/tenant scoped", async () => {
  const repo = new MemoryRepo();
  const { svc } = makeService({ repo });
  const result = await svc.createRequest(actor, requestBody());
  assert.equal((await svc.getRequest(actor, result.conductorRequestId)).conductorRequestId, result.conductorRequestId);
  await assert.rejects(() => svc.getRequest({ ...actor, tenant_id: "tenant:org-b" }, result.conductorRequestId), /ORG_CONTEXT_REQUIRED/);
});

test("Conductor route and migration surface remain simulation-only", () => {
  const router = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../src/domain/conductor/api/routes.ts", import.meta.url), "utf8");
  const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
  const sql = readFileSync(new URL("../migrations/092_bos_conductor_controlled_orchestration.sql", import.meta.url), "utf8");
  assert.match(router, /registerConductorRoutes/);
  assert.match(routes, /app\.post\("\/conductor\/requests"/);
  assert.match(routes, /app\.get\("\/conductor\/requests\/:requestId\/result"/);
  assert.match(permissions, /ai\.conductor\.use/);
  assert.doesNotMatch(permissions, /ai\.conductor\.execute/);
  assert.doesNotMatch(routes, /execute|mcp|headless|invokeTool|sendMessage|deployNow|publishNow/i);
  assert.doesNotMatch(sql, /mcp_server|tool_invocation|autonomous_execution|truth_fact|execute_agent/i);
});
