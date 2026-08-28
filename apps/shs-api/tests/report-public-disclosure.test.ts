import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateCurriculumPublicDisclosure, evaluateHubReferralPublicDisclosure, ReportPublicDisclosureService } from "../src/domain/reporting/report-public-disclosure-service.ts";
import { APPROVED_CURRICULUM_POLICY_V1, APPROVED_HUB_REFERRAL_POLICY_V1, PUBLIC_DISCLOSURE_POLICY_READINESS } from "../src/domain/reporting/report-public-disclosure-policy-service.ts";

const migration = readFileSync(new URL("../migrations/017_report_public_disclosure_decisions.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
const contract = readFileSync(new URL("../../../docs/SHF_PUBLIC_REPORTING_ELIGIBILITY_CONTRACT.md", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return { user_id: "disclosure-reviewer-1", organization_id: "org-curriculum", tenant_id: "tenant-curriculum", permissions: ["reports.public_disclosure.manage"], ...overrides };
}

function harness() {
  const decisions = new Map<string, any>();
  const eligibility = new Map<string, any>();
  const audits: any[] = [];
  const eligibilityRepo = {
    async getDecision(id: string, scope: any) {
      const record = eligibility.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
  };
  const repo = {
    async createDecision(input: any) {
      const record = { ...input, reviewed_at: "2026-08-26T12:00:00.000Z", created_at: "2026-08-26T12:00:00.000Z", version: 1 };
      decisions.set(record.public_disclosure_decision_id, record);
      return record;
    },
    async getDecision(id: string, scope: any) {
      const record = decisions.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listDecisions(scope: any) { return [...decisions.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id); },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => { audits.push(input); return input; };
  const eligible = { public_eligibility_decision_id: "eligibility-1", report_id: "report.curriculum.lesson_completion_count.v1", report_version: 1, tenant_id: "tenant-curriculum", organization_id: "org-curriculum", decision: "PUBLIC_ELIGIBLE" };
  eligibility.set(eligible.public_eligibility_decision_id, eligible);
  const policyRepo = { async getApprovedPolicy() { return null; } };
  return { service: new ReportPublicDisclosureService(repo as any, eligibilityRepo as any, transaction, auditWriter, policyRepo as any), decisions, audits, eligible };
}

const base = {
  report_id: "report.curriculum.lesson_completion_count.v1",
  report_version: 1,
  public_eligibility_decision_id: "eligibility-1",
  decision: "PUBLIC_DISCLOSURE_BLOCKED",
  privacy_policy_reference: "public-disclosure-policy-pending",
  privacy_policy_version: "0",
  reason_code: "NO_APPROVED_SMALL_N_POLICY",
};

test("disclosure authority is exact, scoped, durable, and audited", async () => {
  const { service, decisions, audits } = harness();
  const decision = await service.createDecision({ ...base, tenant_id: "attacker", organization_id: "attacker", reviewed_by: "attacker", public_approved: true }, actor());
  assert.match(decision.public_disclosure_decision_id, /^public_disclosure_/);
  assert.equal(decision.report_id, base.report_id);
  assert.equal(decision.report_version, 1);
  assert.equal(decision.public_eligibility_decision_id, "eligibility-1");
  assert.equal(decision.tenant_id, "tenant-curriculum");
  assert.equal(decision.organization_id, "org-curriculum");
  assert.equal(decision.reviewed_by_user_id, "disclosure-reviewer-1");
  assert.equal(decision.decision, "PUBLIC_DISCLOSURE_BLOCKED");
  assert.equal(decisions.size, 1);
  assert.equal(audits[0].action_type, "report.public_disclosure.blocked");
  assert.equal(JSON.stringify(decision).includes("public_approved"), false);
  assert.equal(PUBLIC_DISCLOSURE_POLICY_READINESS, "APPROVED_POLICY_READY");
});

test("missing or ineligible exact eligibility blocks disclosure", async () => {
  const { service, eligible } = harness();
  await assert.rejects(() => service.createDecision({ ...base, public_eligibility_decision_id: "missing" }, actor()), /PUBLIC_ELIGIBLE/);
  eligible.decision = "PUBLIC_INELIGIBLE";
  await assert.rejects(() => service.createDecision(base, actor()), /PUBLIC_ELIGIBLE/);
  eligible.decision = "PUBLIC_ELIGIBLE";
  await assert.rejects(() => service.createDecision({ ...base, report_version: 2 }, actor()), /not authorized/);
  await assert.rejects(() => service.createDecision({ ...base, report_id: "report.unknown.v1" }, actor()), /not authorized/);
});

test("approved disclosure requires an approved policy authority", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createDecision({ ...base, decision: "PUBLIC_DISCLOSURE_APPROVED" }, actor()), /not available|policy authority/i);
  await assert.rejects(() => service.createDecision({ ...base, privacy_policy_reference: "" }, actor()), /policy reference/);
  await assert.rejects(() => service.createDecision({ ...base, privacy_policy_version: "" }, actor()), /policy version/);
  await assert.rejects(() => service.createDecision(base, actor({ permissions: ["reports.view", "reports.public_eligibility.manage", "truth.claim.approve_public"] })), /permission/);
});

test("approved curriculum disclosure evaluates policy gates and preserves suppression", async () => {
  const { eligible } = harness();
  const decisions = new Map<string, any>();
  const audits: any[] = [];
  const policyRepo = { async getApprovedPolicy() { return { policy_key: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", policy_version: 1, policy_definition: APPROVED_CURRICULUM_POLICY_V1 }; } };
  const repo = { async createDecision(input: any) { const record = { ...input, version: 1 }; decisions.set(record.public_disclosure_decision_id, record); return record; }, async getDecision() { return null; }, async listDecisions() { return [...decisions.values()]; } };
  const eligibilityRepo = { async getDecision() { return eligible; } };
  const transaction = async (fn: any) => fn({});
  const service = new ReportPublicDisclosureService(repo as any, eligibilityRepo as any, transaction, async (event: any) => { audits.push(event); }, policyRepo as any);
  const context = { canonical_count: 9, geography: "COUNTY", program_granularity: "FOUNDATION_WIDE", reporting_period: "ANNUAL", reporting_period_label: "2026", data_as_of: "2026-08-01", evaluated_at: "2026-08-26", complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" };
  const result = await service.createDecision({ ...base, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1", review_context: context }, actor());
  assert.equal(result.decision, "PUBLIC_DISCLOSURE_APPROVED");
  assert.equal(result.review_context.public_representation, "SUPPRESSED_LT_10");
  assert.equal(result.review_context.canonical_count, 9);
  assert.equal(audits[0].action_type, "report.public_disclosure.approved");
  assert.equal(evaluateCurriculumPublicDisclosure({ policy_definition: APPROVED_CURRICULUM_POLICY_V1 }, context).internal_value, 9);
  await assert.rejects(() => service.createDecision({ ...base, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1", review_context: { ...context, geography: "MUNICIPALITY" } }, actor()), /geography/i);
  await assert.rejects(() => service.createDecision({ ...base, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1", review_context: { ...context, reporting_period: "MONTHLY" } }, actor()), /period/i);
  await assert.rejects(() => service.createDecision({ ...base, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY", privacy_policy_version: "1", review_context: { ...context, reidentification_review: "UNKNOWN" } }, actor()), /residual/i);
});

test("approved Hub disclosure evaluates referral policy and blocks granular dimensions", async () => {
  const decisions = new Map<string, any>();
  const audits: any[] = [];
  const hubEligible = { public_eligibility_decision_id: "hub-eligibility-1", report_id: "report.hub.referral.created_count.v1", report_version: 1, tenant_id: "tenant-hub", organization_id: "org-hub", decision: "PUBLIC_ELIGIBLE" };
  const policyRepo = { async getApprovedPolicy() { return { policy_key: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY", policy_version: 1, policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }; } };
  const repo = { async createDecision(input: any) { const record = { ...input, version: 1 }; decisions.set(record.public_disclosure_decision_id, record); return record; }, async getDecision() { return null; }, async listDecisions() { return [...decisions.values()]; } };
  const eligibilityRepo = { async getDecision() { return hubEligible; } };
  const transaction = async (fn: any) => fn({});
  const service = new ReportPublicDisclosureService(repo as any, eligibilityRepo as any, transaction, async (event: any) => { audits.push(event); }, policyRepo as any);
  const context = { canonical_count: 10, geography: "COUNTY", program_granularity: "NAMED_HUB_PROGRAM", reporting_period: "ANNUAL", reporting_period_label: "2026", data_as_of: "2026-08-01", evaluated_at: "2026-08-26", complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" };
  const baseHub = { report_id: hubEligible.report_id, report_version: 1, public_eligibility_decision_id: hubEligible.public_eligibility_decision_id, decision: "PUBLIC_DISCLOSURE_APPROVED", privacy_policy_reference: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY", privacy_policy_version: "1", reason_code: "HUB_POLICY_V1", review_context: context };
  const approved = await service.createDecision(baseHub, { user_id: "hub-reviewer", organization_id: "org-hub", tenant_id: "tenant-hub", permissions: ["reports.public_disclosure.manage"] });
  assert.equal(approved.decision, "PUBLIC_DISCLOSURE_APPROVED");
  assert.equal(approved.review_context.public_representation, "EXACT_COUNT");
  assert.equal(audits[0].action_type, "report.public_disclosure.approved");
  await assert.rejects(() => service.createDecision({ ...baseHub, review_context: { ...context, program_granularity: "PROVIDER" } }, { user_id: "hub-reviewer", organization_id: "org-hub", tenant_id: "tenant-hub", permissions: ["reports.public_disclosure.manage"] }), /program/i);
  const suppressed = await service.createDecision({ ...baseHub, reason_code: "HUB_POLICY_V1_SUPPRESSED", review_context: { ...context, canonical_count: 9 } }, { user_id: "hub-reviewer", organization_id: "org-hub", tenant_id: "tenant-hub", permissions: ["reports.public_disclosure.manage"] });
  assert.equal(suppressed.review_context.public_representation, "SUPPRESSED_LT_10");
});

test("Hub v1 enforces approved geography, periods, and every residual-risk gate", () => {
  const context = { canonical_count: 10, geography: "ORGANIZATION_WIDE", program_granularity: "FOUNDATION_WIDE", reporting_period: "ANNUAL", reporting_period_label: "2026", data_as_of: "2026-08-01", evaluated_at: "2026-08-26", complementary_suppression_review: "PASS", reidentification_review: "PASS", rare_event_review: "PASS", reconstruction_review: "PASS", longitudinal_review: "PASS", combination_risk_review: "PASS" };
  for (const geography of ["ORGANIZATION_WIDE", "STATE", "COUNTY"]) assert.doesNotThrow(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, geography }));
  for (const geography of ["MUNICIPALITY", "NEIGHBORHOOD", "SITE", "LOCATION"]) assert.throws(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, geography }), /geography/);
  for (const reporting_period of ["QUARTERLY", "ANNUAL"]) assert.doesNotThrow(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, reporting_period }));
  for (const reporting_period of ["MONTHLY", "WEEKLY", "DAILY", "CUSTOM_NARROW"]) assert.throws(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, reporting_period }), /period/);
  for (const key of ["complementary_suppression_review", "reidentification_review", "rare_event_review", "reconstruction_review", "longitudinal_review", "combination_risk_review"]) assert.throws(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, [key]: "UNKNOWN" }), /residual/);
  assert.throws(() => evaluateHubReferralPublicDisclosure({ policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1 }, { ...context, data_as_of: "2024-01-01" }), /stale/);
});

test("disclosure history is append-only and cross-scope reads are concealed", async () => {
  const { service, audits } = harness();
  const first = await service.createDecision(base, actor());
  const second = await service.createDecision({ ...base, reason_code: "POLICY_STILL_PENDING", supersedes_decision_id: first.public_disclosure_decision_id }, actor());
  assert.equal(second.supersedes_decision_id, first.public_disclosure_decision_id);
  assert.equal((await service.getDecision(first.public_disclosure_decision_id, actor())).decision, "PUBLIC_DISCLOSURE_BLOCKED");
  assert.equal(await service.getDecision(first.public_disclosure_decision_id, actor({ organization_id: "other-org" })), null);
  assert.equal(audits.length, 2);
});

test("routes and persistence preserve separation from public approval and publication", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_public_disclosure_decisions/);
  assert.match(migration, /PUBLIC_DISCLOSURE_APPROVED.*PUBLIC_DISCLOSURE_BLOCKED/s);
  assert.match(migration, /public_eligibility_decision_id TEXT NOT NULL/);
  assert.match(migration, /privacy_policy_reference TEXT NOT NULL/);
  assert.match(migration, /privacy_policy_version TEXT NOT NULL/);
  assert.doesNotMatch(migration, /public_approved|report_contents|participant_ref|evidence_payload|truth_payload/);
  assert.match(permissions, /REPORTS_PUBLIC_DISCLOSURE_MANAGE: "reports\.public_disclosure\.manage"/);
  assert.match(routes, /\/reporting\/public-disclosure-decisions/);
  assert.match(routes, /REPORTS_PUBLIC_DISCLOSURE_MANAGE/);
  assert.doesNotMatch(routes, /approve-public|public_approved|\/publish|PUBLICATION_AUTHORIZED/);
  assert.match(contract, /PUBLIC_DISCLOSURE_APPROVED.*PUBLIC_DISCLOSURE_BLOCKED/s);
  assert.match(contract, /approved `PUBLIC_AGGREGATE_EDUCATION_ACTIVITY` policy v1/);
});
