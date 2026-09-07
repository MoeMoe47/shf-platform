import assert from "node:assert/strict";
import test from "node:test";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { ReconciliationQualityService } from "../src/domain/government-assurance/service/reconciliation-quality-service.js";

const scope = { organizationId: "org_quality", tenantId: "tenant:org_quality", userId: "user_quality" };
const permissions = [
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_DETERMINE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_ENTITY_RESOLUTION_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_ENTITY_RESOLUTION_DETERMINE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_DATA_QUALITY_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_DATA_QUALITY_EVALUATE,
];
const user = { ...scope, permissions };

class MemoryRepo {
  cases: any[] = []; evaluations: any[] = []; rules: any[] = []; entities: any[] = []; duplicates: any[] = [];
  async createCase(value: any) { this.cases.push(value); return value; }
  async listCases() { return this.cases; }
  async getCase(id: string) { return this.cases.find((value) => value.reconciliation_case_id === id) || null; }
  async determineCase(id: string, _scope: any, value: any) { const row = this.cases.find((item) => item.reconciliation_case_id === id); if (!row) return null; Object.assign(row, { status: value.status, determination: value.determination, reviewer_reference: value.reviewer_reference }); return row; }
  async createQualityRule(value: any) { this.rules.push(value); return value; }
  async listQualityRules() { return this.rules; }
  async createQualityEvaluation(value: any) { this.evaluations.push(value); return value; }
  async listQualityEvaluations() { return this.evaluations; }
  async createEntityResolution(value: any) { this.entities.push(value); return value; }
  async listEntityResolutions() { return this.entities; }
  async determineEntity(id: string, _scope: any, value: any) { const row = this.entities.find((item) => item.resolution_id === id); if (!row) return null; Object.assign(row, value); return row; }
  async createDuplicate(value: any) { this.duplicates.push(value); return value; }
  async createSchemaObservation(value: any) { return value; }
  async createRejectedRecord(value: any) { return value; }
}

test("material reconciliation preserves competing sources and requires four-eyes determination", async () => {
  const repo = new MemoryRepo(); const sut = new ReconciliationQualityService(repo as any);
  const row = await sut.createCase(user, { reconciliationCaseId: "case-1", subjectType: "AWARD", subjectReference: "award-1", conflictType: "FUNDING_CONFLICT", conflictReason: "Award and obligation differ", competingSourceReferences: ["grant:1", "erp:1"], materiality: "MATERIAL", severity: "HIGH" });
  assert.equal(row.status, "OPEN");
  await assert.rejects(() => sut.determineCase(user, "case-1", { determination: "ACCEPT_SOURCE_A", reviewerReference: "user_quality" }), /SELF_REVIEW_DENIED/);
  const determined = await sut.determineCase(user, "case-1", { determination: "ACCEPT_SOURCE_A", reviewerReference: "independent-reviewer", status: "RESOLVED" });
  assert.equal(determined.status, "RESOLVED");
  assert.deepEqual(row.competing_source_references, ["grant:1", "erp:1"]);
});

test("quality evaluations retain explainable dimensions and critical failures block readiness", async () => {
  const repo = new MemoryRepo(); const sut = new ReconciliationQualityService(repo as any);
  await sut.createQualityRule(user, { ruleId: "required-provider", dimension: "COMPLETENESS", logicReference: "provider-required", sourceSystemId: "erp" });
  await sut.evaluateQuality(user, { subjectType: "PAYMENT", subjectReference: "payment-1", sourceSystemId: "erp", dimension: "REFERENTIAL_INTEGRITY", state: "FAIL", reasonCodes: ["PROVIDER_NOT_FOUND"] });
  const result = await sut.qualityReadiness(user, { subjectReference: "payment-1", severity: "CRITICAL" });
  assert.equal(result.ready, false); assert.ok(result.blockers.includes("GPA_QUALITY_REFERENTIAL_INTEGRITY_FAIL"));
  assert.equal(repo.evaluations[0].dimension, "REFERENTIAL_INTEGRITY");
});

test("deterministic provider keys match while name-only participant candidates remain ambiguous", async () => {
  const repo = new MemoryRepo(); const sut = new ReconciliationQualityService(repo as any);
  const matched = await sut.evaluateEntity(user, { entityType: "PROVIDER", sourceSystemId: "erp", sourceRecordId: "provider-1", candidateEntityReferences: ["org-provider-a"], matchMethod: "DETERMINISTIC", confidence: 1 });
  assert.equal(matched.status, "MATCHED");
  const ambiguous = await sut.evaluateEntity(user, { entityType: "PARTICIPANT", sourceSystemId: "case", sourceRecordId: "participant-1", candidateEntityReferences: ["person-a", "person-b"], matchMethod: "MANUAL", matchAttributes: { name: "Same Name" } });
  assert.equal(ambiguous.status, "AMBIGUOUS");
  assert.deepEqual(ambiguous.match_attributes, { name: "Same Name" });
});

test("duplicate candidates remain distinct from fraud determinations", async () => {
  const sut = new ReconciliationQualityService(new MemoryRepo() as any);
  const candidate = await sut.createDuplicate(user, { subjectType: "PAYMENT", leftReference: "erp:payment-1", rightReference: "grant:payment-1", classification: "POSSIBLE_DUPLICATE" });
  assert.equal(candidate.classification, "POSSIBLE_DUPLICATE");
  await assert.rejects(() => sut.createDuplicate(user, { subjectType: "PAYMENT", leftReference: "a", rightReference: "b", classification: "FRAUD" }), /CLASSIFICATION_INVALID/);
});

test("cross-tenant context is rejected before quality or resolution access", async () => {
  const sut = new ReconciliationQualityService(new MemoryRepo() as any);
  await assert.rejects(() => sut.listCases({ ...user, tenantId: "tenant:other" }), /ORG_CONTEXT_REQUIRED/);
  await assert.rejects(() => sut.evaluateQuality(user, { organizationId: "org_other", subjectType: "PAYMENT", subjectReference: "p", dimension: "VALIDITY", state: "PASS" }), /SCOPE_MISMATCH/);
});
