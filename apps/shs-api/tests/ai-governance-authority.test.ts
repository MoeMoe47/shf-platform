import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { AiGovernanceService } from "../src/domain/ai-governance/service/ai-governance-service.ts";
import { AI_AUTHORITY_DENIAL_CODES } from "../src/domain/ai-governance/model/ai-governance.ts";

const basePermissions = [
  "ai.governance.view",
  "ai.governance.manage",
  "ai.governance.evaluate",
  "reports.view",
  "reports.export",
  "agent.session.open",
  "security.manage",
];

const actor = {
  user_id: "user-a",
  active_organization_id: "org-a",
  organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions: basePermissions,
};

class MemoryRepo {
  delegations: any[] = [];
  classifications: any[] = [];
  models: any[] = [];
  sessions: any[] = [];

  async createDelegation(input: any) {
    const row = { ...input, created_at: new Date(), updated_at: new Date(), revoked_at: null, revoked_by: null };
    this.delegations.push(row);
    return row;
  }
  async getDelegation(id: string, organizationId: string, tenantId: string) {
    return this.delegations.find((row) => row.delegation_id === id && row.organization_id === organizationId && row.tenant_id === tenantId) || null;
  }
  async listDelegations(organizationId: string, tenantId: string) {
    return this.delegations.filter((row) => row.organization_id === organizationId && row.tenant_id === tenantId);
  }
  async revokeDelegation(input: any) {
    const row = await this.getDelegation(input.delegation_id, input.organization_id, input.tenant_id);
    if (!row || row.revoked_at) return null;
    row.revoked_at = new Date();
    row.revoked_by = input.revoked_by;
    row.revocation_reason = input.revocation_reason;
    return row;
  }
  async assignClassification(input: any) {
    for (const row of this.classifications) {
      if (row.organization_id === input.organization_id && row.tenant_id === input.tenant_id && row.resource_type === input.resource_type && row.resource_id === input.resource_id && !row.superseded_at) row.superseded_at = new Date();
    }
    const row = { ...input, created_at: new Date(), updated_at: new Date(), superseded_at: null };
    this.classifications.push(row);
    return row;
  }
  async getClassification(resource: any) {
    return this.classifications.find((row) => row.organization_id === resource.organization_id && row.tenant_id === resource.tenant_id && row.resource_type === resource.resource_type && row.resource_id === resource.resource_id && !row.superseded_at) || null;
  }
  async upsertModelPolicy(input: any) {
    const existing = this.models.find((row) => (row.organization_id || null) === (input.organization_id || null) && (row.tenant_id || null) === (input.tenant_id || null) && row.provider_identifier === input.provider_identifier && row.model_identifier === input.model_identifier);
    const row = existing || { model_policy_id: input.model_policy_id, created_at: new Date() };
    Object.assign(row, input, { updated_at: new Date() });
    if (!existing) this.models.push(row);
    return row;
  }
  async findModelPolicy(input: any) {
    return this.models.find((row) => row.provider_identifier === input.provider_identifier && row.model_identifier === input.model_identifier && row.organization_id === input.organization_id && row.tenant_id === input.tenant_id)
      || this.models.find((row) => row.provider_identifier === input.provider_identifier && row.model_identifier === input.model_identifier && !row.organization_id && !row.tenant_id)
      || null;
  }
  async listModelPolicies(input: any) {
    return this.models.filter((row) => (!row.organization_id && !row.tenant_id) || (row.organization_id === input.organization_id && row.tenant_id === input.tenant_id));
  }
  async createSession(input: any) {
    const row = { ...input, status: "ACTIVE", created_at: new Date(), updated_at: new Date(), closed_at: null };
    this.sessions.push(row);
    return row;
  }
  async getSession(sessionId: string, organizationId: string, tenantId: string) {
    return this.sessions.find((row) => row.session_id === sessionId && row.organization_id === organizationId && row.tenant_id === tenantId) || null;
  }
  async closeSession(input: any) {
    const row = await this.getSession(input.session_id, input.organization_id, input.tenant_id);
    if (!row || row.status !== "ACTIVE") return null;
    row.status = input.status || "CLOSED";
    row.closed_at = new Date();
    row.close_reason = input.close_reason;
    return row;
  }
}

function service(repo = new MemoryRepo()) {
  const outboxEvents: any[] = [];
  const svc = new AiGovernanceService(
    repo as any,
    async (fn: any) => fn({ query: async () => ({ rows: [] }) }) as any,
    { enqueue: async (event: any) => { outboxEvents.push(event); return event; } } as any,
    { evaluateOrganizationServiceEntitlement: async () => ({ allowed: true }) } as any,
  );
  return { svc, repo, outboxEvents };
}

function future(minutes = 60) {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function validDelegationBody(overrides: any = {}) {
  return {
    principalUserId: "user-a",
    agentIdentifier: "agent-a",
    purpose: "prepare report",
    resourceScope: { resources: [{ resourceType: "report", resourceId: "report-a" }] },
    allowedActions: ["reports.view", "agent.session.open"],
    forbiddenActions: [],
    expiresAt: future(),
    modelProviderConstraint: "openai",
    modelIdentifierConstraint: "gpt-safe",
    ...overrides,
  };
}

function evaluationInput(delegation: any, overrides: any = {}) {
  return {
    principalUserId: "user-a",
    agentIdentifier: "agent-a",
    organizationId: "org-a",
    tenantId: "tenant:org-a",
    delegation,
    purpose: "prepare report",
    resource: { resourceType: "report", resourceId: "report-a" },
    action: "reports.view",
    model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" },
    ...overrides,
  };
}

async function seedValid(repo: MemoryRepo, svc: AiGovernanceService) {
  const model = await svc.upsertModelPolicy(actor, {
    providerIdentifier: "openai",
    modelIdentifier: "gpt-safe",
    displayName: "GPT Safe",
    classificationCeiling: "SENSITIVE",
  });
  assert.equal(model.approvalStatus, "APPROVED");
  await svc.assignClassification(actor, { resourceType: "report", resourceId: "report-a", classification: "INTERNAL" });
  return svc.createDelegation(actor, validDelegationBody());
}

test("valid delegation is durable, bounded, emits an event, and evaluates successfully", async () => {
  const { svc, repo, outboxEvents } = service();
  const created = await seedValid(repo, svc);
  assert.equal(created.principalUserId, "user-a");
  assert.equal(created.agentIdentifier, "agent-a");
  assert.equal(created.organizationId, "org-a");
  assert.equal(created.tenantId, "tenant:org-a");
  assert.deepEqual(created.allowedActions, ["reports.view", "agent.session.open"]);
  assert.equal(outboxEvents.some((event) => event.event_type === "delegation.created"), true);

  const result = await svc.evaluateAgentAuthority(evaluationInput(repo.delegations[0]));
  assert.equal(result.allowed, true);
  assert.equal(result.delegationStatus, "ACTIVE");
});

test("delegation creation rejects privilege amplification, wildcard scope, self-escalation, and re-delegation", async () => {
  const { svc } = service();
  await assert.rejects(() => svc.createDelegation(actor, validDelegationBody({ allowedActions: ["truth.override"] })), /Delegation cannot exceed principal permissions/);
  await assert.rejects(() => svc.createDelegation(actor, validDelegationBody({ resourceScope: { all: true, resources: [] } })), /explicit bounded resources/);
  await assert.rejects(() => svc.createDelegation(actor, validDelegationBody({ allowRedelegation: true })), /Re-delegation is not authorized/);
  await assert.rejects(() => svc.createDelegation({ ...actor, permissions: basePermissions.filter((item) => item !== "security.manage") }, validDelegationBody({ restrictedResourceAccess: true })), /Restricted resource authority requires security management/);
});

test("authority evaluator fails closed for missing or stale/mismatched delegation properties", async () => {
  const { svc, repo } = service();
  const created = await seedValid(repo, svc);
  const base = repo.delegations[0];
  assert.equal((await svc.evaluateAgentAuthority({ ...evaluationInput(base), delegation: null, delegationId: "missing" })).denialCode, AI_AUTHORITY_DENIAL_CODES.NO_DELEGATION);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput({ ...base, expires_at: new Date(Date.now() - 1000) }))).denialCode, AI_AUTHORITY_DENIAL_CODES.DELEGATION_EXPIRED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput({ ...base, revoked_at: new Date() }))).denialCode, AI_AUTHORITY_DENIAL_CODES.DELEGATION_REVOKED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { agentIdentifier: "agent-b" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.AGENT_MISMATCH);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { principalUserId: "user-b" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.PRINCIPAL_MISMATCH);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { organizationId: "org-b", tenantId: "tenant:org-b" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.ORGANIZATION_MISMATCH);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { tenantId: "tenant:org-b" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.TENANT_MISMATCH);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { purpose: "different" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.PURPOSE_NOT_ALLOWED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { action: "reports.export" }))).denialCode, AI_AUTHORITY_DENIAL_CODES.ACTION_NOT_ALLOWED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput({ ...base, forbidden_actions: ["reports.view"] }))).denialCode, AI_AUTHORITY_DENIAL_CODES.ACTION_EXPLICITLY_DENIED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(base, { resource: { resourceType: "report", resourceId: "report-b" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.RESOURCE_OUT_OF_SCOPE);
  assert.equal(created.status, "ACTIVE");
});

test("resource classification is org/tenant safe and constrains access", async () => {
  const { svc, repo } = service();
  await seedValid(repo, svc);
  const base = repo.delegations[0];

  const crossOrg = await svc.evaluateAgentAuthority(evaluationInput(base, {
    resource: { organizationId: "org-b", tenantId: "tenant:org-b", resourceType: "report", resourceId: "report-a" },
  }));
  assert.equal(crossOrg.denialCode, AI_AUTHORITY_DENIAL_CODES.RESOURCE_CLASSIFICATION_DENIED);

  await svc.assignClassification(actor, { resourceType: "report", resourceId: "report-a", classification: "SENSITIVE" });
  const sensitiveAllowed = await svc.evaluateAgentAuthority(evaluationInput(base));
  assert.equal(sensitiveAllowed.allowed, true);

  await svc.assignClassification(actor, { resourceType: "report", resourceId: "report-a", classification: "RESTRICTED" });
  const restrictedDenied = await svc.evaluateAgentAuthority(evaluationInput(base));
  assert.equal(restrictedDenied.denialCode, AI_AUTHORITY_DENIAL_CODES.RESOURCE_CLASSIFICATION_DENIED);
});

test("approved model catalog enforces lifecycle, organization scope, and classification ceiling", async () => {
  const { svc, repo } = service();
  await svc.upsertModelPolicy(actor, { providerIdentifier: "openai", modelIdentifier: "active", displayName: "Active", classificationCeiling: "SENSITIVE" });
  await svc.upsertModelPolicy(actor, { providerIdentifier: "openai", modelIdentifier: "blocked", displayName: "Blocked", approvalStatus: "BLOCKED" });
  await svc.upsertModelPolicy(actor, { providerIdentifier: "openai", modelIdentifier: "retired", displayName: "Retired", lifecycleStatus: "RETIRED" });
  await svc.upsertModelPolicy(actor, { providerIdentifier: "openai", modelIdentifier: "internal-only", displayName: "Internal", classificationCeiling: "INTERNAL" });
  await svc.assignClassification(actor, { resourceType: "report", resourceId: "report-a", classification: "SENSITIVE" });
  const delegation = await svc.createDelegation(actor, validDelegationBody({ modelProviderConstraint: null, modelIdentifierConstraint: null }));
  const row = repo.delegations.find((item) => item.delegation_id === delegation.delegationId);

  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { model: { providerIdentifier: "openai", modelIdentifier: "active" } }))).allowed, true);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { model: { providerIdentifier: "openai", modelIdentifier: "blocked" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { model: { providerIdentifier: "openai", modelIdentifier: "retired" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { model: { providerIdentifier: "openai", modelIdentifier: "internal-only" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.MODEL_CLASSIFICATION_DENIED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { model: { providerIdentifier: "openai", modelIdentifier: "missing" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(row, { organizationId: "org-b", tenantId: "tenant:org-b", delegation: { ...row, organization_id: "org-b", tenant_id: "tenant:org-b" }, model: { providerIdentifier: "openai", modelIdentifier: "active" } }))).denialCode, AI_AUTHORITY_DENIAL_CODES.MODEL_NOT_APPROVED);
});

test("agent sessions inherit delegation authority and do not survive expiry, revocation, or close", async () => {
  const { svc, repo } = service();
  const delegation = await seedValid(repo, svc);
  const session = await svc.createSession(actor, {
    delegationId: delegation.delegationId,
    agentIdentifier: "agent-a",
    purpose: "prepare report",
    resource: { resourceType: "report", resourceId: "report-a" },
    action: "agent.session.open",
    model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" },
  });
  assert.equal(session.status, "ACTIVE");
  const activeUse = await svc.evaluateAgentAuthority(evaluationInput(repo.delegations[0], { sessionId: session.sessionId }));
  assert.equal(activeUse.allowed, true);

  const closed = await svc.closeSession(actor, session.sessionId, { reason: "done" });
  assert.equal(closed.status, "CLOSED");
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(repo.delegations[0], { sessionId: session.sessionId }))).denialCode, AI_AUTHORITY_DENIAL_CODES.SESSION_CLOSED);

  const second = await svc.createSession(actor, {
    delegationId: delegation.delegationId,
    agentIdentifier: "agent-a",
    purpose: "prepare report",
    resource: { resourceType: "report", resourceId: "report-a" },
    action: "agent.session.open",
    model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" },
  });
  repo.sessions.find((row) => row.session_id === second.sessionId).expires_at = new Date(Date.now() - 1000);
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(repo.delegations[0], { sessionId: second.sessionId }))).denialCode, AI_AUTHORITY_DENIAL_CODES.SESSION_EXPIRED);

  await svc.revokeDelegation(actor, delegation.delegationId, { reason: "operator revoked" });
  assert.equal((await svc.evaluateAgentAuthority(evaluationInput(repo.delegations[0], { sessionId: second.sessionId }))).denialCode, AI_AUTHORITY_DENIAL_CODES.DELEGATION_REVOKED);
});

test("session creation rejects expired, revoked, and mismatched authority", async () => {
  const { svc, repo } = service();
  const delegation = await seedValid(repo, svc);
  repo.delegations[0].expires_at = new Date(Date.now() - 1000);
  await assert.rejects(() => svc.createSession(actor, { delegationId: delegation.delegationId, agentIdentifier: "agent-a", purpose: "prepare report", resource: { resourceType: "report", resourceId: "report-a" }, model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" } }), /DELEGATION_EXPIRED/);
  repo.delegations[0].expires_at = new Date(Date.now() + 60_000);
  repo.delegations[0].revoked_at = new Date();
  await assert.rejects(() => svc.createSession(actor, { delegationId: delegation.delegationId, agentIdentifier: "agent-a", purpose: "prepare report", resource: { resourceType: "report", resourceId: "report-a" }, model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" } }), /DELEGATION_REVOKED/);
  repo.delegations[0].revoked_at = null;
  await assert.rejects(() => svc.createSession(actor, { delegationId: delegation.delegationId, agentIdentifier: "agent-b", purpose: "prepare report", resource: { resourceType: "report", resourceId: "report-a" }, model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" } }), /AGENT_MISMATCH/);
  await assert.rejects(() => svc.createSession({ ...actor, user_id: "user-b" }, { delegationId: delegation.delegationId, agentIdentifier: "agent-a", purpose: "prepare report", resource: { resourceType: "report", resourceId: "report-a" }, model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" } }), /NO_DELEGATION|PRINCIPAL_MISMATCH/);
  await assert.rejects(() => svc.createSession({ ...actor, active_organization_id: "org-b", organization_id: "org-b", tenant_id: "tenant:org-b" }, { delegationId: delegation.delegationId, agentIdentifier: "agent-a", purpose: "prepare report", resource: { resourceType: "report", resourceId: "report-a" }, model: { providerIdentifier: "openai", modelIdentifier: "gpt-safe" } }), /Delegation not found/);
});

test("migration defines Phase 1 authority tables without execution, MCP, or truth shortcuts", () => {
  const sql = readFileSync(new URL("../migrations/089_ai_governance_authority_substrate.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_delegated_authorities/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_resource_classifications/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_agent_sessions/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS ai_approved_models/);
  assert.match(sql, /expires_at TIMESTAMPTZ NOT NULL/);
  assert.match(sql, /tenant_id = 'tenant:' \|\| organization_id/);
  assert.doesNotMatch(sql, /mcp_server|tool_invocation|truth_fact|autonomous_execution/i);
});

test("API routes are permission-gated and expose only Phase 1 authority surfaces", () => {
  const routes = readFileSync(new URL("../src/domain/ai-governance/api/routes.ts", import.meta.url), "utf8");
  for (const route of [
    "/ai-governance/delegations",
    "/ai-governance/resource-classifications",
    "/ai-governance/models",
    "/ai-governance/sessions",
    "/ai-governance/evaluate",
  ]) {
    assert.match(routes, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.AI_GOVERNANCE_MANAGE\)/);
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.AI_GOVERNANCE_EVALUATE\)/);
  assert.match(routes, /requirePermission\(SHS_SECURITY_PERMISSIONS\.AI_GOVERNANCE_VIEW\)/);
  assert.doesNotMatch(routes, /conductor|mcp|invoke|executeTool|headless|daily-brief/i);
});
