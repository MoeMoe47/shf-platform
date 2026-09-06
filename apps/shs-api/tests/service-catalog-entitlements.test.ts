import { before, test } from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.ts";
import { ServiceCatalogService } from "../src/domain/service-catalog/service/service-catalog-service.ts";
import { SERVICE_KEYS } from "../src/domain/service-catalog/model/service-catalog.ts";
import { requirePermission } from "../src/auth/permission-guard.ts";
import { withSeedRetry } from "./helpers/seed-retry.ts";

const RUN = `shfp3_${Date.now()}`;
const shfAdmin = `user_${RUN}_shf_admin`;
const orgAdmin = `user_${RUN}_org_admin`;
const partnerAdmin = `user_${RUN}_partner_admin`;
const student = `user_${RUN}_student`;
const networkOrg = `org_${RUN}_network`;

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

const shfGrantActor = actor(shfAdmin, "org_shf_001", ["shf_admin"], [
  "organization.service_entitlement.view",
  "organization.service_entitlement.manage",
]);
const partnerReadActor = actor(partnerAdmin, networkOrg, ["org_admin"], [
  "organization.service_entitlement.view",
]);
const partnerManageAttempt = actor(partnerAdmin, networkOrg, ["org_admin"], [
  "organization.service_entitlement.view",
  "organization.service_entitlement.manage",
]);

async function cleanup() {
  await query("DELETE FROM organization_service_entitlements WHERE organization_id = $1 OR reason = $2", [networkOrg, RUN]);
  await query("DELETE FROM organization_relationships WHERE relationship_id LIKE $1", [`rel_${RUN}%`]);
  await query("DELETE FROM users WHERE user_id = ANY($1::text[])", [[orgAdmin, partnerAdmin, student]]);
  await query("DELETE FROM organizations WHERE organization_id = $1", [networkOrg]);
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
       provider_organization_id, audience, requires_relationship_type
     )
     VALUES
       ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum infrastructure.', 'CURRICULUM', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
       ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
       ('svc_project_studio', 'project_studio', 'Project Studio', 'Project Studio infrastructure.', 'PROJECT_STUDIO', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
       ('svc_truth_evidence', 'truth_evidence', 'Truth / Evidence', 'Truth and Evidence infrastructure.', 'TRUTH_EVIDENCE', 'ACTIVE', 'org_shf_001', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF')
     ON CONFLICT (service_key) DO UPDATE SET status='ACTIVE', provider_organization_id='org_shf_001', requires_relationship_type='NETWORK_MEMBER_OF'`,
  );
  await query(
    `INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status, granted_by_user_id, reason)
     SELECT 'ent_shf_' || service_key, provider_organization_id, service_id, 'ACTIVE', NULL, 'SHF compatibility test bootstrap'
     FROM service_catalog
     WHERE provider_organization_id='org_shf_001'
     ON CONFLICT DO NOTHING`,
  );
  await query(
    `INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain)
     VALUES ($1, $2, $2, 'INDEPENDENT_NETWORK', 'active', 'phase3.test')
     ON CONFLICT (organization_id) DO NOTHING`,
    [networkOrg, `Phase 3 Network ${RUN}`],
  );
  for (const [userId, organizationId] of [
    [shfAdmin, "org_shf_001"],
    [orgAdmin, "org_shf_001"],
    [partnerAdmin, networkOrg],
    [student, "org_shf_001"],
  ] as const) {
    await withSeedRetry(() =>
      query(
        `INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source)
         VALUES ($1, $2, $3, 'SHF Phase 3 Test User', 'active', 'local')
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, organizationId, `${userId}@test.invalid`],
      ),
    );
  }
});

test("service catalog exposes stable keys, active services, and provider identity", async () => {
  const service = new ServiceCatalogService();
  const services = await service.listServices(shfGrantActor);
  const curriculum = services.find((item) => item.service_key === SERVICE_KEYS.CURRICULUM);
  assert.ok(curriculum);
  assert.equal(curriculum.provider_organization_id, "org_shf_001");
  assert.equal(curriculum.status, "ACTIVE");

  await assert.rejects(
    () => query("INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id) VALUES ($1,'curriculum','Renamed','duplicate','CURRICULUM','ACTIVE','org_shf_001')", [`svc_${RUN}_dup`]),
    /duplicate key|service_catalog_key_unique/i,
  );
});

test("display rename does not alter service key", async () => {
  const row = await query("SELECT service_id, service_key FROM service_catalog WHERE service_key='curriculum'");
  assert.equal(row.rows[0].service_key, "curriculum");
  await query("UPDATE service_catalog SET name=$1 WHERE service_key='curriculum'", [`Curriculum ${RUN}`]);
  const renamed = await query("SELECT service_id, service_key, name FROM service_catalog WHERE service_id=$1", [row.rows[0].service_id]);
  assert.equal(renamed.rows[0].service_key, "curriculum");
  await query("UPDATE service_catalog SET name='Curriculum' WHERE service_key='curriculum'");
});

test("NETWORK_MEMBER_OF alone does not grant service access", async () => {
  await query(
    `INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, created_by, updated_by)
     VALUES ($1,$3,'org_shf_001','NETWORK_MEMBER_OF','ACTIVE',NOW(),$2,$2)
     ON CONFLICT DO NOTHING`,
    [`rel_${RUN}_network_only`, shfAdmin, networkOrg],
  );
  const service = new ServiceCatalogService();
  const result = await service.evaluateOrganizationServiceEntitlement({ organizationId: networkOrg, serviceKey: "reporting" });
  assert.equal(result.allowed, false);
  assert.equal(result.result, "DENIED_NO_ENTITLEMENT");
});

test("active relationship plus active entitlement allows no-agreement service entitlement stage only", async () => {
  const service = new ServiceCatalogService();
  const granted = await service.grantEntitlement(networkOrg, { service_key: "curriculum", reason: RUN }, shfGrantActor);
  assert.equal(granted.entitlement.status, "ACTIVE");
  const evaluated = await service.evaluateOrganizationServiceEntitlement({ organizationId: networkOrg, serviceKey: "curriculum" });
  assert.equal(evaluated.allowed, true);

  let permissionStatus = 0;
  requirePermission("reports.view")({ user: { ...partnerReadActor, permissions: ["organization.service_entitlement.view"] } } as any, {
    status(code: number) { permissionStatus = code; return this; },
    json() { return this; },
  } as any, () => { throw new Error("permission should not pass"); });
  assert.equal(permissionStatus, 403);
});

test("ordinary organization admin cannot self-grant service access", async () => {
  const service = new ServiceCatalogService();
  await assert.rejects(
    () => service.grantEntitlement(networkOrg, { service_key: "curriculum", reason: RUN }, partnerReadActor),
    /Service entitlement management permission is required/,
  );
  await assert.rejects(
    () => service.grantEntitlement(networkOrg, { service_key: "curriculum", reason: RUN }, partnerManageAttempt),
    /Only the service provider or platform authority/,
  );
});

test("duplicate active grant is idempotent and does not create another active row", async () => {
  const service = new ServiceCatalogService();
  const first = await service.grantEntitlement(networkOrg, { service_key: "project_studio", reason: RUN }, shfGrantActor);
  const second = await service.grantEntitlement(networkOrg, { service_key: "project_studio", reason: RUN }, shfGrantActor);
  assert.equal(second.replayed, true);
  assert.equal(second.entitlement.entitlement_id, first.entitlement.entitlement_id);
  const count = await query(
    `SELECT COUNT(*)::int AS count
     FROM organization_service_entitlements e
     JOIN service_catalog s ON s.service_id=e.service_id
     WHERE e.organization_id=$1 AND s.service_key='project_studio' AND e.status='ACTIVE'`,
    [networkOrg],
  );
  assert.equal(count.rows[0].count, 1);
});

test("suspended and revoked entitlements deny runtime service evaluation", async () => {
  const service = new ServiceCatalogService();
  const granted = await service.grantEntitlement(networkOrg, { service_key: "curriculum", reason: RUN }, shfGrantActor);
  const suspended = await service.transitionEntitlement(networkOrg, granted.entitlement.entitlement_id, { status: "SUSPENDED", reason: RUN }, shfGrantActor);
  assert.equal(suspended?.entitlement.status, "SUSPENDED");
  assert.equal((await service.evaluateOrganizationServiceEntitlement({ organizationId: networkOrg, serviceKey: "curriculum" })).result, "DENIED_SUSPENDED");
  const revoked = await service.transitionEntitlement(networkOrg, granted.entitlement.entitlement_id, { status: "REVOKED", reason: RUN }, shfGrantActor);
  assert.equal(revoked?.entitlement.status, "REVOKED");
  assert.equal((await service.evaluateOrganizationServiceEntitlement({ organizationId: networkOrg, serviceKey: "curriculum" })).allowed, false);
});

test("cross-org entitlement read and mutation fail closed in service layer", async () => {
  const service = new ServiceCatalogService();
  await assert.rejects(
    () => service.listEntitlements("org_shf_001", partnerReadActor),
    /Cannot read another organization's service entitlements/,
  );
  const granted = await service.grantEntitlement(networkOrg, { service_key: "truth_evidence", reason: RUN }, shfGrantActor);
  await assert.rejects(
    () => service.transitionEntitlement(networkOrg, granted.entitlement.entitlement_id, { status: "SUSPENDED", reason: RUN }, partnerManageAttempt),
    /Only the service provider or platform authority/,
  );
});

test("representative protected service route composition requires entitlement and user permission", async () => {
  const { requireOrganizationServiceEntitlement } = await import("../src/auth/service-entitlement-guard.ts");
  const service = new ServiceCatalogService();
  await service.grantEntitlement(networkOrg, { service_key: "curriculum", reason: RUN }, shfGrantActor);
  const req = { user: { ...actor("route_user", networkOrg, ["student"], ["reports.view"]), active_organization_id: networkOrg } };
  let entitlementStatus = 0;
  await requireOrganizationServiceEntitlement("curriculum")(req as any, {
    status(code: number) { entitlementStatus = code; return this; },
    json() { return this; },
  } as any, () => {});
  assert.equal(entitlementStatus, 0, "existing active curriculum entitlement should pass entitlement stage");

  let permissionStatus = 0;
  requirePermission("reports.export")({ user: req.user } as any, {
    status(code: number) { permissionStatus = code; return this; },
    json() { return this; },
  } as any, () => { throw new Error("permission should not pass"); });
  assert.equal(permissionStatus, 403);
});
