import { before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { requirePermission } from "../src/auth/permission-guard.ts";
import { requireOrganizationServiceEntitlement } from "../src/auth/service-entitlement-guard.ts";
import { ServiceAgreementService } from "../src/domain/service-agreements/service/service-agreement-service.ts";
import { ServiceCatalogService } from "../src/domain/service-catalog/service/service-catalog-service.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const RUN = `shfp6_${Date.now()}`;
const providerUser = `user_${RUN}_provider`;
const consumerAdmin = `user_${RUN}_consumer_admin`;
const otherAdmin = `user_${RUN}_other_admin`;
const consumerOrg = `org_${RUN}_consumer`;
const otherOrg = `org_${RUN}_other`;
const relId = `rel_${RUN}_network`;
const otherRelId = `rel_${RUN}_other`;

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

const providerActor = actor(providerUser, "org_shf_001", ["shf_admin"], [
  "organization.service_entitlement.view",
  "organization.service_entitlement.manage",
  "service.agreement.view",
  "service.agreement.manage",
  "service.agreement.approve",
  "service.agreement.activate",
  "reports.view",
  "studio.project.view",
]);
const consumerViewActor = actor(consumerAdmin, consumerOrg, ["org_admin"], [
  "organization.service_entitlement.view",
  "service.agreement.view",
  "reports.view",
  "studio.project.view",
]);
const consumerSelfActivationActor = actor(consumerAdmin, consumerOrg, ["org_admin"], [
  "organization.service_entitlement.view",
  "organization.service_entitlement.manage",
  "service.agreement.view",
  "service.agreement.manage",
  "service.agreement.approve",
  "service.agreement.activate",
  "reports.view",
]);
const otherViewActor = actor(otherAdmin, otherOrg, ["org_admin"], [
  "organization.service_entitlement.view",
  "service.agreement.view",
  "reports.view",
]);

async function cleanup() {
  await query("DELETE FROM audit_events WHERE actor_user_id = ANY($1::text[]) OR target_object_id LIKE $2", [[providerUser, consumerAdmin, otherAdmin], `svcagr_${RUN}%`]);
  await query("DELETE FROM service_agreement_versions WHERE agreement_id IN (SELECT agreement_id FROM service_agreements WHERE consumer_organization_id = ANY($1::text[]))", [[consumerOrg, otherOrg]]);
  await query("DELETE FROM service_agreements WHERE consumer_organization_id = ANY($1::text[]) OR provider_organization_id = ANY($1::text[])", [[consumerOrg, otherOrg]]);
  await query("DELETE FROM organization_service_entitlements WHERE organization_id = ANY($1::text[]) OR reason = $2", [[consumerOrg, otherOrg], RUN]);
  await query("DELETE FROM organization_relationships WHERE relationship_id = ANY($1::text[])", [[relId, otherRelId]]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[providerUser, consumerAdmin, otherAdmin]]);
  await query("DELETE FROM organizations WHERE organization_id = ANY($1::text[])", [[consumerOrg, otherOrg]]);
}

async function sideEffectCounts() {
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM prepare_prove_evidence WHERE organization_id = $1) AS evidence,
       (SELECT COUNT(*)::int FROM funding_grants WHERE recipient_organization_id = $1 OR funder_organization_id = $1 OR reporting_organization_id = $1) AS grants,
       (SELECT COUNT(*)::int FROM grant_program_allocations gpa JOIN funding_grants fg ON fg.grant_id = gpa.grant_id WHERE fg.recipient_organization_id = $1 OR fg.funder_organization_id = $1 OR fg.reporting_organization_id = $1) AS allocations,
       (SELECT COUNT(*)::int FROM organization_onboarding_cases WHERE existing_organization_id = $1 OR activated_organization_id = $1 OR organization_name = $2) AS onboarding,
       (SELECT COUNT(*)::int FROM credential_definitions WHERE name = $2) AS credentials`,
    [consumerOrg, RUN],
  );
  return res.rows[0];
}

before(async () => {
  await cleanup();
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES ('org_shf_001', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org')
     ON CONFLICT (organization_id) DO NOTHING`,
  );
  await query(
    `INSERT INTO service_catalog (
       service_id, service_key, name, description, category, status,
       provider_organization_id, audience, requires_relationship_type, agreement_requirement
     )
     VALUES
       ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum infrastructure.', 'CURRICULUM', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'NO_AGREEMENT_REQUIRED'),
       ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED'),
       ('svc_project_studio', 'project_studio', 'Project Studio', 'Project Studio infrastructure.', 'PROJECT_STUDIO', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED')
     ON CONFLICT (service_key) DO UPDATE SET
       status='ACTIVE',
       provider_organization_id='org_shf_001',
       requires_relationship_type='NETWORK_MEMBER_OF',
       agreement_requirement=EXCLUDED.agreement_requirement`,
  );
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES
       ($1, $3, $3, 'INDEPENDENT_NETWORK', 'active', 'phase6.test'),
       ($2, $4, $4, 'INDEPENDENT_NETWORK', 'active', 'phase6-other.test')
     ON CONFLICT (organization_id) DO NOTHING`,
    [consumerOrg, otherOrg, `Phase 6 Consumer ${RUN}`, `Phase 6 Other ${RUN}`],
  );
  for (const [userId, organizationId] of [
    [providerUser, "org_shf_001"],
    [consumerAdmin, consumerOrg],
    [otherAdmin, otherOrg],
  ] as const) {
    await withSeedRetry(() =>
      query(
        `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
         VALUES ($1, $2, $3, 'SHF Phase 6 Test User', 'active', 'local')
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, organizationId, `${userId}@test.invalid`],
      ),
    );
  }
  await query(
    `INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, created_by, updated_by)
     VALUES
       ($1,$3,'org_shf_001','NETWORK_MEMBER_OF','ACTIVE',NOW(),$5,$5),
       ($2,$4,'org_shf_001','NETWORK_MEMBER_OF','ACTIVE',NOW(),$5,$5)
     ON CONFLICT DO NOTHING`,
    [relId, otherRelId, consumerOrg, otherOrg, providerUser],
  );
});

test("authorized provider actor creates draft agreement with explicit provider, consumer, service, and terms", async () => {
  const agreements = new ServiceAgreementService();
  const created = await agreements.createAgreement({
    consumerOrganizationId: consumerOrg,
    serviceKey: "reporting",
    serviceScope: "Reporting operations",
    supportLevel: "Standard",
    serviceExpectations: { responseTarget: "2 business days", reportingFrequency: "Monthly" },
    agreementReference: "phase6-reference",
    reason: RUN,
  }, providerActor);
  assert.equal(created.provider_organization_id, "org_shf_001");
  assert.equal(created.consumer_organization_id, consumerOrg);
  assert.equal(created.service_key, "reporting");
  assert.equal(created.status, "DRAFT");
  assert.equal(created.support_level, "Standard");
  assert.equal(created.source_relationship_id, relId);
});

test("browser cannot manufacture provider or approval authority fields", async () => {
  const agreements = new ServiceAgreementService();
  await assert.rejects(
    () => agreements.createAgreement({
      consumerOrganizationId: consumerOrg,
      serviceKey: "reporting",
      providerOrganizationId: otherOrg,
      approvedByUserId: consumerAdmin,
    }, providerActor),
    /server-derived/i,
  );
});

test("draft agreement and entitlement alone do not authorize agreement-required service", async () => {
  const catalog = new ServiceCatalogService();
  await catalog.grantEntitlement(consumerOrg, { service_key: "reporting", reason: RUN }, providerActor);
  const evaluated = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" });
  assert.equal(evaluated.allowed, false);
  assert.equal(evaluated.result, "DENIED_AGREEMENT_REQUIRED");
});

test("approval and activation require active matching entitlement and preserve runtime permission composition", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "project_studio", serviceScope: "Studio operations", supportLevel: "Standard", reason: RUN }, providerActor);
  await catalog.grantEntitlement(consumerOrg, { service_key: "project_studio", reason: RUN }, providerActor);
  const approved = await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  assert.equal(approved?.updated.status, "APPROVED");
  const activated = await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  assert.equal(activated?.updated.status, "ACTIVE");
  assert.ok(activated?.updated.source_entitlement_id);

  const allowed = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "project_studio" });
  assert.equal(allowed.allowed, true);

  let permissionStatus = 0;
  requirePermission("studio.project.update")({ user: { ...consumerViewActor, permissions: ["service.agreement.view"] } } as any, {
    status(code: number) { permissionStatus = code; return this; },
    json() { return this; },
  } as any, () => { throw new Error("permission should not pass"); });
  assert.equal(permissionStatus, 403);
});

test("suspension denies agreement-governed runtime service and reactivation restores it", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Reporting operations", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  assert.equal((await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" })).allowed, true);

  await agreements.suspendAgreement(created.agreement_id, { reason: RUN }, providerActor);
  const suspended = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" });
  assert.equal(suspended.allowed, false);
  assert.equal(suspended.result, "DENIED_AGREEMENT_SUSPENDED");

  await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  assert.equal((await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" })).allowed, true);
  await agreements.terminateAgreement(created.agreement_id, { reason: RUN }, providerActor);
});

test("termination denies future service and preserves agreement history", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Termination test", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await agreements.terminateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  const denied = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" });
  assert.equal(denied.allowed, false);
  assert.equal(denied.result, "DENIED_AGREEMENT_TERMINATED");
  const readable = await agreements.getAgreement(created.agreement_id, consumerViewActor);
  assert.equal(readable?.status, "TERMINATED");
});

test("active agreement never overrides revoked entitlement", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Revocation test", supportLevel: "Standard", reason: RUN }, providerActor);
  const entitlement = await catalog.grantEntitlement(consumerOrg, { service_key: "reporting", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await catalog.transitionEntitlement(consumerOrg, entitlement.entitlement.entitlement_id, { status: "REVOKED", reason: RUN }, providerActor);
  const denied = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "reporting" });
  assert.equal(denied.allowed, false);
  assert.equal(denied.result, "DENIED_REVOKED");
  await agreements.terminateAgreement(created.agreement_id, { reason: RUN }, providerActor);
});

test("ordinary consumer organization cannot self-activate provider service terms", async () => {
  const agreements = new ServiceAgreementService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Self activation test", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await assert.rejects(
    () => agreements.activateAgreement(created.agreement_id, { reason: RUN }, consumerSelfActivationActor),
    /Only the service provider or platform authority/,
  );
});

test("cross-organization agreement reads fail closed", async () => {
  const agreements = new ServiceAgreementService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Isolation test", supportLevel: "Standard", reason: RUN }, providerActor);
  await assert.rejects(
    () => agreements.getAgreement(created.agreement_id, otherViewActor),
    /Cannot read another organization's service agreement/,
  );
});

test("duplicate conflicting active agreements are prevented", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  await catalog.grantEntitlement(otherOrg, { service_key: "reporting", reason: RUN }, providerActor);
  const first = await agreements.createAgreement({ consumerOrganizationId: otherOrg, serviceKey: "reporting", serviceScope: "First", supportLevel: "Standard", reason: RUN }, providerActor);
  const second = await agreements.createAgreement({ consumerOrganizationId: otherOrg, serviceKey: "reporting", serviceScope: "Second", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.approveAgreement(first.agreement_id, { reason: RUN }, providerActor);
  await agreements.activateAgreement(first.agreement_id, { reason: RUN }, providerActor);
  await agreements.approveAgreement(second.agreement_id, { reason: RUN }, providerActor);
  await assert.rejects(
    () => agreements.activateAgreement(second.agreement_id, { reason: RUN }, providerActor),
    /conflicting active service agreement/,
  );
});

test("amendment creates a new version and preserves previous terms", async () => {
  const agreements = new ServiceAgreementService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Version one", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.amendAgreement(created.agreement_id, { serviceScope: "Version two", supportLevel: "Enhanced", reason: "Phase 6 amendment" }, providerActor);
  const versions = await agreements.listVersions(created.agreement_id, providerActor);
  assert.equal(versions?.length, 2);
  assert.equal(versions?.[0].service_scope, "Version one");
  assert.equal(versions?.[1].service_scope, "Version two");
});

test("no-agreement-required service remains functional with entitlement and permission", async () => {
  const catalog = new ServiceCatalogService();
  await catalog.grantEntitlement(consumerOrg, { service_key: "curriculum", reason: RUN }, providerActor);
  const evaluated = await catalog.evaluateOrganizationServiceEntitlement({ organizationId: consumerOrg, serviceKey: "curriculum" });
  assert.equal(evaluated.allowed, true);
});

test("inactive required relationship blocks activation", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "project_studio", serviceScope: "Relationship test", supportLevel: "Standard", reason: RUN }, providerActor);
  await catalog.grantEntitlement(consumerOrg, { service_key: "project_studio", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await query("UPDATE organization_relationships SET status='SUSPENDED', updated_at=NOW() WHERE relationship_id=$1", [relId]);
  await assert.rejects(
    () => agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor),
    /active eligible organization relationship/,
  );
  await query("UPDATE organization_relationships SET status='ACTIVE', updated_at=NOW() WHERE relationship_id=$1", [relId]);
});

test("representative route composition requires entitlement, active agreement, and actor permission", async () => {
  const agreements = new ServiceAgreementService();
  const catalog = new ServiceCatalogService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Route composition", supportLevel: "Standard", reason: RUN }, providerActor);
  await catalog.grantEntitlement(consumerOrg, { service_key: "reporting", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  await agreements.activateAgreement(created.agreement_id, { reason: RUN }, providerActor);

  let entitlementStatus = 0;
  await requireOrganizationServiceEntitlement("reporting")({ user: consumerViewActor } as any, {
    status(code: number) { entitlementStatus = code; return this; },
    json() { return this; },
  } as any, () => {});
  assert.equal(entitlementStatus, 0);

  let permissionStatus = 0;
  requirePermission("reports.export")({ user: consumerViewActor } as any, {
    status(code: number) { permissionStatus = code; return this; },
    json() { return this; },
  } as any, () => { throw new Error("permission should not pass"); });
  assert.equal(permissionStatus, 403);
});

test("agreement actions do not create funding, onboarding, credential, or evidence side effects", async () => {
  const beforeCounts = await sideEffectCounts();
  const agreements = new ServiceAgreementService();
  const created = await agreements.createAgreement({ consumerOrganizationId: consumerOrg, serviceKey: "reporting", serviceScope: "Side effects", supportLevel: "Standard", reason: RUN }, providerActor);
  await agreements.approveAgreement(created.agreement_id, { reason: RUN }, providerActor);
  const afterCounts = await sideEffectCounts();
  assert.deepEqual(afterCounts, beforeCounts);
});
