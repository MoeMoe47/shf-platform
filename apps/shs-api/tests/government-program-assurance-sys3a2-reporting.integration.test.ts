import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { query, pool } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { ReportPublicEligibilityService } from "../src/domain/reporting/report-public-eligibility-service.js";
import { ReportPublicDisclosureService } from "../src/domain/reporting/report-public-disclosure-service.js";
import { ReportPublicDisclosurePolicyService, APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 } from "../src/domain/reporting/report-public-disclosure-policy-service.js";
import { ReportPublicSnapshotService } from "../src/domain/reporting/report-public-snapshot-service.js";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.js";
import { IntegrationOutboxRepo } from "../src/domain/trusted-reporting/outbox-repo.js";
import { dispatchPendingIntegrationEvents } from "../src/domain/trusted-reporting/dispatcher.js";

const enabled = process.env.WAVE3_LIVE === "1";
const run = `sys3a2-${Date.now()}-${randomUUID().slice(0, 8)}`;
const organizationId = `org-${run}`;
const tenantId = `tenant:${organizationId}`;
const userId = `user-${run}`;
const reportId = "report.gpa.program_assurance_public_summary.v1";
const metricId = "workforce.employment.started_verified_count.v1";
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { user_id: userId, organization_id: organizationId, tenant_id: tenantId, permissions, actor_type: "user" };

async function seed() {
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
    VALUES ($1,$2,$2,'NONPROFIT','active',$3)`, [organizationId, `SYS3A2 ${run}`, `${run}.example.org`]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1,$2,$3,'SYS3A2 Publisher','active','test')`, [userId, organizationId, `${userId}@test.invalid`]);
}

function publicContext() {
  return { canonical_count: 20, geography: "COUNTY", program_granularity: "NAMED_PROGRAM", reporting_period: "QUARTERLY", reporting_period_label: "2026 Q3", data_as_of: new Date().toISOString(), complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" };
}

async function createPublication(label = randomUUID().slice(0, 8)) {
  const key = `${run}:${label}`;
  const eligibility = await new ReportPublicEligibilityService().createDecision({ reportId, reportVersion: 1, decision: "PUBLIC_ELIGIBLE", reasonCode: key, policyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE" }, actor);
  const policyService = new ReportPublicDisclosurePolicyService();
  const existingPolicy = (await query("SELECT * FROM report_public_disclosure_policies WHERE tenant_id=$1 AND organization_id=$2 AND policy_key=$3 AND policy_version=1 AND status='APPROVED' LIMIT 1", [tenantId, organizationId, "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE"])).rows[0];
  if (!existingPolicy) {
    const policy = await policyService.createPolicy({ reportId, reportVersion: 1, policyKey: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE", policyVersion: 1, policyDefinition: APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 }, actor);
    for (const signoffType of ["PRIVACY_DATA_GOVERNANCE", "LEGAL_PRIVACY_REVIEW", "EXECUTIVE_APPROVAL"]) {
      const signoff = await policyService.createSignoff(policy.policy_id, { signoffType, authorityReference: `${run}:${signoffType}` }, actor);
      await policyService.approveSignoff(signoff.signoff_record_id, actor);
    }
    await policyService.approvePolicy(policy.policy_id, actor);
  }
  const disclosure = await new ReportPublicDisclosureService().createDecision({ reportId, reportVersion: 1, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, decision: "PUBLIC_DISCLOSURE_APPROVED", privacyPolicyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE", privacyPolicyVersion: "1", reasonCode: key, reviewContext: publicContext() }, actor);
  const periodStart = "2026-07-01";
  const periodEnd = "2026-09-30";
  const snapshot = await new ReportPublicSnapshotService().createSnapshot({ reportResult: { reportId, reportVersion: 1, metricId, metricVersion: 1, reportResultId: `workforce.employment.started_verified_count:v1:${periodStart}:${periodEnd}:${organizationId}`, canonicalCount: 20, canonical_count: 20, periodStart, periodEnd, dataAsOf: new Date().toISOString(), reportingPeriod: "QUARTERLY", reportingPeriodLabel: "2026 Q3", geography: "COUNTY", programGranularity: "NAMED_PROGRAM", publicEligibility: true, public_eligibility: true, publicPopulationEligible: true, public_population_eligible: true }, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, publicDisclosureDecisionId: disclosure.public_disclosure_decision_id, idempotencyKey: `${key}:snapshot` }, actor);
  const authorityId = `authority-${run}-${label}`;
  const releaseId = `release-${run}-${label}`;
  await query(`INSERT INTO report_publication_authorities (authority_id, authority_type, tenant_id, organization_id, authority_reference, status, effective_at, recorded_by_user_id) VALUES ($1,'PUBLIC_REPORTING_RELEASE_AUTHORITY',$2,$3,$4,'ACTIVE',NOW(),$5)`, [authorityId, tenantId, organizationId, authorityId, userId]);
  await query(`INSERT INTO report_publication_release_approvals (release_approval_id, public_snapshot_id, snapshot_version, snapshot_hash, tenant_id, organization_id, authority_id, approval_category, status, approved_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLIC_REPORTING_RELEASE_APPROVAL','APPROVED',$8)`, [releaseId, snapshot.snapshot.public_snapshot_id, snapshot.snapshot.version, snapshot.snapshot.snapshot_hash, tenantId, organizationId, authorityId, userId]);
  const publication = new ReportPublicationService();
  const authorization = await publication.authorize({ publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, releaseApprovalReference: releaseId, institutionalAuthorityReference: authorityId, idempotencyKey: `${key}:authorization`, purposeReference: key }, actor);
  const published = await publication.publish({ publicationAuthorizationId: authorization.authorization.publication_authorization_id, publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, idempotencyKey: `${key}:publication` }, actor);
  return { publication, authorization, published };
}

before(async () => { if (enabled) await seed(); });
after(async () => { await pool.end(); });

test("SYS-3A2 governed report publication, revocation, and outbox recovery are live in PostgreSQL", { skip: !enabled }, async () => {
  const { publication, authorization, published } = await createPublication();
  const publicBefore = await publication.listPublicImpactProjections(reportId, 1);
  assert.ok(publicBefore.length >= 1);
  assert.equal(publicBefore.some((item) => item.public_display_value === "20"), true);

  const revoked = await publication.revokeAuthorization(authorization.authorization.publication_authorization_id, actor, "SYS3A2 revocation acceptance");
  assert.equal(revoked.authorization.status, "PUBLICATION_REVOKED");
  const publicAfter = await publication.listPublicImpactProjections(reportId, 1);
  const revokedProjection = await query(`SELECT p.projection_id FROM shf_public_impact_projections p WHERE p.publication_id=$1 AND EXISTS (SELECT 1 FROM report_publication_authorizations authz WHERE authz.publication_authorization_id=(SELECT publication_authorization_id FROM report_publications WHERE publication_id=p.publication_id) AND authz.status='PUBLICATION_AUTHORIZED')`, [published.publication.publication_id]);
  assert.equal(revokedProjection.rows.length, 0);
  const internalPublication = await publication.getPublication(published.publication.publication_id, actor);
  assert.equal(internalPublication.publication_status, "PUBLISHED");
  const audit = await query(`SELECT action_type FROM audit_events WHERE organization_id=$1 AND target_object_id=$2 ORDER BY created_at`, [organizationId, authorization.authorization.publication_authorization_id]);
  assert.deepEqual(audit.rows.map((row: any) => row.action_type), ["report.publication.authorized", "report.publication.revoked"]);

  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://sys3a2-test-consumer.invalid";
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "sys3a2-test-key";
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "sys3a2-test-key": "sys3a2-test-secret" });
  const outbox = new IntegrationOutboxRepo();
  const event = await outbox.enqueue({ producer_id: "shs-api.sys3a2-test", event_type: "report.publication.ready", subject_type: "report_publication", subject_id: published.publication.publication_id, organization_id: organizationId, originating_actor_id: userId, occurred_at: new Date().toISOString(), idempotency_key: `${run}:delivery`, correlation_id: `${run}:correlation`, tenant_id: tenantId, destination: "sys3a2-test-consumer", payload: { publication_id: published.publication.publication_id } });
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return calls === 1 ? { ok: false, status: 503, json: async () => ({ ok: false }) } : { ok: true, status: 200, json: async () => ({ ok: true }) }; };
  const first = await dispatchPendingIntegrationEvents({ fetchImpl, workerId: `${run}:worker`, config: { backoffBaseSeconds: 1, backoffCapSeconds: 1 } });
  assert.equal(first.some((item) => item.outbox_event_id === event.outbox_event_id && item.status === "RETRYABLE"), true);
  await query("UPDATE integration_outbox SET next_attempt_at=NOW() WHERE outbox_event_id=$1", [event.outbox_event_id]);
  const second = await dispatchPendingIntegrationEvents({ fetchImpl, workerId: `${run}:worker`, config: { backoffBaseSeconds: 1, backoffCapSeconds: 1 } });
  assert.equal(second.some((item) => item.outbox_event_id === event.outbox_event_id && item.status === "DELIVERED"), true);
  const replay = await outbox.enqueue({ producer_id: "shs-api.sys3a2-test", event_type: "report.publication.ready", subject_type: "report_publication", subject_id: published.publication.publication_id, organization_id: organizationId, originating_actor_id: userId, occurred_at: new Date().toISOString(), idempotency_key: `${run}:delivery`, correlation_id: `${run}:correlation`, tenant_id: tenantId, destination: "sys3a2-test-consumer", payload: { publication_id: published.publication.publication_id } });
  assert.equal(replay.outbox_event_id, event.outbox_event_id);
  const delivered = await query("SELECT delivery_status, attempt_count FROM integration_outbox WHERE outbox_event_id=$1", [event.outbox_event_id]);
  assert.equal(delivered.rows[0].delivery_status, "DELIVERED");
  assert.equal(Number(delivered.rows[0].attempt_count), 2);
});

test("SYS-3A2 publication revocation is scope-protected and terminal outbox failure is explicit", { skip: !enabled }, async () => {
  const { publication, authorization } = await createPublication();
  await assert.rejects(() => publication.revokeAuthorization(authorization.authorization.publication_authorization_id, { ...actor, organization_id: `${organizationId}-other`, tenant_id: `tenant:${organizationId}-other` }, "wrong scope"), /Publication authorization not found/);
  process.env.SHF_AGENT_FABRIC_INTERNAL_URL = "http://sys3a2-test-consumer.invalid";
  process.env.SHF_INTERNAL_SERVICE_ACTIVE_KID = "sys3a2-test-key";
  process.env.SHF_INTERNAL_SERVICE_KEYS_JSON = JSON.stringify({ "sys3a2-test-key": "sys3a2-test-secret" });
  const outbox = new IntegrationOutboxRepo();
  const event = await outbox.enqueue({ producer_id: "shs-api.sys3a2-terminal", event_type: "report.publication.ready", subject_type: "report_publication", subject_id: authorization.authorization.public_snapshot_id, organization_id: organizationId, originating_actor_id: userId, occurred_at: new Date().toISOString(), idempotency_key: `${run}:terminal`, correlation_id: `${run}:terminal-correlation`, tenant_id: tenantId, destination: "sys3a2-test-consumer", payload: { publication_id: authorization.authorization.public_snapshot_id } });
  const result = await dispatchPendingIntegrationEvents({ fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: false }) }), workerId: `${run}:terminal-worker`, config: { maxAttempts: 1, backoffBaseSeconds: 1, backoffCapSeconds: 1 } });
  assert.equal(result.some((item) => item.outbox_event_id === event.outbox_event_id && item.status === "QUARANTINED"), true);
  const terminal = await query("SELECT delivery_status, failure_classification, last_error, attempt_count FROM integration_outbox WHERE outbox_event_id=$1", [event.outbox_event_id]);
  assert.equal(terminal.rows[0].delivery_status, "QUARANTINED");
  assert.equal(terminal.rows[0].failure_classification, "QUARANTINED");
  assert.equal(Number(terminal.rows[0].attempt_count), 1);
  assert.ok(terminal.rows[0].last_error);
});
