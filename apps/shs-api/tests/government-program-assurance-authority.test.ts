import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { GovernmentAssuranceService } from "../src/domain/government-assurance/service/government-assurance-service.ts";
import { workforceOutcomeClaimCandidate } from "../src/domain/government-assurance/adapters/producer-boundaries.ts";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.ts";

const permissions = [
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_SOURCE_AUTHORITY_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_TRUTH_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_TRUTH_DETERMINE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_RECONCILIATION_MANAGE,
];

const actor = {
  id: "user-a",
  active_organization_id: "org-a",
  tenant_id: "tenant:org-a",
  permissions,
};

class MemoryRepo {
  claims: any[] = [];
  sourceAuthorities: any[] = [];
  metrics: any[] = [];
  methods: any[] = [];
  verifications: any[] = [];
  truthFacts: any[] = [];
  reconciliationCases: any[] = [];

  async createClaim(input: any) { const row = { ...input, created_at: new Date(), updated_at: new Date() }; this.claims.push(row); return row; }
  async listClaims(scope: any) { return this.claims.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async getClaim(id: string, scope: any) { return this.claims.find((row) => row.claim_id === id && row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId) || null; }
  async createSourceAuthority(input: any) { const row = { ...input }; this.sourceAuthorities.push(row); return row; }
  async listSourceAuthorities(scope: any) { return this.sourceAuthorities.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createMetric(input: any) { this.metrics.push(input); return input; }
  async listMetrics(scope: any) { return this.metrics.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createVerificationMethod(input: any) { this.methods.push(input); return input; }
  async listVerificationMethods(scope: any) { return this.methods.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createVerification(input: any) { this.verifications.push(input); return input; }
  async listVerifications(scope: any) { return this.verifications.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async getVerification(id: string, scope: any) { return this.verifications.find((row) => row.verification_id === id && row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId) || null; }
  async createTruthFact(input: any) { this.truthFacts.push(input); return input; }
  async listTruthFacts(scope: any) { return this.truthFacts.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
  async createReconciliationCase(input: any) { this.reconciliationCases.push(input); return input; }
  async listReconciliationCases(scope: any) { return this.reconciliationCases.filter((row) => row.organization_id === scope.organizationId && row.tenant_id === scope.tenantId); }
}

function service() { return new GovernmentAssuranceService(new MemoryRepo() as any); }

test("claim creation creates an assertion and never creates Truth", async () => {
  const svc = service();
  const claim = await svc.createClaim(actor, { claimantReference: "provider-a", programReference: "program-a", claimType: "EMPLOYMENT_PLACEMENT", assertedValue: 312, assertedUnit: "participants", reportingPeriodStart: "2026-01-01", reportingPeriodEnd: "2026-03-31" });
  assert.equal(claim.status, "DRAFT");
  assert.equal((await svc.listTruthFacts(actor)).length, 0);
});

test("source authority and metric boundaries are scoped and version-aware", async () => {
  const svc = service();
  await svc.createSourceAuthority(actor, { sourceSystemId: "erp", sourceOwnerReference: "county-finance", dataDomain: "funding", recordType: "obligation", precedence: 10, effectiveFrom: "2026-01-01" });
  await svc.createMetric(actor, { metricId: "employment_rate", version: 2, canonicalName: "Employment Rate", definition: "qualifying placements / eligible participants", unitValueType: "RATE", authorityOwnerReference: "program-office", effectiveFrom: "2026-01-01" });
  assert.equal((await svc.listSourceAuthorities(actor))[0].precedence, 10);
  assert.equal((await svc.listMetrics(actor))[0].version, 2);
  assert.equal((await svc.listMetrics({ ...actor, active_organization_id: "org-b", organization_id: "org-b", tenant_id: "tenant:org-b" })).length, 0);
  await assert.rejects(() => svc.createMetric({ ...actor, tenant_id: "tenant:org-b" }, { metricId: "bad", canonicalName: "Bad", definition: "x", unitValueType: "COUNT", authorityOwnerReference: "x" }), /GOVERNMENT_ASSURANCE_ORG_CONTEXT_REQUIRED/);
});

test("verification remains separate from Claim and Truth", async () => {
  const svc = service();
  const claim = await svc.createClaim(actor, { claimantReference: "provider-a", claimType: "SERVICE", assertedValue: 1, assertedUnit: "service" });
  await svc.createVerificationMethod(actor, { methodId: "document-review", version: 1, methodType: "DOCUMENT_REVIEW", description: "Review source documents", effectiveFrom: "2026-01-01" });
  const verification = await svc.createVerification(actor, { claimId: claim.claimId, subjectType: "claim", subjectReference: claim.claimId, methodId: "document-review", verifierReference: "reviewer-a" });
  assert.equal(verification.status, "UNREVIEWED");
  assert.equal((await svc.listTruthFacts(actor)).length, 0);
});

test("Truth determination rejects AI/reporting actors and requires provenance", async () => {
  const svc = service();
  await assert.rejects(() => svc.determineTruthFact({ ...actor, actor_type: "ai" }, { verificationId: "verification-a", factType: "OUTCOME", subjectType: "claim", subjectReference: "claim-a", factValue: true, provenance: { source: "test" } }), /GOVERNMENT_ASSURANCE_TRUTH_ACTOR_DENIED/);
  await assert.rejects(() => svc.determineTruthFact(actor, { factType: "OUTCOME", subjectType: "claim", subjectReference: "claim-a", factValue: true, provenance: { source: "test" } }), /GOVERNMENT_ASSURANCE_TRUTH_PROVENANCE_REQUIRED/);
});

test("accepted Truth requires a passed, scoped verification", async () => {
  const svc = service();
  await assert.rejects(() => svc.determineTruthFact(actor, { verificationId: "missing", factType: "OUTCOME", subjectType: "claim", subjectReference: "claim-a", factValue: true, provenance: { source: "test" } }), /GOVERNMENT_ASSURANCE_TRUTH_VERIFICATION_REQUIRED/);
});

test("reconciliation records conflict without writing Truth", async () => {
  const svc = service();
  const row = await svc.createReconciliationCase(actor, { subjectType: "award", subjectReference: "award-a", competingSourceReferences: ["euna:1000000", "erp:975000"], conflictReason: "amount mismatch", sourceAuthorityReferences: ["euna-authority", "erp-authority"] });
  assert.equal(row.status, "OPEN");
  assert.equal((await svc.listTruthFacts(actor)).length, 0);
});

test("producer adapters remain references and never authority writes", () => {
  const candidate = workforceOutcomeClaimCandidate("workforce-outcome-1");
  assert.equal(candidate.authorityState, "SOURCE_CANDIDATE");
  assert.equal(candidate.producerDomain, "workforce-outcome");
  assert.equal("claim_id" in candidate, false);
});

test("canonical migration and semantic boundary prohibit duplicate authority paths", () => {
  const migration = readFileSync(new URL("../migrations/098_government_program_assurance_authority_boundary.sql", import.meta.url), "utf8");
  const boundary = readFileSync(new URL("../../../docs/government-program-assurance/PHASE_1_CANONICAL_AUTHORITY_AND_SEMANTIC_BOUNDARY.md", import.meta.url), "utf8");
  const routes = readFileSync(new URL("../src/domain/government-assurance/api/routes.ts", import.meta.url), "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS gpa_claims/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS gpa_truth_facts/);
  assert.match(boundary, /There is intentionally no public Truth creation endpoint/);
  assert.match(boundary, /Reporting consumes authorized facts and metrics/);
  assert.equal(routes.includes('app.post("/government-assurance/truth-facts"'), false);
});
