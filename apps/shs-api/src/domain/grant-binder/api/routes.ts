import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";
import { GrantBinderService } from "../service/grant-binder-service";

const grantBinderService = new GrantBinderService();

function errorResponse(res: any, code: string, err: any, status = 400) {
  return res.status(status).json({
    ok: false,
    error: { code, message: err?.message || "Grant Binder request rejected" },
  });
}

export function registerGrantBinderRoutes(app: any) {
  app.post(
    "/grant-binders",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW),
    async (req: any, res: any) => {
      try {
        const binder = await grantBinderService.createBinder(req.body || {}, req.user);
        return res.status(201).json({ ok: true, data: binder });
      } catch (err: any) {
        return errorResponse(res, "GRANT_BINDER_CREATE_REJECTED", err);
      }
    },
  );

  app.get(
    "/grant-binders",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const items = await grantBinderService.listBinders(req.user);
        return res.json({ ok: true, data: { items } });
      } catch (err: any) {
        return errorResponse(res, "GRANT_BINDER_READ_REJECTED", err);
      }
    },
  );

  app.get(
    "/grant-binders/:binderId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_VIEW),
    async (req: any, res: any) => {
      try {
        const binder = await grantBinderService.getBinder(req.params.binderId, req.user);
        if (!binder) return errorResponse(res, "GRANT_BINDER_NOT_FOUND", new Error("Grant Binder not found"), 404);
        return res.json({ ok: true, data: binder });
      } catch (err: any) {
        return errorResponse(res, "GRANT_BINDER_READ_REJECTED", err);
      }
    },
  );

  app.put(
    "/grant-binders/:binderId",
    requirePermission(SHS_SECURITY_PERMISSIONS.REPORTS_PREVIEW),
    async (req: any, res: any) => {
      try {
        const binder = await grantBinderService.updateBinder(
          req.params.binderId,
          req.body || {},
          req.user,
          Number(req.body?.expectedVersion),
        );
        return res.json({ ok: true, data: binder });
      } catch (err: any) {
        return errorResponse(res, "GRANT_BINDER_UPDATE_REJECTED", err, 409);
      }
    },
  );
}
