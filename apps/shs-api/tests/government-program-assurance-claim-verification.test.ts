import assert from "node:assert/strict";
import test from "node:test";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { ClaimVerificationService } from "../src/domain/government-assurance/service/claim-verification-service.js";

const scope = { organizationId: "org_gpa", tenantId: "tenant:org_gpa", userId: "user_verifier" };
const permissions = [
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_SUBMIT,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_EVIDENCE_LINK,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_REQUEST,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_PERFORM,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_VERIFICATION_REVIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_CLAIM_MANAGE,
];
const user = { ...scope, permissions };

class MemoryRepo {
  claims = new Map<string, any>([["claim-1", { claim_id: "claim-1", organization_id: scope.organizationId, tenant_id: scope.tenantId, claimant_reference: "provider-a", subject_type: "PARTICIPANT_OUTCOME", subject_reference: "cohort-q2", status: "DRAFT" }]]);
  links: any[] = [];
  admissibility: any[] = [];
  custody: any[] = [];
  verifications = new Map<string, any>();
  methods = new Map<string, any>([["method-1:1", { method_id: "method-1", version: 1, status: "ACTIVE", effective_from: new Date("2020-01-01"), minimum_evidence_count: 1, human_review_required: true }]]);
  contradictions: any[] = [];
  work: any[] = [];
  async getClaim(id: string) { const row = this.claims.get(id); return row && row.organization_id === scope.organizationId ? row : null; }
  async updateClaimLifecycle(id: string, _s: any, status: string, submittedAt: any, withdrawnAt: any) { const row = this.claims.get(id); Object.assign(row, { status, submitted_at: submittedAt || row.submitted_at, withdrawn_at: withdrawnAt || row.withdrawn_at }); return row; }
  async listClaimEvidence() { return this.links; }
  async createEvidenceLink(input: any) { const row = { ...input, claim_evidence_link_id: input.claim_evidence_link_id }; this.links.push(row); return row; }
  async createAdmissibility(input: any) { this.admissibility.push(input); return input; }
  async createCustodyEvent(input: any) { this.custody.push(input); return input; }
  async getMethod(id: string, version: number) { return this.methods.get(`${id}:${version}`) || null; }
  async createVerification(input: any) { const row = { ...input, verification_id: input.verification_id, status: "PENDING" }; this.verifications.set(row.verification_id, row); return row; }
  async getVerification(id: string) { return this.verifications.get(id) || null; }
  async updateVerification(id: string, _s: any, input: any) { const row = this.verifications.get(id); Object.assign(row, input); return row; }
  async createContradiction(input: any) { this.contradictions.push(input); return input; }
  async listContradictions() { return this.contradictions; }
  async createWorkItem(input: any) { this.work.push(input); return input; }
  async listWorkQueue() { return this.work; }
}

function service(repo = new MemoryRepo()) {
  return new ClaimVerificationService(repo as any, undefined as any, null, async () => ({ allowed: true, policyId: "policy-1", accessDecisionId: "access-1" }));
}

test("claim submission and evidence linkage remain separate from Truth", async () => {
  const repo = new MemoryRepo(); const sut = service(repo);
  await sut.submitClaim(user, "claim-1");
  assert.equal(repo.claims.get("claim-1").status, "SUBMITTED");
  const linked = await sut.linkEvidence(user, "claim-1", { evidenceId: "evidence-1", provenanceComplete: true, subjectMatches: true, integrityVerified: true, sourceSystemId: "source-1" });
  assert.equal(linked.admissibility.decision, "ADMISSIBLE");
  assert.equal(repo.claims.get("claim-1").truth_fact_id, undefined);
});

test("purpose/source denial makes evidence inadmissible", async () => {
  const repo = new MemoryRepo();
  const sut = new ClaimVerificationService(repo as any, undefined as any, null, async () => ({ allowed: false, reasonCode: "GPA_PURPOSE_DENIED" }));
  const result = await sut.linkEvidence(user, "claim-1", { evidenceId: "evidence-2", provenanceComplete: true, sourceSystemId: "source-1" });
  assert.equal(result.admissibility.decision, "PURPOSE_NOT_ALLOWED");
});

test("claimant cannot self-verify and determination requires independent review", async () => {
  const repo = new MemoryRepo(); const sut = service(repo);
  await assert.rejects(() => sut.requestVerification({ ...user, userId: "provider-a" }, { claimId: "claim-1", methodId: "method-1", methodVersion: 1, verifierReference: "provider-a" }), /GPA_SELF_VERIFICATION_DENIED/);
  await sut.linkEvidence(user, "claim-1", { evidenceId: "evidence-3", provenanceComplete: true });
  const verification = await sut.requestVerification(user, { claimId: "claim-1", methodId: "method-1", methodVersion: 1, verifierReference: "reviewer-1", requestedLevel: "V2" });
  await sut.startVerification(user, verification.verification_id);
  await assert.rejects(() => sut.determineVerification(user, verification.verification_id, { reviewerReference: "reviewer-1" }), /GPA_SELF_VERIFICATION_DENIED/);
  const determined = await sut.determineVerification(user, verification.verification_id, { reviewerReference: "reviewer-2" });
  assert.equal(determined.status, "PASSED");
  assert.equal(determined.achieved_level, "V2");
});

test("contradictions are durable and do not silently create Truth", async () => {
  const repo = new MemoryRepo(); const sut = service(repo);
  await sut.linkEvidence(user, "claim-1", { evidenceId: "evidence-a", provenanceComplete: true });
  const verification = await sut.requestVerification(user, { claimId: "claim-1", methodId: "method-1", methodVersion: 1, verifierReference: "reviewer-1" });
  const contradiction = await sut.addContradiction(user, verification.verification_id, { leftReference: "source-a:120", rightReference: "source-b:114", materiality: "BLOCKING" });
  assert.equal(contradiction.materiality, "BLOCKING"); assert.equal(repo.contradictions.length, 1); assert.equal((repo as any).truth, undefined);
});

test("cross-tenant actor context is rejected before claim access", async () => {
  const sut = service();
  await assert.rejects(() => sut.readiness({ ...user, tenantId: "tenant:other" }, "claim-1"), /GOVERNMENT_ASSURANCE_ORG_CONTEXT_REQUIRED/);
});
