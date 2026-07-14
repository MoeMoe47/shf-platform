import { BOS_AUTH_PERMISSIONS } from "@/system/identity/authPermissions";

export const AUTH_ROUTE_POLICY = Object.freeze({
  "/ops/identity-access": {
    role: "shs_admin",
    permission: BOS_AUTH_PERMISSIONS.IDENTITY_READ,
  },
  "/ops/executive-command": {
    role: "shs_admin",
    permission: BOS_AUTH_PERMISSIONS.EXECUTIVE_READ,
  },
  "/ops/orchestrator": {
    role: "shs_admin",
    permission: BOS_AUTH_PERMISSIONS.ORCHESTRATOR_READ,
  },
  "/ops/command-bus": {
    role: "shs_admin",
    permission: BOS_AUTH_PERMISSIONS.COMMAND_PREVIEW,
  },
  "/ops/persistence": {
    role: "shs_admin",
    permission: BOS_AUTH_PERMISSIONS.PERSISTENCE_READ,
  },
});

export function getRoutePolicy(route) {
  return AUTH_ROUTE_POLICY[route] || null;
}

