import assert from "node:assert/strict";
import test from "node:test";
import { MembershipService, MembershipServiceError } from "../src/domain/identity/service/membership-service";
import { applyActiveOrganizationContext, resolveOrganizationContextTransition } from "../src/auth/organization-context";

function actor(overrides: Record<string, unknown> = {}) {
  return {
    user_id: "admin-a",
    active_organization_id: "org-a",
    organization_id: "org-a",
    tenant_id: "tenant:org-a",
    roles: ["org_admin"],
    permissions: ["identity.view", "identity.membership.assign", "identity.membership.revoke"],
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

class FakeExecutor {
  users = new Map<string, any>([
    ["target-a", { user_id: "target-a", status: "active" }],
    ["admin-a", { user_id: "admin-a", status: "active" }],
    ["admin-b", { user_id: "admin-b", status: "active" }],
  ]);
  roles = new Map<string, any>([
    ["role_org_admin", { role_id: "role_org_admin", organization_id: null, role_name: "org_admin", role_scope_type: "organization" }],
    ["role_operator", { role_id: "role_operator", organization_id: null, role_name: "operator", role_scope_type: "organization" }],
    ["role_reviewer", { role_id: "role_reviewer", organization_id: null, role_name: "reviewer", role_scope_type: "organization" }],
    ["role_member_custom", { role_id: "role_member_custom", organization_id: "org-a", role_name: "member", role_scope_type: "organization" }],
    ["role_super_admin", { role_id: "role_super_admin", organization_id: null, role_name: "super_admin", role_scope_type: "platform" }],
  ]);
  memberships: any[];
  audits: any[] = [];

  constructor(memberships: any[] = []) {
    this.memberships = memberships.map((item) => ({ ...item }));
  }

  async query(sql: string, params: any[] = []) {
    const normalized = sql.replace(/\s+/g, " ").trim();
    if (normalized.startsWith("SELECT user_id FROM users")) {
      const user = this.users.get(params[0]);
      return { rows: user?.status === "active" ? [user] : [] };
    }
    if (normalized.startsWith("SELECT role_id, organization_id, role_name, role_scope_type FROM roles")) {
      const role = this.roles.get(params[0]);
      return { rows: role ? [role] : [] };
    }
    if (normalized.startsWith("SELECT * FROM memberships WHERE user_id=$1 AND organization_id=$2")) {
      return { rows: this.memberships.filter((item) => item.user_id === params[0] && item.organization_id === params[1] && item.status === "active").slice(0, 1) };
    }
    if (normalized.startsWith("INSERT INTO memberships")) {
      const role = this.roles.get(params[3]);
      const item = membership({ membership_id: params[0], user_id: params[1], organization_id: params[2], role_id: params[3], role_name: role?.role_name, role_scope_type: role?.role_scope_type });
      this.memberships.push(item);
      return { rows: [item] };
    }
    if (normalized.startsWith("SELECT m.*, r.role_name, r.role_scope_type FROM memberships")) {
      const item = this.memberships.find((row) => row.membership_id === params[0] && row.organization_id === params[1]);
      if (!item) return { rows: [] };
      const role = this.roles.get(item.role_id);
      return { rows: [{ ...item, role_name: role?.role_name || item.role_name, role_scope_type: role?.role_scope_type || item.role_scope_type }] };
    }
    if (normalized.startsWith("UPDATE memberships SET role_id=$1")) {
      const item = this.memberships.find((row) => row.membership_id === params[1] && row.organization_id === params[2]);
      if (!item) return { rows: [] };
      const role = this.roles.get(params[0]);
      item.role_id = params[0];
      item.role_name = role?.role_name;
      item.role_scope_type = role?.role_scope_type;
      return { rows: [{ ...item }] };
    }
    if (normalized.startsWith("UPDATE memberships SET status='revoked'")) {
      const item = this.memberships.find((row) => row.membership_id === params[0] && row.organization_id === params[1]);
      if (!item) return { rows: [] };
      item.status = "revoked";
      item.effective_to = item.effective_to || new Date("2026-01-02T00:00:00Z");
      return { rows: [{ ...item }] };
    }
    if (normalized.startsWith("SELECT COUNT(*)::int AS admin_count")) {
      const count = this.memberships.filter((item) => {
        const role = this.roles.get(item.role_id) || item;
        return item.organization_id === params[0] && item.status === "active" && item.membership_id !== params[1] && ["org_admin", "partner_org_admin"].includes(role.role_name);
      }).length;
      return { rows: [{ admin_count: count }] };
    }
    throw new Error(`Unhandled fake query: ${normalized}`);
  }
}

function service(executor: FakeExecutor) {
  return new MembershipService(
    executor.query.bind(executor),
    async (fn: any) => fn(executor),
    async (event: any) => { executor.audits.push(event); return event; },
  );
}

test("IOH-3 non-admin cannot perform membership administration", async () => {
  const executor = new FakeExecutor();
  await assert.rejects(
    () => service(executor).assign({ user_id: "target-a", role_id: "role_operator" }, actor({ permissions: [] })),
    (error: any) => error instanceof MembershipServiceError && error.code === "FORBIDDEN",
  );
});

test("IOH-3 org admin can assign bounded org roles but not platform/admin roles", async () => {
  const executor = new FakeExecutor();
  const assigned = await service(executor).assign({ user_id: "target-a", role_id: "role_operator" }, actor());
  assert.equal(assigned.replayed, false);
  assert.equal(executor.audits[0].action_type, "identity.membership.assigned");
  await assert.rejects(() => service(executor).assign({ user_id: "admin-b", role_id: "role_super_admin" }, actor()), (error: any) => error.code === "TARGET_ROLE_FORBIDDEN");
  await assert.rejects(() => service(executor).assign({ user_id: "admin-b", role_id: "role_org_admin" }, actor()), (error: any) => error.code === "TARGET_ROLE_FORBIDDEN");
});

test("IOH-3 org admin can assign an organization-owned custom role", async () => {
  const executor = new FakeExecutor();
  const assigned = await service(executor).assign({ user_id: "target-a", role_id: "role_member_custom" }, actor());
  assert.equal(assigned.membership.role_id, "role_member_custom");
});

test("IOH-3 self-escalation and duplicate active membership are blocked", async () => {
  const executor = new FakeExecutor([membership({ user_id: "admin-a", membership_id: "mem-admin-a", role_id: "role_operator" })]);
  await assert.rejects(() => service(executor).changeRole("mem-admin-a", { role_id: "role_reviewer" }, actor()), (error: any) => error.code === "SELF_ROLE_CHANGE_FORBIDDEN");
  const duplicate = new FakeExecutor([membership({ user_id: "target-a", role_id: "role_operator" })]);
  assert.equal((await service(duplicate).assign({ user_id: "target-a", role_id: "role_operator" }, actor())).replayed, true);
  await assert.rejects(() => service(duplicate).assign({ user_id: "target-a", role_id: "role_reviewer" }, actor()), (error: any) => error.code === "DUPLICATE_ACTIVE_MEMBERSHIP");
});

test("IOH-3 role change and revocation remain scoped to one organization", async () => {
  const executor = new FakeExecutor([
    membership({ membership_id: "mem-a", user_id: "target-a", organization_id: "org-a", role_id: "role_operator", role_name: "operator" }),
    membership({ membership_id: "mem-b", user_id: "target-a", organization_id: "org-b", role_id: "role_operator", role_name: "operator" }),
    membership({ membership_id: "mem-admin", user_id: "admin-b", organization_id: "org-a", role_id: "role_org_admin", role_name: "org_admin" }),
  ]);
  await service(executor).changeRole("mem-a", { role_id: "role_reviewer" }, actor());
  assert.equal(executor.memberships.find((item) => item.membership_id === "mem-a")?.role_id, "role_reviewer");
  assert.equal(executor.memberships.find((item) => item.membership_id === "mem-b")?.role_id, "role_operator");
  await assert.rejects(() => service(executor).changeRole("mem-b", { role_id: "role_reviewer" }, actor()), (error: any) => error.code === "NOT_FOUND");
  const scoped = applyActiveOrganizationContext({ user_id: "target-a", memberships: [{ organization_id: "org-a", role: "reviewer", status: "active", organization_status: "active" }] }, "org-a");
  assert.deepEqual(scoped.organization_scoped_roles, ["reviewer"]);
});

test("IOH-3 last-admin protection and revocation invalidation are enforced", async () => {
  const executor = new FakeExecutor([membership({ membership_id: "mem-admin", user_id: "target-a", role_id: "role_org_admin", role_name: "org_admin" })]);
  await assert.rejects(() => service(executor).revoke("mem-admin", {}, actor({ user_id: "admin-b" })), (error: any) => error.code === "LAST_ADMIN_REQUIRED");
  const revocable = new FakeExecutor([
    membership({ membership_id: "mem-a", user_id: "target-a", role_id: "role_operator", role_name: "operator" }),
    membership({ membership_id: "mem-admin", user_id: "admin-b", role_id: "role_org_admin", role_name: "org_admin" }),
  ]);
  await service(revocable).revoke("mem-a", {}, actor({ user_id: "admin-b" }));
  const revoked = revocable.memberships.find((item) => item.membership_id === "mem-a");
  const transition = resolveOrganizationContextTransition({ user_id: "target-a", memberships: [{ organization_id: "org-a", role: "operator", status: revoked?.status, organization_status: "active" }] }, { requestedOrganizationId: "org-a" });
  assert.equal(transition.ok, false);
  assert.equal(transition.error_code, "MEMBERSHIP_REVOKED");
});
