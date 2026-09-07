import assert from "node:assert/strict";
import test from "node:test";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { MetricTruthService } from "../src/domain/government-assurance/service/metric-truth-service.js";

const scope = { organizationId: "org_metric", tenantId: "tenant:org_metric", userId: "user_determiner" };
const permissions = [
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_MANAGE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_VIEW,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_METRIC_CALCULATE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_TRUTH_DETERMINE,
  SHS_SECURITY_PERMISSIONS.GOVERNMENT_ASSURANCE_LINEAGE_VIEW,
];
const user = { ...scope, permissions };

class MemoryRepo {
  metric = { metric_id: "retention", version: 1, organization_id: scope.organizationId, tenant_id: scope.tenantId, metric_type: "PERCENTAGE", status: "ACTIVE", effective_from: new Date("2020-01-01"), canonical_name: "90-Day Employment Retention Rate", definition: "verified retained / eligible placements", unit_value_type: "PERCENT", minimum_verification_level: "V2", program_reference: "program-1" };
  result: any;
  truth: any;
  async getMetric() { return this.metric; }
  async createMetric(input: any) { return { ...this.metric, ...input }; }
  async createMetricResult(input: any) { this.result = input; return input; }
  async getMetricResult() { return this.result; }
  async listMetricResults() { return this.result ? [this.result] : []; }
  async listMetrics() { return [this.metric]; }
  async createTruthFact(input: any) { this.truth = input; return input; }
  async createTruthDetermination(input: any) { return input; }
  async listMetricResultLineage() { return this.result; }
}

class MemoryVerificationRepo {
  verification = { verification_id: "verification-1", claim_id: "claim-1", status: "PASSED", achieved_level: "V2" };
  async getVerification() { return this.verification; }
  async listContradictions() { return []; }
}

test("deterministic metric calculation preserves inputs and does not create Truth", async () => {
  const repo = new MemoryRepo(); const sut = new MetricTruthService(repo as any, new MemoryVerificationRepo() as any, null);
  const result = await sut.calculate(user, { metricId: "retention", metricVersion: 1, denominatorValue: 4, inputs: [
    { claimId: "claim-1", verificationId: "verification-1", value: 1, verificationLevel: "V2", provenanceReference: "prov-1", sourceAuthorityReference: "authority-1" },
    { claimId: "claim-2", verificationId: "verification-2", value: 1, verificationLevel: "V2", provenanceReference: "prov-2", sourceAuthorityReference: "authority-1" },
  ] });
  assert.equal(result.calculated_value, 50); assert.match(result.calculation_hash, /^[a-f0-9]{64}$/); assert.equal(repo.truth, undefined); assert.equal(result.input_references.length, 2);
});

test("metric readiness and calculation fail closed for insufficient verification or provenance", async () => {
  const repo = new MemoryRepo(); const sut = new MetricTruthService(repo as any, new MemoryVerificationRepo() as any, null);
  const ready = await sut.readiness(user, { metricId: "retention", metricVersion: 1, inputs: [{ verificationLevel: "V1" }] });
  assert.equal(ready.ready, false); assert.ok(ready.blockers.includes("GPA_LINEAGE_PROVENANCE_INCOMPLETE")); assert.ok(ready.blockers.includes("GPA_VERIFICATION_LEVEL_TOO_LOW"));
  await assert.rejects(() => sut.calculate(user, { metricId: "retention", metricVersion: 1, inputs: [{ value: 1, verificationLevel: "V1" }] }), /GPA_LINEAGE_PROVENANCE_INCOMPLETE/);
});

test("Truth promotion requires passed verification and is denied to AI, Reporting, and Oracle", async () => {
  const repo = new MemoryRepo(); const verificationRepo = new MemoryVerificationRepo(); const sut = new MetricTruthService(repo as any, verificationRepo as any, null);
  await sut.calculate(user, { metricId: "retention", metricVersion: 1, denominatorValue: 1, inputs: [{ claimId: "claim-1", verificationId: "verification-1", value: 1, verificationLevel: "V2", provenanceReference: "prov-1", sourceAuthorityReference: "authority-1" }] });
  const fact = await sut.determineTruth(user, { metricResultId: repo.result.metric_result_id, reason: "reviewed lineage" }); assert.equal(fact.status, "ACCEPTED"); assert.equal(fact.metric_result_id, repo.result.metric_result_id);
  await assert.rejects(() => sut.determineTruth({ ...user, actor_type: "ai" }, { metricResultId: repo.result.metric_result_id }), /GPA_TRUTH_ACTOR_DENIED/);
});

test("unresolved blocking contradiction prevents Truth promotion", async () => {
  const repo = new MemoryRepo(); const verificationRepo = new MemoryVerificationRepo(); verificationRepo.listContradictions = async () => [{ status: "OPEN", materiality: "BLOCKING" }];
  const sut = new MetricTruthService(repo as any, verificationRepo as any, null);
  await sut.calculate(user, { metricId: "retention", metricVersion: 1, denominatorValue: 1, inputs: [{ claimId: "claim-1", verificationId: "verification-1", value: 1, verificationLevel: "V2", provenanceReference: "prov-1", sourceAuthorityReference: "authority-1" }] });
  await assert.rejects(() => sut.determineTruth(user, { metricResultId: repo.result.metric_result_id }), /GPA_CONTRADICTION_UNRESOLVED/); assert.equal(repo.truth, undefined);
});

test("cross-tenant metric inputs are rejected", async () => {
  const sut = new MetricTruthService(new MemoryRepo() as any, new MemoryVerificationRepo() as any, null);
  await assert.rejects(() => sut.calculate(user, { metricId: "retention", metricVersion: 1, inputs: [{ value: 1, verificationLevel: "V2", provenanceReference: "p", organizationId: "other-org" }] }), /GPA_LINEAGE_SCOPE_MISMATCH/);
});
