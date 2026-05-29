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
    role: "super_admin",
    role_name: "super_admin",
    organization_id: "shs-core",
    organization_type: "SHS",
    permissions: mergeRolePermissions(["super_admin"]),
  };
}

export async function authMiddleware(req: any, _res: any, next: any) {
  const authHeader = req.headers?.authorization;
  const userId = parseDevToken(authHeader);

  if (!userId) {
    req.user = isLocalDevAuthEnabled() ? buildLocalDevUser() : null;
    return next();
  }

  const user = await repo.getUserById(userId);

  req.user = user
    ? {
        ...user,
        permissions:
          user.permissions ||
          mergeRolePermissions([
            user.role,
            user.role_name,
            user.role_id,
          ].filter(Boolean)),
      }
    : null;

  return next();
}
