// Phase 2A Secure Live Learning — HTTP routes.
// Dependency direction: route -> service -> provider adapter. This file
// never imports a provider directly.
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/live-learning-service.js";
import { SessionNotFoundError } from "../service/live-learning-service.js";
import { ProviderNotConfiguredError } from "../providers/live-learning-provider.js";
import { LIVE_LEARNING_PROVIDERS, toStudentFacing } from "../model/live-session.js";
import { LiveSessionRepo } from "../repo/live-session-repo.js";

const repo = new LiveSessionRepo();

function isStudentOnly(user: any): boolean {
  const roles: string[] = user?.roles || [];
  return roles.includes("student") && !roles.some((r) => ["instructor", "shf_admin", "shs_admin", "super_admin"].includes(r));
}

function validateCreateInput(body: any): string | null {
  if (!body || typeof body !== "object") return "Request body is required.";
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) return "title is required.";
  if (body.provider && !LIVE_LEARNING_PROVIDERS.includes(body.provider)) {
    return `provider must be one of: ${LIVE_LEARNING_PROVIDERS.join(", ")}`;
  }
  if (!body.startsAt || Number.isNaN(Date.parse(body.startsAt))) return "startsAt must be a valid ISO 8601 timestamp.";
  const duration = Number(body.durationMinutes);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 480) {
    return "durationMinutes must be a positive number (max 480).";
  }
  for (const idField of ["courseId", "moduleId", "lessonId", "cohortId"]) {
    if (body[idField] != null && typeof body[idField] !== "string") return `${idField} must be a string.`;
  }
  return null;
}

export function registerLiveLearningRoutes(app: any) {
  app.get("/live-learning/health", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_VIEW), async (_req: any, res: any) => {
    const providers = await service.getProviderHealth();
    res.json(ok({ providers }));
  });

  app.get("/live-learning/sessions", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_VIEW), async (req: any, res: any) => {
    const items = await service.listSessions({
      organizationId: req.user.organization_id,
      lessonId: req.query.lessonId,
      instructorId: req.query.instructorId,
    });
    const shaped = isStudentOnly(req.user) ? items.map(toStudentFacing) : items;
    res.json(ok({ items: shaped }));
  });

  app.get("/live-learning/sessions/:id", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_VIEW), async (req: any, res: any) => {
    try {
      const session = await service.getSession(req.params.id);
      res.json(ok(isStudentOnly(req.user) ? toStudentFacing(session) : session));
    } catch (err: any) {
      if (err instanceof SessionNotFoundError) return res.status(404).json(fail("NOT_FOUND", err.message));
      throw err;
    }
  });

  app.post("/live-learning/sessions", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_CREATE), async (req: any, res: any) => {
    const validationError = validateCreateInput(req.body);
    if (validationError) return res.status(400).json(fail("VALIDATION_ERROR", validationError));

    try {
      const created = await service.createSession(req.user, {
        provider: req.body.provider || "mock",
        title: req.body.title,
        description: req.body.description,
        courseId: req.body.courseId,
        moduleId: req.body.moduleId,
        lessonId: req.body.lessonId,
        cohortId: req.body.cohortId,
        startsAt: req.body.startsAt,
        durationMinutes: Number(req.body.durationMinutes),
        timezone: req.body.timezone,
      });
      res.status(201).json(ok(created));
    } catch (err: any) {
      if (err instanceof ProviderNotConfiguredError) {
        return res.status(503).json(fail("PROVIDER_NOT_CONFIGURED", err.message));
      }
      res.status(400).json(fail("CREATE_FAILED", err?.message || "Failed to create live session."));
    }
  });

  app.post("/live-learning/sessions/:id/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_CREATE), async (req: any, res: any) => {
    try {
      const session = await service.getSession(req.params.id);
      const roles: string[] = req.user.roles || [];
      const isOwner = session.instructorId === req.user.user_id;
      const isManager = roles.some((r) => ["shf_admin", "shs_admin", "super_admin"].includes(r)) ||
        (req.user.permissions || []).includes(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_MANAGE);
      if (!isOwner && !isManager) {
        return res.status(403).json(fail("FORBIDDEN", "Only the session's instructor or an admin may cancel it."));
      }
      const cancelled = await service.cancelSession(req.params.id, req.user);
      res.json(ok(cancelled));
    } catch (err: any) {
      if (err instanceof SessionNotFoundError) return res.status(404).json(fail("NOT_FOUND", err.message));
      res.status(400).json(fail("CANCEL_FAILED", err?.message || "Failed to cancel session."));
    }
  });

  // The single server-authorized join boundary. Always authorizes the
  // AUTHENTICATED caller for THEMSELVES — there is no request-body field
  // that can name a different user to authorize (that would let a
  // malicious client request access on someone else's behalf).
  app.post("/live-learning/sessions/:id/join", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_JOIN_REQUEST), async (req: any, res: any) => {
    try {
      const decision = await service.requestJoin(req.params.id, req.user);
      if (!decision.allowed) {
        return res.status(403).json(fail("JOIN_DENIED", decision.reason || "Join not authorized.", "corr_dev", { allowed: false }));
      }
      res.json(ok(decision));
    } catch (err: any) {
      if (err instanceof SessionNotFoundError) return res.status(404).json(fail("NOT_FOUND", err.message));
      res.status(500).json(fail("JOIN_ERROR", "Unable to process join request."));
    }
  });

  // Access/audit review — instructors/admins only.
  app.get("/live-learning/sessions/:id/join-events", requirePermission(SHS_SECURITY_PERMISSIONS.LIVE_LEARNING_JOIN_AUTHORIZE), async (req: any, res: any) => {
    const items = await repo.listJoinEventsForSession(req.params.id);
    res.json(ok({ items }));
  });
}
