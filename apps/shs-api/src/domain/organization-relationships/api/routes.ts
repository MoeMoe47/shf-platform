import { requirePermission } from "../../../auth/permission-guard";
import { fail, ok } from "../../../api/response-envelope";
import { OrganizationRelationshipService } from "../service/organization-relationship-service";
import { toOrganizationRelationshipResponse } from "../model/organization-relationship";

const service = new OrganizationRelationshipService();

function relationshipErrorStatus(error: any) {
  if (error?.statusCode === 409) return 409;
  if (/permission|forbidden/.test(error?.message || "")) return 403;
  if (/^unknown_relationship_|^invalid_relationship_|^relationship_.*required|server-authoritative/.test(error?.message || "")) return 400;
  return null;
}

function relationshipErrorCode(error: any) {
  return error?.statusCode === 409 ? "CONFLICT" : "RELATIONSHIP_REJECTED";
}

export function registerOrganizationRelationshipRoutes(app: any) {
  app.get("/organization-relationships", requirePermission("organization.relationship.view"), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listRelationships(req.user);
      res.json(ok({ items: items.map(toOrganizationRelationshipResponse) }));
    } catch (err: any) {
      const status = relationshipErrorStatus(err);
      if (!status) return next(err);
      res.status(status).json(fail(relationshipErrorCode(err), err.message));
    }
  });

  app.get("/organization-relationships/:relationshipId", requirePermission("organization.relationship.view"), async (req: any, res: any, next: any) => {
    try {
      const item = await service.getRelationship(req.params.relationshipId, req.user);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Relationship not found"));
      res.json(ok(toOrganizationRelationshipResponse(item)));
    } catch (err: any) {
      const status = relationshipErrorStatus(err);
      if (!status) return next(err);
      res.status(status).json(fail(relationshipErrorCode(err), err.message));
    }
  });

  app.post("/organization-relationships", requirePermission("organization.relationship.manage"), async (req: any, res: any, next: any) => {
    try {
      const created = await service.createRelationship(req.body || {}, req.user);
      res.json(ok(toOrganizationRelationshipResponse(created)));
    } catch (err: any) {
      const status = relationshipErrorStatus(err);
      if (!status) return next(err);
      res.status(status).json(fail(relationshipErrorCode(err), err.message));
    }
  });

  app.post("/organization-relationships/:relationshipId/transition", requirePermission("organization.relationship.manage"), async (req: any, res: any, next: any) => {
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
      res.json(ok(toOrganizationRelationshipResponse(updated)));
    } catch (err: any) {
      const status = relationshipErrorStatus(err);
      if (!status) return next(err);
      res.status(status).json(fail(relationshipErrorCode(err), err.message));
    }
  });
}
