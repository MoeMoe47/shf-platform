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
    sessionStatus: status,
    csrfToken: "",
    expiresAt: "",
    reauthRequired: false,
    environment: "",
  };
}

