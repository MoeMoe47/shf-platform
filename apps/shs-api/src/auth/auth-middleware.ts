import { IdentityRepo } from "../domain/identity/repo/identity-repo";
import { parseDevToken } from "./current-user";

const repo = new IdentityRepo();

export async function authMiddleware(req: any, _res: any, next: any) {
  const authHeader = req.headers?.authorization;
  const userId = parseDevToken(authHeader);

  if (!userId) {
    req.user = null;
    return next();
  }

  req.user = await repo.getUserById(userId);
  return next();
}
