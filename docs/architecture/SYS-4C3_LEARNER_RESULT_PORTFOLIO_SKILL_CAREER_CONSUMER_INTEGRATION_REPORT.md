# SYS-4C3 Learner Result -> Portfolio / Skill Profile / Career Consumer Integration Report

## 1. Executive Result
COMPLETE for the bounded learner-result consumer slice. Curriculum remains the authority for Outcome, Mastery, and Progress. Portfolio now consumes an eligible, scoped projection; Skill Profile is a derived Mastery view; Career continues to derive pathway from Enrollment -> Program and now exposes a read-only learner-result summary.

## 2. Repository Baseline
Path: `/Users/mikeslate/Projects/shrv1`. Branch: `studio-v1-plus-development`. HEAD: `0441aa4fe5f74d330a9f100f678d6353a6cac43b`. Final observed dirty count was 256 (102 tracked, 154 untracked), including pre-existing owner work. Migration filename head: `123_curriculum_learner_result_portfolio_projection.sql`; applied head: 123. Disposable PostgreSQL `shs_sys4c3_20260910` on port 55439 was accepting connections. API 8098 and frontend 5176 were healthy. Agent Fabric was not required for this synchronous Portfolio/Career consumer path.

## 3. Consumer Inventory
| Consumer | Current Authority | Current Input | Learner-Result Integration Status | Missing Seam |
|---|---|---|---|---|
| Portfolio | Portfolio service | Studio Evidence artifacts | COMPLETE for Curriculum projection | None in this slice |
| Skill Profile | Derived Curriculum Mastery view | `curriculum_learner_mastery` | COMPLETE as a projection, not a second authority | None |
| Career pathway | Career Pathway service | ACTIVE Enrollment -> Program -> Career | COMPLETE for read-only result augmentation | Future readiness policy remains out of scope |
| Progress | Curriculum learner-result service | canonical completions, Outcomes, Mastery | COMPLETE as API input to consumers | Broader institutional reporting is SYS-4C4 |

## 4. Canonical Authority Map
| Responsibility | Canonical Domain / Service | Persistence | Consumer |
|---|---|---|---|
| Outcome | Curriculum learner-result service | `curriculum_learner_outcomes` | Portfolio, Career, later reporting |
| Mastery | Curriculum policy projection | `curriculum_learner_mastery` | Skill Profile, Portfolio, Career |
| Progress | Curriculum derived read model | canonical completion/outcome/mastery tables | Student and Career consumers |
| Evidence | Evidence/Prepare-Prove | existing Evidence tables | Verification and Portfolio eligibility |
| Portfolio | Portfolio service | existing Studio tables plus migration 123 projection | Student Portfolio route |
| Career pathway | Career Pathway service | Enrollment, Program-Career links | Career pathway API |
| Truth and Metrics | existing Truth Spine and Metric Registry | existing authorities | later institutional reporting |

## 5. Portfolio Current-State Audit
Studio Portfolio remains backed by `portfolio_artifacts` and accepts only `STUDIO_EVIDENCE`. Its source validation and presentation-edit rules were preserved.

## 6. Portfolio Integration
Migration 123 adds `portfolio_learner_result_entries`, a Portfolio-owned consumer projection keyed to canonical Outcome and current Mastery references. `PortfolioService.projectLearnerResult` is internal and is invoked by `recordOutcome`.

## 7. Portfolio Eligibility
Only current PASSED/DEMONSTRATED Outcomes with policy-derived DEMONSTRATED/MASTERED Mastery are projected. FAILED, superseded, and non-demonstrated results create no active achievement.

## 8. Portfolio Verification Safety
The projection preserves `UNVERIFIED`, `EVIDENCE_PENDING`, `VERIFIED`, or `REVOKED` status and the UI labels it as a Curriculum result, not Verified Work. Portfolio does not manufacture Evidence, Truth, credentials, or public claims.

## 9. Portfolio Provenance
Entries retain Outcome, Mastery, source type/id, predecessor Outcome, Evidence references, competency, course/lesson/assignment context, scope, and timestamps. Evidence payloads are not copied.

## 10. Portfolio Idempotency
Unique `(organization_id, tenant_id, learner_id, outcome_id)` plus internal replay handling produces one entry per source Outcome. The live replay returned `idempotent=true`.

## 11. Portfolio Correction / Supersession
An improved/corrected current Outcome supersedes the prior active Portfolio projection. The predecessor remains stored with `SUPERSEDED` status and the successor links to it.

## 12. Studio Portfolio Non-Regression
Existing Studio Portfolio backend tests passed 4/4 and existing contract tests passed 9/9. Studio-only source validation remains unchanged.

## 13. Skill Profile Ownership
No separate Skill Profile authority exists. Skill Profile is the read projection of Curriculum Mastery returned with Portfolio data.

## 14. Skill Profile Integration
`GET /portfolio` returns `skillProfile` from scoped `curriculum_learner_mastery`, joined to competency titles. The projection is not learner-editable.

## 15. Skill Aggregation / Current State
One current Mastery row per learner/competency controls the current skill state; Outcome history remains underneath. Portfolio has one active entry per learner/competency.

## 16. Skill Improvement / Retry
Live PostgreSQL acceptance recorded FAILED then PASSED results. Mastery changed to DEMONSTRATED, the current skill source moved to the passing Outcome, and the prior Outcome remained historical.

## 17. Career Current-State Audit
Career pathway remains derived exclusively from ACTIVE Enrollment -> Program -> `program_careers`; no learner-selected Career row was added.

## 18. Career Augmentation
`GET /careers/pathway/me` now includes read-only `learnerResultSummary.mastery` and `.progress`. Existing `careerIds` and `careerFamilyIds` behavior is unchanged.

## 19. Career Skill Mapping
The current repository has no canonical competency-to-career mapping table. No unsupported mapping was invented. The summary provides scoped mastery context for a future Career policy consumer.

## 20. Career Consumer
The active Career API is the canonical current consumer. It returned the learner's scoped mastery and progress summary while preserving the Enrollment-derived pathway.

## 21. Career Readiness Safety
The response is explicitly a learner-result summary, not a job-readiness decision. A passed lesson cannot issue a readiness claim.

## 22. Career Correction / Revocation
Career reads current Curriculum Mastery on each request, so corrected/retracted source Outcomes are not retained as stale Career state. Durable readiness policy is deferred.

## 23. Progress Consumer
Canonical Progress remains derived by Curriculum and is included in the Career augmentation. Portfolio does not calculate or store progress.

## 24. Student Dashboard
The active student Portfolio route consumes `/portfolio` and displays Curriculum Results and Skill Profile sections when scoped data exists. The route does not expose protected identifiers beyond the learner's own response.

## 25. Continuous Happy Path
Fresh PostgreSQL chain: `sys4c3-student` -> PASSED assessment result -> current Outcome -> DEMONSTRATED Mastery -> derived Progress -> Portfolio learner-result entry -> Skill Profile -> Career learner-result summary -> active Portfolio browser consumer. All returned records carried `sys4c3-org` scope.

## 26. Failed Path
FAILED result was persisted as academic history with NOT_DEMONSTRATED Mastery and no active Portfolio entry. It cannot produce a verified achievement or Career readiness claim.

## 27. Retry / Improvement Path
The passing retry superseded the failed current Outcome, updated Mastery, created one active Portfolio projection, and left the failed Outcome auditable.

## 28. Missing Evidence Path
Current Curriculum Mastery without Evidence remains `UNVERIFIED`; Portfolio displays the verification status separately and does not label it verified. Truth and institutional reporting remain downstream authorities.

## 29. Correction / Supersession Path
The live correction created a new current Outcome and active Portfolio entry. The prior Portfolio entry became `SUPERSEDED`, with `supersedesEntryId` and Outcome predecessor provenance retained.

## 30. Student Isolation
All Portfolio and learner-result reads use learner, organization, and tenant predicates. The internal projection rejects mismatched Outcome scope and mismatched Mastery scope.

## 31. Wrong Org
Portfolio and Career queries are scoped to the actor's organization and tenant. No cross-organization data is selected.

## 32. Revoked Membership
Existing API auth middleware and permission guards remain the protection boundary. The consumer routes do not add a bypass or client-supplied learner selector.

## 33. Write Authority
There is no public Outcome, Mastery, or Portfolio learner-result write route. Projection is internal to the canonical Outcome process; students cannot forge mastery, achievements, or readiness.

## 34. Events / Consumers
Existing Integration Outbox is reused. Curriculum emits `learner.outcome.recorded`; Portfolio emits `portfolio.learner_result.projected`. No second event bus was created.

## 35. Failure / Recovery
The projection is transactional and idempotent. A failed projection cannot create a partial Portfolio row; replay resolves the unique source row. Asynchronous retry is not required for this synchronous consumer seam.

## 36. PostgreSQL Acceptance
Fresh `shs_sys4c3_20260910` applied migrations 001-123 with no pending, drift, or unknown migrations and passed schema integrity. Live records proved failure, retry, current resolution, Portfolio projection, supersession, and provenance.

## 37. API Acceptance
Authenticated development identity `sys4c3-student` successfully read `/portfolio`, `/curriculum/learner-results/me`, and `/careers/pathway/me`. Responses were scoped and contained the same current Outcome/Mastery values.

## 38. Active Frontend Route Map
`/career.html#/portfolio` is mounted by `src/entries/career.main.jsx` and `src/router/CareerRoutes.jsx`. It is API-backed and active. No separate Skill Profile route exists; the Portfolio route is the canonical current student consumer.

## 39. Student Browser Acceptance
Headless browser acceptance loaded the active route, rendered `Portfolio`, `Learning Results`, and `Skill Profile`, and observed requests to the real API at 8098. The response was not static or mock content.

## 40. Instructor Consumer
No current instructor learner-result consumer is part of this bounded phase; deferred to broader institutional consumer work.

## 41. Admin Consumer Boundary
Admin/funder verified reporting is not marked complete here. Metric Registry, Truth, and Reporting remain the authorities for SYS-4C4.

## 42. Accessibility
The existing Portfolio surface and semantic headings/articles were preserved. No accessibility architecture was changed; root UI validation passed.

## 43. Performance
Projection reads use scoped indexed predicates and a bounded active-entry query. Skill Profile uses one scoped mastery query with a competency join. No cohort-wide scan or query-per-skill loop was introduced.

## 44. Regression
Typecheck, API build, root build, manifest validation, UI validation, Portfolio backend/contract tests, learner-result tests, and live API/browser checks passed. Existing Career pathway behavior was preserved by additive response fields.

## 45. Migration
Added migration 123 only. Migration 122 was not modified. The new table has scoped uniqueness, active competency uniqueness, provenance, source FKs, and scope/status indexes.

## 46. Files Created
`apps/shs-api/migrations/123_curriculum_learner_result_portfolio_projection.sql`; this report.

## 47. Files Modified
`apps/shs-api/src/domain/portfolio/service/portfolio-service.ts`; `apps/shs-api/src/domain/curriculum/service/learner-result-service.ts`; `apps/shs-api/src/domain/careers/api/routes.ts`; `src/pages/career/Portfolio.jsx`; systemwide registry, dependency graph, and completion roadmap.

## 48. Owner Work Preservation
No reset, stash, clean, rebase, commit, push, unrelated deletion, migration rewrite, or unknown database mutation was performed. Pre-existing dirty and untracked owner work remains present.

## 49. Workflow Completion Matrix
| Workflow | Trigger | Final Consumer | Success Terminal | Failure Terminal | Live Proven |
|---|---|---|---|---|---|
| Learner result -> Portfolio | current demonstrated Outcome | active Portfolio route/API | ACTIVE projection | no entry / prior SUPERSEDED | PASS |
| Learner result -> Skill Profile | current Mastery | Portfolio Skill Profile view | current competency state | NOT_DEMONSTRATED/UNVERIFIED | PASS |
| Learner result -> Career context | authenticated pathway read | `/careers/pathway/me` | scoped summary | empty/denied | PASS |

## 50. Remaining SYS-4C Work
SYS-4C4 remains: credential policy/issuance integration and Metric Registry -> verified institutional reporting consumer integration. Broader instructor/admin consumers, public reporting, and durable career readiness policy remain there or later roadmap phases.

## 51. Remaining Risks
CRITICAL: none. HIGH: none for SYS-4C3. MEDIUM: credential/reporting consumers are intentionally not complete. LOW: no canonical competency-to-career mapping currently exists, so Career exposes scoped mastery context rather than a readiness ranking.

## 52. SYS-4C3 Decision
**SYS-4C3 LEARNER RESULT -> PORTFOLIO / SKILL PROFILE / CAREER CONSUMER INTEGRATION COMPLETE**

## 53. Next Phase
**SYS-4C4 — Credential Policy / Issuance + Metric Registry / Verified Institutional Reporting Consumer Integration**. Do not begin it in this phase.
