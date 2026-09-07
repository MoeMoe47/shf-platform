import assert from "node:assert/strict";
import test from "node:test";
import { ReportTemplateRegistry } from "../src/domain/reporting/report-template-registry.js";
import { BosAiGovernanceReportAdapter } from "../src/domain/reporting/bos-ai-governance-report-adapter.js";

const families = [
  "operating-review", "workflow-performance", "governance-control", "release-assurance-evidence", "control-exception",
  "agent-session", "policy-enforcement", "mcp-tool-access", "ai-security-event", "governed-ai-activity",
];

function mockQuery(sql: string) {
  if (sql.includes("bos_conductor_requests")) return { rows: [{ conductor_request_id: "req-1", status: "COMPLETED", requested_operation_ref: null, created_at: new Date(), completed_at: new Date() }] };
  if (sql.includes("bos_conductor_tasks")) return { rows: [{ count: 1, exceptions: 0 }] };
  if (sql.includes("arag_work_order_policies")) return { rows: [{ policy_id: "policy-1", work_order_reference: "wo-1", policy_version: 1, status: "ACTIVE", required_qa_status: "PASSED", required_review_status: "APPROVED", required_approval: true }] };
  if (sql.includes("arag_release_requests")) return { rows: [{ release_request_id: "release-1", project_id: "project-1", workspace_revision: 1, repository_reference: "repo-ref", provider_key: "provider", target_environment: "uat", policy_decision: "ALLOW", status: "ASSURANCE_READY", blocking_codes: [], acting_agent_identifier: "agent", agent_session_id: "session-1", model_provider: "provider", model_identifier: "model", updated_at: new Date() }] };
  if (sql.includes("arag_release_approvals")) return { rows: [{ approver_user_id: "user-1", decision: "APPROVED", rationale: "approved", created_at: new Date() }] };
  if (sql.includes("arag_assurance_packets")) return { rows: [{ packet_id: "packet-1", packet_version: 1, packet_hash: "hash" }] };
  if (sql.includes("operational_awareness_findings")) return { rows: [{ finding_id: "finding-1", finding_type: "RISK", category: "GOVERNANCE_ALERT", severity: "LOW", priority: "NORMAL", title: "Finding", status: "OPEN", source_type: "test", source_refs: [], evidence_refs: [], first_observed_at: new Date(), last_observed_at: new Date() }] };
  if (sql.includes("ai_agent_sessions")) return { rows: [{ session_id: "session-1", agent_identifier: "agent", acting_for_user_id: "user-1", status: "CLOSED", started_at: new Date(), closed_at: new Date(), model_provider: "provider", model_identifier: "model", autonomy_profile: "LEVEL_1_RECOMMEND", security_metadata: {} }] };
  if (sql.includes("ai_context_admission_decisions")) return { rows: [{ admission_id: "admission-1", session_id: "session-1", resource_type: "document", resource_classification: "INTERNAL", decision: "ALLOW", decision_code: "ALLOWED", admitted: true, evaluated_at: new Date() }] };
  if (sql.includes("mcp_invocations")) return { rows: [{ mcp_invocation_id: "invocation-1", session_id: "session-1", mcp_server_id: "server-1", mcp_tool_id: "tool-1", requested_action: "READ", authority_allowed: true, authority_code: "ALLOWED", policy_allowed: true, policy_code: "ALLOWED", classification: "INTERNAL", approval_required: false, status: "SIMULATED", security_code: null, created_at: new Date() }] };
  if (sql.includes("ai_input_security_scans")) return { rows: [{ scan_id: "scan-1", resource_type: "prompt", resource_id: "resource-1", scan_status: "BLOCKED", risk_level: "HIGH", decision: "BLOCK", finding_count: 1, created_at: new Date() }] };
  return { rows: [{ simulations: 1, failed: 0, last_activity: new Date(), open: 0, count: 1, sessions: 1, actions: 1, denied: 0, mcp: 1 }] };
}

const actor = { user_id: "user-1", organization_id: "org-1", tenant_id: "tenant:org-1", roles: ["shs_admin"] };

test("U4 registers all supported BOS and AI Governance families", () => {
  const registry = new ReportTemplateRegistry();
  for (const family of families) {
    const definition = registry.resolve("bos", family, 1);
    assert.equal(definition.productKey, "bos");
    assert.deepEqual(definition.supportedFormats, ["JSON", "HTML", "PDF"]);
  }
  assert.throws(() => registry.resolve("bos", "oas-conformance", 1), /REPORT_TEMPLATE_NOT_FOUND/);
});

test("U4 adapter projects every family through scoped canonical records", async () => {
  const adapter = new BosAiGovernanceReportAdapter(async (sql: string) => mockQuery(sql) as any);
  for (const family of families) {
    const inputs: Record<string, any> = {
      "operating-review": {}, "workflow-performance": { conductorRequestId: "req-1" }, "governance-control": { policyId: "policy-1" },
      "release-assurance-evidence": { releaseRequestId: "release-1" }, "control-exception": { findingId: "finding-1" },
      "agent-session": { sessionId: "session-1" }, "policy-enforcement": { admissionId: "admission-1" },
      "mcp-tool-access": { invocationId: "invocation-1" }, "ai-security-event": { scanId: "scan-1" }, "governed-ai-activity": {},
    };
    const projection = await adapter.project({ reportFamily: family, ...inputs[family] }, actor);
    assert.equal(projection.productKey, "bos");
    assert.equal(projection.reportFamily, family);
    assert.equal(projection.classification, "INTERNAL");
    assert.ok(projection.canonicalReferences.length > 0);
    assert.equal((projection.payload.presentation as any).metadata.aiInvolvement, "No");
  }
});

test("U4 reporting boundary excludes raw content and mutation authorities", () => {
  const source = BosAiGovernanceReportAdapter.toString();
  assert.doesNotMatch(source, /input_json|proposed_payload_json|credential_reference/);
});
