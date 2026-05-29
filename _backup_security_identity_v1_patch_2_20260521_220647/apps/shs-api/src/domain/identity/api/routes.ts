import { ok, fail } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";
import { IdentityService } from "../service/identity-service";

const service = new IdentityService();

export function registerIdentityRoutes(app: any) {
  app.get("/identity/users", (_req: any, res: any) => {
    res.json(ok({ items: [] }));
  });

  app.get("/identity/roles", (_req: any, res: any) => {
    res.json(ok({ items: [] }));
  });

  app.get("/identity/organizations", async (_req: any, res: any) => {
    const items = await service.listOrganizations();
    res.json(ok({ items }));
  });

  app.get("/identity/organizations/:id", async (req: any, res: any) => {
    const item = await service.getOrganizationById(req.params.id);
    if (!item) {
      return res.status(404).json(fail("NOT_FOUND", "Organization not found"));
    }
    res.json(ok(item));
  });

  app.post("/identity/memberships", requirePermission("identity.membership.assign"), async (req: any, res: any) => {
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
  });

  app.patch("/identity/memberships/:id/revoke", requirePermission("identity.membership.revoke"), async (req: any, res: any) => {
    res.json(
      ok({
        membership_id: req.params.id,
        status: "revoked",
        reason_text: req.body?.reason_text || "Revoked",
      })
    );
  });
}
