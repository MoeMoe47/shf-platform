import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const service = read("../src/domain/ai-governance/service/ai-governance-service.ts");
const migration = read("../migrations/130_agent_task_approval_incident_control.sql");
const recovery = read("../../../docs/architecture/SYS-6C_DURABLE_GOVERNED_TASK_EXECUTION_RECOVERY_CANCELLATION_FOUNDATION_REPORT.md");
const rebaseline = read("../../../docs/architecture/SYS-6A_AGENT_FABRIC_PRODUCTION_EXECUTION_GOVERNANCE_REBASELINE_SAFETY_GAP_AUDIT_REPORT.md");

test("controlled pilot permits only bounded safe execution", () => {
  assert.match(service, /SAFE_TASK_TYPES = new Set\(\["bounded_review_preparation", "safe_read", "simulation"\]\)/);
  assert.match(service, /\["TEST_SAFE", "SIMULATION"\]\.includes\(executionMode\)/);
  assert.match(service, /if \(!safeExecutionEnabled\(\)\) throw new AiGovernanceError\("EXECUTION_DISABLED"/);
  assert.match(service, /if \(task\.consequence_class !== "READ_ONLY"\) throw new AiGovernanceError\("CONSEQUENCE_BLOCKED"/);
  assert.doesNotMatch(service, /executionMode.*PRODUCTION/);
});

test("pilot authority is explicit, scoped, and replay-resistant", () => {
  for (const field of ["organization_id", "tenant_id", "session_id", "agent_identity_id", "delegation_id", "principal_user_id", "resource_scope", "tool_scope", "policy_snapshot", "provider_model", "idempotency_key"]) {
    assert.match(service, new RegExp(field));
  }
  assert.match(service, /task\.action_hash/);
  assert.match(service, /TASK_AUTHORITY_REVOKED/);
  assert.match(service, /AGENT_IDENTITY_DISABLED/);
  assert.match(service, /APPROVAL_REQUIRED/);
  assert.match(service, /SELF_APPROVAL_DENIED/);
  assert.match(service, /action_fingerprint/);
});

test("pilot controls retain approval, security-event, and tenant boundaries", () => {
  assert.match(migration, /ai_agent_task_approval_requests/);
  assert.match(migration, /ai_agent_task_approval_decisions/);
  assert.match(migration, /ai_governance_security_events/);
  assert.match(migration, /tenant_id = 'tenant:' \|\| organization_id/);
  assert.match(recovery, /emergency stop|global Agent Fabric execution gate/i);
  assert.match(recovery, /revok|cancel/i);
  assert.match(rebaseline, /WF-040/);
  assert.match(rebaseline, /BLOCKED — SAFETY\/POLICY/);
});

test("negative pilot contract remains denied for unrestricted or cross-org execution", () => {
  assert.match(service, /UNBOUNDED_RESOURCE_SCOPE_DENIED/);
  assert.match(service, /ORGANIZATION_MISMATCH/);
  assert.match(service, /TENANT_MISMATCH/);
  assert.match(service, /TASK_TYPE_NOT_ALLOWED/);
  assert.match(service, /WORKER_NOT_ALLOWED/);
  assert.match(service, /TASK_CLAIM_CONFLICT/);
});
