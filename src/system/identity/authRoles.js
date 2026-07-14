export const BOS_AUTH_ROLES = Object.freeze({
  SHS_ADMIN: "shs_admin",
  CLIENT_ADMIN: "client_admin",
  CLIENT: "client",
});

export function normalizeAuthRole(role) {
  const value = String(role || "").trim().toLowerCase();
  if (["shs_admin", "shs-admin", "super_admin", "system_admin"].includes(value)) {
    return BOS_AUTH_ROLES.SHS_ADMIN;
  }
  if (["client_admin", "client-admin", "admin_client"].includes(value)) {
    return BOS_AUTH_ROLES.CLIENT_ADMIN;
  }
  return BOS_AUTH_ROLES.CLIENT;
}

