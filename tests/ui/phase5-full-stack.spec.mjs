import { test, expect } from "@playwright/test";

const baseUrl = String(process.env.SHS_TEST_FRONTEND_URL || "").replace(/\/$/, "");
const apiUrl = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const completionLessons = JSON.parse(process.env.SHS_TEST_GRADE6_COMPLETION_LESSONS || JSON.stringify([
  "data-center-foundations-introduction",
]));

test("real Career-to-Curriculum learner flow uses the disposable API", {
  skip: baseUrl && apiUrl ? false : "SHS_TEST_FRONTEND_URL and SHS_TEST_API_URL are required",
}, async ({ page }) => {
  const careerRequests = [];
  const completionRequests = [];
  let completionAuthorization;
  page.on("request", (request) => {
    if (request.url().startsWith(apiUrl) && request.url().includes("/careers")) careerRequests.push(request);
    if (request.url().includes("/curriculum/lessons/") && request.url().includes("/complete")) {
      completionRequests.push(request);
      completionAuthorization ||= request.headers().authorization;
    }
  });

  await page.goto(`${baseUrl}/career.html#/explore`, { waitUntil: "networkidle" });
  await expect(page.getByText("Data Center & AI Infrastructure", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Open Data Center Technician" }).click();
  await expect(page.getByRole("dialog")).toContainText("Data Center Technician");
  await expect(page.getByRole("dialog")).toContainText("6–8");
  await expect(page.getByRole("dialog")).toContainText("DISCOVER");
  await expect(page.getByRole("dialog")).toContainText("recommended");
  await page.getByRole("dialog").getByRole("link", { name: "data-center-foundations-introduction" }).click();

  await expect(page).toHaveURL(/curriculum\.html#\/curriculum\/lessons\/data-center-foundations-introduction$/);
  await expect(page.getByRole("heading", { name: "What Is a Data Center?" })).toBeVisible();

  expect(careerRequests.length).toBeGreaterThan(0);

  for (const lessonId of completionLessons) {
    await page.goto(`${baseUrl}/curriculum.html#/curriculum/lessons/${encodeURIComponent(lessonId)}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const firstCompletion = page.waitForResponse((response) => response.url().includes(`/curriculum/lessons/${lessonId}/complete`) && response.request().method() === "POST");
    await page.getByRole("button", { name: "Mark Lesson Complete" }).click();
    expect((await firstCompletion).status()).toBe(200);
    await expect(page.getByRole("button", { name: /Lesson Complete/ })).toBeVisible();

    // The learner UI disables repeat clicks after success. Exercise the
    // supported authenticated HTTP boundary for the idempotency assertion.
    const repeatCompletion = await page.request.post(`${apiUrl}/curriculum/lessons/${lessonId}/complete`, {
      headers: { Authorization: completionAuthorization },
      data: { curriculum: "data-center-foundations" },
    });
    expect(repeatCompletion.status()).toBe(200);

    if (lessonId === completionLessons[0]) {
      const crossTenant = await page.request.post(`${apiUrl}/curriculum/lessons/${lessonId}/complete`, {
        headers: { Authorization: completionAuthorization, "x-shs-organization-id": "org_other" },
        data: { curriculum: "data-center-foundations" },
      });
      // The current canonical boundary denies this before persistence. Its
      // environment-specific response is 403 when authorization rejects the
      // context and 400 when the mismatched foreign key is rejected first.
      expect([400, 403]).toContain(crossTenant.status());
    }
  }

  expect(completionRequests).toHaveLength(completionLessons.length);
  for (const request of completionRequests) {
    expect(request.method()).toBe("POST");
    expect(request.postDataJSON()).toMatchObject({ curriculum: "data-center-foundations" });
  }
});
