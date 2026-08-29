import { test, expect } from "@playwright/test";

const api = String(process.env.SHS_TEST_API_URL || "").replace(/\/$/, "");
const admin = "Bearer dev-token:user_admin_001";
const learner = "Bearer dev-token:user_student_001";
const operator = "Bearer dev-token:user_operator_001";
const headers = (token) => ({ Authorization: token, "Content-Type": "application/json" });

async function request(page, method, path, token, data, expected) {
  const response = await page.request[method](`${api}${path}`, { headers: headers(token), data });
  const body = await response.text();
  expect(response.status(), `${method} ${path}: ${body}`).toBe(expected);
  return body ? JSON.parse(body).data : undefined;
}

test("specialization request remains separate until authorized confirmation and eligibility is derived", { skip: api ? false : "stack URL required", timeout: 120_000 }, async ({ page }) => {
  const available = await request(page, "get", "/program-specialization-assignments/available", learner, undefined, 200);
  expect(available.map((item) => item.specialization_id)).toHaveLength(6);

  const pending = await request(page, "post", "/program-specialization-requests", learner, { program_id: "data-center-specialization-11", specialization_id: "networking-fiber", learner_rationale: "I want to understand reliable network paths." }, 201);
  expect(pending.status).toBe("PENDING");
  expect(await request(page, "get", "/program-specialization-assignments", learner, undefined, 200)).toHaveLength(0);
  expect((await request(page, "get", "/program-specialization-requests?program_id=data-center-specialization-11", learner, undefined, 200))[0].status).toBe("PENDING");

  const selfConfirm = await page.request.post(`${api}/program-specialization-requests/${pending.request_id}/confirm`, { headers: headers(learner), data: {} });
  expect(selfConfirm.status()).toBe(403);
  const staffConfirm = await page.request.post(`${api}/program-specialization-requests/${pending.request_id}/confirm`, { headers: headers(operator), data: {} });
  expect(staffConfirm.status()).toBe(403);

  const queue = await request(page, "get", "/program-specialization-requests/pending?program_id=data-center-specialization-11", admin, undefined, 200);
  expect(queue.some((item) => item.request_id === pending.request_id)).toBe(true);
  const confirmed = await request(page, "post", `/program-specialization-requests/${pending.request_id}/confirm`, admin, { specialization_id: "ai-cloud-infrastructure", staff_note: "Program review selected the capacity-focused branch." }, 200);
  expect(confirmed.status).toBe("CONFIRMED");
  expect(confirmed.requested_specialization_id).toBe("networking-fiber");
  expect(confirmed.resulting_assignment_id).toBeTruthy();
  expect((await request(page, "get", "/program-specialization-assignments", learner, undefined, 200)).find((row) => row.status === "ACTIVE").specialization_id).toBe("ai-cloud-infrastructure");

  const eligibility = await request(page, "get", "/programs/data-center-specialization-11/grade12-eligibility", learner, undefined, 200);
  expect(eligibility.status).toBe("NOT_ELIGIBLE");
  expect(eligibility.policy_version).toBe("grade12-entry-v1");
  expect(eligibility.missing_requirements.some((item) => item.code === "SHARED_CORE_REQUIREMENT_MISSING")).toBe(true);
  expect(eligibility.note).toMatch(/not career readiness/);

  const repeated = await request(page, "post", `/program-specialization-requests/${pending.request_id}/confirm`, admin, {}, 200);
  expect(repeated.resulting_assignment_id).toBe(confirmed.resulting_assignment_id);
  expect((await request(page, "get", "/program-specialization-assignments", learner, undefined, 200)).filter((row) => row.status === "ACTIVE")).toHaveLength(1);
});
