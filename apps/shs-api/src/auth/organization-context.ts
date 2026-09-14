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
  entitlement_summary?: any;
  entitlementSummary?: any;
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

export function getPreferredOrganizationId(req: any) {
  const headerValue = req?.headers?.["x-shs-preferred-organization-id"] || req?.headers?.["x-preferred-organization-id"];
  if (Array.isArray(headerValue)) return String(headerValue[0] || "").trim() || null;
  return String(headerValue || "").trim() || null;
}

function organizationMemberships(user: any) {
  const suppliedMemberships = Array.isArray(user?.memberships) ? user.memberships : [];
  const fallback = suppliedMemberships.length ? null : fallbackMembershipFromUser(user);
  return [...suppliedMemberships, ...(fallback ? [fallback] : [])]
    .filter((membership) => membership?.organization_id);
}

function activeNonPlatformOrganizationIds(memberships: MembershipLike[]) {
  return Array.from(new Set(memberships
    .filter(isActiveMembership)
    .filter((membership) => !membershipRoles(membership).some((role) => isPlatformGlobalRole(role, membership.role_scope_type)))
    .map((membership) => membership.organization_id)
    .filter(Boolean))) as string[];
}

function classifyInvalidOrganization(user: any, organizationId?: string | null) {
  const normalized = String(organizationId || "").trim();
  if (!normalized) return "ORG_CONTEXT_REQUIRED";
  const membership = organizationMemberships(user).find((item) => item.organization_id === normalized);
  if (!membership) return "ORG_CONTEXT_FORBIDDEN";
  const membershipStatus = String(membership.status || "active").toLowerCase();
  const organizationStatus = String(membership.organization_status || "active").toLowerCase();
  if (membershipStatus !== "active") return "MEMBERSHIP_REVOKED";
  if (organizationStatus !== "active") return "ORG_SUSPENDED";
  return "ORG_CONTEXT_FORBIDDEN";
}

function safeLandingReason(code: string) {
  if (code === "ORG_CONTEXT_REQUIRED") return "NO_ORG_SELECTED";
  if (code === "ORG_CONTEXT_UNAVAILABLE") return "NO_ORG";
  if (code === "MEMBERSHIP_REVOKED") return "MEMBERSHIP_REVOKED";
  if (code === "ORG_SUSPENDED") return "ORG_SUSPENDED";
  if (code === "TENANT_ORG_MISMATCH") return "TENANT_MISMATCH";
  if (code === "ORG_CONTEXT_FORBIDDEN") return "UNAUTHORIZED_ORG";
  return "ORG_CONTEXT_INVALID";
}

export function routeValidityContract(context: any = null) {
  return {
    authority: "experience_input_only",
    active_organization_id: context?.active_organization_id || null,
    inputs: [
      "active_organization_id",
      "membership_status",
      "organization_status",
      "role_context",
      "permission_context",
      "entitlement_summary",
    ],
    preserve_current_route_only_when: [
      "organization matches",
      "membership is active",
      "organization is active",
      "required role/permission is present",
      "required service entitlement is present",
    ],
  };
}

export function resolveOrganizationContextTransition(user: any, input: {
  requestedOrganizationId?: string | null;
  preferredOrganizationId?: string | null;
  previousOrganizationId?: string | null;
} = {}) {
  if (!user) {
    return {
      ok: false,
      active_context: null,
      selected_organization_id: null,
      selection_source: "none",
      error_code: "AUTH_REQUIRED",
      safe_landing_reason: "AUTH_REQUIRED",
      ignored_preferred_organization_id: null,
      invalidation: staleStateInvalidation(input.previousOrganizationId || null, null, true),
      route_validity_contract: routeValidityContract(null),
    };
  }

  const requestedOrganizationId = String(input.requestedOrganizationId || "").trim() || null;
  const preferredOrganizationId = String(input.preferredOrganizationId || "").trim() || null;

  if (requestedOrganizationId) {
    try {
      const context = resolveActiveOrganizationContext(user, requestedOrganizationId);
      return resolvedTransition(context, "requested", input.previousOrganizationId, null);
    } catch (error: any) {
      const code = error instanceof OrganizationContextError
        ? (error.code === "TENANT_ORG_MISMATCH" ? error.code : classifyInvalidOrganization(user, requestedOrganizationId))
        : "ORG_CONTEXT_INVALID";
      return {
        ok: false,
        active_context: null,
        selected_organization_id: null,
        selection_source: "requested",
        error_code: code,
        safe_landing_reason: safeLandingReason(code),
        ignored_preferred_organization_id: null,
        invalidation: staleStateInvalidation(input.previousOrganizationId || null, null, true),
        route_validity_contract: routeValidityContract(null),
      };
    }
  }

  let ignoredPreferred: string | null = null;
  if (preferredOrganizationId) {
    try {
      const context = resolveActiveOrganizationContext(user, preferredOrganizationId);
      return resolvedTransition(context, "preferred", input.previousOrganizationId, null);
    } catch {
      ignoredPreferred = preferredOrganizationId;
    }
  }

  try {
    const context = resolveActiveOrganizationContext(user, null);
    const activeOrganizationIds = activeNonPlatformOrganizationIds(organizationMemberships(user));
    const source = activeOrganizationIds.length === 1 ? "single_authorized" : "platform_default";
    return resolvedTransition(context, source, input.previousOrganizationId, ignoredPreferred);
  } catch (error: any) {
    const code = error instanceof OrganizationContextError ? error.code : "ORG_CONTEXT_INVALID";
    return {
      ok: false,
      active_context: null,
      selected_organization_id: null,
      selection_source: "none",
      error_code: code,
      safe_landing_reason: safeLandingReason(code),
      ignored_preferred_organization_id: ignoredPreferred,
      invalidation: staleStateInvalidation(input.previousOrganizationId || null, null, true),
      route_validity_contract: routeValidityContract(null),
    };
  }
}

function resolvedTransition(context: any, selectionSource: string, previousOrganizationId?: string | null, ignoredPreferredOrganizationId?: string | null) {
  return {
    ok: true,
    active_context: context,
    selected_organization_id: context.active_organization_id,
    selection_source: selectionSource,
    error_code: null,
    safe_landing_reason: "OK",
    ignored_preferred_organization_id: ignoredPreferredOrganizationId,
    invalidation: staleStateInvalidation(previousOrganizationId || null, context.active_organization_id, false),
    route_validity_contract: routeValidityContract(context),
  };
}

function staleStateInvalidation(previousOrganizationId: string | null, nextOrganizationId: string | null, force: boolean) {
  const organizationChanged = Boolean(force || (previousOrganizationId && previousOrganizationId !== nextOrganizationId));
  return {
    organization_changed: organizationChanged,
    clear_org_scoped_state: organizationChanged,
    clear_role_context: organizationChanged,
    clear_permission_context: organizationChanged,
    clear_entitlement_context: organizationChanged,
    previous_organization_id: previousOrganizationId || null,
    next_organization_id: nextOrganizationId || null,
  };
}

export function resolveActiveOrganizationContext(user: any, requestedOrganizationId?: string | null) {
  if (!user) throw new OrganizationContextError("AUTH_REQUIRED", "Authentication required.");
  const memberships = organizationMemberships(user);
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
    membership_status: selected.status || "active",
    organization_status: selected.organization_status || "active",
    entitlement_summary: selected.entitlement_summary || selected.entitlementSummary || null,
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
    membership_status: context.membership_status,
    organization_status: context.organization_status,
    entitlement_summary: context.entitlement_summary || user.entitlement_summary || user.entitlementSummary,
  };
}
