import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const database = process.env.SHS_TEST_DATABASE_URL;
const run = `shfp7e2e_${Date.now()}`;
const shf = "org_shf_001";
const orgA = `${run}_network_a`;
const orgB = `${run}_network_b`;
const funder = `${run}_funder`;
const operator = `${run}_operator`;
const orgAActor = `${run}_orga_actor`;
const orgBActor = `${run}_orgb_actor`;

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
      UNION ALL SELECT 'curriculum_truth_facts', COUNT(*)::text FROM curriculum_truth_facts WHERE organization_id IN ('${orgA}','${orgB}','${shf}') AND evidence_rule_id='${run}_rule'
      UNION ALL SELECT 'funding_grants', COUNT(*)::text FROM funding_grants WHERE grant_id LIKE '${run}%'
      UNION ALL SELECT 'service_agreements', COUNT(*)::text FROM service_agreements WHERE agreement_id LIKE '${run}%'
      UNION ALL SELECT 'organization_relationships', COUNT(*)::text FROM organization_relationships WHERE relationship_id LIKE '${run}%'
    ) t ORDER BY table_name;
  `);
}

test.beforeAll(() => {
  db(`
    INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain) VALUES
      ('${shf}', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
      ('${orgA}', 'Network Org A', 'Network Org A', 'INDEPENDENT_NETWORK', 'active', '${run}.a.example.org'),
      ('${orgB}', 'Network Org B', 'Network Org B', 'INDEPENDENT_NETWORK', 'active', '${run}.b.example.org'),
      ('${funder}', 'Phase 7 Funder', 'Phase 7 Funder', 'FUNDER', 'active', '${run}.funder.example.org')
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
      ('${operator}', '${shf}', '${operator}@test.invalid', 'Phase 7 Operator', 'active', 'test'),
      ('${orgAActor}', '${orgA}', '${orgAActor}@test.invalid', 'Org A Actor', 'active', 'test'),
      ('${orgBActor}', '${orgB}', '${orgBActor}@test.invalid', 'Org B Actor', 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
      ('${run}_provider_role', NULL, 'shf_admin', 'platform', true),
      ('${run}_consumer_role', NULL, 'org_admin', 'organization', true)
    ON CONFLICT (role_id) DO NOTHING;

    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('${run}_provider_impact', '${run}_provider_role', 'impact.aggregate.view'),
      ('${run}_consumer_impact', '${run}_consumer_role', 'impact.aggregate.view')
    ON CONFLICT (role_permission_id) DO NOTHING;

    INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from) VALUES
      ('${run}_provider_mem', '${operator}', '${shf}', '${run}_provider_role', 'active', NOW()),
      ('${run}_orga_mem', '${orgAActor}', '${orgA}', '${run}_consumer_role', 'active', NOW()),
      ('${run}_orgb_mem', '${orgBActor}', '${orgB}', '${run}_consumer_role', 'active', NOW())
    ON CONFLICT (membership_id) DO NOTHING;

    INSERT INTO service_catalog (
      service_id, service_key, name, description, category, status,
      provider_organization_id, audience, requires_relationship_type, agreement_requirement
    ) VALUES
      ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', '${shf}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF', 'AGREEMENT_REQUIRED')
    ON CONFLICT (service_key) DO UPDATE SET provider_organization_id=EXCLUDED.provider_organization_id, status='ACTIVE';

    INSERT INTO programs (
      program_id, organization_id, name, program_type, status, program_classification,
      owner_organization_id, operator_organization_id, accountable_organization_id, created_by_user_id
    ) VALUES
      ('${run}_program_a', '${shf}', 'Org A Program', 'workforce_training', 'active', 'SHF_INCUBATED', '${shf}', '${orgA}', '${shf}', '${operator}'),
      ('${run}_program_shf', '${shf}', 'SHF Direct Program', 'workforce_training', 'active', 'SHF_OWNED', '${shf}', '${shf}', '${shf}', '${operator}')
    ON CONFLICT (program_id) DO NOTHING;

    INSERT INTO organization_relationships (relationship_id, source_organization_id, target_organization_id, relationship_type, status, effective_from, created_by, updated_by) VALUES
      ('${run}_rel_a_member', '${orgA}', '${shf}', 'NETWORK_MEMBER_OF', 'ACTIVE', '2026-01-01T00:00:00Z', '${operator}', '${operator}')
    ON CONFLICT DO NOTHING;

    INSERT INTO service_agreements (agreement_id, provider_organization_id, consumer_organization_id, service_id, status, effective_from, service_scope, support_level, service_expectations, agreement_reference, created_by_user_id, approved_by_user_id, approved_at, activated_by_user_id, activated_at)
    VALUES ('${run}_agreement_a', '${shf}', '${orgA}', 'svc_reporting', 'ACTIVE', '2026-01-01T00:00:00Z', 'Reporting support', 'Standard', '{}', 'P7', '${operator}', '${operator}', '2026-01-01T00:00:00Z', '${operator}', '2026-01-01T00:00:00Z')
    ON CONFLICT DO NOTHING;

    INSERT INTO funding_grants (grant_id, title, funder_organization_id, recipient_organization_id, reporting_organization_id, status, award_amount, start_date, end_date, purpose, created_by_user_id)
    VALUES ('${run}_grant', 'Phase 7 Grant', '${funder}', '${shf}', '${shf}', 'ACTIVE', 1000, '2026-01-01', '2026-12-31', 'Network support', '${operator}')
    ON CONFLICT DO NOTHING;
    INSERT INTO grant_program_allocations (allocation_id, grant_id, program_id, allocated_amount, created_by_user_id)
    VALUES ('${run}_alloc', '${run}_grant', '${run}_program_a', 1000, '${operator}')
    ON CONFLICT DO NOTHING;

    INSERT INTO curriculum_truth_facts (truth_fact_id, organization_id, learner_user_id, fact_type, source_type, source_record_id, evidence_id, evidence_rule_id, evidence_rule_version, provenance_json, occurred_at)
    VALUES
      ('${run}_fact_org_a', '${shf}', '${operator}', 'PARTICIPANT_SERVED', 'LESSON_COMPLETION', '${run}_fact_org_a_source', NULL, '${run}_rule', 1, '{"program_id":"${run}_program_a"}', '2026-05-01T00:00:00Z'),
      ('${run}_fact_shf', '${shf}', '${operator}', 'PARTICIPANT_SERVED', 'LESSON_COMPLETION', '${run}_fact_shf_source', NULL, '${run}_rule', 1, '{"program_id":"${run}_program_shf"}', '2026-05-01T00:00:00Z')
    ON CONFLICT DO NOTHING;
  `);
});

test("authenticated attribution browser flow preserves producer and separates Direct SHF from supported network", async ({ page, request }) => {
  const before = snapshotSideEffects();
  const urls = [];
  page.on("request", (req) => {
    if (req.url().includes("/impact/attribution")) urls.push(req.url());
  });

  const supportedApi = await apiRequest(request, "get", "/impact/attribution?metric_key=truth.fact_count&scope=SHF_SUPPORTED_NETWORK&from=2026-01-01&until=2027-01-01", operator, shf);
  expect(supportedApi.status()).toBe(200);
  const supportedJson = await supportedApi.json();
  expect(supportedJson.data.total).toBe(1);
  expect(supportedJson.data.items[0].producerOrganizationId).toBe(orgA);
  expect(supportedJson.data.items[0].supportReasons).toEqual(["FUNDING", "NETWORK_MEMBERSHIP", "SERVICE_AGREEMENT"]);

  const directApi = await apiRequest(request, "get", "/impact/attribution?metric_key=truth.fact_count&scope=SHF_DIRECT&from=2026-01-01&until=2027-01-01", operator, shf);
  expect(directApi.status()).toBe(200);
  const directJson = await directApi.json();
  expect(directJson.data.items.some((item) => item.factId === `${run}_fact_org_a`)).toBe(false);
  expect(directJson.data.items.some((item) => item.factId === `${run}_fact_shf`)).toBe(true);

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: operator, org: shf });
  await page.goto(`${frontend}/#/operator/impact-attribution`);
  await expect(page.getByRole("heading", { name: "Impact Attribution" })).toBeVisible();
  await expect(page.getByText("SHF-Supported Network").first()).toBeVisible();
  await expect(page.getByText(orgA)).toBeVisible();
  await expect(page.getByText("NETWORK_MEMBERSHIP")).toBeVisible();

  await page.getByLabel("Scope").selectOption("SHF_DIRECT");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/impact/attribution") && res.status() === 200),
    page.getByRole("button", { name: "Refresh" }).click(),
  ]);
  await expect(page.getByText(orgA)).toHaveCount(0);
  await expect(page.getByText(shf).first()).toBeVisible();

  const orgBDenied = await apiRequest(request, "get", `/impact/attribution?metric_key=truth.fact_count&scope=ORGANIZATION&organization_id=${orgA}&from=2026-01-01&until=2027-01-01`, orgBActor, orgB);
  expect(orgBDenied.status()).toBe(403);
  const networkDenied = await apiRequest(request, "get", "/impact/attribution?metric_key=truth.fact_count&scope=WHOLE_NETWORK&from=2026-01-01&until=2027-01-01", orgBActor, orgB);
  expect(networkDenied.status()).toBe(403);
  expect(snapshotSideEffects()).toBe(before);

  for (const url of urls) {
    expect(url).not.toContain("producer_organization_id");
    expect(url).not.toContain("supported=true");
    expect(url).not.toContain("direct=true");
    expect(url).not.toContain("verified=true");
  }
});

test("mobile attribution UI remains readable and keyboard reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: operator, org: shf });
  await page.goto(`${frontend}/#/operator/impact-attribution`);
  await expect(page.getByRole("heading", { name: "Impact Attribution" })).toBeVisible();
  await expect(page.getByLabel("Metric")).toBeVisible();
  await expect(page.getByLabel("Scope")).toBeVisible();
  await expect(page.getByText("Producing Organizations")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
  await page.keyboard.press("Tab");
  const focusedName = await page.locator(":focus").evaluate((node) => node.getAttribute("aria-label") || node.textContent || "");
  expect(focusedName.length).toBeGreaterThan(0);
});
