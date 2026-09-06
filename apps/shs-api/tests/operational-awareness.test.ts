import assert from "node:assert/strict";
import test from "node:test";
import { OperationalAwarenessService } from "../src/domain/operational-awareness/service/operational-awareness-service.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";

const actor = {
  user_id: "user-1",
  active_organization_id: "org-1",
  tenant_id: "tenant:org-1",
  permissions: [
    SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_READ,
    SHS_SECURITY_PERMISSIONS.OPERATIONS_AWARENESS_MANAGE,
    SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_READ,
    SHS_SECURITY_PERMISSIONS.REPORTING_DAILY_BRIEF_GENERATE,
  ],
};

function signals() {
  return {
    security: [{ scan_id: "scan-1", resource_type: "document", resource_id: "doc-1", scan_status: "BLOCKED", risk_level: "HIGH", finding_count: 1 }],
    approvals: [{ conductor_task_id: "task-1", conductor_request_id: "request-1", description: "Review draft", status: "APPROVAL_REQUIRED", approval_reason: "Human review" }],
    agentExceptions: [{ authority_code: "DELEGATION_EXPIRED", security_code: null, count: 3, last_seen: new Date().toISOString() }],
    reads: [{ mcp_read_result_id: "read-1", mcp_server_id: "server-1", admission_status: "ADMITTED", source_identity: "approved-source" }, { mcp_read_result_id: "read-2", mcp_server_id: "server-1", admission_status: "BLOCKED", source_identity: "untrusted-source" }],
    outcomes: [{ truth_fact_id: "truth-1", fact_type: "completion", occurred_at: new Date().toISOString() }],
    activity: { simulation_count: 4, failed_count: 1 },
    operations: { review_count: 2, overdue_assignment_count: 1 },
  };
}

class FakeRepo {
  saved: any[] = [];
  briefs: any[] = [];
  async collectSignals() { return signals(); }
  async createFinding(input: any) { const row = { ...input, status: "OPEN", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; this.saved.push(row); return row; }
  async listFindings() { return this.saved; }
  async getFinding(id: string, organizationId: string, tenantId: string) { return this.saved.find((row) => row.finding_id === id && row.organization_id === organizationId && row.tenant_id === tenantId) || null; }
  async updateFindingStatus(input: any) { const row = await this.getFinding(input.finding_id, input.organization_id, input.tenant_id); if (!row) return null; row.status = input.status; row.updated_at = new Date().toISOString(); row.acknowledged_by = input.actor_id; return row; }
  async createBrief(input: any) { const row = { ...input, generated_at: new Date().toISOString(), status: "GENERATED", source_window: input.source_window, finding_refs: input.finding_refs, verified_outcome_refs: input.verified_outcome_refs, agent_activity_refs: input.agent_activity_refs, external_observation_refs: input.external_observation_refs, brief_json: input.brief_json, version: 1 }; this.briefs.push(row); return row; }
  async getLatestBrief() { return this.briefs.at(-1) || null; }
  async listBriefs() { return this.briefs; }
  async getBrief(id: string) { return this.briefs.find((row) => row.brief_id === id) || null; }
}

class FakeOutbox { events: any[] = []; async enqueue(event: any) { this.events.push(event); } }

test("awareness creates deterministic findings with source and verification classes", async () => {
  const repo = new FakeRepo();
  const service = new OperationalAwarenessService(repo as any, new FakeOutbox() as any);
  const result = await service.run(actor, { periodDays: 1 });
  assert.ok(result.items.some((item) => item.category === "SECURITY_ALERT" && item.verificationClass === "SECURITY_GOVERNANCE_FACT"));
  assert.ok(result.items.some((item) => item.category === "APPROVAL_REQUIRED" && item.verificationClass === "CANONICAL_OPERATIONAL_FACT"));
  assert.ok(result.items.every((item) => item.sourceRefs.length > 0));
});

test("brief keeps Truth Spine outcomes verified and external reads external", async () => {
  const repo = new FakeRepo();
  const service = new OperationalAwarenessService(repo as any, new FakeOutbox() as any);
  const result = await service.generateBrief(actor, { periodDays: 1 });
  assert.equal(result.brief.verifiedOutcomes[0].verificationClass, "VERIFIED_FACT");
  assert.equal(result.brief.externalSignals[0].verificationClass, "EXTERNAL_OBSERVATION");
  assert.ok(result.brief.recommendedNextActions.every((item: any) => item.verificationClass === "RECOMMENDATION"));
  assert.equal(result.brief.label, "OPERATING BRIEF");
});

test("finding status changes are scoped and attributable", async () => {
  const repo = new FakeRepo();
  const service = new OperationalAwarenessService(repo as any, new FakeOutbox() as any);
  await service.run(actor, { periodDays: 1 });
  const finding = repo.saved[0];
  const updated = await service.updateFindingStatus(actor, finding.finding_id, "ACKNOWLEDGED");
  assert.equal(updated.status, "ACKNOWLEDGED");
  assert.equal(repo.saved[0].acknowledged_by, "user-1");
  await assert.rejects(() => service.getFinding({ ...actor, tenant_id: "tenant:other" }, finding.finding_id), /Organization and tenant context/);
});

test("awareness rejects actors without canonical permission", async () => {
  const service = new OperationalAwarenessService(new FakeRepo() as any, new FakeOutbox() as any);
  await assert.rejects(() => service.run({ ...actor, permissions: [] }, {}), /permission is required/);
});
