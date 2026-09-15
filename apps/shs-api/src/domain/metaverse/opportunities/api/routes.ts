// MET-8 — Student Opportunity Exchange HTTP routes.
import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import * as opportunityService from "../service/opportunity-service.js";
import * as bidService from "../service/bid-service.js";
import * as awardService from "../service/award-service.js";
import * as submissionService from "../service/submission-service.js";
import { OpportunityExchangeError, OpportunityNotFoundError, statusForOpportunityError } from "../service/opportunity-service.js";

function sendError(error: any, res: any, next: any) {
  const status = statusForOpportunityError(error);
  if (status >= 500) return next(error);
  const code = error instanceof OpportunityExchangeError ? error.code : error instanceof OpportunityNotFoundError ? "NOT_FOUND" : "REQUEST_DENIED";
  return res.status(status).json(fail(code, error?.message || "Request denied."));
}

export function registerOpportunityExchangeRoutes(app: any) {
  app.get("/metaverse/opportunity-exchange/opportunities", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await opportunityService.listOpportunitiesForActor(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/opportunities/:id", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any, next: any) => {
    try {
      const item = await opportunityService.getOpportunityForActor(req.params.id, req.user);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Opportunity not found."));
      return res.json(ok(item));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/opportunities", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await opportunityService.createOpportunity(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.patch("/metaverse/opportunity-exchange/opportunities/:id/status", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const updated = await opportunityService.transitionOpportunityStatus(req.params.id, req.user, String(req.body?.status || "") as any, Number(req.body?.expectedVersion));
      return res.json(ok(updated));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/opportunities/:id/bids", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_BID), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await bidService.submitBid(req.user, req.params.id, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/opportunities/:id/bids", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await bidService.listBidsForSponsor(req.user, req.params.id) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/opportunities/:id/bids/mine", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_BID), async (req: any, res: any, next: any) => {
    try {
      const bid = await bidService.getMyBidForOpportunity(req.user, req.params.id);
      return res.json(ok(bid));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/bids/:bidId/withdraw", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_BID), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await bidService.withdrawBid(req.user, req.params.bidId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/bids/:bidId/shortlist", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await bidService.shortlistBid(req.user, req.params.bidId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/bids/:bidId/decline", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await bidService.declineBid(req.user, req.params.bidId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/bids/:bidId/accept", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await awardService.acceptBid(req.user, req.params.bidId))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/awards", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await awardService.listAwardsForActor(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/awards/:awardId", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any, next: any) => {
    try {
      const award = await awardService.getAwardForActor(req.user, req.params.awardId);
      if (!award) return res.status(404).json(fail("NOT_FOUND", "Award not found."));
      return res.json(ok(award));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/awards/:awardId/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await awardService.cancelAward(req.user, req.params.awardId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/awards/:awardId/submissions", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_SUBMIT_WORK), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await submissionService.submitWork(req.user, req.params.awardId, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/opportunity-exchange/awards/:awardId/submissions", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await submissionService.listSubmissionsForAward(req.user, req.params.awardId) })); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/opportunity-exchange/submissions/:submissionId/review", requirePermission(SHS_SECURITY_PERMISSIONS.OPPORTUNITY_EXCHANGE_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const result = await submissionService.reviewSubmission(req.user, req.params.submissionId, String(req.body?.decision || "") as any, req.body?.feedback);
      return res.json(ok(result));
    } catch (error) { return sendError(error, res, next); }
  });
}
