import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("SEA-4 dedicated evidence requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;

async function actorPage(browser, id, role, viewport) {
  const page = await browser.newPage({ viewport });
  await page.addInitScript(({ id, role }) => { window.__user = { id, role, email: `${id}@sea4.test`, name: id }; }, { id, role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    return route.continue();
  });
  return page;
}

function seedEvidenceFixtures() {
  const sql = String.raw`
INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
 ('sea4_student_studio_create','phase8_role_student','studio.project.create'),
 ('sea4_student_studio_view','phase8_role_student','studio.project.view'),
 ('sea4_student_studio_update','phase8_role_student','studio.project.update'),
 ('sea4_instructor_studio_view','phase8_role_instructor','studio.project.view'),
 ('sea4_instructor_studio_update','phase8_role_instructor','studio.project.update'),
 ('sea4_admin_studio_view','phase8_role_admin','studio.project.view'),
 ('sea4_admin_arag_read','phase8_role_admin','arag.release.read') ON CONFLICT DO NOTHING;
INSERT INTO service_catalog (service_id, service_key, name, description, category, status, provider_organization_id, audience)
VALUES ('sea4_project_studio_service','project_studio','Project Studio','SEA-4 dedicated Studio browser evidence fixture','PROJECT_STUDIO','ACTIVE','phase8_org_a','NETWORK_ORGANIZATION')
ON CONFLICT (service_key) DO NOTHING;
INSERT INTO organization_service_entitlements (entitlement_id, organization_id, service_id, status, granted_by_user_id, reason)
SELECT 'sea4_phase8_studio_entitlement','phase8_org_a',service_id,'ACTIVE','admin_A','SEA-4 dedicated Studio browser evidence fixture'
FROM service_catalog WHERE service_key='project_studio' ON CONFLICT DO NOTHING;
UPDATE projects SET studio_origin='STUDENT_IDEA', studio_assignment_id=NULL, studio_learner_id='learner_A1', studio_project_type='WEBSITE', studio_destination='STUDENT', studio_status='BUILDING', studio_qa_status='NOT_RUN', studio_review_status='NOT_REQUESTED', studio_delivery_status='NOT_READY' WHERE project_id='phase8_project_a';
INSERT INTO studio_builder_workspaces (workspace_id, project_id, organization_id, tenant_id, project_type, work_json, revision, created_by_user_id)
VALUES ('sea4_workspace_a','phase8_project_a','phase8_org_a','tenant:phase8_org_a','WEBSITE','{"pages":[{"path":"/","title":"Home","content":"SEA-4 evidence fixture"}]}',1,'learner_A1') ON CONFLICT (project_id) DO NOTHING;
INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ('sea4_provider_org','SEA-4 Provider Test Organization','SEA-4 Provider','nonprofit','active') ON CONFLICT DO NOTHING;
INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ('sea4_provider','sea4_provider_org','provider@sea4.test','SEA-4 Provider','active','test') ON CONFLICT DO NOTHING;
INSERT INTO roles (role_id, organization_id, role_name, role_scope_type, is_system_role) VALUES ('sea4_role_provider',NULL,'provider','ORGANIZATION',true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES ('sea4_provider_view','sea4_role_provider','government.assurance.provider.self_service.view'),('sea4_provider_submit','sea4_role_provider','government.assurance.provider.self_service.submit') ON CONFLICT DO NOTHING;
INSERT INTO memberships (membership_id,user_id,organization_id,role_id,status,effective_from) VALUES ('sea4_provider_membership','sea4_provider','sea4_provider_org','sea4_role_provider','active',NOW()) ON CONFLICT DO NOTHING;
INSERT INTO gpa_evidence_requests (evidence_request_id,organization_id,tenant_id,provider_reference,program_reference,requirement_reference,control_reference,evidence_type,requested_by,requested_at,due_at,status,provenance)
VALUES ('sea4_provider_request','sea4_provider_org','tenant:sea4_provider_org','sea4_provider_org','sea4-program','sea4-requirement','sea4-control','SERVICE_RECORD','admin_A',NOW(),NOW()+INTERVAL '7 days','REQUESTED','{"fixture":"sea4-dedicated","testOnly":true}') ON CONFLICT DO NOTHING;
INSERT INTO gpa_findings (finding_id,organization_id,tenant_id,provider_reference,program_reference,requirement_reference,control_reference,finding_type,severity,materiality,description,status,corrective_action_required,provenance,created_by)
VALUES ('sea4_provider_finding','sea4_provider_org','tenant:sea4_provider_org','sea4_provider_org','sea4-program','sea4-requirement','sea4-control','DOCUMENTATION_GAP','MEDIUM','MODERATE','Provide the missing service record.','CORRECTIVE_ACTION_REQUIRED',true,'{"fixture":"sea4-dedicated","testOnly":true}','sea4_provider') ON CONFLICT DO NOTHING;
INSERT INTO gpa_corrective_actions (corrective_action_id,finding_id,organization_id,tenant_id,provider_reference,program_reference,required_action,action_owner,due_at,status,provenance,created_by)
VALUES ('sea4_provider_action','sea4_provider_finding','sea4_provider_org','tenant:sea4_provider_org','sea4_provider_org','sea4-program','Provide the missing service record.','sea4_provider_org',NOW()+INTERVAL '7 days','REQUIRED','{"fixture":"sea4-dedicated","testOnly":true}','sea4_provider') ON CONFLICT DO NOTHING;
`;
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", sql], { encoding: "utf8" });
}

test.beforeAll(() => seedEvidenceFixtures());
test.describe.configure({ mode: "serial" });

test("authenticated Career SEA evidence is distinct from public regression coverage", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", "student", { width: 375, height: 812 });
  await page.goto(`${frontend}/career.html#/dashboard`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /career/i }).first()).toBeVisible();
  await expect(page.getByText(/pathway|profile/i).first()).toBeVisible();
  await expect(page.getByText(/next|continue|explore/i).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/job feed|labor market|employment rate/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.close();
});

test("Hub/BOS validates current Guidance Center semantics", async ({ browser }) => {
  const page = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1440, height: 900 });
  await page.goto(`${frontend}/admin.html#/hub`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Silicon Heartland Hub" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Organization and service context" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Next action" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Open Intake|Set up my data/i })).toBeVisible();
  await page.close();
});

test("Studio Builder uses canonical /studio project route", async ({ browser }) => {
  const page = await actorPage(browser, "learner_A1", "student", { width: 1440, height: 900 });
  await page.goto(`${frontend}/curriculum.html#/studio/projects/phase8_project_a/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Build workspace", { exact: true })).toBeVisible();
  await expect(page.getByText("You are building your project.", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await expect(page.getByRole("button", { name: /approve|review decision/i })).toHaveCount(0);
  await page.close();
});

test("Studio QA uses the canonical /studio project QA projection", async ({ browser }) => {
  const page = await actorPage(browser, "admin_A", "org_admin", { width: 1440, height: 900 });
  await page.goto(`${frontend}/curriculum.html#/studio/projects/phase8_project_a/build`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Build workspace", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check My Project" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: /Not checked yet|Needs changes|Looks good|Check could not finish/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await page.close();
});

test("Studio Reviewer uses canonical reviewer queue", async ({ browser }) => {
  const page = await actorPage(browser, "instructor_A_authorized", "instructor", { width: 1440, height: 900 });
  await page.goto(`${frontend}/curriculum.html#/studio/reviewer-queue`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Needs Review" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Assigned reviews" })).toBeVisible();
  await expect(page.getByText(/No work is waiting|Review Work/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toHaveCount(0);
  await page.close();
});

test("CivicSure Provider is authenticated and cannot verify", async ({ browser }) => {
  const page = await actorPage(browser, "sea4_provider", "provider", { width: 768, height: 1024 });
  await page.goto(`${frontend}/index.html#/civicsure/provider`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Provider assurance workspace" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Provider and program context" })).toBeVisible();
  await expect(page.getByText(/cannot verify outcomes/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /verify|approve/i })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await page.close();
});

test("ARAG-1 authenticated surface preserves human release authority", async ({ browser }) => {
  const page = await actorPage(browser, "admin_A", "org_admin", { width: 1440, height: 900 });
  await page.goto(`${frontend}/admin.html#/release-assurance`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Release Assurance", exact: true })).toBeVisible();
  await expect(page.getByText(/AI work, policy checks, Evidence readiness, human approval, and the release gate/i)).toBeVisible();
  await expect(page.getByText(/Release execution remains unavailable until canonical assurance/i)).toBeVisible();
  const response = await page.request.post(`${api}/arag/releases/sea4-missing/release`, { headers: { Authorization: token("admin_A") }, data: { authorizationId: "missing" } });
  expect([403, 404]).toContain(response.status());
  await page.close();
});
