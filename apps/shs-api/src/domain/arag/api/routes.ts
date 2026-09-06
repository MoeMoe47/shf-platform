import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AragError, AragService } from "../service/arag-service.js";

const service = new AragService();
function reject(res: any, error: any, next: any) { if (error instanceof AragError) return res.status(error.statusCode).json(fail(error.code, error.message)); return next(error); }

export function registerAragRoutes(app: any) {
  app.post("/arag/releases", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_REQUEST), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.request(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.get("/arag/releases", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_READ), async (req: any, res: any, next: any) => { try { return res.json(ok({ items: await service.list(req.user) })); } catch (error) { return reject(res, error, next); } });
  app.get("/arag/releases/:releaseId", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_READ), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.get(req.user, req.params.releaseId))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/evaluate", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EVALUATE), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.evaluate(req.user, req.params.releaseId))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/approve", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_APPROVE), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.approve(req.user, req.params.releaseId, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/authorize", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EVALUATE), async (req: any, res: any, next: any) => { try { return res.status(201).json(ok(await service.authorize(req.user, req.params.releaseId))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/authorization/:authorizationId/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EVALUATE), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.revokeAuthorization(req.user, req.params.authorizationId))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/release", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_EXECUTE), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.release(req.user, req.params.releaseId, req.body || {}))); } catch (error) { return reject(res, error, next); } });
  app.get("/arag/releases/:releaseId/assurance-packet", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_READ), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.packet(req.user, req.params.releaseId))); } catch (error) { return reject(res, error, next); } });
  app.post("/arag/releases/:releaseId/rollback", requirePermission(SHS_SECURITY_PERMISSIONS.ARAG_RELEASE_ROLLBACK), async (req: any, res: any, next: any) => { try { return res.json(ok(await service.rollback(req.user, req.params.releaseId))); } catch (error) { return reject(res, error, next); } });
}
