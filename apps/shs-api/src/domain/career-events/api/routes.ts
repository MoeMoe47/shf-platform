import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/career-event-service.js";
import { CareerEventDomainError, CareerEventNotFoundError } from "../service/career-event-service.js";
import { isStudentOnly } from "../../shared/audience-eligibility.js";
import { toStudentFacingCareerEvent } from "../model/career-event.js";

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.organization_id, roles: req.user.roles || [] };
}

function sendDomainError(error: any, res: any, next: any) {
  if (error instanceof CareerEventDomainError) return res.status(error.statusCode).json(fail(error.code, error.message));
  if (error instanceof CareerEventNotFoundError) return res.status(404).json(fail("NOT_FOUND", error.message));
  return next(error);
}

export function registerCareerEventRoutes(app: any) {
  app.get("/career-events", requirePermission(SHS_SECURITY_PERMISSIONS.CAREER_EVENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const items = await service.listCareerEventsForActor(actor);
      const shaped = isStudentOnly(actor.roles) ? items.map(toStudentFacingCareerEvent) : items;
      return res.json(ok({ items: shaped }));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.get("/career-events/:id", requirePermission(SHS_SECURITY_PERMISSIONS.CAREER_EVENT_VIEW), async (req: any, res: any, next: any) => {
    try {
      const actor = actorFromRequest(req);
      const event = await service.getCareerEventForActor(req.params.id, actor);
      if (!event) return res.status(404).json(fail("NOT_FOUND", "Career event not found."));
      return res.json(ok(isStudentOnly(actor.roles) ? toStudentFacingCareerEvent(event) : event));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.post("/career-events", requirePermission(SHS_SECURITY_PERMISSIONS.CAREER_EVENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const created = await service.createCareerEvent(actorFromRequest(req), req.body || {});
      return res.status(201).json(ok(created));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });

  app.patch("/career-events/:id/status", requirePermission(SHS_SECURITY_PERMISSIONS.CAREER_EVENT_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const updated = await service.transitionCareerEventStatus(req.params.id, actorFromRequest(req), String(req.body?.status || ""));
      return res.json(ok(updated));
    } catch (error) {
      return sendDomainError(error, res, next);
    }
  });
}
