import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;

async function installAuth(page, userId, role) {
  const token = `Bearer dev-token:${userId}`;
  await page.addInitScript(({ tokenValue, roleValue, userValue }) => {
    localStorage.setItem("shfOperatorToken", tokenValue);
    window.__user = { id: userValue, role: roleValue };
  }, { tokenValue: token.slice(7), roleValue: role, userValue: userId });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token } });
    return route.continue();
  });
}

async function resolve(request, userId, destinationId, routeId) {
  const response = await request.get(`${api}/orientation/context?destinationId=${encodeURIComponent(destinationId)}&routeId=${encodeURIComponent(routeId)}`, { headers: { authorization: `Bearer dev-token:${userId}` } });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

test.describe("OGL-5 destination browser fixtures", () => {
  test.skip(!frontend || !api, "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required");

  test("Student fixture exercises the real Curriculum route", async ({ page, request }) => {
    const result = await resolve(request, "learner_A1", "curriculum", "curriculum.dashboard");
    expect(result.data.orientation.orientationId).toBe("orientation:curriculum:student-dashboard");
    await installAuth(page, "learner_A1", "student");
    await page.goto(`${frontend}/curriculum.html#/curriculum/asl/dashboard`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="curriculum-workspace"]')).toBeVisible();
  });

  test("Instructor fixture selects the instructor contract", async ({ page, request }) => {
    const result = await resolve(request, "instructor_A_authorized", "curriculum", "curriculum.instructor.operations");
    expect(result.data.orientation.orientationId).toBe("orientation:curriculum:instructor-operations");
    await installAuth(page, "instructor_A_authorized", "instructor");
    await page.goto(`${frontend}/curriculum.html#/curriculum/instructor/operations`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="curriculum-instructor-workspace"]')).toBeVisible();
  });

  test("CivicSure operator fixture is separated from provider guidance", async ({ page, request }) => {
    const result = await resolve(request, "operator_A", "civic", "civicsure.operator.verification");
    expect(result.data.orientation.orientationId).toBe("orientation:civicsure:operator");
    await installAuth(page, "operator_A", "operator");
    await page.goto(`${frontend}/admin.html#/verification-audit`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="civicsure-operator-review-queue"]')).toBeVisible();
  });

  test("Agent Fabric fixture remains bounded by the governed contract", async ({ page, request }) => {
    const result = await resolve(request, "operator_A", "agent-fabric", "agent-fabric.operator.workspace");
    expect(result.data.orientation.orientationId).toBe("orientation:agent-fabric:operator");
    await installAuth(page, "operator_A", "operator");
    await page.goto(`${frontend}/admin.html#/agent-fabric`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="agent-fabric-work-orders"]')).toBeVisible();
  });

  test("Admin fixture exercises protected Executive Command", async ({ page, request }) => {
    const result = await resolve(request, "admin_A", "shs-bos-executive-command", "shs.bos.executive-command");
    expect(result.data.orientation.orientationId).toBe("orientation:shs-bos:executive-command");
    await installAuth(page, "admin_A", "org_admin");
    await page.goto(`${frontend}/admin.html#/ops/executive-command`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="executive-command-overview"]')).toBeVisible();
  });

  test("normal actor cannot resolve Executive Command", async ({ request }) => {
    const response = await request.get(`${api}/orientation/context?destinationId=shs-bos-executive-command&routeId=shs.bos.executive-command`, { headers: { authorization: "Bearer dev-token:learner_A1" } });
    expect(response.status()).toBe(403);
  });

  test("Student fixture exercises the real Studio route", async ({ page }) => {
    await installAuth(page, "learner_A1", "student");
    await page.goto(`${frontend}/curriculum.html#/studio`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Open Guidance Center" })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-ogl-anchor="curriculum-workspace"]')).toBeVisible();
  });
});
