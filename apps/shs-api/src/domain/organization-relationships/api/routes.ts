import { requirePermission } from "../../../auth/permission-guard";
import { fail, ok } from "../../../api/response-envelope";
import { OrganizationRelationshipService } from "../service/organization-relationship-service";

const service = new OrganizationRelationshipService();

export function registerOrganizationRelationshipRoutes(app: any) {
  app.get("/organization-relationships", requirePermission("organization.relationship.view"), async (req: any, res: any) => {
    try {
      const items = await service.listRelationships(req.user);
      res.json(ok({ items }));
    } catch (err: any) {
      res.status(403).json(fail("RELATIONSHIP_FORBIDDEN", err.message));
    }
  });

  app.get("/organization-relationships/:relationshipId", requirePermission("organization.relationship.view"), async (req: any, res: any) => {
    try {
      const item = await service.getRelationship(req.params.relationshipId, req.user);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Relationship not found"));
      res.json(ok(item));
    } catch (err: any) {
      res.status(403).json(fail("RELATIONSHIP_FORBIDDEN", err.message));
    }
  });

  app.post("/organization-relationships", requirePermission("organization.relationship.manage"), async (req: any, res: any) => {
    try {
      const created = await service.createRelationship(req.body || {}, req.user);
      res.json(ok(created));
    } catch (err: any) {
      const status = /permission|forbidden/.test(err.message) ? 403 : 400;
      res.status(status).json(fail("RELATIONSHIP_REJECTED", err.message));
    }
  });

  app.post("/organization-relationships/:relationshipId/transition", requirePermission("organization.relationship.manage"), async (req: any, res: any) => {
    try {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, "current_status")) {
        return res.status(400).json(fail("RELATIONSHIP_REJECTED", "current_status is server-authoritative"));
      }
      const updated = await service.transitionRelationship(
        req.params.relationshipId,
        req.body?.next_status,
        req.user,
        req.body?.reason_text,
      );
      if (!updated) return res.status(404).json(fail("NOT_FOUND", "Relationship not found"));
      res.json(ok(updated));
    } catch (err: any) {
      res.status(err.statusCode || 400).json(fail(err.statusCode === 409 ? "CONFLICT" : "RELATIONSHIP_REJECTED", err.message));
    }
  });
}
