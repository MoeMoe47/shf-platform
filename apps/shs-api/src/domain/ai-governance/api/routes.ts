import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { AiGovernanceError, AiGovernanceService } from "../service/ai-governance-service.js";

const service = new AiGovernanceService();

function reject(res: any, error: any, next: any) {
  if (error instanceof AiGovernanceError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerAiGovernanceRoutes(app: any) {
  app.get("/ai-governance/delegations", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listDelegations(req.user) })); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/delegations", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createDelegation(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/ai-governance/delegations/:delegationId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getDelegation(req.user, req.params.delegationId))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/delegations/:delegationId/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.revokeDelegation(req.user, req.params.delegationId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/resource-classifications", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.assignClassification(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/ai-governance/resource-classifications/:resourceType/:resourceId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getClassification(req.user, req.params.resourceType, req.params.resourceId))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/ai-governance/models", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listModelPolicies(req.user) })); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/models", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.upsertModelPolicy(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/sessions", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createSession(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.get("/ai-governance/sessions/:sessionId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getSession(req.user, req.params.sessionId))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/sessions/:sessionId/close", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.closeSession(req.user, req.params.sessionId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/evaluate", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.evaluateAndEmit(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
}
