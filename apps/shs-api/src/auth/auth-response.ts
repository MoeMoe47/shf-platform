import { mergeRolePermissions } from "./security-permissions.js";

function compactString(value: unknown) {
  const normalized = String(value || "").trim();
  return normalized || undefined;
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
    permissions: Array.isArray(membership?.permissions) ? membership.permissions : [],
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
    roles: Array.isArray(user?.organization_scoped_roles) ? user.organization_scoped_roles : (Array.isArray(user?.roles) ? user.roles : []),
    permissions: Array.isArray(user?.organization_scoped_permissions) ? user.organization_scoped_permissions : (Array.isArray(user?.permissions) ? user.permissions : []),
  };
}

export function authResponsePayload(user: any) {
  const memberships = Array.isArray(user?.memberships)
    ? user.memberships.map(safeMembership)
    : (user?.active_organization_id || user?.organization_id ? [safeMembership({
      organization_id: user.active_organization_id || user.organization_id,
      role: user.role,
      role_name: user.role_name || user.role,
      permissions: user.organization_scoped_permissions || user.permissions || [],
    })] : []);
  const permissions = user?.organization_scoped_permissions ||
    user?.permissions ||
    mergeRolePermissions(user?.roles || [user?.role]);

  return {
    ok: true,
    authenticated: true,
    session_status: "active",
    user: safeAuthUser(user),
    memberships,
    active_organization_context: user?.active_organization_id ? {
      organization_id: user.active_organization_id,
      membership_id: user.membership_id || null,
      roles: user.organization_scoped_roles || user.roles || [],
      permissions,
    } : null,
    permissions,
  };
}
