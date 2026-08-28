import assert from "node:assert/strict";
import test from "node:test";
import { applyActiveOrganizationContext, resolveActiveOrganizationContext } from "../src/auth/organization-context";
import { tenantIdForOrganization } from "../src/auth/tenant-context";
import { requirePermission } from "../src/auth/permission-guard";
import { authResponsePayload } from "../src/auth/auth-response";
import { ProgramService } from "../src/domain/programs/service/program-service";
import { CaseService } from "../src/domain/cases/service/case-service";

function membership(organizationId: string, role: string, extra: Record<string, unknown> = {}) {
  return {
    membership_id: `mem-${organizationId}-${role}`,
    organization_id: organizationId,
    tenant_id: tenantIdForOrganization(organizationId),
    role,
    status: "active",
    organization_status: "active",
    ...extra,
  };
}

const multiOrgUser = {
  user_id: "user-multi",
  email: "multi@example.test",
  memberships: [
    membership("org-a", "org_admin"),
    membership("org-b", "read_only_viewer"),
  ],
};

test("single-org user resolves correct active org", () => {
  const scoped = applyActiveOrganizationContext({
    user_id: "user-single",
    memberships: [membership("org-a", "org_admin")],
  });
  assert.equal(scoped.active_organization_id, "org-a");
  assert.equal(scoped.tenant_id, "tenant:org-a");
  assert.ok(scoped.permissions.includes("program.create"));
});

test("tenant and organization context must match the centralized mapping", () => {
  const scoped = applyActiveOrganizationContext({
    user_id: "user-matching-tenant",
    memberships: [membership("org-a", "org_admin", { tenant_id: "tenant:org-a" })],
  });
  assert.equal(scoped.tenant_id, "tenant:org-a");

  assert.throws(
    () => applyActiveOrganizationContext({
      user_id: "user-mismatched-tenant",
      memberships: [membership("org-a", "org_admin", { tenant_id: "tenant:org-b" })],
    }),
    /TENANT_ORG_MISMATCH|Tenant does not match active organization/,
  );
});

test("browser-supplied tenant cannot override active organization context", () => {
  assert.throws(
    () => applyActiveOrganizationContext({
      user_id: "user-browser-tenant",
      organization_id: "org-a",
      tenant_id: "tenant:browser",
      roles: ["org_admin"],
    }),
    /TENANT_ORG_MISMATCH|Tenant does not match active organization/,
  );
});

test("multi-org user can activate authorized org and cannot activate unauthorized org", () => {
  const orgA = applyActiveOrganizationContext(multiOrgUser, "org-a");
  assert.equal(orgA.active_organization_id, "org-a");
  assert.ok(orgA.permissions.includes("program.transition"));
  assert.throws(
    () => applyActiveOrganizationContext(multiOrgUser, "org-c"),
    /Active organization is not authorized/,
  );
});

test("multi-org user must choose an active org", () => {
  assert.throws(() => resolveActiveOrganizationContext(multiOrgUser), /Active organization header is required/);
});

test("inactive membership and inactive organization cannot activate org", () => {
  assert.throws(
    () => applyActiveOrganizationContext({
      user_id: "user-inactive",
      memberships: [membership("org-a", "org_admin", { status: "revoked" })],
    }, "org-a"),
    /Active organization is not authorized|No active organization membership/,
  );
  assert.throws(
    () => applyActiveOrganizationContext({
      user_id: "user-inactive-org",
      memberships: [membership("org-a", "org_admin", { organization_status: "disabled" })],
    }, "org-a"),
    /Active organization is not authorized|No active organization membership/,
  );
});

test("permission from Org A does not leak into Org B and unknown role fails closed", () => {
  const orgB = applyActiveOrganizationContext(multiOrgUser, "org-b");
  assert.equal(orgB.active_organization_id, "org-b");
  assert.equal(orgB.permissions.includes("program.create"), false);
  const unknown = applyActiveOrganizationContext({
    user_id: "user-unknown-role",
    memberships: [membership("org-a", "unknown_role")],
  });
  assert.deepEqual(unknown.permissions, []);
});

test("permission guard denies invalid organization context before permission checks", () => {
  const req: any = { user: { org_context_error: "ORG_CONTEXT_REQUIRED", permissions: ["program.read"] } };
  let statusCode = 0;
  const res: any = {
    status(code: number) { statusCode = code; return this; },
    json(payload: any) { this.payload = payload; return this; },
  };
  const next = () => { throw new Error("next should not run"); };
  requirePermission("program.read")(req, res, next);
  assert.equal(statusCode, 403);
  assert.equal(res.payload.error.code, "ORG_CONTEXT_REQUIRED");
});

test("platform-global role may explicitly activate another organization", () => {
  const platform = applyActiveOrganizationContext({
    user_id: "platform-admin",
    organization_id: "shs-core",
    memberships: [membership("shs-core", "super_admin", { role_scope_type: "platform" })],
  }, "org-b");
  assert.equal(platform.active_organization_id, "org-b");
  assert.ok(platform.permissions.includes("program.create"));
});

test("program isolation scopes list, create, read, and transition", async () => {
  const calls: any[] = [];
  const repo = {
    async listPrograms(scope: any) { calls.push(["list", scope]); return [{ program_id: "prog-a", organization_id: scope.organization_id }]; },
    async getProgramById(id: string, scope: any) { calls.push(["get", id, scope]); return id === "prog-a" && scope.organization_id === "org-a" ? { program_id: id, organization_id: "org-a" } : null; },
    async createProgram(input: any) { calls.push(["create", input]); return input; },
    async getProgramForTransition(id: string, scope: any) { calls.push(["transition-get", id, scope]); return id === "prog-a" && scope.organization_id === "org-a" ? { program_id: id, organization_id: "org-a", status: "draft" } : null; },
    async updateProgramStatus(id: string, status: string, scope: any, expectedStatus: string) { calls.push(["transition", id, status, scope, expectedStatus]); return id === "prog-a" && scope.organization_id === "org-a" && expectedStatus === "draft" ? { program_id: id, organization_id: "org-a", status } : null; },
  };
  const service = new ProgramService(repo as any, undefined as any, async () => undefined);
  const orgAActor = applyActiveOrganizationContext({ user_id: "user-a", memberships: [membership("org-a", "org_admin")] });
  const orgBActor = applyActiveOrganizationContext({ user_id: "user-b", memberships: [membership("org-b", "org_admin")] });
  assert.equal((await service.listPrograms(orgAActor))[0].organization_id, "org-a");
  const created = await service.createProgram({ name: "A", program_type: "education", organization_id: "org-b" }, orgAActor);
  assert.equal(created.organization_id, "org-a");
  assert.equal((await service.getProgram("prog-a", orgAActor))?.organization_id, "org-a");
  assert.equal(await service.getProgram("prog-a", orgBActor), null);
  await service.transitionProgram("prog-a", "active", orgAActor);
  await assert.rejects(() => service.transitionProgram("prog-a", "active", orgBActor), /Program not found/);
});

test("case isolation scopes list, create, read, assign, and transition", async () => {
  const repo = {
    async listCases(scope: any) { return [{ case_id: "case-a", organization_id: scope.organization_id }]; },
    async listReferralCases(scope: any) { return [{ case_id: "case-ref-a", organization_id: scope.organization_id }]; },
    async getCaseById(id: string, scope: any) { return id === "case-a" && scope.organization_id === "org-a" ? { case_id: id, organization_id: "org-a" } : null; },
    async createCase(input: any) { return input; },
    async upsertReferralDetails(id: string, input: any) { return { case_id: id, ...input }; },
    async assignCase(id: string, input: any, scope: any) { return id === "case-a" && scope.organization_id === "org-a" ? { case_id: id, organization_id: "org-a", ...input } : null; },
    async updateCaseStatus(id: string, status: string, scope: any) { return id === "case-a" && scope.organization_id === "org-a" ? { case_id: id, organization_id: "org-a", status } : null; },
  };
  const service = new CaseService(repo as any, { enqueue: async () => undefined } as any, async (fn: any) => fn({}), async () => undefined);
  const orgAActor = applyActiveOrganizationContext({ user_id: "user-a", memberships: [membership("org-a", "org_admin")] });
  const orgBActor = applyActiveOrganizationContext({ user_id: "user-b", memberships: [membership("org-b", "org_admin")] });
  assert.equal((await service.listCases(orgAActor))[0].organization_id, "org-a");
  const created = await service.createCase({ case_type: "support", priority: "medium", organization_id: "org-b" }, orgAActor);
  assert.equal(created.organization_id, "org-a");
  assert.equal((await service.getCase("case-a", orgAActor))?.organization_id, "org-a");
  assert.equal(await service.getCase("case-a", orgBActor), null);
  const assignment = { assigned_user_id: "assignee-a", reason_text: "scope test" };
  assert.equal((await service.assignCase("case-a", assignment, orgAActor)).organization_id, "org-a");
  await assert.rejects(() => service.assignCase("case-a", assignment, orgBActor), /Case not found/);
  await service.transitionCase("case-a", "draft", "open", orgAActor);
  await assert.rejects(() => service.transitionCase("case-a", "draft", "open", orgBActor), /Case not found/);
});

test("ordinary auth response omits tenant internals while preserving client identity context", () => {
  const scoped = applyActiveOrganizationContext({
    user_id: "user-a",
    email: "user-a@example.test",
    full_name: "User A",
    memberships: [membership("org-a", "org_admin")],
  });
  const response = authResponsePayload(scoped);
  const serialized = JSON.stringify(response);

  assert.equal(response.ok, true);
  assert.equal(response.user.user_id, "user-a");
  assert.equal(response.user.organization_id, "org-a");
  assert.ok(response.permissions.includes("program.create"));
  assert.equal(response.active_organization_context?.organization_id, "org-a");
  assert.equal(response.memberships[0].organization_id, "org-a");
  assert.equal(serialized.includes("tenant_id"), false);
  assert.equal(serialized.includes("tenant:org-a"), false);
});
