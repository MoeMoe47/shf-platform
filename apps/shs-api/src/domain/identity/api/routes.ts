import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { IdentityService } from "../service/identity-service.js";
import { MembershipService, MembershipServiceError } from "../service/membership-service.js";

const service = new IdentityService();
const memberships = new MembershipService();

export function registerIdentityRoutes(app: any) {
  app.get(
    "/identity/memberships",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_VIEW),
    async (req: any, res: any, next: any) => {
      try { return res.json(ok({ items: await memberships.list(req.user, req.query?.organization_id || req.query?.organizationId) })); }
      catch (error: any) { if (error instanceof MembershipServiceError) return res.status(error.statusCode).json(fail(error.code, error.message)); return next(error); }
    },
  );

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
        const result = await memberships.assign(req.body || {}, req.user);
        return res.status(result.replayed ? 200 : 201).json(ok(result.membership));
      } catch (err: any) {
        if (err instanceof MembershipServiceError) return res.status(err.statusCode).json(fail(err.code, err.message));
        return res.status(400).json(fail("VALIDATION_ERROR", err.message));
      }
    }
  );

  app.patch(
    "/identity/memberships/:id/revoke",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_REVOKE),
    async (req: any, res: any) => {
      try {
        const result = await memberships.revoke(req.params.id, req.body || {}, req.user);
        return res.json(ok(result.membership));
      } catch (err: any) {
        if (err instanceof MembershipServiceError) return res.status(err.statusCode).json(fail(err.code, err.message));
        return res.status(400).json(fail("VALIDATION_ERROR", err.message));
      }
    }
  );
}
