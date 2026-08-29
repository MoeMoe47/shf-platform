import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import { ExchangeFundingCommitmentService } from "../service/exchange-funding-commitment-service.js";

const service = new ExchangeFundingCommitmentService();

function errorResponse(res: any, code: string, err: any, status = 400) {
  return res.status(status).json({ ok: false, error: { code, message: err?.message || "Exchange funding commitment request rejected" } });
}

function expectedVersion(req: any) {
  return Number(req.body?.expectedVersion ?? req.body?.expected_version);
}

export function registerExchangeFundingCommitmentRoutes(app: any) {
  app.post("/exchange/funding-commitments", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_MANAGE), async (req: any, res: any) => {
    try { return res.status(201).json({ ok: true, data: await service.createCommitment(req.body || {}, req.user) }); }
    catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_CREATE_REJECTED", err); }
  });

  app.get("/exchange/funding-commitments", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_VIEW), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: { items: await service.listCommitments(req.user) } }); }
    catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_READ_REJECTED", err); }
  });

  app.get("/exchange/funding-commitments/:commitmentId", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_VIEW), async (req: any, res: any) => {
    try {
      const commitment = await service.getCommitment(req.params.commitmentId, req.user);
      if (!commitment) return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_NOT_FOUND", new Error("Funding commitment not found"), 404);
      return res.json({ ok: true, data: commitment });
    } catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_READ_REJECTED", err); }
  });

  app.put("/exchange/funding-commitments/:commitmentId", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_MANAGE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.updateCommitment(req.params.commitmentId, req.body || {}, req.user, expectedVersion(req)) }); }
    catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_UPDATE_REJECTED", err, 409); }
  });

  app.post("/exchange/funding-commitments/:commitmentId/commit", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_MANAGE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.commitCommitment(req.params.commitmentId, req.user, expectedVersion(req)) }); }
    catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_COMMIT_REJECTED", err, 409); }
  });

  app.post("/exchange/funding-commitments/:commitmentId/cancel", requirePermission(SHS_SECURITY_PERMISSIONS.EXCHANGE_FUNDING_COMMITMENTS_MANAGE), async (req: any, res: any) => {
    try { return res.json({ ok: true, data: await service.cancelCommitment(req.params.commitmentId, req.user, expectedVersion(req)) }); }
    catch (err: any) { return errorResponse(res, "EXCHANGE_FUNDING_COMMITMENT_CANCEL_REJECTED", err, 409); }
  });
}
