import { before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { FundingGrantService } from "../src/domain/funding-grants/service/funding-grant-service.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const RUN = `shfp5_${Date.now()}`;
const shf = "org_shf_001";
const shs = "org_shs_001";
const funder = `org_${RUN}_funder`;
const orgA = `org_${RUN}_network_a`;
const orgB = `org_${RUN}_network_b`;
const fundingUser = `user_${RUN}_funding`;
const orgAUser = `user_${RUN}_orga`;
const orgBUser = `user_${RUN}_orgb`;
const programA = `program_${RUN}_a`;
const programB = `program_${RUN}_b`;
const service = new FundingGrantService();

function actor(userId: string, organizationId: string, roles: string[], permissions: string[]) {
  return {
    user_id: userId,
    active_organization_id: organizationId,
    organization_id: organizationId,
    tenant_id: `tenant:${organizationId}`,
    roles,
    permissions,
  };
}

const fundingActor = actor(fundingUser, shf, ["shf_admin"], ["funding.grant.view", "funding.grant.manage"]);
const orgAViewer = actor(orgAUser, orgA, ["org_admin"], ["funding.grant.view"]);
const orgAMutationAttempt = actor(orgAUser, orgA, ["org_admin"], ["funding.grant.view"]);
const orgBViewer = actor(orgBUser, orgB, ["org_admin"], ["funding.grant.view"]);

async function sideEffects() {
  const result = await query(
    `SELECT table_name || ':' || row_count AS item
     FROM (
       SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'projects', COUNT(*)::text FROM projects WHERE organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'organization_service_entitlements', COUNT(*)::text FROM organization_service_entitlements WHERE organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'organization_onboarding_cases', COUNT(*)::text FROM organization_onboarding_cases WHERE submitted_by_user_id IN ($4,$5,$6)
       UNION ALL SELECT 'exchange_funding_commitments', COUNT(*)::text FROM exchange_funding_commitments WHERE organization_id IN ($1,$2,$3) OR recipient_organization_id IN ($1,$2,$3)
       UNION ALL SELECT 'grant_binders', COUNT(*)::text FROM grant_binders WHERE organization_id IN ($1,$2,$3)
     ) t ORDER BY table_name`,
    [shf, orgA, orgB, fundingUser, orgAUser, orgBUser],
  );
  return result.rows.map((row) => row.item).join("\n");
}

async function createGrant(input: any = {}) {
  return service.createGrant({
    title: `Phase 5 Award ${RUN}`,
    grantNumber: `P5-${RUN}`,
    funderOrganizationId: funder,
    recipientOrganizationId: shf,
    reportingOrganizationId: shf,
    awardAmount: "100000.00",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    purpose: "Network program support",
    restrictionType: "UNRESTRICTED",
    ...input,
  }, fundingActor);
}

before(async () => {
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES
       ($1,'Silicon Heartland Foundation','Silicon Heartland Foundation','SHF','active','siliconheartland.org'),
       ($2,'Silicon Heartland Solutions','Silicon Heartland Solutions','SHS','active','siliconheartlandsolutions.com'),
       ($3,'External Foundation','External Foundation','FOUNDATION','active','external.example.org'),
       ($4,'Network Org A','Network Org A','INDEPENDENT_NETWORK','active',$6),
       ($5,'Network Org B','Network Org B','INDEPENDENT_NETWORK','active',$7)
     ON CONFLICT (organization_id) DO NOTHING`,
    [shf, shs, funder, orgA, orgB, `${RUN}.a.example.org`, `${RUN}.b.example.org`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES
       ($1,$4,$1 || '@test.invalid','Funding Actor','active','test'),
       ($2,$5,$2 || '@test.invalid','Org A Admin','active','test'),
       ($3,$6,$3 || '@test.invalid','Org B Admin','active','test')
     ON CONFLICT (user_id) DO NOTHING`,
    [fundingUser, orgAUser, orgBUser, shf, orgA, orgB],
  );
  for (const [roleId, roleName, scope] of [
    [`${RUN}_funding_role`, "shf_admin", "platform"],
    [`${RUN}_org_role`, "org_admin", "organization"],
  ] as const) {
    await withSeedRetry(() => query(
      `INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role)
       VALUES ($1, NULL, $2, $3, true) ON CONFLICT (role_id) DO NOTHING`,
      [roleId, roleName, scope],
    ));
  }
  for (const [id, roleId, permission] of [
    [`${RUN}_funding_view`, `${RUN}_funding_role`, "funding.grant.view"],
    [`${RUN}_funding_manage`, `${RUN}_funding_role`, "funding.grant.manage"],
    [`${RUN}_orga_view`, `${RUN}_org_role`, "funding.grant.view"],
  ] as const) {
    await query(
      `INSERT INTO role_permissions (role_permission_id, role_id, permission_name)
       VALUES ($1,$2,$3) ON CONFLICT (role_permission_id) DO NOTHING`,
      [id, roleId, permission],
    );
  }
  await query(
    `INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from)
     VALUES
       ($1,$2,$3,$4,'active',NOW()),
       ($5,$6,$7,$8,'active',NOW()),
       ($9,$10,$11,$8,'active',NOW())
     ON CONFLICT (membership_id) DO NOTHING`,
    [
      `${RUN}_funding_membership`, fundingUser, shf, `${RUN}_funding_role`,
      `${RUN}_orga_membership`, orgAUser, orgA, `${RUN}_org_role`,
      `${RUN}_orgb_membership`, orgBUser, orgB,
    ],
  );
  await query(
    `INSERT INTO programs (
       program_id, organization_id, name, program_type, status, created_by_user_id,
       program_classification, owner_organization_id, operator_organization_id, accountable_organization_id
     ) VALUES
       ($1,$3,'Program A','education','active',$5,'SHF_OWNED',$3,$4,$3),
       ($2,$4,'Program B','education','active',$6,'INDEPENDENT_NETWORK',$4,$4,$4)
     ON CONFLICT (program_id) DO NOTHING`,
    [programA, programB, shf, orgA, fundingUser, orgAUser],
  );
});

test("authorized funding actor records award with explicit funder, recipient, and reporting organization", async () => {
  const before = await sideEffects();
  const grant = await createGrant();
  assert.equal(grant.status, "AWARDED");
  assert.equal(grant.funder_organization_id, funder);
  assert.equal(grant.recipient_organization_id, shf);
  assert.equal(grant.reporting_organization_id, shf);
  assert.equal(String(grant.award_amount), "100000.00");
  assert.equal(await sideEffects(), before);
  await assert.rejects(() => createGrant({ createdByUserId: "browser", status: "ACTIVE" }), /server-derived/);
});

test("ordinary organization actor cannot create or mutate grant records", async () => {
  await assert.rejects(() => service.createGrant({
    title: "Unauthorized",
    funderOrganizationId: funder,
    recipientOrganizationId: orgA,
    reportingOrganizationId: orgA,
    awardAmount: "1.00",
    startDate: "2026-01-01",
  }, orgAMutationAttempt), /management permission/);
});

test("external funder does not need network membership and independent organization may be recipient", async () => {
  const grant = await createGrant({
    title: "Direct Independent Award",
    recipientOrganizationId: orgB,
    reportingOrganizationId: orgB,
    awardAmount: "50000.00",
  });
  assert.equal(grant.funder_organization_id, funder);
  assert.equal(grant.recipient_organization_id, orgB);
  assert.notEqual(grant.recipient_organization_id, shf);
});

test("program allocations preserve operator and derive remaining balance", async () => {
  const grant = await createGrant({ title: "Operator Distinction Award" });
  const allocated = await service.createAllocation(grant.grant_id, {
    programId: programA,
    allocatedAmount: "60000.00",
    purpose: "Program A support",
  }, fundingActor);
  assert.equal(String(allocated.allocated_amount), "60000.00");
  assert.equal(String(allocated.remaining_amount), "40000.00");
  assert.equal(allocated.allocations[0].operator_organization_id, orgA);

  const program = await query("SELECT operator_organization_id FROM programs WHERE program_id=$1", [programA]);
  assert.equal(program.rows[0].operator_organization_id, orgA);

  const visibleToOrgA = await service.getGrant(grant.grant_id, orgAViewer);
  assert.equal(visibleToOrgA.grant_id, grant.grant_id);
  await assert.rejects(() => service.createAllocation(grant.grant_id, { programId: programB, allocatedAmount: "1.00" }, orgAMutationAttempt), /management permission/);
});

test("multi-program allocation cannot exceed award amount", async () => {
  const grant = await createGrant({ title: "Multi Program Award" });
  const first = await service.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "40000.00" }, fundingActor);
  assert.equal(String(first.remaining_amount), "60000.00");
  const second = await service.createAllocation(grant.grant_id, { programId: programB, allocatedAmount: "30000.00" }, fundingActor);
  assert.equal(String(second.remaining_amount), "30000.00");
  await assert.rejects(
    () => service.createAllocation(grant.grant_id, { programId: `program_${RUN}_overflow`, allocatedAmount: "20000.00" }, fundingActor),
    /Program not found/,
  );
  const programC = `program_${RUN}_c`;
  await query(
    `INSERT INTO programs (program_id, organization_id, name, program_type, status, created_by_user_id, program_classification, owner_organization_id, operator_organization_id, accountable_organization_id)
     VALUES ($1,$2,'Program C','education','active',$3,'INDEPENDENT_NETWORK',$2,$2,$2)`,
    [programC, orgB, fundingUser],
  );
  await assert.rejects(() => service.createAllocation(grant.grant_id, { programId: programC, allocatedAmount: "40000.00" }, fundingActor), /cannot exceed/);
});

test("program restriction is deterministically enforced", async () => {
  const grant = await createGrant({
    title: "Program Restricted Award",
    restrictionType: "PROGRAM_RESTRICTED",
    restrictedProgramId: programA,
  });
  await assert.rejects(() => service.createAllocation(grant.grant_id, { programId: programB, allocatedAmount: "1000.00" }, fundingActor), /restricted to a different program/);
  const allocated = await service.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "1000.00" }, fundingActor);
  assert.equal(allocated.allocations[0].program_id, programA);
});

test("closed and cancelled grants preserve history and block new allocations after closure", async () => {
  const grant = await createGrant({ title: "Closed Award" });
  await service.transitionGrant(grant.grant_id, { status: "ACTIVE" }, fundingActor);
  const closed = await service.transitionGrant(grant.grant_id, { status: "CLOSED" }, fundingActor);
  assert.equal(closed.status, "CLOSED");
  await assert.rejects(() => service.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "1.00" }, fundingActor), /Closed or cancelled/);
  const visible = await service.getGrant(grant.grant_id, fundingActor);
  assert.equal(visible.status, "CLOSED");

  const cancelled = await createGrant({ title: "Cancelled Award" });
  await service.transitionGrant(cancelled.grant_id, { status: "CANCELLED" }, fundingActor);
  const preserved = await service.getGrant(cancelled.grant_id, fundingActor);
  assert.equal(preserved.status, "CANCELLED");
});

test("cross-organization grant listing fails closed", async () => {
  const grant = await createGrant({ title: "Org A Only Award" });
  await service.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "1000.00" }, fundingActor);
  const orgAItems = await service.listGrants(orgAViewer);
  assert.ok(orgAItems.some((item) => item.grant_id === grant.grant_id));
  const orgBItems = await service.listGrants(orgBViewer);
  assert.equal(orgBItems.some((item) => item.grant_id === grant.grant_id), false);
});

test("reporting organization may differ from operator, and funding creates no impact or SHS side effects", async () => {
  const before = await sideEffects();
  const grant = await createGrant({
    title: "Reporting Distinction Award",
    recipientOrganizationId: shf,
    reportingOrganizationId: shf,
  });
  await service.createAllocation(grant.grant_id, { programId: programA, allocatedAmount: "5000.00" }, fundingActor);
  const hydrated = await service.getGrant(grant.grant_id, fundingActor);
  assert.equal(hydrated.reporting_organization_id, shf);
  assert.equal(hydrated.allocations[0].operator_organization_id, orgA);
  assert.equal(await sideEffects(), before);
  const shsRecords = await query(
    `SELECT COUNT(*)::int AS count FROM funding_grants
     WHERE grant_id=$1 AND (funder_organization_id=$2 OR recipient_organization_id=$2 OR reporting_organization_id=$2)`,
    [grant.grant_id, shs],
  );
  assert.equal(shsRecords.rows[0].count, 0);
});

test("migration 086 defines canonical grant and allocation integrity", async () => {
  const migration = await import("node:fs").then((fs) => fs.readFileSync(new URL("../migrations/086_funding_grants_restricted_funds.sql", import.meta.url), "utf8"));
  assert.match(migration, /CREATE TABLE IF NOT EXISTS funding_grants/);
  assert.match(migration, /funder_organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /recipient_organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /reporting_organization_id TEXT NOT NULL REFERENCES organizations/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS grant_program_allocations/);
  assert.match(migration, /allocated_amount NUMERIC/);
  assert.match(migration, /funding_grants_parties_distinct/);
});
