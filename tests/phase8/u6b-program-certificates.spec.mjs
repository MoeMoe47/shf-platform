import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const api = process.env.SHS_TEST_API_URL;
const fixture = JSON.parse(readFileSync(process.env.SHS_PHASE8_FIXTURE_MANIFEST, "utf8"));
const token = (userId) => `Bearer dev-token:${userId}`;

async function call(request, userId, path, options = {}) {
  const response = await request.fetch(`${api}${path}`, {
    ...options,
    headers: { Authorization: token(userId), ...(options.headers || {}) },
  });
  return { response, body: await response.json().catch(() => ({})) };
}

test("U6B Data Center completion reaches certificate delivery and verification", async ({ request }) => {
  const completion = await call(request, fixture.adminA, `/credentials/programs/${fixture.dataCenterProgram}/completion?learner_id=${fixture.learnerA1}`);
  expect(completion.response.status()).toBe(200);
  expect(completion.body.data.status).toBe("COMPLETED");
  expect(completion.body.data.completed).toBe(true);
  expect(completion.body.data.requirementsVersion).toContain("technical-operations");
  expect(completion.body.data.programCompletionId).toMatch(/^program_completion_/);

  const replayCompletion = await call(request, fixture.adminA, `/credentials/programs/${fixture.dataCenterProgram}/completion?learner_id=${fixture.learnerA1}`);
  expect(replayCompletion.body.data.programCompletionId).toBe(completion.body.data.programCompletionId);

  const eligibility = await call(request, fixture.adminA, "/credentials/certificates/eligibility", {
    method: "POST",
    data: {
      productKey: "foundation",
      profileKey: "foundation.data-center-ai-infrastructure-pathway",
      profileVersion: "1.0",
      canonicalProgramReference: fixture.dataCenterProgram,
      certificateType: "PROGRAM_COMPLETION",
      learnerUserId: fixture.learnerA1,
    },
  });
  expect(eligibility.response.status()).toBe(200);
  expect(eligibility.body.data.state).toBe("ELIGIBLE");
  expect(eligibility.body.data.qualificationReference).toBe(`program-completion:${completion.body.data.programCompletionId}`);

  const issueInput = {
    productKey: "foundation",
    profileKey: "foundation.data-center-ai-infrastructure-pathway",
    profileVersion: "1.0",
    canonicalProgramReference: fixture.dataCenterProgram,
    certificateType: "PROGRAM_COMPLETION",
    learnerUserId: fixture.learnerA1,
  };
  const issued = await call(request, fixture.adminA, "/credentials/certificates/issue", { method: "POST", data: issueInput });
  expect(issued.response.status()).toBe(201);
  expect(issued.body.data.status).toBe("ISSUED");
  expect(issued.body.data.profileKey).toBe(issueInput.profileKey);
  expect(issued.body.data.qualificationReference).toBe(eligibility.body.data.qualificationReference);
  expect(issued.body.data.contentHash).toMatch(/^[0-9a-f]{64}$/);

  const repeated = await call(request, fixture.adminA, "/credentials/certificates/issue", { method: "POST", data: issueInput });
  expect(repeated.response.status()).toBe(201);
  expect(repeated.body.data.certificateId).toBe(issued.body.data.certificateId);

  const html = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/render`, { method: "POST", data: { format: "HTML" } });
  expect(html.response.status()).toBe(200);
  const htmlBytes = Buffer.from(html.body.data.bytesBase64, "base64").toString("utf8");
  expect(htmlBytes).toContain("Data Center &amp; AI Infrastructure Pathway Completion");
  expect(htmlBytes).toContain("silicon-heartland-foundation");
  expect(htmlBytes).toContain("/certificates/verify/");
  expect(htmlBytes).toContain("<svg");
  expect(html.body.data.hash).toMatch(/^[0-9a-f]{64}$/);

  const pdf = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/render`, { method: "POST", data: { format: "PDF" } });
  expect(pdf.response.status()).toBe(200);
  expect(pdf.body.data.mimeType).toBe("application/pdf");
  expect(Buffer.from(pdf.body.data.bytesBase64, "base64").subarray(0, 4).toString()).toBe("%PDF");
  expect(pdf.body.data.hash).toMatch(/^[0-9a-f]{64}$/);

  const downloaded = await request.fetch(`${api}/credentials/certificates/${issued.body.data.certificateId}/files/${encodeURIComponent(pdf.body.data.renderId)}`, { headers: { Authorization: token(fixture.learnerA1) } });
  expect(downloaded.status()).toBe(200);
  expect(downloaded.headers()["content-type"]).toContain("application/pdf");
  expect(Buffer.from(await downloaded.body()).subarray(0, 4).toString()).toBe("%PDF");

  const emailed = await call(request, fixture.adminA, `/credentials/certificates/${issued.body.data.certificateId}/email`, { method: "POST", data: {} });
  expect(emailed.response.status()).toBe(200);
  expect(emailed.body.data.delivered).toBe(true);
  expect(emailed.body.data.recipientReference).toBe("learner.a1@phase8.test");
  expect(emailed.body.data.attachmentHash).toMatch(/^[0-9a-f]{64}$/);

  const verification = await call(request, fixture.adminA, `/certificates/verify/${encodeURIComponent(issued.body.data.verificationReference)}`);
  expect(verification.response.status()).toBe(200);
  expect(verification.body.data.valid).toBe(true);
  expect(verification.body.data.certificateReference).toBe(issued.body.data.certificateSerial);
  expect(JSON.stringify(verification.body.data)).not.toContain("learner.a1@phase8.test");

  const incomplete = await call(request, fixture.adminA, `/credentials/programs/${fixture.dataCenterProgram}/completion?learner_id=${fixture.incompleteLearner}`);
  expect(incomplete.response.status()).toBe(200);
  expect(incomplete.body.data.completed).toBe(false);
  expect(incomplete.body.data.status).toBe("IN_PROGRESS");
  const blockedIssue = await call(request, fixture.adminA, "/credentials/certificates/issue", { method: "POST", data: { ...issueInput, learnerUserId: fixture.incompleteLearner } });
  expect([403, 409]).toContain(blockedIssue.response.status());
});
