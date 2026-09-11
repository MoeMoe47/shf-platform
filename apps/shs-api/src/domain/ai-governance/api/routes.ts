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
  app.post("/ai-governance/sessions/:sessionId/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.closeSession(req.user, req.params.sessionId, { ...(req.body || {}), reason: req.body?.reason || "CANCELLED" }))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/agents", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createAgentIdentity(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/agents", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listAgentIdentities(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/agents/:agentIdentityId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getAgentIdentity(req.user, req.params.agentIdentityId))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/agents/:agentIdentityId/disable", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.setAgentIdentityStatus(req.user, req.params.agentIdentityId, "DISABLED"))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/agents/:agentIdentityId/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.setAgentIdentityStatus(req.user, req.params.agentIdentityId, "REVOKED"))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createTask(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/tasks", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listTasks(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/tasks/:taskId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getTask(req.user, req.params.taskId))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/tasks/:taskId/attempts", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listTaskAttempts(req.user, req.params.taskId) })); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/approval-requests", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.requestTaskApproval(req.user, req.params.taskId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/approval-requests", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listTaskApprovals(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/approval-requests/:approvalRequestId", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.getTaskApproval(req.user, req.params.approvalRequestId))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/approval-requests/:approvalRequestId/decision", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.decideTaskApproval(req.user, req.params.approvalRequestId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/security-events", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listSecurityEvents(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/attempts", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.recordTaskAttempt(req.user, req.params.taskId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.cancelTask(req.user, req.params.taskId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/transition", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.transitionTask(req.user, req.params.taskId, String(req.body?.status || "").toUpperCase(), req.body || {}))); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/workers", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.createWorker(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.get("/ai-governance/workers", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.listWorkers(req.user) })); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/claim", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await service.claimTask(req.user, req.params.taskId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/attempts/:attemptId/heartbeat", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.heartbeatAttempt(req.user, req.params.taskId, req.params.attemptId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/attempts/:attemptId/complete-safe", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.completeAttempt(req.user, req.params.taskId, req.params.attemptId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/attempts/:attemptId/fail", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.failAttempt(req.user, req.params.taskId, req.params.attemptId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/:taskId/retry", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.retryTask(req.user, req.params.taskId, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
  app.post("/ai-governance/tasks/expire-leases", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await service.expireLeases(req.user) })); } catch (error) { return reject(res, error, next); }
  });

  app.post("/ai-governance/evaluate", requirePermission(SHS_SECURITY_PERMISSIONS.AI_GOVERNANCE_EVALUATE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await service.evaluateAndEmit(req.user, req.body || {}))); } catch (error) { return reject(res, error, next); }
  });
}
