import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL;
const api = process.env.SHS_TEST_API_URL;

async function installAuth(page, userId, role) {
  const token = `Bearer dev-token:${userId}`;
  await page.addInitScript(({ user, roleValue }) => { window.__user = { id: user, role: roleValue }; localStorage.setItem("shfOperatorToken", `dev-token:${user}`); }, { user: userId, roleValue: role });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (["fetch", "xhr"].includes(request.resourceType())) return route.continue({ headers: { ...request.headers(), authorization: token } });
    return route.continue();
  });
}

async function assertJourney(page, path, { user, role, heading } = {}) {
  if (user) await installAuth(page, user, role);
  await page.goto(`${frontend}${path}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("body")).not.toContainText(/Cannot read properties|Cannot GET|Application error/i);
  if (heading) await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible({ timeout: 15000 });
}

test.describe("EXR-4 canonical journey entry acceptance", () => {
  test.skip(!frontend || !api, "EXR-4 browser environment is required");

  test("public Foundation entry", async ({ page }) => assertJourney(page, "/foundation.html#/top", { heading: /Empowering Pathways to Success/i }));
  test("public Solutions discovery entry", async ({ page }) => assertJourney(page, "/solutions.html#/home", { heading: /Run your entire organization from one command center/i }));
  test("organization applicant onboarding workflow", async ({ page }) => assertJourney(page, "/civic.html#/operator/onboarding", { user: "admin_A", role: "org_admin", heading: /Organization Onboarding/i }));
  test("activated organization operator entry", async ({ page }) => assertJourney(page, "/admin.html#/ops/executive-command", { user: "admin_A", role: "org_admin", heading: /Executive Command/i }));
  test("student current-work entry", async ({ page }) => assertJourney(page, "/curriculum.html#/curriculum/asl/dashboard", { user: "learner_A1", role: "student", heading: /Current learning context/i }));
  test("instructor attention/work entry", async ({ page }) => assertJourney(page, "/curriculum.html#/curriculum/instructor/operations", { user: "instructor_A_authorized", role: "instructor", heading: /Operational Workspace/i }));
  test("Studio Builder entry", async ({ page }) => assertJourney(page, "/curriculum.html#/studio", { user: "learner_A1", role: "student", heading: /Studio/i }));
  test("Studio QA entry", async ({ page }) => assertJourney(page, "/curriculum.html#/studio/reviewer-queue", { user: "instructor_A_authorized", role: "instructor", heading: /Review|Queue|Studio/i }));
  test("Studio Reviewer entry", async ({ page }) => assertJourney(page, "/curriculum.html#/studio/reviewer-queue", { user: "admin_A", role: "org_admin", heading: /Review|Queue|Studio/i }));
  test("CivicSure provider entry", async ({ page }) => assertJourney(page, "/index.html#/civicsure/provider", { user: "instructor_A_authorized", role: "provider", heading: /Provider|CivicSure/i }));
  test("CivicSure operator entry", async ({ page }) => { await assertJourney(page, "/admin.html#/verification-audit", { user: "operator_A", role: "operator" }); await expect(page.locator('[data-ogl-anchor="civicsure-operator-review-queue"]')).toBeVisible(); });
  test("Accessibility support entry", async ({ page }) => assertJourney(page, "/civic.html#/operator/accommodations", { user: "learner_A1", role: "student", heading: /Accessibility Support/i }));
});
