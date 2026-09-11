import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const database = process.env.SHS_TEST_DATABASE_URL;
const run = `shfp6e2e_${Date.now()}`;
const shf = "org_shf_001";
const orgA = `${run}_network_a`;
const orgB = `${run}_network_b`;
const operator = `${run}_operator`;
const orgAActor = `${run}_orga_actor`;
const orgBActor = `${run}_orgb_actor`;
const relA = `${run}_rel_a`;
const relB = `${run}_rel_b`;

function db(sql) {
  if (!database) throw new Error("SHS_TEST_DATABASE_URL is required");
  return execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-At", "-F", "\t", "-c", sql], { encoding: "utf8" }).trim();
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

function snapshotSideEffects() {
  return db(`
    SELECT table_name || ':' || row_count
    FROM (
      SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id IN ('${orgA}','${orgB}')
      UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id IN ('${orgA}','${orgB}')
      UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id IN ('${orgA}','${orgB}')
      UNION ALL SELECT 'funding_grants', COUNT(*)::text FROM funding_grants WHERE funder_organization_id IN ('${orgA}','${orgB}') OR recipient_organization_id IN ('${orgA}','${orgB}') OR reporting_organization_id IN ('${orgA}','${orgB}')
      UNION ALL SELECT 'grant_program_allocations', COUNT(*)::text FROM grant_program_allocations gpa JOIN funding_grants fg ON fg.grant_id=gpa.grant_id WHERE fg.funder_organization_id IN ('${orgA}','${orgB}') OR fg.recipient_organization_id IN ('${orgA}','${orgB}') OR fg.reporting_organization_id IN ('${orgA}','${orgB}')
      UNION ALL SELECT 'organization_onboarding_cases', COUNT(*)::text FROM organization_onboarding_cases WHERE existing_organization_id IN ('${orgA}','${orgB}') OR activated_organization_id IN ('${orgA}','${orgB}')
    ) t ORDER BY table_name;
  `);
}

test.beforeAll(() => {
  db(`
    INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain) VALUES
      ('${shf}', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
      ('${orgA}', 'Network Org A', 'Network Org A', 'INDEPENDENT_NETWORK', 'active', '${run}.a.example.org'),
      ('${orgB}', 'Network Org B', 'Network Org B', 'INDEPENDENT_NETWORK', 'active', '${run}.b.example.org')
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO service_catalog (
      service_id, service_key, name, description, category, status,
      provider_organization_id, audience, requires_relationship_type, agreement_requirement
    ) VALUES
      ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum infrastructure.', 'CURRICULUM', 'ACTIVE', '${shf}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'NO_AGREEMENT_REQUIRED'),
      ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', '${shf}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED'),
      ('svc_project_studio', 'project_studio', 'Project Studio', 'Project Studio infrastructure.', 'PROJECT_STUDIO', 'ACTIVE', '${shf}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED')
    ON CONFLICT (service_key) DO UPDATE SET
      status='ACTIVE',
      provider_organization_id=EXCLUDED.provider_organization_id,
      requires_relationship_type=EXCLUDED.requires_relationship_type,
      agreement_requirement=EXCLUDED.agreement_requirement,
      updated_at=NOW();

    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
      ('${operator}', '${shf}', '${operator}@test.invalid', 'Phase 6 Operator', 'active', 'test'),
      ('${orgAActor}', '${orgA}', '${orgAActor}@test.invalid', 'Org A Actor', 'active', 'test'),
      ('${orgBActor}', '${orgB}', '${orgBActor}@test.invalid', 'Org B Actor', 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
      ('${run}_provider_role', NULL, 'shf_admin', 'platform', true),
      ('${run}_consumer_role', NULL, 'org_admin', 'organization', true)
    ON CONFLICT (role_id) DO NOTHING;

    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('${run}_provider_ent_view', '${run}_provider_role', 'organization.service_entitlement.view'),
      ('${run}_provider_ent_manage', '${run}_provider_role', 'organization.service_entitlement.manage'),
      ('${run}_provider_agr_view', '${run}_provider_role', 'service.agreement.view'),
      ('${run}_provider_agr_manage', '${run}_provider_role', 'service.agreement.manage'),
      ('${run}_provider_agr_approve', '${run}_provider_role', 'service.agreement.approve'),
      ('${run}_provider_agr_activate', '${run}_provider_role', 'service.agreement.activate'),
      ('${run}_consumer_ent_view', '${run}_consumer_role', 'organization.service_entitlement.view'),
      ('${run}_consumer_agr_view', '${run}_consumer_role', 'service.agreement.view'),
      ('${run}_consumer_reports', '${run}_consumer_role', 'reports.view'),
      ('${run}_consumer_studio', '${run}_consumer_role', 'studio.project.view')
    ON CONFLICT (role_permission_id) DO NOTHING;

    INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from) VALUES
      ('${run}_provider_mem', '${operator}', '${shf}', '${run}_provider_role', 'active', NOW()),
      ('${run}_orga_mem', '${orgAActor}', '${orgA}', '${run}_consumer_role', 'active', NOW()),
      ('${run}_orgb_mem', '${orgBActor}', '${orgB}', '${run}_consumer_role', 'active', NOW())
    ON CONFLICT (membership_id) DO NOTHING;

    INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, created_by, updated_by) VALUES
      ('${relA}', '${orgA}', '${shf}', 'NETWORK_MEMBER_OF', 'ACTIVE', NOW(), '${operator}', '${operator}'),
      ('${relB}', '${orgB}', '${shf}', 'NETWORK_MEMBER_OF', 'ACTIVE', NOW(), '${operator}', '${operator}')
    ON CONFLICT DO NOTHING;
  `);
});

test("authenticated agreement browser flow governs Reporting service operation", async ({ page, request }) => {
  const before = snapshotSideEffects();
  const payloads = [];
  page.on("request", (req) => {
    if (req.url().includes("/service-agreements") && ["POST", "PATCH"].includes(req.method())) {
      payloads.push(JSON.parse(req.postData() || "{}"));
    }
  });

  const entitlement = await apiRequest(request, "post", `/organizations/${orgA}/service-entitlements`, operator, shf, {
    service_key: "reporting",
    reason: run,
  });
  expect(entitlement.status()).toBeLessThan(300);

  const deniedBefore = await apiRequest(request, "get", "/reporting/public-disclosure-policies", orgAActor, orgA);
  expect(deniedBefore.status()).toBe(403);
  expect(await deniedBefore.text()).toContain("SERVICE_ENTITLEMENT_REQUIRED");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: operator, org: shf });
  await page.goto(`${frontend}/#/operator/agreements`);
  await expect(page.getByRole("heading", { name: "Shared Services / Agreements" })).toBeVisible();

  await page.getByLabel("Consumer Organization ID").fill(orgA);
  await page.getByLabel("Service", { exact: true }).selectOption("reporting");
  await page.getByLabel("Effective From").fill("2026-01-01");
  await page.getByLabel("Service Scope").fill("Reporting service operations for Org A.");
  await page.getByLabel("Support Level").fill("Standard");
  await page.getByLabel("Agreement Reference").fill(`P6-${run}`);
  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/service-agreements") && res.request().method() === "POST" && res.status() === 201),
    page.getByRole("button", { name: "Create Draft" }).click(),
  ]);
  await expect(page.getByText("Service agreement drafted.")).toBeVisible();
  const agreementId = db(`SELECT agreement_id FROM service_agreements WHERE consumer_organization_id='${orgA}' AND service_id='svc_reporting' ORDER BY created_at DESC LIMIT 1;`);
  expect(agreementId).toContain("svcagr_");

  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith(`/service-agreements/${agreementId}/approve`) && res.status() === 200),
    page.getByRole("button", { name: "Approve Agreement" }).click(),
  ]);
  await expect(page.getByText("Agreement approved.")).toBeVisible();

  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith(`/service-agreements/${agreementId}/activate`) && res.status() === 200),
    page.getByRole("button", { name: "Activate Agreement" }).click(),
  ]);
  await expect(page.getByText("Agreement activated.")).toBeVisible();

  const activatedState = db(`SELECT status, source_entitlement_id IS NOT NULL, source_relationship_id FROM service_agreements WHERE agreement_id='${agreementId}';`);
  expect(activatedState).toBe(`ACTIVE\tt\t${relA}`);
  const allowed = await apiRequest(request, "get", "/reporting/public-disclosure-policies", orgAActor, orgA);
  const allowedText = await allowed.text();
  expect(allowed.status(), allowedText).toBe(200);

  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith(`/service-agreements/${agreementId}/suspend`) && res.status() === 200),
    page.getByRole("button", { name: "Suspend Agreement" }).click(),
  ]);
  await expect(page.getByText("Agreement suspended.")).toBeVisible();
  const deniedAfterSuspend = await apiRequest(request, "get", "/reporting/public-disclosure-policies", orgAActor, orgA);
  expect(deniedAfterSuspend.status()).toBe(403);
  expect(await deniedAfterSuspend.text()).toContain("DENIED_AGREEMENT_SUSPENDED");

  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith(`/service-agreements/${agreementId}/terminate`) && res.status() === 200),
    page.getByRole("button", { name: "Terminate Agreement" }).click(),
  ]);
  await expect(page.getByText("Agreement terminated.")).toBeVisible();
  const history = db(`SELECT status, consumer_organization_id, provider_organization_id, agreement_reference FROM service_agreements WHERE agreement_id='${agreementId}';`);
  expect(history).toBe(`TERMINATED\t${orgA}\t${shf}\tP6-${run}`);
  const events = db(`SELECT action_type FROM audit_events WHERE target_object_id='${agreementId}' ORDER BY created_at;`);
  expect(events).toContain("service.agreement.created");
  expect(events).toContain("service.agreement.approved");
  expect(events).toContain("service.agreement.activated");
  expect(events).toContain("service.agreement.suspended");
  expect(events).toContain("service.agreement.terminated");

  const orgBRead = await apiRequest(request, "get", `/service-agreements/${agreementId}`, orgBActor, orgB);
  expect(orgBRead.status()).toBe(403);
  expect(snapshotSideEffects()).toBe(before);

  for (const payload of payloads) {
    for (const forbidden of ["approved_by", "approvedByUserId", "activated_by", "activatedByUserId", "providerOrganizationId", "actor_user_id", "tenant_id", "evidence_id", "verified"]) {
      expect(payload, `browser payload must not send ${forbidden}`).not.toHaveProperty(forbidden);
    }
  }
});

test("Project Studio also uses agreement policy and is not hardcoded to Reporting", async ({ request }) => {
  const entitlement = await apiRequest(request, "post", `/organizations/${orgB}/service-entitlements`, operator, shf, {
    service_key: "project_studio",
    reason: run,
  });
  expect(entitlement.status()).toBeLessThan(300);
  const denied = await apiRequest(request, "get", "/studio/projects", orgBActor, orgB);
  expect(denied.status()).toBe(403);

  const create = await apiRequest(request, "post", "/service-agreements", operator, shf, {
    consumerOrganizationId: orgB,
    serviceKey: "project_studio",
    serviceScope: "Project Studio service operations.",
    supportLevel: "Standard",
    reason: run,
  });
  expect(create.status()).toBe(201);
  const agreement = (await create.json()).data;
  expect(agreement.providerOrganizationId).toBe(shf);
  expect(agreement.consumerOrganizationId).toBe(orgB);
  expect(agreement.serviceKey).toBe("project_studio");
  await expect((await apiRequest(request, "post", `/service-agreements/${agreement.agreementId}/approve`, operator, shf, { reason: run })).status()).toBe(200);
  await expect((await apiRequest(request, "post", `/service-agreements/${agreement.agreementId}/activate`, operator, shf, { reason: run })).status()).toBe(200);
  const allowed = await apiRequest(request, "get", "/studio/projects", orgBActor, orgB);
  expect(allowed.status()).toBe(200);
});

test("mobile agreement UI remains readable and controls are reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: operator, org: shf });
  await page.goto(`${frontend}/#/operator/agreements`);
  await expect(page.getByRole("heading", { name: "Shared Services / Agreements" })).toBeVisible();
  await expect(page.getByLabel("Consumer Organization ID")).toBeVisible();
  await expect(page.getByLabel("Service", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create Draft" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  const focusedName = await page.locator(":focus").evaluate((node) => node.getAttribute("aria-label") || node.textContent || "");
  expect(focusedName.length).toBeGreaterThan(0);
});
