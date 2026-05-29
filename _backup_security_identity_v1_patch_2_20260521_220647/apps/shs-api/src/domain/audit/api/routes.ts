import { AuditRepo } from "../repo/audit-repo";
import { ok } from "../../../api/response-envelope";

const repo = new AuditRepo();

export function registerAuditRoutes(app: any) {
  app.get("/audit", async (_req: any, res: any) => {
    const items = await repo.listAuditEvents();
    res.json(ok({ items }));
  });
}
