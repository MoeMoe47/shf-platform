# SYS-4B Guided Lesson / Activity Consumer Integration Report

## 1. Executive Result

PARTIAL. The mounted lesson now resolves an organization-scoped assignment and published release lesson, and canonical activity/completion clients are wired. A fresh browser/PostgreSQL acceptance run remains required before closure.

## 2. Repository Baseline

Repository: `/Users/mikeslate/Projects/shrv1`; branch `studio-v1-plus-development`; HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. Final status: 238 dirty paths, 94 tracked and 144 untracked (including extensive owner work). Migration filename head: `121_report_publication_supersession_current.sql`; applied head remains 121 from prior fresh acceptance. PostgreSQL `localhost:55433`: unavailable. SHS API/frontend/Agent Fabric: not running at final source verification. No owner work was reverted.

## 3. SYS-4B Scope

WF-019 mounted guided lesson integration: assignment -> canonical lesson/activity state -> submissions -> policy-gated completion. SYS-4C outcome/mastery, portfolio, career, credential, institutional reporting, and broader instructor/admin consumers remain out of scope.

## 4. Active Student Entrypoint

`curriculum.html` -> `src/entries/curriculum.main.jsx` -> `/curriculum/lessons/:slug` -> `src/pages/StudentUnit.jsx` -> `GuidedLessonExperience`.

## 5. StudentUnit Static / Local-State Audit

Before this phase, the mounted route used `studentLoader` content, `AssessmentRenderer`, `VocabularyReview`, and local progress as authoritative-looking state. The mounted path now requires an active assignment and canonical activity state. Legacy `AssessmentRenderer`/`progressClient` remain only for the separate legacy preview route; vocabulary review and stage navigation are UI-only and do not authorize completion.

## 6. Canonical Lesson Data Integration

`GET /activity-domains/assignments/:assignmentId/lessons/:unitStableKey/:lessonStableKey` now returns the bound lesson from the immutable curriculum release snapshot. `StudentUnit` prefers that payload, while the bundled loader is retained only for route discovery/transition compatibility.

## 7. Student Learner State Integration

Practice, assessment, and reflection use canonical submission endpoints. Completion uses `POST /assignments/:id/check-completion`; no client-supplied completion flag is read.

## 8. Orient

Uses the canonical release lesson payload for title, summary, objectives, and lesson context.

## 9. Check-In

No canonical check-in field was found; remains UI-unavailable rather than fabricated.

## 10. Learn

Rendered from the canonical release lesson payload when available.

## 11. Vocabulary

Embedded canonical lesson vocabulary is displayed. Review interaction remains presentation/local UI state and is not used as institutional completion.

## 12. Check Understanding

Canonical assessment definition and server evaluation are used when assigned.

## 13. Practice

Canonical practice submission with idempotency key and server result.

## 14. Practice Retry

The API preserves attempt semantics; browser retry acceptance remains to be run against a fresh live stack.

## 15. Learning Arcade

No canonical Arcade activity was present in the bounded lesson API contract; retained as follow-on scope where not assigned.

## 16. Apply

Existing prepare/prove path remains unchanged; no new authority was introduced.

## 17. Assessment

Canonical assessment definitions are rendered and submitted through `/activity-domains/assessments/submissions`.

## 18. Failed Assessment

Server `passed` and completion policy remain authoritative. Focused API coverage from SYS-4A proves failed results do not satisfy completion; mounted browser proof remains pending.

## 19. Assessment Retry

Submission idempotency is scoped per attempt key; subsequent attempts are server-numbered. Live browser retry is pending.

## 20. Reflection

Canonical reflection submissions use `/activity-domains/reflections/submissions`; reflection text is not promoted directly to Truth.

## 21. Completion Policy

`CompletionCheckPanel` uses the canonical assignment completion evaluator when `assignmentId` is present. Requirements returned by the server are displayed; the browser cannot bypass policy.

## 22. Lesson Completion

The canonical check-completion route persists completion only after required policy conditions pass.

## 23. Assignment Consumer

Assignment resolution and completion remain owned by the Assignment/entitlement service. The mounted route resolves its assignment through `/assignments`.

## 24. Next-Action Consumer

Dashboard/next-action remains the canonical downstream consumer. A fresh browser acceptance must verify the dashboard changes after completion.

## 25. Evidence Boundary

No duplicate Evidence authority was introduced. Activity submissions remain distinct from institutionally verified Evidence unless existing downstream policy admits them.

## 26. Student Isolation

The activity API resolves assignment access for the authenticated actor and returns not-found/denial for out-of-scope assignments. Existing SYS-4A API isolation evidence is preserved; fresh browser negative proof is pending.

## 27. Wrong-Org / Revoked Membership

Authorization remains server-side through assignment permission and organization context. No caller-supplied organization is trusted by the client.

## 28. Idempotency

Submission requests carry idempotency keys; completion is a server-side check. Duplicate browser replay acceptance remains pending.

## 29. Failure / Recovery

API errors render as recoverable alerts and do not mark completion. A fresh unavailable-API submission test remains required.

## 30. Operational Events

Existing activity submission and completion outbox/event paths are reused.

## 31. Event Consumers

No new event infrastructure was added. Existing canonical activity/completion consumers remain the dependency; broad event-consumer proof is follow-on acceptance.

## 32. PostgreSQL Acceptance

SYS-4A live PostgreSQL API acceptance remains green. SYS-4B fresh browser/database acceptance was not run in the final source-verification window because PostgreSQL was unavailable.

## 33. API Acceptance

The client targets the existing canonical routes. API typecheck/build pass; a fresh full SYS-4B HTTP run is pending.

## 34. Browser Happy Path

Not yet live-proven for the mounted StudentUnit.

## 35. Browser Failed Path

Not yet live-proven for the mounted StudentUnit.

## 36. Browser Retry Path

Not yet live-proven for the mounted StudentUnit.

## 37. Refresh / Fresh-Session Durability

Authoritative activity/completion state is no longer stored in browser localStorage on the canonical mounted path. Fresh browser proof remains pending.

## 38. Frontend Local-State Cleanup

Removed the mounted path's dependency on the legacy assessment renderer and local completion action. UI navigation, vocabulary review, and presentation-only stage state remain local by design.

## 39. Accessibility Regression

Existing guided lesson accessibility validation remains in place. Build/UI contract validation passes; browser keyboard/mobile regression remains pending.

## 40. Performance Sanity

The mounted path adds assignment and activity-state reads and uses bounded lesson payloads. Structural query-plan acceptance remains pending with a live database.

## 41. Regression

API typecheck/build, root build, manifest validation, UI validation, and diff hygiene pass. SYS-4A focused API evidence remains preserved. Full SYS-4B browser regression is pending.

## 42. Azure Dependency

N/A — NO AZURE-BACKED SYS-4 WORKFLOW PRESENT.

## 43. Failure Classification

Missing running PostgreSQL/API for final acceptance: ENVIRONMENT. No production defect was inferred from unavailable infrastructure.

## 44. Remediation Performed

Added canonical activity API client; returned release-bound lesson payload from the existing activity authority; resolved assignment context in StudentUnit; connected canonical practice/assessment/reflection submissions and policy-gated completion; retained legacy preview compatibility.

## 45. Migrations

None.

## 46. Files Created

`src/lib/curriculum/activityApi.js`; `src/components/curriculum/lesson/CanonicalActivityPanel.jsx`; this report.

## 47. Files Modified

`src/pages/StudentUnit.jsx`; `src/components/curriculum/lesson/GuidedLessonExperience.jsx`; `src/components/curriculum/lesson/CompletionCheckPanel.jsx`; `apps/shs-api/src/domain/activity-domains/service/activity-domain-service.ts`; systemwide artifacts.

## 48. Owner Work Preservation

No reset, stash, clean, checkout, migration rewrite, commit, push, or unrelated deletion was performed.

## 49. Workflow Completion Matrix

| Stage | Canonical Source | API | Browser | Persistence | Final |
|---|---|---|---|---|---|
| Assignment/lesson load | Assignment + release | Connected | Pending | Existing | PARTIAL |
| Practice | Activity domain | Connected | Pending | Existing | PARTIAL |
| Assessment | Activity domain | Connected | Pending | Existing | PARTIAL |
| Reflection | Activity domain | Connected | Pending | Existing | PARTIAL |
| Completion | Completion policy | Connected | Pending | Existing | PARTIAL |
| Next action | Assignment entitlement | Existing | Pending | Existing | PARTIAL |

## 50. Remaining SYS-4 Work

SYS-4C: outcomes/mastery, progress, portfolio/skill profile, career, credentials, institutional reporting, and related final consumers. Broader Arcade, instructor/admin, calendar, live learning, accessibility, performance, isolation, and regression closure remain follow-on scope where not already covered.

## 51. Remaining Risks

CRITICAL: none identified. HIGH: mounted browser and fresh live acceptance not yet proven. MEDIUM: canonical release snapshot must contain the instructional fields expected by the guided shell; broader downstream outcome consumers remain open. LOW: legacy preview/local UI state remains outside the canonical mounted path.

## 52. SYS-4B Decision

**SYS-4B GUIDED LESSON / ACTIVITY CONSUMER INTEGRATION INCOMPLETE**

## 53. Next Phase

Complete the fresh SYS-4B PostgreSQL/API/browser acceptance and then proceed to the dependency-ranked SYS-4C outcome/mastery and downstream learner-consumer slice. Do not begin SYS-4C until this report's browser and live acceptance gates pass.

## SYS-4B2 Acceptance Update — 2026-09-10

Fresh disposable database `shs_sys4b2_20260909` was migrated through 121 and
passed schema integrity. The self-contained SYS-4A API scenario passed 1/1
against SHS API port 8097, including canonical lesson payload delivery with
answer keys removed, activity submissions, and completion policy evaluation.

The active root Vite entry `curriculum.html` was exercised on port 5175. The
mounted route `/curriculum/lessons/lesson-1` initially exposed a real defect:
course-scoped assignments do not serialize `scopeLessons`, and the completion
panel used `slug`/`id` instead of the canonical release `stableKey`. The route
was corrected to resolve the unit through the existing course-detail API and
the completion panel now sends `stableKey`. Browser acceptance then observed
assignment/course/activity requests, submitted the canonical assessment, got
HTTP 200 `complete: true`, displayed `Synchronized` and `Lesson Complete`,
and displayed the completion state after reopening the Completion stage.

PostgreSQL/API/browser failure-path, wrong-student, wrong-org, revoked
membership, duplicate replay, full refresh/fresh-session, and next-action
matrix acceptance was not fully completed in this run. Therefore WF-019 and
SYS-4B remain `PARTIAL`; SYS-4C was not started.

## SYS-4B2 Live Acceptance Update — 2026-09-10

Fresh disposable PostgreSQL `shs_sys4b2_20260909` was applied through
migration 121 with `pending=[]`, `drift=[]`, `unknownApplied=[]`, and schema
integrity `{ok:true,failures:[]}`. The focused canonical API integration passed
1/1. The active Vite root ran on 5175 and the SHS API on 8097.

The mounted `/curriculum/lessons/lesson-1` route made the expected assignment,
course-detail, and activity-state requests. Browser assessment submission then
received HTTP 200 from `POST /assignments/:id/check-completion` with
`complete:true`; the page displayed `Synchronized` and `Lesson Complete`. A
course-scoped unit-key resolution defect and stable-key completion defect found
during this run were corrected without adding schema or authority.

The completion panel now rechecks canonical state when opened, enabling
reload/fresh-session rehydration. Full failed-assessment, retry, duplicate,
wrong-student/org, revoked-membership, API-failure recovery, and dashboard
next-action acceptance remains outstanding. SYS-4B therefore remains
`PARTIAL`.

## SYS-4B3 Final Acceptance Addendum — 2026-09-10

Fresh `shs_sys4b3_20260909` PostgreSQL/API/browser acceptance closed the
remaining bounded gates. Failed assessment persisted and remained incomplete;
refresh rehydrated the retry affordance; the second attempt passed and created
one canonical completion. Duplicate assessment and completion requests were
idempotent. Wrong-org, wrong-student, and revoked-membership requests failed
closed. A blocked assessment request produced an error without false success,
then recovered with one persisted result. Assignment progress changed to
completed and `/assignments/me/next` changed to `nothing_to_do`; reload and a
fresh browser context restored the completed state from the API.

Database-backed development identity mode was made authoritative so an
inactive membership cannot fall through to a legacy demo identity. API
typecheck/build, root build, manifest/UI validation, focused identity
regression, schema status, and diff hygiene passed. WF-019 is now `COMPLETE`
for the mounted guided lesson/activity consumer boundary. SYS-4C remains
downstream.
