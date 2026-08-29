import { ProgramService } from "../service/program-service.js";
import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";

const service = new ProgramService();

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
    res.json(ok(item));
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
