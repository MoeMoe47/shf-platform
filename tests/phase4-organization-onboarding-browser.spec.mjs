import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const api = process.env.SHS_TEST_API_URL || "http://127.0.0.1:8091";
const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";
const database = process.env.SHS_TEST_DATABASE_URL;
const run = `shfp4e2e_${Date.now()}`;
const provider = "org_shf_001";
const applicantOrg = `${run}_applicant_org`;
const otherOrg = `${run}_other_org`;
const reviewer = `${run}_reviewer`;
const applicant = `${run}_applicant`;
const ordinary = `${run}_ordinary`;

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

async function expectService(request, path, status, userId = applicant, organizationId = applicantOrg) {
  const response = await apiRequest(request, "get", path, userId, organizationId);
  const text = await response.text();
  expect(response.status(), `${path} expected ${status}: ${text}`).toBe(status);
}

function snapshotSideEffects() {
  return db(`
    SELECT table_name || ':' || row_count
    FROM (
      SELECT 'prepare_prove_evidence' AS table_name, COUNT(*)::text AS row_count FROM prepare_prove_evidence WHERE organization_id='${applicantOrg}'
      UNION ALL SELECT 'curriculum_lesson_completions', COUNT(*)::text FROM curriculum_lesson_completions WHERE organization_id='${applicantOrg}'
      UNION ALL SELECT 'learner_credentials', COUNT(*)::text FROM learner_credentials WHERE organization_id='${applicantOrg}'
      UNION ALL SELECT 'grant_binders', COUNT(*)::text FROM grant_binders WHERE organization_id='${applicantOrg}'
      UNION ALL SELECT 'exchange_funding_commitments', COUNT(*)::text FROM exchange_funding_commitments WHERE organization_id='${applicantOrg}' OR recipient_organization_id='${applicantOrg}'
      UNION ALL SELECT 'studio_projects', COUNT(*)::text FROM projects WHERE organization_id='${applicantOrg}'
      UNION ALL SELECT 'report_public_snapshots', COUNT(*)::text FROM report_public_snapshots WHERE organization_id='${applicantOrg}'
    ) t ORDER BY table_name;
  `);
}

test.beforeAll(() => {
  db(`
    INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status, primary_domain) VALUES
      ('${provider}', 'Silicon Heartland Foundation', 'Silicon Heartland Foundation', 'SHF', 'active', 'siliconheartland.org'),
      ('${applicantOrg}', 'Phase 4 Applicant Existing Org', 'Phase 4 Applicant Existing Org', 'INDEPENDENT_NETWORK', 'active', '${run}.example.org'),
      ('${otherOrg}', 'Phase 4 Other Org', 'Phase 4 Other Org', 'INDEPENDENT_NETWORK', 'active', '${run}.other.example.org')
    ON CONFLICT (organization_id) DO NOTHING;

    INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES
      ('${reviewer}', '${provider}', '${reviewer}@test.invalid', 'Phase 4 Reviewer', 'active', 'test'),
      ('${applicant}', '${applicantOrg}', '${applicant}@test.invalid', 'Phase 4 Applicant', 'active', 'test'),
      ('${ordinary}', '${otherOrg}', '${ordinary}@test.invalid', 'Phase 4 Ordinary Admin', 'active', 'test')
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES
      ('${run}_reviewer_role', NULL, 'shf_admin', 'platform', true),
      ('${run}_applicant_role', NULL, 'org_admin', 'organization', true)
    ON CONFLICT (role_id) DO NOTHING;

    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('${run}_r_submit', '${run}_reviewer_role', 'organization.onboarding.submit'),
      ('${run}_r_view', '${run}_reviewer_role', 'organization.onboarding.view'),
      ('${run}_r_review', '${run}_reviewer_role', 'organization.onboarding.review'),
      ('${run}_r_activate', '${run}_reviewer_role', 'organization.onboarding.activate'),
      ('${run}_r_suspend', '${run}_reviewer_role', 'organization.onboarding.suspend'),
      ('${run}_r_exit', '${run}_reviewer_role', 'organization.onboarding.exit'),
      ('${run}_r_relationship', '${run}_reviewer_role', 'organization.relationship.manage'),
      ('${run}_r_ent_view', '${run}_reviewer_role', 'organization.service_entitlement.view'),
      ('${run}_r_ent_manage', '${run}_reviewer_role', 'organization.service_entitlement.manage'),
      ('${run}_a_submit', '${run}_applicant_role', 'organization.onboarding.submit'),
      ('${run}_a_view', '${run}_applicant_role', 'organization.onboarding.view'),
      ('${run}_a_reports', '${run}_applicant_role', 'reports.public_snapshot.view'),
      ('${run}_a_curriculum', '${run}_applicant_role', 'curriculum.catalog.manage')
    ON CONFLICT (role_permission_id) DO NOTHING;

    INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from) VALUES
      ('${run}_reviewer_membership', '${reviewer}', '${provider}', '${run}_reviewer_role', 'active', NOW()),
      ('${run}_applicant_membership', '${applicant}', '${applicantOrg}', '${run}_applicant_role', 'active', NOW()),
      ('${run}_ordinary_membership', '${ordinary}', '${otherOrg}', '${run}_applicant_role', 'active', NOW())
    ON CONFLICT (membership_id) DO NOTHING;

    INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id, audience, requires_relationship_type)
    VALUES
      ('svc_curriculum', 'curriculum', 'Curriculum', 'Curriculum infrastructure.', 'CURRICULUM', 'ACTIVE', '${provider}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF'),
      ('svc_reporting', 'reporting', 'Reporting', 'Reporting infrastructure.', 'REPORTING', 'ACTIVE', '${provider}', 'NETWORK_ORGANIZATION', 'NETWORK_MEMBER_OF')
    ON CONFLICT (service_key) DO UPDATE SET status='ACTIVE', provider_organization_id=EXCLUDED.provider_organization_id, requires_relationship_type='NETWORK_MEMBER_OF';
  `);
});

test("authenticated applicant and reviewer onboarding browser flow controls network access", async ({ page, request }) => {
  const before = snapshotSideEffects();
  const browserPayloads = [];
  page.on("request", (req) => {
    if (req.url().includes("/organization-onboarding/cases") && req.method() === "POST") {
      browserPayloads.push(JSON.parse(req.postData() || "{}"));
    }
  });

  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: applicant, org: applicantOrg });
  await page.goto(`${frontend}/#/operator/onboarding`);
  await page.getByLabel("Organization Name").fill(`Phase 4 Applicant ${run}`);
  await page.getByLabel("Website").fill(`${run}.example.org`);
  await page.getByLabel("Primary Contact").fill("Applicant Lead");
  await page.getByLabel("Contact Email").fill(`${run}@example.org`);
  await page.getByLabel("Mission / Description").fill("Network programming partner.");
  await Promise.all([
    page.waitForResponse((res) => res.url().includes("/organization-onboarding/cases") && res.request().method() === "POST" && res.status() === 201),
    page.getByRole("button", { name: "Submit Application" }).click(),
  ]);
  await expect(page.getByText("Application submitted.")).toBeVisible();
  const caseId = db(`SELECT onboarding_case_id FROM organization_onboarding_cases WHERE organization_name='Phase 4 Applicant ${run}' LIMIT 1;`);
  expect(caseId).toContain("onb_");
  await expectService(request, "/reporting/public-snapshots", 403);

  await page.evaluate(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: reviewer, org: provider });
  await page.getByRole("button", { name: new RegExp(`Phase 4 Applicant ${run}`) }).click();
  await expect(page.getByText(/Activation Preview:/)).toBeVisible();
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/organization-onboarding/cases/${caseId}/approve`) && res.status() < 300),
    page.getByRole("button", { name: "Approve Onboarding" }).click(),
  ]);
  await expect(page.getByText("Application approved.")).toBeVisible();
  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/organization-onboarding/cases/${caseId}/activate`) && res.status() < 300),
    page.getByRole("button", { name: "Activate Onboarding" }).click(),
  ]);
  await expect(page.getByText("Organization activated.")).toBeVisible();
  await expect(page.getByText("ACTIVATED").first()).toBeVisible();

  const persisted = db(`
    SELECT c.status, c.activated_organization_id, r.relationship_type, r.status,
           string_agg(s.service_key || ':' || e.status || ':' || e.granted_by_user_id, ',' ORDER BY s.service_key)
    FROM organization_onboarding_cases c
    JOIN organization_relationships r ON r.relationship_id=c.activation_relationship_id
    JOIN organization_service_entitlements e ON e.organization_id=c.activated_organization_id
    JOIN service_catalog s ON s.service_id=e.service_id
    WHERE c.onboarding_case_id='${caseId}' AND e.status='ACTIVE'
    GROUP BY c.status, c.activated_organization_id, r.relationship_type, r.status;
  `);
  expect(persisted).toContain(`ACTIVATED\t${applicantOrg}\tNETWORK_MEMBER_OF\tACTIVE`);
  expect(persisted).toContain(`curriculum:ACTIVE:${reviewer}`);
  expect(persisted).toContain(`reporting:ACTIVE:${reviewer}`);
  await expectService(request, "/curriculum/catalog/courses", 200);
  await expectService(request, "/reporting/public-snapshots", 200);

  const duplicateActive = db(`
    SELECT MAX(count)::int FROM (
      SELECT COUNT(*) AS count FROM organization_service_entitlements e
      JOIN service_catalog s ON s.service_id=e.service_id
      WHERE e.organization_id='${applicantOrg}' AND e.status='ACTIVE' AND s.service_key IN ('curriculum','reporting')
      GROUP BY s.service_key
    ) grouped;
  `);
  expect(duplicateActive).toBe("1");
  const relationshipCount = db(`SELECT COUNT(*) FROM organization_relationships WHERE source_organization_id='${applicantOrg}' AND target_organization_id='${provider}' AND relationship_type='NETWORK_MEMBER_OF' AND status='ACTIVE';`);
  expect(relationshipCount).toBe("1");

  const selfApprove = await apiRequest(request, "post", `/organization-onboarding/cases/${caseId}/approve`, applicant, applicantOrg, { approved_services: ["curriculum"] });
  expect(selfApprove.status()).toBe(403);
  const crossRead = await apiRequest(request, "get", `/organization-onboarding/cases/${caseId}`, ordinary, otherOrg);
  expect(crossRead.status()).toBe(404);
  const crossActivate = await apiRequest(request, "post", `/organization-onboarding/cases/${caseId}/activate`, ordinary, otherOrg, {});
  expect(crossActivate.status()).toBe(403);
  const forged = await apiRequest(request, "post", "/organization-onboarding/cases", applicant, applicantOrg, {
    organizationName: "Forged",
    primaryContactName: "F",
    primaryContactEmail: "f@example.org",
    requestedRelationshipType: "NETWORK_MEMBER_OF",
    requestedServices: ["curriculum"],
    status: "APPROVED",
  });
  expect(forged.status()).toBe(400);

  await Promise.all([
    page.waitForResponse((res) => res.url().includes(`/organization-onboarding/cases/${caseId}/suspend`) && res.status() < 300),
    page.getByRole("button", { name: "Suspend Onboarding" }).click(),
  ]);
  await expect(page.getByText("Organization suspended.")).toBeVisible();
  await expectService(request, "/reporting/public-snapshots", 403);

  const audit = db(`
    SELECT action_type FROM audit_events
    WHERE target_object_type='organization_onboarding_case'
      AND target_object_id='${caseId}'
    ORDER BY created_at;
  `);
  expect(audit).toContain("organization.onboarding.submitted");
  expect(audit).toContain("organization.onboarding.approved");
  expect(audit).toContain("organization.onboarding.activated");
  expect(audit).toContain("organization.onboarding.suspended");
  expect(snapshotSideEffects()).toBe(before);

  for (const payload of browserPayloads) {
    for (const forbidden of ["approved", "status", "organization_id", "activated_organization_id", "relationship_status", "entitlement_status", "reviewed_by", "activated_by", "provider_organization_id", "tenant_id"]) {
      expect(payload, `browser payload must not send ${forbidden}`).not.toHaveProperty(forbidden);
    }
  }
});

test("mobile onboarding intake and reviewer controls remain usable and perceivable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(({ token, org }) => {
    localStorage.setItem("shfOperatorToken", `dev-token:${token}`);
    localStorage.setItem("shfOperatorOrganizationId", org);
  }, { token: applicant, org: applicantOrg });
  await page.goto(`${frontend}/#/operator/onboarding`);
  await expect(page.getByRole("heading", { name: "Applicant Intake" })).toBeVisible();
  await page.getByLabel("Organization Name").fill(`Mobile ${run}`);
  await page.getByLabel("Primary Contact").fill("Mobile Contact");
  await page.getByLabel("Contact Email").fill(`mobile-${run}@example.org`);
  await page.getByRole("button", { name: "Submit Application" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Application submitted.")).toBeVisible();
  await expect(page.getByText(/SUBMITTED|ACTIVATED|SUSPENDED/).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
