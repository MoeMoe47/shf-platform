export function normalizeIdentityResponse(data = {}) {
  const user = data.user || {
    id: data.user_id,
    email: data.email,
    name: data.display_name,
    role: data.role,
  };
  return {
    authenticated: Boolean(data.authenticated && data.session_status === "active"),
    user: user?.id ? user : null,
    role: data.role || user?.role || "",
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    memberships: Array.isArray(data.memberships) ? data.memberships : [],
    authorizedOrganizations: Array.isArray(data.authorized_organizations) ? data.authorized_organizations : [],
    preferredOrganizationId: data.preferred_organization_id || "",
    activeOrganizationContext: data.active_organization_context || null,
    roleContext: data.role_context || null,
    permissionContext: data.permission_context || null,
    entitlementSummary: data.entitlement_summary || null,
    organizationContextResolution: data.organization_context_resolution || null,
    routeValidityContract: data.route_validity_contract || null,
    safeLanding: data.safe_landing || null,
    sessionStatus: data.session_status || "invalid",
    csrfToken: data.csrf_token || "",
    expiresAt: data.expires_at || "",
    reauthRequired: Boolean(data.reauth_required),
    environment: data.environment || "",
  };
}

export function emptyAuthState(status = "invalid") {
  return {
    authenticated: false,
    user: null,
    role: "",
    permissions: [],
    memberships: [],
    authorizedOrganizations: [],
    preferredOrganizationId: "",
    activeOrganizationContext: null,
    roleContext: null,
    permissionContext: null,
    entitlementSummary: null,
    organizationContextResolution: null,
    routeValidityContract: null,
    safeLanding: null,
    sessionStatus: status,
    csrfToken: "",
    expiresAt: "",
    reauthRequired: false,
    environment: "",
  };
}
