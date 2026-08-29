import { mergeRolePermissions, isPlatformGlobalRole } from "./security-permissions.js";
import { resolveTenantForOrganization } from "./tenant-context.js";

export class OrganizationContextError extends Error {
  constructor(public readonly code: string, message: string = code) {
    super(message);
    this.name = "OrganizationContextError";
  }
}

type MembershipLike = {
  membership_id?: string;
  organization_id?: string;
  tenant_id?: string;
  role?: string;
  role_name?: string;
  roles?: string[];
  role_scope_type?: string;
  status?: string;
  organization_status?: string;
  permissions?: string[];
};

function membershipRoles(membership: MembershipLike) {
  if (Array.isArray(membership.roles)) return membership.roles.filter(Boolean);
  return [membership.role, membership.role_name].filter(Boolean) as string[];
}

function isActiveMembership(membership: MembershipLike) {
  const membershipStatus = String(membership.status || "active").toLowerCase();
  const organizationStatus = String(membership.organization_status || "active").toLowerCase();
  return membershipStatus === "active" && organizationStatus === "active";
}

function platformMemberships(memberships: MembershipLike[]) {
  return memberships.filter((membership) =>
    isActiveMembership(membership) &&
    membershipRoles(membership).some((role) => isPlatformGlobalRole(role, membership.role_scope_type))
  );
}

function fallbackMembershipFromUser(user: any): MembershipLike | null {
  const organizationId = user?.organization_id || user?.active_organization_id;
  if (!organizationId) return null;
  const roles = Array.isArray(user?.roles) && user.roles.length
    ? user.roles
    : [user?.role, user?.role_name, user?.role_id].filter(Boolean);
  if (!roles.length) return null;
  return {
    membership_id: user.membership_id || `legacy:${user.user_id || user.id}:${organizationId}`,
    organization_id: organizationId,
    tenant_id: user.tenant_id,
    roles,
    role_scope_type: roles.some((role: string) => isPlatformGlobalRole(role)) ? "platform" : "organization",
    permissions: Array.isArray(user.permissions) ? user.permissions : undefined,
    status: "active",
    organization_status: "active",
  };
}

export function getRequestedOrganizationId(req: any) {
  const headerValue = req?.headers?.["x-shs-organization-id"] || req?.headers?.["x-organization-id"];
  if (Array.isArray(headerValue)) return String(headerValue[0] || "").trim() || null;
  return String(headerValue || "").trim() || null;
}

export function resolveActiveOrganizationContext(user: any, requestedOrganizationId?: string | null) {
  if (!user) throw new OrganizationContextError("AUTH_REQUIRED", "Authentication required.");
  const suppliedMemberships = Array.isArray(user.memberships) ? user.memberships : [];
  const fallback = suppliedMemberships.length ? null : fallbackMembershipFromUser(user);
  const memberships = [...suppliedMemberships, ...(fallback ? [fallback] : [])]
    .filter((membership) => membership?.organization_id);
  const activeMemberships = memberships.filter(isActiveMembership);
  const platform = platformMemberships(activeMemberships);

  if (requestedOrganizationId) {
    const selected = activeMemberships.find((membership) => membership.organization_id === requestedOrganizationId);
    if (selected) return buildContext(user, selected, platform);
    if (platform.length) {
      return buildContext(user, {
        membership_id: platform[0].membership_id,
        organization_id: requestedOrganizationId,
        tenant_id: resolveTenantForOrganization(requestedOrganizationId),
        roles: membershipRoles(platform[0]),
        role_scope_type: "platform",
        permissions: platform[0].permissions,
        status: "active",
        organization_status: "active",
      }, platform);
    }
    throw new OrganizationContextError("ORG_CONTEXT_FORBIDDEN", "Active organization is not authorized.");
  }

  const organizationIds = Array.from(new Set(activeMemberships
    .filter((membership) => !membershipRoles(membership).some((role) => isPlatformGlobalRole(role, membership.role_scope_type)))
    .map((membership) => membership.organization_id)));
  if (organizationIds.length === 1) {
    return buildContext(user, activeMemberships.find((membership) => membership.organization_id === organizationIds[0])!, platform);
  }
  if (organizationIds.length === 0 && platform.length && user.organization_id) {
    return buildContext(user, platform[0], platform);
  }
  if (organizationIds.length > 1) {
    throw new OrganizationContextError("ORG_CONTEXT_REQUIRED", "Active organization header is required for multi-organization users.");
  }
  throw new OrganizationContextError("ORG_CONTEXT_UNAVAILABLE", "No active organization membership is available.");
}

function buildContext(user: any, selected: MembershipLike, platform: MembershipLike[]) {
  const organizationId = String(selected.organization_id || "").trim();
  if (!organizationId) throw new OrganizationContextError("ORG_CONTEXT_UNAVAILABLE");
  const selectedRoles = membershipRoles(selected);
  const selectedPermissions = Array.isArray(selected.permissions) && selected.permissions.length
    ? selected.permissions
    : mergeRolePermissions(selectedRoles);
  const platformRoles = platform.flatMap(membershipRoles);
  const platformPermissions = platform.flatMap((membership) =>
    Array.isArray(membership.permissions) && membership.permissions.length
      ? membership.permissions
      : mergeRolePermissions(membershipRoles(membership))
  );
  const roles = Array.from(new Set([...selectedRoles, ...platformRoles]));
  const permissions = Array.from(new Set([...selectedPermissions, ...platformPermissions]));
  let tenantId: string;
  try {
    tenantId = resolveTenantForOrganization(organizationId, selected.tenant_id || user.tenant_id);
  } catch (error: any) {
    if (error?.message === "tenant_organization_mismatch") {
      throw new OrganizationContextError("TENANT_ORG_MISMATCH", "Tenant does not match active organization.");
    }
    throw error;
  }
  return {
    actor_user_id: user.user_id || user.id,
    active_organization_id: organizationId,
    organization_id: organizationId,
    tenant_id: tenantId,
    membership_id: selected.membership_id || null,
    roles,
    permissions,
  };
}

export function applyActiveOrganizationContext(user: any, requestedOrganizationId?: string | null) {
  const context = resolveActiveOrganizationContext(user, requestedOrganizationId);
  return {
    ...user,
    ...context,
    role: context.roles[0],
    role_name: context.roles[0],
    organization_scoped_roles: context.roles,
    organization_scoped_permissions: context.permissions,
  };
}
