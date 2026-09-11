import { randomUUID } from "node:crypto";
import { query } from "../../../db/client.js";
import { withTransaction } from "../../../db/transaction.js";
import { isPlatformGlobalRole } from "../../../auth/security-permissions.js";
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
  return Array.isArray(actor?.permissions) && actor.permissions.includes(permission);
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
  for (const field of ["status", "created_at", "updated_at", "revoked_at", "actor_user_id", "tenant_id"]) {
    if (Object.prototype.hasOwnProperty.call(input || {}, field)) throw new MembershipServiceError("SERVER_DERIVED_AUTHORITY", `${field} is server-derived.`, 400);
  }
}

export class MembershipService {
  async list(actor: any, requestedOrganizationId?: string | null) {
    const scope = assertActor(actor, "identity.view");
    const organizationId = String(requestedOrganizationId || scope.organizationId).trim() || scope.organizationId;
    if (organizationId !== scope.organizationId && !isPlatformActor(actor)) throw new MembershipServiceError("FORBIDDEN", "Cannot read another organization's memberships.", 403);
    const result = await query(
      `SELECT m.membership_id, m.user_id, m.organization_id, m.status, m.effective_from, m.effective_to,
              m.created_at, m.updated_at, r.role_id, r.role_name
       FROM memberships m JOIN roles r ON r.role_id = m.role_id
       WHERE m.organization_id=$1 AND m.organization_id IS NOT NULL
       ORDER BY m.created_at DESC, m.membership_id`,
      [organizationId],
    );
    return result.rows;
  }

  async assign(input: any, actor: any) {
    const scope = assertActor(actor, "identity.membership.assign");
    rejectAuthorityFields(input);
    const targetOrganizationId = String(input?.organization_id || input?.organizationId || scope.organizationId).trim();
    if (targetOrganizationId !== scope.organizationId && !isPlatformActor(actor)) throw new MembershipServiceError("FORBIDDEN", "Cannot assign membership outside the active organization.", 403);
    const userId = String(input?.user_id || input?.userId || "").trim();
    const roleId = String(input?.role_id || input?.roleId || "").trim();
    if (!userId || !roleId) throw new MembershipServiceError("INVALID_REQUEST", "user_id and role_id are required.", 400);
    return withTransaction(async (executor) => {
      const user = await executor.query("SELECT user_id FROM users WHERE user_id=$1 AND status='active'", [userId]);
      if (!user.rows[0]) throw new MembershipServiceError("USER_NOT_FOUND", "Active user not found.", 404);
      const role = await executor.query("SELECT role_id, organization_id FROM roles WHERE role_id=$1", [roleId]);
      if (!role.rows[0] || (role.rows[0].organization_id && role.rows[0].organization_id !== targetOrganizationId)) throw new MembershipServiceError("ROLE_NOT_FOUND", "Role is not valid for the organization.", 404);
      const existing = await executor.query(
        "SELECT * FROM memberships WHERE user_id=$1 AND organization_id=$2 AND role_id=$3 AND status='active' LIMIT 1",
        [userId, targetOrganizationId, roleId],
      );
      if (existing.rows[0]) return { membership: existing.rows[0], replayed: true };
      const membershipId = String(input?.membership_id || input?.membershipId || `membership_${randomUUID()}`).trim();
      const created = await executor.query(
        `INSERT INTO memberships (membership_id, user_id, organization_id, role_id, status, effective_from)
         VALUES ($1,$2,$3,$4,'active',COALESCE($5::timestamp,NOW())) RETURNING *`,
        [membershipId, userId, targetOrganizationId, roleId, input?.effective_from || input?.effectiveFrom || null],
      );
      await writeAuditEvent({
        audit_event_id: `audit_${randomUUID()}`, organization_id: targetOrganizationId, actor_user_id: scope.id,
        target_object_type: "membership", target_object_id: membershipId, action_type: "identity.membership.assigned",
        new_state_json: created.rows[0], reason_code: "membership_assigned", reason_text: input?.reason || "Membership assigned.",
        correlation_id: `membership:${membershipId}`, source_channel: "identity.membership.service",
      }, executor);
      return { membership: created.rows[0], replayed: false };
    });
  }

  async revoke(membershipId: string, input: any, actor: any) {
    const scope = assertActor(actor, "identity.membership.revoke");
    rejectAuthorityFields(input);
    return withTransaction(async (executor) => {
      const current = await executor.query("SELECT * FROM memberships WHERE membership_id=$1 AND organization_id=$2 FOR UPDATE", [membershipId, scope.organizationId]);
      if (!current.rows[0]) throw new MembershipServiceError("NOT_FOUND", "Membership not found.", 404);
      if (current.rows[0].status === "revoked") return { membership: current.rows[0], replayed: true };
      const updated = await executor.query("UPDATE memberships SET status='revoked', effective_to=COALESCE(effective_to,NOW()), updated_at=NOW() WHERE membership_id=$1 AND organization_id=$2 RETURNING *", [membershipId, scope.organizationId]);
      await writeAuditEvent({
        audit_event_id: `audit_${randomUUID()}`, organization_id: scope.organizationId, actor_user_id: scope.id,
        target_object_type: "membership", target_object_id: membershipId, action_type: "identity.membership.revoked",
        previous_state_json: current.rows[0], new_state_json: updated.rows[0], reason_code: "membership_revoked", reason_text: input?.reason || "Membership revoked.",
        correlation_id: `membership:${membershipId}`, source_channel: "identity.membership.service",
      }, executor);
      return { membership: updated.rows[0], replayed: false };
    });
  }
}
