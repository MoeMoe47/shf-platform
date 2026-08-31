// SHF Ecosystem Phase 9 — Canonical Calendar Projection Service.
//
// This is a stateless read/orchestration layer only — no calendar_events
// table, no persisted projection. Every call re-reads canonical
// source-domain facts fresh (see docs/SHF_CALENDAR_PROJECTION_SERVICE.md
// "Cache" section for why staleness was rejected). It owns no
// institutional truth: it never marks anything complete, attended,
// approved, issued, or mastered — see calendar-adapters.ts for the
// per-domain read boundary.
import {
  assignmentAdapter, liveLearningAdapter, careerEventAdapter,
  opportunityAdapter, projectAdapter, credentialAdapter, CalendarActor,
} from "./calendar-adapters.js";
import { CalendarEventProjection } from "../model/calendar-event.js";

const ADAPTERS: Array<{ name: string; fn: (actor: CalendarActor) => Promise<CalendarEventProjection[]> }> = [
  { name: "assignments", fn: assignmentAdapter },
  { name: "live-learning", fn: liveLearningAdapter },
  { name: "career-events", fn: careerEventAdapter },
  { name: "opportunities", fn: opportunityAdapter },
  { name: "projects", fn: projectAdapter },
  { name: "credentials", fn: credentialAdapter },
];

// Bounded maximum query horizon — prevents an arbitrary full-history scan
// (e.g. "1900 -> 3000") from the browser. A little over a year of margin
// beyond a single calendar year.
const MAX_RANGE_DAYS = 400;

export class CalendarRangeError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "CalendarRangeError";
  }
}

// A total, systemic failure (every producer down) is a hard failure, not
// a silently-empty partial success — that pattern indicates something
// like a database outage, not six independent producer bugs at once.
export class CalendarHardFailureError extends Error {
  constructor(public cause: unknown) {
    super("All Calendar producers failed.");
    this.name = "CalendarHardFailureError";
  }
}

export interface CalendarRange {
  from: Date;
  to: Date;
}

export function parseCalendarRange(fromRaw?: string, toRaw?: string): CalendarRange | null {
  if (!fromRaw && !toRaw) return null;
  if (!fromRaw || !toRaw) throw new CalendarRangeError("RANGE_INCOMPLETE", "Both from and to are required when either is provided.");
  const from = new Date(fromRaw);
  const to = new Date(toRaw);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    throw new CalendarRangeError("INVALID_DATE", "from/to must be valid ISO 8601 timestamps.");
  }
  if (from.getTime() >= to.getTime()) {
    throw new CalendarRangeError("INVALID_RANGE", "from must be strictly before to.");
  }
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days > MAX_RANGE_DAYS) {
    throw new CalendarRangeError("RANGE_TOO_LARGE", `Requested range exceeds the maximum of ${MAX_RANGE_DAYS} days.`);
  }
  return { from, to };
}

// Overlap semantics: a timed event (endsAt set) intersects the window if
// it starts before the window ends and ends after the window starts. An
// instant/deadline-only event (no endsAt) is treated as its own single
// point in time (start === end) — correctly included only when that
// point falls within the window, never merely because its start is
// "close."
function overlapsRange(event: CalendarEventProjection, range: CalendarRange): boolean {
  const start = new Date(event.startsAt).getTime();
  const end = event.endsAt ? new Date(event.endsAt).getTime() : start;
  return start <= range.to.getTime() && end >= range.from.getTime();
}

export interface CalendarProjectionResult {
  items: CalendarEventProjection[];
  unavailableSources: string[];
  partial: boolean;
  generatedAt: string;
}

// `adaptersOverride` exists solely so tests can exercise the orchestration
// algorithm itself (dedup/ordering/partial-vs-hard-failure) with
// deterministic in-memory fakes, without needing to corrupt real
// source-domain data to force a genuine adapter exception. Production
// code never passes this parameter — it always uses the real six-adapter
// list above.
export async function getCalendarProjectionForActor(
  actor: CalendarActor,
  range: CalendarRange | null,
  adaptersOverride?: Array<{ name: string; fn: (actor: CalendarActor) => Promise<CalendarEventProjection[]> }>,
): Promise<CalendarProjectionResult> {
  const activeAdapters = adaptersOverride || ADAPTERS;
  const settled = await Promise.allSettled(activeAdapters.map((adapter) => adapter.fn(actor)));

  const unavailableSources: string[] = [];
  let combined: CalendarEventProjection[] = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      combined = combined.concat(result.value);
    } else {
      unavailableSources.push(activeAdapters[index].name);
    }
  });

  if (unavailableSources.length === activeAdapters.length) {
    throw new CalendarHardFailureError(settled.map((r) => (r.status === "rejected" ? r.reason : null)));
  }

  // Stable-identity dedup only — never fuzzy by title/date. A duplicate
  // sourceDomain+sourceRecordId+kind is collapsed; two genuinely distinct
  // records that merely share a moment in time are never merged.
  const seen = new Set<string>();
  const deduped = combined.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });

  const windowed = range ? deduped.filter((event) => overlapsRange(event, range)) : deduped;

  // Deterministic ordering: primary date ascending, then type, then
  // stable id — never incidental DB/array order.
  windowed.sort((a, b) => {
    const dateDiff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
    if (dateDiff !== 0) return dateDiff;
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return a.id < b.id ? -1 : 1;
  });

  return {
    items: windowed,
    unavailableSources,
    partial: unavailableSources.length > 0,
    generatedAt: new Date().toISOString(),
  };
}
