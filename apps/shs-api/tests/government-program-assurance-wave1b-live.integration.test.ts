import assert from "node:assert/strict";
import test from "node:test";
import { query, pool } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { AssuranceProofLoopService } from "../src/domain/government-assurance/service/assurance-proof-loop-service.js";
import { GovernmentAssuranceService } from "../src/domain/government-assurance/service/government-assurance-service.js";
import { ClaimVerificationService } from "../src/domain/government-assurance/service/claim-verification-service.js";
import { FundingLineageService } from "../src/domain/government-assurance/service/funding-lineage-service.js";
import { SourceScopeService } from "../src/domain/government-assurance/service/source-scope-service.js";
import { MetricTruthService } from "../src/domain/government-assurance/service/metric-truth-service.js";
import { MonitoringAuditService } from "../src/domain/government-assurance/service/monitoring-audit-service.js";
import { IntegrationOutboxRepo } from "../src/domain/trusted-reporting/outbox-repo.js";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.js";
import { PlatformMetricRegistryAdapter } from "../src/domain/government-assurance/adapters/metric-registry-boundary.js";
import { ReportPublicEligibilityService } from "../src/domain/reporting/report-public-eligibility-service.js";
import { ReportPublicDisclosureService } from "../src/domain/reporting/report-public-disclosure-service.js";
import { ReportPublicSnapshotService } from "../src/domain/reporting/report-public-snapshot-service.js";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.js";

const enabled = process.env.WAVE1B_LIVE === "1";
const org = "wave0d-org";
const tenant = "tenant:wave0d-org";
const user = "wave0e-user";
const caseReference = `wave1b-live-${Date.now()}`;
const reportId = "report.gpa.program_assurance_public_summary.v1";
const metricId = "workforce.employment.started_verified_count.v1";
const periodStart = "2026-01-01T00:00:00.000Z";
const periodEnd = "2026-03-31T23:59:59.999Z";

const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = {
  userId: user,
  organizationId: org,
  tenantId: tenant,
  permissions,
  actor_type: "user",
};

function publicActor() {
  return { ...actor, user_id: user, organization_id: org, tenant_id: tenant };
}

async function publicationFor(result: any) {
  const eligibilityService = new ReportPublicEligibilityService();
  const disclosureService = new ReportPublicDisclosureService();
  const snapshotService = new ReportPublicSnapshotService();
  const publicationService = new ReportPublicationService();
  const eligibility = await eligibilityService.createDecision({
    reportId,
    reportVersion: 1,
    decision: "PUBLIC_ELIGIBLE",
    reasonCode: "WAVE1B_ACCEPTANCE",
    policyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE",
  }, publicActor());
  const reviewContext = {
    canonical_count: 12,
    geography: "COUNTY",
    program_granularity: "NAMED_PROGRAM",
    reporting_period: "QUARTERLY",
    reporting_period_label: "2026 Q1",
    data_as_of: new Date().toISOString(),
    complementary_suppression_review: "PASS",
    reidentification_review: "PASS",
    rare_event_review: "PASS",
    reconstruction_review: "PASS",
    longitudinal_review: "PASS",
    combination_risk_review: "PASS",
  };
  const disclosure = await disclosureService.createDecision({
    reportId,
    reportVersion: 1,
    publicEligibilityDecisionId: eligibility.public_eligibility_decision_id,
    decision: "PUBLIC_DISCLOSURE_APPROVED",
    privacyPolicyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE",
    privacyPolicyVersion: "1",
    reasonCode: "WAVE1B_ACCEPTANCE",
    reviewContext,
  }, publicActor());
  const reportResult = {
    reportId,
    reportVersion: 1,
    metricId,
    metricVersion: 1,
    reportResultId: `workforce.employment.started_verified_count:v1:${periodStart}:${periodEnd}:${org}`,
    canonicalCount: 12,
    canonical_count: 12,
    periodStart,
    periodEnd,
    dataAsOf: new Date().toISOString(),
    reportingPeriod: "QUARTERLY",
    reportingPeriodLabel: "2026 Q1",
    geography: "COUNTY",
    programGranularity: "NAMED_PROGRAM",
    publicEligibility: true,
    publicPopulationEligible: true,
    public_eligibility: true,
    public_population_eligible: true,
  };
  const snapshotResult = await snapshotService.createSnapshot({
    reportResult,
    publicEligibilityDecisionId: eligibility.public_eligibility_decision_id,
    publicDisclosureDecisionId: disclosure.public_disclosure_decision_id,
    idempotencyKey: `${caseReference}:snapshot`,
  }, publicActor());
  const snapshot = snapshotResult.snapshot;
  const authorityId = "wave0d-release-authority-1";
  const releaseApprovalId = `${caseReference}:release-approval`;
  await query(
    `INSERT INTO report_publication_release_approvals
      (release_approval_id, public_snapshot_id, snapshot_version, snapshot_hash,
       tenant_id, organization_id, authority_id, approval_category, status,
       approved_by_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLIC_REPORTING_RELEASE_APPROVAL','APPROVED',$8)`,
    [releaseApprovalId, snapshot.public_snapshot_id, snapshot.version, snapshot.snapshot_hash, tenant, org, authorityId, user],
  );
  const authorizationResult = await publicationService.authorize({
    publicSnapshotId: snapshot.public_snapshot_id,
    snapshotVersion: snapshot.version,
    snapshotHash: snapshot.snapshot_hash,
    releaseApprovalReference: releaseApprovalId,
    institutionalAuthorityReference: authorityId,
    idempotencyKey: `${caseReference}:authorization`,
    purposeReference: caseReference,
  }, publicActor());
  return publicationService.publish({
    publicationAuthorizationId: authorizationResult.authorization.publication_authorization_id,
    publicSnapshotId: snapshot.public_snapshot_id,
    snapshotVersion: snapshot.version,
    snapshotHash: snapshot.snapshot_hash,
    idempotencyKey: `${caseReference}:publication`,
  }, publicActor());
}

test("Wave 1B live assurance proof loop crosses canonical authorities", { skip: !enabled }, async () => {
  const assurance = new GovernmentAssuranceService(undefined, new PlatformMetricRegistryAdapter());
  const claims = new ClaimVerificationService();
  const funding = new FundingLineageService();
  const sourceScope = new SourceScopeService();
  const metricTruth = new MetricTruthService(undefined, undefined, undefined, new IntegrationOutboxRepo(), new PlatformMetricRegistryAdapter());
  const oversight = new MonitoringAuditService();
  const verification = {
    createVerification: (a: any, input: any) => assurance.createVerification(a, input),
    startVerification: (a: any, id: string) => claims.startVerification(a, id),
    determineVerification: (a: any, id: string, input: any) => claims.determineVerification(a, id, input),
  };
  await assurance.createVerificationMethod(actor, {
    methodId: `${caseReference}:method`,
    methodType: "EVIDENCE_SOURCE_MATCH",
    description: "Wave 1B verified service completion evidence review",
    requiredEvidenceTypes: ["SERVICE_COMPLETION"],
    status: "ACTIVE",
    minimumEvidenceCount: 1,
    humanReviewRequired: true,
    ownerReference: "wave1b-independent-review-authority",
  });
  await sourceScope.createSourceSystem(actor, {
    sourceSystemId: `${caseReference}:grants`,
    canonicalName: "Wave 1B Acceptance Grants Source",
    sourceOwnerReference: `${caseReference}:county-finance`,
    environment: "TEST",
    systemType: "GRANTS",
    integrationMode: "JSON",
    dataDomains: ["FUNDING"],
    recordTypes: ["AWARD"],
    authorityRole: "SYSTEM_OF_RECORD",
    authorityPrecedence: 100,
    status: "ACTIVE",
    dataClassification: "INTERNAL",
    provenance: { caseReference },
  });
  const metric = (await assurance.listMetrics(actor)).find((candidate: any) => candidate.metricId === metricId && Number(candidate.version) === 1 && candidate.status === "ACTIVE");
  assert.ok(metric, "the live fixture must reuse the existing canonical GPA metric registration");
  const service = new AssuranceProofLoopService({
    assurance,
    funding,
    claims,
    verification,
    metrics: metricTruth,
    oversight,
    publicReport: async (_actor, input) => publicationFor(input),
  });
  const result = await service.execute({
    actor,
    caseReference,
    source: {
      sourceSystemId: `${caseReference}:grants`,
      sourceRecordId: `${caseReference}:award`,
      sourceOwnerReference: `${caseReference}:county-finance`,
      dataDomain: "FUNDING",
      recordType: "AWARD",
      jurisdiction: "WAVE1B_COUNTY",
      precedence: 100,
      status: "ACTIVE",
      conflictPolicyReference: "wave1b-source-precedence-v1",
      provenance: `${caseReference}:source-provenance`,
    },
    funding: {
      canonicalRecordType: "AWARD",
      canonicalRecordId: `${caseReference}:award`,
      amount: 100000,
      currency: "USD",
      programReference: `${caseReference}:program`,
      providerOrganizationReference: `${caseReference}:provider`,
      jurisdictionReference: "WAVE1B_COUNTY",
      periodStart,
      periodEnd,
      provenanceReference: `${caseReference}:funding-provenance`,
    },
    programReference: `${caseReference}:program`,
    providerReference: `${caseReference}:provider`,
    serviceReference: `${caseReference}:training-completion`,
    claim: {
      claimId: `${caseReference}:claim`,
      claimantReference: `${caseReference}:provider`,
      claimType: "SERVICE_DELIVERY",
      subjectType: "SERVICE",
      subjectReference: `${caseReference}:training-completion`,
      assertedValue: 12,
      assertedUnit: "COMPLETIONS",
      reportingPeriodStart: periodStart,
      reportingPeriodEnd: periodEnd,
      provenance: `${caseReference}:claim-provenance`,
    },
    evidence: {
      evidenceId: `${caseReference}:evidence`,
      evidenceAuthority: "PREPARE_PROVE_EVIDENCE",
      evidenceType: "SERVICE_COMPLETION",
      requirementReference: `${caseReference}:completion-rule`,
      provenance: `${caseReference}:evidence-provenance`,
      provenanceReference: `${caseReference}:evidence-provenance`,
      integrityVerified: true,
      provenanceComplete: true,
    },
    verification: {
      methodId: `${caseReference}:method`,
      methodVersion: 1,
      subjectType: "SERVICE",
      verifierReference: `${caseReference}:independent-reviewer`,
      reviewerReference: user,
      provenance: `${caseReference}:verification-provenance`,
    },
    metric: {
      metricId,
      metricVersion: 1,
      value: 12,
      reportingPeriodStart: periodStart,
      reportingPeriodEnd: periodEnd,
      programReference: `${caseReference}:program`,
      providerReference: `${caseReference}:provider`,
      provenanceReference: `${caseReference}:metric-provenance`,
    },
    warning: {
      warningId: `${caseReference}:warning`,
      rule: "VERIFIED_DELIVERY_BELOW_TARGET",
      threshold: 15,
      provenance: `${caseReference}:warning-provenance`,
      plan: { monitoringType: "PERFORMANCE_REVIEW" },
    },
    finding: {
      findingType: "DELIVERY_VARIANCE",
      severity: "MEDIUM",
      materiality: "MATERIAL",
      description: "Verified delivery was below the approved target.",
      correctiveActionRequired: true,
      provenance: `${caseReference}:finding-provenance`,
    },
    correctiveAction: {
      requiredAction: "Submit corrected delivery evidence",
      actionOwner: `${caseReference}:provider`,
      dueAt: "2026-04-30T00:00:00.000Z",
      requiredEvidence: [`${caseReference}:evidence`],
      provenance: `${caseReference}:action-provenance`,
    },
    decision: {
      decisionType: "ACCEPT_CORRECTIVE_ACTION",
      authorityReference: `${caseReference}:authorized-official`,
      finalDisposition: { status: "CLOSED" },
      provenance: `${caseReference}:decision-provenance`,
    },
    audit: {
      auditType: "ASSURANCE_PROOF_LOOP",
      authorityReference: `${caseReference}:audit-authority`,
      scope: { caseReference },
      provenance: `${caseReference}:audit-provenance`,
    },
    publicReport: {
      reportId,
      reportVersion: 1,
      publicSafe: true,
      metricReference: `${metric.metricId}:${metric.version}`,
    },
  });

  const determinationId = result.truth.provenance?.truthSpineHandoff?.determinationId;
  const outbox = await query("SELECT * FROM integration_outbox WHERE event_type='government_assurance.truth_determination.accepted' AND organization_id=$1 AND payload_json::jsonb->'payload'->>'determination_id'=$2 ORDER BY created_at DESC LIMIT 1", [org, determinationId]);
  assert.equal(outbox.rows.length, 1);
  const dispatched = await dispatchPendingIntegrationEvents({ workerId: `${caseReference}:worker`, limit: 10 });
  assert.equal(dispatched.some((item: any) => item.outbox_event_id === outbox.rows[0].outbox_event_id), true);
  const truth = await query("SELECT *, payload->>'subject_id' AS subject_id FROM truth_spine_records WHERE namespace='claims' AND payload->>'subject_id'=$1", [determinationId]);
  assert.equal(truth.rows.length, 1);
  assert.equal(truth.rows[0].organization_id, org);
  assert.equal(truth.rows[0].tenant_id, tenant);
  assert.equal(truth.rows[0].payload.evidence_ids.length, 1);
  const determination = await query("SELECT claim_reference, verification_reference, evidence_references FROM gpa_truth_determinations WHERE determination_id=$1 AND organization_id=$2 AND tenant_id=$3", [determinationId, org, tenant]);
  assert.equal(determination.rows.length, 1);
  assert.equal(determination.rows[0].claim_reference, `${caseReference}:claim`);
  assert.equal(result.correctiveAction.status, "COMPLETE");
  assert.equal(result.publicReport.publication.publication_status, "PUBLISHED");

  const unsignedResponse = await fetch(`http://127.0.0.1:${process.env.WAVE1B_AGENT_FABRIC_PORT || "8096"}/shf/internal/ingestion/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(outbox.rows[0].payload_json),
  });
  assert.equal(unsignedResponse.ok, false);

  await query("UPDATE integration_outbox SET delivery_status='PENDING', lease_owner=NULL, lease_expires_at=NULL, next_attempt_at=NOW() WHERE outbox_event_id=$1", [outbox.rows[0].outbox_event_id]);
  const replayed = await dispatchPendingIntegrationEvents({ workerId: `${caseReference}:replay-worker`, limit: 1 });
  assert.equal(replayed.some((item: any) => item.outbox_event_id === outbox.rows[0].outbox_event_id), true);

  const duplicate = await query("SELECT COUNT(*)::int AS count FROM truth_spine_records WHERE namespace='claims' AND payload->>'subject_id'=$1", [determinationId]);
  assert.equal(Number(duplicate.rows[0].count), 1);
  const response = await fetch(`http://127.0.0.1:${process.env.WAVE1B_API_PORT || "8097"}/government-assurance/public/summary?organization_id=${org}&tenant_id=${tenant}&report_id=${encodeURIComponent(reportId)}&report_version=1&jurisdiction=COUNTY`);
  assert.equal(response.status, 200);
  const envelope: any = await response.json();
  const body = envelope.data || envelope;
  assert.equal(body.availability, "PUBLISHED");
  assert.equal(body.items.some((item: any) => item.public_display_value === result.publicReport.projection.public_display_value && item.reporting_period_label === "2026 Q1"), true);
  assert.equal(JSON.stringify(body).includes(tenant), false);
  assert.equal(JSON.stringify(body).includes(user), false);
  assert.equal(JSON.stringify(body).includes(caseReference), false);
  assert.equal(metric.metricId, metricId);
  assert.equal(metric.version, 1);
});

test.after(async () => { await pool.end(); });
