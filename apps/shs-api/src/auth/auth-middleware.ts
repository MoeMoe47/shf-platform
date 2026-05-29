import { IdentityRepo } from "../domain/identity/repo/identity-repo";
import { parseDevToken } from "./current-user";
import { mergeRolePermissions } from "./security-permissions";

const repo = new IdentityRepo();

function isLocalDevAuthEnabled() {
  return process.env.NODE_ENV !== "production";
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
    organization_type: "SHS",
    permissions: mergeRolePermissions(["super_admin"]),
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
  const userId = parseDevToken(authHeader);

  if (!userId) {
    req.user = isLocalDevAuthEnabled() ? buildLocalDevUser() : null;
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

  req.user = {
    ...user,
    roles,
    permissions,
  };

  return next();
}
