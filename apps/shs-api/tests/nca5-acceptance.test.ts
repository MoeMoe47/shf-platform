import test from "node:test";
import assert from "node:assert/strict";
import { requireNotificationContext, requestedOrganizationId } from "../src/domain/notifications/api/routes.ts";

// NCA-5 micro-gap regression: a genuine multi-org user with no single
// default organization previously got ORG_CONTEXT_REQUIRED from every
// notification endpoint unconditionally, even when the request already
// named one of the caller's own authorized organizations via
// ?organizationId= — exactly what the canonical inbox's organization
// filter sends. That made the org-filter UX impossible to use for a
// multi-org user: there was no way to ever select an org in the first
// place. This test locks in the fix: requireNotificationContext must let
// such a request through to the service layer (which independently
// re-validates the requested org against resolveAuthorizedOrganizationIds
// and throws ORG_CONTEXT_FORBIDDEN itself if it is not actually
// authorized — this middleware never grants access on its own).

function mockReq(overrides: Record<string, unknown>) {
  return { query: {}, ...overrides } as any;
}

function mockRes() {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: unknown) => { res.body = body; return res; };
  return res;
}

test("requestedOrganizationId reads the ?organizationId= query param", () => {
  assert.equal(requestedOrganizationId(mockReq({ query: { organizationId: "org-a" } })), "org-a");
  assert.equal(requestedOrganizationId(mockReq({ query: {} })), undefined);
});

test("requireNotificationContext: unauthenticated request is rejected with 401 before any org check", () => {
  const req = mockReq({ user: null });
  const res = mockRes();
  let calledNext = false;
  requireNotificationContext(req, res, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 401);
});

test("requireNotificationContext: a single-org user with an already-resolved active organization passes unchanged", () => {
  const req = mockReq({ user: { active_organization_id: "org-a", tenant_id: "tenant:org-a" } });
  const res = mockRes();
  let calledNext = false;
  requireNotificationContext(req, res, () => { calledNext = true; });
  assert.equal(calledNext, true);
});

test("requireNotificationContext: a multi-org user with no default org but a query param naming one of their own authorized orgs now passes", () => {
  const req = mockReq({
    query: { organizationId: "org-partner" },
    user: {
      org_context_error: "ORG_CONTEXT_REQUIRED",
      organization_id: "org-shf",
      memberships: [{ organization_id: "org-shf" }, { organization_id: "org-partner" }],
    },
  });
  const res = mockRes();
  let calledNext = false;
  requireNotificationContext(req, res, () => { calledNext = true; });
  assert.equal(calledNext, true, "the request should reach the service layer, which re-validates authorization itself");
});

test("requireNotificationContext: a multi-org user naming an organization they are NOT a member of is still rejected (no widened access)", () => {
  const req = mockReq({
    query: { organizationId: "org-other" },
    user: {
      org_context_error: "ORG_CONTEXT_REQUIRED",
      organization_id: "org-shf",
      memberships: [{ organization_id: "org-shf" }, { organization_id: "org-partner" }],
    },
  });
  const res = mockRes();
  let calledNext = false;
  requireNotificationContext(req, res, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 403);
});

test("requireNotificationContext: a multi-org user with no query param at all still gets rejected, surfacing the real resolved error code", () => {
  const req = mockReq({
    user: { org_context_error: "ORG_CONTEXT_REQUIRED", organization_id: "org-shf", memberships: [{ organization_id: "org-shf" }, { organization_id: "org-partner" }] },
  });
  const res = mockRes();
  let calledNext = false;
  requireNotificationContext(req, res, () => { calledNext = true; });
  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 403);
  assert.equal((res.body as any)?.error?.code, "ORG_CONTEXT_REQUIRED");
});
