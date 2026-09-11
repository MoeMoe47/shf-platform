import assert from "node:assert/strict";
import test from "node:test";
import { AssuranceProofLoopService } from "../src/domain/government-assurance/service/assurance-proof-loop-service.js";

const actor = { userId: "wave1-reviewer", organizationId: "wave1-org", tenantId: "tenant:wave1-org", permissions: ["all"] };
function repo() {
  const records: any[] = [];
  const save = (type: string, value: any) => { const row = { ...value, __type: type }; records.push(row); return row; };
  return {
    records,
    funding: { createReference: async (_a: any, i: any) => save("funding", { funding_reference_id: "wave1-funding", ...i }), link: async (_a: any, i: any) => save("funding-edge", i) },
    assurance: { createSourceAuthority: async (_a: any, i: any) => save("source", { source_authority_id: "wave1-source", ...i }), createClaim: async (_a: any, i: any) => save("claim", { claim_id: "wave1-claim", ...i }) },
    claims: { linkEvidence: async (_a: any, id: string, i: any) => save("evidence-link", { claimId: id, ...i }), submitClaim: async (_a: any, id: string) => save("claim-submit", { claimId: id, status: "SUBMITTED" }) },
    verification: { createVerification: async (_a: any, i: any) => save("verification", { verification_id: "wave1-verification", ...i }), startVerification: async (_a: any, id: string) => save("verification-start", { id }), determineVerification: async (_a: any, id: string) => save("verification-result", { verification_id: id, status: "PASSED", achieved_level: "V5" }) },
    metrics: { calculate: async (_a: any, i: any) => save("metric-result", { metric_result_id: "wave1-metric-result", metric_id: "workforce.employment.started_verified_count.v1", metric_version: 1, ...i }), determineTruth: async (_a: any, i: any) => save("truth", { truth_fact_id: "wave1-truth", ...i }) },
    oversight: { createPlan: async (_a: any, i: any) => save("plan", { monitoring_plan_id: "wave1-plan", ...i }), createActivity: async (_a: any, i: any) => save("warning", { activity_id: "wave1-warning", ...i }), createFinding: async (_a: any, i: any) => save("finding", { finding_id: "wave1-finding", ...i }), createAction: async (_a: any, i: any) => save("action", { corrective_action_id: "wave1-action", ...i }), retest: async (_a: any, i: any) => save("action-result", { corrective_action_id: i.correctiveActionId, status: "COMPLETE", ...i }), createDecision: async (_a: any, i: any) => save("decision", { decision_id: "wave1-decision", ...i }), createAudit: async (_a: any, i: any) => save("audit", { audit_engagement_id: "wave1-audit", ...i }), createWorkpaper: async (_a: any, i: any) => save("workpaper", i) },
    publicReport: async (_a: any, i: any) => save("public-report", { status: "PUBLISHED", ...i }),
  };
}

test("one bounded case crosses every canonical assurance authority", async () => {
  const dependencies = repo();
  const service = new AssuranceProofLoopService(dependencies as any);
  const result = await service.execute({
    actor, caseReference: "wave1-workforce-case", source: { sourceSystemId: "wave1-grants", sourceRecordId: "wave1-award", sourceOwnerReference: "wave1-county", dataDomain: "FUNDING", recordType: "AWARD", status: "ACTIVE", provenance: "wave1-source-provenance" },
    funding: { canonicalRecordType: "AWARD", canonicalRecordId: "wave1-award", amount: 100000, programReference: "wave1-program", sourceSystemId: "wave1-grants", sourceRecordId: "wave1-award", provenanceReference: "wave1-funding-provenance" },
    programReference: "wave1-program", providerReference: "wave1-provider", serviceReference: "wave1-training-completion",
    claim: { claimantReference: "wave1-provider", claimType: "SERVICE_DELIVERY", assertedValue: 12, assertedUnit: "COMPLETIONS", provenance: "wave1-claim-provenance" },
    evidence: { evidenceId: "wave1-evidence", evidenceAuthority: "PREPARE_PROVE_EVIDENCE", requirementReference: "wave1-completion-rule", provenance: "wave1-evidence-provenance", integrityVerified: true, provenanceComplete: true },
    verification: { methodId: "wave1-verification-method", methodVersion: 1, verifierReference: "wave1-independent-reviewer", requestedLevel: "V2", reviewerReference: "wave1-supervisor", provenance: "wave1-verification-provenance" },
    metric: { metricId: "workforce.employment.started_verified_count.v1", metricVersion: 1, value: 12, reportingPeriodStart: "2026-01-01", reportingPeriodEnd: "2026-03-31", provenanceReference: "wave1-metric-provenance" },
    warning: { warningId: "wave1-warning", rule: "VERIFIED_DELIVERY_BELOW_TARGET", threshold: 15, provenance: "wave1-warning-provenance", plan: { monitoringType: "PERFORMANCE_REVIEW" } },
    finding: { findingType: "DELIVERY_VARIANCE", severity: "MEDIUM", materiality: "MATERIAL", description: "Verified delivery was below the approved target.", correctiveActionRequired: true, provenance: "wave1-finding-provenance" },
    correctiveAction: { requiredAction: "Submit corrective delivery plan", actionOwner: "wave1-provider", dueAt: "2026-04-30T00:00:00.000Z", requiredEvidence: ["wave1-evidence"], provenance: "wave1-action-provenance" },
    decision: { decisionType: "ACCEPT_CORRECTIVE_ACTION", authorityReference: "wave1-county-authorized-official", finalDisposition: { status: "CLOSED" }, provenance: "wave1-decision-provenance" },
    audit: { auditType: "ASSURANCE_PROOF_LOOP", authorityReference: "wave1-county-audit-authority", scope: { caseReference: "wave1-workforce-case" }, provenance: "wave1-audit-provenance" },
    publicReport: { reportId: "report.gpa.program_assurance_public_summary.v1", reportVersion: 1, publicSafe: true },
  });
  assert.equal(result.truth.truth_fact_id, "wave1-truth");
  assert.equal(result.correctiveAction.status, "COMPLETE");
  assert.equal(result.publicReport.status, "PUBLISHED");
  assert.deepEqual(dependencies.records.filter((x) => x.__type === "truth").map((x) => x.truth_fact_id), ["wave1-truth"]);
  assert.equal(dependencies.records.find((x) => x.__type === "warning").exceptions[0].warningId, "wave1-warning");
  assert.equal(dependencies.records.find((x) => x.__type === "decision").authorityReference, "wave1-county-authorized-official");
});

test("the proof loop cannot promote an unsuccessful verification", async () => {
  const dependencies = repo();
  dependencies.verification.determineVerification = async () => ({ status: "FAILED", achieved_level: "V0" });
  const service = new AssuranceProofLoopService(dependencies as any);
  await assert.rejects(() => service.execute({
    actor, caseReference: "wave1-failed-case", source: { sourceSystemId: "s", sourceRecordId: "r", sourceOwnerReference: "o", dataDomain: "FUNDING", recordType: "AWARD", provenance: "p" }, funding: { canonicalRecordType: "AWARD", canonicalRecordId: "a" }, programReference: "p", providerReference: "v", serviceReference: "s", claim: { claimantReference: "v", claimType: "SERVICE", assertedValue: 1, assertedUnit: "COUNT", provenance: "p" }, evidence: { evidenceId: "e", provenance: "p" }, verification: { methodId: "m", verifierReference: "reviewer", provenance: "p" }, metric: { metricId: "m", value: 1, provenanceReference: "p" }, warning: { warningId: "w", provenance: "p", plan: { monitoringType: "PERFORMANCE_REVIEW" } }, finding: { findingType: "x", provenance: "p" }, correctiveAction: { requiredAction: "x", actionOwner: "v", provenance: "p" }, decision: { decisionType: "x", authorityReference: "human", provenance: "p" }, audit: { auditType: "x", authorityReference: "human", provenance: "p" }, publicReport: {} }), /VERIFICATION_REQUIRED/);
  assert.equal(dependencies.records.some((x) => x.__type === "truth"), false);
});
