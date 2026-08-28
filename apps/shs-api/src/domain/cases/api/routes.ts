import { CaseService } from "../service/case-service";
import { ok, fail } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";

const service = new CaseService();

export function registerCaseRoutes(app: any) {
  app.get("/cases", requirePermission("case.read"), async (req: any, res: any) => {
    const items = await service.listCases(req.user);
    res.json(ok({ items }));
  });

  app.get("/cases/referrals", requirePermission("case.read"), async (req: any, res: any) => {
    const items = await service.listReferrals(req.user);
    res.json(ok({ items }));
  });

  app.get("/cases/:id", requirePermission("case.read"), async (req: any, res: any) => {
    const item = await service.getCase(req.params.id, req.user);
    if (!item) return res.status(404).json(fail("NOT_FOUND", "Case not found"));
    res.json(ok(item));
  });

  app.post("/cases", requirePermission("case.create"), async (req: any, res: any) => {
    try {
      const created = await service.createCase(req.body || {}, req.user);
      res.json(ok(created));
    } catch (err: any) {
      res.status(400).json(fail("VALIDATION_ERROR", err.message));
    }
  });

  app.post("/cases/referrals", requirePermission("referrals.manage"), async (req: any, res: any) => {
    try {
      const created = await service.createReferral(req.body || {}, req.user);
      res.json(ok(created));
    } catch (err: any) {
      res.status(400).json(fail("VALIDATION_ERROR", err.message));
    }
  });

  app.post("/cases/:id/assign", requirePermission("case.assign"), async (req: any, res: any) => {
    try {
      const result = await service.assignCase(req.params.id, req.body || {}, req.user);
      res.json(ok(result));
    } catch (err: any) {
      res.status(400).json(fail("VALIDATION_ERROR", err.message));
    }
  });

  app.post("/cases/:id/transition", requirePermission("case.transition"), async (req: any, res: any) => {
    try {
      const currentStatus = req.body?.current_status || "draft";
      const nextStatus = req.body?.next_status;
      const result = await service.transitionCase(
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
