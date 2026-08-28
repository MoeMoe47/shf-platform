import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { APPROVED_CURRICULUM_POLICY_V1, APPROVED_HUB_REFERRAL_POLICY_V1, ReportPublicDisclosurePolicyService, CURRICULUM_DISCLOSURE_POLICY, REQUIRED_DISCLOSURE_RULES, REQUIRED_SIGNOFF_TYPES } from "../src/domain/reporting/report-public-disclosure-policy-service.ts";

const migration = readFileSync(new URL("../migrations/018_report_public_disclosure_policies.sql", import.meta.url), "utf8");
const schemaCompletionMigration = readFileSync(new URL("../migrations/019_public_disclosure_policy_schema_completion.sql", import.meta.url), "utf8");
const routes = readFileSync(new URL("../src/domain/reporting/routes.ts", import.meta.url), "utf8");
const permissions = readFileSync(new URL("../src/auth/security-permissions.ts", import.meta.url), "utf8");
const disclosureService = readFileSync(new URL("../src/domain/reporting/report-public-disclosure-service.ts", import.meta.url), "utf8");
const publicContract = readFileSync(new URL("../../../docs/SHF_PUBLIC_DISCLOSURE_POLICY_CONTRACT.md", import.meta.url), "utf8");

function actor(overrides: Record<string, unknown> = {}) {
  return { user_id: "policy-governor-1", organization_id: "org-curriculum", tenant_id: "tenant-curriculum", permissions: ["reports.public_disclosure_policy.manage"], ...overrides };
}

function harness() {
  const records = new Map<string, any>();
  const audits: any[] = [];
  const repo = {
    async createPolicy(input: any) { const record = { ...input, status: "DRAFT", institutional_signoff_required: true, version: 1, created_at: "2026-08-26T12:00:00.000Z" }; records.set(record.policy_id, record); return record; },
    async getPolicy(id: string, scope: any) { const record = records.get(id); return record && record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id ? record : null; },
    async listPolicies(scope: any) { return [...records.values()].filter((record) => record.tenant_id === scope.tenant_id && record.organization_id === scope.organization_id); },
    async approvePolicy(id: string, scope: any, actorId: string) {
      const record = records.get(id);
      if (!record || record.tenant_id !== scope.tenant_id || record.organization_id !== scope.organization_id) return null;
      record.status = "APPROVED"; record.approved_by_user_id = actorId; record.version += 1; return record;
    },
    async retirePolicy() { return null; },
    async createSignoff(input: any) { const record = { ...input, status: "PENDING", version: 1 }; return record; },
    async listSignoffs() { return []; },
    async hasApprovedSignoff() { return false; },
    async approveSignoff(id: string) { return { signoff_record_id: id, policy_id: "policy", signoff_type: "PRIVACY_DATA_GOVERNANCE", status: "APPROVED", version: 2 }; },
  };
  const transaction = async (fn: any) => fn({});
  const auditWriter = async (input: any) => { audits.push(input); return input; };
  return { service: new ReportPublicDisclosurePolicyService(repo as any, transaction, auditWriter), records, audits };
}

const draftInput = {
  policy_key: CURRICULUM_DISCLOSURE_POLICY.policy_key,
  policy_version: 1,
  report_id: CURRICULUM_DISCLOSURE_POLICY.report_id,
  report_version: 1,
  policy_definition: {},
};

const structurallyCompleteDefinition = { ...APPROVED_CURRICULUM_POLICY_V1 };

test("policy authority creates a scoped curriculum DRAFT and ignores client approval fields", async () => {
  const { service, records, audits } = harness();
  const policy = await service.createPolicy({ ...draftInput, tenant_id: "attacker", organization_id: "attacker", status: "APPROVED", approved_by: "attacker", public_approved: true }, actor());
  assert.match(policy.policy_id, /^public_policy_/);
  assert.equal(policy.policy_key, "PUBLIC_AGGREGATE_EDUCATION_ACTIVITY");
  assert.equal(policy.report_id, "report.curriculum.lesson_completion_count.v1");
  assert.equal(policy.report_version, 1);
  assert.equal(policy.tenant_id, "tenant-curriculum");
  assert.equal(policy.organization_id, "org-curriculum");
  assert.equal(policy.created_by_user_id, "policy-governor-1");
  assert.equal(policy.status, "DRAFT");
  assert.equal(records.size, 1);
  assert.equal(audits[0].action_type, "report.public_disclosure_policy.created");
  assert.equal(JSON.stringify(policy).includes("public_approved"), false);
});

test("policy approval requires the approved values and every institutional sign-off", async () => {
  const { service } = harness();
  const policy = await service.createPolicy(draftInput, actor());
  await assert.rejects(() => service.approvePolicy(policy.policy_id, actor()), /incomplete|sign-off/i);
  await assert.rejects(() => service.createPolicy({ ...draftInput, report_id: "report.unknown.v1" }, actor()), /not authorized/);
  await assert.rejects(() => service.createPolicy({ ...draftInput, policy_key: "ALL_REPORTS" }, actor()), /not authorized/);
  await assert.rejects(() => service.createPolicy(draftInput, actor({ permissions: ["reports.public_disclosure.manage", "reports.public_eligibility.manage"] })), /permission/);
});

test("policy contract requires explicit safety dimensions without inventing values", () => {
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("minimum_group_size"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("cross_metric_combination_risk"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("suppression_required"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("display_mode"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("complementary_suppression_required"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("reconstruction_risk"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("freshness_rules"));
  assert.ok(REQUIRED_DISCLOSURE_RULES.includes("combination_risk_rules"));
  assert.match(migration, /status TEXT NOT NULL DEFAULT 'DRAFT'.*DRAFT.*APPROVED.*RETIRED/s);
  assert.match(migration, /policy_definition JSONB NOT NULL/);
  assert.match(migration, /UNIQUE \(tenant_id, organization_id, policy_key, policy_version\)/);
  assert.doesNotMatch(migration, /DO \$\$|plpython|CREATE FUNCTION|threshold INTEGER DEFAULT/);
  assert.match(publicContract, /approved minimum group size is `10`/);
  assert.match(publicContract, /SUPPRESSED_LT_10/);
});

test("policy routes and disclosure integration preserve separate authorities", () => {
  assert.match(permissions, /REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE: "reports\.public_disclosure_policy\.manage"/);
  assert.match(routes, /\/reporting\/public-disclosure-policies/);
  assert.match(routes, /REPORTS_PUBLIC_DISCLOSURE_POLICY_MANAGE/);
  assert.doesNotMatch(routes, /public_approved|PUBLICATION_AUTHORIZED|\/publish/);
  assert.match(disclosureService, /ReportPublicDisclosurePolicyRepo/);
  assert.match(disclosureService, /Approved disclosure policy is not available/);
  assert.doesNotMatch(disclosureService, /public_approved\s*=/);
});

test("schema closure represents all identified gaps without enabling approval", async () => {
  const { service, records } = harness();
  const policy = await service.createPolicy({ ...draftInput, policy_definition: structurallyCompleteDefinition }, actor());
  assert.equal(policy.status, "DRAFT");
  for (const key of REQUIRED_DISCLOSURE_RULES) assert.ok(Object.prototype.hasOwnProperty.call(policy.policy_definition, key), key);
  assert.match(schemaCompletionMigration, /institutional_signoff_required/);
  assert.match(schemaCompletionMigration, /report_public_disclosure_policy_signoffs/);
  assert.match(schemaCompletionMigration, /authority_reference TEXT NOT NULL/);
  assert.doesNotMatch(schemaCompletionMigration, /minimum_group_size[^\n]*DEFAULT\s+[0-9]+/i);
  await assert.rejects(() => service.approvePolicy(policy.policy_id, actor()), /sign-off/i);
  assert.equal(records.get(policy.policy_id).status, "DRAFT");
});

test("new structured rule shapes are validated and incomplete drafts remain non-authorizing", async () => {
  const { service } = harness();
  await assert.rejects(() => service.createPolicy({ ...draftInput, policy_definition: { display_mode: "EXACT" } }, actor()), /display mode/i);
  await assert.rejects(() => service.createPolicy({ ...draftInput, policy_definition: { complementary_suppression_required: "yes" } }, actor()), /boolean/i);
  await assert.rejects(() => service.createPolicy({ ...draftInput, policy_definition: { reconstruction_risk: [] } }, actor()), /object/i);
  const incomplete = await service.createPolicy({ ...draftInput, policy_definition: { display_mode: "RANGE" } }, actor());
  assert.equal(incomplete.status, "DRAFT");
  await assert.rejects(() => service.approvePolicy(incomplete.policy_id, actor()), /incomplete/i);
});

test("institutional sign-off is represented separately from the technical actor", async () => {
  const { service, audits } = harness();
  const policy = await service.createPolicy(draftInput, actor());
  const signoff = await service.createSignoff(policy.policy_id, { signoff_type: "PRIVACY_DATA_GOVERNANCE", authority_reference: "governance-decision-reference-pending" }, actor({ user_id: "technical-recorder" }));
  assert.equal(signoff.status, "PENDING");
  assert.equal(REQUIRED_SIGNOFF_TYPES.includes(signoff.signoff_type), true);
  assert.equal(signoff.authority_reference, "governance-decision-reference-pending");
  assert.equal(signoff.recorded_by_user_id, "technical-recorder");
  assert.equal(audits.some((audit) => audit.action_type === "report.public_disclosure_policy.signoff_recorded"), true);
});

test("approved v1 requires all institutional sign-offs and remains immutable", async () => {
  const { service, records, audits } = harness();
  const policy = await service.createPolicy({ ...draftInput, policy_definition: APPROVED_CURRICULUM_POLICY_V1 }, actor());
  for (const type of REQUIRED_SIGNOFF_TYPES) {
    const signoff = await service.createSignoff(policy.policy_id, { signoff_type: type, authority_reference: `${type}:approved` }, actor());
    signoff.status = "APPROVED";
  }
  const signoffs = REQUIRED_SIGNOFF_TYPES.map((signoff_type) => ({ signoff_type, status: "APPROVED" }));
  (service as any).repo.listSignoffs = async () => signoffs;
  const approved = await service.approvePolicy(policy.policy_id, actor());
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.policy_definition.minimum_group_size, 10);
  assert.equal(audits.some((audit) => audit.action_type === "report.public_disclosure_policy.approved"), true);
  assert.equal(records.get(policy.policy_id).status, "APPROVED");
});

test("approved Hub referral v1 is exact, scoped, and does not reuse curriculum policy", async () => {
  const { service, records, audits } = harness();
  const hubInput = {
    policy_key: "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY",
    policy_version: 1,
    report_id: "report.hub.referral.created_count.v1",
    report_version: 1,
    policy_definition: APPROVED_HUB_REFERRAL_POLICY_V1,
  };
  const policy = await service.createPolicy(hubInput, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" }));
  (service as any).repo.listSignoffs = async () => REQUIRED_SIGNOFF_TYPES.map((signoff_type) => ({ signoff_type, status: "APPROVED" }));
  const approved = await service.approvePolicy(policy.policy_id, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" }));
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.policy_key, "PUBLIC_AGGREGATE_HUB_REFERRAL_ACTIVITY");
  assert.equal(approved.policy_definition.minimum_group_size, 10);
  assert.deepEqual(approved.policy_definition.allowed_program_granularity, ["FOUNDATION_WIDE", "NAMED_HUB_PROGRAM"]);
  assert.equal(records.get(policy.policy_id).status, "APPROVED");
  assert.equal(audits.some((audit) => audit.action_type === "report.public_disclosure_policy.approved"), true);
  const wrongPolicy = await service.createPolicy({ ...hubInput, policy_definition: APPROVED_CURRICULUM_POLICY_V1 }, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" }));
  await assert.rejects(() => service.approvePolicy(wrongPolicy.policy_id, actor({ organization_id: "org-hub", tenant_id: "tenant-hub" })), /policy values/i);
});
