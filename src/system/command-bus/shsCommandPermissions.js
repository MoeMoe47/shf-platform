const SHS_COMMAND_TYPE_PERMISSIONS = Object.freeze({
  system: ["shs_admin"],
  workflow: ["shs_admin"],
  tracking: ["shs_admin"],
  persistence: ["shs_admin"],
  registry: ["shs_admin"],
  governance: ["shs_admin"],
  reports: ["shs_admin"],
  agent: ["shs_admin"],
  client_ops: ["shs_admin"],
  website_studio: ["shs_admin"],
  production: ["shs_admin"],
  sales: ["shs_admin"],
  direct_connect: ["shs_admin"],
  qa: ["shs_admin"],
  scheduler: ["shs_admin"],
  notifications: ["shs_admin"],
  analytics: ["shs_admin"],
  identity: ["shs_admin"],
  security: ["shs_admin"],
});

export function checkCommandPermissions(command = {}) {
  const allowed = SHS_COMMAND_TYPE_PERMISSIONS[command.command_type] || ["shs_admin"];
  const granted = allowed.includes(command.requested_by);
  return {
    granted,
    allowed_roles: allowed,
    permission_status: granted ? "allowed" : "blocked",
    reason: granted ? "shs_admin command bus permission granted" : "client_admin/public blocked from command bus",
  };
}
