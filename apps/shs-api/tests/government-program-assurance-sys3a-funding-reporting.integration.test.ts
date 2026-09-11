import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { before, after, test } from "node:test";
import { query, pool } from "../src/db/client.js";
import { FundingGrantService } from "../src/domain/funding-grants/service/funding-grant-service.js";
import { FundingLineageService } from "../src/domain/government-assurance/service/funding-lineage-service.js";
import { GovernmentAssuranceService } from "../src/domain/government-assurance/service/government-assurance-service.js";
import { ClaimVerificationService } from "../src/domain/government-assurance/service/claim-verification-service.js";
import { MetricTruthService } from "../src/domain/government-assurance/service/metric-truth-service.js";
import { ReconciliationQualityService } from "../src/domain/government-assurance/service/reconciliation-quality-service.js";
import { RiskService } from "../src/domain/government-assurance/service/risk-service.js";
import { ReportDraftService } from "../src/domain/reporting/report-draft-service.js";
import { ReportArtifactService } from "../src/domain/reporting/report-artifact-service.js";
import { createSourceAsset, downloadSourceAsset } from "../src/domain/source-ingestion/service/source-service.js";
import { LocalPrivateSourceStorage } from "../src/domain/source-ingestion/storage/source-storage.js";

const run = `sys3a-${Date.now()}-${randomUUID().slice(0, 8)}`;
const org = `org_${run}`;
const funder = `org_${run}_funder`;
const user = `user_${run}`;
const program = `program_${run}`;
const provider = `provider_${run}`;
const actor = {
  user_id: user, organization_id: org, active_organization_id: org, tenant_id: `tenant:${org}`,
  permissions: [
    "funding.grant.view", "funding.grant.manage", "government.assurance.claim.manage",
    "government.assurance.claim.submit", "government.assurance.claim.view",
    "government.assurance.evidence.link", "government.assurance.verification.manage",
    "government.assurance.verification.review", "government.assurance.verification.request",
    "government.assurance.verification.perform", "government.assurance.monitoring.manage",
    "government.assurance.monitoring.view", "government.assurance.metric.manage",
    "government.assurance.metric.calculate", "government.assurance.truth.determine",
    "government.assurance.reconciliation.manage", "government.assurance.reconciliation.determine",
    "government.assurance.funding.link", "government.assurance.funding.view",
    "government.assurance.financial_lineage.view", "reports.export",
  ],
};
const assurance = new GovernmentAssuranceService();
const claims = new ClaimVerificationService();
const metrics = new MetricTruthService();
const reconciliation = new ReconciliationQualityService();
const risk = new RiskService();
const funding = new FundingGrantService();
const lineage = new FundingLineageService();
const drafts = new ReportDraftService();
const artifacts = new ReportArtifactService();

async function row(sql: string, values: unknown[] = []) { return (await query(sql, values)).rows[0]; }

before(async () => {
  if (process.env.WAVE3_LIVE !== "1") return;
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
    VALUES ($1,$2,$2,'NONPROFIT','active',$3),($4,'SYS3A Funder','SYS3A Funder','FOUNDATION','active',$5)
    ON CONFLICT DO NOTHING`, [org, `SYS3A ${run}`, `${run}.example.org`, funder, `${run}.funder.invalid`]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1,$2,$3,'SYS3A Operator','active','test') ON CONFLICT DO NOTHING`, [user, org, `${user}@test.invalid`]);
  await query(`INSERT INTO programs (program_id, organization_id, name, program_type, status, created_by_user_id,
    program_classification, owner_organization_id, operator_organization_id, accountable_organization_id)
    VALUES ($1,$2,$3,'service','active',$4,'INDEPENDENT_NETWORK',$2,$2,$2) ON CONFLICT DO NOTHING`, [program, org, `SYS3A Program ${run}`, user]);
});

after(async () => { await pool.end(); });

test("SYS-3A persists funding, lineage, evidence, verification, risk, metric, source, and report handoffs", async (t) => {
  if (process.env.WAVE3_LIVE !== "1") { t.skip("WAVE3_LIVE=1 required"); return; }

  const grant = await funding.createGrant({ title: `SYS3A Award ${run}`, funderOrganizationId: funder, recipientOrganizationId: org, reportingOrganizationId: org, awardAmount: "1200.00", startDate: "2026-01-01", endDate: "2026-12-31", restrictionType: "UNRESTRICTED" }, actor);
  const allocated = await funding.createAllocation(grant.grant_id, { programId: program, allocatedAmount: "1200.00", purpose: "SYS3A service delivery" }, actor);
  assert.equal(String(allocated.allocated_amount), "1200.00");
  const fundingRef = await lineage.createReference(actor, { canonicalRecordType: "AWARD", canonicalRecordId: grant.grant_id, recipientOrganizationReference: org, programReference: program, amount: 1200, currency: "USD", sourceSystemId: "sys3a-funder", sourceRecordId: grant.grant_id, provenanceReference: `prov:${grant.grant_id}` });
  await lineage.link(actor, { fromType: "AWARD", fromReference: fundingRef.funding_reference_id, toType: "PROGRAM", toReference: program, relationshipType: "ALLOCATED", amount: 1200, currency: "USD", allocationMethodReference: "grant-allocation", sourceSystemId: "sys3a-funder", sourceRecordId: allocated.allocation_id, provenanceReference: `prov:${allocated.allocation_id}` });

  const method = await assurance.createVerificationMethod(actor, { methodId: `method_${run}`, version: 1, methodType: "DOCUMENT_REVIEW", description: "SYS3A evidence review", status: "ACTIVE", minimumEvidenceCount: 1, humanReviewRequired: true, ownerReference: org });
  const rule = await risk.createRule(actor, { ruleId: `rule_${run}`, signalType: "VERIFICATION_FAILURE", threshold: 0, severity: "HIGH", materiality: "MATERIAL", provenance: { source: "sys3a" } });
  const sourceBytes = Buffer.from("verified SYS3A service evidence");
  const source = await createSourceAsset({ user_id: user, organization_id: org, tenant_id: `tenant:${org}` }, { originalname: `${run}.txt`, mimetype: "text/plain", size: sourceBytes.length, buffer: sourceBytes }, { user: { user_id: user, organization_id: org }, headers: { "idempotency-key": `source-${run}` } }, new LocalPrivateSourceStorage(`/tmp/${run}-source`));
  assert.equal(source.replayed, false);
  const downloaded = await downloadSourceAsset({ user_id: user, organization_id: org, tenant_id: `tenant:${org}` }, source.asset.source_asset_id, new LocalPrivateSourceStorage(`/tmp/${run}-source`));
  assert.equal(downloaded?.content.toString(), sourceBytes.toString());

  const healthyClaim = await assurance.createClaim(actor, { claimId: `claim_${run}_healthy`, claimantReference: provider, programReference: program, claimType: "SERVICE_DELIVERY", subjectType: "SERVICE", subjectReference: `service_${run}`, assertedValue: 1, assertedUnit: "DELIVERY" });
  await claims.linkEvidence(actor, healthyClaim.claimId, { evidenceId: source.asset.source_asset_id, provenanceReference: `source:${run}:healthy`, integrityVerified: true });
  const healthyVerification = await claims.requestVerification(actor, { claimId: healthyClaim.claimId, methodId: method.methodId, methodVersion: 1, verifierReference: `verifier_${run}` });
  const healthyResult = await claims.determineVerification(actor, healthyVerification.verification_id, { reviewerReference: `reviewer_${run}`, outcome: "PASSED", admissibleEvidenceIds: [source.asset.source_asset_id], authoritativeEvidence: true, rationale: "Admissible evidence supports service delivery." });
  assert.equal(healthyResult.status, "PASSED");
  assert.equal((await row("SELECT COUNT(*)::int AS count FROM gpa_risk_signals WHERE organization_id=$1 AND tenant_id=$2 AND provenance->>'claimId'=$3", [org, `tenant:${org}`, healthyClaim.claimId])).count, 0);
  assert.equal((await row("SELECT COUNT(*)::int AS count FROM gpa_money_at_risk WHERE organization_id=$1 AND tenant_id=$2 AND claim_references @> jsonb_build_array($3::text)", [org, `tenant:${org}`, healthyClaim.claimId])).count, 0);

  const failedClaim = await assurance.createClaim(actor, { claimId: `claim_${run}_failed`, claimantReference: provider, programReference: program, claimType: "SERVICE_DELIVERY", subjectType: "SERVICE", subjectReference: `service_${run}_failed`, assertedValue: 1, assertedUnit: "DELIVERY" });
  const failedVerification = await assurance.createVerification(actor, { verificationId: `verification_${run}_failed`, claimId: failedClaim.claimId, subjectType: "SERVICE", subjectReference: `service_${run}_failed`, methodId: method.methodId, verifierReference: `verifier_failed_${run}` });
  const failedResult = await claims.determineVerification(actor, failedVerification.verificationId, { reviewerReference: `reviewer_${run}`, outcome: "FAILED", rationale: "Required evidence was not admissible." });
  const outcomeRisk = new (await import("../src/domain/government-assurance/service/assurance-outcome-risk-integration-service.js")).AssuranceOutcomeRiskIntegrationService(risk);
  const failedRisk = await outcomeRisk.verificationOutcome(actor, { claimId: failedClaim.claimId, verificationId: failedResult.verification_id, outcome: "FAILED", evidenceState: "INCOMPLETE", ruleId: rule.rule_id, ruleVersion: 1, value: 1, providerReference: provider, programReference: program, financialReference: fundingRef.funding_reference_id, amountAtRisk: 1200, amountBasis: 1200, currency: "USD", provenance: { fundingReference: fundingRef.funding_reference_id } });
  assert.equal(failedRisk.truthEligible, false);
  assert.ok(failedRisk.risk.signal.signal_id);
  assert.ok(failedRisk.exposure.exposure_id);
  assert.equal((await row("SELECT COUNT(*)::int AS count FROM gpa_truth_facts WHERE organization_id=$1 AND tenant_id=$2 AND (claim_id=$3 OR verification_id=$4) AND status='ACCEPTED'", [org, `tenant:${org}`, failedClaim.claimId, failedResult.verification_id])).count, 0);
  assert.equal((await row("SELECT COUNT(*)::int AS count FROM gpa_money_at_risk WHERE organization_id=$1 AND tenant_id=$2 AND exposure_reference=$3", [org, `tenant:${org}`, fundingRef.funding_reference_id])).count, 1);

  const reconciliationCase = await reconciliation.createCase(actor, { reconciliationCaseId: `recon_${run}`, subjectType: "CLAIM", subjectReference: failedClaim.claimId, competingClaimReferences: [failedClaim.claimId], competingSourceReferences: ["source-a", "source-b"], conflictingRecordReferences: ["source-a", "source-b"], conflictReason: "Conflicting source observations", conflictType: "VALUE_MISMATCH", severity: "HIGH", materiality: "MATERIAL", provenance: { source: "sys3a" } });
  const openRisk = await outcomeRisk.reconciliationOutcome(actor, { reconciliationCaseId: reconciliationCase.reconciliation_case_id, claimId: failedClaim.claimId, status: "OPEN", ruleId: rule.rule_id, ruleVersion: 1, value: 1, providerReference: provider, programReference: program, financialReference: fundingRef.funding_reference_id, amountAtRisk: 1200, amountBasis: 1200, currency: "USD", provenance: { fundingReference: fundingRef.funding_reference_id } });
  assert.equal(openRisk.affectedResultBlocked, true);
  assert.ok(openRisk.risk.signal.signal_id);
  assert.equal((await row("SELECT COUNT(*)::int AS count FROM gpa_money_at_risk WHERE organization_id=$1 AND tenant_id=$2 AND exposure_reference=$3", [org, `tenant:${org}`, fundingRef.funding_reference_id])).count, 1);
  const resolved = await reconciliation.determineCase(actor, reconciliationCase.reconciliation_case_id, { status: "RESOLVED", reviewerReference: `human_${run}`, authorityReference: "reconciliation-review-authority", determination: "Source precedence established", rationale: "The authoritative source was confirmed.", resolutionMethod: "SOURCE_PRECEDENCE", provenance: { resolvedBy: `human_${run}` } });
  assert.equal(resolved.status, "RESOLVED");

  const metric = await metrics.createMetric(actor, { metricId: `metric_${run}`, version: 1, programReference: program, canonicalName: `SYS3A Metric ${run}`, definition: "verified service deliveries", unitValueType: "COUNT", metricType: "COUNT", minimumVerificationLevel: "V2", authorityOwnerReference: org, status: "ACTIVE" });
  const metricResult = await metrics.calculate(actor, { metricId: metric.metric_id, metricVersion: 1, programReference: program, providerReference: provider, inputs: [{ claimId: healthyClaim.claimId, verificationId: healthyVerification.verification_id, value: 1, verificationLevel: "V2", provenanceReference: `source:${run}:healthy`, sourceAuthorityReference: org }] });
  const truth = await metrics.determineTruth(actor, { metricResultId: metricResult.metric_result_id, reason: "Human-reviewed verified service evidence" });
  assert.equal(truth.status, "ACCEPTED");

  const draft = await drafts.createDraft({ reportType: "SYS3A_FUNDING_ASSURANCE", subjectType: "PROGRAM", subjectName: program }, actor);
  const artifact = await artifacts.createArtifact({ compositionType: "SYS3A_FUNDING_ASSURANCE", compositionVersion: 1, classification: "INTERNAL", canonicalInputManifest: { reports: [{ report_id: draft.report_id, report_version: draft.version }] } }, actor);
  assert.ok(artifact.artifact_id);
  const counts = await row("SELECT (SELECT COUNT(*) FROM gpa_funding_references WHERE organization_id=$1) AS funding_refs, (SELECT COUNT(*) FROM gpa_funding_lineage_edges WHERE organization_id=$1) AS lineage_edges, (SELECT COUNT(*) FROM gpa_metric_results WHERE organization_id=$1) AS metric_results, (SELECT COUNT(*) FROM gpa_truth_facts WHERE organization_id=$1 AND status='ACCEPTED') AS accepted_truth, (SELECT COUNT(*) FROM report_drafts WHERE organization_id=$1) AS drafts", [org]);
  assert.equal(Number(counts.funding_refs), 1); assert.equal(Number(counts.lineage_edges), 1); assert.equal(Number(counts.metric_results), 1); assert.equal(Number(counts.accepted_truth), 1); assert.equal(Number(counts.drafts), 1);
});
