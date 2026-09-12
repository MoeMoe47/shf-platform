import assert from "node:assert/strict";
import test from "node:test";
import { ProviderSelfServiceService } from "../src/domain/government-assurance/service/provider-self-service-service.ts";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.ts";

const provider = "provider-a";
const actor = {
  user_id: "provider-user-a",
  organization_id: provider,
  tenant_id: `tenant:${provider}`,
  permissions: [
    SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW,
    SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_SUBMIT,
  ],
};

function fakeDb() {
  const finding = {
    finding_id: "finding-a",
    organization_id: "operator-org",
    tenant_id: "tenant:operator-org",
    provider_reference: provider,
    program_reference: "program-a",
    finding_type: "DELIVERY_EXCEPTION",
    severity: "MEDIUM",
    materiality: "NON_MATERIAL",
    description: "Provide the missing attendance evidence.",
    status: "CORRECTIVE_ACTION_REQUIRED",
    provider_response_state: "PENDING",
    corrective_action_required: true,
    detected_at: new Date().toISOString(),
  };
  const action = {
    corrective_action_id: "action-a",
    finding_id: finding.finding_id,
    organization_id: finding.organization_id,
    tenant_id: finding.tenant_id,
    provider_reference: provider,
    required_action: "Submit attendance evidence.",
    action_owner: provider,
    status: "REQUIRED",
    milestones: [],
    required_evidence: ["attendance"],
  };
  const requests = [{ evidence_request_id: "request-a", provider_reference: provider, evidence_type: "ATTENDANCE", status: "REQUESTED" }];
  const calls: string[] = [];
  const db = async (sql: string, params: unknown[] = []) => {
    calls.push(sql);
    if (sql.includes("FROM gpa_findings") && sql.includes("finding_id=$1")) return { rows: params[0] === finding.finding_id && params[1] === provider ? [finding] : [] };
    if (sql.includes("FROM gpa_corrective_actions") && sql.includes("corrective_action_id=$1")) return { rows: params[0] === action.corrective_action_id && params[1] === provider ? [{ ...action, finding_status: finding.status }] : [] };
    if (sql.includes("FROM source_assets")) return { rows: [{ source_asset_id: "evidence-a" }] };
    if (sql.startsWith("INSERT INTO gpa_provider_responses")) return { rows: [{ response_id: params[0], finding_id: params[1], provider_reference: params[4], response_type: "FINDING_RESPONSE", status: "SUBMITTED", supporting_evidence_references: ["evidence-a"], provenance: JSON.parse(String(params[8])), submitted_at: new Date().toISOString() }] };
    if (sql.startsWith("INSERT INTO audit_events")) return { rows: [{ audit_event_id: params[0] }] };
    if (sql.startsWith("UPDATE gpa_corrective_actions")) return { rows: [{ ...action, status: "EVIDENCE_SUBMITTED" }] };
    if (sql.includes("FROM gpa_evidence_requests")) return { rows: requests };
    if (sql.includes("FROM gpa_findings") && sql.includes("provider_reference=$1") && !sql.includes("finding_id=$1")) return { rows: [finding] };
    if (sql.includes("FROM gpa_corrective_actions") && sql.includes("provider_reference=$1")) return { rows: [action] };
    throw new Error(`Unexpected SQL in test: ${sql}`);
  };
  return { db: db as any, calls };
}

test("provider workspace is limited to provider-owned records and preserves authority boundaries", async () => {
  const harness = fakeDb();
  const service = new ProviderSelfServiceService(harness.db);
  const workspace = await service.workspace(actor);
  assert.equal(workspace.providerReference, provider);
  assert.equal(workspace.items.findings[0].finding_id, "finding-a");
  assert.equal(workspace.authority.canVerify, false);
  assert.equal(workspace.authority.canPublish, false);
  assert.equal(workspace.authority.canTriggerPayment, false);
  assert.ok(harness.calls.every((sql) => !sql.includes("SELECT * FROM gpa_findings WHERE organization_id=$1")));
});

test("provider can submit a scoped finding response with canonical evidence provenance", async () => {
  const service = new ProviderSelfServiceService(fakeDb().db);
  const response = await service.submitFindingResponse(actor, "finding-a", { narrative: "Attendance records attached.", evidenceReferences: ["evidence-a"] });
  assert.equal(response.response_type, "FINDING_RESPONSE");
  assert.deepEqual(response.supporting_evidence_references, ["evidence-a"]);
  assert.equal(response.provenance.providerReference, provider);
});

test("foreign provider IDs fail closed and provider cannot use operator-only permissions", async () => {
  const service = new ProviderSelfServiceService(fakeDb().db);
  assert.equal(await service.finding(actor, "finding-from-provider-b"), null);
  const noSubmit = { ...actor, permissions: [SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_PROVIDER_SELF_SERVICE_VIEW] };
  await assert.rejects(() => service.submitFindingResponse(noSubmit, "finding-a", {}), /PERMISSION_REQUIRED/);
});
