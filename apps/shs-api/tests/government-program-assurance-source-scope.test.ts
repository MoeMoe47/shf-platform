import assert from "node:assert/strict";
import test from "node:test";
import { SourceScopeService } from "../src/domain/government-assurance/service/source-scope-service.ts";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.ts";

const permissions = [
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_SCOPE_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_ACCESS_EVALUATE,
];
const actor = { id: "user-a", active_organization_id: "org-a", tenant_id: "tenant:org-a", permissions };

class MemorySourceScopeRepo {
  jurisdictions: any[] = [];
  sources: any[] = [];
  policies: any[] = [];
  decisions: any[] = [];
  provenance: any[] = [];
  purposes = ["PROGRAM_MONITORING", "CLAIM_VERIFICATION", "PAYMENT_VALIDATION", "AUDIT", "COMPLIANCE_REVIEW", "PROVIDER_ASSURANCE", "PERFORMANCE_REPORTING", "PUBLIC_REPORTING", "INVESTIGATION"].map((purpose_id) => ({ purpose_id }));
  async createJurisdiction(input: any) { this.jurisdictions.push(input); return input; }
  async listJurisdictions(scope: any) { return this.jurisdictions.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createSourceSystem(input: any) { this.sources.push(input); return input; }
  async listSourceSystems(scope: any) { return this.sources.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async getSourceSystem(id: string, scope: any) { return this.sources.find((row) => row.source_system_id === id && row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId) || null; }
  async listPurposes() { return this.purposes; }
  async createPolicy(input: any) { this.policies.push(input); return input; }
  async listPolicies(scope: any) { return this.policies.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createProvenance(input: any) { this.provenance.push(input); return input; }
  async createAccessDecision(input: any) { this.decisions.push(input); return input; }
  async listAccessDecisions(scope: any) { return this.decisions.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
}

function setup() {
  const repo = new MemorySourceScopeRepo();
  const service = new SourceScopeService(repo as any);
  return { repo, service };
}

async function register(service: SourceScopeService) {
  await service.createSourceSystem(actor, {
    sourceSystemId: "erp-a", canonicalName: "County ERP", sourceOwnerReference: "county-a", environment: "PRODUCTION",
    systemType: "FINANCIAL_ERP", integrationMode: "API", dataClassification: "RESTRICTED", status: "ACTIVE",
  });
  await service.createPolicy(actor, {
    policyId: "policy-erp", version: 1, sourceSystemId: "erp-a", allowedPurposes: ["PAYMENT_VALIDATION"],
    allowedActions: ["payment.read"], allowedDataDomains: ["payment"], allowedRecordTypes: ["obligation"], allowedFields: ["amount", "award_id"],
    classificationCeiling: "RESTRICTED", legalBasisReference: "agreement:county-erp", effectiveFrom: "2026-01-01", status: "ACTIVE",
  });
}

test("source systems, purposes, and credential references remain scoped and non-secret", async () => {
  const { service } = setup();
  await register(service);
  const sources = await service.listSourceSystems(actor);
  assert.equal(sources[0].sourceSystemId, "erp-a");
  assert.equal("credentialReference" in sources[0], false);
  assert.ok((await service.listPurposes(actor)).some((row: any) => row.purposeId === "PAYMENT_VALIDATION"));
  assert.equal((await service.listSourceSystems({ ...actor, active_organization_id: "org-b", tenant_id: "tenant:org-b" })).length, 0);
});

test("allowed purpose and read action pass while wrong purpose or action fails", async () => {
  const { service } = setup();
  await register(service);
  const allowed = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation", requestedFields: ["amount"] });
  assert.equal(allowed.allowed, true);
  const wrongPurpose = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PROGRAM_MONITORING", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation" });
  assert.equal(wrongPurpose.reasonCode, "GPA_PURPOSE_DENIED");
  const writeAttempt = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "ACTION", action: "payment.hold", dataDomain: "payment", recordType: "obligation" });
  assert.equal(writeAttempt.reasonCode, "GPA_ACTION_DENIED");
  const mislabeledWrite = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "WRITE", action: "payment.read", dataDomain: "payment", recordType: "obligation" });
  assert.equal(mislabeledWrite.reasonCode, "GPA_ACTION_DENIED");
});

test("classification and fields fail closed", async () => {
  const { service } = setup();
  await register(service);
  const classification = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation", requestedClassification: "HIGHLY_RESTRICTED" });
  assert.equal(classification.reasonCode, "GPA_CLASSIFICATION_DENIED");
  const fields = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation", requestedFields: ["bank_account"] });
  assert.equal(fields.reasonCode, "GPA_FIELD_DENIED");
  const missingPolicy = await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "AUDIT", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation" });
  assert.equal(missingPolicy.reasonCode, "GPA_PURPOSE_DENIED");
});

test("agent authority cannot expand source policy or read access into action access", async () => {
  const { service } = setup();
  await register(service);
  const agent = { ...actor, actor_type: "agent" };
  const denied = await service.evaluateAccess(agent, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation", agentAuthority: { valid: false, allowedActions: ["payment.read"], classificationCeiling: "RESTRICTED" } });
  assert.equal(denied.reasonCode, "GPA_AGENT_AUTHORITY_DENIED");
  const action = await service.evaluateAccess(agent, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "ACTION", action: "payment.hold", dataDomain: "payment", recordType: "obligation", agentAuthority: { valid: true, allowedActions: ["payment.hold"], classificationCeiling: "RESTRICTED" } });
  assert.equal(action.reasonCode, "GPA_ACTION_DENIED");
});

test("provenance and access decisions preserve producer/audit boundaries", async () => {
  const { repo, service } = setup();
  await register(service);
  const provenance = await service.createProvenance(actor, { provenanceId: "prov-1", sourceSystemId: "erp-a", sourceRecordId: "obligation-1", connectorId: "erp-api", connectorVersion: "v1", validationStatus: "VALID", actorServiceIdentity: "connector:erp", correlationId: "corr-1", transformationReference: "map:obligation:v1" });
  assert.equal(provenance.sourceRecordId, "obligation-1");
  await service.evaluateAccess(actor, { sourceSystemId: "erp-a", purposeId: "PAYMENT_VALIDATION", actionClass: "READ", action: "payment.read", dataDomain: "payment", recordType: "obligation" });
  assert.equal(repo.decisions.length, 1);
  assert.equal(repo.decisions[0].decision, "ALLOW");
  assert.equal(repo.provenance[0].transformation_reference, "map:obligation:v1");
});

test("cross-tenant policy creation is rejected before persistence", async () => {
  const { repo, service } = setup();
  await assert.rejects(() => service.createPolicy(actor, { organizationId: "org-b", tenantId: "tenant:org-b", policyId: "bad", version: 1, allowedPurposes: ["AUDIT"], allowedActions: ["read"], allowedDataDomains: ["x"], allowedRecordTypes: ["y"] }), /GOVERNMENT_ASSURANCE_SCOPE_MISMATCH/);
  assert.equal(repo.policies.length, 0);
});
