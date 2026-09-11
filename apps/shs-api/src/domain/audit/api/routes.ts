import { AuditRepo } from "../repo/audit-repo.js";
import { ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";

const repo = new AuditRepo();

export function registerAuditRoutes(app: any) {
  app.get(
    "/audit",
    requirePermission(SHS_SECURITY_PERMISSIONS.AUDIT_VIEW),
    async (req: any, res: any) => {
      const items = await repo.listAuditEvents({
        organization_id: req.user.active_organization_id,
        tenant_id: req.user.tenant_id,
      });
      res.json(ok({ items }));
    }
  );
}
