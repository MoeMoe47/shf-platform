export const CROSS_APP_IDENTITY_BRIDGE_VERSION = "v1";

export const identityAuthority = {
  app: "shrv1",
  layer: "Identity & Access",
  role: "identity_authority",
};

export const consumerApp = {
  app: "shf-next",
  role: "identity_boundary_consumer",
};

export const SHF_NEXT_ROUTE_CLASSES = Object.freeze({
  PUBLIC: "PUBLIC",
  INTERNAL_OPS: "INTERNAL_OPS",
  INTERNAL_CLIENTOPS: "INTERNAL_CLIENTOPS",
  INTERNAL_STUDIO_ADMIN: "INTERNAL_STUDIO_ADMIN",
  FOUNDATION_ADMIN: "FOUNDATION_ADMIN",
  PUBLIC_FOUNDATION: "PUBLIC_FOUNDATION",
  OWNER_DECISION_REQUIRED: "OWNER_DECISION_REQUIRED",
});

export const ALLOWED_ROLE_FAMILIES = Object.freeze([
  "shs_admin",
  "shs_ops",
  "shs_clientops",
  "shs_sales",
  "shs_qa",
  "shs_studio_admin",
  "shf_admin",
  "shf_reviewer",
  "public",
]);

export const bridgeDataContract = Object.freeze({
  version: "v1",
  authority: "shrv1",
  consumer: "shf-next",
  subjectId: "string",
  displayName: "string",
  email: "string",
  roleFamily: "allowed role family",
  roles: ["allowed role family"],
  organization: "string",
  issuedAt: "ISO-8601 string",
  expiresAt: "ISO-8601 string optional for local dev",
  environment: "local-dev",
  source: "shrv1 identity session or future signed/session bridge",
});

export const shfNextRouteOwnership = Object.freeze([
  {
    pattern: "/ops/clientops",
    routeClass: SHF_NEXT_ROUTE_CLASSES.INTERNAL_CLIENTOPS,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shs_clientops"],
  },
  {
    pattern: "/ops/sales",
    routeClass: SHF_NEXT_ROUTE_CLASSES.INTERNAL_OPS,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shs_sales", "shs_ops"],
  },
  {
    pattern: "/ops/qa",
    routeClass: SHF_NEXT_ROUTE_CLASSES.INTERNAL_OPS,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shs_qa", "shs_ops"],
  },
  {
    pattern: "/ops",
    routeClass: SHF_NEXT_ROUTE_CLASSES.INTERNAL_OPS,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shs_ops"],
  },
  {
    pattern: "/foundation/data-approval",
    routeClass: SHF_NEXT_ROUTE_CLASSES.FOUNDATION_ADMIN,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shf_admin", "shf_reviewer"],
  },
  {
    pattern: "/foundation/impact-report",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC_FOUNDATION,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
  {
    pattern: "/foundation/report",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC_FOUNDATION,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
  {
    pattern: "/foundation",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC_FOUNDATION,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
  {
    pattern: "/studio/templates",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
  {
    pattern: "/studio",
    routeClass: SHF_NEXT_ROUTE_CLASSES.INTERNAL_STUDIO_ADMIN,
    owner: "shf-next",
    requiredRoles: ["shs_admin", "shs_studio_admin"],
  },
  {
    pattern: "/solutions",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
  {
    pattern: "/",
    routeClass: SHF_NEXT_ROUTE_CLASSES.PUBLIC,
    owner: "shf-next",
    requiredRoles: ["public"],
  },
]);

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").trim();
  return value.startsWith("/") ? value : `/${value}`;
}

export function getShfNextRouteClass(pathname = "/") {
  const path = normalizePathname(pathname);
  const match = shfNextRouteOwnership.find((entry) =>
    entry.pattern === "/" ? path === "/" : path.startsWith(entry.pattern)
  );
  return match?.routeClass || SHF_NEXT_ROUTE_CLASSES.OWNER_DECISION_REQUIRED;
}

export function getRequiredRolesForShfNextRoute(pathname = "/") {
  const path = normalizePathname(pathname);
  const match = shfNextRouteOwnership.find((entry) =>
    entry.pattern === "/" ? path === "/" : path.startsWith(entry.pattern)
  );
  return match?.requiredRoles || ["shs_admin"];
}

export function isShfNextRoutePublic(pathname = "/") {
  return getRequiredRolesForShfNextRoute(pathname).includes("public");
}
