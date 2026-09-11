import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const database = process.env.SHS_TEST_DATABASE_URL;
const run = `shfp3e2e_${Date.now()}`;
const provider = "org_shf_001";
const orgA = `${run}_org_a`;
const orgB = `${run}_org_b`;
const shfAdmin = `${run}_shf_admin`;
const orgAAdmin = `${run}_org_a_admin`;
const orgANoPerm = `${run}_org_a_no_perm`;

const servicePaths = {
  curriculum: { path: "/curriculum/catalog/courses", permission: "curriculum.catalog.manage" },
  reporting: { path: "/reporting/public-snapshots", permission: "reports.public_snapshot.view" },
  project_studio: { path: "/studio/projects", permission: "studio.project.view" },
};

function db(sql) {
  if (!database) throw new Error("SHS_TEST_DATABASE_URL is required");
  return execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], { encoding: "utf8" }).trim();
}

function esc(value) {
  return String(value).replace(/'/g, "''");
}

async function apiRequest(request, method, path, userId, organizationId, data) {
  return request[method](`${api}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer dev-token:${userId}`,
      "x-shs-organization-id": organizationId,
    },
    data,
  });
}

async function expectService(request, serviceKey, status, userId = orgAAdmin, organizationId = orgA) {
  const response = await apiRequest(request, "get", servicePaths[serviceKey].path, userId, organizationId);
  const body = await response.text();
  expect(response.status(), `${serviceKey} ${status}: ${body}`).toBe(status);
  return response;
}

function setEntitlement(serviceKey, organizationId, status) {
  db(`
    INSERT INTO organization_service_entitlements (
      entitlement_id, organization_id, service_id, status, granted_by_user_id, reason, source_relationship_id
    )
    SELECT '${run}_${esc(organizationId)}_${serviceKey}_${status.toLowerCase()}', '${esc(organizationId)}', service_id,
           '${status}', '${shfAdmin}', '${run}', '${run}_rel_${esc(organizationId)}'
    FROM service_catalog WHERE service_key='${serviceKey}'
    ON CONFLICT (entitlement_id) DO UPDATE SET status=EXCLUDED.status, updated_at=NOW();
  `);
}

function clearEntitlements(organizationId, serviceKey) {
  db(`
    DELETE FROM organization_service_entitlements e
    USING service_catalog s
    WHERE e.service_id=s.service_id
      AND e.organization_id='${esc(organizationId)}'
      AND s.service_key='${serviceKey}';
  `);
}

function snapshotSideEffects() {
  return db(`
    SELECT table_name || ':' || row_count
    FROM (
      SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id='${orgA}'
      UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id='${orgA}'
      UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id='${orgA}'
      UNION ALL SELECT 'grant_binders', COUNT(*)::text FROM grant_binders WHERE organization_id='${orgA}'
      UNION ALL SELECT 'exchange_funding_commitments', COUNT(*)::text FROM exchange_funding_commitments WHERE organization_id='${orgA}' OR recipient_organization_id='${orgA}'
      UNION ALL SELECT 'studio_qa_runs', COUNT(*)::text FROM studio_qa_runs WHERE organization_id='${orgA}'
      UNION ALL SELECT 'studio_review_submissions', COUNT(*)::text FROM studio_review_submissions WHERE organization_id='${orgA}'
      UNION ALL SELECT 'studio_review_decisions', COUNT(*)::text FROM studio_review_decisions WHERE organization_id='${orgA}'
      UNION ALL SELECT 'studio_delivery_records', COUNT(*)::text FROM studio_delivery_records WHERE organization_id='${orgA}'
    ) t ORDER BY table_name;
  `);
}

test.beforeAll(() => {
  db(`
    INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain) VALUES
      ('${provider}', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
      ('${orgA}', 'Phase 3 Organization A', 'Phase 3 Organization A', 'INDEPENDENT_NETWORK', 'active', '${run}.a.test'),
      ('${orgB}', 'Phase 3 Organization B', 'Phase 3 Organization B', 'INDEPENDENT_NETWORK', 'active', '${run}.b.test')
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
      ('${shfAdmin}', '${provider}', '${shfAdmin}@test.invalid', 'Phase 3 SHF Admin', 'active', 'test'),
      ('${orgAAdmin}', '${orgA}', '${orgAAdmin}@test.invalid', 'Phase 3 Org A Admin', 'active', 'test'),
      ('${orgANoPerm}', '${orgA}', '${orgANoPerm}@test.invalid', 'Phase 3 Org A No Permission', 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
      ('${run}_role_provider', NULL, 'shf_admin', 'platform', true),
      ('${run}_role_org_admin', NULL, 'org_admin', 'organization', true),
      ('${run}_role_no_perm', NULL, 'read_only_viewer', 'organization', true)
    ON CONFLICT (role_id) DO NOTHING;

    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('${run}_provider_view', '${run}_role_provider', 'organization.service_entitlement.view'),
      ('${run}_provider_manage', '${run}_role_provider', 'organization.service_entitlement.manage'),
      ('${run}_provider_curriculum', '${run}_role_provider', 'curriculum.catalog.manage'),
      ('${run}_provider_reporting', '${run}_role_provider', 'reports.public_snapshot.view'),
      ('${run}_provider_studio', '${run}_role_provider', 'studio.project.view'),
      ('${run}_org_view_entitlements', '${run}_role_org_admin', 'organization.service_entitlement.view'),
      ('${run}_org_curriculum', '${run}_role_org_admin', 'curriculum.catalog.manage'),
      ('${run}_org_reporting', '${run}_role_org_admin', 'reports.public_snapshot.view'),
      ('${run}_org_studio', '${run}_role_org_admin', 'studio.project.view'),
      ('${run}_no_perm_view', '${run}_role_no_perm', 'organization.service_entitlement.view')
    ON CONFLICT (role_permission_id) DO NOTHING;

    INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from) VALUES
      ('${run}_mem_provider', '${shfAdmin}', '${provider}', '${run}_role_provider', 'active', NOW()),
      ('${run}_mem_org_a', '${orgAAdmin}', '${orgA}', '${run}_role_org_admin', 'active', NOW()),
      ('${run}_mem_no_perm', '${orgANoPerm}', '${orgA}', '${run}_role_no_perm', 'active', NOW())
    ON CONFLICT (membership_id) DO NOTHING;

    INSERT INTO service_catalog (
      service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type
    ) VALUES
      ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum infrastructure.', 'CURRICULUM', 'ACTIVE', '${provider}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
      ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', '${provider}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
      ('svc_project_studio', 'project_studio', 'Project Studio', 'Project Studio infrastructure.', 'PROJECT_STUDIO', 'ACTIVE', '${provider}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF')
    ON CONFLICT (service_key) DO UPDATE SET status='ACTIVE', provider_organization_id=EXCLUDED.provider_organization_id;

    INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, created_by, updated_by) VALUES
      ('${run}_rel_${orgA}', '${orgA}', '${provider}', 'NETWORK_MEMBER_OF', 'ACTIVE', NOW(), '${shfAdmin}', '${shfAdmin}'),
      ('${run}_rel_${orgB}', '${orgB}', '${provider}', 'NETWORK_MEMBER_OF', 'ACTIVE', NOW(), '${shfAdmin}', '${shfAdmin}')
    ON CONFLICT (relationship_id) DO NOTHING;

    INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status, granted_by_user_id, reason)
    SELECT '${run}_provider_' || service_key, '${provider}', service_id, 'ACTIVE', '${shfAdmin}', '${run} provider compatibility'
    FROM service_catalog WHERE provider_organization_id='${provider}'
      AND NOT EXISTS (
        SELECT 1 FROM organization_service_entitlements e
        WHERE e.organization_id='${provider}' AND e.service_id=service_catalog.service_id AND e.status='ACTIVE'
      )
    ON CONFLICT (entitlement_id) DO NOTHING;
  `);
});

test("representative services compose authenticated organization entitlement and actor permission", async ({ request }) => {
  const before = snapshotSideEffects();

  for (const serviceKey of Object.keys(servicePaths)) {
    clearEntitlements(orgA, serviceKey);
    clearEntitlements(orgB, serviceKey);
    setEntitlement(serviceKey, orgB, "ACTIVE");

    await expectService(request, serviceKey, 403);
    setEntitlement(serviceKey, orgA, "ACTIVE");
    await expectService(request, serviceKey, 200);
    await expectService(request, serviceKey, 403, orgANoPerm, orgA);

    clearEntitlements(orgA, serviceKey);
    setEntitlement(serviceKey, orgA, "SUSPENDED");
    await expectService(request, serviceKey, 403);

    clearEntitlements(orgA, serviceKey);
    setEntitlement(serviceKey, orgA, "REVOKED");
    await expectService(request, serviceKey, 403);
  }

  clearEntitlements(orgA, "reporting");
  await expectService(request, "reporting", 403);
  setEntitlement("reporting", orgA, "ACTIVE");
  await expectService(request, "reporting", 200);
  await expectService(request, "reporting", 200, shfAdmin, provider);

  expect(snapshotSideEffects()).toBe(before);
});

test("authenticated Services UI grants, revokes, and cannot manufacture authority", async ({ page, request }) => {
  clearEntitlements(orgA, "reporting");
  const before = snapshotSideEffects();
  const browserPayloads = [];
  const browserUrls = [];
  page.on("request", (req) => {
    if (req.url().includes("/service-entitlements") && ["POST", "PATCH"].includes(req.method())) {
      browserUrls.push(req.url());
      browserPayloads.push(JSON.parse(req.postData() || "{}"));
    }
  });

  await page.addInitScript(({ token }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", "org_shf_001");
  }, { token: shfAdmin });
  await page.goto(`${frontend}/#/operator/services`);
  await page.getByLabel("Organization ID").fill(orgA);
  await page.getByRole("button", { name: "Load Services" }).click();
  await expect(page.getByRole("heading", { name: "Reporting" })).toBeVisible();
  const reportingCard = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Reporting" }) });
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/organizations/${orgA}/service-entitlements`) && res.request().method() === "POST" && res.status() < 300),
    reportingCard.getByRole("button", { name: "Grant Reporting" }).click(),
  ]);
  await expect(reportingCard.getByText("ACTIVE")).toBeVisible();
  expect(browserUrls.some((url) => url.startsWith(api)), `browser service mutations: ${browserUrls.join(",")}`).toBe(true);

  const activeRows = db(`
    SELECT COUNT(*) FROM organization_service_entitlements e
    JOIN service_catalog s ON s.service_id=e.service_id
    WHERE e.organization_id='${orgA}' AND s.service_key='reporting' AND e.status='ACTIVE';
  `);
  expect(activeRows).toBe("1");
  await expectService(request, "reporting", 200);
  const persisted = db(`
    SELECT e.organization_id, s.service_key, s.provider_organization_id, e.granted_by_user_id, e.status,
           (e.granted_at IS NOT NULL), (e.created_at IS NOT NULL)
    FROM organization_service_entitlements e
    JOIN service_catalog s ON s.service_id=e.service_id
    WHERE e.organization_id='${orgA}' AND s.service_key='reporting'
    ORDER BY e.updated_at DESC LIMIT 1;
  `);
  expect(persisted).toContain(`${orgA}\treporting\t${provider}\t${shfAdmin}\tACTIVE\t`);

  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/organizations/${orgA}/service-entitlements/`) && res.request().method() === "PATCH" && res.status() < 300),
    reportingCard.getByRole("button", { name: "Revoke Reporting" }).click(),
  ]);
  await expect(reportingCard.getByText("REVOKED")).toBeVisible();
  await expectService(request, "reporting", 403);

  for (const payload of browserPayloads) {
    for (const forbidden of ["granted_by", "granted_by_user_id", "provider_organization_id", "created_at", "revoked_by", "revoked_by_user_id", "suspended_by", "audit_actor", "tenant_id", "organization_id"]) {
      expect(payload, `browser payload must not send ${forbidden}`).not.toHaveProperty(forbidden);
    }
  }

  const selfGrant = await apiRequest(request, "post", `/organizations/${orgA}/service-entitlements`, orgAAdmin, orgA, { service_key: "curriculum", reason: run });
  expect(selfGrant.status()).toBe(403);
  const crossOrgRead = await apiRequest(request, "get", `/organizations/${orgB}/service-entitlements`, orgAAdmin, orgA);
  expect(crossOrgRead.status()).toBe(403);
  const crossOrgMutate = await apiRequest(request, "post", `/organizations/${orgB}/service-entitlements`, orgAAdmin, orgA, { service_key: "curriculum", reason: run });
  expect(crossOrgMutate.status()).toBe(403);

  const audit = db(`
    SELECT action_type FROM audit_events
    WHERE target_object_type='organization_service_entitlement'
      AND organization_id='${orgA}'
      AND actor_user_id='${shfAdmin}'
    ORDER BY created_at;
  `);
  expect(audit).toContain("organization.service_entitlement.granted");
  expect(audit).toContain("organization.service_entitlement.revoked");
  expect(snapshotSideEffects()).toBe(before);
});

test("authenticated Services UI is usable at mobile width with perceivable status and keyboard actions", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(({ token }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", "org_shf_001");
  }, { token: shfAdmin });
  await page.goto(`${frontend}/#/operator/services`);
  await page.getByLabel("Organization ID").fill(orgA);
  await page.getByRole("button", { name: "Load Services" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Curriculum" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Grant Curriculum" })).toBeVisible();
  await expect(page.getByText(/ACTIVE|REVOKED|Not Enabled/).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
