import { hasPermission, SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ArcadeRepo } from "../repo/arcade-repo.js";
import { ArcadeRuntimeSessionRepo } from "../repo/runtime-session-repo.js";
import { ARCADE_RUNTIME_FAMILIES, ARCADE_RUNTIME_SESSION_STATUSES, ARCADE_RUNTIME_SESSION_TYPES, type ArcadeRuntimeSessionAction, type ArcadeRuntimeSessionStatus } from "../model/runtime-session.js";

export class ArcadeRuntimeSessionError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = "ArcadeRuntimeSessionError";
  }
}

export interface ArcadeRuntimeActor {
  user_id: string;
  organization_id: string;
  roles: string[];
  permissions: string[];
}

const transitions: Record<ArcadeRuntimeSessionAction, { to: ArcadeRuntimeSessionStatus; from: ArcadeRuntimeSessionStatus[] }> = {
  PAUSE: { to: "PAUSED", from: ["ACTIVE"] },
  RESUME: { to: "ACTIVE", from: ["PAUSED"] },
  COMPLETE: { to: "COMPLETED", from: ["ACTIVE", "PAUSED"] },
  ABANDON: { to: "ABANDONED", from: ["ACTIVE", "PAUSED"] },
};

function actorScope(actor: ArcadeRuntimeActor) {
  if (!hasPermission(actor.permissions, SHS_SECURITY_PERMISSIONS.ARCADE_ATTEMPT)) {
    throw new ArcadeRuntimeSessionError("FORBIDDEN", "Missing arcade.attempt permission.", 403);
  }
  const organizationId = String(actor.organization_id || "").trim();
  const userId = String(actor.user_id || "").trim();
  if (!organizationId || !userId) throw new ArcadeRuntimeSessionError("SCOPE_MISSING", "Actor organization/user is required.", 403);
  return { organizationId, tenantId: `tenant:${organizationId}`, userId };
}

function boundedId(value: unknown, code: string): string {
  const normalized = String(value ?? "").trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(normalized)) {
    throw new ArcadeRuntimeSessionError(code, `${code} must be a 1-160 character identifier.`);
  }
  return normalized;
}

export class ArcadeRuntimeSessionService {
  constructor(
    private readonly sessions = new ArcadeRuntimeSessionRepo(),
    private readonly activities = new ArcadeRepo(),
  ) {}

  async start(actor: ArcadeRuntimeActor, body: any) {
    const scope = actorScope(actor);
    const family = String(body?.family || "").trim().toLowerCase();
    const sessionType = String(body?.sessionType || "").trim().toLowerCase();
    if (!ARCADE_RUNTIME_FAMILIES.includes(family as any)) throw new ArcadeRuntimeSessionError("RUNTIME_FAMILY_INVALID", "family must be learning or classic.");
    if (!ARCADE_RUNTIME_SESSION_TYPES.includes(sessionType as any)) throw new ArcadeRuntimeSessionError("RUNTIME_SESSION_TYPE_INVALID", "sessionType is not supported.");
    const experienceId = boundedId(body?.experienceId, "EXPERIENCE_ID_INVALID");
    const idempotencyKey = body?.idempotencyKey == null ? null : boundedId(body.idempotencyKey, "IDEMPOTENCY_KEY_INVALID");
    const activityId = body?.activityId == null || body.activityId === "" ? null : boundedId(body.activityId, "ACTIVITY_ID_INVALID");

    if (family === "classic" && activityId) {
      throw new ArcadeRuntimeSessionError("CLASSIC_ACTIVITY_BINDING_INVALID", "Classic sessions cannot bind to an Arcade Activity.");
    }
    if (activityId) {
      const activity = await this.activities.getActivityById(activityId);
      if (!activity || activity.status !== "active") throw new ArcadeRuntimeSessionError("ACTIVITY_NOT_FOUND", "Canonical Arcade Activity not found or inactive.", 404);
    }

    try {
      const started = await this.sessions.start({
        ...scope,
        experienceId,
        arcadeActivityId: activityId,
        family,
        sessionType,
        idempotencyKey,
      });
      const session = started.session;
      if (started.reused && (session.experienceId !== experienceId || session.arcadeActivityId !== activityId || session.family !== family || session.sessionType !== sessionType)) {
        throw new ArcadeRuntimeSessionError("IDEMPOTENCY_KEY_REUSED", "idempotencyKey was already used for a different runtime session.", 409);
      }
      return started;
    } catch (error) {
      if (error instanceof ArcadeRuntimeSessionError) throw error;
      if ((error as any)?.message === "RUNTIME_SESSION_START_CONFLICT") throw new ArcadeRuntimeSessionError("RUNTIME_SESSION_START_CONFLICT", "Runtime session start conflicted; retry with the same idempotency key.", 409);
      throw error;
    }
  }

  async get(actor: ArcadeRuntimeActor, id: string) {
    const scope = actorScope(actor);
    const session = await this.sessions.getForOwner(boundedId(id, "SESSION_ID_INVALID"), scope.organizationId, scope.tenantId, scope.userId);
    if (!session) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    return session;
  }

  async list(actor: ArcadeRuntimeActor, requestedStatus?: unknown) {
    const scope = actorScope(actor);
    let status: ArcadeRuntimeSessionStatus | undefined;
    if (requestedStatus != null && requestedStatus !== "") {
      const normalized = String(requestedStatus).trim().toUpperCase();
      if (!ARCADE_RUNTIME_SESSION_STATUSES.includes(normalized as ArcadeRuntimeSessionStatus)) {
        throw new ArcadeRuntimeSessionError("SESSION_STATUS_INVALID", "status is not a supported runtime session status.");
      }
      status = normalized as ArcadeRuntimeSessionStatus;
    }
    return this.sessions.listForOwner(scope.organizationId, scope.tenantId, scope.userId, status);
  }

  async transition(actor: ArcadeRuntimeActor, id: string, action: ArcadeRuntimeSessionAction) {
    const scope = actorScope(actor);
    const sessionId = boundedId(id, "SESSION_ID_INVALID");
    const transition = transitions[action];
    if (!transition) throw new ArcadeRuntimeSessionError("SESSION_ACTION_INVALID", "Runtime session action is not supported.");
    const current = await this.sessions.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    if (!current) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    if (current.status === transition.to) return { session: current, changed: false };
    if (!transition.from.includes(current.status)) throw new ArcadeRuntimeSessionError("SESSION_TRANSITION_INVALID", `Cannot ${action.toLowerCase()} a ${current.status.toLowerCase()} session.`, 409);
    const session = await this.sessions.transition({
      id: sessionId,
      ...scope,
      action,
      allowedStatuses: transition.from,
    });
    if (session) return { session, changed: true };
    const latest = await this.sessions.getForOwner(sessionId, scope.organizationId, scope.tenantId, scope.userId);
    if (!latest) throw new ArcadeRuntimeSessionError("SESSION_NOT_FOUND", "Runtime session not found.", 404);
    if (latest.status === transition.to) return { session: latest, changed: false };
    throw new ArcadeRuntimeSessionError("SESSION_TRANSITION_INVALID", "Runtime session changed before the requested transition.", 409);
  }
}
