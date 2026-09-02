// SHF AIEL Phase 3 — Personal Accessibility Profile HTTP surface.
//
// Every route is actor-scoped from the authenticated session only — no
// user-id parameter, query string, or body field is ever read for
// identity (docs/SHF_AIEL_PERSISTENCE_API_CONTRACT_V1.md §10/§22). There
// is no admin-override route and no accommodation route in this domain —
// both are structural absences, not permission checks that could be
// misconfigured later.
import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import {
  getProfileForActor,
  patchProfileForActor,
  resetProfileForActor,
  StaleRevisionError,
  PatchValidationError,
  type ResetScope,
} from "../service/accessibility-profile-service.js";

function actorFromRequest(req: any) {
  const organizationId = req.user.active_organization_id || req.user.organization_id;
  return { user_id: req.user.user_id, organization_id: organizationId };
}

// Accepts null/undefined/omitted (first-write case) or a finite integer.
// Any other shape is treated as "no revision supplied," which the service
// layer already handles as a stale-assumption conflict against an
// existing row — never silently coerced to a number.
function parseRevision(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return NaN as unknown as number; // deliberately invalid — never matches a real revision, forcing an honest 409 rather than accidentally succeeding
}

export function registerAccessibilityProfileRoutes(app: any) {
  app.get("/accessibility/profile/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const profile = await getProfileForActor(actorFromRequest(req));
      return res.json(ok(profile));
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/accessibility/profile/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const body = req.body || {};
      const revision = parseRevision(body.revision);
      const profile = await patchProfileForActor(actorFromRequest(req), body.preferences, revision);
      return res.json(ok(profile));
    } catch (error) {
      if (error instanceof PatchValidationError) {
        return res.status(422).json(fail("INVALID_PREFERENCES", error.message, "corr_accessibility_profile_invalid", { issues: error.issues }));
      }
      if (error instanceof StaleRevisionError) {
        return res.status(409).json(fail("STALE_REVISION", "This profile was changed elsewhere. Reload and try again.", "corr_accessibility_profile_stale"));
      }
      return next(error);
    }
  });

  app.post("/accessibility/profile/me/reset", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const body = req.body || {};
      const revision = parseRevision(body.revision);
      const scope: ResetScope = body.group
        ? (body.field ? { kind: "FIELD", group: body.group, field: body.field } : { kind: "GROUP", group: body.group })
        : { kind: "ALL" };
      const profile = await resetProfileForActor(actorFromRequest(req), scope, revision);
      return res.json(ok(profile));
    } catch (error) {
      if (error instanceof StaleRevisionError) {
        return res.status(409).json(fail("STALE_REVISION", "This profile was changed elsewhere. Reload and try again.", "corr_accessibility_profile_stale"));
      }
      return next(error);
    }
  });
}
