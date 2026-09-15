// MET-12 — Student Enterprise HTTP routes.
import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import * as enterpriseService from "../service/enterprise-service.js";
import { EnterpriseError, statusForEnterpriseError } from "../service/enterprise-service.js";

function sendError(error: any, res: any, next: any) {
  const status = statusForEnterpriseError(error);
  if (status >= 500) return next(error);
  const code = error instanceof EnterpriseError ? error.code : "REQUEST_DENIED";
  return res.status(status).json(fail(code, error?.message || "Request denied."));
}

export function registerStudentEnterpriseRoutes(app: any) {
  app.get("/metaverse/enterprise/enterprises/mine", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await enterpriseService.listMyEnterprises(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/enterprise/enterprises/discover", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await enterpriseService.listDiscoverableEnterprises(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  // MET-12 remediation — reviewer-only listing, gated by the APPROVE
  // permission (never granted to STUDENT) plus assertReviewer server-side.
  app.get("/metaverse/enterprise/enterprises/review", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_APPROVE), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await enterpriseService.listEnterprisesForReview(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/enterprise/enterprises/:id", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.getEnterpriseForActor(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await enterpriseService.formEnterprise(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/submit-for-approval", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.submitForApproval(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/approve", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_APPROVE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.approveEnterprise(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/return", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_APPROVE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.returnEnterprise(req.user, req.params.id, req.body?.reason || ""))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/pause", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.pauseEnterprise(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/resume", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.resumeEnterprise(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/suspend", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_APPROVE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.suspendEnterprise(req.user, req.params.id, req.body?.reason || ""))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/close", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.closeEnterprise(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/archive", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await enterpriseService.archiveEnterprise(req.user, req.params.id))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/roles", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await enterpriseService.grantEnterpriseRole(req.user, req.params.id, req.body?.userId, req.body?.role))); } catch (error) { return sendError(error, res, next); }
  });

  app.delete("/metaverse/enterprise/enterprises/:id/roles/:userId", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { await enterpriseService.revokeEnterpriseRole(req.user, req.params.id, req.params.userId); return res.status(204).end(); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/enterprise/enterprises/:id/catalog", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await enterpriseService.listCatalog(req.user, req.params.id) })); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/enterprise/enterprises/:id/catalog", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_PROPOSE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await enterpriseService.addCatalogItem(req.user, req.params.id, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/enterprise/enterprises/:id/history", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_ENTERPRISE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await enterpriseService.listEnterpriseHistory(req.user, req.params.id) })); } catch (error) { return sendError(error, res, next); }
  });
}
