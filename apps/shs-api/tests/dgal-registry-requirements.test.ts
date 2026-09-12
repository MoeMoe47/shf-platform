import assert from "node:assert/strict";
import { test } from "node:test";
import { DgalError, DgalService } from "../src/domain/documentation/service/dgal-service.ts";

const actor = (organizationId = "org_a", permissions = ["documentation.registry.manage"]) => ({
  user_id: "user_a",
  organization_id: organizationId,
  active_organization_id: organizationId,
  tenant_id: `tenant:${organizationId}`,
  roles: ["org_admin"],
  permissions,
});

function repo(seed: any[] = [], entitlement: any = { status: "ACTIVE", service_key: "civicsure" }) {
  const versions: any[] = [];
  return {
    rules: seed,
    async createDocumentType(input: any) { return input; },
    async createGuidanceItem(input: any) { return input; },
    async createGuidanceCollection(input: any) { return input; },
    async createTemplate(input: any) { return input; },
    async createTemplateVersion(input: any) { versions.push({ ...input }); return versions.at(-1); },
    async activateTemplateVersion(id: string, effectiveAt: Date) { const item = versions.find((v) => v.templateVersionId === id); if (!item) return null; for (const v of versions.filter((v) => v.templateId === item.templateId)) v.status = v.templateVersionId === id ? "ACTIVE" : "SUPERSEDED"; item.effectiveAt = effectiveAt; return item; },
    async createRequirementRule(input: any) { return input; },
    async listRules(scope: any) { return this.rules.filter((row: any) => !row.service_key || row.service_key === scope.serviceKey); },
    async getActiveEntitlement() { if (entitlement === "UNAVAILABLE") throw new Error("entitlement_source_unavailable"); return { available: true, status: entitlement?.status || "NONE", serviceKey: "civicsure" }; },
  };
}

test("template versions activate explicitly and preserve superseded history", async () => {
  const repository = repo();
  const service = new DgalService(repository as any);
  const v1 = await service.createTemplateVersion(actor(), { templateId: "tpl_civic", versionNumber: 1, revision: "r1", sourceReference: "civicsure:guide:v1" });
  const v2 = await service.createTemplateVersion(actor(), { templateId: "tpl_civic", versionNumber: 2, revision: "r2", sourceReference: "civicsure:guide:v2" });
  await service.activateTemplateVersion(actor(), v1.templateVersionId);
  await service.activateTemplateVersion(actor(), v2.templateVersionId);
  assert.equal(repository.rules.length, 0);
  assert.equal((repository as any).rules.length, 0);
  assert.equal(v1.status, "SUPERSEDED");
  assert.equal(v2.status, "ACTIVE");
  assert.equal(v1.revision, "r1");
  assert.equal(v2.revision, "r2");
});

test("resolver is deterministic, explainable, scoped, and deduplicates the same canonical target", async () => {
  const repository = repo([
    { requirement_rule_id: "rule_b", rule_key: "civic-evidence", owning_domain: "CIVICSURE", service_key: "civicsure", audience_roles: ["org_admin"], workflow_stage: "EVIDENCE", requirement_type: "REQUIRED_DOCUMENT", required: true, requires_entitlement: true, source_reference: "civicsure:evidence:v1", document_type_id: "dt_evidence", priority: 20, document_type_title: "Evidence upload" },
    { requirement_rule_id: "rule_a", rule_key: "civic-evidence-reference", owning_domain: "CIVICSURE", service_key: "civicsure", audience_roles: ["org_admin"], workflow_stage: "EVIDENCE", requirement_type: "REFERENCE", required: true, requires_entitlement: true, source_reference: "civicsure:evidence:v2", document_type_id: "dt_evidence", priority: 10, document_type_title: "Evidence upload" },
    { requirement_rule_id: "rule_other", rule_key: "studio-only", owning_domain: "STUDIO", service_key: "studio", audience_roles: ["org_admin"], requirement_type: "REQUIRED_DOCUMENT", required: true, requires_entitlement: true, source_reference: "studio:brief:v1", document_type_id: "dt_studio", priority: 1, document_type_title: "Studio brief" },
  ]);
  const result = await new DgalService(repository as any).resolveDocumentationRequirements(actor(), { serviceKey: "civicsure", workflowStage: "EVIDENCE" });
  assert.equal(result.status, "RESOLVED");
  if (result.status !== "RESOLVED") return;
  assert.equal(result.requirements.length, 1);
  assert.equal(result.requirements[0].requirementId, "rule_a");
  assert.equal(result.requirements[0].sources.join(","), "civicsure:evidence:v2,civicsure:evidence:v1");
  assert.equal(result.requirements[0].sourceDomain, "CIVICSURE");
});

test("known missing service entitlement returns NO_REQUIREMENTS, while unavailable authority is UNKNOWN", async () => {
  const repository = repo([], null);
  const result = await new DgalService(repository as any).resolveDocumentationRequirements(actor(), { serviceKey: "civicsure" });
  assert.equal(result.status, "NO_REQUIREMENTS");
  const unavailable = await new DgalService(repo([], "UNAVAILABLE") as any).resolveDocumentationRequirements(actor(), { serviceKey: "civicsure" });
  assert.equal(unavailable.status, "UNKNOWN");
  if (unavailable.status === "UNKNOWN") assert.deepEqual(unavailable.unresolved, ["service_entitlement"]);
});

test("missing authoritative context is fail-closed and client cannot widen organization scope", async () => {
  const service = new DgalService(repo() as any);
  await assert.rejects(() => service.resolveDocumentationRequirements(actor(), { organizationId: "org_b" }), (error: any) => error instanceof DgalError && error.code === "ORG_SCOPE_FORBIDDEN");
  await assert.rejects(() => service.resolveDocumentationRequirements({ ...actor(), active_organization_id: "", organization_id: "" }, {}), /organization_context_required/);
});

test("conflicting same-priority rules return UNKNOWN instead of arbitrary authority", async () => {
  const repository = repo([
    { requirement_rule_id: "required", rule_key: "conflict-required", owning_domain: "LEGAL", service_key: "civicsure", requirement_type: "REQUIRED_DOCUMENT", required: true, requires_entitlement: true, source_reference: "legal:r1", document_type_id: "dt_conflict", priority: 5, document_type_title: "Conflict" },
    { requirement_rule_id: "optional", rule_key: "conflict-optional", owning_domain: "SERVICE", service_key: "civicsure", requirement_type: "OPTIONAL_DOCUMENT", required: false, requires_entitlement: true, source_reference: "service:r1", document_type_id: "dt_conflict", priority: 5, document_type_title: "Conflict" },
  ]);
  const result = await new DgalService(repository as any).resolveDocumentationRequirements(actor(), { serviceKey: "civicsure" });
  assert.equal(result.status, "UNKNOWN");
  if (result.status === "UNKNOWN") assert.deepEqual(result.unresolved, ["conflicting_rules:dt_conflict"]);
});

test("unsafe action references are rejected", async () => {
  await assert.rejects(() => new DgalService(repo() as any).createGuidanceItem(actor(), { guidanceKey: "unsafe", title: "Unsafe", explanation: "x", owningDomain: "TEST", sourceReference: "test", actionReference: "https://example.invalid" }), /unsafe_action_reference/);
});
