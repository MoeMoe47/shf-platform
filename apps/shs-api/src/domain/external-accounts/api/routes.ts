// SHF Ecosystem Phase 12.1/12.2 — External Account Security + Native
// External Calendar Integration HTTP surface.
//
// Every route is actor-scoped from the authenticated session only — no
// connection id, user id, or organization id is ever read from a request
// parameter, query string, or body. The OAuth callback route additionally
// never trusts a caller-supplied identity of any kind (phase brief §9) —
// see external-calendar-connect-service.ts's own header for the full
// reasoning.
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { isExternalAccountProvider } from "../model/external-account-connection.js";
import { listConnectionsForActor, revokeConnection } from "../service/external-account-connection-service.js";
import { startExternalCalendarConnect, completeExternalCalendarConnect, CallbackVerificationError } from "../service/external-calendar-connect-service.js";
import { syncMirrorForActor, MirrorNotReadyError, MirrorSyncInProgressError } from "../service/external-calendar-mirror-service.js";
import { UnsafeReturnPathError } from "../service/oauth-state-service.js";
import { ProviderNotConfiguredError } from "../providers/external-calendar-provider.js";

function actorFromRequest(req: any) {
  const organizationId = req.user.active_organization_id || req.user.organization_id;
  return {
    user_id: req.user.user_id,
    organization_id: organizationId,
    active_organization_id: organizationId,
    tenant_id: req.user.tenant_id,
    roles: req.user.roles || [],
    permissions: req.user.permissions || [],
  };
}

function frontendBaseUrl(): string {
  return String(process.env.SHF_FRONTEND_BASE_URL || "http://localhost:5173").replace(/\/$/, "");
}

export function registerExternalAccountRoutes(app: any) {
  app.get("/external-accounts/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const connections = await listConnectionsForActor(actorFromRequest(req));
      return res.json(ok({ connections }));
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/external-accounts/:provider", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const { provider } = req.params;
      if (!isExternalAccountProvider(provider)) {
        return res.status(404).json(fail("NOT_FOUND", "Unknown provider.", "corr_external_account_provider_unknown"));
      }
      const result = await revokeConnection(actorFromRequest(req), provider);
      if (!result.revoked) {
        return res.status(404).json(fail("NOT_FOUND", "No active connection for this provider.", "corr_external_account_not_found"));
      }
      return res.json(ok({ revoked: true, providerRevocationSucceeded: result.providerRevocationSucceeded }));
    } catch (error) {
      return next(error);
    }
  });

  // Phase 12.2 — real OAuth connect. A GET the browser navigates to
  // directly (never fetch()'d by the SPA), matching every provider's own
  // expectation for the authorization redirect step.
  app.get("/external-accounts/:provider/oauth/start", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const { provider } = req.params;
      if (!isExternalAccountProvider(provider)) {
        return res.status(404).json(fail("NOT_FOUND", "Unknown provider.", "corr_external_account_provider_unknown"));
      }
      const returnPath = typeof req.query?.returnPath === "string" ? req.query.returnPath : "/career/settings";
      const { authorizationUrl } = await startExternalCalendarConnect(actorFromRequest(req), provider, returnPath);
      return res.redirect(302, authorizationUrl);
    } catch (error) {
      if (error instanceof ProviderNotConfiguredError) {
        return res.status(503).json(fail("PROVIDER_NOT_CONFIGURED", `${error.provider} is not configured in this environment.`, "corr_external_calendar_not_configured"));
      }
      if (error instanceof UnsafeReturnPathError) {
        return res.status(400).json(fail("UNSAFE_RETURN_PATH", "returnPath is not an allowed internal path.", "corr_external_calendar_unsafe_return_path"));
      }
      return next(error);
    }
  });

  // The provider redirects the browser back here with `code`/`state`.
  // On success, redirects the browser on to the app's own returnPath —
  // never renders provider response data back to the page.
  app.get("/external-accounts/:provider/oauth/callback", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const { provider } = req.params;
      if (!isExternalAccountProvider(provider)) {
        return res.status(404).json(fail("NOT_FOUND", "Unknown provider.", "corr_external_account_provider_unknown"));
      }
      const code = typeof req.query?.code === "string" ? req.query.code : "";
      const state = typeof req.query?.state === "string" ? req.query.state : "";
      if (!code || !state) {
        return res.status(400).json(fail("INVALID_CALLBACK", "Missing code or state.", "corr_external_calendar_invalid_callback"));
      }
      const { returnPath } = await completeExternalCalendarConnect(actorFromRequest(req), provider, { code, state });
      return res.redirect(302, `${frontendBaseUrl()}${returnPath}?connected=${provider}`);
    } catch (error) {
      if (error instanceof CallbackVerificationError) {
        return res.status(400).json(fail("CALLBACK_VERIFICATION_FAILED", "This authorization request could not be verified.", "corr_external_calendar_callback_failed"));
      }
      if (error instanceof ProviderNotConfiguredError) {
        return res.status(503).json(fail("PROVIDER_NOT_CONFIGURED", `${error.provider} is not configured in this environment.`, "corr_external_calendar_not_configured"));
      }
      return next(error);
    }
  });

  // Triggers one SHF -> provider mirror sync pass for the actor's own
  // connection (phase brief §20-21). No automatic background scheduler
  // exists this phase (see docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md
  // Phase 13 boundary) — this is the one, explicit, user/Settings-UI-
  // triggered entry point.
  app.post("/external-accounts/:provider/sync", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const { provider } = req.params;
      if (!isExternalAccountProvider(provider)) {
        return res.status(404).json(fail("NOT_FOUND", "Unknown provider.", "corr_external_account_provider_unknown"));
      }
      const result = await syncMirrorForActor(actorFromRequest(req), provider);
      return res.json(ok(result));
    } catch (error) {
      if (error instanceof MirrorNotReadyError) {
        const code = error.reason === "no_active_connection" ? "NO_ACTIVE_CONNECTION" : "REAUTH_REQUIRED";
        return res.status(409).json(fail(code, "This connection is not ready to sync.", "corr_external_calendar_mirror_not_ready"));
      }
      // Phase 14 defect fix: this branch was previously missing — a
      // Phase 13 advisory-lock rejection (e.g. the background worker and
      // an on-demand request both landing on the same connection) fell
      // through to the generic error handler, likely surfacing as an
      // unstructured 500 for a condition that is transient and expected
      // to clear within moments. Never auto-retried server-side (phase
      // brief §62's own "offer retry, do not silently loop" guidance) —
      // the caller (Settings UI) is expected to let the user retry.
      if (error instanceof MirrorSyncInProgressError) {
        return res.status(409).json(fail("SYNC_IN_PROGRESS", "A sync for this connection is already in progress. Try again shortly.", "corr_external_calendar_sync_in_progress"));
      }
      return next(error);
    }
  });
}
