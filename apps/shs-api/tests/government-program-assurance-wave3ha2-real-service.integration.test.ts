import assert from "node:assert/strict";
import test from "node:test";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { GovernmentAssuranceService } from "../src/domain/government-assurance/service/government-assurance-service.js";
import { ClaimVerificationService } from "../src/domain/government-assurance/service/claim-verification-service.js";
import { ReconciliationQualityService } from "../src/domain/government-assurance/service/reconciliation-quality-service.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";
import { AssuranceOutcomeRiskIntegrationService } from "../src/domain/government-assurance/service/assurance-outcome-risk-integration-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const organizationId = "wave0d-org";
const tenantId = `tenant:${organizationId}`;
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { userId: "wave0d-user", organizationId, tenantId, permissions, actor_type: "user" };
const reviewer = { ...actor, userId: "wave3ha2-reviewer" };

async function row(table: string, key: string, value: string) { return (await query(`SELECT * FROM ${table} WHERE ${key}=$1 AND organization_id=$2 AND tenant_id=$3`, [value, organizationId, tenantId])).rows[0] || null; }

test("Wave 3H-A2 real canonical services persist verification and reconciliation risk", { skip: !enabled }, async () => {
  const suffix = Date.now();
  const provider = `wave3ha2-provider-${suffix}`;
  const program = `wave3ha2-program-${suffix}`;
  const service = new GovernmentAssuranceService();
  const verification = new ClaimVerificationService();
  const reconciliation = new ReconciliationQualityService();
  const risk = new RiskService();
  const integration = new AssuranceOutcomeRiskIntegrationService(risk);
  const methodId = `wave3ha2-method-${suffix}`;
  const rule = await risk.createRule(actor, { ruleId: `wave3ha2-verification-risk-${suffix}`, version: 1, signalType: "VERIFICATION_FAILURE", threshold: 0, severity: "HIGH", materiality: "MATERIAL", provenance: { acceptance: "wave3ha2" } });
  const method = await service.createVerificationMethod(actor, { methodId, version: 1, methodType: "DOCUMENT_REVIEW", description: "Wave 3H-A2 canonical test method", status: "ACTIVE", minimumEvidenceCount: 1, humanReviewRequired: true, eligibleClaimTypes: ["SERVICE"], eligibleSubjectTypes: ["SERVICE"], provenance: { acceptance: "wave3ha2" } });

  const healthyClaimId = `wave3ha2-healthy-claim-${suffix}`;
  await service.createClaim(actor, { claimId: healthyClaimId, claimantReference: provider, programReference: program, claimType: "SERVICE", subjectType: "SERVICE", subjectReference: "training-completion", assertedValue: { units: 2, amount: 200 }, assertedUnit: "USD", reportingPeriodStart: "2026-01-01", reportingPeriodEnd: "2026-03-31" });
  const healthyEvidenceId = `wave3ha2-healthy-evidence-${suffix}`;
  await verification.linkEvidence(actor, healthyClaimId, { evidenceId: healthyEvidenceId, evidenceAuthority: "PREPARE_PROVE_EVIDENCE", provenance: { reference: healthyEvidenceId }, provenanceComplete: true, integrityVerified: true });
  const healthyVerification = await verification.requestVerification(actor, { claimId: healthyClaimId, methodId, methodVersion: 1, verifierReference: "wave3ha2-verifier", requestedLevel: "V0" });
  await verification.startVerification(actor, healthyVerification.verification_id);
  const healthyResult = await verification.determineVerification(actor, healthyVerification.verification_id, { reviewerReference: reviewer.userId, admissibleEvidenceIds: [healthyEvidenceId] });
  assert.equal(healthyResult.status, "PASSED");
  const healthyRisk = await integration.verificationOutcome(actor, { claimId: healthyClaimId, verificationId: healthyVerification.verification_id, outcome: "PASSED", evidenceState: "COMPLETE", providerReference: provider, programReference: program });
  assert.equal(healthyRisk.truthEligible, true);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM gpa_risk_signals WHERE organization_id=$1 AND tenant_id=$2 AND affected_references @> jsonb_build_array($3::text)", [organizationId, tenantId, healthyClaimId])).rows[0].count, 0);

  const failedClaimId = `wave3ha2-failed-claim-${suffix}`;
  await service.createClaim(actor, { claimId: failedClaimId, claimantReference: provider, programReference: program, claimType: "SERVICE", subjectType: "SERVICE", subjectReference: "apprenticeship-completion", assertedValue: { units: 10, amount: 50000 }, assertedUnit: "USD", reportingPeriodStart: "2026-01-01", reportingPeriodEnd: "2026-03-31" });
  const failedEvidenceId = `wave3ha2-failed-evidence-${suffix}`;
  await verification.linkEvidence(actor, failedClaimId, { evidenceId: failedEvidenceId, evidenceAuthority: "PREPARE_PROVE_EVIDENCE", provenance: { reference: failedEvidenceId }, provenanceComplete: true, integrityVerified: true });
  const failedVerification = await verification.requestVerification(actor, { claimId: failedClaimId, methodId, methodVersion: 1, verifierReference: "wave3ha2-verifier", requestedLevel: "V0" });
  await verification.startVerification(actor, failedVerification.verification_id);
  const failedResult = await verification.determineVerification(actor, failedVerification.verification_id, { outcome: "FAILED", rationale: "Required service completion could not be corroborated.", reviewerReference: reviewer.userId, admissibleEvidenceIds: [failedEvidenceId] });
  assert.equal(failedResult.status, "FAILED");
  const failedRisk = await integration.verificationOutcome(actor, { claimId: failedClaimId, verificationId: failedVerification.verification_id, outcome: "FAILED", evidenceState: "COMPLETE", ruleId: rule.rule_id, providerReference: provider, programReference: program, cycleReference: "wave3ha2-cycle-1", financialReference: `wave3ha2-obligation-${suffix}`, amountAtRisk: 50000, currency: "USD", evidenceReferences: [failedEvidenceId], provenance: { acceptance: "wave3ha2" } });
  assert.equal(failedRisk.truthEligible, false);
  assert.equal((await row("gpa_claims", "claim_id", failedClaimId)).status, "DRAFT");
  assert.equal((await row("gpa_verification_records", "verification_id", failedVerification.verification_id)).status, "FAILED");
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM gpa_truth_facts WHERE claim_id=$1 AND status='ACCEPTED'", [failedClaimId])).rows[0].count, 0);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM gpa_money_at_risk WHERE exposure_reference=$1 AND organization_id=$2 AND tenant_id=$3", [`wave3ha2-obligation-${suffix}`, organizationId, tenantId])).rows[0].count, 1);

  const reconClaimId = `wave3ha2-recon-claim-${suffix}`;
  await service.createClaim(actor, { claimId: reconClaimId, claimantReference: provider, programReference: program, claimType: "SERVICE", subjectType: "SERVICE", subjectReference: "training-completion", assertedValue: { units: 10, amount: 50000 }, assertedUnit: "USD" });
  const reconEvidenceId = `wave3ha2-recon-evidence-${suffix}`;
  await verification.linkEvidence(actor, reconClaimId, { evidenceId: reconEvidenceId, evidenceAuthority: "PREPARE_PROVE_EVIDENCE", provenance: { reference: reconEvidenceId }, provenanceComplete: true, integrityVerified: true });
  const reconVerification = await verification.requestVerification(actor, { claimId: reconClaimId, methodId, methodVersion: 1, verifierReference: "wave3ha2-verifier", requestedLevel: "V0" });
  await verification.startVerification(actor, reconVerification.verification_id);
  const reconVerificationResult = await verification.determineVerification(actor, reconVerification.verification_id, { reviewerReference: reviewer.userId, admissibleEvidenceIds: [reconEvidenceId] });
  assert.equal(reconVerificationResult.status, "PASSED");
  const recon = await reconciliation.createCase(actor, { reconciliationCaseId: `wave3ha2-reconciliation-${suffix}`, subjectType: "CLAIM", subjectReference: reconClaimId, competingSourceReferences: [`wave3ha2-observation-a-${suffix}`, `wave3ha2-observation-b-${suffix}`], competingClaimReferences: [reconClaimId], conflictReason: "Source A and source B report materially different delivered units.", conflictType: "VALUE_MISMATCH", materiality: "MATERIAL", severity: "HIGH", provenance: { acceptance: "wave3ha2" } });
  const open = await integration.reconciliationOutcome(actor, { reconciliationCaseId: recon.reconciliation_case_id, claimId: reconClaimId, status: "OPEN", ruleId: rule.rule_id, providerReference: provider, programReference: program, cycleReference: "wave3ha2-cycle-1", financialReference: `wave3ha2-obligation-${suffix}`, amountAtRisk: 50000, currency: "USD", provenance: { acceptance: "wave3ha2" } });
  assert.equal(open.affectedResultBlocked, true);
  assert.equal(open.truthEligible, false);
  const beforeTruth = await query("SELECT COUNT(*)::int AS count FROM gpa_truth_facts WHERE claim_id=$1 AND status='ACCEPTED'", [reconClaimId]);
  assert.equal(beforeTruth.rows[0].count, 0);
  await assert.rejects(
    () => service.determineTruthFact(actor, { claimId: reconClaimId, verificationId: reconVerification.verification_id, reconciliationCaseId: recon.reconciliation_case_id, factType: "SERVICE_DELIVERY", subjectType: "claim", subjectReference: reconClaimId, factValue: { delivered: true }, provenance: { acceptance: "wave3ha2-before-resolution" } }),
    /GPA_RECONCILIATION_UNRESOLVED/,
  );
  const resolved = await reconciliation.determineCase(reviewer, recon.reconciliation_case_id, { status: "RESOLVED", reviewerReference: actor.userId, authorityReference: "wave3ha2-authority", determination: { outcome: "SOURCE_B_ACCEPTED" }, rationale: "Source B matched the authoritative service ledger.", resolutionMethod: "HUMAN_REVIEW", provenance: { acceptance: "wave3ha2" } });
  assert.equal(resolved.status, "RESOLVED");
  const after = await integration.reconciliationOutcome(actor, { reconciliationCaseId: recon.reconciliation_case_id, claimId: reconClaimId, status: "RESOLVED", providerReference: provider, programReference: program, cycleReference: "wave3ha2-cycle-1", financialReference: `wave3ha2-obligation-${suffix}`, amountAtRisk: 50000, currency: "USD", provenance: { acceptance: "wave3ha2" } });
  assert.equal(after.affectedResultBlocked, false);
  assert.equal(after.truthEligible, true);
  const truth = await service.determineTruthFact(actor, { claimId: reconClaimId, verificationId: reconVerification.verification_id, reconciliationCaseId: recon.reconciliation_case_id, factType: "SERVICE_DELIVERY", subjectType: "claim", subjectReference: reconClaimId, factValue: { delivered: true }, provenance: { acceptance: "wave3ha2-after-resolution" } });
  assert.equal(truth.status, "ACCEPTED");
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM gpa_truth_facts WHERE claim_id=$1 AND status='ACCEPTED'", [reconClaimId])).rows[0].count, 1);
  const exposureCount = await query("SELECT COUNT(*)::int AS count, MAX(jsonb_array_length(signal_references))::int AS signals FROM gpa_money_at_risk WHERE exposure_reference=$1 AND organization_id=$2 AND tenant_id=$3", [`wave3ha2-obligation-${suffix}`, organizationId, tenantId]);
  assert.equal(exposureCount.rows[0].count, 1);
  assert.equal(exposureCount.rows[0].signals >= 2, true);
});
