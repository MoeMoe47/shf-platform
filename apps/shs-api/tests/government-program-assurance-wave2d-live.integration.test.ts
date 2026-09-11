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
import { AssuranceCycleService } from "../src/domain/government-assurance/service/assurance-cycle-service.js";
import { ReportPublicEligibilityService } from "../src/domain/reporting/report-public-eligibility-service.js";
import { ReportPublicDisclosureService } from "../src/domain/reporting/report-public-disclosure-service.js";
import { ReportPublicSnapshotService } from "../src/domain/reporting/report-public-snapshot-service.js";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.js";

const enabled = process.env.WAVE2D_LIVE === "1";
// The acceptance database has one canonical organization.  Use it rather than
// bypassing organization onboarding with a direct master-record insert.
const org = "wave0d-org";
const tenant = "tenant:wave0d-org";
const user = "wave0d-user";
const metricId = "workforce.employment.started_verified_count.v1";
const reportId = "report.gpa.program_assurance_public_summary.v1";
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { userId: user, organizationId: org, tenantId: tenant, permissions, actor_type: "user" };
const q1 = { start: "2026-01-01T00:00:00.000Z", end: "2026-03-31T23:59:59.999Z", label: "2026 Q1" };
const q2 = { start: "2026-04-01T00:00:00.000Z", end: "2026-06-30T23:59:59.999Z", label: "2026 Q2" };

async function publish(input: any) {
  const publicActor = { ...actor, user_id: user, organization_id: org, tenant_id: tenant };
  const eligibility = await new ReportPublicEligibilityService().createDecision({ reportId, reportVersion: 1, decision: "PUBLIC_ELIGIBLE", reasonCode: "WAVE2D_ACCEPTANCE", policyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE" }, publicActor);
  const disclosure = await new ReportPublicDisclosureService().createDecision({ reportId, reportVersion: 1, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, decision: "PUBLIC_DISCLOSURE_APPROVED", privacyPolicyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE", privacyPolicyVersion: "1", reasonCode: "WAVE2D_ACCEPTANCE", reviewContext: { canonical_count: 20, geography: "COUNTY", program_granularity: "NAMED_PROGRAM", reporting_period: "QUARTERLY", reporting_period_label: input.periodLabel, data_as_of: new Date().toISOString(), complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" } }, publicActor);
  const publicStart = String(input.periodStart).slice(0, 10);
  const publicEnd = String(input.periodEnd).slice(0, 10);
  const snapshot = await new ReportPublicSnapshotService().createSnapshot({ reportResult: { reportId, reportVersion: 1, metricId, metricVersion: 1, reportResultId: `workforce.employment.started_verified_count:v1:${publicStart}:${publicEnd}:${org}`, canonicalCount: 20, canonical_count: 20, periodStart: publicStart, periodEnd: publicEnd, dataAsOf: new Date().toISOString(), reportingPeriod: "QUARTERLY", reportingPeriodLabel: input.periodLabel, geography: "COUNTY", programGranularity: "NAMED_PROGRAM", publicEligibility: true, publicPopulationEligible: true, public_eligibility: true, public_population_eligible: true }, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, publicDisclosureDecisionId: disclosure.public_disclosure_decision_id, idempotencyKey: `${input.caseReference}:snapshot` }, publicActor);
  const releaseId = `${input.caseReference}:release`;
  const authorityId = "wave0d-release-authority-1";
  await query(`INSERT INTO report_publication_release_approvals (release_approval_id, public_snapshot_id, snapshot_version, snapshot_hash, tenant_id, organization_id, authority_id, approval_category, status, approved_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLIC_REPORTING_RELEASE_APPROVAL','APPROVED',$8)`, [releaseId, snapshot.snapshot.public_snapshot_id, snapshot.snapshot.version, snapshot.snapshot.snapshot_hash, tenant, org, authorityId, user]);
  const publication = new ReportPublicationService();
  const authorization = await publication.authorize({ publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, releaseApprovalReference: releaseId, institutionalAuthorityReference: authorityId, idempotencyKey: `${input.caseReference}:authorization`, purposeReference: input.caseReference }, publicActor);
  return publication.publish({ publicationAuthorizationId: authorization.authorization.publication_authorization_id, publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, idempotencyKey: `${input.caseReference}:publication` }, publicActor);
}

test("Wave 2D live multi-entity assurance acceptance", { skip: !enabled }, async () => {
  const runStarted = new Date().toISOString();
  const assurance = new GovernmentAssuranceService(undefined, new PlatformMetricRegistryAdapter());
  const claims = new ClaimVerificationService();
  const funding = new FundingLineageService();
  const sourceScope = new SourceScopeService();
  const metricTruth = new MetricTruthService(undefined, undefined, undefined, new IntegrationOutboxRepo(), new PlatformMetricRegistryAdapter());
  const oversight = new MonitoringAuditService();
  const cycles = new AssuranceCycleService();
  const verification = { createVerification: (a: any, i: any) => assurance.createVerification(a, i), startVerification: (a: any, id: string) => claims.startVerification(a, id), determineVerification: (a: any, id: string, i: any) => claims.determineVerification(a, id, i) };
  const programs = ["wave2d-program-workforce", "wave2d-program-youth-tech"];
  const providers = ["wave2d-provider-a", "wave2d-provider-b", "wave2d-provider-c"];
  const services = ["wave2d-service-training-completion", "wave2d-service-apprenticeship-completion"];
  const cycleRows: any[] = [];
  for (const [index, period] of [q1, q2].entries()) {
    const cycle = await cycles.createCycle(actor, { cycleId: `wave2d-cycle-${index + 1}-${Date.now()}`, programReference: programs[index], jurisdictionReference: "wave2d-jurisdiction", periodStart: period.start, periodEnd: period.end, evidenceRuleReference: `wave2d-evidence-rule-${index + 1}`, metricReferences: [`${metricId}:1`], provenance: { acceptance: "wave2d" } });
    cycleRows.push(cycle);
  }
  const scopes = [[providers[0], programs[0], services[0]], [providers[1], programs[0], services[0]], [providers[1], programs[1], services[1]], [providers[2], programs[1], services[1]]];
  for (const cycle of cycleRows) for (const [provider, program, service] of scopes.filter((row) => row[1] === cycle.program_reference)) await cycles.enroll(actor, cycle.cycle_id, { scopeId: `wave2d-scope-${cycle.cycle_id}-${provider}`, programReference: program, providerReference: provider, serviceReference: service, provenance: { acceptance: "wave2d" } });
  const service = new AssuranceProofLoopService({ assurance, funding, claims, verification, metrics: metricTruth, oversight, publicReport: (_actor, input) => publish(input) });
  const cases = [
    ["a-q1-1", providers[0], programs[0], services[0], q1, 8], ["a-q2-1", providers[0], programs[0], services[0], q2, 10],
    ["b-q1-1", providers[1], programs[0], services[0], q1, 12], ["b-q2-1", providers[1], programs[1], services[1], q2, 14], ["b-q2-2", providers[1], programs[1], services[1], q2, 15],
    ["c-q1-1", providers[2], programs[1], services[1], q1, 7], ["c-q2-1", providers[2], programs[1], services[1], q2, 9],
  ] as const;
  const results: any[] = [];
  for (const [name, provider, program, serviceReference, period, value] of cases) {
    const caseReference = `wave2d-${name}-${Date.now()}`;
    const sourceSystemId = `${caseReference}-source`;
    const methodId = `${caseReference}:method`;
    await assurance.createVerificationMethod(actor, { methodId, methodType: "EVIDENCE_SOURCE_MATCH", description: "Wave 2D acceptance evidence review", requiredEvidenceTypes: ["SERVICE_COMPLETION"], status: "ACTIVE", minimumEvidenceCount: 1, humanReviewRequired: true, ownerReference: `${caseReference}:independent-review-authority` });
    await sourceScope.createSourceSystem(actor, { sourceSystemId, canonicalName: `${caseReference} acceptance source`, sourceOwnerReference: `${caseReference}-owner`, environment: "TEST", systemType: "GRANTS", integrationMode: "JSON", dataDomains: ["FUNDING"], recordTypes: ["AWARD"], authorityRole: "SYSTEM_OF_RECORD", authorityPrecedence: 100, status: "ACTIVE", dataClassification: "INTERNAL", provenance: { caseReference } });
    const periodStart = period.start; const periodEnd = period.end;
    results.push(await service.execute({ actor, caseReference, source: { sourceSystemId, sourceRecordId: `${caseReference}-award`, sourceOwnerReference: `${caseReference}-owner`, dataDomain: "FUNDING", recordType: "AWARD", jurisdiction: "wave2d-jurisdiction", precedence: 100, status: "ACTIVE", conflictPolicyReference: "wave2d-source-precedence-v1", provenance: `${caseReference}:source` }, funding: { canonicalRecordType: "AWARD", canonicalRecordId: `${caseReference}-award`, amount: 100000, currency: "USD", programReference: program, providerOrganizationReference: provider, jurisdictionReference: "wave2d-jurisdiction", periodStart, periodEnd, provenanceReference: `${caseReference}:funding` }, programReference: program, providerReference: provider, serviceReference, claim: { claimId: `${caseReference}:claim`, claimantReference: provider, claimType: "SERVICE_DELIVERY", subjectType: "SERVICE", subjectReference: serviceReference, assertedValue: value, assertedUnit: "COMPLETIONS", reportingPeriodStart: periodStart, reportingPeriodEnd: periodEnd, metadata: { providerReference: provider, cycleReference: cycleRows[period === q1 ? 0 : 1].cycle_id }, provenance: `${caseReference}:claim` }, evidence: { evidenceId: `${caseReference}:evidence`, evidenceAuthority: "PREPARE_PROVE_EVIDENCE", evidenceType: "SERVICE_COMPLETION", requirementReference: `${caseReference}:rule`, provenance: `${caseReference}:evidence`, provenanceReference: `${caseReference}:evidence`, integrityVerified: true, provenanceComplete: true }, verification: { methodId, methodVersion: 1, subjectType: "SERVICE", verifierReference: `${caseReference}:reviewer`, reviewerReference: user, provenance: `${caseReference}:verification` }, metric: { metricId, metricVersion: 1, value, reportingPeriodStart: periodStart, reportingPeriodEnd: periodEnd, programReference: program, providerReference: provider, provenanceReference: `${caseReference}:metric` }, warning: { warningId: `${caseReference}:warning`, rule: "VERIFIED_DELIVERY_BELOW_TARGET", threshold: value + 3, provenance: `${caseReference}:warning`, plan: { monitoringType: "PERFORMANCE_REVIEW" } }, finding: { findingType: "DELIVERY_VARIANCE", severity: "MEDIUM", materiality: "MATERIAL", description: "Acceptance delivery variance requires review.", correctiveActionRequired: true, provenance: `${caseReference}:finding` }, correctiveAction: { requiredAction: "Submit corrected delivery evidence", actionOwner: provider, dueAt: "2026-12-31T00:00:00.000Z", requiredEvidence: [`${caseReference}:evidence`], provenance: `${caseReference}:action` }, decision: { decisionType: "ACCEPT_CORRECTIVE_ACTION", authorityReference: `${caseReference}:human-authority`, finalDisposition: { status: "CLOSED" }, provenance: `${caseReference}:decision` }, audit: { auditType: "ASSURANCE_PROOF_LOOP", authorityReference: `${caseReference}:audit-authority`, scope: { caseReference }, provenance: `${caseReference}:audit` }, publicReport: { reportId, reportVersion: 1, publicSafe: true, metricReference: `${metricId}:1`, periodLabel: period.label, periodStart, periodEnd, value } }));
  }
  const outbox = await query("SELECT * FROM integration_outbox WHERE event_type='government_assurance.truth_determination.accepted' AND organization_id=$1 AND payload_json::jsonb->'payload'->>'determination_id' IS NOT NULL AND created_at > NOW() - INTERVAL '10 minutes'", [org]);
  assert.ok(outbox.rows.length >= cases.length);
  const dispatched = await dispatchPendingIntegrationEvents({ workerId: "wave2d-live-worker", limit: 100 });
  assert.ok(dispatched.length >= cases.length);
  const truth = await query("SELECT * FROM truth_spine_records WHERE organization_id=$1 AND tenant_id=$2 AND namespace='claims' AND created_at >= $3", [org, tenant, runStarted]);
  assert.equal(truth.rows.length, cases.length);
  assert.ok(truth.rows.every((row: any) => row.payload_digest && row.payload.caseReference === undefined || row.payload));
  for (const cycle of cycleRows) await cycles.closeCycle(actor, cycle.cycle_id);
  const profileResults = await Promise.all(providers.map((provider) => cycles.profile(actor, "PROVIDER", provider)));
  const programResults = await Promise.all(programs.map((program) => cycles.profile(actor, "PROGRAM", program)));
  assert.equal(profileResults.length, 3); assert.ok(profileResults.every((profile) => profile.authoritative === false));
  assert.equal(programResults.length, 2); assert.ok(programResults.every((profile) => profile.authoritative === false));
  const histories = await Promise.all(providers.map((provider) => cycles.history(actor, "PROVIDER", provider)));
  assert.ok(histories.every((history) => history.items.length >= 1));
  const validComparison = await cycles.compareProviders(actor, cycleRows[0].cycle_id, [providers[0], providers[1]]);
  assert.equal(validComparison.status, "COMPARABLE");
  const invalidComparison = await cycles.compareProviders(actor, cycleRows[1].cycle_id, [providers[0], providers[2]]);
  assert.equal(invalidComparison.status, "NOT COMPARABLE");
  const programComparison = await cycles.comparePrograms(actor, cycleRows[1].cycle_id, programs);
  assert.ok(["COMPARABLE", "NOT COMPARABLE"].includes(programComparison.status));
  const queue = await cycles.reviewQueue(actor); assert.ok(Array.isArray(queue.items));
  const cycleSnapshot = await query("SELECT cycle_id, snapshot_id, summary FROM gpa_assurance_cycle_snapshots WHERE tenant_id=$1 AND organization_id=$2 ORDER BY snapshot_id", [tenant, org]);
  assert.ok(cycleSnapshot.rows.length >= 5);
  const publicResponse = await fetch(`http://127.0.0.1:${process.env.WAVE2D_API_PORT || "8097"}/government-assurance/public/summary?organization_id=${org}&tenant_id=${tenant}&report_id=${encodeURIComponent(reportId)}&report_version=1&jurisdiction=COUNTY`);
  assert.equal(publicResponse.status, 200);
  const publicBody: any = await publicResponse.json();
  assert.equal((publicBody.data || publicBody).availability, "PUBLISHED");
  assert.equal(JSON.stringify(publicBody).includes(tenant), false);
  assert.equal(JSON.stringify(publicBody).includes(user), false);
  assert.ok(results.every((result) => result.correctiveAction.status === "COMPLETE"));
});

test.after(async () => { await pool.end(); });
