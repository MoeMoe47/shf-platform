import { test, expect } from "@playwright/test";

const frontend = process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173";

function authPayload(overrides = {}) {
  const permissions = overrides.permissions || [
    "organization.view",
    "identity.view",
    "identity.membership.assign",
    "identity.membership.revoke",
    "organization.service_entitlement.view",
  ];
  return {
    ok: true,
    authenticated: true,
    session_status: "active",
    context_contract_version: "ioh-2.context.v1",
    user: { id: "admin-a", user_id: "admin-a", email: "admin-a@test.invalid", full_name: "Admin A" },
    role: "org_admin",
    permissions,
    memberships: [{ membership_id: "mem-admin-a", organization_id: "org-a", role_name: "org_admin", status: "active", organization_status: overrides.organizationStatus || "active", permissions }],
    authorized_organizations: [{ organization_id: "org-a", membership_id: "mem-admin-a", membership_status: "active", organization_status: overrides.organizationStatus || "active", role_name: "org_admin" }],
    active_organization_context: { organization_id: "org-a", membership_id: "mem-admin-a", membership_status: "active", organization_status: overrides.organizationStatus || "active", roles: ["org_admin"], permissions },
    session_authority_context: { status: "active" },
    safe_landing: { reason: "OK", active_organization_id: "org-a" },
    ...overrides.auth,
  };
}

function overview(overrides = {}) {
  const status = overrides.organizationStatus || "active";
  const services = overrides.services || [
    { service_key: "curriculum", service_name: "Curriculum", status: "ACTIVE", actionable: true, next_action: "OPEN_WHERE_PERMISSIONED", authority: "service_catalog_projection" },
    { service_key: "reporting", service_name: "Reporting", status: "PENDING", actionable: false, next_action: "WAIT_FOR_APPROVAL", authority: "service_catalog_projection" },
    { service_key: "project_studio", service_name: "Project Studio", status: "SUSPENDED", actionable: false, next_action: "CONTACT_SUPPORT", authority: "service_catalog_projection" },
  ];
  const relationships = overrides.relationships ?? [
    { relationship_id: "rel-a", relationship_type: "NETWORK_MEMBER_OF", status: "ACTIVE", editable: false, authority: "organization_relationships_read_only_summary" },
  ];
  return {
    authority: "organization_admin_experience_projection",
    organization: {
      organization_id: "org-a",
      display_name: overrides.organizationName || "Organization A",
      legal_name: "Organization A LLC",
      organization_type: "INDEPENDENT_NETWORK",
      status,
      mission: "Workforce and learning mission.",
    },
    context: {
      active_organization_id: "org-a",
      actor_user_id: "admin-a",
      actor_roles: overrides.actorRoles || ["org_admin"],
      actor_permissions: overrides.permissions || [
        "organization.view",
        "identity.view",
        "identity.membership.assign",
        "identity.membership.revoke",
        "organization.service_entitlement.view",
      ],
      organization_status: status,
      membership_status: overrides.membershipStatus || "active",
      platform_authority: false,
    },
    members: overrides.members || [
      { membership_id: "mem-admin-a", user_id: "admin-a", organization_id: "org-a", status: "active", role_id: "role_org_admin", role_name: "org_admin", actions: { can_change_role: true, can_revoke: true } },
      { membership_id: "mem-target-a", user_id: "target-a", organization_id: "org-a", status: "active", role_id: "role_operator", role_name: "operator", actions: { can_change_role: true, can_revoke: true } },
    ],
    roles: {
      policy: "ioh3_target_role_policy",
      org_admin_assignable_role_names: ["operator", "reviewer"],
      platform_roles_hidden_from_org_admin: true,
      last_admin_protection: true,
    },
    services,
    relationships,
    settings: [
      { key: "legal_name", label: "Legal name", read_write: "READ_ONLY", authority: "source_domain_managed", reason: "Canonical organization update workflow is outside IOH-4." },
      { key: "service_entitlements", label: "Service entitlements", read_write: "READ_ONLY", authority: "service_catalog_managed", reason: "Organization admins cannot self-grant service authority." },
    ],
    empty_states: {
      no_members_beyond_initial_admin: (overrides.members || []).length === 1,
      no_pending_invites: true,
      no_active_services: services.filter((service) => service.status === "ACTIVE").length === 0,
      no_relationships: relationships.length === 0,
      no_editable_settings: true,
    },
    boundaries: {
      org_admin_is_platform_admin: false,
      service_display_grants_entitlement: false,
      relationship_display_grants_membership: false,
      relationship_display_grants_entitlement: false,
      mfa_sso_scim_implemented: false,
    },
  };
}

async function openIdentity(page, options = {}) {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/me") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(authPayload(options.auth || {})) });
    }
    if (url.pathname === "/api/identity/organization-admin/overview") {
      if (options.overviewStatus) {
        return route.fulfill({ status: options.overviewStatus, contentType: "application/json", body: JSON.stringify({ ok: false, error: { code: "FORBIDDEN", message: "Membership revoked." } }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: overview(options.overview || {}) }) });
    }
    if (url.pathname === "/api/identity/roles") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { items: [{ role_id: "role_reviewer", role_name: "reviewer" }, { role_id: "role_operator", role_name: "operator" }] } }) });
    }
    if (url.pathname.includes("/api/identity/memberships/")) {
      options.onMembershipPatch?.(url.pathname, route.request().method());
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { membership_id: "mem-target-a", role_id: "role_reviewer", status: "active" } }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ ok: false }) });
  });
  await page.goto(`${frontend}/admin.html#/identity`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Administration" })).toBeVisible();
}

test("IOH-4 browser lane 1 organization admin with active services", async ({ page }) => {
  await openIdentity(page);
  await expect(page.getByText("Organization A - Org Admin")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Curriculum" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Where Permitted" }).first()).toBeEnabled();
});

test("IOH-4 browser lane 2 pending service is distinct", async ({ page }) => {
  await openIdentity(page);
  await expect(page.getByRole("heading", { name: "Reporting" })).toBeVisible();
  await expect(page.getByText("Wait For Approval")).toBeVisible();
});

test("IOH-4 browser lane 3 no services state", async ({ page }) => {
  await openIdentity(page, { overview: { services: [] } });
  await expect(page.getByRole("heading", { name: "No active services" })).toBeVisible();
});

test("IOH-4 browser lane 4 multi-org operator context has disabled admin actions", async ({ page }) => {
  await openIdentity(page, {
    auth: { permissions: ["organization.view", "identity.view", "organization.service_entitlement.view"] },
    overview: { actorRoles: ["operator"], permissions: ["organization.view", "identity.view", "organization.service_entitlement.view"] },
  });
  await expect(page.getByRole("button", { name: "Update Role" }).first()).toBeDisabled();
  await expect(page.getByRole("button", { name: "Revoke" }).first()).toBeDisabled();
});

test("IOH-4 browser lane 5 member list and status", async ({ page }) => {
  await openIdentity(page);
  await expect(page.getByRole("columnheader", { name: "Member", exact: true })).toBeVisible();
  await expect(page.getByText("target-a")).toBeVisible();
  await expect(page.getByLabel("Status Active").first()).toBeVisible();
});

test("IOH-4 browser lane 6 role action refreshes through backend", async ({ page }) => {
  let membershipPatchCount = 0;
  await openIdentity(page, { onMembershipPatch: () => { membershipPatchCount += 1; } });
  const targetRow = page.getByRole("row", { name: /target-a/ });
  await targetRow.getByLabel("Permitted role").selectOption("role_reviewer");
  await expect(targetRow.getByLabel("Permitted role")).toHaveValue("role_reviewer");
  await targetRow.getByRole("button", { name: "Update Role" }).click();
  await expect.poll(() => membershipPatchCount).toBe(1);
  await expect(page.getByText("target-a")).toBeVisible();
});

test("IOH-4 browser lane 7 suspended organization is non-operational", async ({ page }) => {
  await openIdentity(page, { auth: { organizationStatus: "suspended" }, overview: { organizationStatus: "suspended" } });
  await expect(page.getByRole("heading", { name: "Organization suspended" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Update Role" }).first()).toBeDisabled();
});

test("IOH-4 browser lane 8 revoked stale admin access fails safely", async ({ page }) => {
  await openIdentity(page, { overviewStatus: 403 });
  await expect(page.getByRole("heading", { name: "Access unavailable" })).toBeVisible();
  await expect(page.getByText("Membership revoked.")).toBeVisible();
});

test("IOH-4 browser lane 9 settings are read-only", async ({ page }) => {
  await openIdentity(page);
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByText("Read Only").first()).toBeVisible();
  await expect(page.getByText("Organization admins cannot self-grant service authority.")).toBeVisible();
});

test("IOH-4 browser lane 10 responsive mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 820 });
  await openIdentity(page);
  await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Services", exact: true })).toBeVisible();
});
