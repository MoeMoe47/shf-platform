import test from "node:test";
import assert from "node:assert/strict";

const baseUrl = process.env.SYS3A5_API_URL || "http://127.0.0.1:8093";
const orgA = "sys3a5-org-a";
const orgB = "sys3a5-org-b";
const orgC = "sys3a5-org-c";

async function request(path: string, userId: string, organizationId: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer dev-token:${userId}`,
      "content-type": "application/json",
      "x-shs-organization-id": organizationId,
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null);
  return { response, body };
}

function data<T = any>(body: any): T {
  assert.equal(body?.ok, true, JSON.stringify(body));
  return body.data as T;
}

test("SYS-3A5 authenticated funding and report routes use canonical scoped services", async (t) => {
  if (process.env.WAVE3_LIVE !== "1") {
    t.skip("WAVE3_LIVE=1 required");
    return;
  }

  const grantResult = await request("/funding/grants", "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({
      title: "SYS-3A5 authenticated award",
      funderOrganizationId: orgB,
      recipientOrganizationId: orgA,
      reportingOrganizationId: orgA,
      awardAmount: "1000.00",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      restrictionType: "PROGRAM_RESTRICTED",
      restrictedProgramId: "sys3a5-program-a",
    }),
  });
  assert.equal(grantResult.response.status, 201, JSON.stringify(grantResult.body));
  const grant = data<any>(grantResult.body);

  const activeResult = await request(`/funding/grants/${grant.grantId || grant.grant_id}/status`, "sys3a5-user-a", orgA, {
    method: "PATCH",
    body: JSON.stringify({ status: "ACTIVE" }),
  });
  assert.equal(activeResult.response.status, 200, JSON.stringify(activeResult.body));

  const grantId = grant.grantId || grant.grant_id;
  const allocationResult = await request(`/funding/grants/${grantId}/allocations`, "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ programId: "sys3a5-program-a", allocatedAmount: "1000.00" }),
  });
  assert.equal(allocationResult.response.status, 201, JSON.stringify(allocationResult.body));

  const useResult = await request(`/funding/grants/${grantId}/authorize-use`, "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ programId: "sys3a5-program-a", occurredOn: "2026-09-09" }),
  });
  assert.equal(useResult.response.status, 200, JSON.stringify(useResult.body));
  assert.equal(data<any>(useResult.body).authorized, true);

  const wrongProgram = await request(`/funding/grants/${grantId}/authorize-use`, "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ programId: "sys3a5-program-b", occurredOn: "2026-09-09" }),
  });
  assert.equal(wrongProgram.response.status, 403, JSON.stringify(wrongProgram.body));

  const wrongOrg = await request(`/funding/grants/${grantId}`, "sys3a5-user-c", orgC);
  assert.equal(wrongOrg.response.status, 404, JSON.stringify(wrongOrg.body));

  const revoked = await request("/funding/grants", "sys3a5-user-revoked", orgA);
  assert.equal(revoked.response.status, 401, JSON.stringify(revoked.body));

  const draftResult = await request("/reporting/drafts", "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ reportType: "sys3a5-report", subjectType: "program", subjectName: "SYS-3A5 Program A", title: "SYS-3A5 report" }),
  });
  assert.equal(draftResult.response.status, 201, JSON.stringify(draftResult.body));
  const draft = data<any>(draftResult.body);
  const reportId = draft.reportId || draft.report_id;

  const submitted = await request(`/reporting/drafts/${reportId}/review`, "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ status: "ready_for_review", rationale: "Submitted for human review" }),
  });
  assert.equal(submitted.response.status, 200, JSON.stringify(submitted.body));
  const approved = await request(`/reporting/drafts/${reportId}/review`, "sys3a5-user-a", orgA, {
    method: "POST",
    body: JSON.stringify({ status: "approved", rationale: "Human review completed" }),
  });
  assert.equal(approved.response.status, 200, JSON.stringify(approved.body));

  const forbiddenPublish = await request(`/reporting/publications`, "sys3a5-user-b", orgB, {
    method: "POST",
    body: JSON.stringify({ report_id: reportId }),
  });
  assert.equal(forbiddenPublish.response.status, 403, JSON.stringify(forbiddenPublish.body));

  const wrongTenant = await request(`/reporting/drafts/${reportId}`, "sys3a5-user-b", orgA);
  assert.equal(wrongTenant.response.status, 403, JSON.stringify(wrongTenant.body));

  assert.equal((await request("/reporting/drafts", "sys3a5-user-b", orgB)).response.status, 403);
});
