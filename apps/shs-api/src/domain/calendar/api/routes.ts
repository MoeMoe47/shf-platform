import { fail, ok } from "../../../api/response-envelope.js";
import { requirePermission } from "../../../auth/permission-guard.js";
import {
  getCalendarProjectionForActor, parseCalendarRange, CalendarRangeError, CalendarHardFailureError,
} from "../service/calendar-projection-service.js";
import { computeCalendarIntelligence } from "../service/calendar-intelligence-service.js";
import { getExternalAvailabilityForActor } from "../../external-accounts/service/external-availability-service.js";

// Phase 10 default range: a rolling 7-day forward window from request time
// (matching the pre-existing frontend "Due This Week" convention in
// SummaryRow.jsx — `todayStart` to `addDays(todayStart, 7)`), not a
// Sunday-Saturday calendar week the frontend never actually used. All
// boundary math is instant-based (UTC epoch milliseconds via
// `Date.getTime()`), never server-local time — see
// docs/SHF_CALENDAR_INTELLIGENCE.md's Timezone Semantics section for why no
// client-suppliable timezone parameter was added this phase.
function defaultIntelligenceRange(): { from: Date; to: Date } {
  const from = new Date();
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}

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

export function registerCalendarRoutes(app: any) {
  // Self-service only — no client-suppliable learnerId, mirroring GET
  // /careers/pathway/me and GET /journey/milestones/me. Gated by
  // "enrollment.view" (the same broadly-held, minimal permission those
  // two self-service endpoints use) rather than any single source
  // domain's permission — each of the six adapters re-asserts its own
  // domain's permission internally (see calendar-adapters.ts), so an
  // actor only ever sees the sources they are genuinely entitled to.
  app.get("/calendar/events/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const range = parseCalendarRange(
        typeof req.query?.from === "string" ? req.query.from : undefined,
        typeof req.query?.to === "string" ? req.query.to : undefined,
      );
      const result = await getCalendarProjectionForActor(actorFromRequest(req), range);
      return res.json(ok(result));
    } catch (error) {
      if (error instanceof CalendarRangeError) return res.status(400).json(fail(error.code, error.message));
      if (error instanceof CalendarHardFailureError) return res.status(503).json(fail("CALENDAR_UNAVAILABLE", "The Calendar is temporarily unavailable."));
      return next(error);
    }
  });

  // Phase 10 — Calendar Intelligence. Derived advice only (see
  // calendar-intelligence-service.ts's own non-ownership header): this
  // route calls the Projection Service exactly once and computes
  // everything else in-memory. No learnerId/userId query param is read for
  // identity, matching /calendar/events/me. A Projection Service hard
  // failure (every source producer down) hard-fails Intelligence the same
  // way, rather than returning fabricated empty "all clear" advice.
  app.get("/calendar/intelligence/me", requirePermission("enrollment.view"), async (req: any, res: any, next: any) => {
    try {
      const parsedRange = parseCalendarRange(
        typeof req.query?.from === "string" ? req.query.from : undefined,
        typeof req.query?.to === "string" ? req.query.to : undefined,
      );
      const range = parsedRange || defaultIntelligenceRange();
      const actor = actorFromRequest(req);
      const projection = await getCalendarProjectionForActor(actor, range);
      // Phase 12.2 — external availability is fetched once here and
      // isolated: a total failure of this call (rare — the service
      // itself already isolates per-connection provider failures) must
      // never break Calendar Intelligence itself (phase brief §33).
      const externalAvailability = await getExternalAvailabilityForActor(
        actor,
        { from: range.from.toISOString(), to: range.to.toISOString() },
      ).catch(() => ({ intervals: [], complete: false, unavailableProviders: [] as any[] }));
      const intelligence = computeCalendarIntelligence(projection, range, new Date(), externalAvailability);
      return res.json(ok(intelligence));
    } catch (error) {
      if (error instanceof CalendarRangeError) return res.status(400).json(fail(error.code, error.message));
      if (error instanceof CalendarHardFailureError) return res.status(503).json(fail("CALENDAR_UNAVAILABLE", "Calendar Intelligence is temporarily unavailable."));
      return next(error);
    }
  });
}
