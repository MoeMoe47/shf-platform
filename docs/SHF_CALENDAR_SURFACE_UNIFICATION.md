# SHF Calendar Surface Unification (Phase 11.5)

## 1. Purpose and the one-Calendar principle

SHF has one canonical Calendar platform: Canonical Source Domains → Calendar Projection Service
(`GET /calendar/events/me`, Phase 9) → Calendar Intelligence (`GET /calendar/intelligence/me`,
Phase 10) → shared frontend Calendar primitives (`src/pages/career/calendar/*`) → context-specific
authorized views. Every legitimate SHF surface that presents calendar/schedule/agenda/deadline
facts must consume this one pipeline. Applications may filter and configure differently; they may
never own a second, competing copy of Calendar truth.

## 2. Repository-Wide Calendar Census

A full-repository search (route lists, component trees, `DEMO_*`/`sampleEvents`/`mockEvents`
patterns, and every `*.html` entry) found exactly two real SHF applications with a Calendar-shaped
surface — Curriculum and Career — plus a handful of dashboard-widget-scale date summaries. No
Parent role or app exists anywhere in this codebase. No Admin operational Calendar exists (the
Curriculum "admin" routes are a comparison tool, `AdminCompare.jsx`, not a schedule). The
`src/pages/civic/*` and `src/pages/universe-v1/*` product areas are unrelated to SHF and were
confirmed out of scope. `CareerPlanner.jsx` is a financial funding-plan selector — a false positive
from the word "planner," not a schedule.

## 3. Calendar Surface Count

Two full Calendar pages (Curriculum, Career), two small dashboard summary widgets
(`UpcomingAssignmentsCard.jsx`, `CareerDashboard.jsx`'s KPI row), one legitimate source-management
list (`LiveSessions.jsx`), and two explicitly-local sources (Portfolio demo, Personal reminders).

## 4. Canonical Shared Calendars

**Curriculum Calendar** (`src/pages/curriculum/CurriculumCalendar.jsx`) — already canonical since
Phase 9/10/11/12. **Career Calendar** (`src/pages/career/CareerCalendar.jsx`) — migrated to
canonical this phase (see §7 below). Both now consume `GET /calendar/events/me` via the same
shared mapping (`projectionAdapter.js`) and render with the same shared view components.

## 5. Filtered Shared Views

Neither app forks the Month/Week/Agenda/Filter/EventDetail components — both import directly from
`src/pages/career/calendar/*`, which was already the one shared location before this phase (a
finding, not something this phase built). Curriculum additionally shows Weekly Load/Plan My
Week/Companion guidance (Intelligence-backed, Phase 10/11); Career does not currently surface
Intelligence UI — a legitimate, pre-existing product choice, not a duplicate-logic problem, since
Career has no local reimplementation of conflict/load/recommendation logic to remove.

## 6. Legacy / Local Calendars

None remain. Personal reminders (real, user-owned, localStorage) and the Portfolio demo event
(explicitly local, no canonical backend producer exists) are the only two frontend-only sources,
and both were already correctly isolated before this phase — merged in *after* the canonical
fetch, never presented as backend truth.

## 7. Duplicate Calendar Logic — found and removed

**The central finding of this phase's census:** Career Calendar's own `useCalendarEvents.js` ran a
locally-registered adapter aggregator (`collectAllEvents()` in `adapters.js`) that produced six
sources — Assignments, Learning, Portfolio, Mentor, Career, Opportunities — five of which
(everything but Portfolio) were hardcoded `DEMO_*` fixture arrays (`demoFixtures.js`) presented
with **no demo label**, indistinguishable in the UI from live schedule data, sitting directly
beside a real "+ Personal reminder" button. This was the same duplicate-truth gap Phase 9 already
closed for Curriculum, left unaddressed for Career.

**Fixed this phase:** `useCalendarEvents.js` now fetches `GET /calendar/events/me` and maps it via
the newly-shared `projectionAdapter.js` (extracted from Curriculum's own hook, now imported by
both apps rather than duplicated), exactly mirroring Curriculum's Phase 9 pattern. `adapters.js`
was trimmed to only its two still-legitimate local sources (`portfolio`, `personal`); the five
demo adapters and the now-fully-unreachable `collectAllEvents()`/`listAdapterSources()` functions
were removed as dead code rather than left reachable for something to accidentally re-wire.
`demoFixtures.js` was trimmed to just `DEMO_PORTFOLIO`. Verified live end-to-end: Career Calendar
now shows the exact same real seed assignments Curriculum shows, with the same stable event
identity, the same event detail dialog, and the same click-through behavior.

## 8. Demo / Placeholder Calendar Surfaces

**Two more found and fixed**, both dashboard-widget scale:
- `src/pages/curriculum/sections/UpcomingAssignmentsCard.jsx` — three permanently hardcoded
  assignments with fabricated titles/dates/course names, sitting on the real Curriculum Dashboard
  next to a real link to the real Calendar. Now derives from `GET /calendar/events/me`, filtered
  to `ASSIGNMENT_DUE`, with the fabricated "course" subtitle and per-subject icon dropped (no real
  course-name field exists to show honestly) rather than faked further.
- `src/pages/career/CareerDashboard.jsx` — a literal `Upcoming assignments: <strong>3</strong>`
  regardless of what was true. Now derives real counts for "Upcoming assignments" and "Events this
  week" from the same canonical endpoint. "Portfolio items: 5" is unchanged — it is not a Calendar
  fact (no scheduled date involved) and is out of this phase's scope.

Both verified live: Curriculum Dashboard now shows the real 3 seed assignments with honest
"Due Soon"/"Due Later" labels; Career Dashboard now shows "Upcoming assignments: 3" / "Events this
week: 0" (honestly zero — this actor has no real Live Session/Career Event scheduled).

## 9. Non-Calendar Date Surfaces

`src/pages/curriculum/LiveSessions.jsx` renders real `/live-learning/sessions` data with a join
action — legitimate source-management/participation UI, correctly distinct from the learner
Calendar projection (the brief's own §16 carve-out), left unchanged.
`src/pages/curriculum/LiveSessionManage.jsx` and `src/pages/AdminCompare.jsx` have no
calendar/schedule signal at all — not Calendar surfaces.

## 10. Reference Calendar Architecture

Curriculum's Phase 9 implementation remains the reference. Confirmed this phase: the view-layer
components it uses were *already* the same modules Career's own page uses (both import from
`src/pages/career/calendar/*`) — the architectural convergence the brief anticipated at the
component layer had already happened; only the data layer had not.

## 11. Shared Event Contract

One contract, one file: `src/pages/career/calendar/eventContract.js` — `createCalendarEvent()`,
`createCalendarEventId()`, `EVENT_TYPE_META`, `dedupeCalendarEvents()`. Both apps have always
imported this exact file; nothing forked it. New this phase: `projectionAdapter.js` (same
directory) is the one place the backend's 9-value projection type registry maps onto this
contract's frontend type set — previously duplicated verbatim inside Curriculum's own hook, now
imported by both.

## 12. Shared Calendar Components

`CalendarMonthView`, `CalendarWeekView`, `CalendarAgendaView`, `CalendarFilters`,
`CalendarEventDetail`, `dateUtils.js` — all one copy each, already shared before this phase.
Curriculum additionally has its own rail components (`TodayPanel`, `UpcomingDeadlinesCard`,
`OpportunityRadarCard`, `PlanMyWeekCard`, `CalendarFeedSubscribe`); Career has its own
(`CalendarUpcomingRail`, `ReminderFormDialog`) — legitimate per-surface configuration of what to
show in the rail, not competing implementations of the same capability.

## 13. Shared Filter Taxonomy

Both apps now pass an explicit `groups` list to the one shared `CalendarFilters` component,
restricted to categories real backend data can produce (Live, Career, Assignments, Projects,
Opportunities, Credentials) plus each app's own still-local sources (Portfolio, Personal for
Career; the equivalent for Curriculum was already correct). Career's pre-migration default
(`FILTER_GROUPS`, 11 groups including "Learning" and "Mentoring") is no longer the default for
this page — those two chips only ever matched now-removed demo data and would have sat
permanently empty. `FILTER_GROUPS`/`EVENT_TYPE_META` themselves are unchanged (still shared,
still support a caller passing the full set if a future surface needs it).

## 14. Surface Configuration Model

No new configuration schema was introduced. Each page continues to own its own explicit `groups`
array and its own choice of rail components — a small, direct, readable difference per surface
rather than a new indirection layer, matching the brief's own "do not overbuild" guidance.

## 15. Curriculum Calendar

Unchanged and unregressed this phase — verified live (Month/Week/Agenda, event dialog, filters,
Weekly Load, Plan My Week, Companion guidance all still render correctly with the shared-module
refactor).

## 16. Career Calendar

Migrated this phase — see §7. All pre-existing real features (Month/Week/Agenda, search, event
dialog, "+ Personal reminder," reminder edit/delete) preserved; all demo-presented-as-real content
removed.

## 17. Student Dashboard Calendar / Schedule

See §8 — both Dashboard widgets fixed to derive from canonical data.

## 18. Instructor Calendar

No Instructor Calendar surface exists (confirmed by census) — nothing to migrate.

## 19. Parent Calendar

No Parent role or app exists anywhere in this codebase (confirmed by census: only incidental
`parentNode` DOM-API string matches) — nothing to migrate, nothing to classify as PARTIAL.

## 20. Admin Calendar

No admin operational schedule/calendar view exists — Curriculum's `admin` routes are a comparison
tool (`AdminCompare.jsx`), source-management-adjacent, not a Calendar surface.

## 21. Live Learning Schedule Boundary

Preserved exactly as designed in Phase 3/9: `LiveSessions.jsx` is real source-participation UI
(join action, real session status), intentionally separate from the learner Calendar projection.
Not migrated — migrating it would have been incorrect per the brief's own §16/§55 carve-out.

## 22. Project / Capstone Boundary

Unchanged — Project management remains Project-domain UI; Calendar presentation of
start/due/presentation dates already flows through the canonical projection (Phase 6/9), untouched
this phase.

## 23. Credential Boundary

Unchanged — Credential detail/management remains Credential-domain UI; renewal/expiration Calendar
presentation already flows through the canonical projection (Phase 7/9), untouched this phase.

## 24. Career Event / Community Boundary

Unchanged — Career Event management remains source-domain UI. Community continues to surface only
via the Career Event type (Phase 8); no second Community Calendar was ever built or found.

## 25. Opportunity Boundary

Unchanged — Opportunity browsing remains Career-domain UI; Calendar deadline presentation already
flows through the canonical projection. Opportunity Radar (Curriculum) remained separate
intelligence, untouched.

## 26. Arcade Boundary

Unchanged — no scheduled Arcade producer exists; no Arcade Calendar card was added anywhere.

## 27. Personal Reminder Boundary

Unchanged and reconfirmed: genuinely local, user-owned, editable, never presented as institutional
truth, merged into both apps' event lists identically via the same shared `personal` adapter.

## 28. Portfolio Demo Boundary

Unchanged and reconfirmed: `DEMO_PORTFOLIO` (now the only fixture remaining in `demoFixtures.js`)
is explicitly local, clearly sourced as `"portfolio-demo"`, merged in after the real fetch, and
never reaches the backend Calendar Intelligence Engine (Intelligence only ever computes over the
Projection Service's own `items`, which never includes this frontend-only merge).

## 29. Backend Endpoint Consistency

No backend files were changed this phase. Both apps now call the identical
`GET /calendar/events/me` with the identical actor-derived entitlement — verified live (same
seed data, same event ids, in both apps).

## 30. Calendar Intelligence Consistency

Unaffected — Curriculum continues to be the only surface rendering Intelligence-derived UI; no
second Intelligence computation exists anywhere.

## 31. Weekly Load Consistency

Single definition, unchanged (Phase 10, `calendar-intelligence-service.ts`) — no surface
recomputes it.

## 32. Conflict Consistency

Single definition, unchanged (Phase 10) — no surface recomputes it.

## 33. Plan My Week Consistency

Single engine, unchanged (Phase 10/11) — Career does not currently render a Plan My Week surface
at all, so there was no second implementation to find or remove.

## 34. Companion Consistency

Unaffected — Companion Context (Phase 11) is unchanged; Brainiact renders on both apps globally
(`RootProviders.jsx`, unchanged) and was reconfirmed working on Career Calendar during live
verification.

## 35. Stable Event Identity

Verified live: the same real assignment ("Lesson 3 Reflection," `assignment:asmt_seed_reflection_1`)
renders with the identical id, title, and date on both Curriculum and Career Calendar — the shared
`mapProjectionToCalendarEvent()` (now in `projectionAdapter.js`) guarantees this by construction,
since both apps call the same function on the same backend response shape.

## 36. Deduplication

Unchanged — dedup remains the Projection Service's own responsibility (Phase 9); no frontend fuzzy
dedup was added or found.

## 37. Date / Time Consistency

Unchanged — both apps use the same `dateUtils.js` (already shared) and the same instant-based
backend timestamps; no per-app date interpretation divergence was found or introduced.

## 38. Deep Links

Unchanged — `actionUrl` from the canonical projection flows through unmodified in both apps' event
dialogs; re-verified live on Career Calendar's "Go to assignment" action.

## 39. Event Dialog

One shared component (`CalendarEventDetail.jsx`), confirmed already used by both apps before this
phase; re-verified live on Career Calendar with real data.

## 40. Empty States

Unchanged — both apps already used honest empty-state copy; Career's now-honest zero counts
("Events this week: 0") were verified live rather than assumed.

## 41. Failure Semantics

**New this phase for Career:** `partial`/`unavailableSources` are now surfaced identically to
Curriculum's own pattern — same wording, same shared `unavailableSourcesMessage()` helper (moved
into `projectionAdapter.js` so both apps use one copy instead of Curriculum's own local duplicate),
same new shared `.cal-partialNotice` CSS added to the already-shared `career-calendar.css` (not
duplicated under a new prefix — Curriculum's own `.lc-partialNotice` was left as-is, unregressed).

## 42. Role / Entitlement Architecture

Unchanged — both apps derive the actor from the authenticated session via the same
`listCalendarEvents(role)` client (`src/lib/calendar/api.js`, unchanged), which resolves to the
same backend actor-scoped entitlement (Phase 9). No new role-specific endpoint was built or
needed, since no Instructor/Admin/Parent Calendar surface exists to require one (§18-20).

## 43. IDOR / Cross-Org Security

Unaffected — no new backend surface, no new query parameter, no change to entitlement logic
anywhere. Existing Phase 9-12 security test coverage (444+ tests) re-verified unchanged.

## 44. Frontend Migration

Followed the brief's own staged approach: captured Career's current behavior (§7 census) → mapped
to the shared contract (already available) → implemented shared configuration (explicit filter
groups) → verified parity live → switched the data source → verified live again → removed the
now-fully-dead demo orchestration only after confirming zero remaining callers.

## 45. Duplicate Logic Removed

`collectAllEvents()`, `listAdapterSources()`, and five demo adapters/fixtures (Assignments,
Learning, Mentor, Career, Opportunities) — all confirmed to have zero remaining callers before
removal (`grep`-verified, not assumed).

## 46. Curriculum Parity

Verified live: Month/Week/Agenda, Today, Upcoming Deadlines, Weekly Load, Plan My Week, filters,
event dialog, Companion, all unregressed. Zero console errors.

## 47. Career Parity

Verified live: Month/Week/Agenda, search, filters (now canonical-only), event dialog,
"+ Personal reminder" flow, Portfolio demo event correctly present and labeled, zero console
errors. The only intentional change is honest data replacing fake data — documented, not hidden.

## 48. Dashboard Parity

Verified live: both widgets render correctly with real data, loading state, and honest
unavailable-state fallback (`"—"`), without becoming oversized Calendar UI.

## 49. Responsive Verification

Not independently re-verified at all five breakpoints this phase — the shared components
themselves were not touched (Career already imported the same, already-responsive-verified
Curriculum-shared view layer; see Phase 10.1's responsive work on those same components). The only
new UI surface is the small `.cal-partialNotice` bar, styled identically to Curriculum's own
already-verified `.lc-partialNotice`.

## 50. Accessibility

Unchanged — no new interactive control was added beyond the partial-notice Retry button, styled
and marked up identically to Curriculum's own already-accessible equivalent (`role="status"`, real
`<button>`).

## 51. Network / Request Efficiency

Verified live: Career Calendar now issues one `GET /calendar/events/me` per load (plus the
existing global Companion Context fetch) — replacing what was previously a synchronous, zero-
network local aggregation with one real network call, a deliberate and necessary trade for
honesty; no redundant duplicate fetch pattern was introduced (confirmed via network panel).

## 52. Database Changes

None. No migration this phase (as required) — confirmed via fresh-DB migration status (53
migrations, unchanged from Phase 12).

## 53. Curated Schema Integrity
Clean — `shs_dev` and fresh disposable DB.

## 54. Strict Schema Integrity
Clean — 53 migrations, 1,763 objects, 0 failures, both databases.

## 55. Fresh DB Verification
Created `shs_phase115_verify_1788186574`; migrated 001→053 (no new migration); integrity clean;
seeds applied cleanly; full suite: 471/465/0/6; server booted, `/health` healthy; dropped and
confirmed removed.

## 56. shs_dev Verification
Migration status clean, integrity clean, `GET /calendar/events/me` and
`GET /companion/context/me` both smoke-tested healthy, no fake data added, no test debris.

## 57. Backend Regression
Two consecutive clean runs against `shs_dev`, both before and after this phase's frontend changes:
471 total / 465 pass / 0 fail / 6 skip, all four times (this phase made no backend changes, so
this also serves as a strong regression guard).

## 58. Frontend Regression
`npm run build` clean at every step of this phase's edits (pre-existing chunk-size warnings only).

## 59. Files Changed
New: `src/pages/career/calendar/projectionAdapter.js`, `docs/SHF_CALENDAR_SURFACE_UNIFICATION.md`.
Modified: `src/pages/career/calendar/useCalendarEvents.js` (rewritten), `adapters.js` (trimmed),
`demoFixtures.js` (trimmed), `CareerCalendar.jsx`, `CareerDashboard.jsx`,
`src/pages/curriculum/calendar/useLearningCalendarEvents.js` (refactored to import shared logic),
`src/pages/curriculum/CurriculumCalendar.jsx` (refactored to import shared helper),
`src/pages/curriculum/sections/UpcomingAssignmentsCard.jsx` (rewritten), `career-calendar.css`
(added shared partial-notice styles), four related docs cross-referenced.

## 60. Documentation
This document created. `docs/SHF_CALENDAR_CAPABILITY_MATRIX.md`,
`docs/SHF_CALENDAR_PROJECTION_SERVICE.md`, `docs/SHF_CALENDAR_INTELLIGENCE.md`,
`docs/SHF_LEARNING_COMPANION_INTELLIGENCE.md` updated with cross-references.

## 61. Calendar Surface Matrix

| Surface | Route | Role | Canonical Endpoint | Intelligence | Shared Components | Default Filters | Status Before | Status After |
|---|---|---|---|---|---|---|---|---|
| Curriculum Calendar | `/curriculum/asl/calendar` | Learner | `/calendar/events/me` | Yes | Month/Week/Agenda/Filters/EventDetail | Learning/Live/Career/Assignments/Projects/Opportunities/Credentials | REAL | REAL (unchanged) |
| Career Calendar | `/career/calendar` | Learner | `/calendar/events/me` | No (not shown) | Month/Week/Agenda/Filters/EventDetail | Live/Career/Assignments/Projects/Opportunities/Credentials/Portfolio/Personal | **DEMO (5 of 6 sources fake)** | **REAL** |
| Curriculum Dashboard — Upcoming Assignments | `/curriculum/asl/dashboard` | Learner | `/calendar/events/me` (filtered) | No | none (custom rows) | n/a | **DEMO (hardcoded)** | **REAL** |
| Career Dashboard — KPI row | `/career/dashboard` | Learner | `/calendar/events/me` (counted) | No | none | n/a | **DEMO (hardcoded)** | **REAL** (Portfolio count unchanged, non-Calendar) |
| Live Learning session list | `/curriculum/live-sessions` | Learner | `/live-learning/sessions` (direct) | No | none | n/a | REAL (source-management) | REAL (unchanged, correctly not migrated) |

## 62. Shared Component Matrix

| Capability | Shared Component | Used By |
|---|---|---|
| Month View | `CalendarMonthView.jsx` | Curriculum, Career |
| Week View | `CalendarWeekView.jsx` | Curriculum, Career |
| Agenda View | `CalendarAgendaView.jsx` | Curriculum, Career |
| Filter Chips | `CalendarFilters.jsx` | Curriculum, Career |
| Event Dialog | `CalendarEventDetail.jsx` | Curriculum, Career |
| Event Contract / Identity | `eventContract.js` | Curriculum, Career |
| Projection → Frontend mapping | `projectionAdapter.js` (new) | Curriculum, Career |
| Date helpers | `dateUtils.js` | Curriculum, Career |
| Partial-source notice | `.cal-partialNotice` (career-calendar.css, new) | Curriculum (own `.lc-` variant, unchanged), Career (new, shared prefix) |
| Weekly Load / Plan My Week / Companion guidance | Curriculum-only components | Curriculum only (Career has no local competing implementation) |

## 63. Remaining Gaps
Full five-breakpoint responsive re-verification not repeated this phase (relied on the shared
components' already-established responsive behavior; only new UI is the partial-notice bar,
styled identically to an already-verified equivalent). No Instructor/Admin/Parent Calendar exists
to unify — confirmed absent, not deferred.

## 64. Phase 12 Readiness
The ICS/webcal feed (Phase 12) already reads from the same canonical Projection Service both
Curriculum and Career now consume — no change was needed there. A future Phase 12 extension (e.g.
Google/Microsoft OAuth) would automatically benefit both apps' learners identically, since there
is now exactly one Calendar data pipeline for it to sit behind.
