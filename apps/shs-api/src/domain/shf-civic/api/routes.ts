import { ok, fail } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { statusForShfCivicError } from "../service/shf-civic-service.js";
import { durableShfCivicService } from "../service/durable-shf-civic-service.js";

function sendError(error: any, res: any, next: any) {
  const status = statusForShfCivicError(error);
  if (status >= 500) return next(error);
  return res.status(status).json(fail(error?.code || "SHF_CIVIC_DENIED", error?.message || "SHF Civic request denied."));
}

export function registerShfCivicRoutes(app: any) {
  app.get("/shf-civic/hall", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.hall(req.user))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/shf-civic/public", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.publicProjection(req.user))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/shf-civic/private/:organizationId", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { if (req.user.active_organization_id !== req.params.organizationId && req.user.organization_id !== req.params.organizationId) throw Object.assign(new Error("Civic record is not available in this organization."), { statusCode: 403, code: "CIVIC_CROSS_ORG_DENIED" }); return res.json(ok(await durableShfCivicService.hall(req.user))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/candidacies", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.fileCandidacy(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/candidacies/review", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.reviewCandidacy(req.user, String(req.body?.candidacyId || req.body?.candidate?.candidacyId || ""), req.body?.decision === "DECLINE" ? "DECLINE" : "APPROVE"))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/shf-civic/elections/:electionId/ballot", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.ballot(req.user, req.params.electionId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/elections/:electionId/ballots", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.castBallot(req.user, req.params.electionId, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/elections/:electionId/certify", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.certify(req.user, req.params.electionId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/proposals", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.proposal(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/proposals/:proposalId/transition", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.transitionProposal(req.user, req.params.proposalId, req.body?.status))); } catch (error) { return sendError(error, res, next); }
  });
  app.post("/shf-civic/proposals/:proposalId/council-votes", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_UPDATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.councilVote(req.user, req.params.proposalId, req.body?.vote))); } catch (error) { return sendError(error, res, next); }
  });
  app.post("/shf-civic/public-comments", requirePermission(SHS_SECURITY_PERMISSIONS.STUDIO_PROJECT_CREATE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.publicComment(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });
  app.post("/shf-civic/council-sessions", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.createSession(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });
  app.post("/shf-civic/proposals/:proposalId/project-reference", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.createCityProjectReference(req.user, req.params.proposalId, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/shf-civic/elections", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await durableShfCivicService.createElection(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });
  app.post("/shf-civic/elections/:electionId/status", requirePermission(SHS_SECURITY_PERMISSIONS.PROJECT_SUBMISSION_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await durableShfCivicService.setElectionStatus(req.user, req.params.electionId, String(req.body?.status || "")))); } catch (error) { return sendError(error, res, next); }
  });
}
