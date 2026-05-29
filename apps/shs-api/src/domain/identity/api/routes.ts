import { ok, fail } from "../../../api/response-envelope";
import { requirePermission } from "../../../auth/permission-guard";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions";
import { writeSecurityAuditEvent } from "../../../auth/security-audit";
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
        const membership = {
          membership_id: "mem_dev_001",
          ...req.body,
          status: "active",
        };

        await writeSecurityAuditEvent(req, {
          action_type: "identity.membership.assign",
          target_object_type: "membership",
          target_object_id: membership.membership_id,
          new_state_json: membership,
          reason_code: "membership_assigned",
          reason_text: "Membership assigned.",
        });

        res.json(ok(membership));
      } catch (err: any) {
        res.status(400).json(fail("VALIDATION_ERROR", err.message));
      }
    }
  );

  app.patch(
    "/identity/memberships/:id/revoke",
    requirePermission(SHS_SECURITY_PERMISSIONS.IDENTITY_MEMBERSHIP_REVOKE),
    async (req: any, res: any) => {
      const revoked = {
        membership_id: req.params.id,
        status: "revoked",
        reason_text: req.body?.reason_text || "Revoked",
      };

      await writeSecurityAuditEvent(req, {
        action_type: "identity.membership.revoke",
        target_object_type: "membership",
        target_object_id: revoked.membership_id,
        new_state_json: revoked,
        reason_code: "membership_revoked",
        reason_text: revoked.reason_text,
      });

      res.json(ok(revoked));
    }
  );
}
