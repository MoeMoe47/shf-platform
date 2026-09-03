import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_LOCALHOST_FRONTEND_URL || "http://localhost:5173";
const api = process.env.SHS_LOCALHOST_API_URL || "http://127.0.0.1:8091";
const token = (id) => `Bearer dev-token:${id}`;

async function apiJson(request, id, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, {
    ...options,
    headers: { Authorization: token(id), "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body, data: body.data ?? body };
}

async function actorPage(browser, id) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(({ id }) => {
    window.__user = { id, role: "student", email: `${id}@localhost.test`, name: id === "learner_A1" ? "Learner A1" : "Learner A2" };
  }, { id });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) {
      return route.continue({ headers: { ...request.headers(), authorization: token(id) } });
    }
    return route.continue();
  });
  return page;
}

test("actual localhost Team collaboration smoke uses authenticated project access and live updates", async ({ browser, request }) => {
  test.setTimeout(60000);
  const team = await apiJson(request, "admin_A", "/studio/teams", { method: "POST", data: { name: `Localhost Phase 13 ${Date.now()}` } });
  expect(team.response.status(), JSON.stringify(team.body)).toBe(201);
  for (const [userId, role] of [["learner_A1", "LEAD"], ["learner_A2", "MEMBER"]]) {
    const member = await apiJson(request, "admin_A", `/studio/teams/${team.data.teamId}/members`, { method: "POST", data: { userId, role } });
    expect(member.response.status(), JSON.stringify(member.body)).toBe(201);
  }
  const project = await apiJson(request, "learner_A1", "/studio/projects", { method: "POST", data: { projectType: "WEBSITE", title: "Localhost Phase 13 Website", teamId: team.data.teamId } });
  expect(project.response.status(), JSON.stringify(project.body)).toBe(201);
  const projectId = project.data.projectId;

  const pageA = await actorPage(browser, "learner_A1");
  const pageB = await actorPage(browser, "learner_A2");
  const url = `${frontend}/curriculum.html#/studio/projects/${projectId}/build`;
  await Promise.all([pageA.goto(url, { waitUntil: "domcontentloaded" }), pageB.goto(url, { waitUntil: "domcontentloaded" })]);
  await expect(pageA.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageB.getByText("Connected", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageA.getByText("Learner A2", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(pageB.getByText("Learner A1", { exact: true })).toBeVisible({ timeout: 15000 });
  await pageA.getByLabel("Page content").fill("Actual localhost remote update");
  await expect(pageB.getByLabel("Page content")).toHaveValue("Actual localhost remote update", { timeout: 15000 });
  await pageA.close();
  await pageB.close();
});
