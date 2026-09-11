import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const database = process.env.SHS_TEST_DATABASE_URL;
const run = `shfp5e2e_${Date.now()}`;
const shf = "org_shf_001";
const shs = "org_shs_001";
const funder = `${run}_external_funder`;
const orgA = `${run}_network_a`;
const orgB = `${run}_network_b`;
const fundingActor = `${run}_funding_actor`;
const orgAActor = `${run}_orga_actor`;
const orgBActor = `${run}_orgb_actor`;
const programA = `${run}_program_a`;
const programB = `${run}_program_b`;

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
      SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'projects', COUNT(*)::text FROM projects WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'organization_service_entitlements', COUNT(*)::text FROM organization_service_entitlements WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'organization_onboarding_cases', COUNT(*)::text FROM organization_onboarding_cases WHERE submitted_by_user_id IN ('${fundingActor}','${orgAActor}','${orgBActor}')
      UNION ALL SELECT 'exchange_funding_commitments', COUNT(*)::text FROM exchange_funding_commitments WHERE organization_id IN ('${shf}','${orgA}','${orgB}') OR recipient_organization_id IN ('${shf}','${orgA}','${orgB}')
      UNION ALL SELECT 'grant_binders', COUNT(*)::text FROM grant_binders WHERE organization_id IN ('${shf}','${orgA}','${orgB}')
    ) t ORDER BY table_name;
  `);
}

test.beforeAll(() => {
  db(`
    INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain) VALUES
      ('${shf}', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
      ('${shs}', 'Silicon Heartland Solutions', 'Silicon Heartland Solutions', 'SHS', 'active', 'siliconheartlandsolutions.com'),
      ('${funder}', 'External Foundation', 'External Foundation', 'FOUNDATION', 'active', '${run}.foundation.example.org'),
      ('${orgA}', 'Network Org A', 'Network Org A', 'INDEPENDENT_NETWORK', 'active', '${run}.a.example.org'),
      ('${orgB}', 'Network Org B', 'Network Org B', 'INDEPENDENT_NETWORK', 'active', '${run}.b.example.org')
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
      ('${fundingActor}', '${shf}', '${fundingActor}@test.invalid', 'Phase 5 Funding Actor', 'active', 'test'),
      ('${orgAActor}', '${orgA}', '${orgAActor}@test.invalid', 'Org A Viewer', 'active', 'test'),
      ('${orgBActor}', '${orgB}', '${orgBActor}@test.invalid', 'Org B Viewer', 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
      ('${run}_funding_role', NULL, 'shf_admin', 'platform', true),
      ('${run}_org_role', NULL, 'org_admin', 'organization', true)
    ON CONFLICT (role_id) DO NOTHING;

    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('${run}_funding_view', '${run}_funding_role', 'funding.grant.view'),
      ('${run}_funding_manage', '${run}_funding_role', 'funding.grant.manage'),
      ('${run}_orga_view', '${run}_org_role', 'funding.grant.view')
    ON CONFLICT (role_permission_id) DO NOTHING;

    INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from) VALUES
      ('${run}_funding_membership', '${fundingActor}', '${shf}', '${run}_funding_role', 'active', NOW()),
      ('${run}_orga_membership', '${orgAActor}', '${orgA}', '${run}_org_role', 'active', NOW()),
      ('${run}_orgb_membership', '${orgBActor}', '${orgB}', '${run}_org_role', 'active', NOW())
    ON CONFLICT (membership_id) DO NOTHING;

    INSERT INTO programs (
      program_id, organization_id, name, program_type, status, created_by_user_id,
      program_classification, owner_organization_id, operator_organization_id, accountable_organization_id
    ) VALUES
      ('${programA}', '${shf}', 'Program A', 'education', 'active', '${fundingActor}', 'SHF_OWNED', '${shf}', '${orgA}', '${shf}'),
      ('${programB}', '${orgB}', 'Program B', 'education', 'active', '${orgBActor}', 'INDEPENDENT_NETWORK', '${orgB}', '${orgB}', '${orgB}')
    ON CONFLICT (program_id) DO NOTHING;
  `);
});

test("authenticated funding browser flow records award and allocation without manufacturing authority", async ({ page, request }) => {
  const before = snapshotSideEffects();
  const payloads = [];
  page.on("request", (req) => {
    if (req.url().includes("/funding/grants") && ["POST", "PATCH"].includes(req.method())) {
      payloads.push(JSON.parse(req.postData() || "{}"));
    }
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: fundingActor, org: shf });
  await page.goto(`${frontend}/#/operator/funding`);
  await expect(page.getByRole("heading", { name: "Funding / Grants" })).toBeVisible();

  await page.getByLabel("Grant Title").fill(`Phase 5 Browser Award ${run}`);
  await page.getByLabel("Grant Number").fill(`P5B-${run}`);
  await page.getByLabel("Funder Organization ID").fill(funder);
  await page.getByLabel("Recipient Organization ID").fill(shf);
  await page.getByLabel("Reporting Organization ID").fill(shf);
  await page.getByLabel("Award Amount USD").fill("100000.00");
  await page.getByLabel("Start Date").fill("2026-01-01");
  await page.getByLabel("End Date").fill("2026-12-31");
  await page.getByLabel("Purpose").fill("Network program operations.");
  await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/funding/grants") && res.request().method() === "POST" && res.status() === 201),
    page.getByRole("button", { name: "Record Award" }).click(),
  ]);
  await expect(page.getByText("Grant award recorded.")).toBeVisible();
  const grantId = db(`SELECT grant_id FROM funding_grants WHERE title='Phase 5 Browser Award ${run}' LIMIT 1;`);
  expect(grantId).toContain("grant_");

  await page.getByLabel("Allocation Program ID").fill(programA);
  await page.getByLabel("Allocation Amount USD").fill("60000.00");
  await page.getByLabel("Allocation Purpose").fill("Program A operator support.");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/funding/grants/${grantId}/allocations`) && res.status() === 201),
    page.getByRole("button", { name: "Create Allocation" }).click(),
  ]);
  await expect(page.getByText("Program allocation recorded.")).toBeVisible();

  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/funding/grants/${grantId}/status`) && res.status() < 300),
    page.getByRole("button", { name: "Activate Grant" }).click(),
  ]);
  await expect(page.getByText("Grant activated.")).toBeVisible();

  const persisted = db(`
    SELECT g.funder_organization_id, g.recipient_organization_id, g.reporting_organization_id,
           g.status, g.award_amount::text, a.allocated_amount::text,
           p.operator_organization_id, g.created_by_user_id
    FROM funding_grants g
    JOIN grant_program_allocations a ON a.grant_id=g.grant_id
    JOIN programs p ON p.program_id=a.program_id
    WHERE g.grant_id='${grantId}';
  `);
  expect(persisted).toBe(`${funder}\t${shf}\t${shf}\tACTIVE\t100000.00\t60000.00\t${orgA}\t${fundingActor}`);

  const orgAList = await apiRequest(request, "get", "/funding/grants", orgAActor, orgA);
  expect(orgAList.status()).toBe(200);
  expect(await orgAList.text()).toContain(grantId);
  const orgAMutate = await apiRequest(request, "post", `/funding/grants/${grantId}/allocations`, orgAActor, orgA, {
    programId: programB,
    allocatedAmount: "1.00",
  });
  expect(orgAMutate.status()).toBe(403);
  const orgBList = await apiRequest(request, "get", "/funding/grants", orgBActor, orgB);
  expect(await orgBList.text()).not.toContain(grantId);

  const direct = await apiRequest(request, "post", "/funding/grants", fundingActor, shf, {
    title: `Phase 5 Direct Independent Award ${run}`,
    funderOrganizationId: funder,
    recipientOrganizationId: orgB,
    reportingOrganizationId: orgB,
    awardAmount: "50000.00",
    startDate: "2026-02-01",
    purpose: "Direct independent recipient award.",
  });
  expect(direct.status()).toBe(201);
  const directId = (await direct.json()).data.grantId;
  const directPersisted = db(`SELECT recipient_organization_id FROM funding_grants WHERE grant_id='${directId}';`);
  expect(directPersisted).toBe(orgB);

  const audit = db(`
    SELECT action_type FROM audit_events
    WHERE target_object_id IN ('${grantId}', (SELECT allocation_id FROM grant_program_allocations WHERE grant_id='${grantId}' LIMIT 1))
    ORDER BY created_at;
  `);
  expect(audit).toContain("funding.grant.created");
  expect(audit).toContain("funding.allocation.created");
  expect(audit).toContain("funding.grant.activated");
  expect(snapshotSideEffects()).toBe(before);

  const shsRows = db(`SELECT COUNT(*) FROM funding_grants WHERE grant_id='${grantId}' AND (funder_organization_id='${shs}' OR recipient_organization_id='${shs}' OR reporting_organization_id='${shs}');`);
  expect(shsRows).toBe("0");

  for (const payload of payloads) {
    for (const forbidden of ["created_by", "createdBy", "created_by_user_id", "createdByUserId", "approved_by", "activated_by", "audit_actor", "tenant_id", "impact_producer", "evidence_id", "verified"]) {
      expect(payload, `browser payload must not send ${forbidden}`).not.toHaveProperty(forbidden);
    }
  }
});

test("mobile funding UI remains usable and status text is perceivable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: fundingActor, org: shf });
  await page.goto(`${frontend}/#/operator/funding`);
  await expect(page.getByRole("heading", { name: "Funding / Grants" })).toBeVisible();
  await expect(page.getByLabel("Grant Title")).toBeVisible();
  await expect(page.getByLabel("Award Amount USD")).toBeVisible();
  await expect(page.getByLabel("Restriction")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  const focusedName = await page.locator(":focus").evaluate((node) => node.getAttribute("aria-label") || node.textContent || "");
  expect(focusedName.length).toBeGreaterThan(0);
});
