import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const api = process.env.SHS_TEST_API_URL;
const fixture = JSON.parse(readFileSync(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));
const token = (userId) => `Bearer dev-token:${userId}`;
const url = (path) => `${api}${path}`;

async function call(request, userId, path, options = {}) {
  const response = await request.fetch(url(path), { ...options, headers: { Authorization: token(userId), ...(options.headers || {}) } });
  return { response, body: await response.json().catch(() => ({})) };
}

test("U6 profile, fail-closed eligibility, and scoped verification paths are live", async ({ request }) => {
  const profiles = await call(request, fixture.adminA, "/credentials/certificates/profiles");
  expect(profiles.response.status()).toBe(200);
  expect(profiles.body.data.items.some((item) => item.profileKey === "foundation.course-completion")).toBe(true);

  const eligibility = await call(request, fixture.adminA, "/credentials/certificates/eligibility", { method: "POST", data: { productKey: "foundation", profileKey: "foundation.course-completion", profileVersion: "1.0", canonicalProgramReference: "curriculum-course", certificateType: "COURSE_COMPLETION", learnerUserId: fixture.learnerA1, courseReference: fixture.courseA } });
  expect(eligibility.response.status()).toBe(200);
  expect(["INCOMPLETE", "BLOCKED"]).toContain(eligibility.body.data.state);
  expect(eligibility.body.data.eligible).toBe(false);

  const wrongProduct = await call(request, fixture.adminA, "/credentials/certificates/eligibility", { method: "POST", data: { productKey: "oas", profileKey: "foundation.course-completion", profileVersion: "1.0", canonicalProgramReference: "curriculum-course", certificateType: "COURSE_COMPLETION", learnerUserId: fixture.learnerA1, courseReference: fixture.courseA } });
  expect(wrongProduct.response.status()).toBe(400);
  expect(wrongProduct.body.error.code).toBe("CERTIFICATE_PROFILE_PRODUCT_MISMATCH");

  const program = await call(request, fixture.adminA, "/credentials/certificates/eligibility", { method: "POST", data: { productKey: "foundation", profileKey: "foundation.data-center-ai-infrastructure-pathway", profileVersion: "1.0", canonicalProgramReference: "data-center-specialization-11", certificateType: "PROGRAM_COMPLETION", learnerUserId: fixture.learnerA1 } });
  expect(program.response.status()).toBe(200);
  expect(program.body.data.reason).toBe("PROGRAM_COMPLETION_REQUIREMENTS_UNAVAILABLE");

  const completion = await call(request, fixture.learnerA1, `/curriculum/lessons/${fixture.lessonA}/complete`, { method: "POST", data: { curriculum: fixture.courseA } });
  if (completion.response.status() === 200) {
    const issued = await call(request, fixture.adminA, "/credentials/certificates/issue", { method: "POST", data: { productKey: "foundation", profileKey: "foundation.course-completion", profileVersion: "1.0", canonicalProgramReference: "curriculum-course", certificateType: "COURSE_COMPLETION", learnerUserId: fixture.learnerA1, courseReference: fixture.courseA } });
    expect(issued.response.status()).toBe(201);
    const replay = await call(request, fixture.adminA, "/credentials/certificates/issue", { method: "POST", data: { productKey: "foundation", profileKey: "foundation.course-completion", profileVersion: "1.0", canonicalProgramReference: "curriculum-course", certificateType: "COURSE_COMPLETION", learnerUserId: fixture.learnerA1, courseReference: fixture.courseA } });
    expect(replay.response.status()).toBe(201);
    expect(replay.body.data.certificateId).toBe(issued.body.data.certificateId);
    const rendered = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/render`, { method: "POST", data: { format: "PDF" } });
    expect(rendered.response.status()).toBe(200);
    expect(rendered.body.data.hash).toMatch(/^[0-9a-f]{64}$/);
    const html = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/render`, { method: "POST", data: { format: "HTML" } });
    expect(html.response.status()).toBe(200);
    expect(Buffer.from(html.body.data.bytesBase64, "base64").toString("utf8")).toMatch(/<svg/);
    const verification = await call(request, fixture.adminA, `/certificates/verify/${encodeURIComponent(issued.body.data.verificationReference)}`);
    expect(verification.response.status()).toBe(200);
    expect(verification.body.data.valid).toBe(true);
    const emailed = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/email`, { method: "POST", data: {} });
    expect(emailed.response.status()).toBe(200);
    expect(emailed.body.data.delivered).toBe(true);
  }
});
