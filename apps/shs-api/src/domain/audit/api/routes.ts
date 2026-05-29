import { AuditRepo } from "../repo/audit-repo";
import { ok } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";

const repo = new AuditRepo();

export function registerAuditRoutes(app: any) {
  app.get(
    "/audit",
    requirePermission(SHS_SECURITY_PERMISSIONS.AUDIT_VIEW),
    async (_req: any, res: any) => {
      const items = await repo.listAuditEvents();
      res.json(ok({ items }));
    }
  );
}
