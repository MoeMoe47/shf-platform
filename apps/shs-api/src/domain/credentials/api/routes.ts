import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { SHS_SECURITY_PERMISSIONS } from "../../../auth/security-permissions.js";
import * as service from "../service/credential-service.js";
import { CredentialError } from "../service/credential-service.js";
import * as certificateService from "../service/certificate-service.js";
import { programCompletionService } from "../../programs/service/program-completion-service.js";

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
  app.get("/certificates/verify/:reference", async (req: any, res: any, next: any) => {
    try {
      const result = await certificateService.verifyCertificate(String(req.params.reference || ""));
      if (!result) return res.status(404).json(fail("CERTIFICATE_NOT_FOUND", "Certificate verification reference not found."));
      return res.json(ok(result));
    } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.get("/credentials/certificates/profiles", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (_req: any, res: any, next: any) => {
    try { return res.json(ok({ items: certificateService.listCertificateProfiles() })); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/eligibility", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await certificateService.evaluateCertificateEligibility(actorFromRequest(req), req.body || {}))); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.get("/credentials/programs/:programId/completion", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await programCompletionService.evaluate(actorFromRequest(req), req.query?.learner_id || undefined, req.params.programId))); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/issue", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await certificateService.issueCertificate(actorFromRequest(req), req.body || {}))); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.get("/credentials/certificates/me", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { return res.json(ok({ items: await certificateService.listCertificates(actorFromRequest(req)) })); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.get("/credentials/certificates/:id", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { const item = await certificateService.getCertificate(actorFromRequest(req), req.params.id); if (!item) return res.status(404).json(fail("CERTIFICATE_NOT_FOUND", "Certificate not found.")); return res.json(ok(item)); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/:id/render", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { const format = String(req.body?.format || "PDF").toUpperCase(); if (!["HTML", "PDF"].includes(format)) return res.status(400).json(fail("CERTIFICATE_FORMAT_INVALID", "Only HTML and PDF are supported.")); const output = await certificateService.renderIssuedCertificate(actorFromRequest(req), req.params.id, format as "HTML" | "PDF"); return res.json(ok({ renderId: output.render.certificate_render_id, filename: output.filename, mimeType: output.mimeType, hash: output.hash, bytesBase64: output.bytes.toString("base64") })); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.get("/credentials/certificates/:id/files/:renderId", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { const output = await certificateService.downloadRenderedCertificate(actorFromRequest(req), req.params.id, req.params.renderId); res.setHeader("Content-Type", output.mimeType); res.setHeader("Content-Disposition", `attachment; filename="${output.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}"`); res.setHeader("Cache-Control", "private, no-store"); return res.send(output.bytes); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/:id/email", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_VIEW), async (req: any, res: any, next: any) => {
    try { const result = await certificateService.emailIssuedCertificate(actorFromRequest(req), req.params.id); if (!result.delivered) return res.status(503).json(fail(result.reason, "Certificate delivery was not completed.")); return res.json(ok(result)); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/:id/revoke", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_REVOKE), async (req: any, res: any, next: any) => {
    try { return res.json(ok(await certificateService.revokeIssuedCertificate(actorFromRequest(req), req.params.id, req.body?.reason))); } catch (error) { return sendCredentialError(error, res, next); }
  });

  app.post("/credentials/certificates/:id/replace", requirePermission(SHS_SECURITY_PERMISSIONS.CREDENTIAL_ISSUE), async (req: any, res: any, next: any) => {
    try { return res.status(201).json(ok(await certificateService.replaceIssuedCertificate(actorFromRequest(req), req.params.id))); } catch (error) { return sendCredentialError(error, res, next); }
  });

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
