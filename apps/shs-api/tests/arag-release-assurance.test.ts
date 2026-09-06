import assert from "node:assert/strict";
import test from "node:test";
import { AragError, AragService } from "../src/domain/arag/service/arag-service.js";
import { LocalMockAragReleaseProvider } from "../src/domain/arag/provider/arag-provider.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { DefaultAragPolicyEvaluator } from "../src/domain/arag/policy/arag-policy.js";

const requester = { user_id: "requester", active_organization_id: "org-1", tenant_id: "tenant:org-1", permissions: [SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_REQUEST, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_READ, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EVALUATE, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_APPROVE, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EXECUTE, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_ROLLBACK] };
const approver = { user_id: "approver", active_organization_id: "org-1", tenant_id: "tenant:org-1", permissions: [...requester.permissions, SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_APPROVE] };

function input() { return { projectId: "project-1", deliveryRecordId: "delivery-1", workspaceRevision: 4, packageHash: "a".repeat(64), repositoryReference: "repo:project-1", providerKey: "local_mock", targetEnvironment: "TEST", workOrderReference: "work-order-1", policyDecision: "ALLOW", qaRunId: "qa-1", reviewSubmissionId: "review-1", reviewDecisionId: "decision-1", simulationId: "simulation-1" }; }

class FakeRepo {
  request: any; approval: any = null; auth: any = null; result: any = null; packet: any = null; inputs: any = { qa: { status: "PASSED", workspace_revision: 4 }, review: { status: "APPROVED", decision: "APPROVED", workspace_revision: 4 }, simulation: { status: "COMPLETED", metadata_json: {} }, approval: null, securityBlocked: false };
  async createReleaseRequest(input: any) { this.request = { ...input, project_id: input.project_id || input.projectId, delivery_record_id: input.delivery_record_id || input.deliveryRecordId, workspace_revision: input.workspace_revision || input.workspaceRevision, package_hash: input.package_hash || input.packageHash, repository_reference: input.repository_reference || input.repositoryReference, provider_key: input.provider_key || input.providerKey, target_environment: input.target_environment || input.targetEnvironment, requested_by: input.requested_by, acting_agent_identifier: input.acting_agent_identifier, agent_session_id: input.agent_session_id, delegation_id: input.delegation_id, authority_purpose: input.authority_purpose, model_provider: input.model_provider, model_identifier: input.model_identifier, work_order_reference: input.work_order_reference || input.workOrderReference, policy_decision: input.policy_decision || input.policyDecision, qa_run_id: input.qa_run_id || input.qaRunId, review_submission_id: input.review_submission_id || input.reviewSubmissionId, review_decision_id: input.review_decision_id || input.reviewDecisionId, simulation_id: input.simulation_id || input.simulationId, status: "CREATED", blocking_codes: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; return this.request; }
  async getReleaseRequest() { return this.request; }
  async listReleaseRequests() { return this.request ? [this.request] : []; }
  async getAssuranceInputs() { return { ...this.inputs, approval: this.approval }; }
  async updateStatus(input: any) { this.request = { ...this.request, status: input.status, blocking_codes: input.blocking_codes, updated_at: new Date().toISOString() }; return this.request; }
  async updatePolicyDecision(input: any) { this.request = { ...this.request, policy_decision: input.policy_decision }; return this.request; }
  async getActiveWorkOrderPolicy() { return null; }
  async createApproval(input: any) { this.approval = { ...input, decision: input.decision, created_at: new Date().toISOString() }; return this.approval; }
  async createAuthorization(input: any) { this.auth = { ...input, valid_from: new Date(), expires_at: input.expires_at, used_at: null, revoked_at: null }; return this.auth; }
  async getAuthorization() { return this.auth; }
  async claimAuthorization() { if (!this.auth || this.auth.used_at) return null; this.auth = { ...this.auth, used_at: new Date() }; return this.auth; }
  async createResult(input: any) { this.result = { ...input, created_at: new Date().toISOString() }; return this.result; }
  async getLatestResult() { return this.result; }
  async updateResult(input: any) { this.result = { ...this.result, ...input }; return this.result; }
  async createPacket(input: any) { this.packet = { ...input, created_at: new Date().toISOString() }; return this.packet; }
  async getLatestPacket() { return this.packet; }
}

class FakeProvider extends LocalMockAragReleaseProvider { productionCapable = true; releaseCalls = 0; async release(subject: any, key: string) { this.releaseCalls += 1; return super.release(subject, key); } }
class FakeOutbox { events: any[] = []; async enqueue(event: any) { this.events.push(event); } }
class AllowPolicy { async evaluate() { return { decision: "ALLOW" as const }; } }
class AllowAuthority { constructor(private allowed = true) {} async evaluateAgentAuthority() { return this.allowed ? { allowed: true } : { allowed: false, denialCode: "DELEGATION_EXPIRED" }; } }

test("work-order policy evaluator enforces scope, lifecycle, and actor permission", async () => {
  const policy = { status: "ACTIVE", effective_from: new Date(Date.now() - 1000), expires_at: null, allowed_project_ids: ["project-1"], allowed_repository_references: ["repo:project-1"], allowed_provider_keys: ["local_mock"], allowed_target_environments: ["TEST"], permitted_actor_user_ids: ["requester"], permitted_actor_roles: [], prohibited_actions: [] };
  const evaluator = new DefaultAragPolicyEvaluator({ async getActiveWorkOrderPolicy() { return policy; } } as any);
  const request = { work_order_reference: "work-order-1", project_id: "project-1", repository_reference: "repo:project-1", provider_key: "local_mock", target_environment: "TEST" };
  assert.equal((await evaluator.evaluate({ request, organizationId: "org-1", tenantId: "tenant:org-1", actorUserId: "requester" })).decision, "ALLOW");
  policy.allowed_target_environments = ["PRODUCTION"];
  assert.equal((await evaluator.evaluate({ request, organizationId: "org-1", tenantId: "tenant:org-1", actorUserId: "requester" })).decision, "DENY");
  policy.allowed_target_environments = ["TEST"]; policy.status = "RETIRED";
  assert.equal((await evaluator.evaluate({ request, organizationId: "org-1", tenantId: "tenant:org-1", actorUserId: "requester" })).decision, "DENY");
  assert.equal((await new DefaultAragPolicyEvaluator({ async getActiveWorkOrderPolicy() { return null; } } as any).evaluate({ request, organizationId: "org-1", tenantId: "tenant:org-1", actorUserId: "requester" })).decision, "DENY");
});

test("ARAG blocks missing QA and binds evaluation to the exact revision", async () => {
  const repo = new FakeRepo(); repo.inputs.qa = null;
  const service = new AragService(repo as any, new FakeProvider() as any, undefined as any, new FakeOutbox() as any);
  await service.request(requester, input());
  const result = await service.evaluate(requester, repo.request.release_request_id);
  assert.equal(result.allowed, false); assert.ok(result.decisionCodes.includes("RELEASE_QA_MISSING"));
});

test("requester cannot self-approve and approval is subject-bound", async () => {
  const repo = new FakeRepo(); const service = new AragService(repo as any, new FakeProvider() as any, undefined as any, new FakeOutbox() as any, new AllowPolicy() as any); await service.request(requester, input());
  await assert.rejects(() => service.approve(requester, repo.request.release_request_id, { subjectHash: repo.request.subject_hash }), (error: any) => error instanceof AragError && error.code === "RELEASE_APPROVAL_INVALID");
  await assert.rejects(() => service.approve(approver, repo.request.release_request_id, { subjectHash: "changed" }), /exact release subject/);
  await service.approve(approver, repo.request.release_request_id, { subjectHash: repo.request.subject_hash, rationale: "Reviewed exact revision." });
  assert.equal(repo.approval.approver_user_id, "approver");
});

test("authorized release calls provider once, produces result and immutable packet, and rejects replay", async () => {
  const repo = new FakeRepo(); const provider = new FakeProvider(); const service = new AragService(repo as any, provider as any, undefined as any, new FakeOutbox() as any, new AllowPolicy() as any); await service.request(requester, input()); await service.approve(approver, repo.request.release_request_id, { subjectHash: repo.request.subject_hash }); await service.authorize(approver, repo.request.release_request_id); const result = await service.release(requester, repo.request.release_request_id, { authorizationId: repo.auth.authorization_id }); assert.equal(result.release.status, "RELEASED"); assert.equal(provider.releaseCalls, 1); assert.equal(result.assurancePacket.packet.packetClass, "ARAG_ASSURANCE_PACKET"); await assert.rejects(() => service.release(requester, repo.request.release_request_id, { authorizationId: repo.auth.authorization_id }), /replay|expired|used/i);
});

test("default local provider cannot be mistaken for production execution", async () => {
  const repo = new FakeRepo(); const service = new AragService(repo as any, new LocalMockAragReleaseProvider(), undefined as any, new FakeOutbox() as any, new AllowPolicy() as any); await service.request(requester, input()); await service.approve(approver, repo.request.release_request_id, { subjectHash: repo.request.subject_hash }); await service.authorize(approver, repo.request.release_request_id); await assert.rejects(() => service.release(requester, repo.request.release_request_id, { authorizationId: repo.auth.authorization_id }), (error: any) => error instanceof AragError && error.code === "RELEASE_EXECUTION_DISABLED");
});

test("agent-assisted release uses the canonical authority evaluator", async () => {
  const repo = new FakeRepo(); const service = new AragService(repo as any, new FakeProvider() as any, undefined as any, new FakeOutbox() as any, new AllowPolicy() as any, new AllowAuthority() as any);
  await service.request(requester, { ...input(), actingAgentIdentifier: "agent-1", agentSessionId: "session-1", delegationId: "delegation-1", authorityPurpose: "release-work-order", modelProvider: "provider-1", modelIdentifier: "model-1" });
  await service.approve(approver, repo.request.release_request_id, { subjectHash: repo.request.subject_hash });
  const result = await service.evaluate(requester, repo.request.release_request_id);
  assert.equal(result.allowed, true);
});

test("agent-assisted release blocks expired or revoked authority", async () => {
  const repo = new FakeRepo(); const service = new AragService(repo as any, new FakeProvider() as any, undefined as any, new FakeOutbox() as any, new AllowPolicy() as any, new AllowAuthority(false) as any);
  await service.request(requester, { ...input(), actingAgentIdentifier: "agent-1", agentSessionId: "session-1", delegationId: "delegation-1", authorityPurpose: "release-work-order", modelProvider: "provider-1", modelIdentifier: "model-1" });
  await service.approve(approver, repo.request.release_request_id, { subjectHash: repo.request.subject_hash });
  const result = await service.evaluate(requester, repo.request.release_request_id);
  assert.equal(result.allowed, false); assert.ok(result.decisionCodes.includes("DELEGATION_EXPIRED"));
});
