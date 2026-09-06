import { before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { OrganizationOnboardingService } from "../src/domain/organization-onboarding/service/organization-onboarding-service.ts";
import { ServiceCatalogService } from "../src/domain/service-catalog/service/service-catalog-service.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const RUN = `shfp4_${Date.now()}`;
const provider = "org_shf_001";
const applicantOrg = `org_${RUN}_applicant`;
const existingOrg = `org_${RUN}_existing`;
const otherOrg = `org_${RUN}_other`;
const reviewer = `user_${RUN}_reviewer`;
const applicant = `user_${RUN}_applicant`;
const noAuthority = `user_${RUN}_ordinary`;
const service = new OrganizationOnboardingService();
const catalog = new ServiceCatalogService();

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

const reviewerActor = actor(reviewer, provider, ["shf_admin"], [
  "organization.onboarding.submit",
  "organization.onboarding.view",
  "organization.onboarding.review",
  "organization.onboarding.activate",
  "organization.onboarding.suspend",
  "organization.onboarding.exit",
  "organization.relationship.manage",
  "organization.service_entitlement.view",
  "organization.service_entitlement.manage",
]);
const applicantActor = actor(applicant, applicantOrg, ["org_admin"], [
  "organization.onboarding.submit",
  "organization.onboarding.view",
  "reports.public_snapshot.view",
  "curriculum.catalog.manage",
]);
const ordinaryActor = actor(noAuthority, otherOrg, ["org_admin"], [
  "organization.onboarding.submit",
  "organization.onboarding.view",
]);

async function sideEffects(organizationId: string) {
  const result = await query(
    `SELECT table_name || ':' || row_count AS item
     FROM (
       SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id=$1
       UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id=$1
       UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id=$1
       UNION ALL SELECT 'grant_binders', COUNT(*)::text FROM grant_binders WHERE organization_id=$1
       UNION ALL SELECT 'exchange_funding_commitments', COUNT(*)::text FROM exchange_funding_commitments WHERE organization_id=$1 OR recipient_organization_id=$1
       UNION ALL SELECT 'studio_projects', COUNT(*)::text FROM projects WHERE organization_id=$1
       UNION ALL SELECT 'report_public_snapshots', COUNT(*)::text FROM report_public_snapshots WHERE organization_id=$1
     ) t ORDER BY table_name`,
    [organizationId],
  );
  return result.rows.map((row) => row.item).join("\n");
}

async function submit(input: any = {}) {
  return service.submitCase({
    organizationName: `Phase 4 Candidate ${RUN}`,
    organizationType: "INDEPENDENT_NETWORK",
    website: `${RUN}.example.org`,
    primaryContactName: "Phase Four Applicant",
    primaryContactEmail: `${RUN}@example.org`,
    requestedRelationshipType: "NETWORK_MEMBER_OF",
    requestedServices: ["curriculum", "reporting"],
    ...input,
  }, applicantActor);
}

before(async () => {
  await query("DELETE FROM organization_service_entitlements WHERE organization_id LIKE $1", [`org_onb_${RUN}%`]);
  await query("DELETE FROM organization_onboarding_cases WHERE onboarding_case_id LIKE $1", [`onb_${RUN}%`]);
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES
       ($1, 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
       ($2, 'Applicant Org', 'Applicant Org', 'INDEPENDENT_NETWORK', 'active', $5),
       ($3, 'Existing Org', 'Existing Org', 'INDEPENDENT_NETWORK', 'active', $6),
       ($4, 'Other Org', 'Other Org', 'INDEPENDENT_NETWORK', 'active', $7)
     ON CONFLICT (organization_id) DO NOTHING`,
    [provider, applicantOrg, existingOrg, otherOrg, `${RUN}.applicant.test`, `${RUN}.existing.test`, `${RUN}.other.test`],
  );
  await query(
    `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
     VALUES
       ($1,$4,$1 || '@test.invalid','Reviewer','active','test'),
       ($2,$5,$2 || '@test.invalid','Applicant','active','test'),
       ($3,$6,$3 || '@test.invalid','Ordinary','active','test')
     ON CONFLICT (user_id) DO NOTHING`,
    [reviewer, applicant, noAuthority, provider, applicantOrg, otherOrg],
  );
  for (const [roleId, roleName, scope] of [
    [`${RUN}_reviewer_role`, "shf_admin", "platform"],
    [`${RUN}_applicant_role`, "org_admin", "organization"],
  ] as const) {
    await withSeedRetry(() => query(
      `INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role)
       VALUES ($1, NULL, $2, $3, true)
       ON CONFLICT (role_id) DO NOTHING`,
      [roleId, roleName, scope],
    ));
  }
  const permissions = [
    [`${RUN}_rp1`, `${RUN}_reviewer_role`, "organization.onboarding.submit"],
    [`${RUN}_rp2`, `${RUN}_reviewer_role`, "organization.onboarding.view"],
    [`${RUN}_rp3`, `${RUN}_reviewer_role`, "organization.onboarding.review"],
    [`${RUN}_rp4`, `${RUN}_reviewer_role`, "organization.onboarding.activate"],
    [`${RUN}_rp5`, `${RUN}_reviewer_role`, "organization.onboarding.suspend"],
    [`${RUN}_rp6`, `${RUN}_reviewer_role`, "organization.onboarding.exit"],
    [`${RUN}_rp7`, `${RUN}_reviewer_role`, "organization.relationship.manage"],
    [`${RUN}_rp8`, `${RUN}_reviewer_role`, "organization.service_entitlement.view"],
    [`${RUN}_rp9`, `${RUN}_reviewer_role`, "organization.service_entitlement.manage"],
    [`${RUN}_rp10`, `${RUN}_applicant_role`, "organization.onboarding.submit"],
    [`${RUN}_rp11`, `${RUN}_applicant_role`, "organization.onboarding.view"],
    [`${RUN}_rp12`, `${RUN}_applicant_role`, "reports.public_snapshot.view"],
    [`${RUN}_rp13`, `${RUN}_applicant_role`, "curriculum.catalog.manage"],
  ];
  for (const [id, roleId, permission] of permissions) {
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
      `${RUN}_reviewer_membership`, reviewer, provider, `${RUN}_reviewer_role`,
      `${RUN}_applicant_membership`, applicant, applicantOrg, `${RUN}_applicant_role`,
      `${RUN}_ordinary_membership`, noAuthority, otherOrg,
    ],
  );
  await query(
    `INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type)
     VALUES
       ('svc_curriculum','curriculum','Curriculum','Curriculum infrastructure.','CURRICULUM','ACTIVE',$1,'NETWORK_ORGANIZATION','NETWORK_MEMBER_OF'),
       ('svc_reporting','reporting','Reporting','Reporting infrastructure.','REPORTING','ACTIVE',$1,'NETWORK_ORGANIZATION','NETWORK_MEMBER_OF'),
       ('svc_project_studio','project_studio','Project Studio','Project Studio infrastructure.','PROJECT_STUDIO','ACTIVE',$1,'NETWORK_ORGANIZATION','NETWORK_MEMBER_OF')
     ON CONFLICT (service_key) DO UPDATE SET status='ACTIVE', provider_organization_id=$1, requires_relationship_type='NETWORK_MEMBER_OF'`,
    [provider],
  );
});

test("submit validates relationship and requested services without creating canonical authority", async () => {
  await assert.rejects(() => submit({ requestedRelationshipType: "FREE_TEXT" }), /Unsupported requested relationship type/);
  await assert.rejects(() => submit({ requestedServices: ["missing_service"] }), /Unknown service/);
  await assert.rejects(() => submit({ status: "APPROVED" }), /server-derived/);

  const created = await submit();
  assert.equal(created.status, "SUBMITTED");
  assert.equal(created.activated_organization_id, null);
  assert.equal(created.services.length, 2);
  const relationships = await query("SELECT COUNT(*)::int AS count FROM organization_relationships WHERE source_organization_id = $1", [`org_${created.onboarding_case_id}`]);
  assert.equal(relationships.rows[0].count, 0);
});

test("approval and decline require governance authority and preserve decision history", async () => {
  const created = await submit({ website: `${RUN}-decline.example.org` });
  await assert.rejects(() => service.approveCase(created.onboarding_case_id, { approved_services: ["curriculum"] }, applicantActor), /review permission/);
  const declined = await service.declineCase(created.onboarding_case_id, { reason: "Incomplete intake" }, reviewerActor);
  assert.equal(declined.status, "DECLINED");
  const relationshipCount = await query("SELECT COUNT(*)::int AS count FROM organization_relationships WHERE source_organization_id = $1", [`org_${created.onboarding_case_id}`]);
  assert.equal(relationshipCount.rows[0].count, 0);
  const history = await query("SELECT decision FROM organization_onboarding_decisions WHERE onboarding_case_id=$1 ORDER BY decided_at", [created.onboarding_case_id]);
  assert.deepEqual(history.rows.map((row) => row.decision), ["SUBMITTED", "DECLINED"]);
});

test("existing organization activation reuses identity, provisions only approved services, and is idempotent", async () => {
  const before = await sideEffects(existingOrg);
  const created = await submit({ existingOrganizationId: existingOrg, requestedServices: ["curriculum", "reporting", "project_studio"], website: `${RUN}-reuse.example.org` });
  const approved = await service.approveCase(created.onboarding_case_id, {
    existingOrganizationId: existingOrg,
    approved_services: ["curriculum", "reporting"],
    reason: "Approved for network services",
  }, reviewerActor);
  assert.equal(approved.status, "APPROVED");
  const activated = await service.activateCase(created.onboarding_case_id, {}, reviewerActor);
  assert.equal(activated.activated_organization_id, existingOrg);
  assert.equal(activated.status, "ACTIVATED");
  const replayed = await service.activateCase(created.onboarding_case_id, {}, reviewerActor);
  assert.equal(replayed.activated_organization_id, existingOrg);

  const orgCount = await query("SELECT COUNT(*)::int AS count FROM organizations WHERE organization_id=$1", [existingOrg]);
  assert.equal(orgCount.rows[0].count, 1);
  const relationshipCount = await query(
    `SELECT COUNT(*)::int AS count FROM organization_relationships
     WHERE source_organization_id=$1 AND target_organization_id=$2 AND relationship_type='NETWORK_MEMBER_OF' AND status='ACTIVE'`,
    [existingOrg, provider],
  );
  assert.equal(relationshipCount.rows[0].count, 1);
  const entitlements = await query(
    `SELECT s.service_key, e.status, COUNT(*)::int AS count
     FROM organization_service_entitlements e
     JOIN service_catalog s ON s.service_id=e.service_id
     WHERE e.organization_id=$1 AND e.status='ACTIVE'
     GROUP BY s.service_key, e.status
     ORDER BY s.service_key`,
    [existingOrg],
  );
  assert.deepEqual(entitlements.rows.map((row) => row.service_key), ["curriculum", "reporting"]);
  assert.ok((await catalog.evaluateOrganizationServiceEntitlement({ organizationId: existingOrg, serviceKey: "reporting" })).allowed);
  assert.equal((await catalog.evaluateOrganizationServiceEntitlement({ organizationId: existingOrg, serviceKey: "project_studio" })).allowed, false);
  assert.equal(await sideEffects(existingOrg), before);
});

test("new organization activation creates canonical organization and can be suspended and exited", async () => {
  const created = await submit({ website: `${RUN}-new.example.org` });
  await service.approveCase(created.onboarding_case_id, { approved_services: ["curriculum", "reporting"] }, reviewerActor);
  const activated = await service.activateCase(created.onboarding_case_id, {}, reviewerActor);
  const organizationId = activated.activated_organization_id;
  assert.equal(organizationId, `org_${created.onboarding_case_id}`);
  assert.ok((await catalog.evaluateOrganizationServiceEntitlement({ organizationId, serviceKey: "reporting" })).allowed);

  const suspended = await service.suspendCase(created.onboarding_case_id, { reason: "Paused operations" }, reviewerActor);
  assert.equal(suspended.status, "SUSPENDED");
  assert.equal((await catalog.evaluateOrganizationServiceEntitlement({ organizationId, serviceKey: "reporting" })).allowed, false);

  const exited = await service.exitCase(created.onboarding_case_id, { reason: "Exited network" }, reviewerActor);
  assert.equal(exited.status, "EXITED");
  assert.equal((await catalog.evaluateOrganizationServiceEntitlement({ organizationId, serviceKey: "curriculum" })).allowed, false);
  const orgStillExists = await query("SELECT COUNT(*)::int AS count FROM organizations WHERE organization_id=$1", [organizationId]);
  assert.equal(orgStillExists.rows[0].count, 1);
});

test("provisioning failure leaves onboarding approved rather than falsely activated", async () => {
  const created = await submit({ requestedServices: ["reporting"], website: `${RUN}-failure.example.org` });
  await service.approveCase(created.onboarding_case_id, { approved_services: ["reporting"] }, reviewerActor);
  await query("UPDATE service_catalog SET status='INACTIVE' WHERE service_key='reporting'");
  await assert.rejects(() => service.activateCase(created.onboarding_case_id, {}, reviewerActor), /Service is not available/);
  await query("UPDATE service_catalog SET status='ACTIVE' WHERE service_key='reporting'");
  const current = await service.getCase(created.onboarding_case_id, reviewerActor);
  assert.equal(current.status, "APPROVED");
});

test("incubated onboarding creates an INCUBATES relationship without bulk service grants", async () => {
  const created = await submit({
    organizationType: "SHF_INCUBATED",
    requestedRelationshipType: "INCUBATES",
    requestedServices: [],
    website: `${RUN}-incubated.example.org`,
  });
  await service.approveCase(created.onboarding_case_id, { approved_services: [] }, reviewerActor);
  const activated = await service.activateCase(created.onboarding_case_id, {}, reviewerActor);
  const relationship = await query(
    `SELECT relationship_type, status FROM organization_relationships WHERE relationship_id=$1`,
    [activated.activation_relationship_id],
  );
  assert.deepEqual(relationship.rows[0], { relationship_type: "INCUBATES", status: "ACTIVE" });
  const entitlementCount = await query(
    `SELECT COUNT(*)::int AS count FROM organization_service_entitlements WHERE organization_id=$1`,
    [activated.activated_organization_id],
  );
  assert.equal(entitlementCount.rows[0].count, 0);
});

test("cross-org onboarding management fails closed", async () => {
  const created = await submit({ website: `${RUN}-cross.example.org` });
  assert.equal(await service.getCase(created.onboarding_case_id, ordinaryActor), null);
  await assert.rejects(() => service.activateCase(created.onboarding_case_id, {}, ordinaryActor), /activation permission/);
});
