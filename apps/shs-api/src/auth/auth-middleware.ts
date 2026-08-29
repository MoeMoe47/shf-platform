import { IdentityRepo } from "../domain/identity/repo/identity-repo.js";
import { parseDevToken } from "./current-user.js";
import { mergeRolePermissions } from "./security-permissions.js";
import { isProductionEnvironment } from "./production-identity.js";
import { Auth0SessionService } from "../domain/identity/service/auth0-session-service.js";
import { applyActiveOrganizationContext, getRequestedOrganizationId, OrganizationContextError } from "./organization-context.js";
import { tenantIdForOrganization } from "./tenant-context.js";

const repo = new IdentityRepo();
const productionSessions = isProductionEnvironment() ? new Auth0SessionService() : null;

function readSessionCookie(header?: string): string | null {
  try {
    const value = String(header || "").split(";").map((item) => item.trim()).find((item) => item.startsWith("shs_session="));
    return value ? decodeURIComponent(value.slice("shs_session=".length)) : null;
  } catch {
    return null;
  }
}

function isLocalDevAuthEnabled() {
  const environment = String(process.env.SHS_AUTH_ENV || process.env.NODE_ENV || "development")
    .trim()
    .toLowerCase();
  const configured = String(process.env.AUTH_DEMO_IDENTITY_ENABLED || "1").trim().toLowerCase();
  return environment === "development" && !["0", "false", "no", "off"].includes(configured);
}

function buildLocalDevUser() {
  return {
    id: "demo-user-1",
    user_id: "demo-user-1",
    email: "admin@shs.local",
    first_name: "SHS",
    last_name: "Admin",
    full_name: "SHS Admin",
    role: "super_admin",
    role_name: "super_admin",
    roles: ["super_admin"],
    organization_id: "shs-core",
    active_organization_id: "shs-core",
    tenant_id: tenantIdForOrganization("shs-core"),
    organization_type: "SHS",
    memberships: [{
      membership_id: "local-dev-super-admin",
      organization_id: "shs-core",
      tenant_id: tenantIdForOrganization("shs-core"),
      role: "super_admin",
      role_scope_type: "platform",
      status: "active",
      organization_status: "active",
      permissions: mergeRolePermissions(["super_admin"]),
    }],
  };
}

function getUserRoles(user: any): string[] {
  if (Array.isArray(user?.roles)) {
    return user.roles.filter(Boolean);
  }

  return [user?.role, user?.role_name, user?.role_id].filter(Boolean);
}

export async function authMiddleware(req: any, _res: any, next: any) {
  const authHeader = req.headers?.authorization;
  if (productionSessions) {
    const sessionToken = readSessionCookie(req.headers?.cookie);
    try {
      req.user = sessionToken ? await productionSessions.getUserForSession(sessionToken, getRequestedOrganizationId(req)) : null;
    } catch (error: any) {
      if (error instanceof OrganizationContextError) {
        req.user = { org_context_error: error.code, permissions: [], roles: [] };
      } else {
        throw error;
      }
    }
    return next();
  }
  // dev-token is a development-only credential format and is never used by
  // the production session path.
  const userId = isProductionEnvironment() ? null : parseDevToken(authHeader);

  if (!userId) {
    req.user = isLocalDevAuthEnabled()
      ? applyActiveOrganizationContext(buildLocalDevUser(), getRequestedOrganizationId(req))
      : null;
    return next();
  }

  const user = await repo.getUserById(userId);

  if (!user) {
    req.user = null;
    return next();
  }

  const roles = getUserRoles(user);
  const permissions =
    Array.isArray(user.permissions) && user.permissions.length
      ? user.permissions
      : mergeRolePermissions(roles);

  try {
    req.user = applyActiveOrganizationContext({
      ...user,
      roles,
      permissions,
    }, getRequestedOrganizationId(req));
  } catch (error: any) {
    if (error instanceof OrganizationContextError) {
      req.user = { ...user, org_context_error: error.code, permissions: [], roles: [] };
    } else {
      throw error;
    }
  }

  return next();
}
