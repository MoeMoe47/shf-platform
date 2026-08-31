# SHF Canonical Calendar Projection Service (Phase 9)

Backend: `apps/shs-api/src/domain/calendar/`
Route: `GET /calendar/events/me`
Frontend consumer: `src/lib/calendar/api.js` → `src/pages/curriculum/calendar/useLearningCalendarEvents.js`

## 1. Purpose

Before this phase, `useLearningCalendarEvents.js` performed six separate `Promise.allSettled`-wrapped HTTP
fetches (Assignments, Live Learning, Career Events, Opportunities, Projects, Credentials), each mapped to a
common `CalendarEvent` shape, deduped, and merged client-side. That logic is now a single canonical backend
service. The frontend contract, filters, and rendering (`eventContract.js`, `CalendarMonthView.jsx`, etc.)
did not change — only where aggregation happens moved.

## 2. Non-ownership principle (non-negotiable)

The Projection Service owns **no institutional truth**. It never decides whether an assignment was
completed, a session was attended, a career event happened, an opportunity was applied to, a project was
accepted, a capstone was approved, a credential was issued, an Arcade activity was mastered, or a Journey
milestone was reached. Each source domain remains the sole owner of its own status/completion field; the
Calendar layer only reads, normalizes, filters, dedupes, orders, and projects what that domain already
decided. A date appearing on the Calendar is never itself evidence that something happened — it is a
schedule fact, not a completion fact.

## 3. Source Ownership Matrix

| Calendar Event Type | Owning Domain | Canonical Source Table / Service | Projection Adapter | Completion Owner | Entitlement Owner |
|---|---|---|---|---|---|
| `ASSIGNMENT_DUE` | Assignments | `assignments` table → `assignment-service.ts:listForUser()` | `assignmentAdapter` | No completion/submission model exists (deliberately not fabricated) | `assignment-service.ts` (adapter self-checks `ASSIGNMENT_VIEW`) |
| `LIVE_SESSION` | Live Learning | `live_sessions` table → `live-learning-service.ts:listSessionsForActor()` | `liveLearningAdapter` | `live_session_join_events` (attendance) — Calendar never reads or writes it | `live-learning-service.ts` (adapter self-checks `LIVE_LEARNING_VIEW`) |
| `CAREER_EVENT` | Career Events / Community | `career_events` table → `career-event-service.ts:listCareerEventsForActor()` | `careerEventAdapter` | `career_events.status` (own lifecycle; e.g. `COMPLETED`) | `career-event-service.ts` (adapter self-checks `CAREER_EVENT_VIEW`); student-facing shaping via `toStudentFacingCareerEvent` |
| `OPPORTUNITY_DEADLINE` | Opportunities | `opportunities` table → `opportunity-service.ts:listOpportunitiesForActor()` | `opportunityAdapter` | No application/submission model exists (deliberately not fabricated) | `opportunity-service.ts` (adapter self-checks `OPPORTUNITY_VIEW`); student-facing shaping via `toStudentFacingOpportunity` |
| `PROJECT_START` / `PROJECT_DUE` / `PROJECT_PRESENTATION` | Projects / Capstones | `projects` table → `ProjectService.listScheduleForActor()` | `projectAdapter` | `project_submissions.status` (own lifecycle, e.g. `ACCEPTED`) | `ProjectService` (adapter self-checks `PROJECT_VIEW`) |
| `CREDENTIAL_RENEWAL` / `CREDENTIAL_EXPIRATION` | Credentials | `learner_credentials` table → `credential-service.ts:listCredentialsForActor()` | `credentialAdapter` | `learner_credentials.lifecycle` (`ISSUED`/`REVOKED`, own lifecycle) | `credential-service.ts` (adapter self-checks `CREDENTIAL_VIEW`) |
| *(none — explicit absence)* | Learning Arcade | N/A | N/A | `arcade_results.mastery_achieved` (never a Calendar concern) | N/A |

No `arcade` adapter exists and none is registered in `ADAPTERS` — verified by a dedicated test
(`calendar-projection.security.test.ts`) asserting no `sourceDomain === "arcade"` ever appears in output.
Community is not a distinct domain (Phase 8 decision); its events surface entirely through `CAREER_EVENT`.
Journey Milestones (`GET /journey/milestones/me`) is a *consumer* of these same source domains, not a
Calendar source itself — it is never read by the Projection Service, and the Projection Service is never
read by it; both are independent read-only projections over the same six canonical domains.

## 4. Stable identity

`createProjectionId(sourceDomain, sourceRecordId)` → `` `${sourceDomain}:${sourceRecordId}` ``, with an
optional `:kind` suffix (`:start`, `:due`, `:presentation`, `:renewal`, `:expiration`, `:deadline`) when one
source record projects more than one Calendar event. This exactly matches the frontend's pre-existing
`createCalendarEventId()` (`src/pages/career/calendar/eventContract.js`), so IDs are stable whether computed
client-side (legacy) or server-side (current). Identity is never derived from title, date, or a freshly
generated UUID — two adapters emitting the same `id` collapse to one event; two different `:kind` suffixes
from the same record do not.

## 5. Entitlement

The Projection Service does not implement its own authorization model. Each adapter calls the same
already-entitled, actor-scoped service function its own domain's HTTP route uses (`listForUser`,
`listSessionsForActor`, `listCareerEventsForActor`, `listOpportunitiesForActor`,
`ProjectService.listScheduleForActor`, `listCredentialsForActor`) — entitlement logic is never duplicated.

Two of those functions (`Assignment.listForUser`, `LiveLearning.listSessionsForActor`) assume their caller's
HTTP route already ran `requirePermission(...)`; since `GET /calendar/events/me` is one route spanning six
domains with six different permission requirements, it cannot gate on a single permission. Each adapter
therefore explicitly re-checks its own domain's view permission
(`hasPermission(actor.permissions, X_VIEW)`) before calling its service function, returning `[]` — not an
error — when the actor lacks it. This is why an instructor actor legitimately sees zero Project/Credential
Calendar events: they lack `PROJECT_VIEW`/`CREDENTIAL_VIEW`, exactly as they would calling those domains'
own routes directly.

`GET /calendar/events/me` takes no `learnerId`/`userId`/`actorId` query parameter — the actor is always
derived from the authenticated session. Spoofed identity query params are inert (verified by test).

## 6. Failure isolation

`getCalendarProjectionForActor()` runs all six adapters through `Promise.allSettled`. One or more producers
failing is a **partial** result: the healthy producers' events are still returned, and `unavailableSources`
names exactly which producer(s) failed (e.g. `["live-learning"]`). Every producer failing simultaneously is
a **hard failure**: the service throws `CalendarHardFailureError`, and the route responds `503
CALENDAR_UNAVAILABLE` rather than a silently "successful" empty result. The frontend hook passes
`unavailableSources`/`partial` straight through to the existing UI banner (`CurriculumCalendar.jsx`'s
`lc-partialNotice`), unchanged from its pre-Phase-9 behavior.

## 7. Date range and overlap semantics

`GET /calendar/events/me` accepts optional `from`/`to` ISO-8601 query parameters — both or neither.
`parseCalendarRange()` rejects an unpaired parameter, an invalid date, `from >= to`, or a span exceeding
`MAX_RANGE_DAYS` (400 days), each as `400 { code: "RANGE_INCOMPLETE" | "INVALID_DATE" | "INVALID_RANGE" |
"RANGE_TOO_LARGE" }`. When no range is given, all entitled events are returned. `overlapsRange()` treats a
deadline/instant event (`endsAt === null`) as a zero-duration point, and a timed event as
`[startsAt, endsAt]`; an event overlaps the range when `start <= range.to && end >= range.from`.

## 8. Dedup and ordering

After all adapters settle, events are deduped by `id` (a `Set`, not fuzzy title/date matching — two
different domains scheduling something with the same title on the same day are never merged). Surviving
events are sorted deterministically: `startsAt` ascending, then `type`, then `id` — so repeated calls with
identical input produce byte-identical output ordering.

## 9. Statelessness

There is no `calendar_events` (or similarly named) table and no new migration in this phase. Every request
re-reads all six canonical source domains live. This was a deliberate architecture decision (see phase
pre-implementation verdict) — the read volume is bounded by an actor's own entitled records, matches the
adapters' existing query patterns 1:1 (no N+1: each adapter issues exactly one call to its domain's already-
indexed service function; per-record fan-out for Projects/Credentials is pure in-memory shaping of an
already-fetched array, not additional queries), and avoids a second, ownerless place to make source data
stale. Measured response time against realistic `shs_dev` fixture data is single-digit milliseconds.

## 10. Read-only contract

`GET /calendar/events/me` is the only route under `/calendar/*`. There is no `POST /calendar/complete`,
`POST /calendar/rsvp`, or any other mutation route — the service cannot write institutional truth even by
accident, because no write path into it exists.

## 11. Frontend migration

Phase 9 followed a staged migration, not a rewrite:

1. Built the backend service and adapters, byte-for-byte replicating each of the six original frontend
   mappers' field-level output (`priority`, `allDay`, `dueAt` semantics) so the new DTO is a superset of what
   the frontend already rendered.
2. Proved correctness with 18 new backend tests (9 orchestration unit tests with injectable fake adapters;
   9 HTTP integration tests against real fixtures) plus a full regression run, before touching any frontend
   file.
3. Only then rewrote `useLearningCalendarEvents.js` to call the new endpoint, translating the backend's
   9-value type registry (`ASSIGNMENT_DUE`, `LIVE_SESSION`, `CAREER_EVENT`, `OPPORTUNITY_DEADLINE`,
   `PROJECT_START`/`PROJECT_DUE`/`PROJECT_PRESENTATION`, `CREDENTIAL_RENEWAL`/`CREDENTIAL_EXPIRATION`) into
   the page's pre-existing 5-value `CalendarEventType` set via a small `PROJECTION_TYPE_TO_EVENT_TYPE` map.
   `eventContract.js`'s type registry, filters, and CSS were not touched — no UI redesign.
4. Verified parity live in-browser against real `shs_dev` seed data (Month/Week/Agenda views, event detail
   dialog, filter chips, honest empty states for unentitled domains) before considering the migration done.
5. Removed the six-mapper frontend aggregation logic only after that parity was confirmed — the old
   per-source `mapX()` functions and the client-side `Promise.allSettled`/dedupe call are gone from
   `useLearningCalendarEvents.js`; the hook's public return shape (`{loading, error, events, partial,
   unavailableSources, refresh}`) is unchanged, so no downstream component needed modification.

## 12. Explicit non-goals (Phase 9 scope boundary)

No Plan My Week / work-block scheduling, no conflict detection, no scheduling intelligence or AI, no
external calendar sync (Google/Outlook/iCal/ICS), no new Community domain, no fabricated Arcade scheduling.
These remain exactly as documented in `docs/SHF_CALENDAR_CAPABILITY_MATRIX.md` §O/§P/§R — Phase 9 changed
where aggregation happens, not what the Calendar is capable of.

## 13. Phase 10 consumer: Calendar Intelligence

`apps/shs-api/src/domain/calendar/service/calendar-intelligence-service.ts` (Phase 10) is the
first — and, by design, should be the only necessary — consumer of this service beyond the
frontend. It calls `getCalendarProjectionForActor()` exactly once per `GET
/calendar/intelligence/me` request and derives Weekly Load, conflict detection, deadline
concentration, and recommendations entirely in memory over that one result. It never queries a
source domain directly and never re-implements entitlement — see
`docs/SHF_CALENDAR_INTELLIGENCE.md` for its own full architecture. This is the intended shape for
any future consumer of Calendar data: call this service once, derive everything else from its
result, never re-query the six source domains independently.

## 13b. Phase 12 consumer: the ICS/webcal export feed

`apps/shs-api/src/domain/calendar-feed/` (Phase 12) is a second consumer of this service,
alongside Calendar Intelligence: it calls `getCalendarProjectionForActor()` once per
`GET /calendar/feed.ics` request and converts the same already-entitled result into RFC 5545
iCalendar text for external calendar subscription — read-only, one-way, no recomputation. See
`docs/SHF_EXTERNAL_CALENDAR_INTEGRATION.md`.

## 14. Phase 10 boundary

Any future phase that wants to *add* a new schedulable source (e.g. a real Arcade due date, once a real
Arcade due-date concept exists) should add one more adapter to `ADAPTERS` in
`calendar-projection-service.ts` and one new entry to the Source Ownership Matrix above — it should never
need to change the orchestration, dedup, ordering, or failure-isolation logic itself, which are
domain-agnostic by design.

## 15. Phase 11.5 consumer parity (frontend)

As of Phase 11.5, every SHF Calendar-shaped frontend surface calls this service the same way:
Curriculum (`useLearningCalendarEvents.js`) and Career (`useCalendarEvents.js`) both call
`listCalendarEvents(role)` and map the response through one shared function,
`mapProjectionItems()` in `src/pages/career/calendar/projectionAdapter.js` — previously
duplicated verbatim inside Curriculum's own hook, and never implemented at all by Career (which
ran an entirely local, partly-fake aggregator instead). No backend change was required or made;
this closed a frontend-only consumer gap. See `docs/SHF_CALENDAR_SURFACE_UNIFICATION.md`.
