import assert from "node:assert/strict";
import test from "node:test";
import {
  applyActiveOrganizationContext,
  resolveActiveOrganizationContext,
  resolveOrganizationContextTransition,
} from "../src/auth/organization-context";
import { authResponsePayload } from "../src/auth/auth-response";
import { tenantIdForOrganization } from "../src/auth/tenant-context";

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
  user_id: "user-ioh2",
  email: "ioh2@example.test",
  memberships: [
    membership("org-a", "org_admin", {
      permissions: ["program.read", "program.create", "program.transition"],
      entitlement_summary: {
        status: "loaded",
        items: [{ service_key: "project_studio", service_name: "Project Studio", status: "ACTIVE" }],
      },
    }),
    membership("org-b", "operator", {
      permissions: ["program.read", "case.read"],
      entitlement_summary: {
        status: "loaded",
        items: [],
      },
    }),
  ],
};

test("IOH-2 switches active organization by recomputing role, permission, and entitlement projections", () => {
  const orgA = authResponsePayload(applyActiveOrganizationContext(multiOrgUser, "org-a"));
  const orgB = authResponsePayload(applyActiveOrganizationContext(multiOrgUser, "org-b"));

  assert.equal(orgA.active_organization_context?.organization_id, "org-a");
  assert.equal(orgA.role_context.primary_role, "org_admin");
  assert.ok(orgA.permission_context.permissions.includes("program.create"));
  assert.equal(orgA.entitlement_summary.items[0].service_key, "project_studio");

  assert.equal(orgB.active_organization_context?.organization_id, "org-b");
  assert.equal(orgB.role_context.primary_role, "operator");
  assert.equal(orgB.permission_context.permissions.includes("program.create"), false);
  assert.equal(orgB.permission_context.permissions.includes("case.read"), true);
  assert.deepEqual(orgB.entitlement_summary.items, []);
});

test("IOH-2 preferred organization is non-authoritative and stale preferred org is ignored", () => {
  const transition = resolveOrganizationContextTransition({
    user_id: "single-org-user",
    memberships: [membership("org-a", "org_admin")],
  }, { preferredOrganizationId: "org-stale" });

  assert.equal(transition.ok, true);
  assert.equal(transition.selected_organization_id, "org-a");
  assert.equal(transition.selection_source, "single_authorized");
  assert.equal(transition.ignored_preferred_organization_id, "org-stale");
});

test("IOH-2 requested organization is strict and cannot grant client-side authority", () => {
  const transition = resolveOrganizationContextTransition(multiOrgUser, {
    requestedOrganizationId: "org-c",
    previousOrganizationId: "org-a",
  });

  assert.equal(transition.ok, false);
  assert.equal(transition.error_code, "ORG_CONTEXT_FORBIDDEN");
  assert.equal(transition.safe_landing_reason, "UNAUTHORIZED_ORG");
  assert.equal(transition.invalidation.clear_org_scoped_state, true);
  assert.throws(() => resolveActiveOrganizationContext(multiOrgUser, "org-c"), /Active organization is not authorized/);
});

test("IOH-2 revoked memberships and suspended organizations cannot remain active", () => {
  const revoked = resolveOrganizationContextTransition({
    user_id: "revoked-user",
    memberships: [membership("org-a", "org_admin", { status: "revoked" })],
  }, { requestedOrganizationId: "org-a", previousOrganizationId: "org-a" });
  const suspended = resolveOrganizationContextTransition({
    user_id: "suspended-user",
    memberships: [membership("org-a", "org_admin", { organization_status: "suspended" })],
  }, { requestedOrganizationId: "org-a", previousOrganizationId: "org-a" });

  assert.equal(revoked.ok, false);
  assert.equal(revoked.error_code, "MEMBERSHIP_REVOKED");
  assert.equal(revoked.safe_landing_reason, "MEMBERSHIP_REVOKED");
  assert.equal(suspended.ok, false);
  assert.equal(suspended.error_code, "ORG_SUSPENDED");
  assert.equal(suspended.safe_landing_reason, "ORG_SUSPENDED");
});

test("IOH-2 tenant boundaries remain enforced during organization transition", () => {
  const transition = resolveOrganizationContextTransition({
    user_id: "tenant-mismatch",
    memberships: [membership("org-a", "org_admin", { tenant_id: "tenant:org-b" })],
  }, { requestedOrganizationId: "org-a" });

  assert.equal(transition.ok, false);
  assert.equal(transition.error_code, "TENANT_ORG_MISMATCH");
  assert.equal(transition.safe_landing_reason, "TENANT_MISMATCH");
});

test("IOH-2 no-org and no-role states are explicit and fail safe", () => {
  const noOrg = resolveOrganizationContextTransition({ user_id: "no-org", memberships: [] });
  const noRoleResponse = authResponsePayload(applyActiveOrganizationContext({
    user_id: "no-role",
    memberships: [membership("org-a", "unknown_role")],
  }));

  assert.equal(noOrg.ok, false);
  assert.equal(noOrg.error_code, "ORG_CONTEXT_UNAVAILABLE");
  assert.equal(noOrg.safe_landing_reason, "NO_ORG");
  assert.equal(noRoleResponse.active_organization_context?.organization_id, "org-a");
  assert.deepEqual(noRoleResponse.role_context.roles, ["unknown_role"]);
  assert.deepEqual(noRoleResponse.permission_context.permissions, []);
});

test("IOH-2 reload context can reconstruct active org from authorized preferred org", () => {
  const transition = resolveOrganizationContextTransition(multiOrgUser, {
    preferredOrganizationId: "org-b",
  });
  const response = authResponsePayload({
    ...applyActiveOrganizationContext(multiOrgUser, transition.selected_organization_id),
    organization_context_resolution: transition,
  });

  assert.equal(transition.ok, true);
  assert.equal(transition.selection_source, "preferred");
  assert.equal(response.active_organization_context?.organization_id, "org-b");
  assert.equal(response.organization_context_resolution.selection_source, "preferred");
  assert.equal(response.route_validity_contract.authority, "experience_input_only");
});
