import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { pool, query } from "../src/db/client.js";
import { SHS_SECURITY_PERMISSIONS } from "../src/auth/security-permissions.js";
import { ReportPublicDisclosurePolicyService, APPROVED_GPA_PROGRAM_ASSURANCE_POLICY_V1 } from "../src/domain/reporting/report-public-disclosure-policy-service.js";
import { ReportPublicDisclosureService } from "../src/domain/reporting/report-public-disclosure-service.js";
import { ReportPublicEligibilityService } from "../src/domain/reporting/report-public-eligibility-service.js";
import { ReportPublicSnapshotService } from "../src/domain/reporting/report-public-snapshot-service.js";
import { ReportPublicationService } from "../src/domain/reporting/report-publication-service.js";

const enabled = process.env.WAVE3_LIVE === "1";
const run = `sys3a4b-${Date.now()}-${randomUUID().slice(0, 8)}`;
const organizationId = `org-${run}`;
const tenantId = `tenant:${organizationId}`;
const userId = `user-${run}`;
const reportId = "report.gpa.program_assurance_public_summary.v1";
const permissions = Object.values(SHS_SECURITY_PERMISSIONS);
const actor = { user_id: userId, organization_id: organizationId, tenant_id: tenantId, permissions, actor_type: "user" };

async function seed() {
  await query(`INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
    VALUES ($1,$2,$2,'NONPROFIT','active',$3)`, [organizationId, `SYS3A4B ${run}`, `${run}.example.org`]);
  await query(`INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
    VALUES ($1,$2,$3,'SYS3A4B Publisher','active','test')`, [userId, organizationId, `${userId}@test.invalid`]);
}

function publicContext(count: number) {
  return { canonical_count: count, geography: "COUNTY", program_granularity: "NAMED_PROGRAM", reporting_period: "QUARTERLY", reporting_period_label: "2026 Q3", data_as_of: new Date().toISOString(), complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" };
}

async function createPublication(label: string, count: number, supersedesPublicationId?: string) {
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
  const disclosure = await new ReportPublicDisclosureService().createDecision({ reportId, reportVersion: 1, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, decision: "PUBLIC_DISCLOSURE_APPROVED", privacyPolicyReference: "PUBLIC_AGGREGATE_GPA_PROGRAM_ASSURANCE", privacyPolicyVersion: "1", reasonCode: key, reviewContext: publicContext(count) }, actor);
  const snapshot = await new ReportPublicSnapshotService().createSnapshot({ reportResult: { reportId, reportVersion: 1, metricId: "workforce.employment.started_verified_count.v1", metricVersion: 1, reportResultId: `workforce.employment.started_verified_count:v1:2026-07-01:2026-09-30:${organizationId}`, canonicalCount: count, canonical_count: count, periodStart: "2026-07-01", periodEnd: "2026-09-30", dataAsOf: new Date().toISOString(), reportingPeriod: "QUARTERLY", reportingPeriodLabel: "2026 Q3", geography: "COUNTY", programGranularity: "NAMED_PROGRAM", publicEligibility: true, public_eligibility: true, publicPopulationEligible: true, public_population_eligible: true }, publicEligibilityDecisionId: eligibility.public_eligibility_decision_id, publicDisclosureDecisionId: disclosure.public_disclosure_decision_id, idempotencyKey: `${key}:snapshot` }, actor);
  const authorityId = `authority-${run}-${label}`;
  const releaseId = `release-${run}-${label}`;
  await query(`INSERT INTO report_publication_authorities (authority_id, authority_type, tenant_id, organization_id, authority_reference, status, effective_at, recorded_by_user_id) VALUES ($1,'PUBLIC_REPORTING_RELEASE_AUTHORITY',$2,$3,$4,'ACTIVE',NOW(),$5)`, [authorityId, tenantId, organizationId, authorityId, userId]);
  await query(`INSERT INTO report_publication_release_approvals (release_approval_id, public_snapshot_id, snapshot_version, snapshot_hash, tenant_id, organization_id, authority_id, approval_category, status, approved_by_user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,'PUBLIC_REPORTING_RELEASE_APPROVAL','APPROVED',$8)`, [releaseId, snapshot.snapshot.public_snapshot_id, snapshot.snapshot.version, snapshot.snapshot.snapshot_hash, tenantId, organizationId, authorityId, userId]);
  const publication = new ReportPublicationService();
  const authorization = await publication.authorize({ publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, releaseApprovalReference: releaseId, institutionalAuthorityReference: authorityId, idempotencyKey: `${key}:authorization`, purposeReference: key }, actor);
  const published = await publication.publish({ publicationAuthorizationId: authorization.authorization.publication_authorization_id, publicSnapshotId: snapshot.snapshot.public_snapshot_id, snapshotVersion: snapshot.snapshot.version, snapshotHash: snapshot.snapshot.snapshot_hash, idempotencyKey: `${key}:publication`, supersedesPublicationId: supersedesPublicationId }, actor);
  return { publication, authorization, published, snapshot };
}

before(async () => { if (enabled) await seed(); });
after(async () => { await pool.end(); });

test("SYS-3A4B V1 to V2 publication supersession and revocation are live in PostgreSQL", { skip: !enabled }, async () => {
  const v1 = await createPublication("v1", 201);
  const publicV1 = await v1.publication.listPublicImpactProjections(reportId, 1);
  assert.equal(publicV1.some((item: any) => item.public_display_value === "201"), true);

  const v2 = await createPublication("v2", 202, v1.published.publication.publication_id);
  const publications = (await query(`SELECT publication_id, supersedes_publication_id, is_current FROM report_publications WHERE tenant_id=$1 AND organization_id=$2 AND report_id=$3 ORDER BY published_at`, [tenantId, organizationId, reportId])).rows;
  assert.equal(publications.length, 2);
  assert.equal(publications.filter((row: any) => row.is_current).length, 1);
  assert.equal(publications[0].is_current, false);
  assert.equal(publications[1].is_current, true);
  assert.equal(publications[1].supersedes_publication_id, v1.published.publication.publication_id);

  const publicV2 = await v2.publication.listPublicImpactProjections(reportId, 1);
  assert.equal(publicV2.some((item: any) => item.public_display_value === "202"), true);
  const replay = await v2.publication.publish({ publicationAuthorizationId: v2.authorization.authorization.publication_authorization_id, publicSnapshotId: v2.snapshot.snapshot.public_snapshot_id, snapshotVersion: v2.snapshot.snapshot.version, snapshotHash: v2.snapshot.snapshot.snapshot_hash, idempotencyKey: `${run}:v2:publication`, supersedesPublicationId: v1.published.publication.publication_id }, actor);
  assert.equal(replay.replayed, true);
  assert.equal((await query(`SELECT count(*)::int AS count FROM report_publications WHERE tenant_id=$1 AND organization_id=$2 AND report_id=$3`, [tenantId, organizationId, reportId])).rows[0].count, 2);

  const revoked = await v2.publication.revokeAuthorization(v2.authorization.authorization.publication_authorization_id, actor, "SYS3A4B revoke current publication");
  assert.equal(revoked.authorization.status, "PUBLICATION_REVOKED");
  assert.equal((await v2.publication.listPublicImpactProjections(reportId, 1)).some((item: any) => item.public_display_value === "202"), false);
  const finalState = (await query(`SELECT publication_id, is_current FROM report_publications WHERE tenant_id=$1 AND organization_id=$2 AND report_id=$3 ORDER BY published_at`, [tenantId, organizationId, reportId])).rows;
  assert.equal(finalState.every((row: any) => row.is_current === false), true);
  assert.equal((await v1.publication.getPublication(v1.published.publication.publication_id, actor)).is_current, false);
  const audit = (await query(`SELECT action_type, new_state_json->>'supersedes_publication_id' AS supersedes FROM audit_events WHERE organization_id=$1 AND target_object_id=$2`, [organizationId, v2.published.publication.publication_id])).rows;
  assert.equal(audit.some((row: any) => row.action_type === "report.published" && row.supersedes === v1.published.publication.publication_id), true);
});
