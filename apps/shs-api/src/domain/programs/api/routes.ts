import { ProgramService } from "../service/program-service";
import { ok, fail } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";

const service = new ProgramService();

export function registerProgramRoutes(app: any) {
  app.get("/programs", async (_req: any, res: any) => {
    const items = await service.listPrograms();
    res.json(ok({ items }));
  });

  app.get("/programs/taxonomy", async (_req: any, res: any) => {
    const items = await service.listTaxonomy();
    res.json(ok({ items }));
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
      const currentStatus = req.body?.current_status || "draft";
      const nextStatus = req.body?.next_status;
      const result = await service.transitionProgram(
        req.params.id,
        currentStatus,
        nextStatus,
        req.user,
        req.body?.reason_text
      );
      res.json(ok(result));
    } catch (err: any) {
      res.status(400).json(fail("INVALID_TRANSITION", err.message));
    }
  });
}
