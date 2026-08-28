// Regression protection for Phase 2A Secure Live Learning Infrastructure
// (2026-08-25): a real, server-authorized Live Learning backend
// (apps/shs-api's /live-learning/* routes) now backs the Phase 1
// LiveSessions.jsx UI. These tests require BOTH dev servers running:
//   - Vite frontend:  http://localhost:5173  (npm run dev, repo root)
//   - shs-api backend: http://127.0.0.1:8091  (cd apps/shs-api && npm run dev)
// Backend-only security guarantees (permission checks, join-window
// enforcement, secret non-exposure, etc.) are covered exhaustively by
// apps/shs-api/tests/live-learning.security.test.ts and
// live-learning.provider.test.ts (run via `npx tsx --test`), not
// duplicated here — this file covers the frontend integration only.
import { test, expect } from "@playwright/test";

const HTML_BASE = "http://localhost:5173/curriculum.html";
const API_BASE = "http://127.0.0.1:8091";

async function seedInstructorSession(title = `Playwright Session ${Date.now()}`) {
  const res = await fetch(`${API_BASE}/live-learning/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer dev-token:user_instructor_001" },
    body: JSON.stringify({ title, startsAt: new Date(Date.now() + 60_000).toISOString(), durationMinutes: 30 }),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`Seed failed: ${JSON.stringify(json)}`);
  return json.data;
}

test.describe("Live Sessions page: real backend integration", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows a real, backend-created session (not fabricated)", async ({ page }) => {
    const session = await seedInstructorSession();
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText(session.title);
  });

  test("Phase 1 elements remain unchanged (ZoomCard honest messaging, request-access button)", async ({ page }) => {
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("pending secure connection");
    await expect(page.getByRole("button", { name: "Request access" })).toBeVisible();
  });

  test("Request secure join returns a real, honest server decision", async ({ page }) => {
    const session = await seedInstructorSession();
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    const row = page.locator("li", { hasText: session.title });
    await row.getByRole("button", { name: "Request secure join" }).click();
    await expect(row).toContainText(/Authorized by the server|Not authorized/);
  });

  test("an allowed mock join is clearly labeled test-only and never opens a real meeting URL", async ({ page }) => {
    const session = await seedInstructorSession();
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    const row = page.locator("li", { hasText: session.title });
    await row.getByRole("button", { name: "Request secure join" }).click();
    const link = row.getByRole("link", { name: /Open mock session/ });
    await expect(link).toBeVisible();
    await expect(link).toContainText("test only");
    const href = await link.getAttribute("href");
    expect(href.startsWith("about:blank#")).toBe(true);
  });

  test("localStorage tampering cannot fabricate a real session or bypass the server", async ({ page }) => {
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      localStorage.setItem("zoom:approved", JSON.stringify(["attacker"]));
      localStorage.setItem("liveLearning:fakeSessions", JSON.stringify([{ title: "Fake Session", allowed: true }]));
    });
    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("body")).not.toContainText("Fake Session");
  });
});

test.describe("Manage Sessions page: server-enforced authorization", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("page loads and reachable via Live Sessions page link", async ({ page }) => {
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /manage sessions/i }).click();
    await expect(page.locator("body")).toContainText("Manage Live Sessions");
  });

  test("create attempt in the current (student) demo role is honestly denied by the server, not faked as success", async ({ page }) => {
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions/manage`, { waitUntil: "networkidle" });
    await page.locator("input[type=text], input:not([type])").first().fill("Should Be Denied");
    const now = new Date(Date.now() + 5 * 60_000);
    const pad = (n) => String(n).padStart(2, "0");
    const val = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    await page.locator("input[type=datetime-local]").fill(val);
    await page.getByRole("button", { name: "Create session" }).click();
    await expect(page.locator("body")).toContainText(/forbidden|missing permission/i);
    await expect(page.locator("body")).not.toContainText("Should Be Denied");
  });
});

test.describe("Build safety", () => {
  test("no page errors when loading Live Sessions and Manage Sessions", async ({ page }) => {
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions`, { waitUntil: "networkidle" });
    await page.goto(`${HTML_BASE}#/curriculum/live-sessions/manage`, { waitUntil: "networkidle" });
    expect(errors).toEqual([]);
  });
});
