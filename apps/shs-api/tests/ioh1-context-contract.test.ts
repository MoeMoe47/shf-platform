import assert from "node:assert/strict";
import test from "node:test";
import { authResponsePayload } from "../src/auth/auth-response";

test("IOH-1 auth context projects canonical identity and organization fields without tenant leakage", () => {
  const response = authResponsePayload({
    user_id: "user-ioh-1",
    email: "ioh1@example.test",
    full_name: "IOH One",
    status: "active",
    preferred_organization_id: "org-b",
    active_organization_id: "org-a",
    membership_id: "mem-org-a-admin",
    memberships: [
      {
        membership_id: "mem-org-a-admin",
        organization_id: "org-a",
        tenant_id: "tenant:org-a",
        role: "org_admin",
        role_name: "org_admin",
        role_scope_type: "organization",
        status: "active",
        organization_status: "active",
        permissions: ["program.read", "program.create"],
      },
      {
        membership_id: "mem-org-b-viewer",
        organization_id: "org-b",
        tenant_id: "tenant:org-b",
        role: "read_only_viewer",
        role_scope_type: "organization",
        status: "active",
        organization_status: "active",
        permissions: ["program.read"],
      },
    ],
    organization_scoped_roles: ["org_admin"],
    organization_scoped_permissions: ["program.read", "program.create"],
    entitlement_summary: {
      status: "loaded",
      items: [
        {
          service_key: "project_studio",
          service_name: "Project Studio",
          status: "ACTIVE",
          effective_until: null,
        },
      ],
    },
    relationship_reference_ids: ["rel-network-1"],
    session_status: "active",
    identity_provider: "auth0",
    provider_subject: "auth0|user-ioh-1",
  });
  const serialized = JSON.stringify(response);

  assert.equal(response.context_contract_version, "ioh-2.context.v1");
  assert.equal(response.context_authority, "backend_derived_projection");
  assert.equal(response.user.user_id, "user-ioh-1");
  assert.equal(response.authorized_organizations.length, 2);
  assert.equal(response.preferred_organization_id, "org-b");
  assert.equal(response.active_organization_context?.organization_id, "org-a");
  assert.equal(response.active_organization_context?.membership_status, "active");
  assert.equal(response.active_organization_context?.organization_status, "active");
  assert.deepEqual(response.role_context.roles, ["org_admin"]);
  assert.deepEqual(response.permission_context.permissions, ["program.read", "program.create"]);
  assert.equal(response.entitlement_summary.authority, "service_catalog_projection");
  assert.equal(response.entitlement_summary.items[0].service_key, "project_studio");
  assert.equal(response.relationship_reference_boundary.scope, "minimal_reference_boundary");
  assert.equal(response.relationship_reference_boundary.relationships_imply_membership, false);
  assert.equal(response.relationship_reference_boundary.relationships_imply_entitlement, false);
  assert.equal(response.session_authority_context.authority, "identity_gateway_projection");
  assert.equal(response.session_authority_context.external_subject_present, true);
  assert.equal(serialized.includes("tenant_id"), false);
  assert.equal(serialized.includes("tenant:org-a"), false);
  assert.equal(serialized.includes("tenant:org-b"), false);
});

test("IOH-1 auth context keeps stale or absent organization authority explicit and fail-safe", () => {
  const response = authResponsePayload({
    user_id: "user-no-active-org",
    email: "no-active@example.test",
    status: "active",
    memberships: [
      {
        membership_id: "mem-revoked",
        organization_id: "org-revoked",
        tenant_id: "tenant:org-revoked",
        role: "org_admin",
        status: "revoked",
        organization_status: "active",
      },
    ],
  });

  assert.equal(response.active_organization_context, null);
  assert.equal(response.memberships[0].status, "revoked");
  assert.deepEqual(response.authorized_organizations, []);
  assert.deepEqual(response.permissions, []);
  assert.equal(response.entitlement_summary.status, "not_loaded");
  assert.equal(response.relationship_reference_boundary.relationships_imply_membership, false);
});
