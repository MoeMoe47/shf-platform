import assert from "node:assert/strict";
import test from "node:test";
import { query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { GovernmentAssuranceService } from "../src/domain/government-assurance/service/government-assurance-service.js";
import { ClaimVerificationService } from "../src/domain/government-assurance/service/claim-verification-service.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";
import { AssuranceOutcomeRiskIntegrationService } from "../src/domain/government-assurance/service/assurance-outcome-risk-integration-service.js";
import { AssuranceRiskWorkflowService } from "../src/domain/government-assurance/service/assurance-risk-workflow-service.js";
import { MonitoringAuditService } from "../src/domain/government-assurance/service/monitoring-audit-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const organizationId = "wave0d-org";
const tenantId = `tenant:${organizationId}`;
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { userId: "wave0d-user", organizationId, tenantId, permissions, actor_type: "user" };
const reviewer = { ...actor, userId: "wave3hb-reviewer" };

async function claimWithFailedVerification(service: GovernmentAssuranceService, verification: ClaimVerificationService, methodId: string, provider: string, program: string, claimId: string, evidenceId: string) {
  await service.createClaim(actor, { claimId, claimantReference: provider, programReference: program, claimType: "SERVICE", subjectType: "SERVICE", subjectReference: claimId, assertedValue: { units: 4, amount: 4000 }, assertedUnit: "USD", reportingPeriodStart: "2026-01-01", reportingPeriodEnd: "2026-03-31" });
  await verification.linkEvidence(actor, claimId, { evidenceId, evidenceAuthority: "PREPARE_PROVE_EVIDENCE", provenance: { acceptance: "wave3hb" }, provenanceComplete: true, integrityVerified: true });
  const requested = await verification.requestVerification(actor, { claimId, methodId, methodVersion: 1, verifierReference: "wave3hb-verifier", requestedLevel: "V0" });
  await verification.startVerification(actor, requested.verification_id);
  const result = await verification.determineVerification(actor, requested.verification_id, { outcome: "FAILED", rationale: "Required service evidence did not substantiate the claim.", reviewerReference: reviewer.userId, admissibleEvidenceIds: [evidenceId] });
  return { claimId, evidenceId, verificationId: requested.verification_id, result };
}

test("Wave 3H-B live finding, CAP, retest, remediation, and resolution lifecycle", { skip: !enabled }, async () => {
  const suffix = Date.now();
  const program = `wave3hb-program-${suffix}`;
  await query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$3,$4,'ACTIVE','LOCAL_TEST') ON CONFLICT (user_id) DO NOTHING", [reviewer.userId, organizationId, `${reviewer.userId}@test.invalid`, "Wave 3H-B Reviewer"]);
  const risk = new RiskService();
  const service = new GovernmentAssuranceService();
  const verification = new ClaimVerificationService();
  const integration = new AssuranceOutcomeRiskIntegrationService(risk);
  const workflow = new AssuranceRiskWorkflowService(risk, new MonitoringAuditService());
  const method = await service.createVerificationMethod(actor, { methodId: `wave3hb-method-${suffix}`, version: 1, methodType: "DOCUMENT_REVIEW", description: "Wave 3H-B method", status: "ACTIVE", minimumEvidenceCount: 1, humanReviewRequired: true, provenance: { acceptance: "wave3hb" } });
  const rule = await risk.createRule(actor, { ruleId: `wave3hb-rule-${suffix}`, version: 1, signalType: "VERIFICATION_FAILURE", threshold: 0, severity: "HIGH", materiality: "MATERIAL", provenance: { acceptance: "wave3hb" } });

  const resolvedCase = await claimWithFailedVerification(service, verification, method.methodId, "wave3hb-nonprofit-provider", program, `wave3hb-resolve-claim-${suffix}`, `wave3hb-resolve-evidence-${suffix}`);
  const resolvedRisk = await integration.verificationOutcome(actor, { ...resolvedCase, outcome: "FAILED", evidenceState: "INCOMPLETE", ruleId: rule.rule_id, providerReference: "wave3hb-nonprofit-provider", programReference: program, cycleReference: "wave3hb-cycle-1", financialReference: `wave3hb-resolve-obligation-${suffix}`, amountAtRisk: 4000, currency: "USD", provenance: { acceptance: "wave3hb" } });
  const resolvedSignalId = resolvedRisk.risk.signal.signal_id;
  await workflow.transitionWarning(reviewer, resolvedSignalId, { status: "UNDER_REVIEW", rationale: "Human reviewer assessed the evidence gap." });
  const resolvedSignal = await workflow.transitionWarning(reviewer, resolvedSignalId, { status: "RESOLVED", rationale: "Additional non-financial context removed the need for a finding." });
  assert.equal(resolvedSignal.status, "RESOLVED");
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM gpa_findings WHERE organization_id=$1 AND tenant_id=$2 AND monitoring_reference=$3", [organizationId, tenantId, resolvedSignalId])).rows[0].count, 0);

  const findingCase = await claimWithFailedVerification(service, verification, method.methodId, "wave3hb-for-profit-provider", program, `wave3hb-finding-claim-${suffix}`, `wave3hb-finding-evidence-${suffix}`);
  const findingRisk = await integration.verificationOutcome(actor, { ...findingCase, outcome: "FAILED", evidenceState: "INCOMPLETE", ruleId: rule.rule_id, providerReference: "wave3hb-for-profit-provider", programReference: program, cycleReference: "wave3hb-cycle-1", financialReference: `wave3hb-finding-obligation-${suffix}`, amountAtRisk: 4000, currency: "USD", provenance: { acceptance: "wave3hb" } });
  const signalId = findingRisk.risk.signal.signal_id;
  await workflow.transitionWarning(reviewer, signalId, { status: "UNDER_REVIEW", rationale: "Human review opened the evidence-backed case." });
  const escalated = await workflow.escalateToFinding(reviewer, signalId, { findingId: `wave3hb-finding-${suffix}`, findingType: "EVIDENCE_DEFICIENCY", description: "Failed verification remained unsupported after review.", evidenceReferences: [findingCase.evidenceId], verificationReferences: [findingCase.verificationId], severity: "HIGH", materiality: "MATERIAL", correctiveActionRequired: true, provenance: { acceptance: "wave3hb" } });
  assert.equal(escalated.finding.finding_id, `wave3hb-finding-${suffix}`);
  const action = await workflow.createCorrectiveAction(reviewer, { correctiveActionId: `wave3hb-action-${suffix}`, findingId: escalated.finding.finding_id, providerReference: "wave3hb-for-profit-provider", programReference: program, actionOwner: "wave3hb-accountable-human", accountableOwner: "wave3hb-accountable-human", requiredAction: "Reperform service verification and submit admissible completion evidence.", dueAt: new Date(Date.now() - 60_000), requiredEvidence: ["completion-evidence"], retestCriteria: { outcome: "VERIFIED", evidenceCount: 1 }, escalationCondition: "DUE_DATE_PASSED", provenance: { acceptance: "wave3hb" } });
  assert.equal(action.status, "REQUIRED");
  const overdue = await risk.evaluateOverdueAction(reviewer, { correctiveActionId: action.corrective_action_id, ruleId: rule.rule_id, ruleVersion: 1, cycleReference: "wave3hb-cycle-1", providerReference: "wave3hb-for-profit-provider", programReference: program, provenance: { acceptance: "wave3hb" } });
  assert.equal(overdue.overdue, true);
  assert.equal(overdue.status, "OVERDUE");
  assert.equal(overdue.escalationRecommendation, "RECOMMENDATION_PENDING_HUMAN_REVIEW");
  const failedRetest = await workflow.recordRetest(reviewer, { correctiveActionId: action.corrective_action_id, findingId: escalated.finding.finding_id, signalId, result: "FAIL", evidenceReferences: [`wave3hb-remediation-failed-${suffix}`], provenance: { acceptance: "wave3hb" } });
  assert.equal(failedRetest.status, "RETEST_PENDING");
  assert.equal((await query("SELECT status FROM gpa_corrective_actions WHERE corrective_action_id=$1", [action.corrective_action_id])).rows[0].status, "RETEST_PENDING");
  assert.equal((await query("SELECT status FROM gpa_findings WHERE finding_id=$1", [escalated.finding.finding_id])).rows[0].status, "REMEDIATION_IN_PROGRESS");
  await assert.rejects(() => workflow.closeRemediation(reviewer, { correctiveActionId: action.corrective_action_id, findingId: escalated.finding.finding_id, signalId, exposureReference: `wave3hb-finding-obligation-${suffix}`, amountAtRisk: 4000, currency: "USD", decisionReference: `wave3hb-premature-decision-${suffix}`, rationale: "Cannot close before a passing retest." }), /GPA_REMEDIATION_RETEST_REQUIRED/);
  const passedRetest = await workflow.recordRetest(reviewer, { correctiveActionId: action.corrective_action_id, findingId: escalated.finding.finding_id, signalId, result: "PASS", evidenceReferences: [`wave3hb-remediation-pass-${suffix}`], provenance: { acceptance: "wave3hb" } });
  assert.equal(passedRetest.status, "COMPLETE");
  assert.equal((await query("SELECT status FROM gpa_corrective_actions WHERE corrective_action_id=$1", [action.corrective_action_id])).rows[0].status, "COMPLETE");
  const closed = await workflow.closeRemediation(reviewer, { correctiveActionId: action.corrective_action_id, findingId: escalated.finding.finding_id, signalId, exposureReference: `wave3hb-finding-obligation-${suffix}`, amountAtRisk: 4000, currency: "USD", decisionReference: `wave3hb-closure-decision-${suffix}`, authorityReference: "wave3hb-closure-authority", evidenceReferences: [`wave3hb-remediation-pass-${suffix}`], rationale: "Independent human reviewer accepted the remediation evidence and passing retest.", provenance: { acceptance: "wave3hb" } });
  assert.equal(closed.correctiveAction.status, "CLOSED");
  assert.equal((await query("SELECT status FROM gpa_findings WHERE finding_id=$1", [escalated.finding.finding_id])).rows[0].status, "RESOLVED");
  assert.equal((await query("SELECT status FROM gpa_risk_signals WHERE signal_id=$1", [signalId])).rows[0].status, "RESOLVED");
  assert.equal((await query("SELECT status FROM gpa_money_at_risk WHERE exposure_reference=$1", [`wave3hb-finding-obligation-${suffix}`])).rows[0].status, "RESOLVED");
  assert.ok((await query("SELECT COUNT(*)::int AS count FROM audit_events WHERE organization_id=$1 AND target_object_id=$2", [organizationId, action.corrective_action_id])).rows[0].count >= 3);
  assert.equal(closed.decision.actor_reference, reviewer.userId);
});
