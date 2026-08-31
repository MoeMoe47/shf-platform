// SHF Ecosystem Phase 12 — External Calendar Integration (ICS/webcal).
//
// Non-negotiable: this is a one-way, read-only export of the exact same
// already-entitled projection GET /calendar/events/me returns. It never
// accepts a write from an external calendar client, never creates an SHF
// source-domain record, and never lets an external edit/delete mutate SHF
// truth (there is no path here that could — this route only reads).
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import { IdentityRepo } from "../../identity/repo/identity-repo.js";
import { mergeRolePermissions } from "../../../auth/security-permissions.js";
import { tenantIdForOrganization } from "../../../auth/tenant-context.js";
import { getCalendarProjectionForActor, CalendarHardFailureError } from "../../calendar/service/calendar-projection-service.js";
import { buildIcsFeed } from "../service/ics-builder.js";
import { rotateFeedToken, revokeFeedToken, getFeedTokenStatus, resolveActorForFeedToken } from "../service/calendar-feed-token-service.js";

const identityRepo = new IdentityRepo();

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

// Independently resolves a full, entitled Calendar actor for a token-
// verified user id — mirrors auth-middleware.ts's own role/permission
// resolution exactly, since this public route runs with no `req.user`
// (an external calendar client cannot send this app's session/dev-token
// auth when polling a subscribed feed URL).
async function actorForFeedToken(rawToken: string) {
  const resolved = await resolveActorForFeedToken(rawToken);
  if (!resolved) return null;
  const user = await identityRepo.getUserById(resolved.user_id);
  if (!user) return null;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const permissions = Array.isArray((user as any).permissions) && (user as any).permissions.length
    ? (user as any).permissions
    : mergeRolePermissions(roles);
  return {
    user_id: resolved.user_id,
    organization_id: resolved.organization_id,
    active_organization_id: resolved.organization_id,
    tenant_id: tenantIdForOrganization(resolved.organization_id),
    roles,
    permissions,
  };
}

export function registerCalendarFeedRoutes(app: any) {
  // Authenticated, self-service, mirrors /calendar/events/me's own
  // permission gate. Status only — never the token or its hash.
  app.get("/calendar/feed-token/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const status = await getFeedTokenStatus(actorFromRequest(req));
      return res.json(ok(status));
    } catch (error) {
      return next(error);
    }
  });

  // Generates/regenerates this learner's one feed token. The raw token is
  // returned exactly once, in this response, and never again — it cannot
  // be recovered later, only rotated (matching the session-token
  // precedent this reuses). Regenerating immediately invalidates any
  // previously distributed subscription URL.
  app.post("/calendar/feed-token/rotate", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const { token } = await rotateFeedToken(actorFromRequest(req));
      return res.json(ok({ token }));
    } catch (error) {
      return next(error);
    }
  });

  app.delete("/calendar/feed-token/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      await revokeFeedToken(actorFromRequest(req));
      return res.json(ok({ revoked: true }));
    } catch (error) {
      return next(error);
    }
  });

  // Public — authenticated only by the opaque, high-entropy `token` query
  // parameter (the standard "secret address" pattern every major calendar
  // provider itself uses for private ICS subscription). No cookie, no
  // Authorization header, no learnerId/userId parameter is ever read for
  // identity. GET, not POST, because every external calendar client
  // (Google Calendar, Outlook, Apple Calendar) fetches subscribed feed
  // URLs via GET only.
  app.get("/calendar/feed.ics", async (req: any, res: any, next: any) => {
    try {
      const rawToken = typeof req.query?.token === "string" ? req.query.token : "";
      const actor = await actorForFeedToken(rawToken);
      if (!actor) return res.status(404).type("text/plain").send("Not found.");
      const projection = await getCalendarProjectionForActor(actor as any, null);
      const ics = buildIcsFeed(projection.items);
      res.set("Cache-Control", "private, max-age=300");
      return res.type("text/calendar; charset=utf-8").send(ics);
    } catch (error) {
      if (error instanceof CalendarHardFailureError) return res.status(503).type("text/plain").send("Temporarily unavailable.");
      return next(error);
    }
  });
}
