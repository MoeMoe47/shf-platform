import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CURRICULUM_COMPLETION_REPORT, ReportPublicEligibilityService } from "../src/domain/reporting/report-public-eligibility-service.ts";

const migration = readFileSync(new URL("../migrations/016_report_public_eligibility_decisions.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
const publicContract = readFileSync(new URL("../../../docs/SHF_PUBLIC_REPORTING_ELIGIBILITY_CONTRACT.md", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return { user_id: "governance-user-1", organization_id: "org-curriculum", tenant_id: "tenant-curriculum", permissions: ["reports.public_eligibility.manage"], ...overrides };
}

function harness() {
  const records = new Map<string, any>();
  const audits: any[] = [];
  const repo = {
    async createDecision(input: any) {
      const record = { ...input, decided_at: "2026-08-26T12:00:00.000Z", created_at: "2026-08-26T12:00:00.000Z", version: 1 };
      records.set(record.public_eligibility_decision_id, record);
      return record;
    },
    async getDecision(id: string, scope: any) {
      const record = records.get(id);
      return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null;
    },
    async listDecisions(scope: any, reportId?: string, reportVersion?: number) {
      return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id && (!reportId || record.report_id === reportId) && (!Number.isInteger(reportVersion) || record.report_version === reportVersion));
    },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => { audits.push(input); return input; };
  return { service: new ReportPublicEligibilityService(repo as any, transaction, auditWriter), records, audits };
}

const validInput = {
  report_id: CURRICULUM_COMPLETION_REPORT.report_id,
  report_version: CURRICULUM_COMPLETION_REPORT.report_version,
  decision: "PUBLIC_ELIGIBLE",
  reason_code: "ACTIVITY_ONLY_AGGREGATE",
  policy_reference: "public-eligibility-policy-v1",
};

test("curriculum public eligibility is exact, server-owned, durable, and audited", async () => {
  const { service, records, audits } = harness();
  const decision = await service.createDecision({ ...validInput, tenant_id: "attacker", organization_id: "attacker", decided_by: "attacker", public_approved: true }, actor());
  assert.match(decision.public_eligibility_decision_id, /^public_eligibility_/);
  assert.equal(decision.tenant_id, "tenant-curriculum");
  assert.equal(decision.organization_id, "org-curriculum");
  assert.equal(decision.decided_by_user_id, "governance-user-1");
  assert.equal(decision.decision, "PUBLIC_ELIGIBLE");
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "report.public_eligibility.approved");
  assert.equal(JSON.stringify(decision).includes("public_approved"), false);
});

test("unsupported reports, versions, states, missing policy, and wrong permissions fail closed", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createDecision({ ...validInput, report_id: "report.unknown.v1" }, actor()), /not authorized/);
  await assert.rejects(() => service.createDecision({ ...validInput, report_version: 2 }, actor()), /not authorized/);
  await assert.rejects(() => service.createDecision({ ...validInput, decision: "PUBLIC_DISCLOSURE_APPROVED" }, actor()), /Unsupported/);
  await assert.rejects(() => service.createDecision({ ...validInput, policy_reference: "" }, actor()), /policy reference/);
  await assert.rejects(() => service.createDecision(validInput, actor({ permissions: ["reports.view", "reports.export", "reports.distribute", "truth.claim.approve_public"] })), /permission/);
});

test("eligibility history is scoped and supports explicit supersession", async () => {
  const { service, audits } = harness();
  const first = await service.createDecision(validInput, actor());
  const second = await service.createDecision({ ...validInput, decision: "PUBLIC_INELIGIBLE", reason_code: "DISCLOSURE_POLICY_PENDING", supersedes_decision_id: first.public_eligibility_decision_id }, actor());
  assert.equal(second.supersedes_decision_id, first.public_eligibility_decision_id);
  assert.equal((await service.getDecision(first.public_eligibility_decision_id, actor())).decision, "PUBLIC_ELIGIBLE");
  assert.equal(await service.getDecision(first.public_eligibility_decision_id, actor({ tenant_id: "other-tenant" })), null);
  assert.equal(audits.length, 2);
  assert.equal(audits[1].action_type, "report.public_eligibility.denied");
});

test("routes, migration, and contract preserve the eligibility boundary", () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS report_public_eligibility_decisions/);
  assert.match(migration, /decision TEXT NOT NULL CHECK \(decision IN \('PUBLIC_ELIGIBLE', 'PUBLIC_INELIGIBLE'\)\)/);
  assert.match(migration, /report_id TEXT NOT NULL/);
  assert.match(migration, /report_version INTEGER NOT NULL/);
  assert.doesNotMatch(migration, /public_approved|report_contents|participant_ref|evidence_payload|truth_payload/);
  assert.match(permissions, /REPORTS_PUBLIC_ELIGIBILITY_MANAGE: "reports\.public_eligibility\.manage"/);
  assert.match(routes, /\/reporting\/public-eligibility-decisions/);
  assert.match(routes, /REPORTS_PUBLIC_ELIGIBILITY_MANAGE/);
  assert.doesNotMatch(routes, /approve-public|PUBLIC_DISCLOSURE_APPROVED|\/publish/);
  assert.match(publicContract, /PUBLIC_ELIGIBLE.*PUBLIC_DISCLOSURE_APPROVED/s);
  assert.match(publicContract, /public_approved.*different authorities/s);
});

test("curriculum semantics remain activity-only and no public snapshot is connected", () => {
  assert.match(publicContract, /lesson completions as activity\/progress only/);
  assert.match(publicContract, /never educational attainment, credentials, or learner success/);
  assert.match(publicContract, /no numeric small-n threshold is\s+defined/);
  assert.match(publicContract, /Public Impact Snapshot.*remains/s);
});

test("Hub eligibility can be recorded only for the exact registered report and server-derived scope", async () => {
  const { service, records, audits } = harness();
  const decision = await service.createDecision({
    report_id: "report.hub.referral.created_count.v1",
    report_version: 1,
    decision: "PUBLIC_ELIGIBLE",
    reason_code: "SYNTHETIC_PUBLIC_APPROVED_POPULATION",
    policy_reference: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY",
    tenant_id: "attacker",
    organization_id: "attacker",
    public_approved: true,
  }, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" }));
  assert.equal(decision.report_id, "report.hub.referral.created_count.v1");
  assert.equal(decision.report_version, 1);
  assert.equal(decision.tenant_id, "tenant-hub");
  assert.equal(decision.organization_id, "org-hub");
  assert.equal(decision.decided_by_user_id, "governance-user-1");
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "report.public_eligibility.approved");
  await assert.rejects(() => service.createDecision({
    report_id: "report.hub.referral.created_count.v1",
    report_version: 2,
    decision: "PUBLIC_ELIGIBLE",
    reason_code: "WRONG_VERSION",
    policy_reference: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY",
  }, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" })), /not authorized/);
});
