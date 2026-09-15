import { ok, fail } from "../../../../api/response-envelope.js";
import { requirePermission } from "../../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../../auth/security-permissions.js";
import { MarketError, statusForMarketError } from "../service/market-errors.js";
import * as listingService from "../service/listing-service.js";
import * as orderService from "../service/order-service.js";
import * as fulfillmentService from "../service/fulfillment-service.js";
import * as refundService from "../service/refund-service.js";

function sendError(error: any, res: any, next: any) {
  const status = statusForMarketError(error);
  if (status >= 500) return next(error);
  const code = error instanceof MarketError ? error.code : "MARKET_REQUEST_DENIED";
  return res.status(status).json(fail(code, error?.message || "Market request denied."));
}

export function registerMetaverseMarketRoutes(app: any) {
  app.get("/metaverse/market/balance", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await orderService.getBalance(req.user))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/market/listings", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await listingService.listListings(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/market/listings/:listingId", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_VIEW), async (req: any, res: any, next: any) => {
    try {
      const item = await listingService.getListing(req.user, req.params.listingId);
      if (!item) return res.status(404).json(fail("NOT_FOUND", "Listing not found."));
      return res.json(ok(item));
    } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/listings", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_SELL), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await listingService.createListing(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/listings/:listingId/review", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await listingService.reviewListing(req.user, req.params.listingId, String(req.body?.decision || "") as any, req.body?.reason))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/orders", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_BUY), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await orderService.placeOrder(req.user, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.get("/metaverse/market/orders", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await orderService.listMyOrders(req.user) })); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/orders/:orderId/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_BUY), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await orderService.cancelOrder(req.user, req.params.orderId))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/orders/:orderId/fulfill", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_SELL), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await fulfillmentService.fulfillOrder(req.user, req.params.orderId, req.body || {}))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/orders/:orderId/refunds", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_BUY), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await refundService.requestRefund(req.user, req.params.orderId, String(req.body?.reason || "")))); } catch (error) { return sendError(error, res, next); }
  });

  app.post("/metaverse/market/refunds/:refundRequestId/settle", requirePermission(SHS_SECURITY_PERMISSIONS.METAVERSE_MARKET_REVIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await refundService.settleRefund(req.user, req.params.refundRequestId))); } catch (error) { return sendError(error, res, next); }
  });
}
