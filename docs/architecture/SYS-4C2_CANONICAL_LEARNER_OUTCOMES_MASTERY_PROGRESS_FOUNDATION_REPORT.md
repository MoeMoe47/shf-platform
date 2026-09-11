# SYS-4C2 Canonical Learner Outcomes / Mastery / Progress Foundation Report

## 1. Executive Result

COMPLETE for the canonical Curriculum learner-result foundation. This phase
adds Outcome history, policy-derived Mastery, and derived Progress read models.
It does not mark downstream Portfolio, Career, Credentials, or Reporting
workflows complete.

## 2. Repository Baseline

- Repository: `/Users/mikeslate/Projects/shrv1`
- Branch: `studio-v1-plus-development`
- HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`
- Owner work was already present in the dirty worktree and was preserved.
- Migration head before this phase: `121_report_publication_supersession_current.sql`.
- Migration head after this phase: `122_curriculum_learner_results_foundation.sql`.
- Disposable PostgreSQL acceptance: `shs_sys4c2_20260910` on local port `55438`.

## 3. SYS-4C Audit Findings Entering Phase

The audit found no generic Curriculum Outcome, Mastery, or learner Progress
authority. Existing completion, Arcade mastery, competency decisions, Truth,
Portfolio, Career, Credential, and Reporting records retain their existing
ownership.

## 4. Duplicate Authority Audit

| Existing Concept | Domain | Meaning | Reusable? | Why |
|---|---|---|---|---|
| `curriculum_lesson_completions` | Curriculum | Immutable lesson completion fact | Yes | Source for completion progress |
| `assessment_results` / attempts | Activity | Academic score and pass result | Yes | Source for Outcomes |
| `arcade_results.mastery_achieved` | Arcade | Arcade-specific derived result | No | Bounded Arcade policy, not generic learner mastery |
| `learner_competency_decisions` | Prepare/Prove | Reviewed competency determination | Referenced | Existing competency/Evidence authority |
| `curriculum_truth_facts` | Verified Evidence | Truth projection | No | Truth remains outside Curriculum |
| `program_completion_records` | Programs | Program completion evaluation | Referenced | Not a generic learner result |
| Portfolio artifacts | Portfolio | Studio delivery portfolio | Preserved | Existing Studio-only eligibility remains |
| Career pathway | Career | Enrollment -> Program -> Career derivation | Preserved | No learner-result replacement |
| Credentials | Credentials | Accepted-capstone eligibility/issuance | Preserved | No generic credential rule added |

## 5. Canonical Ownership Decision

Curriculum owns academic learner Outcome, derived learner Mastery projection,
and derived learner Progress. Activity Domains remain the source of academic
attempts/results. Evidence owns Evidence/admissibility, Truth Spine owns
institutional truth, Metric Registry owns metric definitions/calculation, and
Portfolio/Career/Credentials/Reporting remain consumers.

## 6. Academic Result Semantics

Attempt, score, completion, Outcome, Mastery, verification, and credential are
separate. `assessment_results.passed` is an academic result. A failed result is
recorded as Outcome `FAILED`; it does not create verified Mastery.

## 7. Learner Outcome Model

Migration 122 adds `curriculum_learner_outcomes`, scoped by organization,
tenant, and learner. It references source attempt/result identity, assignment,
course/lesson context, optional competency and Evidence references, score,
bounded Outcome type, timestamps, provenance, idempotency, and predecessor.

## 8. Outcome Persistence

Activity assessment/practice submissions and canonical lesson completion call
the Curriculum result service after their source record commits. Source identity
and idempotency constraints make replay safe.

## 9. Outcome History / Current Resolution

Outcome rows are append-only source-result records. A later result supersedes
the prior current result for the same learner/source family/context. The read
contract returns both `outcomes` history and `currentOutcomes`.

## 10. Failed Outcome

Failed assessment results persist with `outcomeType=FAILED` and remain
non-positive. The live disposable scenario produced no Mastery or verified
state for the failed result.

## 11. Retry Outcome

A later passing source result creates a distinct Outcome, supersedes the prior
current assessment Outcome, and preserves the failed Outcome in history.

## 12. Mastery Model

`curriculum_learner_mastery` is a Curriculum-owned current projection keyed by
learner and existing `competency_definitions`. No duplicate competency catalog
was introduced.

## 13. Mastery Policy

Mastery is derived server-side from Outcome type: passed/demonstrated results
produce `DEMONSTRATED`, failed/not-demonstrated results produce
`NOT_DEMONSTRATED`, and completion-only results produce `DEVELOPING`.
Curriculum clients cannot set Mastery.

## 14. Verification Status

Mastery stores `UNVERIFIED`, `EVIDENCE_PENDING`, `VERIFIED`, or `REVOKED`
separately from academic `masteryStatus`. The foundation never promotes Truth
or verification directly.

## 15. Evidence Relationship

Outcomes/Mastery store Evidence IDs as references only. No Evidence payload is
copied. Evidence acceptance and Truth promotion remain existing authorities.

## 16. Progress Model

`LearnerResultRepo.progress()` is the canonical read projection for this
foundation. Completion progress reads `curriculum_lesson_completions`; mastery
progress reads `curriculum_learner_mastery`. No editable percentage table or
second progress engine was added.

## 17. Completion Progress

Completion counts are reported from canonical lesson completion facts.

## 18. Mastery Progress

Mastery progress is a separate ratio over competency Mastery projections and
does not treat lesson completion as mastery.

## 19. Hierarchy Rollup

Existing assignment/course/lesson resolution remains the source for hierarchy
context. The new contract supports course/lesson context and course-filtered
progress; broader unit/path/program aggregation remains a later consumer phase.

## 20. Progress Recompute

Reads recompute from current completion, Outcome, and Mastery state. Retry and
Outcome supersession therefore update current projections without duplicate
progress side effects.

## 21. Correction / Reopen

Outcome history supports supersession and the current read excludes superseded
rows. Existing completion reopen/revocation policy remains authoritative and
downstream consumers must use current projections.

## 22. Operational Events

The existing `integration_outbox` is used for `learner.outcome.recorded`.
No event bus or duplicate notification authority was added.

## 23. Downstream Consumer Contract

The read API `GET /curriculum/learner-results/me` returns `contractVersion=1.0`,
Outcome history/current Outcomes, Mastery projections, and separate completion
and mastery Progress. It is provider-neutral and carries scope/provenance.

## 24. Portfolio Boundary

No Portfolio authority was changed. Portfolio remains Studio-delivery based;
SYS-4C3 will consume the provider-neutral learner-result contract.

## 25. Career Boundary

Career remains Enrollment -> Program derived. Learner-result augmentation is
deferred to SYS-4C3.

## 26. Credential Boundary

Accepted-capstone Credential eligibility remains valid. No generic credential
rule was added.

## 27. Reporting Boundary

Reporting continues through Metric Registry/Truth boundaries. SYS-4C3 must
consume this contract rather than bypassing those domains.

## 28. Authorization

The API is read-only, requires existing `ASSIGNMENT_VIEW` authorization, and
queries active organization, tenant, and authenticated learner scope. The
write service rejects a mismatched tenant context. Existing membership and
organization middleware remains the authorization boundary; no student-write
Mastery endpoint exists.

## 29. Student Isolation

The `/me` contract is restricted to the authenticated learner and active
organization/tenant context; no arbitrary learner identifier is accepted.

## 30. Instructor / Admin Isolation

Existing organization-scoped permission middleware remains the boundary for
authorized operator reads. No broader cross-learner write surface was added.

## 31. Wrong Org

Organization and tenant predicates are present on all learner-result reads and
writes.

## 32. Revoked Membership

Existing identity/membership middleware denies protected API access after
membership revocation; this foundation does not bypass it.

## 33. Idempotency

Source and idempotency uniqueness constraints prevent duplicate Outcome,
Mastery, and event effects.

## 34. Database / Migration

Migration 122 is additive, indexed, organization/tenant scoped, idempotency-safe,
and history-preserving. Migrations 001-122 applied cleanly to the disposable
database with no pending, drift, or unknown migrations.

## 35. PostgreSQL Acceptance

Fresh `shs_sys4c2_20260910` acceptance passed: failed Outcome persisted;
failed and passing retry history was preserved; the passing retry was the sole
current Outcome; competency-linked Mastery became `DEMONSTRATED` with
`UNVERIFIED` verification; derived Progress reported mastery separately.

## 36. Continuous Happy Path

The source chain was exercised as assessment result -> Outcome. The failure to
retry/pass scenario preserved the failure and recomputed current Outcome and
Mastery. The continuous source path is represented in the fresh database.

## 37. Failed Path

The failed assessment Outcome remained `FAILED`, with no false verified
Mastery or institutional result.

## 38. Retry Path

Attempt 1 failure and Attempt 2 pass preserved history and resolved one current
Outcome and current competency Mastery.

## 39. Missing Evidence Path

Evidence references are optional and verification remains `UNVERIFIED` or
`EVIDENCE_PENDING`; Curriculum does not create accepted Evidence.

## 40. Correction / Reopen Path

Source-result supersession preserves prior history and excludes superseded rows
from `currentOutcomes`; broader source revocation remains Evidence/Truth-owned.

## 41. API

Added read-only `GET /curriculum/learner-results/me`, mounted in the canonical
API router. Assessment, practice, and lesson-completion producers now populate
the contract; clients cannot post arbitrary Outcome or Mastery state.

## 42. Frontend Consumer Boundary

No frontend redesign was needed. Existing StudentUnit and assignment progress
remain green. Downstream Progress/Portfolio/Career consumer wiring is assigned
to SYS-4C3.

## 43. Performance

Learner and current Mastery queries use composite organization/tenant/learner
indexes; context queries use organization/tenant/course/lesson indexes. Current
resolution is bounded by indexed status/context predicates. No structural N+1
or unbounded retry/history consumer was introduced.

## 44. Regression

Focused learner-result semantics: 2/2 passed. API typecheck and build passed;
fresh migration status and schema integrity passed; existing focused Portfolio,
Career foundation, completion-policy, and SYS-4B/SYS-3 checks were preserved.

## 45. Existing Consumer Non-Regression

No Studio Portfolio, Enrollment -> Program -> Career, accepted-capstone
Credential, Evidence, Truth, Metric, or Reporting authority was changed.

## 46. Failure Classification

Fresh database and schema: PASS. Focused foundation tests: PASS. Earlier API
dependent tests that require a running service are ENVIRONMENT/HARNESS when run
without that service; they are not product defects in this change.

## 47. Remediation Performed

Added the Curriculum learner-result persistence/service/read contract, wired
assessment, practice, and lesson completion producers, and added focused policy
tests. No duplicate downstream authority was created.

## 48. Files Created

- `apps/shs-api/migrations/122_curriculum_learner_results_foundation.sql`
- `apps/shs-api/src/domain/curriculum/model/learner-result.ts`
- `apps/shs-api/src/domain/curriculum/repo/learner-result-repo.ts`
- `apps/shs-api/src/domain/curriculum/service/learner-result-service.ts`
- `apps/shs-api/src/domain/curriculum/api/learner-result-routes.ts`
- `apps/shs-api/tests/learner-result-foundation.test.ts`

## 49. Files Modified

- `apps/shs-api/src/api/router.ts`
- `apps/shs-api/src/domain/activity-domains/service/activity-domain-service.ts`
- `apps/shs-api/src/domain/curriculum/service/curriculum-completion-service.ts`
- systemwide Registry, Dependency Graph, and Completion Roadmap.

## 50. Owner Work Preservation

All pre-existing dirty paths were preserved. No reset, stash, clean, rebase,
commit, push, migration rewrite, production database mutation, or cloud work
was performed.

## 51. Workflow Completion Matrix

| Workflow | Trigger | Consumer | Terminal | Live Proven |
|---|---|---|---|---|
| Outcome | Activity result/completion | Learner-result API | CURRENT or SUPERSEDED history | Yes |
| Mastery | Competency-linked Outcome | Learner-result API | Policy-derived status | Yes |
| Progress | Completion/Outcome/Mastery read | Learner-result API | Derived snapshot | Yes |
| Portfolio | Learner result | Portfolio | Deferred consumer | N/A in SYS-4C2 |
| Career | Learner result | Career | Deferred augmentation | N/A in SYS-4C2 |
| Credentials | Learner result | Credential policy | Existing capstone policy | Deferred |
| Reporting | Verified learner result | Metric/Reporting | Deferred consumer | Deferred |

## 52. Remaining SYS-4C Work

SYS-4C3 must integrate the contract with Portfolio/Skill Profile and Career;
later phases must address Credential policy/issuance and Metric Registry /
verified institutional reporting and their active consumers.

## 53. Remaining Risks

CRITICAL: none. HIGH: none for SYS-4C2. MEDIUM: downstream consumer wiring is
still open by design. LOW: broader unit/path/program progress rollups and
application-level query profiling belong to the consumer phase.

## 54. SYS-4C2 Decision

**SYS-4C2 CANONICAL LEARNER OUTCOMES / MASTERY / PROGRESS FOUNDATION COMPLETE**

## 55. Next Phase

**SYS-4C3 — Learner Result → Portfolio / Skill Profile / Career Consumer Integration**

Do not begin it in this phase.
