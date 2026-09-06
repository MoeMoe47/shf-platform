import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { ServiceAgreementError, ServiceAgreementService } from "../service/service-agreement-service.js";
import { toServiceAgreementResponse, toServiceAgreementVersionResponse } from "../model/service-agreement.js";

const service = new ServiceAgreementService();

function handleError(error: any, res: any, next: any) {
  if (error instanceof ServiceAgreementError) {
    return res.status(error.statusCode).json(fail(error.code, error.message));
  }
  return next(error);
}

export function registerServiceAgreementRoutes(app: any) {
  app.get("/service-agreements", requirePermission("service.agreement.view"), async (req: any, res: any, next: any) => {
    try {
      const items = await service.listAgreements(req.user);
      return res.json(ok({ items: items.map(toServiceAgreementResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.get("/service-agreements/:agreementId", requirePermission("service.agreement.view"), async (req: any, res: any, next: any) => {
    try {
      const agreement = await service.getAgreement(req.params.agreementId, req.user);
      if (!agreement) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.json(ok(toServiceAgreementResponse(agreement)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.get("/service-agreements/:agreementId/versions", requirePermission("service.agreement.view"), async (req: any, res: any, next: any) => {
    try {
      const versions = await service.listVersions(req.params.agreementId, req.user);
      if (!versions) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.json(ok({ items: versions.map(toServiceAgreementVersionResponse) }));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements", requirePermission("service.agreement.manage"), async (req: any, res: any, next: any) => {
    try {
      const agreement = await service.createAgreement(req.body || {}, req.user);
      return res.status(201).json(ok(toServiceAgreementResponse(agreement)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements/:agreementId/approve", requirePermission("service.agreement.approve"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.approveAgreement(req.params.agreementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.status(result.replayed ? 200 : 200).json(ok(toServiceAgreementResponse(result.updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements/:agreementId/activate", requirePermission("service.agreement.activate"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.activateAgreement(req.params.agreementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.json(ok(toServiceAgreementResponse(result.updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements/:agreementId/suspend", requirePermission("service.agreement.activate"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.suspendAgreement(req.params.agreementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.json(ok(toServiceAgreementResponse(result.updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements/:agreementId/terminate", requirePermission("service.agreement.activate"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.terminateAgreement(req.params.agreementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.json(ok(toServiceAgreementResponse(result.updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });

  app.post("/service-agreements/:agreementId/amendments", requirePermission("service.agreement.manage"), async (req: any, res: any, next: any) => {
    try {
      const result = await service.amendAgreement(req.params.agreementId, req.body || {}, req.user);
      if (!result) return res.status(404).json(fail("NOT_FOUND", "Service agreement not found."));
      return res.status(201).json(ok(toServiceAgreementResponse(result.updated)));
    } catch (error) {
      return handleError(error, res, next);
    }
  });
}
