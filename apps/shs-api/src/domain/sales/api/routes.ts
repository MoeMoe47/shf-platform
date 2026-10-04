import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import {
  toSalesDiscoveryRecordResponse,
  toSalesNeedResponse,
  toSalesOpportunityResponse,
  toSalesRelationshipResponse,
} from "../model/sales-record.js";
import { SalesError, SalesService } from "../service/sales-service.js";

const service = new SalesService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof SalesError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerSalesRoutes(app: any, routeService: SalesService = service) {
  app.get("/sales/relationships", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await routeService.listRelationships(req.user)).map(toSalesRelationshipResponse) })); }
    catch (error) { return handleError(error, res, next); }
  });

  app.post("/sales/relationships", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(toSalesRelationshipResponse(await routeService.createRelationship(req.body || {}, req.user)))); }
    catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/relationships/:id", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.getRelationship(req.params.id, req.user);
      return item ? res.json(ok(toSalesRelationshipResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales relationship not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.patch("/sales/relationships/:id", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.updateRelationship(req.params.id, req.body || {}, req.user);
      return item ? res.json(ok(toSalesRelationshipResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales relationship not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/discovery-records", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await routeService.listDiscoveryRecords(req.user)).map(toSalesDiscoveryRecordResponse) })); }
    catch (error) { return handleError(error, res, next); }
  });

  app.post("/sales/discovery-records", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(toSalesDiscoveryRecordResponse(await routeService.createDiscoveryRecord(req.body || {}, req.user)))); }
    catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/discovery-records/:id", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.getDiscoveryRecord(req.params.id, req.user);
      return item ? res.json(ok(toSalesDiscoveryRecordResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales discovery record not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.patch("/sales/discovery-records/:id", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.updateDiscoveryRecord(req.params.id, req.body || {}, req.user);
      return item ? res.json(ok(toSalesDiscoveryRecordResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales discovery record not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.post("/sales/discovery-records/:id/archive", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.archiveDiscoveryRecord(req.params.id, req.user);
      return item ? res.json(ok(toSalesDiscoveryRecordResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales discovery record not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/needs", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await routeService.listNeeds(req.user)).map(toSalesNeedResponse) })); }
    catch (error) { return handleError(error, res, next); }
  });

  app.post("/sales/needs", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(toSalesNeedResponse(await routeService.createNeed(req.body || {}, req.user)))); }
    catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/needs/:id", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.getNeed(req.params.id, req.user);
      return item ? res.json(ok(toSalesNeedResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales need not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.patch("/sales/needs/:id", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.updateNeed(req.params.id, req.body || {}, req.user);
      return item ? res.json(ok(toSalesNeedResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales need not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/opportunities", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: (await routeService.listOpportunities(req.user)).map(toSalesOpportunityResponse) })); }
    catch (error) { return handleError(error, res, next); }
  });

  app.post("/sales/opportunities", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(toSalesOpportunityResponse(await routeService.createOpportunity(req.body || {}, req.user)))); }
    catch (error) { return handleError(error, res, next); }
  });

  app.get("/sales/opportunities/:id", requirePermission("sales.read"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.getOpportunity(req.params.id, req.user);
      return item ? res.json(ok(toSalesOpportunityResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales opportunity not found."));
    } catch (error) { return handleError(error, res, next); }
  });

  app.patch("/sales/opportunities/:id", requirePermission("sales.write"), async (req: any, res: any, next: any) => {
    try {
      const item = await routeService.updateOpportunity(req.params.id, req.body || {}, req.user);
      return item ? res.json(ok(toSalesOpportunityResponse(item))) : res.status(404).json(fail("NOT_FOUND", "Sales opportunity not found."));
    } catch (error) { return handleError(error, res, next); }
  });
}
