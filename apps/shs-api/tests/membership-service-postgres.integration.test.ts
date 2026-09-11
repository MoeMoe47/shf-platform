import test from "node:test";
import assert from "node:assert/strict";
import { query } from "../src/db/client.js";
import { MembershipService, MembershipServiceError } from "../src/domain/identity/service/membership-service.js";

const run = `sys2a_${Date.now()}`;
const org = `org_${run}`;
const otherOrg = `org_other_${run}`;
const user = `user_${run}`;
const role = `role_${run}`;
const actorUser = `admin_${run}`;
const actor = {
  user_id: actorUser,
  active_organization_id: org,
  organization_id: org,
  tenant_id: `tenant:${org}`,
  roles: ["org_admin"],
  permissions: ["identity.view", "identity.membership.assign", "identity.membership.revoke"],
};

test.before(async () => {
  await query("INSERT INTO organizations (organization_id, legal_name, display_name, org_type, status) VALUES ($1,$1,$1,'NETWORK','active'),($2,$2,$2,'NETWORK','active')", [org, otherOrg]);
  await query("INSERT INTO users (user_id, organization_id, email, full_name, status, identity_source) VALUES ($1,$2,$1,$1,'active','test'),($3,$2,$3,$3,'active','test')", [user, org, actorUser]);
  await query("INSERT INTO roles (role_id, organization_id, role_name, role_scope_type) VALUES ($1,$2,'member','organization')", [role, org]);
});

test.after(async () => {
  await query("DELETE FROM audit_events WHERE target_object_id LIKE $1 OR actor_user_id IN ($2,$3)", [`%${run}%`, user, actorUser]);
  await query("DELETE FROM memberships WHERE user_id=$1", [user]);
  await query("DELETE FROM roles WHERE role_id=$1", [role]);
  await query("DELETE FROM users WHERE user_id=$1", [user]);
  await query("DELETE FROM users WHERE user_id=$1", [actorUser]);
  await query("DELETE FROM organizations WHERE organization_id IN ($1,$2)", [org, otherOrg]);
});

test("membership assignment persists canonically, is idempotent, and revocation is scoped", async () => {
  const service = new MembershipService();
  const first = await service.assign({ user_id: user, organization_id: org, role_id: role }, actor);
  const replay = await service.assign({ user_id: user, organization_id: org, role_id: role }, actor);
  assert.equal(first.replayed, false);
  assert.equal(replay.replayed, true);
  assert.equal(replay.membership.membership_id, first.membership.membership_id);
  assert.equal((await query("SELECT COUNT(*)::int AS count FROM memberships WHERE user_id=$1 AND organization_id=$2 AND status='active'", [user, org])).rows[0].count, 1);
  assert.equal((await service.list(actor, org)).length, 1);
  await assert.rejects(() => service.assign({ user_id: user, organization_id: otherOrg, role_id: role }, actor), (error: any) => error instanceof MembershipServiceError && error.code === "FORBIDDEN");
  const revoked = await service.revoke(first.membership.membership_id, { reason: "membership ended" }, actor);
  assert.equal(revoked.membership.status, "revoked");
  assert.equal((await query("SELECT COUNT(*)::int FROM audit_events WHERE target_object_id=$1 AND action_type LIKE 'identity.membership.%'", [first.membership.membership_id])).rows[0].count, 2);
  assert.equal((await service.revoke(first.membership.membership_id, {}, actor)).replayed, true);
});
