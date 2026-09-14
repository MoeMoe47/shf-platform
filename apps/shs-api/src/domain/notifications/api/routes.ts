import { fail, ok } from "../../../api/response-envelope.js";
import * as service from "../service/notification-service.js";
import { resolveAuthorizedOrganizationIds } from "../service/notification-service.js";
import * as preferences from "../service/preference-service.js";

// NCA-2 §11/§34: the only place client input can influence organization
// scope. This is passed to notification-service.ts's scope(), which
// rejects (ORG_CONTEXT_FORBIDDEN) any value not already present in the
// server-resolved actor.memberships — the client cannot widen access by
// supplying an arbitrary id here.
export function requestedOrganizationId(req: any): string | undefined {
  const value = req.query?.organizationId;
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = String(raw || "").trim();
  return trimmed || undefined;
}

// Exported for direct unit testing of the NCA-5 multi-org guard fix (see
// tests/nca5-acceptance.test.ts) — not part of this module's conceptual
// public API surface otherwise; registerNotificationRoutes is.
export function requireNotificationContext(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
  if (req.user.active_organization_id && req.user.tenant_id && !req.user.org_context_error) return next();
  // NCA-5 micro-gap fix: a genuine multi-org user with no single default
  // organization (and, until an EXR org-switcher sends the
  // x-shs-organization-id header, no way to resolve one) previously got
  // ORG_CONTEXT_REQUIRED here unconditionally — even when the request
  // explicitly named one of the caller's own authorized organizations via
  // ?organizationId= (exactly what the canonical inbox's organization
  // filter already sends, and exactly the case NCA-3's org filter/NCA-0
  // §46 exist to support). This does not weaken authorization: it only
  // lets the request continue to service.scope(), which independently
  // re-validates the requested id against resolveAuthorizedOrganizationIds
  // and throws ORG_CONTEXT_FORBIDDEN itself if it is not actually
  // authorized. A request naming no organization, or one the caller is
  // not authorized for, still falls through to the checks below.
  const requested = requestedOrganizationId(req);
  if (requested && resolveAuthorizedOrganizationIds(req.user).includes(requested)) return next();
  // NCA-5 micro-gap fix: surface the actual resolved error code (e.g.
  // ORG_CONTEXT_FORBIDDEN for a request naming an org the caller is not
  // authorized for) instead of always reporting the generic "context not
  // yet selected" code — the two are different situations for a caller to
  // handle (pick an org vs. a real authorization violation worth logging).
  if (req.user.org_context_error) return res.status(403).json(fail(req.user.org_context_error, "Valid active organization context is required."));
  return res.status(403).json(fail("ORG_CONTEXT_REQUIRED", "Valid active organization context is required."));
}

// NCA-5 micro-gap fix: the cross-org aggregate signal below is explicitly
// documented (and implemented in unreadCountsByOrganization) to work from
// req.user.memberships alone, without requiring a single pre-resolved
// active organization — that is precisely the case for a genuine
// multi-org user with no default single-org membership, who previously
// received ORG_CONTEXT_REQUIRED from every notification endpoint,
// including this one, before ever having a chance to pick an org. Only
// authentication is required here; resolveAuthorizedOrganizationIds (and
// unreadCountsByOrganization's own ORG_CONTEXT_REQUIRED check) still
// reject a user with zero memberships.
function requireAuthenticatedUser(req: any, res: any, next: any) {
  if (!req.user) return res.status(401).json(fail("AUTH_REQUIRED", "Authentication required."));
  return next();
}

function statusForError(message: string): number {
  if (message === "NOTIFICATION_NOT_FOUND") return 404;
  if (message.startsWith("Category is not user-suppressible")) return 400;
  return 403;
}

export function registerNotificationRoutes(app: any) {
  app.get("/notifications", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listNotifications(req.user, { organizationId: requestedOrganizationId(req) }) })); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  app.get("/notifications/unread-count", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.unreadCount(req.user, { organizationId: requestedOrganizationId(req) }))); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  app.post("/notifications/:id/read", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.markRead(req.user, req.params.id, { organizationId: requestedOrganizationId(req) }))); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  app.post("/notifications/read-all", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.markAllRead(req.user, { organizationId: requestedOrganizationId(req) }))); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  // NCA-2 §19: dismiss/archive — inbox presentation only, see notification-service.ts.
  app.post("/notifications/:id/archive", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await service.archiveNotification(req.user, req.params.id, { organizationId: requestedOrganizationId(req) }))); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  // NCA-1: canonical attention-item projection (NCA-0 §33 / decision lock §11).
  app.get("/notifications/attention-items", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok({ items: await service.listAttentionItems(req.user, { organizationId: requestedOrganizationId(req) }) })); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  // NCA-1: multi-org aggregate unread signal (NCA_OWNER_DECISION_LOCK.md — Canonical User Inbox).
  // Never hides another authorized organization's notifications; this is the
  // safe, aggregate-only cross-org signal, not a merged cross-org list.
  app.get("/notifications/organizations", requireAuthenticatedUser, async (req: any, res: any) => {
    try { return res.json(ok({ organizations: await service.unreadCountsByOrganization(req.user) })); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  // NCA-2 §16: the smallest canonical preference surface. Always scoped to
  // req.user's own id — a user can only ever read or set their own
  // preferences, never another user's.
  app.get("/notifications/preferences", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok({ preferences: await preferences.listPreferences(req.user.user_id) })); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
  app.put("/notifications/preferences/:category", requireNotificationContext, async (req: any, res: any) => {
    try { return res.json(ok(await preferences.setPreference(req.user.user_id, req.params.category, Boolean(req.body?.inAppEnabled)))); } catch (error: any) { return res.status(statusForError(error.message)).json(fail(error.message, error.message)); }
  });
}
