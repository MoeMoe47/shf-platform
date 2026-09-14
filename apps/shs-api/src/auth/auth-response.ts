import { mergeRolePermissions } from "./security-permissions.js";
import { routeValidityContract } from "./organization-context.js";

const IOH_CONTEXT_CONTRACT_VERSION = "ioh-2.context.v1";

function compactString(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
}

function compactStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => compactString(item)).filter(Boolean))) as string[];
}

function safeMembership(membership: any) {
  return {
    membership_id: compactString(membership?.membership_id) || null,
    organization_id: compactString(membership?.organization_id),
    role_id: compactString(membership?.role_id),
    role: compactString(membership?.role),
    role_name: compactString(membership?.role_name || membership?.role),
    role_scope_type: compactString(membership?.role_scope_type),
    status: compactString(membership?.status),
    organization_status: compactString(membership?.organization_status),
    permissions: compactStringArray(membership?.permissions),
  };
}

export function safeAuthUser(user: any) {
  return {
    user_id: compactString(user?.user_id || user?.id),
    id: compactString(user?.id || user?.user_id),
    email: compactString(user?.email),
    full_name: compactString(user?.full_name),
    first_name: compactString(user?.first_name),
    last_name: compactString(user?.last_name),
    status: compactString(user?.status),
    organization_id: compactString(user?.active_organization_id || user?.organization_id),
    role: compactString(user?.role),
    role_name: compactString(user?.role_name || user?.role),
    roles: compactStringArray(Array.isArray(user?.organization_scoped_roles) ? user.organization_scoped_roles : user?.roles),
    permissions: compactStringArray(Array.isArray(user?.organization_scoped_permissions) ? user.organization_scoped_permissions : user?.permissions),
  };
}

function fallbackMembership(user: any) {
  if (!user?.active_organization_id && !user?.organization_id) return null;
  return safeMembership({
    membership_id: user.membership_id,
    organization_id: user.active_organization_id || user.organization_id,
    role_id: user.role_id,
    role: user.role,
    role_name: user.role_name || user.role,
    role_scope_type: user.role_scope_type,
    status: user.membership_status || "active",
    organization_status: user.organization_status || "active",
    permissions: user.organization_scoped_permissions || user.permissions || [],
  });
}

function resolveMemberships(user: any) {
  const memberships = Array.isArray(user?.memberships)
    ? user.memberships.map(safeMembership)
    : [];
  if (memberships.length) return memberships;
  const fallback = fallbackMembership(user);
  return fallback ? [fallback] : [];
}

function selectedMembership(user: any, memberships: ReturnType<typeof resolveMemberships>) {
  const activeOrganizationId = compactString(user?.active_organization_id || user?.organization_id);
  if (!activeOrganizationId) return null;
  return memberships.find((membership) => membership.organization_id === activeOrganizationId) || fallbackMembership(user);
}

function isAuthorizedOrganizationMembership(membership: ReturnType<typeof safeMembership>) {
  const membershipStatus = String(membership.status || "active").toLowerCase();
  const organizationStatus = String(membership.organization_status || "active").toLowerCase();
  return membershipStatus === "active" && organizationStatus === "active";
}

function entitlementSummary(user: any, activeMembership: any) {
  const supplied = user?.entitlement_summary ||
    user?.entitlementSummary ||
    activeMembership?.entitlement_summary ||
    activeMembership?.entitlementSummary;
  const items = compactEntitlementItems(supplied?.items || supplied || user?.entitlements);
  return {
    authority: "service_catalog_projection",
    source: "organization_service_entitlements",
    status: supplied?.status || (items.length ? "loaded" : "not_loaded"),
    items,
  };
}

function compactEntitlementItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item: any) => ({
    service_key: compactString(item?.service_key || item?.serviceKey),
    service_name: compactString(item?.service_name || item?.serviceName || item?.name),
    status: compactString(item?.status),
    effective_until: compactString(item?.effective_until || item?.effectiveUntil),
  })).filter((item) => item.service_key);
}

function relationshipReferenceBoundary(user: any) {
  const refs = compactStringArray(user?.relationship_reference_ids || user?.relationshipReferenceIds);
  return {
    authority: "organization_relationships_projection",
    source: "organization_relationships",
    scope: "minimal_reference_boundary",
    relationship_ids: refs,
    relationships_imply_membership: false,
    relationships_imply_entitlement: false,
  };
}

function sessionAuthorityContext(user: any) {
  return {
    authority: "identity_gateway_projection",
    status: compactString(user?.session_status) || "active",
    provider: compactString(user?.identity_provider || user?.provider),
    external_subject_present: Boolean(user?.provider_subject || user?.external_subject),
    expires_at: compactString(user?.session_expires_at || user?.expires_at) || null,
    revoked_at: compactString(user?.session_revoked_at || user?.revoked_at) || null,
  };
}

function organizationResolution(user: any, activeOrganizationId?: string) {
  const supplied = user?.organization_context_resolution || user?.organizationContextResolution;
  if (supplied) return supplied;
  if (activeOrganizationId) {
    return {
      ok: true,
      selected_organization_id: activeOrganizationId,
      selection_source: "resolved",
      error_code: null,
      safe_landing_reason: "OK",
      ignored_preferred_organization_id: null,
      invalidation: {
        organization_changed: false,
        clear_org_scoped_state: false,
        clear_role_context: false,
        clear_permission_context: false,
        clear_entitlement_context: false,
        previous_organization_id: null,
        next_organization_id: activeOrganizationId,
      },
      route_validity_contract: routeValidityContract({ active_organization_id: activeOrganizationId }),
    };
  }
  const code = user?.org_context_error || "ORG_CONTEXT_UNAVAILABLE";
  return {
    ok: false,
    selected_organization_id: null,
    selection_source: "none",
    error_code: code,
    safe_landing_reason: code === "ORG_CONTEXT_REQUIRED" ? "NO_ORG_SELECTED" : "NO_ORG",
    ignored_preferred_organization_id: null,
    invalidation: {
      organization_changed: true,
      clear_org_scoped_state: true,
      clear_role_context: true,
      clear_permission_context: true,
      clear_entitlement_context: true,
      previous_organization_id: null,
      next_organization_id: null,
    },
    route_validity_contract: routeValidityContract(null),
  };
}

export function authResponsePayload(user: any) {
  const memberships = resolveMemberships(user);
  const permissions = user?.organization_scoped_permissions ||
    user?.permissions ||
    mergeRolePermissions(user?.organization_scoped_roles || user?.roles || [user?.role]);
  const safePermissions = compactStringArray(permissions);
  const activeMembership = selectedMembership(user, memberships);
  const roles = compactStringArray(user?.organization_scoped_roles || user?.roles || [user?.role, user?.role_name]);
  const activeOrganizationId = compactString(user?.active_organization_id);
  const roleContext = {
    authority: "membership_role_projection",
    source: "organization_memberships_roles",
    organization_id: activeOrganizationId || null,
    roles,
    primary_role: roles[0] || null,
    role_scope_type: compactString(activeMembership?.role_scope_type || user?.role_scope_type) || null,
  };
  const permissionContext = {
    authority: "backend_permission_projection",
    source: "role_permission_registry",
    organization_id: activeOrganizationId || null,
    permissions: safePermissions,
  };
  const entitlementContext = entitlementSummary(user, activeMembership);
  const relationshipBoundary = relationshipReferenceBoundary(user);
  const resolution = organizationResolution(user, activeOrganizationId);
  const activeOrganizationContext = activeOrganizationId ? {
    organization_id: activeOrganizationId,
    membership_id: user.membership_id || activeMembership?.membership_id || null,
    membership_status: activeMembership?.status || compactString(user?.membership_status) || null,
    organization_status: activeMembership?.organization_status || compactString(user?.organization_status) || null,
    roles,
    permissions: safePermissions,
    role_context: roleContext,
    permission_context: permissionContext,
    entitlement_summary: entitlementContext,
    relationship_reference_boundary: relationshipBoundary,
    route_validity_contract: resolution.route_validity_contract,
  } : null;

  return {
    ok: true,
    authenticated: true,
    session_status: "active",
    context_contract_version: IOH_CONTEXT_CONTRACT_VERSION,
    context_authority: "backend_derived_projection",
    user: safeAuthUser(user),
    memberships,
    authorized_organizations: memberships.filter(isAuthorizedOrganizationMembership).map((membership) => ({
      organization_id: membership.organization_id,
      membership_id: membership.membership_id,
      membership_status: membership.status || null,
      organization_status: membership.organization_status || null,
      role: membership.role || membership.role_name || null,
      role_name: membership.role_name || membership.role || null,
      role_scope_type: membership.role_scope_type || null,
    })),
    preferred_organization_id: compactString(user?.preferred_organization_id || user?.preferredOrganizationId) || activeOrganizationId || null,
    active_organization_context: activeOrganizationContext,
    role_context: roleContext,
    permission_context: permissionContext,
    entitlement_summary: entitlementContext,
    relationship_reference_boundary: relationshipBoundary,
    session_authority_context: sessionAuthorityContext(user),
    organization_context_resolution: resolution,
    route_validity_contract: resolution.route_validity_contract,
    safe_landing: {
      reason: resolution.safe_landing_reason,
      active_organization_id: activeOrganizationId || null,
      experience_layer_decides_destination: true,
    },
    permissions: safePermissions,
  };
}
