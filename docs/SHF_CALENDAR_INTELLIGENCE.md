# SHF Calendar Intelligence Engine (Phase 10)

Backend: `apps/shs-api/src/domain/calendar/service/calendar-intelligence-service.ts`
Route: `GET /calendar/intelligence/me`
Frontend consumer: `src/lib/calendar/api.js` (`getCalendarIntelligence`) →
`src/pages/curriculum/calendar/useCalendarIntelligence.js` → `SummaryRow.jsx` (Weekly Load)
and `PlanMyWeekCard.jsx` (recommendations)

## 1. Purpose and non-ownership principle

Calendar Intelligence is derived advice, not institutional truth. It classifies, counts,
compares, detects, and recommends — it never moves an Assignment deadline, reschedules Live
Learning, alters a Career Event, changes a Project date, changes a Credential expiration, marks
anything complete, or manufactures attendance, mastery, or urgency without deterministic
evidence. It calls the Phase 9 Calendar Projection Service (`getCalendarProjectionForActor()`)
exactly **once** per request and computes everything else as pure, synchronous, in-memory
functions over that one result — it never queries a source domain directly and never
re-implements entitlement (see `docs/SHF_CALENDAR_PROJECTION_SERVICE.md`).

A high `category` is not academic risk. A `HARD_CONFLICT` is not a mutation of either event. A
recommendation is advice a learner can act on or ignore — never a required schedule, never a
saved Calendar record, and never evidence that anything did or did not happen.

## 2. Planning classification

Every Phase 9 `CalendarEventType` is mapped to one of four planning kinds, audited against what
each adapter's fields actually contain (`calendar-adapters.ts`), not assumed from the type name:

| Type | Fields present | Planning kind |
|---|---|---|
| `ASSIGNMENT_DUE` | `dueAt` set, no `endsAt` | DEADLINE |
| `LIVE_SESSION` | `startsAt`+`endsAt`, real interval | SCHEDULED_TIME |
| `CAREER_EVENT` | `startsAt`+`endsAt`, real interval | SCHEDULED_TIME |
| `OPPORTUNITY_DEADLINE` | `dueAt` set, optional pursuit | DEADLINE (weighted separately — see §3) |
| `PROJECT_START` | `startsAt` only | MILESTONE_DATE |
| `PROJECT_DUE` | `dueAt` set | DEADLINE |
| `PROJECT_PRESENTATION` | `startsAt` only, no `endsAt` today | SCHEDULED_TIME (zero-duration instant — see §4) |
| `CREDENTIAL_RENEWAL` | `dueAt` set, actionable | DEADLINE |
| `CREDENTIAL_EXPIRATION` | `dueAt` populated in the Phase 9 DTO (for the "Upcoming Deadlines" UI), but expiration is a risk/milestone date, not a task with an act-by date | MILESTONE_DATE |

This table (`PLANNING_KIND_BY_TYPE`) is the one place this distinction is made — no other module
re-derives it.

## 3. Required vs. optional deadlines

`ASSIGNMENT_DUE`, `PROJECT_DUE`, and `CREDENTIAL_RENEWAL` are institutionally required.
`OPPORTUNITY_DEADLINE` is an optional pursuit. Weekly Load, concentration clusters, and
recommendations all report required and optional counts separately so an Opportunity deadline is
never presented with the same weight as a mandatory academic one — an all-optional concentration
cluster is labeled "(optional opportunity deadlines)", never generic "deadlines."

A deadline is additionally flagged `major` when its Phase 9 `priority` is `"high"` (not currently
set by any adapter, but honored if one ever is) or when it is a `PROJECT_DUE` for a Capstone
(`metadata.projectType === "CAPSTONE"`) — significance, never a fabricated duration.

## 4. Weekly Load

Transparent, typed components only — never a fabricated "hours of work" or an opaque percentage:

`scheduledEventCount`, `scheduledMinutes`, `deadlineCount`, `requiredDeadlineCount`,
`optionalDeadlineCount`, `majorDeadlineCount`, `presentationCount`, `opportunityDeadlineCount`,
`renewalDeadlineCount`.

`scheduledMinutes` is computed only for events with a real `endsAt` — an event with no end
(every DEADLINE/MILESTONE_DATE type, and `PROJECT_PRESENTATION` as currently modeled) contributes
`0` minutes, never an invented duration.

A bounded category is derived from one documented formula:

```
pressureUnits = scheduledEventCount + requiredDeadlineCount + majorDeadlineCount
category = LOW (<=2) | MODERATE (<=5) | HIGH (<=8) | VERY_HIGH (>8)
```

A major deadline counts twice — once as an ordinary required deadline, again for its extra
significance — a deliberate, documented weight, not an accident. The `<=2/5/8` thresholds are
carried forward unchanged from the pre-Phase-10 `SummaryRow.jsx` heuristic so the Weekly Load
bar's visual meaning does not shift under users — only its *inputs* became real typed components
instead of a raw, type-blind event count.

## 5. Conflict detection

A `HARD_CONFLICT` requires two SCHEDULED_TIME events whose intervals genuinely overlap:
`a.start < b.end && b.start < a.end` (strict on both sides). Documented boundary policy:

- Two intervals that merely touch (one ends exactly when the other starts) are **not** flagged —
  back-to-back scheduling is normal. `BACK_TO_BACK` is a distinct concept the Phase 10 brief
  itself calls optional; it is not implemented, since no deterministic minimum-transition-gap
  policy exists anywhere in the product to justify one.
- Two zero-duration instants (e.g. two Project presentations) at the exact same moment are not
  flagged under the strict rule — a conservative, documented choice to avoid false positives.

Comparison is O(n²) pairwise over one actor's own entitled, bounded event set (typically a
handful per week) — deliberate; a sorted sweep was judged unnecessary complexity at this volume.

## 6. Deadline concentration

A cluster is 2+ DEADLINE-kind events whose instants fall within a single rolling 48-hour window.
Severity is count-based, never emotion-oriented language: 2 events → `ELEVATED`, 3+ → `HIGH`.
Each cluster reports `requiredCount`/`optionalCount` so composition is never hidden.

## 7. Planning windows

"SHF-unoccupied" is not "personal free time." The absence of a canonical event only means nothing
SHF-scheduled is projected there — the learner may have school, work, family, or other real
obligations this system has no visibility into. Every window carries the literal label
`"No SHF-scheduled event is currently projected during this window."` — never "you're free."
Windows are computed only between real-duration SCHEDULED_TIME intervals within the requested
range, clipped to the range's own bounds.

## 8. Recommendations

Deterministic, rule-based, no LLM. Every recommendation carries `reasonCode`, `message`,
`severity`, `relatedEventIds` (always real, always traceable), `recommendedAction`, and
`actionUrl` (passed through from the related event when one exists). Reason codes implemented
this phase: `CONFLICT`, `DEADLINE_CONCENTRATION`, `DEADLINE_SOON` (required deadlines due within 3
days), `CREDENTIAL_RENEWAL_SOON` (within 14 days). Language stays advisory ("Review before it's
due", "Consider prioritizing these first") — never "you must," never a claim of free time, never
a save or mutation of anything. Milestone-kind events (e.g. Credential expiration) never generate
a recommendation — expiration is a risk/milestone date, not a task.

## 9. Source availability and partial-data safety

If a producer that could contribute SCHEDULED_TIME events (`live-learning`, `career-events`,
`projects`) is down, `conflictAnalysisComplete` is `false` — the response never claims "no
conflicts" as if that were a complete answer. The equivalent applies to deadline-bearing
producers (`assignments`, `opportunities`, `projects`, `credentials`) via
`deadlineAnalysisComplete`. `sourceAvailability.partial`/`unavailableSources` pass the Projection
Service's own values straight through. If the Projection Service hard-fails (every producer
down), Intelligence hard-fails the same way (`503 CALENDAR_UNAVAILABLE`) rather than returning a
fabricated empty "all clear."

## 10. Security

`GET /calendar/intelligence/me` is gated by `requirePermission("enrollment.view")`, matching
`/calendar/events/me`. The actor is always derived from the authenticated session — no
`learnerId`/`userId`/`actorId` query parameter is ever read for identity (verified: a spoofed
request produces identical results to the plain one). No cross-org data, private evidence, or
internal notes are exposed — the response is built entirely from the same already-entitled
`CalendarEventProjection` objects `/calendar/events/me` already returns to that same actor.

## 11. Timezone semantics

No canonical per-user timezone profile exists anywhere in this codebase (individual scheduled
events carry their own display `timezone` field, e.g. for a Live Learning session's own venue —
never a learner's preference, and never read by any frontend consumer today). Rather than
fabricate a client-suppliable timezone parameter with no real semantic backing, Phase 10 keeps
all boundary math instant-based: every comparison operates on UTC epoch milliseconds
(`Date.getTime()`), never server-local time. The default query range (when no `from`/`to` is
given) is a rolling 7-day forward window from request time — matching the pre-existing frontend
"Due This Week" convention (`SummaryRow.jsx`'s `todayStart` to `addDays(todayStart, 7)`), not a
Sunday-Saturday calendar week the frontend never actually used. This sidesteps DST/local-timezone
ambiguity entirely rather than solving it with an unfounded assumption.

## 12. Determinism

Same event set + same range + same "now" instant always produces identical output — no
randomization, no incidental array order. Verified by unit test across conflicts, concentration
clusters, and recommendation ordering (severity, then earliest related event id).

## 13. Database

No migration, no new table. Every request re-reads the Projection Service fresh and computes
intelligence in memory — the "strong default: no persistence" was never overridden because
nothing in this phase required remembering state across requests.

## 14. Frontend integration

`useCalendarIntelligence.js` fetches once per Calendar page load and degrades quietly on failure
(`intelligence: null`) — it never blocks or blanks the underlying Calendar, which remains fully
functional from the Phase 9 hook alone. `SummaryRow.jsx`'s Weekly Load card now shows a
transparent, factual breakdown ("2 scheduled · 3 deadlines") plus an honest conflict count,
replacing the old type-blind event-count heuristic — visual thresholds/labels (Light/Balanced/
Busy/Heavy) are unchanged. `PlanMyWeekCard.jsx` replaces its plain open-assignment checklist with
the real recommendation list when Intelligence has loaded, falling back to the original checklist
otherwise; clicking a recommendation opens the real related event via the existing detail dialog.
No new page, no redesign — both cards keep their pre-existing chrome and toggle behavior.

## 14b. Phase 12 note: external busy time not integrated

Phase 12 (External Calendar Integration) added a one-way ICS export feed only — it does not read
external calendars back into SHF, so no external busy-time signal exists to feed into Weekly
Load, conflict detection, or Plan My Week. §11's "no per-user timezone profile" limitation and
this section both remain accurate; nothing here changed. See
`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §11 for why (blocked on the same missing secure OAuth
token storage that blocks Google/Microsoft connect).

## 15. Non-goals (explicit scope boundary)

No LLM/AI schedule optimization, no Learning Companion coaching, no external calendar sync, no
notifications (SMS/email), no drag-and-drop schedule mutation, no Assignment/Live Learning
rescheduling, no new Reminder backend, no attendance/academic-success prediction, no behavioral
risk scoring, no points/streaks/reward economy, no `BACK_TO_BACK` conflict type (see §5).

## 16. Phase 11 boundary (resolved)

Phase 11 (`docs/SHF_LEARNING_COMPANION_INTELLIGENCE.md`) is the consumer this section
anticipated: `companion-context-service.ts` maps each of this engine's own recommendations into a
Companion guidance descriptor — a re-labeling pass only. It never recomputes a conflict, deadline,
or concentration cluster; this remains the sole place those are derived.

## 17. Phase 11.5 boundary (resolved)

Phase 11.5's repository-wide Calendar surface census confirmed this remains the only Intelligence
computation anywhere in SHF: Career Calendar (the one surface found to be running local/demo
Calendar logic) never computed its own conflicts, load, or recommendations — it had no
Intelligence UI at all, only a fake data-fetch layer. Migrating Career onto the canonical
Projection Service (Phase 9) did not add an Intelligence consumer there; this remains a
Curriculum-only UI choice, not a duplicate-engine gap. See
`docs/SHF_CALENDAR_SURFACE_UNIFICATION.md`.

## 18. Phase 12.2 boundary (resolved) — external busy conflicts

`computeCalendarIntelligence()` gained a fourth, optional parameter,
`externalAvailability: { intervals, complete, unavailableProviders }`, defaulting to an empty/
complete value that reproduces Phase 10/11's exact prior behavior for every caller that does not
pass it. When external busy intervals are supplied (from
`external-availability-service.ts`, Phase 12.2), two things happen, both deliberately kept
distinct from this engine's existing SHF-only concepts:

- A new, separate `ExternalBusyConflict` type (`EXTERNAL_BUSY_CONFLICT`) is detected between an SHF
  `SCHEDULED_TIME` event and an external busy interval — **never** merged into or counted as a
  `HARD_CONFLICT`, which remains exclusively an SHF-vs-SHF concept (verified by test: two
  overlapping SHF events plus an unrelated external busy interval still produce exactly one
  `HARD_CONFLICT` and the external conflict is reported separately in a new `externalConflicts`
  array).
- Planning windows now also carve around external busy intervals when they are supplied, using a
  new, more precise label ("No known scheduled conflict is visible in your connected calendar
  data during this window.") that only appears when external interval data was actually usable —
  an incomplete/failed external fetch falls back to the original, more conservative Phase 10
  wording rather than ever implying a check that didn't actually happen (phase brief §46: "never
  produces a false all-clear").

`externalAvailabilityComplete`/`unavailableExternalProviders` are new, always-present result
fields, independent of `sourceAvailability` — a Google outage never marks canonical SHF sources
unavailable, and vice versa. See `docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md` §13 for the full
Phase 12.2 accounting.
