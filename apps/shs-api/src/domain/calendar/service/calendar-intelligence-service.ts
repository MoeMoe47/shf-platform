// SHF Ecosystem Phase 10 — Calendar Intelligence Engine.
//
// NON-NEGOTIABLE: this module owns no institutional truth and computes no
// new schedule. It derives advice — classification, counts, conflicts,
// concentration, and recommendations — entirely from the one already-
// entitled, already-deduped, already-ordered result of
// getCalendarProjectionForActor() (calendar-projection-service.ts). It
// calls the Projection Service exactly once per request; it never queries
// a source domain directly and never re-implements entitlement.
//
// A high load category is not academic risk. A detected conflict is not a
// mutation of either event. A recommendation is advice a learner can take
// or ignore — never a required schedule, never a saved Calendar record,
// and never evidence that anything did or did not happen.
import { CalendarEventProjection, CalendarEventType } from "../model/calendar-event.js";
import { CalendarProjectionResult } from "./calendar-projection-service.js";

// ---------------------------------------------------------------------------
// 1. Planning classification (Phase 10 §7)
//
// A projected event's Phase 9 `type` does not by itself say whether it
// consumes real time, is a deadline to act on, or is only a milestone date.
// This table is the one deterministic source of that distinction — audited
// against calendar-adapters.ts's actual field population, not assumed:
//
//   ASSIGNMENT_DUE        dueAt set, no endsAt            -> DEADLINE
//   LIVE_SESSION          startsAt+endsAt real interval    -> SCHEDULED_TIME
//   CAREER_EVENT          startsAt+endsAt real interval    -> SCHEDULED_TIME
//   OPPORTUNITY_DEADLINE  dueAt set, optional pursuit       -> DEADLINE (weighted separately, see REQUIRED_DEADLINE_TYPES)
//   PROJECT_START         startsAt only, no dueAt           -> MILESTONE_DATE
//   PROJECT_DUE           dueAt set                         -> DEADLINE
//   PROJECT_PRESENTATION  startsAt only, no endsAt today    -> SCHEDULED_TIME (zero-duration instant; see §3)
//   CREDENTIAL_RENEWAL    dueAt set, actionable             -> DEADLINE
//   CREDENTIAL_EXPIRATION dueAt is populated in the Phase 9 DTO for the
//                         "Upcoming Deadlines" UI, but expiration is a risk/
//                         milestone date, not a task the learner must act on
//                         by that date (renewal, if available, is the actual
//                         actionable deadline) -> MILESTONE_DATE
export type PlanningKind = "SCHEDULED_TIME" | "DEADLINE" | "MILESTONE_DATE" | "INFORMATIONAL";

export const PLANNING_KIND_BY_TYPE: Record<CalendarEventType, PlanningKind> = {
  ASSIGNMENT_DUE: "DEADLINE",
  LIVE_SESSION: "SCHEDULED_TIME",
  CAREER_EVENT: "SCHEDULED_TIME",
  OPPORTUNITY_DEADLINE: "DEADLINE",
  PROJECT_START: "MILESTONE_DATE",
  PROJECT_DUE: "DEADLINE",
  PROJECT_PRESENTATION: "SCHEDULED_TIME",
  CREDENTIAL_RENEWAL: "DEADLINE",
  CREDENTIAL_EXPIRATION: "MILESTONE_DATE",
};

// Deadlines a learner is institutionally required to meet, as opposed to an
// optional pursuit (Opportunity) — used to keep load/concentration severity
// honest per Phase 10 §28 ("do not count [Opportunity deadlines] exactly the
// same as mandatory academic deadlines without explicit weighting").
const REQUIRED_DEADLINE_TYPES = new Set<CalendarEventType>([
  "ASSIGNMENT_DUE", "PROJECT_DUE", "CREDENTIAL_RENEWAL",
]);

function planningKind(event: CalendarEventProjection): PlanningKind {
  return PLANNING_KIND_BY_TYPE[event.type] || "INFORMATIONAL";
}

function isCapstone(event: CalendarEventProjection): boolean {
  return (event.metadata as any)?.projectType === "CAPSTONE";
}

// A "major" deadline gets extra weight in load/recommendation surfacing —
// never an invented duration, only a documented significance flag. Capstone
// due dates are the one case product semantics already treat as higher
// significance than an ordinary Project (Phase 6); an explicit "high"
// priority (not currently set by any adapter, but honored if one ever is)
// is the other.
function isMajorDeadline(event: CalendarEventProjection): boolean {
  if (event.priority === "high") return true;
  return event.type === "PROJECT_DUE" && isCapstone(event);
}

// ---------------------------------------------------------------------------
// 2. Effective interval — every event reduced to [start, end] instants.
// An event with no endsAt (every DEADLINE/MILESTONE_DATE type, and
// PROJECT_PRESENTATION as currently modeled) is treated as a zero-duration
// point, exactly matching calendar-projection-service.ts's own
// overlapsRange() convention — never a fabricated duration.
function effectiveInterval(event: CalendarEventProjection): { start: number; end: number } {
  const start = new Date(event.startsAt).getTime();
  const end = event.endsAt ? new Date(event.endsAt).getTime() : start;
  return { start, end };
}

function scheduledMinutes(event: CalendarEventProjection): number {
  if (!event.endsAt) return 0; // never invent a duration for a point-in-time event
  const { start, end } = effectiveInterval(event);
  return Math.max(0, Math.round((end - start) / 60_000));
}

// ---------------------------------------------------------------------------
// 3. Conflict detection (Phase 10 §12-14)
//
// A HARD_CONFLICT requires two SCHEDULED_TIME events whose intervals
// genuinely overlap: `a.start < b.end && b.start < a.end`, using strict
// inequality on both sides. Documented policy for the boundary cases this
// leaves open (Phase 10 §50 test 4):
//   - Two intervals that merely touch (one ends exactly when the other
//     starts) are NOT a conflict — back-to-back scheduling is normal and
//     is deliberately not flagged (BACK_TO_BACK is the separate, distinct
//     concept Phase 10 §14 warns not to conflate with HARD_CONFLICT; it is
//     not implemented this phase — no deterministic minimum-transition-gap
//     policy exists anywhere in the product to justify one, so it is
//     omitted rather than fabricated).
//   - Two zero-duration instants (e.g. two Project presentations) at the
//     exact same moment are NOT flagged under the strict `<` rule, since
//     each one's own "end" equals its own "start." This is a conservative,
//     documented choice (avoids false positives) rather than an oversight.
export type ConflictType = "HARD_CONFLICT";

export interface CalendarConflict {
  type: ConflictType;
  eventIds: [string, string];
  events: [CalendarEventProjection, CalendarEventProjection];
}

// SHF Ecosystem Phase 12.2 — an EXTERNAL_BUSY_CONFLICT is a deliberately
// distinct type from HARD_CONFLICT (phase brief §29/§43: "preserve
// distinction... do not combine them into one opaque conflict category").
// A HARD_CONFLICT is certain — both sides are SHF's own institutional
// truth. An EXTERNAL_BUSY_CONFLICT is advisory — the "busy" side is a
// third-party calendar this app does not own and only has read access to
// at all if the learner chose to connect it; it is never upgraded to
// HARD_CONFLICT severity or language.
export interface ExternalBusyConflict {
  type: "EXTERNAL_BUSY_CONFLICT";
  eventId: string;
  event: CalendarEventProjection;
  provider: string;
  busyInterval: { startsAt: string; endsAt: string };
}

function intervalsOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

function detectExternalBusyConflicts(
  scheduledEvents: CalendarEventProjection[],
  externalBusyIntervals: Array<{ provider: string; startsAt: string; endsAt: string }>,
): ExternalBusyConflict[] {
  const conflicts: ExternalBusyConflict[] = [];
  for (const event of scheduledEvents) {
    const eventInterval = effectiveInterval(event);
    for (const busy of externalBusyIntervals) {
      const busyInterval = { start: new Date(busy.startsAt).getTime(), end: new Date(busy.endsAt).getTime() };
      if (intervalsOverlap(eventInterval, busyInterval)) {
        conflicts.push({ type: "EXTERNAL_BUSY_CONFLICT", eventId: event.id, event, provider: busy.provider, busyInterval: { startsAt: busy.startsAt, endsAt: busy.endsAt } });
      }
    }
  }
  return conflicts;
}

// O(n^2) pairwise comparison is deliberate: the input is one actor's own
// entitled, already-bounded event set (typically a handful per week), not a
// system-wide dataset — a sorted sweep would add complexity Phase 10 §13
// itself only requires "if event volume warrants it."
function detectConflicts(scheduledEvents: CalendarEventProjection[]): CalendarConflict[] {
  const conflicts: CalendarConflict[] = [];
  for (let i = 0; i < scheduledEvents.length; i++) {
    for (let j = i + 1; j < scheduledEvents.length; j++) {
      const a = scheduledEvents[i];
      const b = scheduledEvents[j];
      if (intervalsOverlap(effectiveInterval(a), effectiveInterval(b))) {
        conflicts.push({ type: "HARD_CONFLICT", eventIds: [a.id, b.id], events: [a, b] });
      }
    }
  }
  return conflicts;
}

// ---------------------------------------------------------------------------
// 4. Deadline concentration (Phase 10 §15-16)
//
// A cluster is 2+ DEADLINE-kind events whose instants fall within a single
// rolling 48-hour window — one documented, deterministic policy (chosen
// over separate same-day/24h/48h/7-day variants for a single unambiguous
// rule). Severity is count-based, never emotion-oriented language:
//   2 events in the window  -> ELEVATED
//   3+ events in the window -> HIGH
// Required (ASSIGNMENT_DUE/PROJECT_DUE/CREDENTIAL_RENEWAL) and optional
// (OPPORTUNITY_DEADLINE) deadlines are both eligible to form a cluster, but
// each cluster reports its required/optional composition separately so an
// all-optional cluster is never described the same as a mandatory one.
const CONCENTRATION_WINDOW_MS = 48 * 60 * 60 * 1000;

export type ConcentrationSeverity = "ELEVATED" | "HIGH";

export interface DeadlineCluster {
  windowStart: string;
  windowEnd: string;
  eventIds: string[];
  requiredCount: number;
  optionalCount: number;
  severity: ConcentrationSeverity;
}

function severityFor(count: number): ConcentrationSeverity {
  return count >= 3 ? "HIGH" : "ELEVATED";
}

function detectDeadlineConcentration(deadlineEvents: CalendarEventProjection[]): DeadlineCluster[] {
  const sorted = [...deadlineEvents].sort((a, b) => effectiveInterval(a).start - effectiveInterval(b).start);
  const rawClusters: { members: CalendarEventProjection[] }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const anchor = effectiveInterval(sorted[i]).start;
    const members = [sorted[i]];
    for (let j = i + 1; j < sorted.length; j++) {
      if (effectiveInterval(sorted[j]).start - anchor <= CONCENTRATION_WINDOW_MS) {
        members.push(sorted[j]);
      } else {
        break;
      }
    }
    if (members.length >= 2) rawClusters.push({ members });
  }

  // Collapse anchor-by-anchor clusters into maximal, non-duplicate windows:
  // keep only a cluster that is not a strict subset of a later, larger one
  // anchored earlier in the same run.
  const maximal = rawClusters.filter((cluster, idx) => {
    return !rawClusters.some((other, otherIdx) => {
      if (otherIdx === idx) return false;
      const isSuperset = cluster.members.every((m) => other.members.includes(m));
      return isSuperset && other.members.length > cluster.members.length;
    });
  });

  // Dedupe identical member-sets (can arise when two anchors produce the
  // same maximal window).
  const seenKeys = new Set<string>();
  const clusters: DeadlineCluster[] = [];
  for (const { members } of maximal) {
    const key = members.map((m) => m.id).sort().join(",");
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    const starts = members.map((m) => effectiveInterval(m).start);
    const requiredCount = members.filter((m) => REQUIRED_DEADLINE_TYPES.has(m.type)).length;
    const optionalCount = members.length - requiredCount;
    clusters.push({
      windowStart: new Date(Math.min(...starts)).toISOString(),
      windowEnd: new Date(Math.max(...starts)).toISOString(),
      eventIds: members.map((m) => m.id),
      requiredCount,
      optionalCount,
      severity: severityFor(members.length),
    });
  }
  return clusters;
}

// ---------------------------------------------------------------------------
// 5. Planning windows (Phase 10 §22-23)
//
// "SHF-unoccupied" is not "personal free time" — the absence of a canonical
// event only means nothing SHF-scheduled is projected there; the learner
// may have school, work, family, or other real obligations this system has
// no visibility into. Windows are computed only between real-duration
// SCHEDULED_TIME intervals (LIVE_SESSION/CAREER_EVENT today) within the
// requested range, clipped to the range's own bounds.
export interface PlanningWindow {
  start: string;
  end: string;
  label: string;
}

const PLANNING_WINDOW_LABEL = "No SHF-scheduled event is currently projected during this window.";
// Phase 12.2 approved language (phase brief §30): once external busy data
// has actually been factored in, the window label must say so — but must
// never claim certainty ("you are definitely free") that connected-
// calendar data alone cannot back up.
const PLANNING_WINDOW_LABEL_WITH_EXTERNAL = "No known scheduled conflict is visible in your connected calendar data during this window.";

function computePlanningWindows(
  scheduledEvents: CalendarEventProjection[],
  range: { from: Date; to: Date } | null,
  externalBusyIntervals: Array<{ startsAt: string; endsAt: string }> = [],
): PlanningWindow[] {
  if (!range) return [];
  const label = externalBusyIntervals.length > 0 ? PLANNING_WINDOW_LABEL_WITH_EXTERNAL : PLANNING_WINDOW_LABEL;
  // Planning windows exclude SHF scheduled intervals AND known external
  // busy intervals (phase brief §31) — merging both interval sets before
  // carving windows is what "exclude" means here; a window is only ever
  // reported in the gap left after subtracting everything this app can
  // see, whichever source it came from.
  const intervals = scheduledEvents
    .filter((e) => e.endsAt)
    .map((e) => effectiveInterval(e))
    .concat(externalBusyIntervals.map((b) => ({ start: new Date(b.startsAt).getTime(), end: new Date(b.endsAt).getTime() })))
    .sort((a, b) => a.start - b.start);

  const windows: PlanningWindow[] = [];
  let cursor = range.from.getTime();
  const rangeEnd = range.to.getTime();
  for (const interval of intervals) {
    const start = Math.max(cursor, range.from.getTime());
    if (interval.start > start && interval.start <= rangeEnd) {
      windows.push({ start: new Date(start).toISOString(), end: new Date(interval.start).toISOString(), label });
    }
    cursor = Math.max(cursor, interval.end);
  }
  if (cursor < rangeEnd) {
    windows.push({ start: new Date(Math.max(cursor, range.from.getTime())).toISOString(), end: new Date(rangeEnd).toISOString(), label: PLANNING_WINDOW_LABEL });
  }
  return windows;
}

// ---------------------------------------------------------------------------
// 6. Weekly load (Phase 10 §8-10)
//
// Transparent components only — never a fabricated "hours of work" or an
// opaque percentage. A bounded LOW/MODERATE/HIGH/VERY_HIGH category is
// derived from a documented, explainable formula:
//
//   pressureUnits = scheduledEventCount + requiredDeadlineCount + majorDeadlineCount
//
// (a major deadline counts twice — once as an ordinary required deadline,
// once again for its extra significance — this is a deliberate, documented
// weighting, not an accident). Thresholds (<=2 / <=5 / <=8 / >8) are carried
// forward unchanged from the pre-Phase-10 SummaryRow.jsx heuristic so the
// existing Weekly Load bar's visual meaning does not shift under users —
// only its *inputs* become real typed components instead of a raw,
// type-blind event count.
export type LoadCategory = "LOW" | "MODERATE" | "HIGH" | "VERY_HIGH";

export interface WeeklyLoad {
  scheduledEventCount: number;
  scheduledMinutes: number;
  deadlineCount: number;
  requiredDeadlineCount: number;
  optionalDeadlineCount: number;
  majorDeadlineCount: number;
  presentationCount: number;
  opportunityDeadlineCount: number;
  renewalDeadlineCount: number;
  category: LoadCategory;
}

function categoryFor(pressureUnits: number): LoadCategory {
  if (pressureUnits <= 2) return "LOW";
  if (pressureUnits <= 5) return "MODERATE";
  if (pressureUnits <= 8) return "HIGH";
  return "VERY_HIGH";
}

function computeWeeklyLoad(events: CalendarEventProjection[]): WeeklyLoad {
  const scheduled = events.filter((e) => planningKind(e) === "SCHEDULED_TIME");
  const deadlines = events.filter((e) => planningKind(e) === "DEADLINE");
  const requiredDeadlines = deadlines.filter((e) => REQUIRED_DEADLINE_TYPES.has(e.type));
  const optionalDeadlines = deadlines.filter((e) => !REQUIRED_DEADLINE_TYPES.has(e.type));
  const majorDeadlines = deadlines.filter(isMajorDeadline);

  const scheduledEventCount = scheduled.length;
  const requiredDeadlineCount = requiredDeadlines.length;
  const majorDeadlineCount = majorDeadlines.length;
  const pressureUnits = scheduledEventCount + requiredDeadlineCount + majorDeadlineCount;

  return {
    scheduledEventCount,
    scheduledMinutes: scheduled.reduce((sum, e) => sum + scheduledMinutes(e), 0),
    deadlineCount: deadlines.length,
    requiredDeadlineCount,
    optionalDeadlineCount: optionalDeadlines.length,
    majorDeadlineCount,
    presentationCount: events.filter((e) => e.type === "PROJECT_PRESENTATION").length,
    opportunityDeadlineCount: events.filter((e) => e.type === "OPPORTUNITY_DEADLINE").length,
    renewalDeadlineCount: events.filter((e) => e.type === "CREDENTIAL_RENEWAL").length,
    category: categoryFor(pressureUnits),
  };
}

// ---------------------------------------------------------------------------
// 7. Recommendations (Phase 10 §24-26)
//
// Every recommendation is deterministic, traceable to real event ids, and
// advisory in language — never "you must," never a claim of personal free
// time, never a save/mutation of anything.
export type RecommendationReasonCode =
  | "CONFLICT" | "DEADLINE_CONCENTRATION" | "DEADLINE_SOON" | "CREDENTIAL_RENEWAL_SOON" | "EXTERNAL_BUSY_CONFLICT";
export type RecommendationSeverity = "ELEVATED" | "HIGH";

export interface CalendarRecommendation {
  reasonCode: RecommendationReasonCode;
  message: string;
  severity: RecommendationSeverity;
  relatedEventIds: string[];
  recommendedAction: string;
  actionUrl: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(instant: number, from: number): number {
  return Math.floor((instant - from) / DAY_MS);
}

function proximityWord(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function buildRecommendations(
  conflicts: CalendarConflict[],
  externalConflicts: ExternalBusyConflict[],
  clusters: DeadlineCluster[],
  deadlineEvents: CalendarEventProjection[],
  milestoneEvents: CalendarEventProjection[],
  now: number,
): CalendarRecommendation[] {
  const recommendations: CalendarRecommendation[] = [];

  for (const conflict of conflicts) {
    const [a, b] = conflict.events;
    recommendations.push({
      reasonCode: "CONFLICT",
      message: `Two scheduled events overlap: "${a.title}" and "${b.title}".`,
      severity: "HIGH",
      relatedEventIds: conflict.eventIds,
      recommendedAction: "Review your schedule",
      actionUrl: a.actionUrl || b.actionUrl || null,
    });
  }

  // One recommendation per SHF event that has at least one external busy
  // overlap (never one per overlapping interval, and never more than once
  // per event — avoids flooding when a learner's connected calendar has
  // several small overlapping blocks). Deliberately never names the
  // external event or provider details beyond "your connected calendar"
  // (phase brief §32/§45: no private external title, no inferred cause).
  const externalConflictEventIds = [...new Set(externalConflicts.map((c) => c.eventId))];
  for (const eventId of externalConflictEventIds) {
    const conflict = externalConflicts.find((c) => c.eventId === eventId)!;
    recommendations.push({
      reasonCode: "EXTERNAL_BUSY_CONFLICT",
      message: `"${conflict.event.title}" overlaps a busy period on your connected calendar.`,
      severity: "ELEVATED",
      relatedEventIds: [eventId],
      recommendedAction: "Review your schedule",
      actionUrl: conflict.event.actionUrl,
    });
  }

  for (const cluster of clusters) {
    const count = cluster.eventIds.length;
    const composition = cluster.optionalCount > 0 && cluster.requiredCount > 0
      ? ` (${cluster.requiredCount} required, ${cluster.optionalCount} optional)`
      : cluster.optionalCount > 0 ? " (optional opportunity deadlines)" : "";
    recommendations.push({
      reasonCode: "DEADLINE_CONCENTRATION",
      message: `${count} deadlines fall within 48 hours of each other${composition}.`,
      severity: cluster.severity,
      relatedEventIds: cluster.eventIds,
      recommendedAction: "Consider prioritizing these first",
      actionUrl: null,
    });
  }

  // Only required deadlines get a "soon" nudge — an optional Opportunity
  // deadline approaching is discoverability, not academic pressure (§28).
  for (const event of deadlineEvents) {
    if (!REQUIRED_DEADLINE_TYPES.has(event.type) && event.type !== "CREDENTIAL_RENEWAL") continue;
    if (event.type === "CREDENTIAL_RENEWAL") continue; // handled separately below with its own 14-day policy
    const due = effectiveInterval(event).start;
    const days = daysUntil(due, now);
    if (days < 0 || days > 3) continue;
    recommendations.push({
      reasonCode: "DEADLINE_SOON",
      message: `"${event.title}" is due ${proximityWord(days)}.`,
      severity: days <= 1 ? "HIGH" : "ELEVATED",
      relatedEventIds: [event.id],
      recommendedAction: "Review before it's due",
      actionUrl: event.actionUrl,
    });
  }

  for (const event of deadlineEvents) {
    if (event.type !== "CREDENTIAL_RENEWAL") continue;
    const due = effectiveInterval(event).start;
    const days = daysUntil(due, now);
    if (days < 0 || days > 14) continue;
    recommendations.push({
      reasonCode: "CREDENTIAL_RENEWAL_SOON",
      message: `"${event.title}" is due ${proximityWord(days)}.`,
      severity: days <= 3 ? "HIGH" : "ELEVATED",
      relatedEventIds: [event.id],
      recommendedAction: "Review renewal requirements",
      actionUrl: event.actionUrl,
    });
  }

  // Deterministic ordering: severity (HIGH before ELEVATED), then earliest
  // related event id — never incidental array order.
  recommendations.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === "HIGH" ? -1 : 1;
    return a.relatedEventIds[0] < b.relatedEventIds[0] ? -1 : 1;
  });
  void milestoneEvents; // milestones are intentionally excluded from recommendations (§29: expiration is risk, not a task)
  return recommendations;
}

// ---------------------------------------------------------------------------
// 8. Source-availability-aware analysis labels (Phase 10 §38-40)
//
// If a producer that could contribute SCHEDULED_TIME or DEADLINE events is
// down, the corresponding analysis must say so rather than silently report
// "no conflicts" / "no concentration" as if it were a complete answer.
const SCHEDULED_TIME_SOURCES = new Set(["live-learning", "career-events", "projects"]);
const DEADLINE_SOURCES = new Set(["assignments", "opportunities", "projects", "credentials"]);

// Phase 12.2 — optional external-availability input. Defaulting to empty/
// complete preserves exact Phase 10/11 behavior for every existing caller
// that does not pass a 4th argument: zero external conflicts, and the
// original (unchanged) planning-window label — see
// docs/SHF_CALENDAR_INTELLIGENCE.md's Phase 12.2 boundary section.
export interface ExternalAvailabilityInput {
  intervals: Array<{ provider: string; startsAt: string; endsAt: string }>;
  complete: boolean;
  unavailableProviders: string[];
}

const NO_EXTERNAL_AVAILABILITY: ExternalAvailabilityInput = { intervals: [], complete: true, unavailableProviders: [] };

export interface CalendarIntelligenceResult {
  range: { from: string | null; to: string | null };
  weeklyLoad: WeeklyLoad;
  conflicts: CalendarConflict[];
  conflictAnalysisComplete: boolean;
  externalConflicts: ExternalBusyConflict[];
  deadlineConcentration: DeadlineCluster[];
  deadlineAnalysisComplete: boolean;
  planningWindows: PlanningWindow[];
  recommendations: CalendarRecommendation[];
  sourceAvailability: { partial: boolean; unavailableSources: string[] };
  // externalAvailabilityComplete is deliberately independent of
  // sourceAvailability — a Google outage must never mark canonical SHF
  // sources unavailable (phase brief §34).
  externalAvailabilityComplete: boolean;
  unavailableExternalProviders: string[];
  generatedAt: string;
}

// Calendar Intelligence calls the Projection Service exactly once — see
// calendar-adapters.ts's own single-await-per-adapter discipline; this
// function performs zero additional source-domain queries. Analysis is
// pure, synchronous, in-memory computation over the one already-fetched
// `projection.items` array (Phase 10 §48-49). Phase 12.2 adds a 4th,
// optional, equally pure input — externalAvailability — computed
// upstream (by the route handler) exactly once per request, the same
// single-fetch discipline extended to the new source.
export function computeCalendarIntelligence(
  projection: CalendarProjectionResult,
  range: { from: Date; to: Date } | null,
  now: Date = new Date(),
  externalAvailability: ExternalAvailabilityInput = NO_EXTERNAL_AVAILABILITY,
): CalendarIntelligenceResult {
  const events = projection.items;
  const scheduledEvents = events.filter((e) => planningKind(e) === "SCHEDULED_TIME");
  const deadlineEvents = events.filter((e) => planningKind(e) === "DEADLINE");
  const milestoneEvents = events.filter((e) => planningKind(e) === "MILESTONE_DATE");

  const conflicts = detectConflicts(scheduledEvents);
  const externalConflicts = detectExternalBusyConflicts(scheduledEvents, externalAvailability.intervals);
  const deadlineConcentration = detectDeadlineConcentration(deadlineEvents);
  const planningWindows = computePlanningWindows(scheduledEvents, range, externalAvailability.intervals);
  const recommendations = buildRecommendations(conflicts, externalConflicts, deadlineConcentration, deadlineEvents, milestoneEvents, now.getTime());

  const conflictAnalysisComplete = !projection.unavailableSources.some((s) => SCHEDULED_TIME_SOURCES.has(s));
  const deadlineAnalysisComplete = !projection.unavailableSources.some((s) => DEADLINE_SOURCES.has(s));

  return {
    range: { from: range ? range.from.toISOString() : null, to: range ? range.to.toISOString() : null },
    weeklyLoad: computeWeeklyLoad(events),
    conflicts,
    conflictAnalysisComplete,
    externalConflicts,
    deadlineConcentration,
    deadlineAnalysisComplete,
    planningWindows,
    recommendations,
    sourceAvailability: { partial: projection.partial, unavailableSources: projection.unavailableSources },
    externalAvailabilityComplete: externalAvailability.complete,
    unavailableExternalProviders: externalAvailability.unavailableProviders,
    generatedAt: new Date().toISOString(),
  };
}
