import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/credential-service.js";
import { CredentialError } from "../service/credential-service.js";

function actorFromRequest(req: any) {
  return {
    user_id: req.user.user_id,
    organization_id: req.user.active_organization_id || req.user.organization_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function sendCredentialError(error: any, res: any, next: any) {
  if (error instanceof CredentialError) return res.status(error.statusCode).json(fail(error.code, error.message));
  return next(error);
}

export function registerCredentialRoutes(app: any) {
  app.get("/credentials/definitions", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (_req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listCredentialDefinitions() }));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  app.post("/credentials/definitions", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_DEFINITION_MANAGE), async (req: any, res: any, next: any) => {
    try {
      const created = await service.createCredentialDefinition(actorFromRequest(req), req.body || {});
      return res.status(201).json(ok(created));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  // Self-service eligibility check — no client-suppliable learnerUserId;
  // always the authenticated actor's own eligibility, mirroring
  // GET /careers/pathway/me.
  app.get("/credentials/definitions/:id/eligibility/me", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.isEligibleForCredential(actorFromRequest(req), req.params.id)));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  app.post("/credentials/issue", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE), async (req: any, res: any, next: any) => {
    try {
      const issued = await service.issueCredential(actorFromRequest(req), {
        credentialDefinitionId: String(req.body?.credentialDefinitionId || ""),
        learnerUserId: String(req.body?.learnerUserId || ""),
      });
      return res.status(201).json(ok(issued));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  app.post("/credentials/:id/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_REVOKE), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok(await service.revokeCredential(actorFromRequest(req), req.params.id)));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  app.get("/credentials/me", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try {
      return res.json(ok({ items: await service.listCredentialsForActor(actorFromRequest(req)) }));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });

  app.get("/credentials/:id", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try {
      const item = await service.getCredentialForActor(actorFromRequest(req), req.params.id);
      if (!item) return res.status(404).json(fail("LEARNER_CREDENTIAL_NOT_FOUND", "Credential not found."));
      return res.json(ok(item));
    } catch (error) {
      return sendCredentialError(error, res, next);
    }
  });
}
