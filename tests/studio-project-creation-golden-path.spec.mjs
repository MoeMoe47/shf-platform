import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;
const database = process.env.SHS_TEST_DATABASE_URL;
if (!frontend || !api || !database) throw new Error("Studio project creation acceptance requires the disposable environment.");

const token = (id) => `Bearer dev-token:${id}`;

function enableStudioPermissions() {
  execFileSync("psql", [database, "-X", "-v", "ON_ERROR_STOP=1", "-c", `
    INSERT INTO role_permissions (role_permission_id, role_id, permission_name) VALUES
      ('studio_create_golden_path','phase8_role_student','studio.project.create'),
      ('studio_view_golden_path','phase8_role_student','studio.project.view'),
      ('studio_update_golden_path','phase8_role_student','studio.project.update')
    ON CONFLICT DO NOTHING;
  `], { encoding: "utf8" });
}

async function studentPage(browser, id = "learner_A1") {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id }) => { window.__user = { id, role: "student", email: `${id}@phase.test`, name: id }; }, { id });
  return page;
}

async function completeNewProject(page, type, title, audience) {
  await page.goto(`${frontend}/curriculum.html#/studio/new?type=${type}`, { waitUntil: "domcontentloaded" });
  const requestPromise = page.waitForRequest((request) => request.method() === "POST" && request.url().endsWith("/studio/projects"));
  const responsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith("/studio/projects"));
  await expect(page.getByRole("heading", { name: "What do you want to create?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).press("Enter");
  await expect(page.getByRole("heading", { name: "What are you making?" })).toBeVisible();
  await page.getByLabel("Project name").fill(title);
  await page.getByLabel("What should it help someone do?").fill("A useful student project.");
  await page.getByRole("button", { name: "Continue" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Who is it for?" })).toBeVisible();
  await page.getByLabel("Who is it for? (optional)").fill(audience);
  await page.getByRole("button", { name: "Start Project" }).press("Enter");
  const request = await requestPromise;
  const response = await responsePromise;
  const body = await response.json().catch(() => ({}));
  expect(response.status(), JSON.stringify({ url: request.url(), payload: request.postDataJSON(), body })).toBe(201);
  return body.data ?? body;
}

test.describe.configure({ mode: "serial" });

test("student creates a personal Website from the real three-step UI", async ({ browser }) => {
  enableStudioPermissions();
  const page = await studentPage(browser);
  const project = await completeNewProject(page, "WEBSITE", `Browser Website ${Date.now()}`, "me");
  expect(project.projectId).toBeTruthy();
  expect(project.ownerType).toBe("INDIVIDUAL");
  expect(project.teamId).toBeNull();
  await expect(page).toHaveURL(new RegExp(`/curriculum.html#/studio/projects/${project.projectId}$`));
  await expect(page.locator("header h1").filter({ hasText: project.title })).toBeVisible();
  await expect(page.getByText("Personal Project", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Build Workspace" })).toBeVisible();
  await page.getByRole("link", { name: "Open Build Workspace" }).press("Enter");
  await expect(page.getByRole("heading", { name: "Build Your Website" })).toBeVisible();
  await page.getByLabel("Page content").fill("Personal project content.");
  await page.getByRole("button", { name: "Save draft" }).press("Enter");
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();
  await page.close();
});

test("student creates a personal AI Agent from the real three-step UI", async ({ browser }) => {
  enableStudioPermissions();
  const page = await studentPage(browser);
  const project = await completeNewProject(page, "AI_AGENT", `Browser Agent ${Date.now()}`, "me");
  expect(project.projectId).toBeTruthy();
  expect(project.ownerType).toBe("INDIVIDUAL");
  expect(project.teamId).toBeNull();
  await expect(page).toHaveURL(new RegExp(`/curriculum.html#/studio/projects/${project.projectId}$`));
  await expect(page.locator("header h1").filter({ hasText: project.title })).toBeVisible();
  await expect(page.getByText("Personal Project", { exact: true })).toBeVisible();
  await page.close();
});
