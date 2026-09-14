import assert from "node:assert/strict";
import test from "node:test";
import { OrganizationAdminExperienceError, OrganizationAdminExperienceService } from "../src/domain/identity/service/organization-admin-experience-service";
import { MembershipService, MembershipServiceError } from "../src/domain/identity/service/membership-service";
import { ServiceCatalogService } from "../src/domain/service-catalog/service/service-catalog-service";

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "admin-a",
    active_organization_id: "org-a",
    organization_id: "org-a",
    tenant_id: "tenant:org-a",
    roles: ["org_admin"],
    permissions: [
      "organization.view",
      "identity.view",
      "identity.membership.assign",
      "identity.membership.revoke",
      "organization.service_entitlement.view",
      "organization.relationship.view",
    ],
    membership_status: "active",
    organization_status: "active",
    ...overrides,
  };
}

function membership(overrides: Record<string, unknown> = {}) {
  return {
    membership_id: "mem-target-a",
    user_id: "target-a",
    organization_id: "org-a",
    role_id: "role_operator",
    role_name: "operator",
    role_scope_type: "organization",
    status: "active",
    effective_from: new Date("2026-01-01T00:00:00Z"),
    effective_to: null,
    ...overrides,
  };
}

class FakeIdentity {
  async getOrganizationById(organizationId: string) {
    return {
      organization_id: organizationId,
      display_name: organizationId === "org-a" ? "Org A" : "Org B",
      legal_name: organizationId === "org-a" ? "Organization A LLC" : "Organization B LLC",
      org_type: "INDEPENDENT_NETWORK",
      status: organizationId === "org-suspended" ? "suspended" : "active",
      eligibility_notes: "Bounded mission summary.",
    };
  }
}

class FakeMemberships {
  async list(_actor: any, organizationId: string) {
    return [
      membership({ membership_id: "mem-admin-a", user_id: "admin-a", organization_id: organizationId, role_id: "role_org_admin", role_name: "org_admin" }),
      membership({ membership_id: "mem-target-a", user_id: "target-a", organization_id: organizationId, role_id: "role_operator", role_name: "operator" }),
    ];
  }
}

class FakeCatalog {
  async listServices() {
    return [
      { service_id: "svc-curriculum", service_key: "curriculum", name: "Curriculum", status: "ACTIVE", provider_organization_id: "org-provider" },
      { service_id: "svc-reporting", service_key: "reporting", name: "Reporting", status: "ACTIVE", provider_organization_id: "org-provider" },
      { service_id: "svc-studio", service_key: "project_studio", name: "Project Studio", status: "ACTIVE", provider_organization_id: "org-provider" },
    ];
  }

  async listEntitlements(organizationId: string) {
    return [
      { entitlement_id: `ent-${organizationId}-curriculum`, organization_id: organizationId, service_id: "svc-curriculum", service_key: "curriculum", service_name: "Curriculum", status: "ACTIVE", provider_organization_id: "org-provider" },
      { entitlement_id: `ent-${organizationId}-reporting`, organization_id: organizationId, service_id: "svc-reporting", service_key: "reporting", service_name: "Reporting", status: "SUSPENDED", provider_organization_id: "org-provider" },
    ];
  }
}

class EmptyCatalog extends FakeCatalog {
  async listEntitlements() {
    return [];
  }
}

class FakeRelationships {
  async listRelationships() {
    return [
      { relationship_id: "rel-a", source_organization_id: "org-a", target_organization_id: "org-provider", relationship_type: "NETWORK_MEMBER_OF", status: "ACTIVE", effective_from: new Date("2026-01-01T00:00:00Z"), effective_to: null, metadata_version: 1 },
    ];
  }
}

function orgAdminService(catalog: any = new FakeCatalog()) {
  return new OrganizationAdminExperienceService(
    new FakeIdentity() as any,
    new FakeMemberships() as any,
    catalog as any,
    new FakeRelationships() as any,
  );
}

class FakeExecutor {
  roles = new Map<string, any>([
    ["role_org_admin", { role_id: "role_org_admin", organization_id: null, role_name: "org_admin", role_scope_type: "organization" }],
    ["role_operator", { role_id: "role_operator", organization_id: null, role_name: "operator", role_scope_type: "organization" }],
    ["role_super_admin", { role_id: "role_super_admin", organization_id: null, role_name: "super_admin", role_scope_type: "platform" }],
  ]);
  memberships = [
    membership({ membership_id: "mem-admin-a", user_id: "admin-a", role_id: "role_org_admin", role_name: "org_admin" }),
    membership({ membership_id: "mem-target-a", user_id: "target-a", role_id: "role_operator", role_name: "operator" }),
  ];

  async query(sql: string, params: any[] = []) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    if (normalized.startsWith("SELECT m.*, r.role_name")) {
      const item = this.memberships.find((row) => row.membership_id === params[0] && row.organization_id === params[1]);
      if (!item) return { rows: [] };
      const role = this.roles.get(item.role_id);
      return { rows: [{ ...item, role_name: role?.role_name || item.role_name, role_scope_type: role?.role_scope_type || item.role_scope_type }] };
    }
    if (normalized.startsWith("SELECT role_id, organization_id, role_name, role_scope_type FROM roles")) {
      const role = this.roles.get(params[0]);
      return { rows: role ? [role] : [] };
    }
    if (normalized.startsWith("SELECT COUNT(*)::int AS admin_count")) {
      return { rows: [{ admin_count: 1 }] };
    }
    if (normalized.startsWith("UPDATE memberships SET role_id=$1")) {
      return { rows: [membership({ membership_id: params[1], role_id: params[0], role_name: "operator" })] };
    }
    if (normalized.startsWith("UPDATE memberships SET status='revoked'")) {
      return { rows: [membership({ membership_id: params[0], status: "revoked" })] };
    }
    throw new Error(`Unhandled fake query: ${normalized}`);
  }
}

function membershipService(executor: FakeExecutor) {
  return new MembershipService(
    executor.query.bind(executor),
    async (fn: any) => fn(executor),
    async (event: any) => event,
  );
}

test("IOH-4 organization admin overview is scoped and bounded", async () => {
  const overview = await orgAdminService().getOverview(actor());
  assert.equal(overview.authority, "organization_admin_experience_projection");
  assert.equal(overview.organization.organization_id, "org-a");
  assert.equal(overview.context.platform_authority, false);
  assert.equal(overview.members.every((member: any) => member.organization_id === "org-a"), true);
  assert.equal(overview.roles.platform_roles_hidden_from_org_admin, true);
  assert.equal(overview.relationships[0].editable, false);
  assert.equal(overview.boundaries.service_display_grants_entitlement, false);
});

test("IOH-4 organization profile read is active-org bounded for ordinary org admins", () => {
  const service = orgAdminService();
  assert.doesNotThrow(() => service.assertCanReadOrganization(actor(), "org-a"));
  assert.throws(
    () => service.assertCanReadOrganization(actor(), "org-b"),
    (error: any) => error instanceof OrganizationAdminExperienceError && error.code === "FORBIDDEN",
  );
  assert.doesNotThrow(() => service.assertCanReadOrganization(actor({ roles: ["super_admin"], role_scope_type: "platform" }), "org-b"));
});

test("IOH-4 service states distinguish active suspended and discovery without granting authority", async () => {
  const overview = await orgAdminService().getOverview(actor());
  const byKey = new Map(overview.services.map((service: any) => [service.service_key, service]));
  assert.equal(byKey.get("curriculum")?.status, "ACTIVE");
  assert.equal(byKey.get("curriculum")?.actionable, true);
  assert.equal(byKey.get("reporting")?.status, "SUSPENDED");
  assert.equal(byKey.get("reporting")?.actionable, false);
  assert.equal(byKey.get("project_studio")?.status, "AVAILABLE_FOR_DISCOVERY");
  assert.equal(byKey.get("project_studio")?.actionable, false);
});

test("IOH-4 no-service state is explicit", async () => {
  const overview = await orgAdminService(new EmptyCatalog()).getOverview(actor());
  assert.equal(overview.empty_states.no_active_services, true);
  assert.equal(overview.services.every((service: any) => service.status === "AVAILABLE_FOR_DISCOVERY"), true);
});

test("IOH-4 stale or non-admin membership authority cannot mutate", async () => {
  const executor = new FakeExecutor();
  await assert.rejects(
    () => membershipService(executor).changeRole("mem-target-a", { role_id: "role_operator" }, actor({ permissions: ["organization.view"] })),
    (error: any) => error instanceof MembershipServiceError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    () => membershipService(executor).changeRole("mem-target-a", { role_id: "role_super_admin" }, actor()),
    (error: any) => error instanceof MembershipServiceError && error.code === "TARGET_ROLE_FORBIDDEN",
  );
});

test("IOH-4 org admin cannot directly self-grant service entitlement", async () => {
  const service = new ServiceCatalogService();
  await assert.rejects(
    () => service.grantEntitlement("org-a", { service_key: "curriculum" }, actor({ permissions: ["organization.service_entitlement.view"] })),
    /Service entitlement management permission is required/,
  );
  await assert.rejects(
    () => service.grantEntitlement("org-a", { service_key: "curriculum" }, actor({ permissions: ["organization.service_entitlement.view", "organization.service_entitlement.manage"] })),
    /Only the service provider or platform authority/,
  );
});
