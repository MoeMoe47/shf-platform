export const HUB_ROLES = {
  CLIENT: "client",
  CLIENT_ADMIN: "client_admin",
  SHS_ADMIN: "shs_admin",
};

export const HUB_ROLE_LABELS = {
  client: "Client User",
  client_admin: "Client Admin",
  shs_admin: "SHS Admin",
};

export const HUB_ROLE_RANK = {
  client: 1,
  client_admin: 2,
  shs_admin: 3,
};

export const hubPageAccess = {
  "/hub": ["client", "client_admin", "shs_admin"],

  "/hub/imports": ["client", "client_admin", "shs_admin"],
  "/hub/network": ["client", "client_admin", "shs_admin"],
  "/hub/leadership": ["client", "client_admin", "shs_admin"],
  "/hub/action-queue": ["client", "client_admin", "shs_admin"],
  "/hub/referrals": ["client", "client_admin", "shs_admin"],
  "/hub/unmet-needs": ["client", "client_admin", "shs_admin"],

  "/imports": ["client", "client_admin", "shs_admin"],
  "/uploads": ["shs_admin"],
  "/verification-audit": ["shs_admin"],
  "/command": ["shs_admin"],
  "/command-center": ["shs_admin"],
  "/dashboard": ["shs_admin"],
  "/loo": ["shs_admin"],
  "/watchtower": ["shs_admin"],
  "/lord-outcomes": ["shs_admin"],

  "/app-registry": ["shs_admin"],
  "/registry": ["shs_admin"],
  "/builder": ["shs_admin"],
  "/web-maker": ["shs_admin"],
  "/studio/templates": ["shs_admin"],
  "/builder/tools": ["shs_admin"],
  "/tools": ["shs_admin"],
  "/tool-dashboard": ["shs_admin"],
  "/master-narrative": ["shs_admin"],
  "/grant-binder": ["shs_admin"],
  "/alignment": ["shs_admin"],
  "/analytics": ["shs_admin"],
  "/dev/docs": ["shs_admin"],

  "/solutions": ["client_admin", "shs_admin"],
  "/solutions/infrastructure": ["client_admin", "shs_admin"],

  "/hub/intake": ["client", "client_admin", "shs_admin"],
  "/hub/queue": ["client", "client_admin", "shs_admin"],
  "/hub/lifecycle": ["client", "client_admin", "shs_admin"],
  "/hub/reports": ["client", "client_admin", "shs_admin"],
  "/hub/calendar": ["client", "client_admin", "shs_admin"],
  "/hub/conference": ["client", "client_admin", "shs_admin"],
  "/hub/journal": ["client", "client_admin", "shs_admin"],

  "/reporting": ["client_admin", "shs_admin"],
  "/reports": ["client_admin", "shs_admin"],
  "/growth": ["client_admin", "shs_admin"],
  "/hub/growth-network": ["client_admin", "shs_admin"],
  "/hub/intelligence": ["client_admin", "shs_admin"],
  "/hub/bundles": ["client_admin", "shs_admin"],
  "/hub/opportunities": ["client_admin", "shs_admin"],
  "/hub/sales-pipeline": ["client_admin", "shs_admin"],

  "/oracle": ["shs_admin"],
  "/verification": ["shs_admin"],
  "/truth-spine": ["shs_admin"],
  "/ai-guardrails": ["shs_admin"],
  "/game-theory": ["shs_admin"],
  "/agent-fabric": ["shs_admin"],
  "/aggregation": ["shs_admin"],
  "/audit": ["shs_admin"],
  "/settings": ["shs_admin"],
  "/identity": ["shs_admin"],
  "/adaptive-experience": ["shs_admin"],

  // Internal Production Ops stays SHS-admin only. Development identity overrides
  // happen in identityRouting.js and must not widen these route permissions.
  "/ops/production": ["shs_admin"],
  "/ops/projects": ["shs_admin"],
  "/ops/brand-profile": ["shs_admin"],
  "/ops/page-intent": ["shs_admin"],
  "/ops/layout-blueprint": ["shs_admin"],
  "/ops/visual-treatment": ["shs_admin"],
  "/ops/assets": ["shs_admin"],
  "/ops/data-binding": ["shs_admin"],
  "/ops/mock-review": ["shs_admin"],
  "/ops/build-packet": ["shs_admin"],
  "/ops/screenshot-qa": ["shs_admin"],
  "/ops/launch-workflow": ["shs_admin"],
  "/ops/learning": ["shs_admin"],
};

export function normalizeHubRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (value === "client_admin" || value === "client-admin" || value === "admin_client") {
    return HUB_ROLES.CLIENT_ADMIN;
  }

  if (
    value === "shs_admin" ||
    value === "shs-admin" ||
    value === "super_admin" ||
    value === "super-admin" ||
    value === "system_admin"
  ) {
    return HUB_ROLES.SHS_ADMIN;
  }

  return HUB_ROLES.CLIENT;
}

export function canAccessHubRoute(role, route) {
  const normalizedRole = normalizeHubRole(role);
  const allowedRoles = hubPageAccess[route] || [];
  return allowedRoles.includes(normalizedRole);
}

export function canAccessRoleTier(role, requiredTier = "client") {
  const normalizedRole = normalizeHubRole(role);
  const normalizedRequired = normalizeHubRole(requiredTier);

  return (HUB_ROLE_RANK[normalizedRole] || 1) >= (HUB_ROLE_RANK[normalizedRequired] || 1);
}

export function filterHubGoalsByRole(goals, role) {
  const normalizedRole = normalizeHubRole(role);

  return goals.filter((goal) => {
    if (!goal?.route) return false;

    const routeAllowed = canAccessHubRoute(normalizedRole, goal.route);
    const tierAllowed = canAccessRoleTier(normalizedRole, goal.roleTier || "client");

    return routeAllowed && tierAllowed;
  });
}

export function getHubRoleLabel(role) {
  const normalizedRole = normalizeHubRole(role);
  return HUB_ROLE_LABELS[normalizedRole] || HUB_ROLE_LABELS.client;
}
