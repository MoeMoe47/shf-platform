import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ArcadeRepo } from "../repo/arcade-repo.js";
import { ArcadeLeaderboardRepo } from "../repo/leaderboard-repo.js";

const arcadeRepo = new ArcadeRepo();
const leaderboardRepo = new ArcadeLeaderboardRepo();

export class ArcadeLeaderboardError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "ArcadeLeaderboardError";
  }
}

export interface ArcadeLeaderboardActor {
  user_id: string;
  organization_id: string;
  permissions: string[];
}

export async function getActivityLeaderboard(
  actor: ArcadeLeaderboardActor,
  activityId: string,
  requestedLimit = 50,
  requestedOffset = 0,
) {
  const organizationId = String(actor.organization_id || "").trim();
  if (!organizationId || !actor.user_id) {
    throw new ArcadeLeaderboardError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  }
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_RESULTS_VIEW)) {
    throw new ArcadeLeaderboardError("FORBIDDEN", "Missing arcade.results.view permission.", 403);
  }
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.trunc(requestedLimit))) : 50;
  const offset = Number.isFinite(requestedOffset) ? Math.max(0, Math.trunc(requestedOffset)) : 0;
  const activity = await arcadeRepo.getActivityById(activityId);
  if (!activity) throw new ArcadeLeaderboardError("ACTIVITY_NOT_FOUND", "Arcade Activity not found.", 404);

  const page = await leaderboardRepo.listForActivity(organizationId, activity.id, limit, offset);
  return {
    activity: { id: activity.id, title: activity.title },
    ...page,
    limit,
    offset,
  };
}
