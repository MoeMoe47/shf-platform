import { ProgramService } from "../service/program-service.js";
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import * as careerPathwayService from "../../career-pathways/service/career-pathway-service.js";
import { CareerPathwayError } from "../../career-pathways/service/career-pathway-service.js";

const service = new ProgramService();

function actorFromRequest(req: any) {
  return { user_id: req.user.user_id, organization_id: req.user.active_organization_id || req.user.organization_id, roles: req.user.roles || [] };
}

function sendPathwayError(error: any, res: any, next: any) {
  if (error instanceof CareerPathwayError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerProgramRoutes(app: any) {
  app.get("/programs", requirePermission("program.read"), async (req: any, res: any) => {
    const items = await service.listPrograms(req.user);
    res.json(ok({ items }));
  });

  app.get("/programs/taxonomy", async (_req: any, res: any) => {
    const items = await service.listTaxonomy();
    res.json(ok({ items }));
  });

  app.get("/programs/:id", requirePermission("program.read"), async (req: any, res: any) => {
    const item = await service.getProgram(req.params.id, req.user);
    if (!item) return res.status(404).json(fail("NOT_FOUND", "Program not found"));
    const actor = actorFromRequest(req);
    const careers = await careerPathwayService.listCareersForProgram(actor.organization_id, req.params.id);
    res.json(ok({ ...item, careers }));
  });

  // Program <-> Career pathway mapping (SHF Ecosystem Phase 5). Admin/
  // program-manager only (program.update) — students/instructors never
  // rewrite institutional pathway mappings.
  app.get("/programs/:id/careers", requirePermission("program.read"), async (req: any, res: any) => {
    const actor = actorFromRequest(req);
    const careers = await careerPathwayService.listCareersForProgram(actor.organization_id, req.params.id);
    res.json(ok({ items: careers }));
  });

  app.post("/programs/:id/careers", requirePermission("program.update"), async (req: any, res: any, next: any) => {
    try {
      const created = await careerPathwayService.linkProgramCareer(
        actorFromRequest(req),
        req.params.id,
        String(req.body?.careerId || ""),
        !!req.body?.isPrimary,
      );
      res.status(201).json(ok(created));
    } catch (error) {
      sendPathwayError(error, res, next);
    }
  });

  app.delete("/programs/:id/careers/:careerId", requirePermission("program.update"), async (req: any, res: any, next: any) => {
    try {
      const result = await careerPathwayService.unlinkProgramCareer(actorFromRequest(req), req.params.id, req.params.careerId);
      res.json(ok(result));
    } catch (error) {
      sendPathwayError(error, res, next);
    }
  });

  app.post("/programs", requirePermission("program.create"), async (req: any, res: any) => {
    try {
      const created = await service.createProgram(req.body || {}, req.user);
      res.json(ok(created));
    } catch (err: any) {
      res.status(400).json(fail("VALIDATION_ERROR", err.message));
    }
  });

  app.post("/programs/:id/transition", requirePermission("program.transition"), async (req: any, res: any) => {
    try {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, "current_status")) {
        return res.status(400).json(fail("INVALID_TRANSITION", "current_status is server-authoritative"));
      }
      const nextStatus = req.body?.next_status;
      const result = await service.transitionProgram(
        req.params.id,
        nextStatus,
        req.user,
        req.body?.reason_text
      );
      res.json(ok(result));
    } catch (err: any) {
      res.status(err.statusCode || 400).json(fail(err.statusCode === 409 ? "CONFLICT" : "INVALID_TRANSITION", err.message));
    }
  });

  app.patch("/programs/:id/status", requirePermission("program.transition"), async (req: any, res: any) => {
    try {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, "current_status")) {
        return res.status(400).json(fail("INVALID_TRANSITION", "current_status is server-authoritative"));
      }
      const result = await service.transitionProgram(
        req.params.id,
        req.body?.next_status,
        req.user,
        req.body?.reason_text,
      );
      res.json(ok(result));
    } catch (err: any) {
      res.status(err.statusCode || 400).json(fail(err.statusCode === 409 ? "CONFLICT" : "INVALID_TRANSITION", err.message));
    }
  });
}
