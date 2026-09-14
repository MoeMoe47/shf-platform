import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { writeAuditEvent } from "../../audit/service/audit-helper.js";

export class MembershipServiceError extends Error {
  constructor(public readonly code: string, message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "MembershipServiceError";
  }
}

function actorOrganization(actor: any) {
  const organizationId = String(actor?.active_organization_id || actor?.organization_id || "").trim();
  const tenantId = String(actor?.tenant_id || `tenant:${organizationId}`).trim();
  if (!organizationId || tenantId !== `tenant:${organizationId}`) throw new MembershipServiceError("ORG_CONTEXT_REQUIRED", "A valid organization context is required.", 403);
  return { organizationId, tenantId };
}

function actorId(actor: any) {
  return String(actor?.user_id || actor?.id || actor?.actor_user_id || "").trim();
}

function hasPermission(actor: any, permission: string) {
  const permissions = Array.isArray(actor?.permissions) ? actor.permissions : [];
  if (permissions.includes(permission)) return true;
  const legacyAliases: Record<string, string[]> = {
    [SHS_SECURITY_PERMISSIONS.IDENTITY_VIEW]: ["user.read", "role.read"],
    [SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_ASSIGN]: ["membership.assign"],
    [SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_REVOKE]: ["membership.revoke"],
  };
  return (legacyAliases[permission] || []).some((alias) => permissions.includes(alias));
}

function isPlatformActor(actor: any) {
  const roles = Array.isArray(actor?.roles) ? actor.roles : [actor?.role, actor?.role_name].filter(Boolean);
  return roles.some((role: string) => isPlatformGlobalRole(role, actor?.role_scope_type));
}

function assertActor(actor: any, permission: string) {
  const id = actorId(actor);
  if (!id) throw new MembershipServiceError("AUTH_REQUIRED", "Authentication required.", 401);
  if (!hasPermission(actor, permission)) throw new MembershipServiceError("FORBIDDEN", `Missing permission: ${permission}`, 403);
  return { ...actorOrganization(actor), id };
}

function rejectAuthorityFields(input: any) {
  for (const field of ["membership_id", "membershipId", "status", "created_at", "updated_at", "revoked_at", "actor_user_id", "tenant_id"]) {
    if (Object.prototype.hasOwnProperty.call(input || {}, field)) throw new MembershipServiceError("SERVER_DERIVED_AUTHORITY", `${field} is server-derived.`, 400);
  }
}

const ORG_ADMIN_ROLE_NAMES = new Set(["org_admin", "partner_org_admin"]);
const ORG_ADMIN_ASSIGNABLE_ROLE_NAMES = new Set([
  "operator",
  "program_manager",
  "reviewer",
  "reviewer_verifier",
  "instructor",
  "student",
  "read_only_viewer",
  "program_worker",
  "auditor",
  "leadership_funder_viewer",
]);

function roleName(role: any) {
  return String(role?.role_name || role?.role || "").trim();
}

function assertTargetRoleAllowed(actor: any, targetRole: any, targetUserId: string) {
  const name = roleName(targetRole);
  const scopeType = String(targetRole?.role_scope_type || "").trim();
  const roleOrganizationId = String(targetRole?.organization_id || "").trim();
  if (!name) throw new MembershipServiceError("ROLE_NOT_FOUND", "Role is not valid for the organization.", 404);
  if (actorId(actor) === targetUserId && !isPlatformActor(actor)) {
    throw new MembershipServiceError("SELF_ROLE_CHANGE_FORBIDDEN", "Users cannot change their own membership role.", 403);
  }
  if (isPlatformActor(actor)) return;
  if (scopeType !== "organization" || (!ORG_ADMIN_ASSIGNABLE_ROLE_NAMES.has(name) && !roleOrganizationId)) {
    throw new MembershipServiceError("TARGET_ROLE_FORBIDDEN", "Actor is not permitted to assign the requested role.", 403);
  }
}

function isAdminRole(role: any) {
  return ORG_ADMIN_ROLE_NAMES.has(roleName(role));
}

export class MembershipService {
  constructor(
    private readonly dbQuery = query,
    private readonly transaction = withTransaction,
    private readonly auditWriter = writeAuditEvent,
  ) {}

  async list(actor: any, requestedOrganizationId?: string | null) {
    const scope = assertActor(actor, "identity.view");
    const organizationId = String(requestedOrganizationId || scope.organizationId).trim() || scope.organizationId;
    if (organizationId !== scope.organizationId && !isPlatformActor(actor)) throw new MembershipServiceError("FORBIDDEN", "Cannot read another organization's memberships.", 403);
    const result = await this.dbQuery(
      `SELECT m.membership_id, m.user_id, m.organization_id, m.status, m.effective_from, m.effective_to,
              m.created_at, m.updated_at, r.role_id, r.role_name
       FROM memberships m JOIN roles r ON r.role_id = m.role_id
       WHERE m.organization_id=$1 AND m.organization_id IS NOT NULL
       ORDER BY m.created_at DESC, m.membership_id`,
      [organizationId],
    );
    return result.rows;
  }

  async listAssignableRoles(actor: any) {
    const scope = assertActor(actor, "identity.membership.assign");
    const result = await this.dbQuery(
      `SELECT role_id, role_name, role_scope_type, organization_id
       FROM roles
       WHERE role_scope_type = 'organization'
         AND (organization_id IS NULL OR organization_id = $1)
       ORDER BY role_name`,
      [scope.organizationId],
    );
    return result.rows
      .filter((role: any) => {
        if (isPlatformActor(actor)) return true;
        const roleOrganizationId = String(role?.organization_id || "").trim();
        return ORG_ADMIN_ASSIGNABLE_ROLE_NAMES.has(roleName(role)) || Boolean(roleOrganizationId);
      })
      .map((role: any) => ({
        role_id: role.role_id,
        role_name: role.role_name,
        role_scope_type: role.role_scope_type,
        organization_id: role.organization_id || null,
      }));
  }

  async assign(input: any, actor: any) {
    const scope = assertActor(actor, "identity.membership.assign");
    rejectAuthorityFields(input);
    const targetOrganizationId = String(input?.organization_id || input?.organizationId || scope.organizationId).trim();
    if (targetOrganizationId !== scope.organizationId && !isPlatformActor(actor)) throw new MembershipServiceError("FORBIDDEN", "Cannot assign membership outside the active organization.", 403);
    const userId = String(input?.user_id || input?.userId || "").trim();
    const roleId = String(input?.role_id || input?.roleId || "").trim();
    if (!userId || !roleId) throw new MembershipServiceError("INVALID_REQUEST", "user_id and role_id are required.", 400);
    return this.transaction(async (executor) => {
      const user = await executor.query("SELECT user_id FROM users WHERE user_id=$1 AND status='active'", [userId]);
      if (!user.rows[0]) throw new MembershipServiceError("USER_NOT_FOUND", "Active user not found.", 404);
      const role = await executor.query("SELECT role_id, organization_id, role_name, role_scope_type FROM roles WHERE role_id=$1", [roleId]);
      if (!role.rows[0] || (role.rows[0].organization_id && role.rows[0].organization_id !== targetOrganizationId)) throw new MembershipServiceError("ROLE_NOT_FOUND", "Role is not valid for the organization.", 404);
      assertTargetRoleAllowed(actor, role.rows[0], userId);
      const existing = await executor.query(
        "SELECT * FROM memberships WHERE user_id=$1 AND organization_id=$2 AND status='active' LIMIT 1",
        [userId, targetOrganizationId],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].role_id === roleId) return { membership: existing.rows[0], replayed: true };
        throw new MembershipServiceError("DUPLICATE_ACTIVE_MEMBERSHIP", "User already has an active membership in this organization.", 409);
      }
      const membershipId = `membership_${randomUUID()}`;
      const created = await executor.query(
        `INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from)
         VALUES ($1,$2,$3,$4,'active',COALESCE($5::timestamp,NOW())) RETURNING *`,
        [membershipId, userId, targetOrganizationId, roleId, input?.effective_from || input?.effectiveFrom || null],
      );
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: targetOrganizationId, actor_user_id: scope.id,
        target_object_type: "membership", target_object_id: membershipId, action_type: "identity.membership.assigned",
        new_state_json: created.rows[0], reason_code: "membership_assigned", reason_text: input?.reason || "Membership assigned.",
        correlation_id: `membership:${membershipId}`, source_channel: "identity.membership.service",
      }, executor);
      return { membership: created.rows[0], replayed: false };
    });
  }

  async changeRole(membershipId: string, input: any, actor: any) {
    const scope = assertActor(actor, "identity.membership.assign");
    rejectAuthorityFields(input);
    const roleId = String(input?.role_id || input?.roleId || "").trim();
    if (!roleId) throw new MembershipServiceError("INVALID_REQUEST", "role_id is required.", 400);
    return this.transaction(async (executor) => {
      const current = await executor.query(
        `SELECT m.*, r.role_name, r.role_scope_type
         FROM memberships m JOIN roles r ON r.role_id = m.role_id
         WHERE m.membership_id=$1 AND m.organization_id=$2 FOR UPDATE`,
        [membershipId, scope.organizationId],
      );
      if (!current.rows[0]) throw new MembershipServiceError("NOT_FOUND", "Membership not found.", 404);
      const row = current.rows[0];
      if (row.status !== "active") throw new MembershipServiceError("MEMBERSHIP_INACTIVE", "Only active memberships can change role.", 409);
      const nextRole = await executor.query("SELECT role_id, organization_id, role_name, role_scope_type FROM roles WHERE role_id=$1", [roleId]);
      if (!nextRole.rows[0] || (nextRole.rows[0].organization_id && nextRole.rows[0].organization_id !== scope.organizationId)) throw new MembershipServiceError("ROLE_NOT_FOUND", "Role is not valid for the organization.", 404);
      assertTargetRoleAllowed(actor, nextRole.rows[0], row.user_id);
      if (row.role_id === roleId) return { membership: row, replayed: true };
      if (isAdminRole(row) && !isAdminRole(nextRole.rows[0])) await this.assertNotLastAdmin(executor, scope.organizationId, membershipId, actor);
      const updated = await executor.query("UPDATE memberships SET role_id=$1, updated_at=NOW() WHERE membership_id=$2 AND organization_id=$3 RETURNING *", [roleId, membershipId, scope.organizationId]);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organizationId, actor_user_id: scope.id,
        target_object_type: "membership", target_object_id: membershipId, action_type: "identity.membership.role_changed",
        previous_state_json: row, new_state_json: updated.rows[0], reason_code: "membership_role_changed", reason_text: input?.reason || "Membership role changed.",
        correlation_id: `membership:${membershipId}`, source_channel: "identity.membership.service",
      }, executor);
      return { membership: updated.rows[0], replayed: false };
    });
  }

  async revoke(membershipId: string, input: any, actor: any) {
    const scope = assertActor(actor, "identity.membership.revoke");
    rejectAuthorityFields(input);
    return this.transaction(async (executor) => {
      const current = await executor.query(
        `SELECT m.*, r.role_name, r.role_scope_type
         FROM memberships m JOIN roles r ON r.role_id = m.role_id
         WHERE m.membership_id=$1 AND m.organization_id=$2 FOR UPDATE`,
        [membershipId, scope.organizationId],
      );
      if (!current.rows[0]) throw new MembershipServiceError("NOT_FOUND", "Membership not found.", 404);
      if (current.rows[0].status === "revoked") return { membership: current.rows[0], replayed: true };
      if (actorId(actor) === current.rows[0].user_id && !isPlatformActor(actor)) {
        throw new MembershipServiceError("SELF_MEMBERSHIP_REVOKE_FORBIDDEN", "Users cannot revoke their own membership.", 403);
      }
      if (isAdminRole(current.rows[0])) await this.assertNotLastAdmin(executor, scope.organizationId, membershipId, actor);
      const updated = await executor.query("UPDATE memberships SET status='revoked', effective_to=COALESCE(effective_to,NOW()), updated_at=NOW() WHERE membership_id=$1 AND organization_id=$2 RETURNING *", [membershipId, scope.organizationId]);
      await this.auditWriter({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organizationId, actor_user_id: scope.id,
        target_object_type: "membership", target_object_id: membershipId, action_type: "identity.membership.revoked",
        previous_state_json: current.rows[0], new_state_json: updated.rows[0], reason_code: "membership_revoked", reason_text: input?.reason || "Membership revoked.",
        correlation_id: `membership:${membershipId}`, source_channel: "identity.membership.service",
      }, executor);
      return { membership: updated.rows[0], replayed: false };
    });
  }

  private async assertNotLastAdmin(executor: any, organizationId: string, membershipId: string, actor: any) {
    if (isPlatformActor(actor)) return;
    const result = await executor.query(
      `SELECT COUNT(*)::int AS admin_count
       FROM memberships m JOIN roles r ON r.role_id = m.role_id
       WHERE m.organization_id=$1 AND m.status='active' AND m.membership_id<>$2
         AND r.role_name IN ('org_admin','partner_org_admin')`,
      [organizationId, membershipId],
    );
    const count = Number(result.rows[0]?.admin_count || 0);
    if (count < 1) {
      throw new MembershipServiceError("LAST_ADMIN_REQUIRED", "At least one active organization admin must remain.", 409);
    }
  }
}
