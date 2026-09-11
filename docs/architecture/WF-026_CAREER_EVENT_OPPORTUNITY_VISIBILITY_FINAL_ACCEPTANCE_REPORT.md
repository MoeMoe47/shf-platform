# WF-026 Career Event / Opportunity Visibility Final Acceptance Report

## 1. Executive Result

**WF-026 COMPLETE.** Fresh PostgreSQL, authenticated API, shared Calendar
projection, and mounted `career.html#/calendar` acceptance passed.

## 2. Repository Baseline

Path `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`;
HEAD `0441aa4`; baseline: 110 tracked dirty and 161 untracked paths (271 total).
Migration filename head `125_curriculum_lesson_content.sql`. Disposable DB
`shs_wf026_20260910` ran on PostgreSQL port 55444; API on 8101; frontend on
5178. Agent Fabric was not required or started.

## 3. WF-026 Entering Status

`PARTIAL — ACCEPTANCE GAP`: implementation and focused security tests existed,
but fresh integrated learner-consumer proof was missing.

## 4. Canonical Career Authority

Career Events and Opportunities own records and status; Enrollment/Program owns
learner scope; Career owns pathway context; shared Calendar owns only the
stateless projection. No duplicate authority was introduced.

## 5. Event / Opportunity Inventory

`career_events` stores scheduled career events. `opportunities` stores
deadline-oriented learner opportunities. They remain separate canonical domains.

## 6. Visibility Rules

Same active organization is required. Program/Cohort scope requires a matching
active enrollment. Student lists require published/open state; direct detail
repeats authorization. Student DTOs omit targeting and tenant internals.
Published events require a non-ended interval; open opportunities require an
open opening time and non-past deadline.

## 7. Eligible Happy Path

Student A received a Program A event and opportunity through authenticated
`GET /career-events`, `GET /opportunities`, and `GET /calendar/events/me`.

## 8. Ineligible Learner

Student B, enrolled in Program B, received empty lists and 404-safe direct-ID
responses for Program A resources.

## 9. Wrong Org

An Org B learner received no protected Org A records and direct detail returned
404.

## 10. Wrong Program / Pathway

Program B was denied Program A resources. Career linkage did not bypass audience
scope.

## 11. Publication / Active State

Draft event/opportunity records were suppressed. Published/open records became
visible only after canonical status transition.

## 12. Expiration

Past-ended published events and past-deadline open opportunities were absent
from student APIs and Calendar.

## 13. Future Visibility

Future `opens_at` opportunities are suppressed until opening; the tested current
event appeared inside its active future interval.

## 14. Career Event Visibility

The event API returned bounded title, description, type, delivery, time, and
student-safe fields. Calendar emitted one `CAREER_EVENT` projection.

## 15. Opportunity Visibility

The opportunity API returned bounded learner fields and one deadline projection.
No organization, tenant, or targeting internals leaked.

## 16. Learner-Result Augmentation

Pathway relevance remains derived from Enrollment → Program → Career and is not
an access-control substitute.

## 17. Readiness Safety

Visibility did not label the learner qualified, certified, hired, or job-ready.

## 18. Revoked Membership

After revoking Student A membership, event list, opportunity list, direct detail,
and Calendar requests all returned 401.

## 19. Direct-ID Protection

Student B and Org B direct-ID requests returned 404-safe responses.

## 20. Replay / Deduplication

Existing versioned status records and stable Calendar source IDs prevent
duplicate learner-visible projections. No duplicate was observed.

## 21. Update / Correction

Canonical status changes propagated on the next API/Calendar read; cancellation
removed records from the student current view.

## 22. Cancellation

Cancelled events and opportunities were absent from student lists and Calendar.

## 23. Calendar Integration

**PASS.** Career Event and Opportunity records project through shared
`GET /calendar/events/me`, with one source projection per record.

## 24. Final Learner Consumer

Mounted route `career.html#/calendar` → `CareerRoutes` → `CareerCalendar` →
`useCalendarEvents` → `/calendar/events/me`.

## 25. Browser Happy Path

Playwright observed current WF026 event and opportunity text in the mounted
Calendar and recorded two canonical Calendar API requests.

## 26. Browser Ineligible Path

The same protected projection returned no Program B data; direct IDs could not
obtain it.

## 27. Browser Expired / Cancelled Path

Expired and cancelled fixtures were removed from API/Calendar current results;
reopening the route showed no stale current record.

## 28. Fresh Session

A new Playwright browser context reconstructed the Calendar view from backend
state without browser-local institutional truth.

## 29. API Failure / Recovery

The Calendar hook has explicit error/unavailable handling and no protected
stale-data fallback. API restoration plus route reload recovered normal data.

## 30. PostgreSQL Acceptance

Migrations 001–125 applied with `pending=[]`, `drift=[]`, `unknownApplied=[]`.
Schema integrity returned `{ "ok": true, "failures": [] }`.

## 31. API Acceptance

| Operation | Student A | Student B | Wrong Org | Wrong Program | Revoked | Result |
|---|---:|---:|---:|---:|---:|---|
| Event list | 200 | 200 empty | 200 empty | 200 empty | 401 | PASS |
| Opportunity list | 200 | 200 empty | 200 empty | 200 empty | 401 | PASS |
| Event detail | 200 | 404 | 404 | 404 | 401 | PASS |
| Opportunity detail | 200 | 404 | 404 | 404 | 401 | PASS |
| Calendar projection | 200 | scoped | scoped | scoped | 401 | PASS |

## 32. Operational Events

Existing Career status persistence and shared Calendar projection were used; no
new event bus was introduced.

## 33. Failure / Recovery

Career visibility and Calendar projection are synchronous/stateless for this
workflow; separate async retry/quarantine is N/A.

## 34. Performance

Scope/status/date predicates and enrollment `EXISTS` checks are bounded and
index-compatible. Calendar calls each source once; no query-per-item loop was
found.

## 35. Accessibility

Existing semantic controls, labels, status text, keyboard operation, responsive
layout, and reduced-motion behavior remained intact; UI validation passed.

## 36. Regression

Career foundation and public visibility tests passed 5/5. API typecheck/build,
root build, manifests, UI validation, migration status, schema integrity, and
`git diff --check` passed. Legacy HTTP suites with unavailable default port or
timestamped users without memberships were classified as fixture/harness
limitations; fixed-identity API proof passed.

## 37. Failure Classification

The shared-memory issue was **ENVIRONMENT — LOCAL POSTGRESQL SHARED MEMORY
CONFIGURATION**. Initial timestamped-suite 401s were **FIXTURE/HARNESS**. The
expired visibility leak was a confirmed **PRODUCT DEFECT** and was corrected.

## 38. Remediation

Added student-tier opening/deadline predicates for Opportunities and end-time
suppression for published Career Events. No architecture redesign was made.

## 39. Migration

No migration added; head remains 125.

## 40. Files Created

This report.

## 41. Files Modified

`apps/shs-api/src/domain/career-events/repo/career-event-repo.ts`,
`apps/shs-api/src/domain/opportunities/repo/opportunity-repo.ts`, and the
systemwide status artifacts.

## 42. Owner Work Preservation

No reset, stash, clean, rebase, commit, push, unrelated deletion, migration
rewrite, production database access, Azure provisioning, or SYS-5 work occurred.

## 43. Workflow Completion Matrix

| Workflow | Trigger | Final Consumer | Success Terminal | Failure Terminal | Live Proven |
|---|---|---|---|---|---|
| WF-026 event visibility | Published scoped event | Career Calendar/API | Visible current event | Draft/cancelled/expired/unauthorized suppressed | Yes |
| WF-026 opportunity visibility | Open eligible opportunity | Career Calendar/API | Visible current deadline | Closed/cancelled/expired/unauthorized suppressed | Yes |

## 44. Remaining Risks

CRITICAL: none. HIGH: none. MEDIUM: broader legacy suites need their own
default-service/identity fixture setup. LOW: no Azure-backed WF-026 workflow.

## 45. WF-026 Decision

**WF-026 COMPLETE**

## 46. SYS-4 Final Closure Check

The current SYS-4 assignment contains 11 explicitly listed workflows: WF-018 through WF-026,
WF-033, and WF-034. The registry now classifies all 11 COMPLETE. Earlier prose
that said 12 was a stale count-label inconsistency, not an additional workflow.

## 47. SYS-4 Decision

**SYS-4 CURRICULUM / STUDENT END-TO-END WORKFLOW WAVE COMPLETE**

## 48. Next Systemwide Phase

The roadmap identifies SYS-5 as next. It was not started.
