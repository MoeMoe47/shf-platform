import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { AgentSimulationService } from "../src/domain/agent-simulation/service/agent-simulation-service.ts";
import { SIMULATION_DECISION_CODES } from "../src/domain/agent-simulation/model/agent-simulation.ts";

const actor = {
  user_id: "user-a",
  active_organization_id: "org-a",
  organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions: [
    "ai.simulation.create",
    "ai.simulation.read",
    "ai.activity.read",
    "ai.context.evaluate",
    "ai.governance.evaluate",
    "reports.view",
    "reports.update",
  ],
};

class MemoryRepo {
  simulations: any[] = [];
  steps: any[] = [];
  actions: any[] = [];
  async createSimulation(input: any) {
    const row = { ...input, status: "CREATED", started_at: new Date(), created_at: new Date(), updated_at: new Date(), completed_at: null };
    this.simulations.push(row);
    return row;
  }
  async finalizeSimulation(input: any) {
    const row = this.simulations.find((item) => item.simulation_id === input.simulation_id && item.organization_id === input.organization_id && item.tenant_id === input.tenant_id && ["CREATED", "PLANNING", "POLICY_EVALUATION"].includes(item.status));
    if (!row) return null;
    Object.assign(row, { status: input.status, failure_reason: input.failure_reason || null, completed_at: new Date(), updated_at: new Date() });
    return row;
  }
  async createPlanStep(input: any) {
    const row = { ...input, created_at: new Date() };
    this.steps.push(row);
    return row;
  }
  async createProposedAction(input: any) {
    const row = { ...input, created_at: new Date() };
    this.actions.push(row);
    return row;
  }
  async getSimulation(id: string, organizationId: string, tenantId: string) {
    return this.simulations.find((row) => row.simulation_id === id && row.organization_id === organizationId && row.tenant_id === tenantId) || null;
  }
  async listSimulations(organizationId: string, tenantId: string) {
    return this.simulations.filter((row) => row.organization_id === organizationId && row.tenant_id === tenantId);
  }
  async listPlanSteps(id: string, organizationId: string, tenantId: string) {
    return this.steps.filter((row) => row.simulation_id === id && row.organization_id === organizationId && row.tenant_id === tenantId).sort((a, b) => a.sequence - b.sequence);
  }
  async listProposedActions(id: string, organizationId: string, tenantId: string) {
    return this.actions.filter((row) => row.simulation_id === id && row.organization_id === organizationId && row.tenant_id === tenantId).sort((a, b) => a.sequence - b.sequence);
  }
  async listLedger(organizationId: string, tenantId: string) {
    return this.simulations
      .filter((row) => row.organization_id === organizationId && row.tenant_id === tenantId)
      .map((row) => {
        const actions = this.actions.filter((action) => action.simulation_id === row.simulation_id);
        return {
          ...row,
          proposed_action_count: actions.length,
          denied_action_count: actions.filter((action) => action.status === "DENIED").length,
          approval_required_count: actions.filter((action) => action.approval_required).length,
          security_codes: Array.from(new Set(actions.map((action) => action.security_code).filter(Boolean))),
          authority_codes: Array.from(new Set(actions.map((action) => action.authority_code).filter(Boolean))),
          activity_kind: "SIMULATED",
        };
      });
  }
}

function makeService(options: any = {}) {
  const repo = options.repo || new MemoryRepo();
  const events: any[] = [];
  const productionWrites: any[] = [];
  const externalCalls: any[] = [];
  const deployments: any[] = [];
  const permissionChanges: any[] = [];
  const aiGovernance = options.aiGovernance || {
    evaluateAgentAuthority: async (input: any) => {
      if (options.authorityAllowed === false) return { allowed: false, denialCode: options.authorityCode || "DELEGATION_REVOKED" };
      if (input.agentIdentifier === "wrong-agent") return { allowed: false, denialCode: "AGENT_MISMATCH" };
      if (input.tenantId !== "tenant:org-a") return { allowed: false, denialCode: "TENANT_MISMATCH" };
      return { allowed: true, denialCode: null, classificationDecision: { classification: options.classification || "INTERNAL" }, modelDecision: { modelPolicyId: "model-a" } };
    },
  };
  const inputSecurity = options.inputSecurity || {
    evaluateContextAdmission: async () => ({
      admissionId: `context_admission_${repo.actions.length + repo.steps.length + 1}`,
      admitted: options.contextAdmitted !== false,
      decisionCode: options.contextAdmitted === false ? options.contextCode || "CONTENT_QUARANTINED" : "CONTEXT_ADMISSION_ALLOWED",
      resourceClassification: options.classification || "INTERNAL",
    }),
  };
  const svc = new AgentSimulationService(
    repo as any,
    async (fn: any) => fn({ query: async () => ({ rows: [] }) }) as any,
    { enqueue: async (event: any) => { events.push(event); return event; } } as any,
    aiGovernance as any,
    inputSecurity as any,
  );
  return { svc, repo, events, productionWrites, externalCalls, deployments, permissionChanges };
}

function simulationBody(overrides: any = {}) {
  return {
    agentIdentifier: "agent-a",
    sessionId: "ai_session_a",
    delegationId: "ai_delegation_a",
    goal: "Prepare a report update",
    purpose: "prepare report",
    model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" },
    proposedActions: [
      {
        actionType: "READ",
        resourceType: "report",
        resourceId: "report-a",
        requestedAction: "reports.view",
        proposedOperation: "reports.view",
        toolType: "READ_ONLY_RESOURCE",
      },
      {
        actionType: "WRITE",
        resourceType: "report",
        resourceId: "report-a",
        requestedAction: "reports.update",
        proposedOperation: "reports.update",
        proposedWrite: { field: "summary", priorValue: "old", proposedValue: "new", reason: "simulation" },
        toolType: "PROPOSED_WRITE",
      },
    ],
    ...overrides,
  };
}

test("simulation creates durable plan and proposed actions without production side effects", async () => {
  const harness = makeService();
  const result = await harness.svc.createSimulation(actor, simulationBody());
  assert.equal(result.activityKind, "SIMULATED");
  assert.equal(result.status, "APPROVAL_REQUIRED");
  assert.equal(result.plan.length, 2);
  assert.equal(result.proposedActions.length, 2);
  assert.equal(result.proposedActions[1].approvalRequired, true);
  assert.equal(result.proposedActions[1].predictedSideEffect, "SIMULATED_ONLY_NO_PRODUCTION_SIDE_EFFECT");
  assert.deepEqual(harness.productionWrites, []);
  assert.deepEqual(harness.externalCalls, []);
  assert.deepEqual(harness.deployments, []);
  assert.deepEqual(harness.permissionChanges, []);
});

test("authority denial is represented and does not bypass simulation", async () => {
  const { svc } = makeService({ authorityAllowed: false, authorityCode: "DELEGATION_EXPIRED" });
  const result = await svc.createSimulation(actor, simulationBody());
  assert.equal(result.status, "DENIED");
  assert.equal(result.proposedActions.every((action: any) => action.authorityAllowed === false), true);
  assert.equal(result.proposedActions[0].authorityCode, "DELEGATION_EXPIRED");
  assert.equal(result.proposedActions[0].policyCode, SIMULATION_DECISION_CODES.SIMULATION_AUTHORITY_DENIED);
});

test("context admission denial blocks simulated context use", async () => {
  const { svc } = makeService({ contextAdmitted: false, contextCode: "CONTENT_QUARANTINED" });
  const result = await svc.createSimulation(actor, simulationBody());
  assert.equal(result.status, "DENIED");
  assert.equal(result.proposedActions[0].securityAllowed, false);
  assert.equal(result.proposedActions[0].securityCode, "CONTENT_QUARANTINED");
});

test("malicious extracted content cannot enter simulation context", async () => {
  const { svc } = makeService({ contextAdmitted: false, contextCode: "PROMPT_INJECTION_DETECTED" });
  const result = await svc.createSimulation(actor, simulationBody({
    proposedActions: [{
      actionType: "READ",
      resourceType: "source_document_version",
      resourceId: "source-v1",
      requestedAction: "curriculum.source.view",
      proposedOperation: "curriculum.source.view",
      toolType: "READ_ONLY_RESOURCE",
    }],
  }));
  assert.equal(result.status, "DENIED");
  assert.equal(result.proposedActions[0].securityCode, "PROMPT_INJECTION_DETECTED");
});

test("risk model marks external, deployment, permission, and delegation proposals high or critical but never executes them", async () => {
  const harness = makeService();
  const result = await harness.svc.createSimulation(actor, simulationBody({
    proposedActions: [
      { actionType: "EXTERNAL_CALL", resourceType: "integration", resourceId: "crm-a", requestedAction: "integrations.send", proposedOperation: "send external CRM update", toolType: "PROPOSED_EXTERNAL_ACTION" },
      { actionType: "DEPLOYMENT", resourceType: "release", resourceId: "release-a", requestedAction: "release.publish", proposedOperation: "publish release", toolType: "PROPOSED_RELEASE" },
      { actionType: "PERMISSION_CHANGE", resourceType: "user", resourceId: "user-b", requestedAction: "security.manage", proposedOperation: "grant permission", toolType: "PROPOSED_WRITE" },
      { actionType: "DELEGATION_CHANGE", resourceType: "ai_delegated_authority", resourceId: "delegation-a", requestedAction: "ai.governance.manage", proposedOperation: "extend delegation", toolType: "PROPOSED_WRITE" },
    ],
  }));
  assert.equal(result.proposedActions[0].riskLevel, "HIGH");
  assert.equal(result.proposedActions.slice(1).every((action: any) => action.riskLevel === "CRITICAL"), true);
  assert.deepEqual(harness.externalCalls, []);
  assert.deepEqual(harness.deployments, []);
  assert.deepEqual(harness.permissionChanges, []);
});

test("ledger is a simulated read model and is org/tenant scoped", async () => {
  const repo = new MemoryRepo();
  const { svc } = makeService({ repo });
  const result = await svc.createSimulation(actor, simulationBody());
  const ledger = await svc.listActivity(actor);
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].simulationId, result.simulationId);
  assert.equal(ledger[0].activityKind, "SIMULATED");
  assert.equal(ledger[0].proposedActionCount, 2);
  await assert.rejects(() => svc.listActivity({ ...actor, tenant_id: "tenant:org-b" }), /ORG_CONTEXT_REQUIRED/);
});

test("completed simulation history cannot be silently appended or rewritten through service", async () => {
  const { svc } = makeService();
  const result = await svc.createSimulation(actor, simulationBody());
  assert.equal(["READY", "DENIED", "APPROVAL_REQUIRED"].includes(result.status), true);
  await assert.rejects(() => svc.appendAfterCompletion(), /Completed simulation history is immutable/);
});

test("security APIs are registered and no execution/conductor/MCP route is introduced", () => {
  const router = readFileSync(new URL("../src/api/router.ts", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../src/domain/agent-simulation/api/routes.ts", import.meta.url), "utf8");
  const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
  assert.match(router, /registerAgentSimulationRoutes/);
  assert.match(routes, /app\.post\("\/agent-simulations"/);
  assert.match(routes, /app\.get\("\/agent-activity"/);
  assert.match(permissions, /ai\.simulation\.create/);
  assert.doesNotMatch(routes, /execute|conductor|mcp|headless|invokeTool|sendMessage|deployNow/i);
});

test("migration defines simulation, plan, proposed action, and activity ledger only", () => {
  const sql = readFileSync(new URL("../migrations/091_agent_simulation_activity_ledger.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_agent_simulations/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_agent_simulation_plan_steps/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_agent_simulation_proposed_actions/);
  assert.match(sql, /CREATE OR REPLACE VIEW ai_agent_activity_ledger/);
  assert.match(sql, /'SIMULATED'::TEXT AS activity_kind/);
  assert.doesNotMatch(sql, /mcp_server|tool_invocation|autonomous_execution|truth_fact|execute_agent/i);
});
