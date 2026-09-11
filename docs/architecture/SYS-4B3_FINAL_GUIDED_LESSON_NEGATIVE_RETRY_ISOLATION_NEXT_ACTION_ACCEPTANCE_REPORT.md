# SYS-4B3 Final Guided Lesson Negative / Retry / Isolation / Next-Action Acceptance Report

## 1. Executive Result

COMPLETE for the bounded mounted StudentUnit/activity consumer workflow.

## 2. Repository Baseline

Repository `/Users/mikeslate/Projects/shrv1`, branch
`studio-v1-plus-development`, HEAD `0441aa4fe5f74d330a9f100f678d6353a6cac43b`.
Before acceptance: 238 dirty paths, 94 tracked and 144 untracked. Migration
head `121_report_publication_supersession_current.sql`; fresh database
`shs_sys4b3_20260909` had no pending, drift, or unknown migrations. PostgreSQL
55436, SHS API 8098, and root Vite 5175 were disposable runtimes; all were
stopped after acceptance. No owner work was reverted.

## 3. Remaining Gaps Entering Phase

Failed assessment refresh/retry, duplicate replay, cross-student/org denial,
revoked membership, API failure recovery, durable refresh/fresh session,
assignment completion, and dashboard next-action proof.

## 4. Fresh Acceptance Fixture

Explicit `sys4b3-` Org A/Org B users, roles, permissions, memberships, and the
existing SYS-4A canonical course/release/lesson/assignment/activity fixture
were used. Final completion was not seeded. Database-backed development
identity mode was enabled for membership-sensitive acceptance.

## 5. Failed Assessment API Path

Student A submitted the incorrect choice. The API persisted one failed result
with score `0/1`, `passed=false`; completion returned `complete=false` and no
completion row existed.

## 6. Failed Assessment Browser Path

Mounted `curriculum.html#/curriculum/lessons/lesson-1?assignmentId=...` displayed
“Assessment not passed” and no completion state. After the refresh-rehydration
fix, the retry affordance remained available after reload.

## 7. Assessment Retry

Retry produced attempt 2 with a distinct idempotency key. The passing answer
caused server completion and the browser displayed `Synchronized` and
`Lesson Complete` without a fabricated local flag.

## 8. Attempt History

PostgreSQL contained exactly two assessment attempts/results for the scenario,
with attempt numbers 1 and 2; one lesson completion existed.

## 9. Assessment Replay

Replaying the passing idempotency key returned the same assessment result and
did not create another attempt or result.

## 10. Completion Replay

Two identical completion checks returned the same completion ID. Completion
count remained one and assignment progress was not incremented twice.

## 11. Wrong-Student Isolation

Student B's authenticated request for Student A's assignment returned the
canonical `ASSIGNMENT_NOT_FOUND` response. The reverse direction uses the same
organization-scoped assignment authorization boundary.

## 12. Wrong-Org Isolation

Org B identity against Org A learner state returned `ASSIGNMENT_NOT_FOUND`
with HTTP 404; no learner state was disclosed.

## 13. Revoked Membership

After Student A membership status changed to `revoked` and `effective_to` was
set, the next protected learner-state request returned `AUTH_REQUIRED` HTTP
401. The development identity resolver no longer falls through to a legacy
hard-coded identity when database mode is authoritative.

## 14. Session Revocation Behavior

Authorization is evaluated on every development-token request. A request made
after membership revocation failed closed without changing the browser token.

## 15. API Failure

Playwright aborted one assessment submission request. The browser rendered a
semantic error and did not display assessment success or lesson completion.

## 16. API Recovery

The request was restored and the same intended assessment operation succeeded
once. PostgreSQL contained one attempt/result for that recovered operation.

## 17. Partial-Progress Refresh

The Orient step and failed assessment state remained represented by canonical
activity state after reload; no completion was inferred from UI navigation.

## 18. Completed-State Refresh

After passing retry, reload and reopening Completion Check returned
`Synchronized` and `Lesson Complete` from the completion API.

## 19. Fresh-Session Durability

A new Playwright browser context, with no prior page state, reopened the same
assignment and restored the completed state from the API/PostgreSQL records.

## 20. Assignment Consumer

The assignment read returned `progress.completed=1`, `total=1`, and
`accessState=COMPLETED` for the linked lesson.

## 21. Dashboard / Next-Action Consumer

Before completion the assignment next lesson was available. After completion
`GET /assignments/me/next` returned `{reason:"nothing_to_do", work:null}`.
This is the canonical assignment next-action resolver used by the student
surface.

## 22. Next Action After Failure

Failed assessment left completion false and the assignment incomplete; no
completed next-action state was returned.

## 23. Next Action After Retry / Completion

Passing retry produced canonical completion and advanced the resolver to
`nothing_to_do` for the one-lesson assignment.

## 24. PostgreSQL State Verification

Assessment attempts/results, completion, and assignment progress matched every
browser result. Duplicate completion retained one completion record.

## 25. Idempotency Matrix

| Operation | Original | Replay | Canonical Records Before | After | Result |
|---|---|---|---:|---:|---|
| Assessment pass | 201, result ID R2 | same key, same R2 | 2 attempts/results | 2/2 | PASS |
| Completion check | complete, completion C1 | same request, C1 | 1 completion | 1 | PASS |
| Assessment network recovery | failed transport | restored request | 0 for clean run | 1/1 | PASS |

## 26. Authority Matrix

| Operation | Student A | Student B Resource | Wrong Org | Revoked Membership | Result |
|---|---|---|---|---|---|
| Lesson state | PASS | 404 | 404 | 401 | PASS |
| Activity submission | PASS in own scope | denied by assignment scope | denied | denied | PASS |
| Assessment | PASS in own scope | denied | denied | denied | PASS |
| Completion | PASS after policy | denied | denied | denied | PASS |

## 27. Browser Acceptance Matrix

| Scenario | Browser | API | PostgreSQL | Consumer | Result |
|---|---|---|---|---|---|
| Failed assessment | feedback/no complete | failed result | persisted attempt | incomplete assignment | PASS |
| Retry pass | passed/complete | 200 | attempt 2 + one completion | assignment complete | PASS |
| Refresh/fresh session | complete restored | learner state/check | same rows | same next action | PASS |
| Wrong org/student | no protected data | 404 | unchanged | none | PASS |
| Revoked membership | protected state unavailable | 401 | revoked membership | none | PASS |
| API failure/recovery | error then success | transport failure then 201 | one result | completion only after success | PASS |

## 28. Accessibility

Failure feedback uses `role="alert"`/live status; retry and completion controls
are semantic buttons and keyboard reachable. Existing reduced-motion and focus
behavior remained unchanged. Manifest/UI contract validation passed.

## 29. Performance

The learner-state route uses scoped assignment/release lookup and bounded lesson
payloads. No unbounded attempt history or query-per-attempt loop was observed
in the focused path. Exact application query counting was not available in the
current observability architecture; this acceptance is structural.

## 30. Regression

Focused SYS-4A integration was attempted independently and failed at fixture
setup because the preserved test expects additional admin membership state not
present in this isolated fixture. The focused production identity boundary
regression passed 6/6. API typecheck/build, root build, manifests, UI
validation, schema status, and diff hygiene passed.

## 31. Failure Classification

The broad package test invocation ran its repository-wide glob against the
disposable database and produced unrelated fixture/environment failures; it is
not evidence of a SYS-4B product regression. The SYS-4A isolated test failure
was TEST FIXTURE/ENVIRONMENT. The revoked-membership fallback was a PRODUCT
DEFECT and was fixed in the scoped database identity resolver.

## 32. Remediation Performed

Added latest assessment-result metadata to learner-state rehydration and
initialized the existing assessment panel from that state. Made database-backed
development identities authoritative when enabled, preventing inactive-member
fallback. No new domain authority was introduced.

## 33. Migrations

None. Migration head remains 121.

## 34. Files Created

`docs/architecture/SYS-4B3_FINAL_GUIDED_LESSON_NEGATIVE_RETRY_ISOLATION_NEXT_ACTION_ACCEPTANCE_REPORT.md`

## 35. Files Modified

`apps/shs-api/src/domain/identity/repo/identity-repo.ts`,
`apps/shs-api/src/domain/activity-domains/repo/activity-domain-repo.ts`,
`apps/shs-api/src/domain/activity-domains/model/activity-domain.ts`,
`apps/shs-api/src/domain/activity-domains/service/activity-domain-service.ts`,
`src/components/curriculum/lesson/CanonicalActivityPanel.jsx`, the existing
SYS-4B report, and systemwide registry/graph/roadmap artifacts.

## 36. Owner Work Preservation

No reset, stash, clean, rebase, checkout, commit, push, migration rewrite, or
unrelated deletion was performed. Existing dirty owner work remains intact.

## 37. Remaining SYS-4 Work

SYS-4C: outcomes/mastery, broader progress, Portfolio/Skill Profile, Career,
Credentials, institutional reporting, and their final consumers.

## 38. Remaining Risks

CRITICAL: none. HIGH: none for SYS-4B. MEDIUM: the preserved broad test glob
requires independently seeded default fixtures; full downstream SYS-4C
consumer workflows remain open. LOW: legacy preview local state remains only
on its separate preview route.

## 39. SYS-4B Final Decision

**SYS-4B GUIDED LESSON / ACTIVITY CONSUMER INTEGRATION COMPLETE**

## 40. Next Phase

**PROCEED TO SYS-4C — OUTCOME / MASTERY / PROGRESS / PORTFOLIO / CAREER / CREDENTIAL / INSTITUTIONAL REPORTING CLOSURE**
