import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const metricRegistry = read("services/shf-agent-fabric/contracts/reporting/metric_registry.v1.json");
const reportRegistry = read("services/shf-agent-fabric/contracts/reporting/report_registry.v1.json");
const eligibility = read("apps/shs-api/src/domain/reporting/report-public-eligibility-service.ts");
const disclosure = read("apps/shs-api/src/domain/reporting/report-public-disclosure-service.ts");
const policy = read("apps/shs-api/src/domain/reporting/report-public-disclosure-policy-service.ts");
const snapshot = read("apps/shs-api/src/domain/reporting/report-public-snapshot-service.ts");
const publication = read("apps/shs-api/src/domain/reporting/report-publication-service.ts");
const projectionMigration = read("apps/shs-api/migrations/025_report_publications.sql");
const hubClient = read("src/shared/reporting/hubReferralReportingClient.js");
const hubReports = read("src/pages/hub/HubReports.jsx");
const eligibilityContract = read("docs/SHF_PUBLIC_REPORTING_ELIGIBILITY_CONTRACT.md");
const impactContract = read("docs/SHF_IMPACT_CANONICAL_POPULATION_CONTRACT.md");
const publicClient = read("src/shared/reporting/publicImpactReportingClient.js");

test("Hub referral lineage and report identity are canonical and exact", () => {
  assert.match(metricRegistry, /"metric_id": "hub\.referral\.created_count\.v1"/);
  assert.match(metricRegistry, /"source_claim_types": \["hub_referral_created"\]/);
  assert.match(metricRegistry, /"source_predicates": \["referral_created"\]/);
  assert.match(reportRegistry, /"report_definition_id": "hub\.referral\.created_count"/);
  assert.match(reportRegistry, /"metric_ids": \["hub\.referral\.created_count\.v1"\]/);
  assert.match(hubClient, /report\.hub\.referral\.created_count\.v1/);
});

test("referral-created semantics remain process activity only", () => {
  assert.match(metricRegistry, /"description": "Distinct canonical referrals created during the requested period\."/);
  assert.match(impactContract, /`referral\.created` means a referral\s+was created/);
  assert.match(impactContract, /None proves employment, service success, recipient\s+receipt, program success, ROI/);
  assert.doesNotMatch(hubClient, /completion|success|outcome|impact/i);
});

test("unsupported Hub KPIs remain outside the canonical public review", () => {
  assert.match(hubReports, /fetchHubReferralCreatedCountReport/);
  assert.match(hubReports, /HUB_REPORT_WORKFLOW_REFERRALS/);
  assert.match(hubReports, /localStorage/);
  assert.match(hubReports, /HUB_REPORT_EXPORT_KEY/);
  assert.doesNotMatch(eligibilityContract, /Hub readiness|Hub workflow|Hub export/);
});

test("the curriculum public stack cannot be silently reused for Hub referrals", () => {
  assert.match(eligibility, /CURRICULUM_COMPLETION_REPORT/);
  assert.match(disclosure, /CURRICULUM_COMPLETION_REPORT/);
  assert.match(policy, /PUBLIC_AGGREGATE_EDUCATION_ACTIVITY/);
  assert.match(snapshot, /requirePublicReportGovernanceRegistration/);
  assert.match(publication, /getPublicReportGovernanceRegistration/);
  assert.match(projectionMigration, /report\.curriculum\.lesson_completion_count\.v1/);
  assert.match(projectionMigration, /Verified Lesson Completions/);
});

test("Hub public progression remains gated by a domain disclosure policy", () => {
  assert.match(eligibilityContract, /hub\.referral\.created_count\.v1.*PUBLIC_ELIGIBLE_WITH_DISCLOSURE_POLICY/s);
  assert.match(eligibilityContract, /These classifications are report-specific and do not authorize public release/);
  assert.match(impactContract, /PUBLIC_ELIGIBLE_NOT_APPROVED/);
  assert.doesNotMatch(hubClient, /localStorage|Oracle|Truth|Evidence|reduce\(|filter\(/i);
  assert.match(publicClient, /curriculum-lesson-completions/);
  assert.doesNotMatch(publicClient, /hub\.referral\.created_count/);
});

test("the curriculum public field remains the only connected public field", () => {
  assert.match(publicClient, /report\.curriculum\.lesson_completion_count\.v1/);
  assert.match(publicClient, /Verified Lesson Completions/);
  assert.doesNotMatch(publicClient, /Hub Referrals Created|referral\.created_count/);
});
