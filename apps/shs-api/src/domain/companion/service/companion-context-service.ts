// SHF Ecosystem Phase 11 — Companion Context Service.
//
// NON-NEGOTIABLE: reads only. This service aggregates four already-
// canonical, already-entitled read services — Calendar Projection/
// Intelligence, Journey Milestones, Career Pathway, and Credentials —
// exactly as they exist today. It never re-implements their entitlement,
// never recomputes what they already compute, and never persists
// anything. Each of the four reads happens exactly once per request
// (Promise.allSettled), mirroring the same sibling-projection pattern
// Journey Milestones and Calendar Projection already both independently
// use over the same canonical repos — not a new architectural pattern.
import { getCalendarProjectionForActor } from "../../calendar/service/calendar-projection-service.js";
import { computeCalendarIntelligence } from "../../calendar/service/calendar-intelligence-service.js";
import { getExternalAvailabilityForActor } from "../../external-accounts/service/external-availability-service.js";
import { getExternalCalendarProvider } from "../../external-accounts/providers/provider-registry.js";
import { listJourneyMilestonesForLearner } from "../../journey/service/journey-milestone-service.js";
import { deriveLearnerPathway } from "../../career-pathways/service/career-pathway-service.js";
import * as credentialService from "../../credentials/service/credential-service.js";
import {
  CompanionContext, CompanionGuidance, CompanionSource, GUIDANCE_PRIORITY,
} from "../model/companion-context.js";

export interface CompanionActor {
  user_id: string;
  organization_id: string;
  active_organization_id?: string;
  tenant_id?: string;
  roles: string[];
  permissions: string[];
}

// A total, systemic failure (every source down) is a hard failure, not a
// silently-empty partial success — mirrors CalendarHardFailureError.
export class CompanionContextHardFailureError extends Error {
  constructor(public cause: unknown) {
    super("No Companion context source is currently available.");
    this.name = "CompanionContextHardFailureError";
  }
}

function daysUntil(iso: string, from: number): number {
  return Math.floor((new Date(iso).getTime() - from) / 86_400_000);
}

// Pathway-relevant guidance (phase brief §15/§30): highlights a real,
// entitled, still-open Opportunity or Career Event the learner's own
// derived Career Pathway links to — never a claim of eligibility,
// selection odds, or entitlement (entitlement was already enforced by
// the Calendar Projection Service before this item ever reached here).
function pathwayRelevantGuidance(projectionItems: any[]): CompanionGuidance[] {
  const items = projectionItems
    .filter((e) => (e.type === "OPPORTUNITY_DEADLINE" || e.type === "CAREER_EVENT") && e.pathwayRelevant === true)
    .slice(0, 1); // one highlight, never a flood (phase brief §42)
  return items.map((e) => ({
    id: `pathway:${e.id}`,
    mode: "career" as const,
    reasonCode: "PATHWAY_RELEVANT_OPPORTUNITY" as const,
    message: `"${e.title}" is relevant to your career pathway.`,
    relatedSourceIds: [e.id],
    action: { label: "View", url: e.actionUrl },
    priority: GUIDANCE_PRIORITY.PATHWAY_RELEVANT_OPPORTUNITY,
    dismissible: true,
  }));
}

// Maps the Calendar Intelligence Engine's own deterministic recommendations
// (calendar-intelligence-service.ts) into Companion guidance descriptors.
// This is a re-labeling/re-prioritizing pass only — Companion never
// recomputes conflicts, deadlines, or concentration itself (phase brief
// §13/§14/§69).
function guidanceFromCalendarRecommendations(recommendations: any[]): CompanionGuidance[] {
  return recommendations.map((rec, index) => ({
    id: `calendar:${rec.reasonCode}:${index}:${rec.relatedEventIds.join(",")}`,
    mode: "coach" as const,
    reasonCode: rec.reasonCode,
    message: rec.message,
    relatedSourceIds: rec.relatedEventIds,
    action: { label: rec.recommendedAction, url: rec.actionUrl },
    priority: GUIDANCE_PRIORITY[rec.reasonCode as keyof typeof GUIDANCE_PRIORITY] ?? 5,
    dismissible: true,
  }));
}

// `externalProviderLookup` exists solely so tests can inject a
// MockExternalCalendarProvider (mirroring calendar-projection-service.ts's
// own `adaptersOverride` pattern) — production code never passes it,
// which is exactly why real Google/Microsoft credentials are never
// required for a Companion Context test to exercise this integration.
export async function getCompanionContextForActor(
  actor: CompanionActor,
  now: Date = new Date(),
  externalProviderLookup?: Parameters<typeof getExternalAvailabilityForActor>[2],
): Promise<CompanionContext> {
  const [calendarResult, journeyResult, pathwayResult, credentialsResult] = await Promise.allSettled([
    getCalendarProjectionForActor(actor, null),
    listJourneyMilestonesForLearner({ organization_id: actor.organization_id, user_id: actor.user_id }),
    deriveLearnerPathway({ organization_id: actor.organization_id, user_id: actor.user_id }),
    credentialService.listCredentialsForActor(actor as any),
  ]);

  const unavailableSources: CompanionSource[] = [];
  if (calendarResult.status === "rejected") unavailableSources.push("calendar");
  if (journeyResult.status === "rejected") unavailableSources.push("journey");
  if (pathwayResult.status === "rejected") unavailableSources.push("pathway");
  if (credentialsResult.status === "rejected") unavailableSources.push("credentials");

  if (unavailableSources.length === 4) {
    throw new CompanionContextHardFailureError([calendarResult, journeyResult, pathwayResult, credentialsResult]);
  }

  let calendarSummary = null;
  let guidance: CompanionGuidance[] = [];
  if (calendarResult.status === "fulfilled") {
    const projection = calendarResult.value;
    // Phase 12.2 — a bounded 14-day near-term window for external busy
    // data, independent of the unbounded projection Companion otherwise
    // reads; isolated the same way as the /calendar/intelligence/me route
    // (a total failure here never breaks Companion Context itself).
    const externalAvailability = await getExternalAvailabilityForActor(
      actor,
      { from: now.toISOString(), to: new Date(now.getTime() + 14 * 86_400_000).toISOString() },
      externalProviderLookup || getExternalCalendarProvider,
    ).catch(() => ({ intervals: [], complete: false, unavailableProviders: [] as any[] }));
    const intelligence = computeCalendarIntelligence(projection, null, now, externalAvailability);
    calendarSummary = {
      weeklyLoadCategory: intelligence.weeklyLoad.category,
      scheduledEventCount: intelligence.weeklyLoad.scheduledEventCount,
      requiredDeadlineCount: intelligence.weeklyLoad.requiredDeadlineCount,
      conflictCount: intelligence.conflicts.length,
      deadlineConcentrationCount: intelligence.deadlineConcentration.length,
    };
    guidance = [
      ...guidanceFromCalendarRecommendations(intelligence.recommendations),
      ...pathwayRelevantGuidance(projection.items),
    ];
    // Calendar Intelligence's own partial-source signal folds into
    // Companion's — a downstream source it depends on being unavailable
    // must not be silently absorbed into an otherwise-"complete" context.
    if (projection.partial) {
      for (const s of projection.unavailableSources) {
        const label = `calendar:${s}`;
        if (!unavailableSources.includes(label as CompanionSource)) unavailableSources.push(label as CompanionSource);
      }
    }
  }

  let journeySummary = null;
  if (journeyResult.status === "fulfilled") {
    const items = journeyResult.value;
    journeySummary = {
      milestoneCount: items.length,
      completedCount: items.filter((m) => m.status === "completed").length,
    };
  }

  let pathway = null;
  if (pathwayResult.status === "fulfilled") {
    pathway = pathwayResult.value;
  }

  // Credential renewal *guidance* already flows through
  // guidanceFromCalendarRecommendations() above (Calendar Intelligence's
  // own CREDENTIAL_RENEWAL_SOON recommendation, sourced from the same
  // credential renewal dates projected onto the Calendar) — this summary
  // is presentation-only context (e.g. "you hold N credentials"), not a
  // second guidance-generation path.
  let credentialSummary = null;
  if (credentialsResult.status === "fulfilled") {
    const creds = credentialsResult.value.filter((c: any) => c.lifecycle !== "REVOKED");
    credentialSummary = {
      issuedCount: creds.length,
      upcomingRenewalCount: creds.filter((c: any) => {
        if (!c.renewalDueAt) return false;
        const days = daysUntil(c.renewalDueAt, now.getTime());
        return days >= 0 && days <= 30;
      }).length,
    };
  }

  // Deterministic ordering: priority ascending, then id — never incidental
  // array order (phase brief §16/§18).
  guidance.sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : (a.id < b.id ? -1 : 1)));

  return {
    pathway,
    calendar: calendarSummary,
    credentials: credentialSummary,
    journey: journeySummary,
    guidance,
    sourceAvailability: { partial: unavailableSources.length > 0, unavailableSources },
    generatedAt: new Date().toISOString(),
  };
}
