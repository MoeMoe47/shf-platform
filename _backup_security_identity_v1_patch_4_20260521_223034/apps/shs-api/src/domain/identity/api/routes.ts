import { ok, fail } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";
import { IdentityService } from "../service/identity-service";

const service = new IdentityService();

export function registerIdentityRoutes(app: any) {
  app.get(
    "/identity/users",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_VIEW),
    (_req: any, res: any) => {
      res.json(ok({ items: [] }));
    }
  );

  app.get(
    "/identity/roles",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_VIEW),
    (_req: any, res: any) => {
      res.json(ok({ items: [] }));
    }
  );

  app.get(
    "/identity/organizations",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_VIEW),
    async (_req: any, res: any) => {
      const items = await service.listOrganizations();
      res.json(ok({ items }));
    }
  );

  app.get(
    "/identity/organizations/:id",
    requirePermission(SHS_SECURITY_PERMISSIONS.ORGANIZATION_VIEW),
    async (req: any, res: any) => {
      const item = await service.getOrganizationById(req.params.id);
      if (!item) {
        return res.status(404).json(fail("NOT_FOUND", "Organization not found"));
      }
      res.json(ok(item));
    }
  );

  app.post(
    "/identity/memberships",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_ASSIGN),
    async (req: any, res: any) => {
      try {
        res.json(
          ok({
            membership_id: "mem_dev_001",
            ...req.body,
            status: "active",
          })
        );
      } catch (err: any) {
        res.status(400).json(fail("VALIDATION_ERROR", err.message));
      }
    }
  );

  app.patch(
    "/identity/memberships/:id/revoke",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_REVOKE),
    async (req: any, res: any) => {
      res.json(
        ok({
          membership_id: req.params.id,
          status: "revoked",
          reason_text: req.body?.reason_text || "Revoked",
        })
      );
    }
  );
}
